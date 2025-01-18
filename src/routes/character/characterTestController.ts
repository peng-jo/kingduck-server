import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
import youtubedl from 'youtube-dl-exec';
import progressEstimator from 'progress-estimator';
// 데이터 베이스 값 참조
import { QueryTypes, where, Op, Sequelize } from 'sequelize';

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
import prydwenData from './test/c3.json';
import starrailstationCharacterInfo from './test/citem.json';
import hakushCharacterInfo from './test/citem2.json';
import tmpitem from './test/itemt.json';

// 유물 아이템 처리를 위한 구문
// 해당 부분은 지속적인 업데이트가 필요함
import relicsList from './test/RelicsItem.json';
import Planetary from './test/Planetary.json';
import sequelize from '../../models';

// 공백(160)을 일반 공백(32)으로 변환하는 함수
function normalizeWhitespace(str: string) {
  const nonBreakingSpace = '\u00A0'; // 유니코드 160
  const regularSpace = ' '; // 유니코드 32
  return str.split(nonBreakingSpace).join(regularSpace);
}
// prydwen 날짜 정보 변환을 위한 함수
function formatDateString(dateString: any) {
  console.log(dateString);

  // "th", "st", "nd", "rd" 등의 접미사를 제거합니다.
  const cleanedDateString = dateString.replace(/(st|nd|rd|th)/g, '');
  // Date 객체로 변환합니다.
  const dateObject = new Date(cleanedDateString);
  // 날짜 형식을 'YYYY-MM-DD'로 변환합니다.
  const formattedDate = dateObject.toISOString().split('T')[0];
  return formattedDate;
}
// 하이픈을 띄어쓰기로 치환하고 각 단어의 첫 글자를 대문자로 변환하는 함수
function replaceHyphensAndCapitalize(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
// 브라우저 내장의 경우  <- 정상 작동됨
async function fetchYoutubePageConfig(url: string) {
  // 브라우저 실행
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // 요청 차단 설정
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  // 사용자 에이전트 설정
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  );
  // URL로 이동
  await page.goto(url, { timeout: 100000 });
  // 페이지 대기 (사람처럼 보이기 위해 대기 시간을 추가할 수 있습니다)
  await new Promise((page) => setTimeout(page, 2000));
  // window.PAGE_CONFIG 값 추출
  const pageConfig = await page.evaluate(() => {
    return ytInitialData;
  });
  // 브라우저 종료
  await browser.close();
  return pageConfig;
}

// 유튜브 다운로드 처리
async function downloadVideo(url: string, fileName: string) {
  try {
    const saveDirectory = path.join(__dirname, '../../../static/video/');
    const output = await youtubedl(url, {
      ffmpegLocation: 'C:\\ffmpeg\\bin\\ffmpeg.exe',
      output: `${saveDirectory}${fileName}.webm`,
      remuxVideo: 'webm',
      mergeOutputFormat: 'webm',
    });
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
async function youtubeVideoDownload(data: string) {
  const logger = progressEstimator();
  const url = 'https://www.youtube.com/watch?v=' + data;
  return await logger(downloadVideo(url, data), `Obtaining ${url}`);
}
async function youtubeVideo(data: string) {
  const title = '「천외 위성 통신」 | ' + data;

  // 유튜브 숏츠 영상 긁기 용 - 붕괴 스타레일 특화
  const youtubeDataList = await fetchYoutubePageConfig(
    'https://www.youtube.com/@Honkaistarrail_kr/search?query=' + title,
  );
  let youtubeData =
    youtubeDataList.contents.twoColumnBrowseResultsRenderer.tabs[6]
      .expandableTabRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents[0];

  let youtubeTitle = youtubeData.videoRenderer.title.runs[0].text;
  let youtubeVideoId = youtubeData.videoRenderer.videoId;

  if (youtubeTitle.includes(title)) {
    console.log(`youtubeVideo : 텍스트에 "${title}"이(가) 포함되어 있습니다.`);
    await youtubeVideoDownload(youtubeVideoId);
    return youtubeVideoId;
  } else {
    console.log(
      `youtubeVideo : 텍스트에 "${title}"이(가) 포함되어 있지 않습니다.`,
    );
    return false;
  }
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
  // 요청 차단 설정
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });
  // 사용자 에이전트 설정
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
  );
  // URL로 이동
  await page.goto(url, { timeout: 100000 });
  // 페이지 대기 (사람처럼 보이기 위해 대기 시간을 추가할 수 있습니다)
  await new Promise((page) => setTimeout(page, 3000));
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

export class CharacterTestController {
  // 캐릭터 넣기 - json 데이터 형태
  // 붕괴 스타레일 유효
  async CharacterSet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('캐릭터 삽입 - 붕괴 스타레일');
    console.log('----------------------------------');
    /*
    // 데이터 확인 및 처리
    console.log('데이터 받는중');
    // hakush 캐릭터 데이터 - 메인 <- 정상 작동됨 - c1.json
    const hakushCharacter = await fetchData(
      'https://api.hakush.in/hsr/data/character.json',
    );
    // prydwen 캐릭터 데이터 - 서브 - c3.json
    const prydwenData = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2408139295.json',
    );
    // starrailstation 캐릭터 데이터 - 서브 - c2.josn
    const starrailstationData = await fetchPageConfig(
      'https://starrailstation.com/kr/characters',
    ).catch(console.error);
    
    const starrailstationCharacter = starrailstationData.entries;
    */
    const prydwenCharacter = prydwenData.data.allContentfulHsrCharacter.nodes;
    console.log('데이터 확인 완료');

    console.log('hakushCharacter:' + Object.keys(hakushCharacter).length);
    console.log(
      'starrailstationCharacter:' +
        Object.keys(starrailstationCharacter).length,
    );
    console.log('prydwenCharacter:' + Object.keys(prydwenCharacter).length);
    console.log('----------------------------------');

    // 타입 데이터 전체 불러오기
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

    let log = {};

    // 재처리 - 키형태로 처리
    for (var key in hakushCharacter) {
      // 기본 데이터 - hakush
      const hakushItem: any = hakushCharacter[key]; // 다른 사이트 비교 검색처리
      let ChkName = '';
      let ChkEnName = '';

      // 중복 여부 확인
      if (hakushItem.kr === '{NICKNAME}') {
        ChkName = '개척자';
      } else {
        ChkName = hakushItem.kr;
      }

      // 서브 데이터 - starrailstation
      const starrailstationItem: any = starrailstationCharacter.find(
        (fitem) => fitem.pageId === hakushItem.icon,
      );
      // 서브 데이터가 존재하지 않는 경우
      if (!starrailstationItem?.pageId) {
        console.log('starrailstation사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      // 데미지 타입에 대한 산술
      const damageTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.damageType.name,
      );
      const baseTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.baseType.name,
      );

      // 서브 데이터 - prydwen
      ChkEnName = hakushItem.en;
      if (damageTypeItem.id && hakushItem.kr === '{NICKNAME}') {
        // 주인공 속성이 나올때 마다 넣어줘야됨
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
      const prydwenItem: any = prydwenCharacter.find(
        (fitem) => fitem.name === ChkEnName,
      );
      // 서브 데이터가 존재하지 않는 경우
      if (!prydwenItem?.slug) {
        console.log('prydwen사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      // 캐릭터 존재 여부 확인
      const searchCharacter: any = await Character.findOne({
        where: {
          'name.kr': ChkName,
          element: String(damageTypeItem?.id),
          path: String(baseTypeItem?.id),
        },
        raw: true,
      });
      console.log('name:' + hakushItem.kr + '/' + ChkEnName);

      if (searchCharacter?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
        continue;
      } else {
        // 다른 사이트 비교 검색처리
        const starrailstationCharacterInfo = await fetchPageConfig(
          'https://starrailstation.com/kr/character/' +
            starrailstationItem.pageId,
        ).catch(console.error);
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
          setCharacterBase.name.kr = ChkName;
          setCharacterBase.name.en = ChkEnName;
        }
        // 일부 사항에 대한 값이 틀려서 따로 처리 해야됩니다.
        if (
          !prydwenhCharacterInfo?.isNew ||
          prydwenhCharacterInfo?.isNew == null
        ) {
          setCharacterBase.isNew = 0;
        } else {
          setCharacterBase.isNew = 1;
        }

        // 일부 사항에 대한 값이 틀려서 따로 처리 해야됩니다.
        if (
          !prydwenhCharacterInfo?.isReleased ||
          prydwenhCharacterInfo?.isReleased == null
        ) {
          setCharacterBase.isReleased = 0;
        } else {
          setCharacterBase.isReleased = 1;
        }
        if (prydwenhCharacterInfo?.releaseDate) {
          setCharacterBase.releaseDate = formatDateString(
            prydwenhCharacterInfo.releaseDate,
          );
        }

        const search2Character: any = await Character.findOne({
          where: {
            'name.kr': setCharacterBase.name.kr,
            element: String(damageTypeItem?.id),
            path: String(baseTypeItem?.id),
          },
          raw: true,
        });
        if (search2Character?.id) {
          console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
          continue;
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
                'itemReferences.baseKey': costitem.ItemID,
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
        let setCard = [];
        console.log(hakushCharacterInfo.Relics.Set4IDList);

        for (const item of Object.values(
          hakushCharacterInfo.Relics.Set4IDList,
        )) {
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
        for (const item of Object.values(
          hakushCharacterInfo.Relics.Set2IDList,
        )) {
          const itemSearchData = await Item.findAll({
            attributes: ['id'],
            where: {
              'itemReferences.baseKey': String(item),
            },
            raw: true,
          });
          setAccessories.push(itemSearchData[0].id);
        }

        // 카드 정보 표기
        if (prydwenhCharacterInfo.conesNew) {
          for (const item of Object.values(prydwenhCharacterInfo.conesNew)) {
            const normalizedSearchTerm = replaceHyphensAndCapitalize(
              item.cone,
            ).toLowerCase();

            const itemFound = await sequelize.query(
              `SELECT * FROM "item" AS "Item" WHERE ("Item"."deletedAt" IS NULL) AND (lower("Item"."name"->>'en') LIKE '%${normalizedSearchTerm}%')`,
            );
            const itemSearch = itemFound[0];
            if (itemSearch[0]?.id) {
              setCard.push(itemSearch[0]?.id);
            }
          }
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
          let characterYoutube = await youtubeVideo(hakushItem.kr);
          if (characterYoutube) {
            // 유튜브 정보 처리
            let setCharacterVideo = {
              characterId: createCharacterBase.id,
              backgroundColor: '#ffffff',
              layout: 'video', // 이미지 옵셋 - card:리스트 / art: 페이지별 이미지
              url: 'assets/video/' + characterYoutube,
            };
            // 캐릭터 이미지 저장 - 카드형
            const createCharacterVideo =
              await CharacterImage.create(setCharacterVideo);
          }
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
              card: setCard, // id - item
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

      console.log('----------------');
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
