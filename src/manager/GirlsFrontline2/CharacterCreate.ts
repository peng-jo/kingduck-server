// 필수 모듈 임포트
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';
import sequelize from '../../models';
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
import {
  normalizeWhitespace,
  replaceHyphensAndCapitalize,
} from '../../utils/stringUtils';
import { formatDateString } from '../../utils/dateUtils';
import * as ImageUtils from '../../utils/imageUtils';
import { fetchData, fetchPageConfig } from '../../utils/apiUtils';
import { fetchAndDownloadVideo } from '../../utils/youtubeUtils';

// 테스트 데이터 임포트
import prydwenData from './setJosn/prydwenCharacter_2025-01-24.json';
import prydwenhCharacterpageData from './setJosn/prydwenCharacterData_2025-01-24.json';
import listtest from './setJosn/listtest.json';
import characterInfoTest from './setJosn/test.json';

/**
 * 캐릭터 스탯 증가값을 추출하는 함수
 * @param data 캐릭터 스탯 데이터
 * @returns 증가값이 포함된 객체
 */
const extractAddValues = async (data: any) => {
  // 약점 타입 처리
  const typeIds: any[] = [];

  // 약점1 처리
  const weakness1Type = await TypeDef.findOne({
    where: {
      'name.en': data.weakness_1,
    },
    raw: true,
  });
  if (weakness1Type?.id) {
    typeIds.push(weakness1Type.id);
  }

  // 약점2 처리
  const weakness2Type = await TypeDef.findOne({
    where: {
      'name.en': data.weakness_2,
    },
    raw: true,
  });

  if (weakness2Type?.id) {
    typeIds.push(weakness2Type.id);
  }
  const result = {
    hp: data.hp,
    atk: data.atk,
    def: data.def,
    crit_rate: data.crit_rate,
    crit_dmg: data.crit_dmg,
    home: data.home,
    mobility: data.mobility,
    weakness: typeIds,
  };

  return result;
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

export class GirlsFrontline2CharacterCreate {
  async CharacterSet() {
    console.log('----------------------------------');
    console.log('캐릭터 삽입 - 소녀전선 2: 망명');
    console.log('----------------------------------');

    // 외부 API에서 캐릭터 데이터 가져오기
    /* 실 가동시 주석 삭제
    const prydwenData = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2390206260.json',
    );

    // 파일 따로 저장
    try {
      // saveDataToFile 함수 호출하여 데이터 저장
      saveDataToFile(prydwenData, 'prydwenCharacter');
      console.log('데이터 파일 저장 완료');
    } catch (error) {
      console.error('데이터 파일 저장 중 오류 발생:', error);
    }
    */

    const prydwenCharacter = prydwenData.data.allContentfulGflCharacter.nodes;

    // 데이터 수량 로깅
    console.log('prydwenCharacter:', prydwenCharacter.length);
    console.log('----------------------------------');

    // 게임 내 타입 데이터 조회
    const TypeList = await TypeDef.findAll({
      where: { gameId: 2 },
      raw: true,
    });

    let TestLog = {
      prydwenh: [],
      characterInfo: {},
    };

    // 각 링크에 대해 상세 정보 추출
    for (const item of listtest.referenceElements) {
      if (!item || !item.links || !Array.isArray(item.links)) {
        console.log('링크 정보가 없거나 유효하지 않습니다');
        continue;
      }

      // 각 링크에 대해 상세 정보 추출
      for (const link of item.links) {
        if (!link) {
          console.log('링크 정보가 없습니다');
          continue;
        }
        // 링크 관련 처리
        const characterLink: any = link;

        // 실 가동시 수정 필요
        const characterInfo = characterInfoTest.extractedData.characters[0];
        const skillInfo = characterInfoTest.extractedData.skills;
        const mindSetInfo = characterInfoTest.extractedData.neural[0].data;
        const keyListInfo = characterInfoTest.extractedData.neural[1].data;

        let ChkName = characterInfo.name.kr;
        let ChkEnName = characterInfo.name.en;
        let characterImage = characterInfo.image;

        console.log('name:', ChkName + '/' + ChkEnName);

        // prydwen 데이터 매칭
        const prydwenItem: any = prydwenCharacter.find(
          (fitem) => fitem.name === ChkEnName,
        );

        if (!prydwenItem?.slug) {
          console.log('prydwen사이트의 pageId가 존재하지 않습니다.');
          continue;
        }

        // 캐릭터 중복 체크
        const searchCharacter: any = await Character.findOne({
          where: {
            'name.kr': ChkName,
          },
          raw: true,
        });

        if (searchCharacter?.id) {
          console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
          continue;
        }

        // 추가 캐릭터 정보 가져오기
        /* 실 가동시 주석 삭제
        const prydwenhCharacterpageData = await fetchData(
          'https://www.prydwen.gg/page-data/gfl-exilium/characters/' +
            prydwenItem.slug +
            '/page-data.json',
        );

        // 파일 따로 저장
        try {
          // saveDataToFile 함수 호출하여 데이터 저장 - 실가동시 삭제
          saveDataToFile(prydwenhCharacterpageData, 'prydwenCharacterData');
          console.log('데이터 파일 저장 완료');
        } catch (error) {
          console.error('데이터 파일 저장 중 오류 발생:', error);
        }*/

        const prydwenhCharacterInfo =
          prydwenhCharacterpageData.result.data.currentUnit.nodes[0];
        // 타입 데이터 처리
        const typeIds: any[] = [];

        // 캐릭터 속성 타입 처리
        const cleanedType = characterInfo.type[0].value
          .replace(/<[^>]*>/g, '')
          .trim()
          .split(/\s+/);

        cleanedType.forEach((type) => {
          const typeItem = TypeList.find((item) => item.name.ko === type);
          if (typeItem?.id) {
            typeIds.push({ id: typeItem.id, group: typeItem.group });
          } else {
            console.log(`타입을 찾을 수 없습니다: ${type}`);
          }
        });

        // 소속 타입 처리
        const cleanedCorpType = characterInfo.corp[0].value
          .replace(/<[^>]*>/g, '')
          .trim()
          .split(/\s+/);

        cleanedCorpType.forEach((type) => {
          const typeItem = TypeList.find((item) => item.name.ko === type);
          if (typeItem?.id) {
            typeIds.push({ id: typeItem.id, group: typeItem.group });
          } else {
            console.log(`타입을 찾을 수 없습니다: ${type}`);
          }
        });

        // 무기 타입과 속성 타입 분리
        const types = {
          weapon: typeIds.find((type) => type.group === 'weaponType')?.id,
          element:
            typeIds.find((type) => type.group === 'elementType')?.id || 0,
          corp: typeIds.find((type) => type.group === 'corpType')?.id || 0,
        };

        // 언어별 표기 처리
        const cleanedNameList = characterInfo.nameList[0].value
          .replace(/<[^>]*>/g, '')
          .trim()
          .split(/\s+/);

        // 중국어, 일본어, 영어 순서로 저장
        const nameListValues = {
          kr: characterInfo.name.kr,
          cn: cleanedNameList[0],
          jp: cleanedNameList[1],
          en: cleanedNameList[2],
        };

        console.log('언어별 표기 처리 결과:', nameListValues);

        // 성우 정보 처리
        const cleanedVoiceList = characterInfo.voice[0].value
          .replace(/<[^>]*>/g, '')
          .trim()
          .split(/\s+/);

        // 한국어, 중국어, 일본어 성우 순서로 저장
        const voiceActors = {
          kr: cleanedVoiceList[0],
          cn: cleanedVoiceList[1],
          jp: cleanedVoiceList[2],
          en: '',
        };

        console.log('성우 정보 처리 결과:', voiceActors);

        // 캐릭터 기본 정보 설정
        let setCharacterBase: any = {
          gameId: 2,
          pageId: prydwenItem.slug,
          isNew: 0,
          isReleased: 1,
          name: nameListValues,
          type: types,
          rarity: characterInfo?.rarity[0]?.value,
          voiceActors: voiceActors,
        };

        // 신규/출시 상태 설정
        setCharacterBase.isNew = prydwenhCharacterInfo?.isNew ? 1 : 0;
        setCharacterBase.isReleased = prydwenhCharacterInfo?.cnOnly ? 1 : 0;

        // 출시일 설정
        if (prydwenhCharacterInfo?.releaseDateGlobal) {
          console.log(prydwenhCharacterInfo?.releaseDateGlobal);

          setCharacterBase.releaseDate = formatDateString(
            prydwenhCharacterInfo.releaseDateGlobal,
          );
        }

        // 최종 중복 체크
        const search2Character: any = await Character.findOne({
          where: {
            'name.kr': setCharacterBase.name.kr,
            'type.weapon': String(types?.weapon),
            'type.corp': String(types?.corp),
          },
          raw: true,
        });

        if (search2Character?.id) {
          console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
          continue;
        }

        // 캐릭터 스탯 정보 처리
        const statsBaseVal = await extractAddValues(
          prydwenhCharacterInfo.stats,
        );
        let stataPromotion = 0;

        // 무기 정보 처리
        let setWeapon: any = [];
        let setWeaponName: any = [];
        let weaponType = '',
          weaponName = ''; // 초기값 설정
        const weaponData = characterInfo.weapon?.[0]; // 배열 접근 수정
        if (weaponData?.value) {
          // null 체크 추가
          [weaponType, weaponName] = weaponData.value.split(' / ');

          setWeaponName.push(weaponType);
          // 무기 타입 검색
          const weaponTypeData = await Item.findAll({
            attributes: ['id'],
            where: {
              'itemReferences.weapon': weaponType,
            },
            raw: true,
          });

          let weaponNameData = await Item.findOne({
            // null 체크를 위해 초기화 방식 변경
            attributes: ['id'],
            where: {
              'name.kr': weaponName,
            },
            raw: true,
          });

          if (weaponTypeData.length > 0 && weaponNameData?.id) {
            // null 체크 수정
            setWeapon.push(weaponNameData.id, weaponTypeData[0].id);
          } else if (weaponTypeData.length > 0) {
            setWeapon.push(weaponTypeData[0].id);
          }
        }

        // 마인드 보강 정보 처리
        let mindSetList = [];
        if (mindSetInfo && Array.isArray(mindSetInfo)) {
          for (const item of mindSetInfo) {
            if (!item || item.length === 0) {
              continue;
            }
            // 각 아이템의 정보 추출
            const title = item[0]?.text || '';
            const imageSrc = item[1]?.text?.match(/src='([^']+)'/)?.[1] || '';
            const description = item[2]?.text || '';

            // 이미지 파일명 생성
            const imageName = uuidv4().replace(/-/g, '');
            // 이미지 다운로드
            const imageUrl = 'http://' + imageSrc;
            const directory = path.join(
              __dirname,
              '../../../static/image/test',
            );
            const filename = `${imageName}.webp`;

            await ImageUtils.downloadImage(imageUrl, directory, filename);

            const imageDir = 'assets/image/ranks/' + imageName + '.webp';

            // 키 정보 객체 생성
            const mindSetInfo = {
              title: title,
              image: imageDir,
              description: description,
            };
            mindSetList.push(mindSetInfo);
          }
        }

        // 뉴럴 헬릭스 정보 처리
        let keyList = [];
        if (keyListInfo && Array.isArray(keyListInfo)) {
          for (const item of keyListInfo) {
            if (!item || item.length === 0) {
              continue;
            }
            // 각 아이템의 정보 추출
            const title = item[0]?.text || '';
            const imageSrc = item[1]?.text?.match(/src='([^']+)'/)?.[1] || '';
            const description = item[2]?.text || '';

            // 이미지 파일명 생성
            const imageName = uuidv4().replace(/-/g, '');
            // 이미지 다운로드
            const imageUrl = 'http://' + imageSrc;
            const directory = path.join(
              __dirname,
              '../../../static/image/test/helix',
            );
            const filename = `${imageName}.webp`;

            await ImageUtils.downloadImage(imageUrl, directory, filename);

            const imageDir = 'assets/image/skill/' + imageName + '.webp';

            // 키 정보 객체 생성
            const keyInfo = {
              title: title,
              image: imageDir,
              description: description,
            };
            keyList.push(keyInfo);
          }
        }

        // 이미지 파일명 생성
        const ArtImageName = uuidv4().replace(/-/g, '');
        // 이미지 다운로드
        const ArtImageUrl = characterImage;
        const Artdirectory = path.join(
          __dirname,
          '../../../static/image/test/character',
        );
        const Artfilename = `${ArtImageName}.webp`;

        await ImageUtils.downloadImage(ArtImageUrl, Artdirectory, Artfilename);

        // 이미지 파일명 생성
        const CardImageName = uuidv4().replace(/-/g, '');
        // 이미지 다운로드
        const CardImageUrl =
          'https://www.prydwen.gg' +
          prydwenhCharacterInfo.cardImage.localFile.childImageSharp
            .gatsbyImageData.images.fallback.src;
        const Carddirectory = path.join(
          __dirname,
          '../../../static/image/test/character',
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
              helix: keyList,
            },
            ranks: mindSetList,
            itemData: {
              weaponName: setWeaponName,
              weapon: setWeapon,
            },
          };

          await CharacterInfo.create(setCharacterInfoBase);

          // 캐릭터 이미지 정보 생성
          await CharacterImage.create({
            characterId: createCharacterBase.id,
            backgroundColor: '#ffffff',
            layout: 'card',
            url: 'assets/image/character/' + CardImageName,
          });

          await CharacterImage.create({
            characterId: createCharacterBase.id,
            backgroundColor: '#ffffff',
            layout: 'art',
            url: 'assets/image/character/' + ArtImageName,
          });

          console.log(setCharacterBase);
          console.log(setCharacterInfoBase);

          // 스킬 정보 처리
          let SkillsList = [];

          // skillInfo 변수의 내용물 체크
          if (skillInfo && Array.isArray(skillInfo) && skillInfo.length > 0) {
            console.log('스킬 정보가 존재합니다:', skillInfo.length);
            for (const skill of skillInfo) {
              if (!skill || !skill.title || !skill.description) {
                continue;
              }

              const skillInfoData = skill.title[0];
              const skillTitle = skillInfoData.value.title;
              const description = skillInfoData.value.description
                .replace('undefined', '')
                .replace(' ', '')
                .replace(/<img[^>]*>/g, '/');
              skillInfoData.value.description = description;

              const skillImageSrc =
                skillInfoData.image.match(/src='([^']+)'/)?.[1] || '';

              // detail의 title에서 ▼ 제거
              if (skill.detail?.title) {
                skill.detail.title = skill.detail.title.replace(/\s*▼\s*/, '');
              }
              // content에서 텍스트 추출 및 배열화
              if (skill.detail?.content) {
                const dom = new JSDOM(skill.detail.content);
                const document = dom.window.document;

                // ui-ZyLzq div 내부의 첫 번째 div (75% width)
                const levelDiv = document.querySelector(
                  '.ui-ZyLzq > div:first-child',
                );
                const level =
                  levelDiv?.querySelector('div')?.textContent?.trim() || '';
                const levelText =
                  levelDiv?.textContent?.split(level)?.[1]?.trim() || '';

                // ui-ZyLzq div 내부의 두 번째 div (22.5% width)
                const infoDiv = document.querySelector(
                  '.ui-ZyLzq > div:last-child',
                );
                const range = {
                  title:
                    infoDiv?.textContent?.split('\n')[1]?.trim() || '사거리',
                  value:
                    infoDiv
                      ?.querySelector('div:first-of-type')
                      ?.textContent?.trim() || '',
                  image:
                    infoDiv
                      ?.querySelector('img.\_66lDSM6b[data-filesize]')
                      ?.getAttribute('src') || '',
                };
                const target = {
                  title:
                    infoDiv?.textContent?.split('\n')[3]?.trim() || '작용 범위',
                  value:
                    infoDiv
                      ?.querySelector('div:last-of-type')
                      ?.textContent?.trim() || '',
                };

                // 스킬 이미지 처리
                if (range.image) {
                  const saveSkillRangeImageDirectory = path.join(
                    __dirname,
                    '../../../static/image/test/skill/range/',
                  );
                  const skillRangeImageImageName = uuidv4().replace(/-/g, '');
                  const skillRangeImageImageUrl = 'https:' + range.image;
                  const skillRangefilename = `${skillRangeImageImageName}.webp`;

                  await ImageUtils.downloadImage(
                    skillRangeImageImageUrl,
                    saveSkillRangeImageDirectory,
                    skillRangefilename,
                  );
                  range.image =
                    'assets/image/skill/range/' + skillRangeImageImageName;
                }

                // 추출된 값들을 객체로 구성
                skill.detail.contentData = {
                  level: {
                    value: level,
                    description: levelText,
                  },
                  range,
                  target,
                };
              }

              // 스킬 기본 정보 설정
              const setSkillBase = {
                gameId: 2,
                characterId: createCharacterBase.id,
                name: {
                  kr: skillTitle,
                },
                tag: description,
                info: skill.description,
                type: '',
                levelReq: 0,
                promotionReq: 0,
                levelData: skill.detail.contentData,
              };

              // 스킬 생성
              const createSkill = await Skill.create(setSkillBase);

              // 스킬 이미지 처리
              const saveSkillDirectory = path.join(
                __dirname,
                '../../../static/image/test/skill/',
              );
              const skillImageName = uuidv4().replace(/-/g, '');
              const skillImageVal = skillImageName;
              const skillImageUrl = 'https:' + skillImageSrc;
              const skillfilename = `${skillImageVal}.webp`;

              await ImageUtils.downloadImage(
                skillImageUrl,
                saveSkillDirectory,
                skillfilename,
              );

              // 스킬 이미지 정보 생성
              if (createSkill.id) {
                await SkillImage.create({
                  skillId: createSkill.id,
                  backgroundColor: '#ffffff',
                  layout: '',
                  url: 'assets/image/skill/' + skillImageName,
                });
              }

              SkillsList.push(skillInfo);
            }
          } else {
            console.log('스킬 정보가 없습니다.');
          }

          console.log(SkillsList);

          console.log('캐릭터 생성 완료 - ' + createCharacterBase.id);
        }

        console.log('----------------------------------------');
      }
      // 실사용시 삭제 필요
      break;
    }
    // 응답 반환
    const response = {
      resultCode: 200,
      TestLog: TestLog,
    };

    return response;
  }
}

export default new GirlsFrontline2CharacterCreate();
