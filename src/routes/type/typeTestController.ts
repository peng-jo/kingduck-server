import express from 'express';
import fs from 'fs';
// 데이터 베이스 값 참조
import { Game } from '../../models/game/GameDef.Vo';
import sequelize from '../../models';
import { QueryTypes } from 'sequelize';
import { Item } from '../../models/Item/ItemDef.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';

import relicsList from './RelicsItem.json';
import Planetary from './Planetary.json';
import itemData from './item.json';

export class ItemTestController {
  // 아이템 넣기 - json 데이터 형태
  // 붕괴 스타레일 유효
  async itemRelicsSet(req: any, res: any): Promise<void> {
    /* 아이템 기본 형태 itemtype 이 틀리니 꼭 화인 하면서 처리
    let setItemBase = {
      characterId: 0, // 캐릭터 교환 불가시 입력
      gameId: 1, // 게임 번호 - 필수
      itemtype: 'Relics', // 아이템 타입 - 게임별 상이
      element: 0, // 속성이 있는 경우 type테이블 참조 필요
      name: { // 이름
        // JOSNB로 변경 필요
        kr: '', // 한국
        cn: '', // 중국
        jp: '', // 일본
        en: '', // 영어
      },
      desc: {// 설명 데이터
        data: '', 
      },
      path: 0, // 서브 속성이 있는 경우 속성 type테이블 참조 필요
      rarity: 5, // 뽑기 및 등급 게임  내 기준을 따름
      levelData: {}, // 레벨 데이터 json
      itemReferences: { // 아이템 세부 정보
        set: {},  // 세트 착용 부분
        Stats: [], // 스테이터스 레벨 형태
        info: {}, // 돌파 형태 정보
        image: {
          src: '', // 이미지를 바로 못따와서 넣은 허구값 // 절대 참조 금지
        },
      },
      skillId: 0, // 해당 아이템의 스킬이 있는 경우 스킬 테이블 참조
    };
    */

    console.log('----------------------------------');
    console.log('아이템 형태에 따른 sequelize 입력 테스트 겸 넣기');
    console.log('----------------------------------');
    let setRelicsItem = [];
    let setRelicsCount = 0;

    console.log(Object.keys(relicsList).length);

    for (const item of Object.values(relicsList)) {
      let setItemBase = {
        characterId: 0,
        gameId: 1,
        itemtype: 'Relic',
        element: 0,
        name: {
          kr: item.kr,
          cn: item.cn,
          jp: item.jp,
          en: item.en,
        },
        desc: {
          data: '',
        },
        path: 0,
        rarity: 0,
        levelData: {},
        itemReferences: {
          set: item.set,
          Stats: [], // 스테이터스 레벨 형태
          info: {}, // 돌파 형태 정보
          image: {
            src: item.icon, // 정보 처리를 위한 일부 선택 <- 실적용시 삭제 필요
          },
        },
        skillId: 0,
      };
      const createRelicsItem = await Item.create(setItemBase);
      setRelicsItem[setRelicsCount] = setItemBase;
      setRelicsCount++;
    }

    //const createRelicsItem = Item.create(setRelicsItem);
    const createRelicsItemList = Item.findAll();
    console.log(createRelicsItemList);

    res.status(200).json({
      items: setRelicsItem,
    });
  }
  async itemPlanetarySet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('아이템 형태에 따른 sequelize 입력 테스트 겸 넣기');
    console.log('----------------------------------');
    let setRelicsItem = [];
    let setRelicsCount = 0;

    console.log(Object.keys(Planetary).length);

    for (const item of Object.values(Planetary)) {
      let setItemBase = {
        characterId: 0,
        gameId: 1,
        itemtype: 'Planetary',
        element: 0,
        name: {
          // JOSNB로 변경 필요
          kr: item.kr,
          cn: item.cn,
          jp: item.jp,
          en: item.en,
        },
        desc: {
          data: '',
        },
        path: 0,
        rarity: 0,
        levelData: {},
        itemReferences: {
          set: item.set,
          Stats: [], // 스테이터스 레벨 형태
          info: {}, // 돌파 형태 정보
          image: {
            src: item.icon, // 정보 처리를 위한 일부 선택 <- 실적용시 삭제 필요
          },
        },
        skillId: 0,
      };
      const createRelicsItem = await Item.create(setItemBase);
      setRelicsItem[setRelicsCount] = setItemBase;
      setRelicsCount++;
    }

    //const createRelicsItem = Item.create(setRelicsItem);
    const createRelicsItemList = Item.findAll();
    console.log(createRelicsItemList);

    res.status(200).json({
      items: setRelicsItem,
    });
  }
  async itemSet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('아이템 형태에 따른 sequelize 입력 테스트 겸 넣기');
    console.log('----------------------------------');
    let setRelicsItem = [];
    let setRelicsCount = 0;

    console.log(Object.keys(itemData).length);

    for (const item of Object.values(itemData)) {
      let setItemBase = {
        characterId: 0,
        gameId: 1,
        itemtype: item.ItemSubType,
        element: 0,
        name: {
          // JOSNB로 변경 필요
          kr: item.ItemName,
          cn: '',
          jp: '',
          en: '',
        },
        desc: {
          data: '',
        },
        path: 0,
        rarity: item.PurposeType,
        levelData: {},
        itemReferences: {
          set: {},
          Stats: [], // 스테이터스 레벨 형태
          info: {}, // 돌파 형태 정보
          image: {
            src: item.ItemFigureIconPath, // 정보 처리를 위한 일부 선택 <- 실적용시 삭제 필요
          },
        },
        skillId: 0,
      };
      const createRelicsItem = await Item.create(setItemBase);
      setRelicsItem[setRelicsCount] = setItemBase;
      setRelicsCount++;
    }

    //const createRelicsItem = Item.create(setRelicsItem);
    const createRelicsItemList = Item.findAll();
    console.log(createRelicsItemList);

    res.status(200).json({
      items: setRelicsItem,
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

export default new TestController();
