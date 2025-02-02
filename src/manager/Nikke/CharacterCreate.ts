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
import { fetchAndDownloadVideo } from '../../utils/youtubeUtils';
import * as ImageUtils from '../../utils/imageUtils';
import namuWiki from '../../utils/namuWikiUtils';

// 참조한 유틸
import NikkeCharacterSearch from './CharacterSearch';
import { convertSSRSkillList } from './CsvList';
import NikkeCharacterList from './setJson/character.json';
import NikkeCharacterInfo from './setJson/testCharacter.json';
import axios from 'axios';

function extractAltText(htmlTag: string): string {
  try {
    const altMatch = htmlTag.match(/alt=['"]([^'"]*)['"]/);
    return altMatch ? altMatch[1] : '';
  } catch (error) {
    console.error('alt 텍스트 추출 중 오류:', error);
    return '';
  }
}
// 모든 속성을 재귀적으로 순회하며 [] 제거
const removeSquareBrackets = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.replace(/\[.*?\]/g, '').trim();
  }
  if (Array.isArray(obj)) {
    return obj.map((item: any): any => removeSquareBrackets(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = removeSquareBrackets(obj[key]);
    }
    return newObj;
  }
  return obj;
};
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
  const saveDirectory = path.join(__dirname, './setJson');
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
      console.log('dotgg-json 데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }
    const dotggCharacter = dotggData;
    // 데이터 수량 로깅
    console.log('dotggCharacter:', dotggCharacter.length);
    console.log('----------------------------------');

    // 외부 API에서 캐릭터 데이터 가져오기
    const prydwenData = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2474920082.json',
    );

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(prydwenData, 'prydwenCharacter');
      console.log('prydwen-json 데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }

    const prydwenCharacter = prydwenData.data.allContentfulNikkeCharacter.nodes;
    // 데이터 수량 로깅
    console.log('prydwenCharacter:', prydwenCharacter.length);
    console.log('----------------------------------');

    let browser;
    let references: any;
    let NikkeCharacterList: any;
    let NikkeSkillList: any;
    // 스킬 목록 변환
    try {
      const skillList = await convertSSRSkillList();
      console.log('스킬 목록 변환 완료:', skillList.length);

      // 스킬 데이터 사용 예시
      NikkeSkillList = skillList;
    } catch (error) {
      console.error('에러 발생:', error);
    }

    // 게임 내 타입 데이터 조회
    const TypeList = await TypeDef.findAll({
      where: { gameId: 3 },
      raw: true,
    });

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
      console.log('----------------------------------');
    } catch (error) {
      console.error('나무위키 참조중 에러:', error);
      console.log('----------------------------------');
    }

    let TestLog = {
      data: [],
      error: [],
    };

    if (NikkeCharacterList) {
      console.log('나무위키 캐릭터 페이지 분석');
      for (const item of NikkeCharacterList[0].content) {
        if (!item.title) {
          console.log('제목이 없습니다');
          continue;
        }
        const burstLevel =
          item.title.replace(/[\[\]]/g, '').replace(/\s+/g, '') || '';
        for (const row of item.content) {
          if (!row.text || !row.href) {
            console.log('정보가 없거나 유효하지 않습니다');
            continue;
          }
          const characterName = row.text;
          const characterLink = row.href;

          const searchLinkCharacter: any = await Character.findOne({
            where: {
              'name.kr': characterName,
            },
            raw: true,
          });
          if (searchLinkCharacter?.id) {
            console.log(
              '이미 데이터 베이스에 있는것으로 확인 됩니다:',
              characterName,
            );
            continue;
          }
          // 링크 관련 처리
          let characterInfo: any;

          console.log('나무위키 캐릭터 페이지 분석중 : ', characterName);
          const startTime = Date.now();
          // 캐릭터 상세 페이지 로드
          const characterPageUrl = `https://namu.wiki${characterLink}`;
          const characterPage =
            await namuWiki.fetchNamuWikiPage(characterPageUrl);
          browser = characterPage.browser();

          try {
            // 캐릭터 상세 정보 추출
            const characterData =
              await NikkeCharacterSearch.InfoNamuWikiSearch(characterPage);
            characterInfo = characterData;
            console.log('나무위키 캐릭터 페이지 분석 완료 : ', characterName);
          } catch (err) {
            console.error(`캐릭터 정보 추출 실패: ${characterName}`, err);
            (TestLog?.error as any[]).push({
              error: '캐릭터 정보 추출 실패-나무위키',
              name: characterName,
            });
            continue;
          } finally {
            // 브라우저 리소스 정리
            await characterPage.browser().close();
          }
          const endTime = Date.now();
          const duration = endTime - startTime;
          console.log(`분석 소요 시간: ${duration}ms`);

          // 캐릭터 정보에서 [] 안의 글자 제거
          characterInfo = removeSquareBrackets(characterInfo[0]);

          //characterInfo = NikkeCharacterInfo;

          // 캐릭터 정보 체크
          if (!characterInfo) {
            console.log('캐릭터 정보가 없습니다.');
            (TestLog.error as any[]).push({
              error: '캐릭터 정보가 없습니다.',
              name: characterName,
            });
            continue;
          }

          let ChkName = characterInfo.name.kr;
          let ChkEnName = characterInfo.name.en;

          if (ChkEnName == '') {
            ChkEnName = ChkName;
          }

          if (ChkName === '길로틴 : 윈터 슬레이어') {
            console.log('이미지 에러.');
            (TestLog?.error as any[]).push({
              error: '이미지 에러.',
              name: ChkName + '/' + ChkEnName,
            });
            continue;
          }

          // : 앞의 띄어쓰기 제거
          ChkEnName = ChkEnName.replace(/\s+:/g, ':');

          // prydwen 데이터 매칭
          const prydwenItem: any = prydwenCharacter.find(
            (fitem) => fitem.name === ChkEnName,
          );

          if (!prydwenItem?.slug) {
            console.log('prydwen사이트의 pageId가 존재하지 않습니다.');
            (TestLog?.error as any[]).push({
              error: 'prydwen사이트의 pageId가 존재하지 않습니다.',
              name: ChkName + '/' + ChkEnName,
            });
            continue;
          }

          // prydwen 데이터 매칭
          const dotggItem: any = dotggData.find(
            (fitem) => fitem.name === ChkEnName,
          );

          if (!dotggItem?.url) {
            console.log('dotgg사이트의 pageId가 존재하지 않습니다.');
            (TestLog?.error as any[]).push({
              error: 'dotgg사이트의 url가 존재하지 않습니다.',
              name: ChkName + '/' + ChkEnName,
            });
            continue;
          }

          const skillData = NikkeSkillList.filter((fitem) =>
            fitem.name.includes(ChkName),
          );

          if (!skillData || skillData.length === 0) {
            console.log('스킬 데이터가 존재하지 않습니다.');
            (TestLog?.error as any[]).push({
              error: '스킬 데이터가 존재하지 않습니다.',
              name: ChkName + '/' + ChkEnName,
            });
          }

          // 추가 캐릭터 정보 가져오기
          const prydwenhCharacterpageData = await fetchData(
            'https://www.prydwen.gg/page-data/nikke/characters/' +
              prydwenItem.slug +
              '/page-data.json',
          );

          const prydwenhCharacterInfo =
            prydwenhCharacterpageData.result.data.currentUnit.nodes[0];

          // 추가 캐릭터 정보 가져오기
          const dotggCharacterpageData = await fetchData(
            'https://api.dotgg.gg/nikke/character/' + dotggItem.url,
          );

          const dotggCharacterInfo = dotggCharacterpageData;

          const typeIds: any[] = [];
          // 타입 처리 함수
          const processType = (
            value: string,
            nameKey: 'ko' | 'en',
            removeText: string,
          ) => {
            let type = extractAltText(value);
            if (type === '') {
              type = value;
            }

            const typeItem = TypeList.find(
              (item) =>
                item.name[nameKey] ===
                type.replace(/<[^>]*>/g, '').replace(removeText, ''),
            );

            if (typeItem?.id) {
              typeIds.push({
                id: typeItem.id,
                group: typeItem.group,
              });
            } else {
              console.log(`타입을 찾을 수 없습니다: ${type}`);
            }
          };

          // 제조사 타입 처리
          processType(characterInfo.manufacturer[0].value, 'ko', '니케-');
          // 버스트 타입 처리
          processType(burstLevel, 'ko', '');
          // 무기 타입 처리
          processType(characterInfo.weapon[0].value, 'en', '니케');
          // 클래스 타입 처리
          processType(characterInfo.modal[0].value, 'ko', '니케-');
          // 속성 타입 처리
          processType(characterInfo.element[0].value, 'ko', '니케');

          // 무기 타입과 속성 타입 분리
          const types = {
            manufacturer:
              typeIds.find((type) => type.group === 'manufacturerType')?.id ||
              0,
            weapon:
              typeIds.find((type) => type.group === 'weaponType')?.id || 0,
            burst: typeIds.find((type) => type.group === 'burstType')?.id || 0,
            element:
              typeIds.find((type) => type.group === 'elementType')?.id || 0,
            class: typeIds.find((type) => type.group === 'classType')?.id || 0,
          };

          // 성우 정보 처리
          const cleanedVoiceList = characterInfo.voice[0].value
            .split(/<img[^>]*>/)
            .map((text) => text.trim())
            .filter((text) => text !== '');

          // 한국어, 중국어, 일본어 성우 순서로 저장
          const voiceActors = {
            kr: cleanedVoiceList[0],
            cn: '',
            jp: cleanedVoiceList[1],
            en: cleanedVoiceList[2],
          };

          console.log('성우 정보 처리 결과:', cleanedVoiceList);

          // 캐릭터 기본 정보 설정
          let setCharacterBase: any = {
            gameId: 3,
            pageId: prydwenItem.slug,
            isNew: 0,
            isReleased: 1,
            name: {
              kr: characterName,
              en: dotggItem.name,
            },
            type: types,
            rarity: characterInfo?.rarity[0]?.value,
            voiceActors: voiceActors,
          };

          // 신규/출시 상태 설정
          setCharacterBase.isNew = prydwenhCharacterInfo?.isNew ? 1 : 0;
          setCharacterBase.isReleased = prydwenhCharacterInfo?.releaseDate
            ? 1
            : 0;

          // 출시일 설정
          if (prydwenhCharacterInfo?.releaseDate) {
            console.log(prydwenhCharacterInfo?.releaseDate);

            setCharacterBase.releaseDate = formatDateString(
              prydwenhCharacterInfo.releaseDate,
            );
          }

          // 최종 중복 체크
          const search2Character: any = await Character.findOne({
            where: {
              'name.kr': setCharacterBase.name.kr,
              'type.manufacturer': String(types?.manufacturer),
              'type.class': String(types?.class),
            },
            raw: true,
          });

          if (search2Character?.id) {
            console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
            continue;
          }

          let statsBaseVal = {
            damage: dotggCharacterInfo.damage || 0,
            maxAmmo: dotggCharacterInfo.maxAmmo || 0,
            chargeTime: dotggCharacterInfo.chargeTime || 0,
            chargeDamage: dotggCharacterInfo.chargeDamage || 0,
            reloadTime: dotggCharacterInfo.reloadTime || 0,
            burstGen: dotggCharacterInfo.burstGen || 0,
          };

          // dotgg 이미지 URL이 존재하는지 확인
          try {
            const imgCheckUrl =
              'https://static.dotgg.gg/nikke/characters/' +
              dotggCharacterInfo.imgBig +
              '.webp';
            const response = await axios.head(imgCheckUrl);

            if (response.status !== 200) {
              console.log('dotgg 이미지가 존재하지 않습니다.');
              (TestLog.error as any[]).push({
                error: 'dotgg 이미지가 존재하지 않습니다.',
                name: ChkName + '/' + ChkEnName,
                url: imgCheckUrl,
              });
              continue;
            }
          } catch (error) {
            console.error('dotgg 이미지 확인 중 오류 발생:', error);
            (TestLog.error as any[]).push({
              error: 'dotgg 이미지 확인 중 오류 발생',
              name: ChkName + '/' + ChkEnName,
              url:
                'https://static.dotgg.gg/nikke/characters/' +
                dotggCharacterInfo.imgBig +
                '.webp',
            });
            continue;
          }

          // 이미지 파일명 생성
          const ArtImageName = uuidv4().replace(/-/g, '');
          // 이미지 다운로드
          const ArtImageUrl =
            'https://static.dotgg.gg/nikke/characters/' +
            dotggCharacterInfo.imgBig +
            '.webp';
          const Artdirectory = path.join(
            __dirname,
            '../../../static/image/nikke/character',
          );
          const Artfilename = `${ArtImageName}.webp`;

          await ImageUtils.downloadImage(
            ArtImageUrl,
            Artdirectory,
            Artfilename,
          );

          // 이미지 파일명 생성
          const CardImageName = uuidv4().replace(/-/g, '');
          // 이미지 다운로드
          const CardImageUrl =
            'https://www.prydwen.gg' +
            prydwenhCharacterInfo.cardImage.localFile.childImageSharp
              .gatsbyImageData.images.fallback.src;
          const Carddirectory = path.join(
            __dirname,
            '../../../static/image/nikke/character',
          );
          const Cardfilename = `${CardImageName}.webp`;

          await ImageUtils.downloadImage(
            CardImageUrl,
            Carddirectory,
            Cardfilename,
          );

          // 캐릭터 기본 정보 생성
          const createCharacterBase = await Character.create(setCharacterBase);

          if (createCharacterBase.id) {
            // 캐릭터 상세 정보 생성
            const setCharacterInfoBase = {
              characterId: createCharacterBase.id,
              lang: 'kr',
              stats: {
                base: statsBaseVal,
                skins: [],
              },
              ranks: {},
              itemData: {
                cubes: 0,
              },
            };

            await CharacterInfo.create(setCharacterInfoBase);

            // 캐릭터 이미지 정보 생성
            await CharacterImage.create({
              characterId: createCharacterBase.id,
              backgroundColor: '#ffffff',
              layout: 'card',
              url: 'assets/image/nikke/character/' + CardImageName,
            });

            await CharacterImage.create({
              characterId: createCharacterBase.id,
              backgroundColor: '#ffffff',
              layout: 'art',
              url: 'assets/image/nikke/character/' + ArtImageName,
            });

            if (skillData || skillData.length != 0) {
              // 스킬 정보 처리
              let SkillsList = [];
              for (const item of skillData) {
                // 스킬 기본 정보 설정
                const setSkillBase = {
                  gameId: 3,
                  characterId: createCharacterBase.id,
                  name: {
                    kr: item.skillName,
                  },
                  tag: item.skillType,
                  info:
                    item.target +
                    '&2&' +
                    item.effect +
                    '&10&' +
                    item.additionalTarget +
                    '&2&' +
                    item.additionalEffect,
                  type: item.skillType,
                  levelReq: 0,
                  promotionReq: 0,
                };

                SkillsList.push({
                  skillName: item.skillName,
                  setSkillBase: setSkillBase,
                });
                // 스킬 생성
                const createSkill = await Skill.create(setSkillBase);
              }
            }

            // 유튜브 영상 처리
            const searchTerm = `《승리의 여신: 니케》 【NIKKE 프로필】 ${ChkName}`;
            const characterYoutube = await fetchAndDownloadVideo(
              searchTerm,
              'https://www.youtube.com/@nikkekr/',
            );
            if (characterYoutube) {
              await CharacterImage.create({
                characterId: createCharacterBase.id,
                backgroundColor: '#ffffff',
                layout: 'video',
                url: 'assets/video/' + characterYoutube,
              });
            }
          }
        }
      }
    }

    // 응답 반환
    const response = {
      resultCode: 200,
      TestLog: TestLog,
    };
    // TestLog 파일로 저장
    try {
      const logDirectory = path.join(__dirname, '../../../logs');
      // 로그 디렉토리가 없으면 생성
      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFileName = `nikke_character_create_${timestamp}.json`;
      const logFilePath = path.join(logDirectory, logFileName);
      // JSON 형식으로 저장
      fs.writeFileSync(logFilePath, JSON.stringify(TestLog, null, 2), 'utf8');
      console.log(`로그가 저장되었습니다: ${logFilePath}`);
    } catch (error) {
      console.error('로그 파일 저장 중 오류 발생:', error);
    }

    return response;
  }
}

export default new NikkeCharacterCreate();
