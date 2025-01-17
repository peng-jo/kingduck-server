import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
// 데이터 베이스 값 참조
import sequelize from '../../models';
import { QueryTypes, where, Op } from 'sequelize';

// 데이터베이스 참조
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { Item } from '../../models/Item/ItemDef.Vo';
import { SkillImage } from '../../models/skill/SkillImage.Vo';
import { Skill } from '../../models/skill/SkillDef.Vo';

// TEST JSON 처리 구문
import hakushCharacter from './test/c1.json';
import starrailstationCharacter from './test/c2.json';
import prydwenCharacter from './test/c3.json';
import starrailstationCharacterInfo from './test/citem.json';
import hakushCharacterInfo from './test/citem2.json';
import tmpitem from './test/itemt.json';

// 유물 아이템 처리를 위한 구문
// 해당 부분은 지속적인 업데이트가 필요함
import relicsList from './test/RelicsItem.json';
import Planetary from './test/Planetary.json';

// 공백(160)을 일반 공백(32)으로 변환하는 함수
function normalizeWhitespace(str: string) {
  const nonBreakingSpace = '\u00A0'; // 유니코드 160
  const regularSpace = ' '; // 유니코드 32
  return str.split(nonBreakingSpace).join(regularSpace);
}

// 이미지 다운로드 함수
async function downloadImage(
  imageUrl: string,
  saveDirectory: string,
  fileName: string,
) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const filePath = path.join(saveDirectory, fileName);

    // 디렉토리가 존재하지 않으면 생성
    if (!fs.existsSync(saveDirectory)) {
      fs.mkdirSync(saveDirectory, { recursive: true });
    }

    // 이미지 저장
    response.data
      .pipe(fs.createWriteStream(filePath))
      .on('finish', () => {
        console.log(`Image saved successfully: ${filePath}`);
      })
      .on('error', (error) => {
        console.error(`Error saving image: ${error.message}`);
      });
  } catch (error) {
    console.error(`Error downloading image: ${error.message}`);
  }
}

export class CharacterTestController {
  // 아이템 넣기 - json 데이터 형태
  // 붕괴 스타레일 유효
  async CharacterSet(req: any, res: any): Promise<void> {
    // json형태로 있는경우  <- 정상 작동됨
    async function fetchData(url: string) {
      try {
        const response = await axios.get(url);
        const data = response.data;
        return data;
        // 원하는 데이터 처리 로직 추가
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    }
    // 브라우저 내장의 경우  <- 정상 작동됨
    async function fetchPageConfig(url: string) {
      // 브라우저 실행
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      // URL로 이동
      await page.goto(url);
      // window.PAGE_CONFIG 값 추출
      const pageConfig = await page.evaluate(() => {
        return window.PAGE_CONFIG;
      });
      // 브라우저 종료
      await browser.close();
      return pageConfig;
    }

    const extractAddValues = (data: any) => {
      const result = {};

      for (const key in data) {
        const subObj = data[key];

        for (const subKey in subObj) {
          if (subKey.includes('Add')) {
            const roundedValue = Math.floor(subObj[subKey] * 1000) / 1000; // 소수점 세 자리 이하를 버림
            result[subKey] = roundedValue;
          }
        }
      }

      return result;
    };

    // 데이터 가져오기 함수 호출
    // hakush 캐릭터 데이터 - 메인 <- 정상 작동됨 - c1.json
    /*const hakushCharacter = await fetchData(
      'https://api.hakush.in/hsr/data/character.json',
    );*/
    // prydwen 캐릭터 데이터 - 서브 - c3.json
    /*
    const prydwenCharacter = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2408139295.json',
    );
    */
    // starrailstation 캐릭터 데이터 - 서브 - c2.josn // 일부 옵셋 변경 필요
    /*const starrailstationCharacter = await fetchPageConfig(
      'https://starrailstation.com/kr/characters',
    ).catch(console.error);*/

    //
    const TypeList = await TypeDef.findAll({
      where: {
        gameId: 1,
      },
      raw: true,
    });

    let setCharacterList = [];
    let setCharacterInfoList = [];
    let setCharacterImageList = [];
    let setCharacterSkill = [];

    // 재처리 - 키형태로 처리
    for (var key in hakushCharacter.items) {
      const hakushItem: any = hakushCharacter.items[key];
      const searchCharacter: any = await Character.findOne({
        where: {
          'name.kr': hakushItem.kr,
        },
        raw: true,
      });

      if (searchCharacter?.id) {
        continue;
      } else {
        console.log('name:' + hakushItem.kr);

        // 다른 사이트 비교 검색처리
        const starrailstationItem: any = starrailstationCharacter.find(
          (fitem) => fitem.pageId === hakushItem.icon,
        );
        const prydwenItem: any = prydwenCharacter.find(
          (fitem) => fitem.name === hakushItem.en,
        );
        const damageTypeItem: any = TypeList.find(
          (fitem: any) =>
            fitem.name.ko === starrailstationItem?.damageType.name,
        );
        const baseTypeItem: any = TypeList.find(
          (fitem: any) => fitem.name.ko === starrailstationItem?.baseType.name,
        );

        if (!starrailstationItem?.pageId) {
          continue;
        }

        // 캐릭터 개별 정보 습득

        const starrailstationCharacterInfo = await fetchPageConfig(
          'https://starrailstation.com/kr/character/' +
            starrailstationItem.pageId,
        ).catch(console.error);
        const hakushCharacterInfo = await fetchData(
          'https://api.hakush.in/hsr/data/kr/character/' + key + '.json',
        );

        // 캐릭터 기본 정보 - CharacterDef.Vo.ts 참조
        let setCharacterBase: any = {
          gameId: 1, // 게임 고유번호
          pageId: hakushItem.icon, // 영어 띄어쓰기 전부 제거 & 소문자치환
          isNew: 0, // 신규 출시 여부
          isReleased: 1, // 출시 여부
          name: {
            // JOSNB로 변경 필요
            en: hakushItem.en, // 필수
            kr: hakushItem.kr, // 필수
            jp: hakushItem.jp,
            cn: hakushItem.cn,
          },
          element: damageTypeItem?.id, // 고유번호 필요 - path_type
          path: baseTypeItem?.id, // 고유번호 필요 - path_type
          rarity: starrailstationItem?.rarity, // 등급
          voiceActors: {
            en: starrailstationCharacterInfo.archive.cvEn,
            kr: starrailstationCharacterInfo.archive.cvKr,
            jp: starrailstationCharacterInfo.archive.cvJp,
            cn: starrailstationCharacterInfo.archive.cvCn,
          },
        };

        // 일부 사항에 대한 값이 틀려서 따로 처리 해야됩니다.
        if (hakushItem.kr === '{NICKNAME}') {
          setCharacterBase.name.kr = '개척자';
        }
        // 일부 사항에 대한 값이 틀려서 따로 처리 해야됩니다.
        if (!prydwenItem?.isNew || prydwenItem?.isNew == null) {
          setCharacterBase.isNew = 0;
        } else {
          setCharacterBase.isNew = 1;
        }

        // 일부 사항에 대한 값이 틀려서 따로 처리 해야됩니다.
        if (!prydwenItem?.isReleased || prydwenItem?.isReleased == null) {
          setCharacterBase.isNew = 0;
        } else {
          setCharacterBase.isNew = 1;
        }

        // 캐릭터 세부정보 처리 표현
        const statsAddVal = extractAddValues(hakushCharacterInfo.Stats);
        let statsBaseVal = [];
        let stataPromotion = 0;

        // 레벨업 스테이터스에 대한 처리
        for (const item of Object.values(hakushCharacterInfo.Stats)) {
          let costList = [];

          // 레벨업 코스트에 대한 처리
          for (const costitem of Object.values(item?.Cost)) {
            const itemSearchData = await Item.findAll({
              attributes: ['id'],
              where: {
                'itemReferences.image.src':
                  'SpriteOutput/ItemFigures/' + costitem.ItemID + '.png',
                itemtype: {
                  [Op.notLike]: '%Mission', // NOT LIKE
                },
              },
              raw: true,
            });
            let setCost = {
              itemID: itemSearchData[0].id,
              itemNum: costitem.ItemNum,
            };
            costList.push(setCost);
          }

          let setStats = {
            attackBase: item.AttackBase,
            defenseBase: item.DefenceBase,
            HPBase: item.HPBase,
            speedBase: item.SpeedBase,
            criticalChance: item.CriticalChance,
            criticalDamage: item.CriticalDamage,
            baseAggro: item.BaseAggro,
            maxLevel: 0,
            promotion: stataPromotion,
            cost: costList,
          };
          stataPromotion++;
          statsBaseVal.push(setStats);
        }

        // 장신구에 대한 표현 처리
        // Set4IDList = relicsList  - 터널 유물
        // Set2IDList = accessories - 차원 유물
        let setRelicsList = [];
        let setAccessories = [];
        for (const RelicsItem of Object.values(
          hakushCharacterInfo.Relics.Set4IDList,
        )) {
          const relicsItem: any = relicsList[RelicsItem];
          const itemSearchData = await Item.findAll({
            attributes: ['id'],
            where: {
              'name.kr': relicsItem.kr,
            },
            raw: true,
          });
          setRelicsList.push(itemSearchData[0].id);
        }
        for (const RelicsItem of Object.values(
          hakushCharacterInfo.Relics.Set2IDList,
        )) {
          const relicsItem: any = Planetary[RelicsItem];
          const itemSearchData = await Item.findAll({
            attributes: ['id'],
            where: {
              'name.kr': relicsItem.kr,
            },
            raw: true,
          });
          setAccessories.push(itemSearchData[0].id);
        }

        // 캐릭터 이미지 디렉토리 설정
        const saveDirectory = path.join(
          __dirname,
          '../../../static/image/character/',
        );
        // 캐릭터 카드 이미지 삽입
        const cardImageVal = starrailstationItem?.iconPath;
        const cardImageUrl =
          'https://cdn.starrailstation.com/assets/' + cardImageVal + '.webp';
        const cardfileName = cardImageVal + '.webp';
        await downloadImage(cardImageUrl, saveDirectory, cardfileName);
        // 캐릭터 메인 이미지 삽입
        const artImageVal = starrailstationCharacterInfo?.artPath;
        const artImageUrl =
          'https://cdn.starrailstation.com/assets/' + artImageVal + '.webp';
        const artFileName = artImageVal + '.webp';
        await downloadImage(artImageUrl, saveDirectory, artFileName);

        // 캐릭터 정보 ORM
        //let createCharacterBase = { id: 1 };
        const createCharacterBase = await Character.create(setCharacterBase);
        if (createCharacterBase.id) {
          // 캐릭터 세부 정보 - CharacterInfo.Vo.ts 참조
          let setCharacterInfoBase = {
            characterId: createCharacterBase.id, // 캐릭터 고유번호 - 캐릭터 먼저 처리된 후 넣을것
            lang: 'kr', // 기본 언어셋
            stats: {
              // 기본 정보 - 체력, MP와 같은 정보 표기 - starrailstation 정보로 표기
              addSet: statsAddVal,
              base: statsBaseVal,
            },
            ranks: hakushCharacterInfo.Ranks,
            itemData: {
              card: [], // id - item
              relics: setRelicsList, // id - item
              accessories: setAccessories, // id - item
            },
            relicsBase: hakushCharacterInfo.Relics,
          };

          // 캐릭터 세부정보 ORM
          const createCharacterInfo =
            await CharacterInfo.create(setCharacterInfoBase);

          // 이미지 정보 처리
          let setCharacterCardImage = {
            characterId: createCharacterBase.id,
            backgroundColor: '#ffffff',
            layout: 'card', // 이미지 옵셋 - card:리스트 / art: 페이지별 이미지
            url: 'assets/image/character/' + cardImageVal,
          };
          // 캐릭터 이미지 저장 - 카드형
          const createCharacterCardImage = await CharacterImage.create(
            setCharacterCardImage,
          );

          // 이미지 정보 처리
          let setCharacterArtImage = {
            characterId: createCharacterBase.id,
            backgroundColor: '#ffffff',
            layout: 'art', // 이미지 옵셋 - card:리스트 / art: 페이지별 이미지
            url: 'assets/image/character/' + artImageVal,
          };
          // 캐릭터 이미지 저장 - 카드형
          const createCharacterArtImage =
            await CharacterImage.create(setCharacterArtImage);
          // 스킬에 대한 처리

          let SkillsList = [];

          for (const item of Object.values(
            starrailstationCharacterInfo.skills,
          )) {
            let levelDataList = [];

            for (const levelitem of Object.values(item.levelData)) {
              let costList = [];

              // 레벨업 코스트에 대한 처리
              if (levelitem.cost.length !== 0) {
                for (const skillcostitem of Object.values(levelitem?.cost)) {
                  const searchItem: any = tmpitem.find(
                    (fitem) => fitem.pageId == skillcostitem.id,
                  );
                  const str1 = searchItem.name;

                  // 문자열 공백 변환
                  const normalizedStr1 = normalizeWhitespace(str1);

                  const skillitemSearchData = await Item.findAll({
                    where: {
                      'name.kr': normalizedStr1,
                    },
                    raw: true,
                  });

                  if (skillitemSearchData) {
                    let setCost = {
                      itemID: skillitemSearchData[0].id,
                      itemNum: skillcostitem.count,
                    };
                    costList.push(setCost);
                  }
                }
              }
              levelitem.cost = costList;
              levelDataList.push(levelitem);
            }

            let setSkillBase = {
              gameId: 1,
              characterId: createCharacterBase.id,
              name: {
                kr: item.name,
              },
              tag: item.tagHash,
              info: item.descHash,
              type: item.typeDescHash,
              levelReq: item.levelReq,
              promotionReq: item.promotionReq,
              stats: {
                break: item.break,
                energy: item.energy,
              },
              levelData: item.levelData,
            };
            const createSkill = await Skill.create(setSkillBase);

            // 캐릭터 메인 이미지 삽입
            const saveSkillDirectory = path.join(
              __dirname,
              '../../../static/image/skill/',
            );
            const skillImageVal = item?.iconPath;
            const skillImageUrl =
              'https://cdn.starrailstation.com/assets/' +
              skillImageVal +
              '.webp';
            const skillFileName = skillImageVal + '.webp';
            await downloadImage(
              skillImageUrl,
              saveSkillDirectory,
              skillFileName,
            );

            if (createSkill.id) {
              // 이미지 정보 처리
              let setSkillImage = {
                skillId: createSkill.id,
                backgroundColor: '#ffffff',
                layout: '', // 이미지 옵셋 - card:리스트 / art: 페이지별 이미지
                url: 'assets/image/character/' + skillImageVal,
              };
              const createSkillArtImage =
                await SkillImage.create(setSkillImage);
            }

            SkillsList.push(setSkillBase);
          }

          // 해당 행을 보기 위한 용

          console.log('캐릭터 생성 완료 - ' + createCharacterBase.id);
          setCharacterSkill.push(SkillsList);
          setCharacterList.push(setCharacterBase);
          setCharacterInfoList.push(setCharacterInfoBase);
          setCharacterImageList.push(setCharacterArtImage);
          setCharacterImageList.push(setCharacterCardImage);
        }
      }
    }

    //

    //console.log(CharacterListData);
    res.status(200).json({
      skill: setCharacterSkill,
      cinfolist: setCharacterInfoList,
      clist: setCharacterList,
      cimage: setCharacterImageList,
    });
  }
}

export default new CharacterTestController();
