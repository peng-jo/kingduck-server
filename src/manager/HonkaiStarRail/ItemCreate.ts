import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
// 데이터 베이스 값 참조
import { Item } from '../../models/Item/ItemDef.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';

import * as ApiUtils from '../../utils/apiUtils';
import * as ImageUtils from '../../utils/imageUtils';
import * as StringUtils from '../../utils/stringUtils';

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
  hakushFilename: string,
  starrailFilename: string,
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
};

/**
 * 붕괴: 스타레일 아이템 생성 클래스
 */
export class HonkaiStarRailItemCreate {
  /**
   * 광추(카드) 아이템 생성 메서드
   * hakush API와 starrailstation API에서 데이터를 가져와 DB에 저장
   */
  async itemCardSet(): Promise<{
    items: any[];
    length: number[];
  }> {
    console.log('----------------------------------');
    console.log('아이템 삽입 - 광추 (card) - 붕괴 스타레일');

    // API 데이터 가져오기
    const hakushCard = await ApiUtils.fetchData(
      'https://api.hakush.in/hsr/data/lightcone.json',
    );
    const starrailstationData = await ApiUtils.fetchPageConfig(
      'https://starrailstation.com/kr/equipment',
    ).catch(console.error);
    const starrailstationCard = starrailstationData.entries;

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(
        hakushCard,
        starrailstationData,
        'hakushCard',
        'starrailstationCard',
      );
      console.log('데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    console.log('hakushCard:' + Object.keys(hakushCard).length);
    console.log(
      'starrailstationCard:' + Object.keys(starrailstationCard).length,
    );
    console.log('----------------------------------');

    // 타입 데이터 전체 불러오기
    const TypeList = await TypeDef.findAll({
      where: { gameId: 1 },
      raw: true,
    });

    const setCardList: any[] = [];

    // 각 광추 아이템 처리
    for (const key in hakushCard) {
      const hakushItem = hakushCard[key];
      const starrailstationItem = starrailstationCard.find(
        (item: any) => item.pageId === key,
      );
      const baseTypeItem = TypeList.find(
        (item: any) => item.name.ko === starrailstationItem?.baseType.name,
      );

      // 중복 체크
      const existingItem = await Item.findOne({
        where: {
          'name.kr': hakushItem.kr,
          itemtype: 'card',
        },
        raw: true,
      });
      console.log('name:' + hakushItem.kr);

      // starrailstation pageId 체크
      if (!starrailstationItem?.pageId) {
        console.log('starrailstation pageId 없음');
        continue;
      }

      if (existingItem) {
        console.log('이미 존재하는 아이템');
        continue;
      }

      // 상세 정보 조회
      const starrailstationInfo = await ApiUtils.fetchPageConfig(
        `https://starrailstation.com/kr/lightcone/${starrailstationItem.pageId}`,
      ).catch(console.error);

      const hakushInfo = await ApiUtils.fetchData(
        `https://api.hakush.in/hsr/data/kr/lightcone/${key}.json`,
      );

      // 레벨업 스탯 처리
      const statsAddVal = extractAddValues(hakushInfo.Stats);
      const levelStatsData = [];

      for (const item of Object.values(hakushInfo.Stats)) {
        const costList = [];

        // 레벨업 코스트 처리
        for (const costItem of Object.values(item?.PromotionCostList)) {
          const itemData = await Item.findAll({
            attributes: ['id'],
            where: {
              'itemReferences.baseKey': costItem.ItemID,
              itemtype: { [Op.notLike]: '%Mission' },
            },
            raw: true,
          });

          costList.push({
            itemID: itemData[0].id,
            itemNum: costItem.ItemNum,
          });
        }

        // 기본 스탯 설정
        levelStatsData.push({
          attackBase: item.BaseAttack,
          defenseBase: item.BaseDefence,
          HPBase: item.BaseHP,
          maxLevel: item.MaxLevel,
          playerLevelRequire: item.PlayerLevelRequire,
          cost: costList,
        });
      }

      // 이미지 저장
      const saveDirectory = path.join(__dirname, '../../../static/image/item/');

      const cardImagePath = starrailstationInfo?.iconPath;
      const artImagePath = starrailstationInfo?.artPath;

      await ImageUtils.downloadImage(
        `https://cdn.starrailstation.com/assets/${cardImagePath}.webp`,
        saveDirectory,
        `${cardImagePath}.webp`,
      );

      await ImageUtils.downloadImage(
        `https://cdn.starrailstation.com/assets/${artImagePath}.webp`,
        saveDirectory,
        `${artImagePath}.webp`,
      );

      // 아이템 생성
      const itemData = {
        characterId: 0,
        gameId: 1,
        itemtype: 'card',
        element: 0,
        name: {
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
          Stats: [],
          info: {},
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

      await Item.create(itemData);
      setCardList.push(itemData);
    }

    return {
      items: setCardList,
      length: [
        Object.keys(hakushCard).length,
        Object.keys(starrailstationCard).length,
      ],
    };
  }

  /**
   * 유물 아이템 생성 메서드
   * hakush API와 starrailstation API에서 데이터를 가져와 DB에 저장
   */
  async itemRelicsSet(): Promise<{ items: any[]; length: number[] }> {
    console.log('아이템 삽입 - 유물 - 붕괴 스타레일');

    // API 데이터 가져오기
    const hakushRelics = await ApiUtils.fetchData(
      'https://api.hakush.in/hsr/data/relicset.json',
    );
    const starrailstationData = await ApiUtils.fetchPageConfig(
      'https://starrailstation.com/kr/relics',
    ).catch(console.error);
    const starrailstationRelics = starrailstationData.entries;

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(
        hakushRelics,
        starrailstationData,
        'hakushRelics',
        'starrailstationRelics',
      );
      console.log('데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    console.log('데이터 확인 완료');
    console.log('hakushRelics:' + Object.keys(hakushRelics).length);
    console.log(
      'starrailstationRelics:' + Object.keys(starrailstationRelics).length,
    );
    console.log('----------------------------------');

    const setRelicsList = [];

    // 각 유물 처리
    for (const key in hakushRelics) {
      const hakushItem = hakushRelics[key];
      const starrailstationItem = starrailstationRelics.find(
        (item: any) => item.pageId === key,
      );

      if (!starrailstationItem?.pageId) {
        console.log('starrailstation pageId 없음');
        continue;
      }

      const relicType =
        starrailstationItem?.relicType === 1 ? 'Relic' : 'Planetary';

      // 중복 체크
      const existingItem = await Item.findOne({
        where: {
          'name.kr': hakushItem.kr,
          itemtype: relicType,
        },
        raw: true,
      });

      if (existingItem) {
        console.log('이미 존재하는 아이템');
        continue;
      }

      // 아이템 생성
      const itemData = {
        characterId: 0,
        gameId: 1,
        itemtype: relicType,
        element: 0,
        name: {
          kr: hakushItem.kr,
          cn: hakushItem.cn,
          jp: hakushItem.jp,
          en: hakushItem.en,
        },
        desc: { data: '' },
        path: 0,
        rarity: starrailstationItem.rarity,
        levelData: {},
        itemReferences: {
          set: hakushItem.set,
          Stats: [],
          info: {},
          image: {
            src: starrailstationItem.iconPath,
          },
          baseKey: key,
        },
        skillId: 0,
      };

      // 이미지 저장
      const saveDirectory = path.join(__dirname, '../../../static/image/item/');
      const imagePath = starrailstationItem?.iconPath;

      await ImageUtils.downloadImage(
        `https://cdn.starrailstation.com/assets/${imagePath}.webp`,
        saveDirectory,
        `${imagePath}.webp`,
      );

      await Item.create(itemData);
      setRelicsList.push(itemData);
    }

    return {
      items: setRelicsList,
      length: [
        Object.keys(hakushRelics).length,
        Object.keys(starrailstationRelics).length,
      ],
    };
  }

  /**
   * 전체 아이템 생성 메서드
   * hakush API와 starrailstation API에서 데이터를 가져와 DB에 저장
   */
  async itemSet(): Promise<{ items: any[]; length: number[] }> {
    console.log('아이템 삽입 - 전체 - 붕괴 스타레일');
    console.log('----------------------------------');

    // API 데이터 가져오기
    const hakushItemList = await ApiUtils.fetchData(
      'https://api.hakush.in/hsr/data/kr/item.json',
    );
    const starrailstationData = await ApiUtils.fetchPageConfig(
      'https://starrailstation.com/kr/materials',
    ).catch(console.error);
    const starrailstationItemList = starrailstationData.entries;

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(
        hakushItemList,
        starrailstationData,
        'hakushItemList',
        'starrailstationItemList',
      );
      console.log('데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    console.log('데이터 확인 완료');
    console.log('hakushItem:' + Object.keys(hakushItemList).length);
    console.log(
      'starrailstationItemList:' + Object.keys(starrailstationItemList).length,
    );
    console.log('----------------------------------');

    const setItemList = [];

    // 각 아이템 처리
    for (const key in hakushItemList) {
      const hakushItem = hakushItemList[key];
      const starrailstationItem = starrailstationItemList.find(
        (item: any) =>
          item.name === StringUtils.normalizeWhitespace(hakushItem.ItemName, 2),
      );

      if (!starrailstationItem?.pageId) {
        console.log('starrailstation pageId 없음');
        continue;
      }

      // 중복 체크
      const existingItem = await Item.findOne({
        where: {
          'name.kr': hakushItem.ItemName,
        },
        raw: true,
      });

      if (existingItem) {
        console.log('이미 존재하는 아이템');
        continue;
      }

      // 아이템 생성
      const itemData = {
        characterId: 0,
        gameId: 1,
        itemtype: hakushItem.ItemSubType,
        element: 0,
        name: {
          kr: hakushItem.ItemName,
          cn: '',
          jp: '',
          en: '',
        },
        desc: { data: '' },
        path: 0,
        rarity: starrailstationItem.rarity,
        levelData: {},
        itemReferences: {
          set: {},
          Stats: [],
          info: {},
          image: {
            src: starrailstationItem.iconPath,
          },
          baseKey: key,
        },
        skillId: 0,
      };

      // 이미지 저장
      const saveDirectory = path.join(__dirname, '../../../static/image/item/');
      const imagePath = starrailstationItem.iconPath;

      await ImageUtils.downloadImage(
        `https://cdn.starrailstation.com/assets/${imagePath}.webp`,
        saveDirectory,
        `${imagePath}.webp`,
      );

      await Item.create(itemData);
      setItemList.push(itemData);
    }

    return {
      items: setItemList,
      length: [
        Object.keys(hakushItemList).length,
        Object.keys(starrailstationItemList).length,
      ],
    };
  }

  /**
   * 아이템 생성 메서드들을 순차적으로 실행
   */
  async itemSetAll(): Promise<{
    itemSet: any[];
    itemCardSet: any[];
    itemRelicsSet: any[];
    resultCode: number;
    resultMsg: string;
  }> {
    console.log('----------------------------------');
    console.log('아이템 생성 시작');

    try {
      // itemSet 실행
      // 각 메서드 실행 및 결과 저장
      const itemSetResult = await this.itemSet();
      console.log('itemSet 완료');

      const itemCardSetResult = await this.itemCardSet();
      console.log('itemCardSet 완료');

      const itemRelicsSetResult = await this.itemRelicsSet();
      console.log('itemRelicsSet 완료');

      console.log('모든 아이템 생성 완료');

      // 전체 결과 반환
      return {
        itemSet: itemSetResult?.items || [],
        itemCardSet: itemCardSetResult?.items || [],
        itemRelicsSet: itemRelicsSetResult?.items || [],
        resultCode: 200,
        resultMsg: '아이템 생성 완료',
      };
    } catch (error) {
      console.error('아이템 생성 중 오류 발생:', error);
      throw error;
    }

    console.log('----------------------------------');
  }
}

export default new HonkaiStarRailItemCreate();
