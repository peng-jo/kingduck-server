import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// 데이터 베이스 값 참조
import { Item } from '../../models/Item/ItemDef.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';

// 참조한 유틸
import NamuWiki from '../../utils/NamuWikiUtils';
import GirlsFrontline2ItemSearch from './ItemSearch';
import * as ImageUtils from '../../utils/imageUtils';

// 테스트를 위해서 임의 추가 항목
import itemListData from './setJosn/itemTest.json';

/**
 * 소녀전선2: 망령 캐릭터 검색 관련 기능을 담당하는 클래스
 */
class GirlsFrontline2ItemCreate {
  /**
   * 나무위키 페이지에서 아이템 정보를 검색하는 메서드
   * @param pageUrl 검색할 나무위키 페이지 URL
   * @returns 추출된 아이템 정보
   */
  async itemSearch(pageUrl: string): Promise<any> {
    try {
      let browser;
      console.log(`페이지 처리 시작`);

      // 나무위키 페이지 불러오기
      const page = await NamuWiki.fetchNamuWikiPage(pageUrl);
      browser = page.browser();

      const title = await page.title();
      console.log('페이지 제목:', title);
      console.log('페이지 URL:', page.url());

      // 아이템 정보 추출
      const references: any =
        await GirlsFrontline2ItemSearch.NamuWikiSearch(page);
      console.log('추출된 아이템 정보:', title);

      await browser.close();
      return references;
    } catch (err) {
      console.error('오류 발생:', err);
      throw err;
    }
  }

  /**
   * 모든 아이템 정보를 수집하고 데이터베이스에 저장하는 메서드
   * @returns 처리된 아이템 목록
   */
  async itemSetAll(): Promise<any> {
    try {
      // 수집할 무기 카테고리별 URL 목록
      const url = [
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EA%B6%8C%EC%B4%9D',
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EA%B8%B0%EA%B4%80%EB%8B%A8%EC%B4%9D',
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EC%A0%80%EA%B2%A9%EC%86%8C%EC%B4%9D',
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EB%8F%8C%EA%B2%A9%EC%86%8C%EC%B4%9D',
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EA%B8%B0%EA%B4%80%EC%B4%9D',
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EC%82%B0%ED%83%84%EC%B4%9D',
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95%20%EB%AC%B4%EA%B8%B0/%EB%8F%84%EA%B2%80',
      ];

      // 무기 타입 ID 매핑
      const itemListType = [
        21, // 권총
        21, // 기관단총
        23, // 저격총
        22, // 소총
        23, // 기관총
        24, // 산탄총
        25, // 도검
      ];

      // 무기 타입명 매핑
      const itemListwp = [
        '권총',
        '기관단총',
        '저격소총',
        '돌격소총',
        '기관총',
        '산탄총',
        '도검',
      ];

      let result: any[] = [];
      let itemListTypeCount = 0;

      // URL 목록을 순회하며 각 페이지 처리
      for (const pageUrl of url) {
        const itemListData = await this.itemSearch(pageUrl);
        const itemList = itemListData.referenceElements;

        if (Array.isArray(itemList)) {
          let itemlist = [];
          console.log('itemList 길이:', itemList.length);

          // 각 아이템 정보 처리
          for (const item of itemList) {
            // 아이템 이름 추출
            const itemName = item[0]?.value || '';
            if (!itemName) {
              console.log('이름이 없어 건너뜁니다');
              continue;
            }
            console.log('itemName:', itemName);

            // 중복 체크
            const existingItem = await Item.findOne({
              where: {
                'name.kr': itemName,
              },
              raw: true,
            });

            if (existingItem) {
              console.log('이미 존재하는 아이템');
              continue;
            }

            // 이미지 정보 추출
            const itemImage = item[1]?.value || '';
            const imgSrcMatch = itemImage.match(/src='([^']+)'/);
            const itemImageSrc = imgSrcMatch ? 'http://' + imgSrcMatch[1] : '';

            if (!itemImageSrc) {
              console.log('이미지 URL이 없어 건너뜁니다:', itemName);
              continue;
            }

            // 등급 설정
            let rarity;
            if (item.length === 5) {
              rarity = '구형';
            } else if (item.length >= 6) {
              const itemStats =
                item.find((arr: any) => arr.title === '능력치')?.value || [];
              rarity = itemStats.length >= 2 ? '정예' : '표준';
            }

            // 능력치 정보 처리
            const itemStats =
              item.find((arr: any) => arr.title === '능력치')?.value || [];
            const processedStats = itemStats.map((stat: any) => ({
              attribute: stat.left.replace(/<[^>]*>/g, '').trim(),
              value: stat.right,
            }));

            // 무기 특성 및 기타 정보 추출
            const itemSkill =
              item.find((arr: any) => arr.title === '무기 특성')?.value || '';
            const itemFeature =
              item.find((arr: any) => arr.title === '특성')?.value || '';

            // 각인 강화 정보 처리
            const itemEngraving =
              item.find((arr: any) => arr.title === '각인 강화')?.value || [];
            const processedEngraving = itemEngraving.map((engraving: any) => {
              if (engraving.aTagText) {
                const splitText = engraving.aTagText.split('-');
                return {
                  character: splitText[1] || '',
                  feature: engraving.remainText || '',
                };
              }
              return engraving;
            });

            // 다국어 이름 처리
            const itemNameList =
              item.find((arr: any) => arr.title === '언어별 표기')?.value || '';
            const cleanedNameList = itemNameList
              .replace(/<[^>]*>/g, '')
              .trim()
              .split(/\s+/);
            const nameListValues = {
              kr: itemName,
              cn: cleanedNameList[2],
              jp: cleanedNameList[3],
              en: cleanedNameList[1],
            };

            // 이미지 파일명 생성
            const imageName = uuidv4().replace(/-/g, '');
            const imageDir =
              'assets/image/GirlsFrontline2Exilium/item/' + imageName + '.webp';

            // 아이템 데이터 구성
            const itemData = {
              characterId: 0,
              gameId: 2,
              itemtype: 'weapon',
              element: 0,
              name: nameListValues,
              desc: {},
              path: itemListType[itemListTypeCount],
              rarity: rarity,
              levelData: {},
              itemReferences: {
                weapon: itemListwp[itemListTypeCount],
                set: itemFeature,
                Stats: processedStats,
                info: processedEngraving[0],
                Refinements: itemSkill,
                image: {
                  art: {
                    src: imageDir,
                  },
                },
              },
              skillId: 0,
            };

            itemlist.push(itemData);

            // DB에 아이템 저장
            await Item.create(itemData);

            // 이미지 다운로드
            const imageUrl = itemImageSrc;
            const directory = path.join(
              __dirname,
              '../../../static/image/GirlsFrontline2Exilium/item',
            );
            const filename = `${imageName}.webp`;

            await ImageUtils.downloadImage(imageUrl, directory, filename);
          }
          result.push(itemlist);
        }
        itemListTypeCount++;
      }
      return result;
    } catch (err) {
      console.error('오류 발생:', err);
      throw err;
    }
  }
}

export default new GirlsFrontline2ItemCreate();
