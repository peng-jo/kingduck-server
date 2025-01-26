// 필수 모듈 임포트
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// 데이터베이스 모델 임포트
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { Item } from '../../models/Item/ItemDef.Vo';
import { SkillImage } from '../../models/skill/SkillImage.Vo';
import { Skill } from '../../models/skill/SkillDef.Vo';

// 유틸리티 함수 임포트
import {
  normalizeWhitespace,
  replaceHyphensAndCapitalize,
} from '../../utils/stringUtils';
import { formatDateString } from '../../utils/dateUtils';
import { downloadImage } from '../../utils/imageUtils';
import { fetchData, fetchPageConfig } from '../../utils/apiUtils';
import { fetchAndDownloadVideo } from '../../utils/youtubeUtils';

// 테스트 데이터 임포트
import sequelize from '../../models';

/**
 * 캐릭터 스탯 증가값을 추출하는 함수
 * @param data 캐릭터 스탯 데이터
 * @returns 증가값이 포함된 객체
 */
const extractAddValues = (data: any) => {
  const result = {};

  for (const key in data) {
    const subObj = data[key];
    for (const subKey in subObj) {
      if (subKey.includes('Add')) {
        const roundedValue = Math.floor(subObj[subKey] * 1000) / 1000;
        result[subKey] = roundedValue;
      }
    }
  }

  return result;
};
/**
 * 데이터를 파일로 저장하는 함수
 * @param hakushData hakush API 데이터
 * @param starrailstationData starrailstation API 데이터
 */
const saveDataToFile = (
  hakushData: any,
  starrailstationData: any,
  prydwenData: any,
  hakushFilename: string,
  starrailFilename: string,
  prydwenFilename: string,
): void => {
  // 오늘 날짜 구하기
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  // 디렉토리 생성
  const saveDirectory = path.join(__dirname, './setJosn');
  if (!fs.existsSync(saveDirectory)) {
    fs.mkdirSync(saveDirectory, { recursive: true });
  }

  // 파일 저장
  fs.writeFileSync(
    path.join(saveDirectory, `${hakushFilename}_${dateString}.json`),
    JSON.stringify(hakushData, null, 2),
  );
  fs.writeFileSync(
    path.join(saveDirectory, `${starrailFilename}_${dateString}.json`),
    JSON.stringify(starrailstationData, null, 2),
  );
  fs.writeFileSync(
    path.join(saveDirectory, `${prydwenFilename}_${dateString}.json`),
    JSON.stringify(prydwenData, null, 2),
  );
};

export class HonkaiStarRailCharacterCreate {
  async CharacterSet(): Promise<any> {
    console.log('----------------------------------');
    console.log('캐릭터 삽입 - 붕괴 스타레일');
    console.log('----------------------------------');

    // 외부 API에서 캐릭터 데이터 가져오기
    const hakushCharacter = await fetchData(
      'https://api.hakush.in/hsr/data/character.json',
    );
    const prydwenData = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2408139295.json',
    );
    const starrailstationData = await fetchPageConfig(
      'https://starrailstation.com/kr/characters',
    );
    const tmpitemArray = await fetchPageConfig(
      'https://starrailstation.com/kr/materials',
    );

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(
        hakushCharacter,
        starrailstationData,
        prydwenData,
        'hakushCharacter',
        'starrailstationCharacter',
        'prydwenCharacter',
      );
      console.log('데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    const starrailstationCharacter = starrailstationData.entries;
    const prydwenCharacter = prydwenData.data.allContentfulHsrCharacter.nodes;
    const tmpitem = tmpitemArray.entries;

    // 데이터 수량 로깅
    console.log('hakushCharacter:', Object.keys(hakushCharacter).length);
    console.log(
      'starrailstationCharacter:',
      Object.keys(starrailstationCharacter).length,
    );
    console.log('prydwenCharacter:', Object.keys(prydwenCharacter).length);
    console.log('----------------------------------');

    // 게임 내 타입 데이터 조회
    const TypeList = await TypeDef.findAll({
      where: { gameId: 1 },
      raw: true,
    });

    // 캐릭터 데이터 처리
    for (const key in hakushCharacter) {
      const hakushItem: any = hakushCharacter[key];
      let ChkName = hakushItem.kr === '{NICKNAME}' ? '개척자' : hakushItem.kr;
      let ChkEnName = '';

      console.log('name:', hakushItem.kr);

      // starrailstation 데이터 매칭
      const starrailstationItem: any = starrailstationCharacter.find(
        (fitem) => fitem.pageId === hakushItem.icon,
      );

      if (!starrailstationItem?.pageId) {
        console.log('starrailstation사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      // 캐릭터 타입 정보 매칭
      const damageTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.damageType.name,
      );
      const baseTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.baseType.name,
      );

      // 개척자 캐릭터 영문명 특수 처리
      ChkEnName = hakushItem.en;
      if (damageTypeItem.id && hakushItem.kr === '{NICKNAME}') {
        switch (damageTypeItem.id) {
          case 3:
            ChkEnName = 'Trailblazer • Remembrance';
            break;
          case 6:
            ChkEnName = 'Trailblazer • Destruction';
            break;
          case 5:
            ChkEnName = 'Trailblazer • Harmony';
            break;
          case 10:
            ChkEnName = 'Trailblazer • Preservation';
            break;
          default:
            ChkEnName = hakushItem.en;
            break;
        }
      }
      if (ChkEnName == 'Fugue') {
        ChkEnName = 'Tingyun • Fugue';
      }

      console.log('ENname:', ChkEnName);

      // prydwen 데이터 매칭
      const prydwenItem: any = prydwenCharacter.find(
        (fitem) => fitem.name === ChkEnName,
      );

      if (!prydwenItem?.slug) {
        console.log('prydwen사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      // 캐릭터 중복 체크
      const searchCharacter: any = await Character.findOne({
        where: {
          'name.kr': ChkName,
          'type.element': String(damageTypeItem?.id),
          'type.path': String(baseTypeItem?.id),
        },
        raw: true,
      });

      if (searchCharacter?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
        continue;
      }

      // 추가 캐릭터 정보 가져오기
      const starrailstationCharacterInfo = await fetchPageConfig(
        'https://starrailstation.com/kr/character/' +
          starrailstationItem.pageId,
      );
      const hakushCharacterInfo = await fetchData(
        'https://api.hakush.in/hsr/data/kr/character/' + key + '.json',
      );
      const prydwenhCharacterpageData = await fetchData(
        'https://www.prydwen.gg/page-data/star-rail/characters/' +
          prydwenItem.slug +
          '/page-data.json',
      );
      const prydwenhCharacterInfo =
        prydwenhCharacterpageData.result.data.currentUnit.nodes[0];

      // 캐릭터 기본 정보 설정
      let setCharacterBase: any = {
        gameId: 1,
        pageId: hakushItem.icon,
        isNew: 0,
        isReleased: 1,
        name: {
          en: hakushItem.en,
          kr: hakushItem.kr,
          jp: hakushItem.jp,
          cn: hakushItem.cn,
        },
        type: {
          element: damageTypeItem?.id,
          path: baseTypeItem?.id,
        },
        rarity: starrailstationItem?.rarity,
        voiceActors: {
          en: starrailstationCharacterInfo.archive.cvEn,
          kr: starrailstationCharacterInfo.archive.cvKr,
          jp: starrailstationCharacterInfo.archive.cvJp,
          cn: starrailstationCharacterInfo.archive.cvCn,
        },
      };

      // 개척자 이름 특수 처리
      if (hakushItem.kr === '{NICKNAME}') {
        setCharacterBase.name.kr = ChkName;
        setCharacterBase.name.en = ChkEnName;
      }

      // 신규/출시 상태 설정
      setCharacterBase.isNew = prydwenhCharacterInfo?.isNew ? 1 : 0;
      setCharacterBase.isReleased = prydwenhCharacterInfo?.isReleased ? 1 : 0;

      // 출시일 설정
      if (prydwenhCharacterInfo?.releaseDate) {
        console.log(prydwenhCharacterInfo?.releaseDate);

        setCharacterBase.releaseDate = formatDateString(
          prydwenhCharacterInfo.releaseDate,
        );
      }

      // 최종 중복 체크
      const search2Character: any = await Character.findOne({
        where: {
          'name.kr': setCharacterBase.name.kr,
          'type.element': String(damageTypeItem?.id),
          'type.path': String(baseTypeItem?.id),
        },
        raw: true,
      });

      if (search2Character?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
        continue;
      }

      // 캐릭터 스탯 정보 처리
      const statsAddVal = extractAddValues(hakushCharacterInfo.Stats);
      let statsBaseVal = [];
      let stataPromotion = 0;

      // 레벨업 스탯 처리
      for (const item of Object.values(hakushCharacterInfo.Stats)) {
        let costList = [];

        // 비용 아이템 처리
        for (const costitem of Object.values(item?.Cost)) {
          const itemSearchData = await Item.findAll({
            attributes: ['id'],
            where: {
              'itemReferences.baseKey': costitem.ItemID,
              itemtype: {
                [Op.notLike]: '%Mission',
              },
            },
            raw: true,
          });

          costList.push({
            itemID: itemSearchData[0].id,
            itemNum: costitem.ItemNum,
          });
        }

        // 기본 스탯 설정
        statsBaseVal.push({
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
        });

        stataPromotion++;
      }

      // 장비 아이템 리스트 초기화
      let setRelicsList = [];
      let setAccessories = [];
      let setCard = [];
      let setGacha = [];
      let setMainPropertyList = [];
      let setSubPropertyList = [];

      // 터널 유물 처리
      for (const item of Object.values(hakushCharacterInfo.Relics.Set4IDList)) {
        const itemSearchData = await Item.findAll({
          attributes: ['id'],
          where: {
            'itemReferences.baseKey': String(item),
            itemtype: { [Op.notLike]: 'Material' },
          },
          raw: true,
        });
        setRelicsList.push(itemSearchData[0].id);
      }

      // 차원 유물 처리
      for (const item of Object.values(hakushCharacterInfo.Relics.Set2IDList)) {
        const itemSearchData = await Item.findAll({
          attributes: ['id'],
          where: {
            'itemReferences.baseKey': String(item),
          },
          raw: true,
        });
        setAccessories.push(itemSearchData[0].id);
      }

      // 광추 카드 처리
      if (prydwenhCharacterInfo.conesNew) {
        for (const item of Object.values(prydwenhCharacterInfo.conesNew)) {
          const normalizedSearchTerm = replaceHyphensAndCapitalize(
            item.cone,
          ).toLowerCase();

          const itemFound = await sequelize.query(
            `SELECT * FROM "item" AS "Item" WHERE ("Item"."deletedAt" IS NULL) AND (lower("Item"."name"->>'en') LIKE '%${normalizedSearchTerm}%')`,
          );

          if (itemFound[0][0]?.id) {
            setCard.push(itemFound[0][0].id);
          }
        }
      }

      // 주 속성 처리
      if (hakushCharacterInfo.Relics.PropertyList) {
        for (const item of Object.values(
          hakushCharacterInfo.Relics.PropertyList,
        )) {
          let setOpt = {
            relicType: item.RelicType,
            property: item.PropertyType,
          };
          setMainPropertyList.push(setOpt);
        }
      }

      // 부 속성 처리
      if (hakushCharacterInfo.Relics.SubAffixPropertyList) {
        for (const item of Object.values(
          hakushCharacterInfo.Relics.SubAffixPropertyList,
        )) {
          setSubPropertyList.push(item);
        }
      }

      // 가챠 처리
      if (starrailstationCharacterInfo.ranks) {
        for (const item of Object.values(starrailstationCharacterInfo.ranks)) {
          if (!item) {
            continue;
          }
          // 이미지 저장 경로 설정
          const saveDirectory = path.join(
            __dirname,
            '../../../static/image/HonkaiStarRail/ranks/',
          );
          // 카드 이미지 다운로드
          const imageVal = item?.artPath;
          const imageUrl =
            'https://cdn.starrailstation.com/assets/' + imageVal + '.webp';
          await downloadImage(imageUrl, saveDirectory, imageVal + '.webp');
          const imageDir =
            'assets/image/HonkaiStarRail/ranks/' + imageVal + '.webp';
          // 키 정보 객체 생성
          const SetInfo = {
            id: item.id,
            title: item.name,
            image: imageDir,
            description: item.descHash,
            params: item.params,
          };
          setGacha.push(SetInfo);
        }
      } else if (hakushCharacterInfo.Ranks) {
        for (const item of Object.values(hakushCharacterInfo.Ranks)) {
          if (!item) {
            console.log('공백으로 건너뜀');
            continue;
          }
          // 이미지 파일명 생성
          const imageName = uuidv4().replace(/-/g, '');
          let itemId = item?.Id;
          const processedItemId = String(itemId).replace(/"/g, '');
          let imageUrlPath = processedItemId.replace(key, '').substring(1);
          const imageUrl = `https://api.hakush.in/hsr/UI/rank/_dependencies/textures/${key}/${key}_Rank_${imageUrlPath}.webp`;
          // 이미지 저장 경로 설정
          const saveDirectory = path.join(
            __dirname,
            '../../../static/image/HonkaiStarRail/ranks/',
          );
          // 카드 이미지 다운로드
          await downloadImage(imageUrl, saveDirectory, imageName + '.webp');
          const imageDir =
            'assets/image/HonkaiStarRail/ranks/' + imageName + '.webp';
          // 키 정보 객체 생성
          const SetInfo = {
            id: item.Id,
            title: item.Name,
            image: imageDir,
            description: item.Desc,
            params: item.ParamList,
          };
          setGacha.push(SetInfo);
        }
      }

      // 이미지 저장 경로 설정
      const saveDirectory = path.join(
        __dirname,
        '../../../static/image/HonkaiStarRail/character/',
      );

      // 카드 이미지 다운로드
      const cardImageVal = starrailstationItem?.iconPath;
      const cardImageUrl =
        'https://cdn.starrailstation.com/assets/' + cardImageVal + '.webp';
      await downloadImage(cardImageUrl, saveDirectory, cardImageVal + '.webp');

      // 메인 이미지 다운로드
      const artImageVal = starrailstationCharacterInfo?.artPath;
      const artImageUrl =
        'https://cdn.starrailstation.com/assets/' + artImageVal + '.webp';
      await downloadImage(artImageUrl, saveDirectory, artImageVal + '.webp');

      // 캐릭터 기본 정보 생성
      const createCharacterBase = await Character.create(setCharacterBase);

      if (createCharacterBase.id) {
        // 캐릭터 상세 정보 생성
        const setCharacterInfoBase = {
          characterId: createCharacterBase.id,
          lang: 'kr',
          stats: {
            addSet: statsAddVal,
            base: statsBaseVal,
          },
          ranks: setGacha,
          itemData: {
            card: setCard,
            relics: setRelicsList,
            accessories: setAccessories,
          },
          propertyBase: {
            main: setMainPropertyList,
            sub: setSubPropertyList,
          },
        };

        await CharacterInfo.create(setCharacterInfoBase);

        // 캐릭터 이미지 정보 생성
        await CharacterImage.create({
          characterId: createCharacterBase.id,
          backgroundColor: '#ffffff',
          layout: 'card',
          url: 'assets/image/HonkaiStarRail/character/' + cardImageVal,
        });

        await CharacterImage.create({
          characterId: createCharacterBase.id,
          backgroundColor: '#ffffff',
          layout: 'art',
          url: 'assets/image/HonkaiStarRail/character/' + artImageVal,
        });

        // 스킬 정보 처리
        let SkillsList = [];

        for (const item of Object.values(starrailstationCharacterInfo.skills)) {
          let levelDataList = [];

          // 스킬 레벨 데이터 처리
          for (const levelitem of Object.values(item.levelData)) {
            let costList = [];

            // 스킬 비용 처리
            if (levelitem.cost.length !== 0) {
              for (const skillcostitem of Object.values(levelitem?.cost)) {
                const searchItem: any = tmpitem.find(
                  (fitem) => fitem.pageId == skillcostitem.id,
                );
                const normalizedStr = normalizeWhitespace(searchItem.name);

                const skillitemSearchData = await Item.findAll({
                  where: {
                    'name.kr': normalizedStr,
                  },
                  raw: true,
                });

                if (skillitemSearchData) {
                  costList.push({
                    itemID: skillitemSearchData[0].id,
                    itemNum: skillcostitem.count,
                  });
                }
              }
            }

            levelitem.cost = costList;
            levelDataList.push(levelitem);
          }

          // 스킬 기본 정보 설정
          const setSkillBase = {
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

          // 스킬 생성
          const createSkill = await Skill.create(setSkillBase);

          // 스킬 이미지 처리
          const saveSkillDirectory = path.join(
            __dirname,
            '../../../static/image/HonkaiStarRail/skill/',
          );
          const skillImageVal = item?.iconPath;
          const skillImageUrl =
            'https://cdn.starrailstation.com/assets/' + skillImageVal + '.webp';

          await downloadImage(
            skillImageUrl,
            saveSkillDirectory,
            skillImageVal + '.webp',
          );

          // 스킬 이미지 정보 생성
          if (createSkill.id) {
            await SkillImage.create({
              skillId: createSkill.id,
              backgroundColor: '#ffffff',
              layout: '',
              url: 'assets/image/HonkaiStarRail/skill/' + skillImageVal,
            });
          }

          SkillsList.push(setSkillBase);
        }

        // 유튜브 영상 처리
        const searchTerm = `「천외 위성 통신」 | ${hakushItem.kr}`;
        const characterYoutube = await fetchAndDownloadVideo(
          searchTerm,
          'https://www.youtube.com/@Honkaistarrail_kr',
        );
        if (characterYoutube) {
          await CharacterImage.create({
            characterId: createCharacterBase.id,
            backgroundColor: '#ffffff',
            layout: 'video',
            url: 'assets/video/' + characterYoutube,
          });
        }

        console.log('캐릭터 생성 완료 - ' + createCharacterBase.id);
      }

      console.log('----------------------------------------');
    }

    // 응답 반환
    return true;
  }
}

export default new HonkaiStarRailCharacterCreate();
