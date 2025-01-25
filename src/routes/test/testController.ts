import { Request, Response } from 'express';
import fs from 'fs';
import * as ApiUtils from '../../utils/apiUtils';
import * as DateUtils from '../../utils/dateUtils';
import * as ImageUtils from '../../utils/imageUtils';
import * as StringUtils from '../../utils/stringUtils';
import YoutubeUtils, { fetchAndDownloadVideo } from '../../utils/youtubeUtils';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import puppeteer from 'puppeteer';

// 나무위키 참조 처리
async function fetchNamuWikiPage(url: string) {
  let browser;
  try {
    // 브라우저 실행
    browser = await puppeteer.launch();
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
    await new Promise((resolve) => setTimeout(resolve, 10000));

    return page;
  } catch (error) {
    console.error('페이지 로딩 중 오류:', error);
    if (browser) await browser.close();
    throw error;
  }
}

// 나무위키 소녀전선2 캐릭터 리스트 처리
async function GirlsFrontline2CharacterListSearch(page: any) {
  try {
    // 본문 내용 추출
    const references = await page.evaluate(() => {
      const referenceElements = Array.from(
        document.querySelectorAll('._77e71e6e419071cb32f095b2bee8b744'),
      )
        .map((tr) => {
          const tds = tr.querySelectorAll('td');
          if (tds.length >= 2) {
            const imgElement = tds[0]?.querySelector('img[loading="lazy"]');
            const titleElement = tds[0]?.querySelector('strong');
            const divElement = tds[0]?.querySelector(
              'div[style="margin-top:-1px;font-size:0.65em"]',
            );

            const linkElements = tds[1]?.querySelectorAll('a');
            const links = Array.from(linkElements || [])
              .map((link) => {
                const title = link.getAttribute('title');
                if (!title) return null;
                return {
                  title: title,
                  href: link.getAttribute('href') || '',
                };
              })
              .filter((link) => link !== null);

            return {
              title: {
                image: imgElement?.src || '',
                title: titleElement?.textContent?.trim() || '',
                subTitle: divElement?.textContent?.trim() || '',
              },
              links: links || '',
              length: tds.length,
            };
          }
          return null;
        })
        .filter((item) => item !== null);
      return {
        referenceElements,
      };
    });
    return references;
  } catch (error) {
    console.error('데이터 추출 중 오류:', error);
    throw error;
  }
}

// 나무위키 소녀전선2 캐릭터 정보 처리
async function GirlsFrontline2CharacterInfoSearch(page: any) {
  try {
    // 본문 내용 추출
    const references = await page.evaluate(() => {
      // 안전한 텍스트 추출 헬퍼 함수
      const safeGetText = (element: Element | null): string => {
        return element?.textContent?.trim() || '';
      };

      // 테이블 행 데이터 추출 함수
      const CharacterInfoTableRows = (trElements: any, keyword: string) => {
        return trElements
          .map((tr) => {
            const tds = Array.from(tr.querySelectorAll('td'));
            return tr.textContent.includes(keyword)
              ? {
                  type: tds[0]?.textContent?.trim() || '',
                  value: tds[1]?.textContent?.trim() || '',
                }
              : null;
          })
          .filter((item) => item !== null);
      };

      const SkillTableRows = (trElements: any) => {
        return trElements
          .map((tr) => {
            const tds = Array.from(tr.querySelectorAll('td'));
            return tr?.textContent?.includes('일반공격') ||
              tr?.textContent?.includes('액티브') ||
              tr?.textContent?.includes('결전기') ||
              tr?.textContent?.includes('패시브')
              ? {
                  image: tds[0]?.textContent?.trim() || '',
                  value: {
                    title:
                      tds[1]?.querySelector('strong')?.textContent?.trim() ||
                      '',
                    description:
                      tds[1]?.textContent
                        ?.replace(
                          tds[1]?.querySelector('strong')?.textContent || '',
                        )
                        ?.trim() || '',
                  },
                }
              : null;
          })
          .filter((item) => item !== null);
      };

      // 캐릭터 정보 추출
      const characterElements = Array.from(
        document.querySelectorAll('._77e71e6e419071cb32f095b2bee8b744') || [],
      )
        .map((tr) => {
          try {
            const nameElement = tr.querySelector(
              '._f2e45c8c47fa444a1b8d9d005ec3b518',
            );
            if (!nameElement) return null;
            let nameKr = '';
            let nameEn = '';
            if (nameElement) {
              const strongElement = nameElement.querySelector('strong');

              const spanElement = strongElement.querySelector('span');
              nameKr = spanElement?.textContent?.trim() || '';
              nameEn =
                nameElement.textContent
                  ?.replace(strongElement.textContent || '', '')
                  .trim() || '';
            }
            const imageElement = tr.querySelector('td.J0-mIdx0 img._66lDSM6b');
            const imageSrc = imageElement?.src || '';

            // 레어도 정보 추출
            const tds = Array.from(
              tr.querySelectorAll('td._dc7c67fe280cc9a49a3a67c43813ded9'),
            );
            const trElements = Array.from(tds).map((td) => td.closest('tr'));

            // tr 데이터 추출
            const rarityData = CharacterInfoTableRows(trElements, '레어도');
            const affiliation = CharacterInfoTableRows(trElements, '소속');
            const type = CharacterInfoTableRows(trElements, '속성');
            const corp = CharacterInfoTableRows(trElements, '직업');
            const weapon = CharacterInfoTableRows(trElements, '무기');
            const modal = CharacterInfoTableRows(trElements, '모델');
            const nameList = CharacterInfoTableRows(trElements, '언어별 표기');
            const voice = CharacterInfoTableRows(trElements, '성우');

            return {
              name: {
                kr: nameKr,
                en: nameEn,
              },
              image: imageSrc,
              rarity: rarityData,
              affiliation: affiliation,
              type: type,
              corp: corp,
              weapon: weapon,
              modal: modal,
              nameList: nameList,
              voice: voice,
            };
          } catch (err) {
            console.error('캐릭터 정보 추출 중 오류:', err);
            return null;
          }
        })
        .filter((item) => item !== null);

      // 스킬 정보 추출
      const skillElements = Array.from(
        document.querySelectorAll('._38f185c22e4e5a213c9fed06728e5821') || [],
      )
        .map((element) => {
          try {
            const tds = Array.from(
              element.querySelectorAll('img[loading="lazy"]'),
            );

            let SKillTitleElement;

            const trElements = Array.from(tds).map((td) => td.closest('tr'));
            if (trElements) {
              SKillTitleElement = SkillTableRows(trElements);
            }
            // colspan="2" 태그를 가진 td 엘리먼트 찾기
            const skillDescTds = Array.from(
              element.querySelectorAll('td[colspan="2"]'),
            );

            // 스킬 설명 텍스트 추출
            let skillDescription = '';
            let skillDetailContent = {};
            if (skillDescTds.length > 0) {
              skillDescription = skillDescTds[0].textContent?.trim() || '';
              // 두 번째 td에서 dl 태그 찾기
              if (skillDescTds.length > 1) {
                const dlElement = skillDescTds[1].querySelector('dl');
                if (dlElement) {
                  // dt 태그에서 타이틀 추출
                  const dtElement = dlElement.querySelector('dt');
                  if (dtElement) {
                    skillDetailContent.title =
                      dtElement.textContent?.trim() || '';
                  }

                  // dd > table > tbody > tr > td 경로의 HTML 저장
                  const tdElement = dlElement.querySelector(
                    'dd table tbody tr td',
                  );
                  if (tdElement) {
                    skillDetailContent.content = tdElement.outerHTML;
                  }
                }
              }
            }
            // 스킬 값에 추가
            return {
              title: SKillTitleElement,
              description: skillDescription,
              detail: skillDetailContent,
            };
          } catch (err) {
            console.error('스킬 정보 추출 중 오류:', err);
            return null;
          }
        })
        .filter((item) => item !== null);

      // 뉴럴 업그레이드 정보 추출
      const neuralElements = Array.from(
        document.querySelectorAll('._6803dcde6a09ae387f9994555e73dfd7') || [],
      )
        .map((element) => {
          try {
            // 테이블 제목 추출 (colspan="3" 태그를 가진 td 엘리먼트 찾기)
            const titleElement = element.querySelector('td[colspan="3"]');
            const title = titleElement?.textContent?.trim() || '';

            // 테이블 제목에 따라 다른 처리
            if (title == '키 리스트') {
              // 키 리스트 테이블 처리
              const keyRows = element.querySelectorAll('tr')
                ? Array.from(element.querySelectorAll('tr'))
                : [];
              const keyData = keyRows
                .map((tr) => {
                  const tds = Array.from(tr.querySelectorAll('td'));
                  if (tds.length > 1) {
                    // tds의 각 요소 순회하며 내용 확인
                    let cells: any = [];
                    tds.forEach((td, idx) => {
                      cells.push({
                        idx: idx,
                        html: td.innerHTML,
                        text: td.textContent,
                      });
                    });
                    return cells;
                  }
                })
                .filter((row) => row !== null);

              return {
                type: 'keyList',
                data: keyData,
                length: keyData.length,
              };
            } else if (title === '효과') {
              // 키 리스트 테이블 처리
              const mindSetRows = element.querySelectorAll('tr')
                ? Array.from(element.querySelectorAll('tr'))
                : [];
              const mindSetData = mindSetRows
                .map((tr) => {
                  const tds = Array.from(tr.querySelectorAll('td'));
                  if (tds.length > 1) {
                    // tds의 각 요소 순회하며 내용 확인
                    let cells: any = [];
                    tds.forEach((td, idx) => {
                      cells.push({
                        idx: idx,
                        html: td.innerHTML,
                        text: td.textContent,
                      });
                    });
                    return cells;
                  }
                })
                .filter((row) => row !== null);

              return {
                type: 'mindSet',
                data: mindSetData,
                length: mindSetData.length,
              };
            } else {
              return null;
            }
          } catch (err) {
            console.error('뉴럴 정보 추출 중 오류:', err);
            return null;
          }
        })
        .filter((item) => item !== null);

      return {
        extractedData: {
          characters: characterElements,
          skills: skillElements,
          neural: neuralElements,
        },
      };
    });

    return references;
  } catch (error) {
    console.error('데이터 추출 중 오류:', error);
    return {
      extractedData: {
        characters: [],
        skills: [],
        neural: [],
      },
    };
  }
}

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
  async getNamuWikiContent(req: any, res: any): Promise<void> {
    let browser;
    try {
      const url =
        'https://namu.wiki/w/%EC%86%8C%EB%85%80%EC%A0%84%EC%84%A02:%20%EB%A7%9D%EB%AA%85/%EC%9D%B8%ED%98%95';

      if (!url) {
        return res.status(400).json({
          resultCode: 400,
          resultMsg: 'URL이 필요합니다',
        });
      }

      // 나무위키 페이지 불러오기
      const page = await fetchNamuWikiPage(url);
      browser = page.browser();

      // 본문 내용 추출
      let characterList = [];
      let setCharacterList = 0;
      const references: any = await GirlsFrontline2CharacterListSearch(page);

      // 브라우저 종료
      await browser.close();
      // 참조 데이터가 존재하는지 확인
      if (references && references?.referenceElements.length > 0) {
        // references 데이터를 JSON 파일로 저장
        try {
          const jsonData = JSON.stringify(references, null, 2);
          await fs.promises.writeFile('listtest.json', jsonData, 'utf8');
          console.log('참조 정보가 listtest.json 파일로 저장되었습니다.');
        } catch (err) {
          console.error('JSON 파일 저장 중 오류:', err);
        }
        // 각 캐릭터 항목에 대해 처리
        for (const item of references.referenceElements) {
          // 링크 데이터가 없는 경우 건너뛰기
          if (!item.links || item.links.length === 0) {
            console.log(`${item.title.title}에 링크 자료가 없습니다.`);
            continue;
          }

          // 각 링크에 대해 상세 정보 추출
          for (const link of item.links) {
            console.log(`캐릭터 정보 추출 시작: ${link.title}`);

            // 캐릭터 상세 페이지 로드
            const characterPageUrl = `https://namu.wiki${link.href}`;
            const characterPage = await fetchNamuWikiPage(characterPageUrl);
            browser = characterPage.browser();

            try {
              // 캐릭터 상세 정보 추출
              const characterInfo =
                await GirlsFrontline2CharacterInfoSearch(characterPage);
              console.log('추출된 캐릭터 정보:', characterInfo);
              // 추출된 캐릭터 정보를 JSON 파일로 저장
              try {
                const jsonData = JSON.stringify(characterInfo, null, 2);
                await fs.promises.writeFile(
                  `test${setCharacterList}.json`,
                  jsonData,
                  'utf8',
                );
                console.log(
                  `캐릭터 정보가 test${setCharacterList}.json 파일로 저장되었습니다.`,
                );
              } catch (err) {
                console.error('JSON 파일 저장 중 오류:', err);
              }
              characterList.push(characterInfo);
            } catch (error) {
              console.error(`캐릭터 정보 추출 실패: ${link.title}`, error);
            } finally {
              // 브라우저 리소스 정리
              await characterPage.browser().close();
            }
            // 임시 추가
            if (setCharacterList > 10) {
              break;
            }
            setCharacterList++;
          }
          // 임시 추가
          break;
        }
      } else {
        // 참조 데이터가 없는 경우 에러 응답
        return res.status(200).json({
          resultCode: 200,
          resultMsg: '에러: 나무위키 리스트 참조 에러',
        });
      }
      return res.status(200).json({
        resultCode: 200,
        resultMsg: 'SUCCESS',
        data: characterList,
      });
    } catch (error) {
      console.error('나무위키 파싱 에러:', error);
      if (browser) await browser.close();
      return res.status(500).json({
        resultCode: 500,
        resultMsg: '나무위키 파싱 중 오류가 발생했습니다',
      });
    }
    // 이러면 캐릭터는 얼추 끝 - 강화 재료 같은것 까지 하기에는 빡셈

    // 나무위키 무기 추출 필요 까지만 하는걸로
  }
}

export default new TestController();
