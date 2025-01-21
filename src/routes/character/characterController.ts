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

// 아이템 검색 함수
async function itemForSearch(data: any) {
  const itemSearchArr = [];
  for (const item of Object.values(data)) {
    const itemData = await Item.findOne({
      where: { id: item },
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
  // 캐릭터 목록 조회
  async getCharacterList(req: any, res: any): Promise<void> {
    const query = req.query;

    // 타입 목록 조회
    const TypeList = await TypeDef.findAll({
      include: [
        {
          model: TypeImage,
          as: 'image',
          attributes: ['url', 'backgroundColor'],
        },
      ],
      attributes: ['name', 'id'],
      where: { gameId: query.gameId },
      raw: true,
      nest: true,
    });

    // 캐릭터 목록 조회
    const printVOquery = {
      include: [
        {
          model: CharacterImage,
          as: 'images',
          where: { layout: 'card' },
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
        ['rarity', 'DESC'],
        ['releaseDate', 'DESC'],
      ],
      where: { gameId: query.gameId },
      raw: true,
      nest: true,
    };
    const CharacterData = await Character.findAll({
      ...printVOquery,
      order: [
        ['rarity', 'DESC'],
        ['releaseDate', 'DESC'],
      ],
    });

    if (!CharacterData || CharacterData.length === 0) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }

    // 캐릭터 데이터 가공
    const CharacterList = CharacterData.map((item) => {
      const elementType = TypeList.find(
        (fitem) => Number(fitem.id) === Number(item?.element),
      );
      const pathType = TypeList.find(
        (fitem) => Number(fitem.id) === Number(item?.path),
      );
      return {
        ...item,
        element: elementType,
        path: pathType,
      };
    });

    return res.status(200).json({
      resultCode: 200,
      items: CharacterList,
      resultMsg: 'SUCCESS',
    });
  }

  // 캐릭터 상세 조회
  async getCharacter(req: any, res: any): Promise<void> {
    const { id } = req.query;

    // 캐릭터 기본 정보 조회
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

    // 추가 데이터 조회
    const [elementType, pathType, skillData, images] = await Promise.all([
      // 속성 타입 조회
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
      // 경로 타입 조회
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
      // 스킬 데이터 조회
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
      // 이미지 조회
      CharacterImage.findAll({
        where: {
          characterId: id,
          layout: { [Op.notLike]: '%card' },
        },
        order: [['layout', 'DESC']],
        raw: true,
      }),
    ]);

    // 아이템 데이터 조회
    const [cardItems, relicItems, accessoryItems] = await Promise.all([
      itemForSearch(CharacterData.info.itemData.card),
      itemForSearch(CharacterData.info.itemData.relics),
      itemForSearch(CharacterData.info.itemData.accessories),
    ]);

    // 응답 데이터 구성
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
