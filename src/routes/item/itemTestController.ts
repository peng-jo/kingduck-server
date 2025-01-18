import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { QueryTypes, where, Op } from 'sequelize';
// 데이터 베이스 값 참조
import { Game } from '../../models/game/GameDef.Vo';
import { Item } from '../../models/Item/ItemDef.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';

// 해당 항목값을 url로 받아서 처리 해야됨
import hakushCard from './test/card.json';
import starrailstationCard from './test/card2.json';
import hakushInfo from './test/carditem.json';
import starrailstationInfo from './test/card2item.json';
import hakushRelics from './test/relics.json';
import starrailstationRelics from './test/relics2.json';
import hakushItemList from './test/item.json';
import starrailstationItemList from './test/item2.json';

// 공백(160)을 일반 공백(32)으로 변환하는 함수
function normalizeWhitespace(str: string, setType: number) {
  if (setType === 1) {
    const nonBreakingSpace = '\u00A0'; // 유니코드 160
    const regularSpace = ' '; // 유니코드 32
    return str.split(nonBreakingSpace).join(regularSpace);
  } else if (setType === 2) {
    const nonBreakingSpace = ' '; // 유니코드 160
    const regularSpace = '\u00A0'; // 유니코드 32
    return str.split(nonBreakingSpace).join(regularSpace);
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

export class ItemTestController {
  // 광추 넣기 - json 데이터 형태
  // itemCardSet 코드는 자동화가 완료됨
  async itemCardSet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('아이템 삽입 - 광추 (card) - 붕괴 스타레일');
    console.log('----------------------------------');

    // 데이터 확인 및 처리
    console.log('데이터 받는중');
    // hakush 캐릭터 데이터 - 메인 <- 정상 작동됨 - c1.json
    const hakushCard = await fetchData(
      'https://api.hakush.in/hsr/data/lightcone.json',
    );
    // starrailstation 캐릭터 데이터 - 서브 - c2.josn // 일부 옵셋 변경 필요
    const starrailstationData = await fetchPageConfig(
      'https://starrailstation.com/kr/equipment',
    ).catch(console.error);
    const starrailstationCard = starrailstationData.entries;
    console.log('데이터 확인 완료');

    console.log('hakushCard:' + Object.keys(hakushCard).length);
    console.log(
      'starrailstationCard:' + Object.keys(starrailstationCard).length,
    );
    console.log('----------------------------------');

    // 타입 데이터 전체 불러오기
    const TypeList = await TypeDef.findAll({
      where: {
        gameId: 1,
      },
      raw: true,
    });

    let setCardList: any = [];

    // 재처리 - 키형태로 처리
    for (var key in hakushCard) {
      console.log('카드 삽입 - 붕괴 스타레일');

      const hakushItem: any = hakushCard[key]; // 다른 사이트 비교 검색처리
      const starrailstationItem: any = starrailstationCard.find(
        (fitem) => fitem.pageId === key,
      );
      const baseTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.baseType.name,
      );
      const searchItem: any = await Item.findOne({
        where: {
          'name.kr': hakushItem.kr,
          itemtype: 'card',
        },
        raw: true,
      });
      console.log('name:' + hakushItem.kr);

      if (!starrailstationItem?.pageId) {
        console.log('starrailstation사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      if (searchItem?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
      } else {
        const starrailstationInfo = await fetchPageConfig(
          'https://starrailstation.com/kr/lightcone/' +
            starrailstationItem.pageId,
        ).catch(console.error);
        const hakushInfo = await fetchData(
          'https://api.hakush.in/hsr/data/kr/lightcone/' + key + '.json',
        );

        // 레벨업 스테이터스에 대한 처리
        const statsAddVal = extractAddValues(hakushInfo.Stats);
        let levelStatsData = [];
        for (const item of Object.values(hakushInfo.Stats)) {
          let costList = [];
          // 레벨업 코스트에 대한 처리
          for (const costitem of Object.values(item?.PromotionCostList)) {
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
            attackBase: item.BaseAttack,
            defenseBase: item.BaseDefence,
            HPBase: item.BaseHP,
            maxLevel: item.MaxLevel,
            playerLevelRequire: item.PlayerLevelRequire,
            cost: costList,
          };
          levelStatsData.push(setStats);
        }

        // 아이템 이미지 디렉토리 설정
        const saveDirectory = path.join(
          __dirname,
          '../../../static/image/item/',
        );
        // 아이템 카드 이미지 삽입
        const cardImageVal = starrailstationInfo?.iconPath;
        const cardImageUrl =
          'https://cdn.starrailstation.com/assets/' + cardImageVal + '.webp';
        const cardfileName = cardImageVal + '.webp';
        await downloadImage(cardImageUrl, saveDirectory, cardfileName);
        // 아이템 메인 이미지 삽입
        const artImageVal = starrailstationInfo?.artPath;
        const artImageUrl =
          'https://cdn.starrailstation.com/assets/' + artImageVal + '.webp';
        const artFileName = artImageVal + '.webp';
        await downloadImage(artImageUrl, saveDirectory, artFileName);

        let setItemBase = {
          characterId: 0,
          gameId: 1,
          itemtype: 'card',
          element: 0,
          name: {
            // JOSNB로 변경 필요
            kr: hakushItem?.kr,
            cn: hakushItem?.cn,
            jp: hakushItem?.jp,
            en: hakushItem?.en,
          },
          desc: {
            data: hakushInfo.Desc,
          },
          path: baseTypeItem.id,
          rarity: starrailstationItem?.rarity,
          levelData: {
            add: statsAddVal,
            stats: levelStatsData,
          },
          itemReferences: {
            set: {},
            Stats: [], // 스테이터스 레벨 형태
            info: {}, // 돌파 형태 정보
            Refinements: hakushInfo.Refinements,
            image: {
              icon: {
                src: starrailstationItem?.iconPath,
              },
              art: {
                src: starrailstationItem?.artPath,
              },
            },
          },
          skillId: 0,
        };
        const createRelicsItem = await Item.create(setItemBase);
        setCardList.push(setItemBase);
      }
      console.log('----------------');
    }

    res.status(200).json({
      resultCode: 200,
      resultMsg: 'NORMAL SERVICE',
      items: setCardList,
    });
  }
  // 붕괴 스타레일 - 유물 아이템
  async itemRelicsSet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('아이템 삽입 - 유물 - 붕괴 스타레일');
    console.log('----------------------------------');

    // 데이터 확인 및 처리
    console.log('데이터 받는중');
    // hakush 캐릭터 데이터 - 메인 <- 정상 작동됨 - c1.json
    const hakushRelics = await fetchData(
      'https://api.hakush.in/hsr/data/relicset.json',
    );
    // starrailstation 캐릭터 데이터 - 서브 - c2.josn // 일부 옵셋 변경 필요
    const starrailstationData = await fetchPageConfig(
      'https://starrailstation.com/kr/relics',
    ).catch(console.error);
    const starrailstationRelics = starrailstationData.entries;
    console.log('데이터 확인 완료');
    console.log('hakushRelics:' + Object.keys(hakushRelics).length);
    console.log(
      'starrailstationRelics:' + Object.keys(starrailstationRelics).length,
    );
    console.log('----------------------------------');

    let setRelicsList: any = [];

    // 재처리 - 키형태로 처리
    for (var key in hakushRelics) {
      console.log('유물 - 붕괴 스타레일');

      const hakushItem: any = hakushRelics[key]; // 다른 사이트 비교 검색처리
      const starrailstationItem: any = starrailstationRelics.find(
        (fitem) => fitem.pageId === key,
      );
      if (!starrailstationItem?.pageId) {
        console.log('starrailstation사이트의 pageId가 존재하지 않습니다.');
        continue;
      }
      let relicType = '';
      switch (starrailstationItem?.relicType) {
        case 1:
          relicType = 'Relic';
          break;

        default:
          relicType = 'Planetary';
          break;
      }

      // 중복 체크
      const searchItem: any = await Item.findOne({
        where: {
          'name.kr': hakushItem.kr,
          itemtype: relicType,
        },
        raw: true,
      });
      console.log('name:' + hakushItem.kr);
      if (searchItem?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
      } else {
        let setItemBase = {
          characterId: 0,
          gameId: 1,
          itemtype: relicType,
          element: 0,
          name: {
            // JOSNB로 변경 필요
            kr: hakushItem.kr,
            cn: hakushItem.cn,
            jp: hakushItem.jp,
            en: hakushItem.en,
          },
          desc: {
            data: '',
          },
          path: 0,
          rarity: starrailstationItem.rarity,
          levelData: {},
          itemReferences: {
            set: hakushItem.set,
            Stats: [], // 스테이터스 레벨 형태
            info: {}, // 돌파 형태 정보
            image: {
              src: starrailstationItem.iconPath, // 정보 처리를 위한 일부 선택 <- 실적용시 삭제 필요
            },
            baseKey: key,
          },
          skillId: 0,
        };
        // 아이템 이미지 디렉토리 설정
        const saveDirectory = path.join(
          __dirname,
          '../../../static/image/item/',
        );
        // 아이템 카드 이미지 삽입
        const relicsImageVal = starrailstationItem?.iconPath;
        const relicsImageUrl =
          'https://cdn.starrailstation.com/assets/' + relicsImageVal + '.webp';
        const relicsfileName = relicsImageVal + '.webp';
        await downloadImage(relicsImageUrl, saveDirectory, relicsfileName);
        const createRelicsItem = await Item.create(setItemBase);
        // orm 삽입
        setRelicsList.push(setItemBase);
      }
    }

    res.status(200).json({
      items: setRelicsList,
    });
  }
  // 붕괴 스타레일 - 전체 아이템
  async itemSet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('아이템 삽입 - 전체 - 붕괴 스타레일');
    console.log('----------------------------------');

    // 데이터 확인 및 처리
    console.log('데이터 받는중');
    // hakush 캐릭터 데이터 - 메인 <- 정상 작동됨 - c1.json
    const hakushItemList = await fetchData(
      'https://api.hakush.in/hsr/data/kr/item.json',
    );
    // starrailstation 캐릭터 데이터 - 서브 - c2.josn // 일부 옵셋 변경 필요
    const starrailstationData = await fetchPageConfig(
      'https://starrailstation.com/kr/materials',
    ).catch(console.error);
    const starrailstationItemList = starrailstationData.entries;
    console.log('데이터 확인 완료');
    console.log('hakushItem:' + Object.keys(hakushItemList).length);
    console.log(
      'starrailstationItemList:' + Object.keys(starrailstationItemList).length,
    );
    console.log('----------------------------------');

    let setItemList: any = [];
    // 재처리 - 키형태로 처리
    for (var key in hakushItemList) {
      console.log('유물 - 붕괴 스타레일');

      const hakushItem: any = hakushItemList[key]; // 다른 사이트 비교 검색처리
      const starrailstationItem: any = starrailstationItemList.find(
        (fitem) => fitem.name === normalizeWhitespace(hakushItem.ItemName, 2),
      );

      if (!starrailstationItem?.pageId) {
        console.log('starrailstation사이트의 pageId가 존재하지 않습니다.');
        continue;
      }
      // 중복 체크
      const searchItem: any = await Item.findOne({
        where: {
          'name.kr': hakushItem.ItemName,
        },
        raw: true,
      });
      console.log('name:' + hakushItem.ItemName);
      if (searchItem?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
      } else {
        let setItemBase = {
          characterId: 0,
          gameId: 1,
          itemtype: hakushItem.ItemSubType,
          element: 0,
          name: {
            // JOSNB로 변경 필요
            kr: hakushItem.ItemName,
            cn: '',
            jp: '',
            en: '',
          },
          desc: {
            data: '',
          },
          path: 0,
          rarity: starrailstationItem.rarity,
          levelData: {},
          itemReferences: {
            set: {},
            Stats: [], // 스테이터스 레벨 형태
            info: {}, // 돌파 형태 정보
            image: {
              src: starrailstationItem.iconPath, // 정보 처리를 위한 일부 선택 <- 실적용시 삭제 필요
            },
            baseKey: key,
          },
          skillId: 0,
        };
        // 아이템 이미지 디렉토리 설정
        const saveDirectory = path.join(
          __dirname,
          '../../../static/image/item/',
        );
        // 아이템 카드 이미지 삽입
        const cardImageVal = starrailstationItem.iconPath;
        const cardImageUrl =
          'https://cdn.starrailstation.com/assets/' + cardImageVal + '.webp';
        const cardfileName = cardImageVal + '.webp';
        await downloadImage(cardImageUrl, saveDirectory, cardfileName);
        const createRelicsItem = await Item.create(setItemBase);
        setItemList.push(setItemBase);
      }
    }

    res.status(200).json({
      items: setItemList,
    });
  }
  async itemSearch(req: any, res: any): Promise<void> {
    const itemSearchData = await Item.findAll({
      where: {
        'itemReferences.image.src': 'SpriteOutput/ItemFigures/201.png',
      },
    });
    res.status(200).json({
      items: itemSearchData,
    });
  }
  async typeSet(req: any, res: any): Promise<void> {
    const data: any = testType;
    const uniqueTypes: any = {};
    let setTypesItem = [];
    let setTypesImageItem = [];
    let setTypesCount = 0;

    // 캐릭터 전체에서 확인
    const extractUniqueValues = (data: any) => {
      data.forEach((item: any) => {
        if (!uniqueTypes[item.damageType.iconPath]) {
          uniqueTypes[item.damageType.iconPath] = item.damageType;
        }
        if (!uniqueTypes[item.baseType.iconPath]) {
          uniqueTypes[item.baseType.iconPath] = item.baseType;
        }
      });
      return {
        uniqueTypes: Object.values(uniqueTypes),
      };
    };
    const result = extractUniqueValues(data);

    // 재처리
    for (const item of Object.values(result.uniqueTypes)) {
      const koTypeItme: any = koType.find((titem) => titem.name === item.name);
      const jpTypeItme: any = jpType.find(
        (titem) => titem.icon === koTypeItme.icon,
      );
      const enTypeItme: any = enType.find(
        (titem) => titem.icon === koTypeItme.icon,
      );
      const cnTypeItme: any = cnType.find(
        (titem) => titem.icon === koTypeItme.icon,
      );
      console.log(koTypeItme);

      let setTypeBase = {
        group: koTypeItme.group,
        name: {
          ko: koTypeItme.name,
          jp: jpTypeItme.name,
          en: enTypeItme.name,
          cn: cnTypeItme.name,
        },
        info: '',
      };
      setTypesItem[setTypesCount] = setTypeBase;
      const createTypesItem = await TypeDef.create(setTypeBase);

      // 이미지 테이블 처리를 위한 구문
      let setTypeImageBase = {
        pathTypeId: createTypesItem.id,
        backgroundColor: item.color,
        layout: '',
        url: 'assets/image/type/' + item.iconPath,
      };

      setTypesImageItem[setTypesCount] = setTypeImageBase;
      const createTypeImage = await TypeImage.create(setTypeImageBase);

      setTypesCount++;
    }
    res.status(200).json({
      items: setTypesItem,
      images: setTypesImageItem,
    });
  }
}

export default new ItemTestController();
