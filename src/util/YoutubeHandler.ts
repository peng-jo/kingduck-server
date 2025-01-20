import puppeteer from 'puppeteer';
import youtubedl from 'youtube-dl-exec';
import path from 'path';

// 유튜브 처리 클래스
class YoutubeHandler {
  // YouTube 페이지 설정을 추출하는 함수
  static async getPageConfig(url: string): Promise<any> {
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
    // 페이지 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // ytInitialData 값 추출
    const pageConfig = await page.evaluate(() => {
      return ytInitialData;
    });

    // 브라우저 종료
    await browser.close();
    return pageConfig;
  }

  // 비디오 다운로드 함수
  static async downloadYoutubeVideo(
    url: string,
    fileName: string,
  ): Promise<boolean> {
    try {
      const saveDirectory = path.join(__dirname, '../../../static/video/');

      // youtube-dl-exec를 사용하여 비디오를 다운로드합니다.
      // 필수 설치 항목:
      // 1. youtube-dl-exec: 비디오 다운로드를 위한 라이브러리
      //    설치 명령어: npm install youtube-dl-exec
      //
      // 2. ffmpeg: 비디오 및 오디오 파일의 포맷 변환을 위한 소프트웨어
      //    설치 방법:
      //    - 윈도우: https://ffmpeg.org/download.html 에서 다운로드 후 설치
      //    - 환경 변수에 ffmpeg.exe 경로를 추가하거나, 아래처럼 명시적으로 경로 지정
      await youtubedl(url, {
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

  // 비디오 다운로드를 위한 함수
  static async downloadVideoById(videoId: string): Promise<boolean> {
    const url = 'https://www.youtube.com/watch?v=' + videoId;
    console.log(`Obtaining ${url}`);
    return await this.downloadYoutubeVideo(url, videoId);
  }

  // 유튜브 비디오를 처리하는 함수
  static async fetchAndDownloadVideo(
    searchQuery: string,
    searchChannelUrl: string,
  ): Promise<string | boolean> {
    const title = '「천외 위성 통신」 | ' + searchQuery;

    // 유튜브 숏츠 영상 긁기 용 - 붕괴 스타레일 특화
    const youtubeDataList = await this.getPageConfig(
      searchChannelUrl + '/search?query=' + searchQuery,
    );

    // 데이터 기본 처리
    let youtubeData =
      youtubeDataList.contents.twoColumnBrowseResultsRenderer.tabs[6]
        .expandableTabRenderer.content.sectionListRenderer.contents[0]
        .itemSectionRenderer.contents[0];

    // 만약 비디오 데이터가 없는 경우
    if (!youtubeData.videoRenderer) {
      console.log(
        `youtubeVideo : 텍스트에 "${title}"이(가) 검색 되지 않습니다.`,
      );
      return false;
    }

    let youtubeTitle = youtubeData.videoRenderer.title.runs[0].text;
    let youtubeVideoId = youtubeData.videoRenderer.videoId;

    // 해당 검색어가 포함 되는지 여부를 체크
    // EX) "헤르타" -> "천외 위성 통신 | 더 헤르타" = TRUE
    if (youtubeTitle.includes(title)) {
      console.log(
        `fetchAndDownloadVideo: 텍스트에 "${title}"이(가) 포함되어 있습니다.`,
      );
      await this.downloadVideoById(youtubeVideoId);
      return youtubeVideoId;
    } else {
      console.log(
        `fetchAndDownloadVideo: 텍스트에 "${title}"이(가) 포함되어 있지 않습니다.`,
      );
      return false;
    }
  }
}

// 클래스를 외부에서 사용할 수 있도록 내보내기
export default YoutubeHandler;
