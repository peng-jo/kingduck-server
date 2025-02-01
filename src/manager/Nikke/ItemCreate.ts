import path from 'path';
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
 * 니케 아이템 생성 관련 기능을 담당하는 클래스
 */
class NikkeItemCreate {
  async itemSetAll(): Promise<any> {
    try {
      console.log('니케: 아이템 불러오기 dotgg 시작');
      // API 데이터 가져오기
      const dotggItem = await ApiUtils.fetchData(
        'https://api.dotgg.gg/nikke/items',
      );

      console.log('니케: 아이템 불러오기 완료');

      // 모든 키 값을 저장할 Set 생성
      const uniqueKeys = new Set();

      // dotggItem 배열을 순회하면서 모든 키 수집
      dotggItem.forEach((item) => {
        Object.keys(item).forEach((key) => {
          uniqueKeys.add(key);
        });
      });

      let itemList = [];
      let errorItemList = [];

      for (const item of dotggItem) {
        // 아이템 타입 처리
        let itemType = item.type || item.itemType;
        // 기본 데이터 처리
        let levelData = {};
        let itemClassId = 0;

        // 이미지 파일명 생성
        const imageName = uuidv4().replace(/-/g, '');
        const imageDir = 'assets/image/nikke/item/' + imageName + '.webp';

        // 중복 체크
        const existingItem = await Item.findOne({
          where: {
            'name.en': item.name,
          },
          raw: true,
        });

        if (existingItem) {
          console.log('이미 존재하는 아이템');
          continue;
        }

        let itemReferences = {
          set: {
            baseId: item.id,
          },
          Stats: [],
          info: {},
          Refinements: [],
          image: {
            icon: {
              src: imageDir,
            },
          },
        };

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

        // 이미지 다운로드
        const imageUrl = `https://static.dotgg.gg/nikke/items/${item.img}.webp`;
        console.log(imageUrl);

        const directory = path.join(
          __dirname,
          '../../../static/image/nikke/item',
        );
        const filename = `${imageName}.webp`;
        try {
          await ImageUtils.downloadImage(imageUrl, directory, filename);
        } catch (error) {
          console.log('이미지 다운로드 실패:', imageUrl);
          errorItemList.push({ name: item.name, id: item.id });
          continue;
        }

        // DB에 아이템 저장
        await Item.create(itemData);

        itemList.push(itemData);
      }

      return { itemList, errorItemList };
    } catch (err) {
      console.error('오류 발생:', err);
      throw err;
    }
  }
}

export default new NikkeItemCreate();
