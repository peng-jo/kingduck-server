// 필수 모듈 임포트
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JSDOM } from 'jsdom';

// 데이터베이스 모델 임포트
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { Item } from '../../models/Item/ItemDef.Vo';
import { SkillImage } from '../../models/skill/SkillImage.Vo';
import { Skill } from '../../models/skill/SkillDef.Vo';

// 유틸리티 함수 임포트
import { formatDateString } from '../../utils/dateUtils';
import { fetchData } from '../../utils/apiUtils';
import * as ImageUtils from '../../utils/imageUtils';
import namuWiki from '../../utils/namuWikiUtils';

// 참조한 유틸
import NikkeCharacterSearch from './CharacterSearch';

/**
 * 데이터를 파일로 저장하는 함수
 * @param hakushData hakush API 데이터
 * @param starrailstationData starrailstation API 데이터
 */
const saveDataToFile = (prydwenData: any, prydwenFilename: string): void => {
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
    path.join(saveDirectory, `${prydwenFilename}_${dateString}.json`),
    JSON.stringify(prydwenData, null, 2),
  );
};

export class NikkeCharacterCreate {
  async CharacterSet() {
    console.log('----------------------------------');
    console.log('캐릭터 삽입 - 승리의 여신 : 니케');
    console.log('----------------------------------');

    // 외부 API에서 캐릭터 데이터 가져오기
    const dotggData = await fetchData('https://api.dotgg.gg/nikke/characters');

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(dotggData, 'dotggCharacter');
      console.log('json 데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    // 외부 API에서 캐릭터 데이터 가져오기
    const prydwenData = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2474920082.json',
    );

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(prydwenData, 'prydwenCharacter');
      console.log('json 데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    let browser;
    let references: any;
    let NikkeCharacterList: any;

    try {
      console.log('나무위키 리스트 페이지 분석중');
      const startTime = Date.now();
      const url =
        'https://namu.wiki/w/%EB%8B%88%EC%BC%80(%EC%8A%B9%EB%A6%AC%EC%9D%98%20%EC%97%AC%EC%8B%A0:%20%EB%8B%88%EC%BC%80)';

      if (!url) {
        console.error('나무위키 참조중 에러: URL이 필요합니다.');
        return false;
      }

      // 나무위키 페이지 불러오기
      const page = await namuWiki.fetchNamuWikiPage(url);
      browser = page.browser();

      // 본문 내용 추출
      const NikkeCharacterSearchData =
        await NikkeCharacterSearch.ListNamuWikiSearch(page);
      // null 값 제거
      NikkeCharacterSearchData.referenceElements =
        NikkeCharacterSearchData.referenceElements[0].filter(
          (item: any) => item !== null,
        );
      NikkeCharacterList = NikkeCharacterSearchData.referenceElements;
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`분석 소요 시간: ${duration}ms`);
      console.log('나무위키 리스트 페이지 분석 완료');
    } catch (error) {
      console.error('나무위키 참조중 에러:', error);
    }

    // 캐릭터 리스트 따오는 것 까지 완료

    return NikkeCharacterList;
  }
}

export default new NikkeCharacterCreate();
