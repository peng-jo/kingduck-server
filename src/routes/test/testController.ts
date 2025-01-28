import { Request, Response } from 'express';
import fs from 'fs';
import * as ApiUtils from '../../utils/apiUtils';
import * as DateUtils from '../../utils/dateUtils';
import * as ImageUtils from '../../utils/imageUtils';
import * as StringUtils from '../../utils/stringUtils';
import { fetchAndDownloadVideo } from '../../utils/youtubeUtils';
import namuWiki from '../../utils/namuWikiUtils';
import path from 'path';

import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import GirlsFrontline2CharacterSearch from '../../manager/GirlsFrontline2/CharacterSearch';

export class TestController {
  async getCodeTest(req: Request, res: Response): Promise<void> {
    console.log('----------------------------------');
    console.log('유틸리티 테스트 시작');
    console.log('----------------------------------');

    // API 유틸리티 테스트
    async function testApiUtils() {
      console.log('\n=== API Utils 테스트 ===');
      try {
        // 테스트용 API 엔드포인트
        const testUrl = 'https://api.hakush.in/hsr/data/character.json';
        const data = await ApiUtils.fetchData(testUrl);
        console.log('fetchData 결과:', data);

        // pageConfig 테스트는 실제 엔드포인트로 대체 필요
        const testUrl2 = 'https://starrailstation.com/kr/characters';
        const pageConfig = await ApiUtils.fetchPageConfig(testUrl2);
        console.log('fetchPageConfig 결과:', pageConfig);
      } catch (error) {
        console.error('API Utils 테스트 실패:', error);
      }
    }

    // 날짜 유틸리티 테스트
    function testDateUtils() {
      console.log('\n=== Date Utils 테스트 ===');
      try {
        const testDates = [
          '2024-01-01',
          '2024-01-01T12:00:00',
          '2023-12-25',
          'January 19, 2025',
        ];

        testDates.forEach((date) => {
          // 날짜만 포맷
          const formattedDate = DateUtils.formatDateString(date);
          console.log(`날짜 변환 - 원본: ${date} -> 변환: ${formattedDate}`);

          // 날짜와 시간 포맷
          const formattedDateTime = DateUtils.formatDateTimeString(date);
          console.log(
            `날짜시간 변환 - 원본: ${date} -> 변환: ${formattedDateTime}`,
          );
          console.log('---');
        });

        // 특정 케이스에 대한 검증
        const testDate = '2024-01-01';
        const formatted = DateUtils.formatDateString(testDate);
        console.assert(
          formatted === '2024-01-01',
          `Expected "2024-01-01", but got "${formatted}"`,
        );
      } catch (error) {
        console.error('Date Utils 테스트 실패:', error);
      }
    }

    // 이미지 유틸리티 테스트
    async function testImageUtils() {
      console.log('\n=== Image Utils 테스트 ===');
      try {
        const imageUrl =
          'https://cdn.starrailstation.com/assets/90860f74a8125312633b3adb2f21f1a7f56f717fecc5883c0c8bb65fa036bc71.webp';
        const directory = path.join(__dirname, '../../../test-images');
        const filename = 'test-image.jpg';

        await ImageUtils.downloadImage(imageUrl, directory, filename);
        console.log(`이미지 다운로드 완료: ${directory}/${filename}`);
      } catch (error) {
        console.error('Image Utils 테스트 실패:', error);
      }
    }

    // 문자열 유틸리티 테스트
    function testStringUtils() {
      console.log('\n=== String Utils 테스트 ===');
      try {
        // 공백 정규화 테스트
        const testWhitespaceStr = 'Hello\u00A0World!   Test    String';
        const normalizedWhitespace =
          StringUtils.normalizeWhitespace(testWhitespaceStr);
        console.log(`정규화된 문자열: "${normalizedWhitespace}"`);
        console.assert(
          normalizedWhitespace === 'Hello World! Test String',
          '공백 정규화 테스트 실패',
        );

        // 하이픈 변환 및 대문자화 테스트
        const testHyphenStr = 'hello-world-this-is-a-test';
        const capitalizedStr =
          StringUtils.replaceHyphensAndCapitalize(testHyphenStr);
        console.log(`변환된 문자열: "${capitalizedStr}"`);
        console.assert(
          capitalizedStr === 'Hello World This Is A Test',
          '하이픈 변환 테스트 실패',
        );
      } catch (error) {
        console.error('String Utils 테스트 실패:', error);
      }
    }

    // YouTube 유틸리티 테스트
    async function testYoutubeUtils() {
      console.log('\n=== YouTube Utils 테스트 ===');
      try {
        const searchTerm = '「천외 위성 통신」 | 망귀인';
        const result = await fetchAndDownloadVideo(
          searchTerm,
          'https://www.youtube.com/@Honkaistarrail_kr',
        );
        console.log('YouTube 검색 결과:', result);
      } catch (error) {
        console.error('YouTube Utils 테스트 실패:', error);
      }
    }

    // 모든 테스트 실행
    try {
      //await testApiUtils();
      testDateUtils();
      await testImageUtils();
      testStringUtils();
      await testYoutubeUtils();

      console.log('\n----------------------------------');
      console.log('모든 테스트 완료');
      console.log('----------------------------------');

      res.status(200).json({ message: '테스트 완료' });
    } catch (error) {
      console.error('테스트 실행 중 오류 발생:', error);
      res.status(500).json({ error: '테스트 실행 중 오류 발생' });
    }
  }
  // 유튜브 크롤링 후 영상 다운로드 처리 구현
  // 파이썬 3.7 이상 설치 필요
  // 파이썬 전역 변수가 잘 되어있는지 확인 필요
  // youtube-dl 설치 필요 : pip install youtube-dl
  // ffmpeg 설치 필요 - 전역 변수 설정 필요 x - 설치 경로 필요
  // 참조 : https://github.com/microlinkhq/youtube-dl-exec
  async get_youtubeTest(req: any, res: any): Promise<void> {
    let CharacterData: any = await Character.findAll();

    let youtubeData = [];

    if (CharacterData) {
      // 타입이 string로 처리 되어있어 ( 추후 복수의 속성 값이 있을수 있다는 판단으로 )
      for (const item of Object.values(CharacterData)) {
        console.log('name.kr:' + item.name.kr);

        /*
        let youtubeVideoData = await youtubeVideo(item.name.kr);
        if (youtubeVideoData) {
          let set = {
            namd: item.name.kr,
            youtubeid: youtubeVideoData,
          };
          youtubeData.push(set);
        }
          */
        const video = [
          {
            namd: '초구',
            youtubeid: '71qwZ3_5_Q4',
          },
          {
            namd: '비소',
            youtubeid: 'Rnye_gfZTns',
          },
          {
            namd: '운리',
            youtubeid: '7bBbsyu_Jb8',
          },
          {
            namd: '영사',
            youtubeid: 'Zs-6PEmzmVA',
          },
          {
            namd: '맥택',
            youtubeid: 'JMrhBxFc-38',
          },
          {
            namd: '반디',
            youtubeid: 'X4W7x_xwVx4',
          },
          {
            namd: '선데이',
            youtubeid: 'KaXVLK_abbU',
          },
          {
            namd: '제이드',
            youtubeid: 'u0mso6UK29s',
          },
        ];

        const youtubeDataList: any = video.find(
          (fitem) => fitem.namd === item.name.kr,
        );

        if (youtubeDataList) {
          // 유튜브 정보 처리
          let setCharacterVideo = {
            characterId: item.id,
            backgroundColor: '#ffffff',
            layout: 'video', // 이미지 옵셋 - card:리스트 / art: 페이지별 이미지
            url: 'assets/video/' + youtubeDataList.youtubeid,
          };
          console.log(setCharacterVideo);

          // 캐릭터 이미지 저장 - 카드형
          const createCharacterVideo =
            await CharacterImage.create(setCharacterVideo);
        }
      }
    }

    res.status(200).json({});
  }
  /**
   * 나무위키 본문 내용 추출 API
   * 1. 나무위키 URL에서 HTML 가져오기
   * 2. 본문 내용 파싱
   * 3. 결과 반환
   */
  async getcharacterListContent(req: any, res: any): Promise<void> {
    let TestLog: any[] = [];
    let browser;
    console.log('나무위키 캐릭터 페이지 분석중');
    const startTime = Date.now();
    // 캐릭터 상세 페이지 로드
    const characterPageUrl = `https://namu.wiki/w/%ED%81%B4%EB%A3%A8%EC%B9%B4%EC%9D%B4(%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85)`;
    const characterPage = await namuWiki.fetchNamuWikiPage(characterPageUrl);
    browser = characterPage.browser();

    // 링크 관련 처리
    let characterJson: any;

    try {
      // 캐릭터 상세 정보 추출
      const characterData =
        await GirlsFrontline2CharacterSearch.InfoNamuWikiSearch(characterPage);
      characterJson = characterData;
      console.log('나무위키 캐릭터 페이지 분석 완료');
    } catch (error) {
      console.error(`캐릭터 정보 추출 실패`, error);
    } finally {
      // 브라우저 리소스 정리
      await characterPage.browser().close();
    }
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`분석 소요 시간: ${duration}ms`);

    res.status(200).json({ character: characterJson.extractedData });
  }
}

export default new TestController();
