import express from 'express';
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';
import { Op } from 'sequelize';
import { Item } from '../../models/Item/ItemDef.Vo';
import Skill from '../../models/skill/SkillDef.Vo';
import SkillImage from '../../models/skill/SkillImage.Vo';
import { Game } from '../../models/game/GameDef.Vo';

/**
 * 아이템 검색 유틸리티 함수
 * 아이템 ID 배열을 받아서 해당하는 아이템들의 상세 정보를 조회
 * 희귀도 높은 순으로 정렬하여 반환
 *
 * @param data 조회할 아이템 ID 배열
 * @returns 아이템 상세 정보 배열
 */
async function itemForSearch(data: number[]) {
  const itemSearchArr = [];
  for (const item of Object.values(data)) {
    const itemData = await Item.findOne({
      where: { id: Number(item) },
      attributes: [
        'itemtype',
        'name',
        'desc',
        'path',
        'rarity',
        'levelData',
        'itemReferences',
        'skillId',
      ],
      order: [['rarity', 'DESC']],
      raw: true,
    });
    itemSearchArr.push(itemData);
  }
  return itemSearchArr;
}

export class CharacterController {
  /**
   * 캐릭터 목록 조회 API
   * 1. 게임 정보 조회
   * 2. 타입(속성, 경로) 정보 조회
   * 3. 캐릭터 기본 정보 및 이미지 조회
   * 4. 캐릭터별 속성/경로 정보 매핑
   */
  async getCharacterList(req: any, res: any): Promise<void> {
    const { slug } = req.params;

    // 1. 게임 정보 조회
    const gameData: any = await Game.findOne({
      where: { 'title.en': slug },
      raw: true,
      nest: true,
    });

    // 2. 타입 정보 조회 (속성, 경로)
    const TypeList = await TypeDef.findAll({
      include: [
        {
          model: TypeImage,
          as: 'image',
          attributes: ['url', 'backgroundColor'],
        },
      ],
      attributes: ['name', 'id'],
      where: { gameId: gameData.id },
      raw: true,
      nest: true,
    });

    // 3. 캐릭터 기본 정보 조회
    const CharacterData = await Character.findAll({
      include: [
        {
          model: CharacterImage,
          as: 'images',
          where: { layout: 'card' }, // 카드 이미지만 조회
          attributes: ['url', 'layout'],
        },
      ],
      attributes: [
        'isNew',
        'isReleased',
        'name',
        'rarity',
        'path',
        'element',
        'id',
      ],
      order: [
        ['rarity', 'DESC'], // 희귀도 높은순
        ['releaseDate', 'DESC'], // 출시일 최신순
      ],
      where: { gameId: gameData.id },
      raw: true,
      nest: true,
    });

    if (!CharacterData?.length) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }

    // 4. 캐릭터별 속성/경로 정보 매핑
    const CharacterList = CharacterData.map((item) => ({
      ...item,
      element: TypeList.find(
        (type) => Number(type.id) === Number(item?.element),
      ),
      path: TypeList.find((type) => Number(type.id) === Number(item?.path)),
    }));

    return res.status(200).json({
      resultCode: 200,
      items: CharacterList,
      resultMsg: 'SUCCESS',
    });
  }

  /**
   * 캐릭터 상세 정보 조회 API
   * 1. 게임 정보 조회
   * 2. 캐릭터 기본 정보 조회
   * 3. 추가 정보 병렬 조회 (속성, 경로, 스킬, 이미지)
   * 4. 장착 아이템 정보 조회
   * 5. 응답 데이터 구성
   */
  async getCharacter(req: any, res: any): Promise<void> {
    const { slug, id } = req.params;

    // 1. 게임 정보 조회
    const gameData: any = await Game.findOne({
      where: { 'title.en': slug },
      raw: true,
      nest: true,
    });

    // 2. 캐릭터 기본 정보 조회
    const CharacterData = await Character.findOne({
      include: [
        {
          model: CharacterInfo,
          as: 'info',
          attributes: ['stats', 'itemData', 'ranks'],
        },
      ],
      where: { id },
      raw: true,
      nest: true,
    });

    if (!CharacterData) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }

    // 3. 추가 정보 병렬 조회
    const [elementType, pathType, skillData, images] = await Promise.all([
      // 속성 정보
      TypeDef.findOne({
        include: [
          {
            model: TypeImage,
            as: 'image',
            attributes: ['url', 'backgroundColor'],
          },
        ],
        attributes: ['name', 'id'],
        where: { id: CharacterData.element },
        raw: true,
        nest: true,
      }),
      // 경로 정보
      TypeDef.findOne({
        include: [
          {
            model: TypeImage,
            as: 'image',
            attributes: ['url', 'backgroundColor'],
          },
        ],
        attributes: ['name', 'id'],
        where: { id: CharacterData.path },
        raw: true,
        nest: true,
      }),
      // 스킬 정보
      Skill.findAll({
        include: [
          {
            model: SkillImage,
            as: 'image',
            attributes: ['url', 'backgroundColor'],
          },
        ],
        where: { id: CharacterData.path },
        attributes: [
          'name',
          'tag',
          'info',
          'type',
          'levelData',
          'levelReq',
          'promotionReq',
        ],
        raw: true,
        nest: true,
      }),
      // 캐릭터 이미지 (카드 제외)
      CharacterImage.findAll({
        where: {
          characterId: id,
          layout: { [Op.notLike]: '%card' },
        },
        order: [['layout', 'DESC']],
        raw: true,
      }),
    ]);

    // 4. 장착 아이템 정보 조회
    const [cardItems, relicItems, accessoryItems] = await Promise.all([
      itemForSearch(CharacterData.info.itemData.card),
      itemForSearch(CharacterData.info.itemData.relics),
      itemForSearch(CharacterData.info.itemData.accessories),
    ]);

    // 5. 응답 데이터 구성
    const responseData = {
      ...CharacterData,
      element: elementType,
      path: pathType,
      info: {
        ...CharacterData.info,
        itemData: {
          card: cardItems,
          relics: relicItems,
          accessories: accessoryItems,
        },
      },
      images,
      skill: skillData,
    };

    return res.status(200).json({
      resultCode: 200,
      resultMsg: 'NORMAL SERVICE',
      items: responseData,
    });
  }
}

export default new CharacterController();
