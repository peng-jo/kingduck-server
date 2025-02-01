import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// 데이터 베이스 값 참조
import { Item } from '../../models/Item/ItemDef.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';

// 참조한 유틸
import * as ApiUtils from '../../utils/apiUtils';
import * as ImageUtils from '../../utils/imageUtils';

// 아이템 데이터 참조
import dotggItem from './setJson/items.json';

/**
 * 소녀전선2: 망령 캐릭터 검색 관련 기능을 담당하는 클래스
 */
class NikkeItemCreate {
  async itemSetAll(): Promise<any> {
    try {
      // API 데이터 가져오기
      /*const dotggItem = await ApiUtils.fetchData(
        'https://api.dotgg.gg/nikke/items',
      );
      console.log(dotggItem);*/

      // 모든 키 값을 저장할 Set 생성
      const uniqueKeys = new Set();

      // dotggItem 배열을 순회하면서 모든 키 수집
      dotggItem.forEach((item) => {
        Object.keys(item).forEach((key) => {
          uniqueKeys.add(key);
        });
      });

      // Set을 배열로 변환하여 출력
      console.log('고유한 키 목록:', Array.from(uniqueKeys));

      // 장비 아이템 기본 구조
      const EquipItemDataJson = {
        _id: '6592806ae67a2e4109278fa3', // 불필요
        id: '3110101', // dotgg 아이템 아이디
        name: 'Kevlar Visor', // 아이템 이름
        description:
          'A device intricately crafted out of Kevlar fiber.\nIts biggest advantage is that it is both light and flexible.\nIn terms of performance, however, it would be best to temper your expectations.',
        itemType: 'Equip', // 아이템 타입
        img: 'icn_equipment_head_attacker_t1', // 아이템 이미지
        class: 'Attacker', // 아이템 클래스
        tier: 1, // 아이템 티어
        part: 'Head', // 아이템 부위
        url: 't1-attacker-head', // 아이템 링크
        stats: {
          Atk: 66, // 아이템 스탯
          Hp: 540, // 아이템 스탯
        },
        __v: 0, // 불필요
      };

      // 선택 상자 아이템 기본 구조
      const boxItemDataJson = {
        _id: '6592806ae67a2e41092790ae', // 불필요
        id: '9201003', // dotgg 아이템 아이디
        name: 'Central Government Supply Chest III', // 아이템 이름
        description:
          'A supply chest which Commanders belonging to the Central Government can receive. \r\n\r\nOpen to choose one from the following: Credit, Battle Data, Core Dust.',
        type: 'SelectBox', // 아이템 타입
        useId: 1003, // 아이템 사용 아이디
        tier: 'SSR', // 아이템 티어
        img: 'icn_consume_selectbox', // 아이템 이미지
        url: 'central-government-supply-chest-iii', // 아이템 링크
        selections: [
          {
            id: 9110005, // dotgg 아이템 아이디
            name: 'Credit Case', // 아이템 이름
            amount: 3, // 아이템 수량
            type: 'Item', // 아이템 타입
            url: 'credit-case', // 아이템 링크
          },
          {
            id: 9120005, // dotgg 아이템 아이디
            name: 'Battle Data Set Case', // 아이템 이름
            amount: 1, // 아이템 수량
            type: 'Item', // 아이템 타입
            url: 'battle-data-set-case', // 아이템 링크
          },
          {
            id: 9140005, // dotgg 아이템 아이디
            name: 'Core Dust Case', // 아이템 이름
            amount: 1, // 아이템 수량
            type: 'Item', // 아이템 타입
            url: 'core-dust-case', // 아이템 링크
          },
        ],
        __v: 0,
      };

      let itemList = [];

      let itemClass = [];

      for (const item of dotggItem) {
        // 아이템 타입 처리
        let itemType = item.type || item.itemType;
        // 기본 데이터 처리
        let levelData = {};
        let itemClassId = 0;
        let itemReferences = {
          set: {
            baseId: item.id,
          },
          Stats: [],
          info: {},
          Refinements: [],
          image: {
            icon: {
              src: '',
            },
          },
        };

        // 아이템 클래스 값이 있고 중복되지 않은 경우에만 추가
        if (item.class && !itemClass.includes(item.class)) {
          itemClass.push(item.class);
        }

        // 장비 아이템 처리
        if (item.class) {
          itemType = 'equipment';
          levelData = {
            stats: {
              Atk: item.stats?.Atk,
              Defence: item.stats?.Defence,
              Hp: item.stats?.Hp,
            },
          };
          itemReferences.set.part = item.part;
          const itemTypeClass = await TypeDef.findOne({
            attributes: ['id'],
            where: {
              'name.en': item.class,
            },
          });
          itemClassId = itemTypeClass.id;
        }
        // 선택 상자 아이템 처리
        if (item.selections) {
          itemType = 'selectbox';
          let selections = [];
          for (const selection of item.selections) {
            selections.push({
              baseId: selection.id,
              name: selection.name,
              amount: selection.amount,
            });
          }
          itemReferences.selections = selections;
        }
        // 아이템 데이터 생성
        const itemData = {
          characterId: 0,
          gameId: 3,
          itemtype: itemType,
          element: 0,
          name: {
            kr: '',
            cn: '',
            jp: '',
            en: item.name,
          },
          desc: {
            data: item.description,
          },
          levelData,
          path: itemClassId, // 아이템 정보 - 화력에 대한 정보
          rarity: item.tier ? item.tier : '0',
          itemReferences,
          skillId: 0,
        };

        itemList.push(itemData);
      }

      console.log(itemClass);
      return itemList;
    } catch (err) {
      console.error('오류 발생:', err);
      throw err;
    }
  }
}

export default new NikkeItemCreate();
