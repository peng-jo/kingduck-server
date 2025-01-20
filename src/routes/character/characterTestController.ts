import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import puppeteer from 'puppeteer';
import youtubedl from 'youtube-dl-exec';
import progressEstimator from 'progress-estimator';
import { QueryTypes, where, Op, Sequelize } from 'sequelize';

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
import { downloadImage } from '../../utils/imageUtils';
import { fetchData, fetchPageConfig } from '../../utils/apiUtils';
import { downloadVideo, youtubeVideo } from '../../utils/youtubeUtils';

// 테스트 데이터 임포트
import hakushCharacter from './test/c1.json';
import starrailstationCharacter from './test/c2.json';
import prydwenData from './test/c3.json';
import starrailstationCharacterInfo from './test/citem.json';
import hakushCharacterInfo from './test/citem2.json';
import tmpitem from './test/itemt.json';

import sequelize from '../../models';

const extractAddValues = (data: any) => {
  const result = {};

  for (const key in data) {
    const subObj = data[key];
    for (const subKey in subObj) {
      if (subKey.includes('Add')) {
        const roundedValue = Math.floor(subObj[subKey] * 1000) / 1000;
        result[subKey] = roundedValue;
      }
    }
  }

  return result;
};

export class CharacterTestController {
  async CharacterSet(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('캐릭터 삽입 - 붕괴 스타레일');
    console.log('----------------------------------');

    // 데이터 가져오기
    const hakushCharacter = await fetchData(
      'https://api.hakush.in/hsr/data/character.json',
    );
    const prydwenData = await fetchData(
      'https://www.prydwen.gg/page-data/sq/d/2408139295.json',
    );
    const starrailstationData = await fetchPageConfig(
      'https://starrailstation.com/kr/characters',
    );

    const starrailstationCharacter = starrailstationData.entries;
    const prydwenCharacter = prydwenData.data.allContentfulHsrCharacter.nodes;

    // 데이터 로깅
    console.log('hakushCharacter:', Object.keys(hakushCharacter).length);
    console.log(
      'starrailstationCharacter:',
      Object.keys(starrailstationCharacter).length,
    );
    console.log('prydwenCharacter:', Object.keys(prydwenCharacter).length);
    console.log('----------------------------------');

    // 타입 데이터 가져오기
    const TypeList = await TypeDef.findAll({
      where: { gameId: 1 },
      raw: true,
    });

    let setCharacterList = [];
    let setCharacterInfoList = [];
    let setCharacterImageList = [];
    let setCharacterSkill = [];

    // 캐릭터 처리
    for (const key in hakushCharacter) {
      const hakushItem: any = hakushCharacter[key];
      let ChkName = hakushItem.kr === '{NICKNAME}' ? '개척자' : hakushItem.kr;
      let ChkEnName = '';

      // starrailstation 데이터 처리
      const starrailstationItem: any = starrailstationCharacter.find(
        (fitem) => fitem.pageId === hakushItem.icon,
      );

      if (!starrailstationItem?.pageId) {
        console.log('starrailstation사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      // 데미지 타입 처리
      const damageTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.damageType.name,
      );
      const baseTypeItem: any = TypeList.find(
        (fitem: any) => fitem.name.ko === starrailstationItem?.baseType.name,
      );

      // prydwen 데이터 처리
      ChkEnName = hakushItem.en;
      if (damageTypeItem.id && hakushItem.kr === '{NICKNAME}') {
        switch (damageTypeItem.id) {
          case 3:
            ChkEnName = 'Trailblazer • Remembrance';
            break;
          case 6:
            ChkEnName = 'Trailblazer • Destruction';
            break;
          case 5:
            ChkEnName = 'Trailblazer • Harmony';
            break;
          case 10:
            ChkEnName = 'Trailblazer • Preservation';
            break;
          default:
            ChkEnName = hakushItem.en;
            break;
        }
      }

      const prydwenItem: any = prydwenCharacter.find(
        (fitem) => fitem.name === ChkEnName,
      );

      if (!prydwenItem?.slug) {
        console.log('prydwen사이트의 pageId가 존재하지 않습니다.');
        continue;
      }

      // 캐릭터 존재 여부 확인
      const searchCharacter: any = await Character.findOne({
        where: {
          'name.kr': ChkName,
          element: String(damageTypeItem?.id),
          path: String(baseTypeItem?.id),
        },
        raw: true,
      });

      console.log('name:', hakushItem.kr + '/' + ChkEnName);

      if (searchCharacter?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
        continue;
      }

      // 추가 데이터 가져오기
      const starrailstationCharacterInfo = await fetchPageConfig(
        'https://starrailstation.com/kr/character/' +
          starrailstationItem.pageId,
      );
      const hakushCharacterInfo = await fetchData(
        'https://api.hakush.in/hsr/data/kr/character/' + key + '.json',
      );
      const prydwenhCharacterpageData = await fetchData(
        'https://www.prydwen.gg/page-data/star-rail/characters/' +
          prydwenItem.slug +
          '/page-data.json',
      );
      const prydwenhCharacterInfo =
        prydwenhCharacterpageData.result.data.currentUnit.nodes[0];

      // 캐릭터 기본 정보 설정
      let setCharacterBase: any = {
        gameId: 1,
        pageId: hakushItem.icon,
        isNew: 0,
        isReleased: 1,
        name: {
          en: hakushItem.en,
          kr: hakushItem.kr,
          jp: hakushItem.jp,
          cn: hakushItem.cn,
        },
        element: damageTypeItem?.id,
        path: baseTypeItem?.id,
        rarity: starrailstationItem?.rarity,
        voiceActors: {
          en: starrailstationCharacterInfo.archive.cvEn,
          kr: starrailstationCharacterInfo.archive.cvKr,
          jp: starrailstationCharacterInfo.archive.cvJp,
          cn: starrailstationCharacterInfo.archive.cvCn,
        },
      };

      // 특수 케이스 처리
      if (hakushItem.kr === '{NICKNAME}') {
        setCharacterBase.name.kr = ChkName;
        setCharacterBase.name.en = ChkEnName;
      }

      setCharacterBase.isNew = prydwenhCharacterInfo?.isNew ? 1 : 0;
      setCharacterBase.isReleased = prydwenhCharacterInfo?.isReleased ? 1 : 0;

      if (prydwenhCharacterInfo?.releaseDate) {
        setCharacterBase.releaseDate = formatDateString(
          prydwenhCharacterInfo.releaseDate,
        );
      }

      // 중복 체크
      const search2Character: any = await Character.findOne({
        where: {
          'name.kr': setCharacterBase.name.kr,
          element: String(damageTypeItem?.id),
          path: String(baseTypeItem?.id),
        },
        raw: true,
      });

      if (search2Character?.id) {
        console.log('이미 데이터 베이스에 있는것으로 확인 됩니다.');
        continue;
      }

      // 캐릭터 세부 정보 처리
      const statsAddVal = extractAddValues(hakushCharacterInfo.Stats);
      let statsBaseVal = [];
      let stataPromotion = 0;

      // 레벨업 스테이터스 처리
      for (const item of Object.values(hakushCharacterInfo.Stats)) {
        let costList = [];

        for (const costitem of Object.values(item?.Cost)) {
          const itemSearchData = await Item.findAll({
            attributes: ['id'],
            where: {
              'itemReferences.baseKey': costitem.ItemID,
              itemtype: {
                [Op.notLike]: '%Mission',
              },
            },
            raw: true,
          });

          costList.push({
            itemID: itemSearchData[0].id,
            itemNum: costitem.ItemNum,
          });
        }

        statsBaseVal.push({
          attackBase: item.AttackBase,
          defenseBase: item.DefenceBase,
          HPBase: item.HPBase,
          speedBase: item.SpeedBase,
          criticalChance: item.CriticalChance,
          criticalDamage: item.CriticalDamage,
          baseAggro: item.BaseAggro,
          maxLevel: 0,
          promotion: stataPromotion,
          cost: costList,
        });

        stataPromotion++;
      }

      // 장신구 처리
      let setRelicsList = [];
      let setAccessories = [];
      let setCard = [];

      // 터널 유물 처리
      for (const item of Object.values(hakushCharacterInfo.Relics.Set4IDList)) {
        const itemSearchData = await Item.findAll({
          attributes: ['id'],
          where: {
            'itemReferences.baseKey': String(item),
            itemtype: { [Op.notLike]: 'Material' },
          },
          raw: true,
        });
        setRelicsList.push(itemSearchData[0].id);
      }

      // 차원 유물 처리
      for (const item of Object.values(hakushCharacterInfo.Relics.Set2IDList)) {
        const itemSearchData = await Item.findAll({
          attributes: ['id'],
          where: {
            'itemReferences.baseKey': String(item),
          },
          raw: true,
        });
        setAccessories.push(itemSearchData[0].id);
      }

      // 카드 정보 처리
      if (prydwenhCharacterInfo.conesNew) {
        for (const item of Object.values(prydwenhCharacterInfo.conesNew)) {
          const normalizedSearchTerm = replaceHyphensAndCapitalize(
            item.cone,
          ).toLowerCase();

          const itemFound = await sequelize.query(
            `SELECT * FROM "item" AS "Item" WHERE ("Item"."deletedAt" IS NULL) AND (lower("Item"."name"->>'en') LIKE '%${normalizedSearchTerm}%')`,
          );

          if (itemFound[0][0]?.id) {
            setCard.push(itemFound[0][0].id);
          }
        }
      }

      // 이미지 처리
      const saveDirectory = path.join(
        __dirname,
        '../../../static/image/character/',
      );

      // 카드 이미지
      const cardImageVal = starrailstationItem?.iconPath;
      const cardImageUrl =
        'https://cdn.starrailstation.com/assets/' + cardImageVal + '.webp';
      await downloadImage(cardImageUrl, saveDirectory, cardImageVal + '.webp');

      // 메인 이미지
      const artImageVal = starrailstationCharacterInfo?.artPath;
      const artImageUrl =
        'https://cdn.starrailstation.com/assets/' + artImageVal + '.webp';
      await downloadImage(artImageUrl, saveDirectory, artImageVal + '.webp');

      // 캐릭터 생성
      const createCharacterBase = await Character.create(setCharacterBase);

      if (createCharacterBase.id) {
        // 유튜브 처리
        const characterYoutube = await youtubeVideo(hakushItem.kr);
        if (characterYoutube) {
          await CharacterImage.create({
            characterId: createCharacterBase.id,
            backgroundColor: '#ffffff',
            layout: 'video',
            url: 'assets/video/' + characterYoutube,
          });
        }

        // 캐릭터 세부 정보 생성
        const setCharacterInfoBase = {
          characterId: createCharacterBase.id,
          lang: 'kr',
          stats: {
            addSet: statsAddVal,
            base: statsBaseVal,
          },
          ranks: hakushCharacterInfo.Ranks,
          itemData: {
            card: setCard,
            relics: setRelicsList,
            accessories: setAccessories,
          },
          relicsBase: hakushCharacterInfo.Relics,
        };

        await CharacterInfo.create(setCharacterInfoBase);

        // 이미지 정보 생성
        await CharacterImage.create({
          characterId: createCharacterBase.id,
          backgroundColor: '#ffffff',
          layout: 'card',
          url: 'assets/image/character/' + cardImageVal,
        });

        await CharacterImage.create({
          characterId: createCharacterBase.id,
          backgroundColor: '#ffffff',
          layout: 'art',
          url: 'assets/image/character/' + artImageVal,
        });

        // 스킬 처리
        let SkillsList = [];

        for (const item of Object.values(starrailstationCharacterInfo.skills)) {
          let levelDataList = [];

          for (const levelitem of Object.values(item.levelData)) {
            let costList = [];

            if (levelitem.cost.length !== 0) {
              for (const skillcostitem of Object.values(levelitem?.cost)) {
                const searchItem: any = tmpitem.find(
                  (fitem) => fitem.pageId == skillcostitem.id,
                );
                const normalizedStr = normalizeWhitespace(searchItem.name);

                const skillitemSearchData = await Item.findAll({
                  where: {
                    'name.kr': normalizedStr,
                  },
                  raw: true,
                });

                if (skillitemSearchData) {
                  costList.push({
                    itemID: skillitemSearchData[0].id,
                    itemNum: skillcostitem.count,
                  });
                }
              }
            }

            levelitem.cost = costList;
            levelDataList.push(levelitem);
          }

          const setSkillBase = {
            gameId: 1,
            characterId: createCharacterBase.id,
            name: {
              kr: item.name,
            },
            tag: item.tagHash,
            info: item.descHash,
            type: item.typeDescHash,
            levelReq: item.levelReq,
            promotionReq: item.promotionReq,
            stats: {
              break: item.break,
              energy: item.energy,
            },
            levelData: item.levelData,
          };

          const createSkill = await Skill.create(setSkillBase);

          // 스킬 이미지 처리
          const saveSkillDirectory = path.join(
            __dirname,
            '../../../static/image/skill/',
          );
          const skillImageVal = item?.iconPath;
          const skillImageUrl =
            'https://cdn.starrailstation.com/assets/' + skillImageVal + '.webp';

          await downloadImage(
            skillImageUrl,
            saveSkillDirectory,
            skillImageVal + '.webp',
          );

          if (createSkill.id) {
            await SkillImage.create({
              skillId: createSkill.id,
              backgroundColor: '#ffffff',
              layout: '',
              url: 'assets/image/character/' + skillImageVal,
            });
          }

          SkillsList.push(setSkillBase);
        }

        console.log('캐릭터 생성 완료 - ' + createCharacterBase.id);
        setCharacterSkill.push(SkillsList);
        setCharacterList.push(setCharacterBase);
        setCharacterInfoList.push(setCharacterInfoBase);
        setCharacterImageList.push({
          characterId: createCharacterBase.id,
          backgroundColor: '#ffffff',
          layout: 'art',
          url: 'assets/image/character/' + artImageVal,
        });
        setCharacterImageList.push({
          characterId: createCharacterBase.id,
          backgroundColor: '#ffffff',
          layout: 'card',
          url: 'assets/image/character/' + cardImageVal,
        });
      }

      console.log('----------------');
    }

    res.status(200).json({
      skill: setCharacterSkill,
      cinfolist: setCharacterInfoList,
      clist: setCharacterList,
      cimage: setCharacterImageList,
    });
  }
}

export default new CharacterTestController();
