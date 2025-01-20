import axios from 'axios';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

class DataFetcher {
  // 이미지 다운로드 함수
  static async downloadImage(
    imageUrl: string,
    saveDirectory: string,
    fileName: string,
  ): Promise<void> {
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

  // JSON 데이터를 가져오는 함수
  static async fetchJsonData(url: string): Promise<any> {
    try {
      const response = await axios.get(url);
      const data = response.data;
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }

  // 페이지 설정을 가져오는 함수
  static async getPageConfig(
    url: string,
    waitTime: number,
    configSelector: string,
  ): Promise<any> {
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
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // window에서 특정 값을 추출
    const pageConfig = await page.evaluate((selector) => {
      return window[selector];
    }, configSelector);

    // 브라우저 종료
    await browser.close();
    return pageConfig;
  }

  // 나무위키 페이지에서 <body> 태그를 크롤링하는 함수
  static async getNamuWikiBody(url: string, waitTime: number): Promise<string> {
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
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // <body> 태그의 HTML을 가져옴
    const bodyHTML = await page.evaluate(() => {
      return document.body.innerHTML;
    });

    // 브라우저 종료
    await browser.close();
    return bodyHTML;
  }
}

// 클래스를 외부에서 사용할 수 있도록 내보내기
export default DataFetcher;
