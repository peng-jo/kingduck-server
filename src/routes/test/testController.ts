import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
import youtubedl from 'youtube-dl-exec';
import progressEstimator from 'progress-estimator';
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { StringUtils } from '../../util/StringUtils';
// 데이터 베이스 값 참조

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
  await new Promise((page) => setTimeout(page, 1000));
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
  const title = '천외 위성 통신 ' + data;

  console.log('youtubeVideotitle:' + title);

  // 유튜브 숏츠 영상 긁기 용 - 붕괴 스타레일 특화
  const youtubeDataList = await fetchYoutubePageConfig(
    'https://www.youtube.com/@Honkaistarrail_kr/search?query=' + title,
  );

  let youtubeData =
    youtubeDataList.contents.twoColumnBrowseResultsRenderer.tabs[6]
      .expandableTabRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents[0];

  if (!youtubeData.videoRenderer) {
    console.log(`youtubeVideo : 텍스트에 "${title}"이(가) 검색 되지 않습니다.`);
    return false;
  }

  let youtubeTitle = youtubeData.videoRenderer.title.runs[0].text;
  let youtubeVideoId = youtubeData.videoRenderer.videoId;

  if (youtubeTitle.includes('천외 위성 통신') && youtubeTitle) {
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

export class TestController {
  async get_test(req: Request, res: Response): Promise<void> {
    console.log('----------------------------------');
    console.log('chat');
    console.log('testStringUtils 테스트');
    console.log('----------------------------------');
    // 테스트 함수
    function testStringUtils() {
      // 테스트 데이터
      const testWhitespaceStr = 'Hello\u00A0World!'; // "Hello World!"
      const testDateString = 'January 19th, 2025'; // "2025-01-19"
      const testHyphenStr = 'hello-world-this-is-a-test'; // "Hello World This Is A Test"

      // 공백 변환 테스트
      const normalizedWhitespace =
        StringUtils.normalizeWhitespace(testWhitespaceStr);
      console.log(`Normalized Whitespace: ${normalizedWhitespace}`);
      console.assert(
        normalizedWhitespace === 'Hello World!',
        `Expected "Hello World!", but got "${normalizedWhitespace}"`,
      );

      // 날짜 형식 변환 테스트
      const formattedDate = StringUtils.formatDateString(testDateString);
      console.log(`Formatted Date: ${formattedDate}`);
      console.assert(
        formattedDate === '2025-01-19',
        `Expected "2025-01-19", but got "${formattedDate}"`,
      );

      // 하이픈 치환 및 대문자 변환 테스트
      const capitalizedStr =
        StringUtils.replaceHyphensAndCapitalize(testHyphenStr);
      console.log(`Capitalized String: ${capitalizedStr}`);
      console.assert(
        capitalizedStr === 'Hello World This Is A Test',
        `Expected "Hello World This Is A Test", but got "${capitalizedStr}"`,
      );
    }

    // 테스트 실행
    testStringUtils();
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
        console.log('item.name.kr:' + item.name.kr);

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
          {
            namd: '라파',
            youtubeid: 'gvCoIwJwq4E',
          },
          {
            namd: '더 헤르타',
            youtubeid: '8Uz4iwWSjCQ',
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
}

export default new TestController();
