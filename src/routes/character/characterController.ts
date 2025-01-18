import express from 'express';
import fs from 'fs';
// 데이터 베이스 값 참조
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';
import sequelize from '../../models';
import { QueryTypes, where, Op } from 'sequelize';
import { Item } from '../../models/Item/ItemDef.Vo';

// 데이터 베이트 테이블 참조
async function itemForSearch(data: any) {
  let itemSearchArr = [];
  for (const item of Object.values(data)) {
    const itemData = await Item.findOne({
      where: {
        id: item,
      },
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
  async getCharacterList(req: any, res: any): Promise<void> {
    const query = req.query;

    // 타입 전체를 불러옵니다.
    const TypeList = await TypeDef.findAll({
      include: [
        // <- 이걸 쓸려면 고민좀 해야되는 구간이 많습니다. (데이터 입력에서 좀 머리가 아픔)
        {
          model: TypeImage,
          as: 'image',
          attributes: ['url', 'backgroundColor'],
        },
      ],
      attributes: ['name', 'id'],
      where: {
        gameId: query.gameId,
      },
      raw: true, // <----- HERE
      nest: true, // <----- HERE
    });

    // 리스트 페이지에서 필요한 부분만 처리합니다.
    const printVOquery = {
      include: [
        {
          model: CharacterImage,
          as: 'images',
          where: {
            layout: 'card',
          },
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
      where: {
        gameId: query.gameId,
      },
      raw: true, // <----- HERE
      nest: true, // <----- HERE
    };
    let CharacterData: any = await Character.findAll(printVOquery);

    let CharacterList = [];

    if (CharacterData) {
      // 타입이 string로 처리 되어있어 ( 추후 복수의 속성 값이 있을수 있다는 판단으로 )
      for (const item of Object.values(CharacterData)) {
        const elementType: any = TypeList.find(
          (fitem: any) => fitem.id == item?.element,
        );
        const pathType: any = TypeList.find(
          (fitem: any) => fitem.id == item?.path,
        );
        item.element = elementType;
        item.path = pathType;
        CharacterList.push(item);
      }
      res.status(200).json({
        resultCode: 200,
        items: CharacterList,
        resultMsg: 'DATA BASE ERROR',
      });
    } else {
      res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }
  }

  async getCharacter(req: any, res: any): Promise<void> {
    const query = req.query;

    console.log(query.id);

    // 리스트 페이지에서 필요한 부분만 처리합니다.
    const printVOquery = {
      include: [
        {
          model: CharacterInfo,
          as: 'info',
          attributes: ['stats', 'itemData', 'ranks'],
        },
      ],
      where: {
        id: query.id,
      },
      raw: true, // <----- HERE
      nest: true, // <----- HERE
    };
    let CharacterData: any = await Character.findOne(printVOquery);

    if (CharacterData) {
      let outCharacterData = CharacterData;
      // 타입를 불러옵니다.
      const elementType = await TypeDef.findOne({
        include: [
          // <- 이걸 쓸려면 고민좀 해야되는 구간이 많습니다. (데이터 입력에서 좀 머리가 아픔)
          {
            model: TypeImage,
            as: 'image',
            attributes: ['url', 'backgroundColor'],
          },
        ],
        attributes: ['name', 'id'],
        where: {
          id: CharacterData?.element,
        },
        raw: true, // <----- HERE
        nest: true, // <----- HERE
      });
      const pathType = await TypeDef.findOne({
        include: [
          // <- 이걸 쓸려면 고민좀 해야되는 구간이 많습니다. (데이터 입력에서 좀 머리가 아픔)
          {
            model: TypeImage,
            as: 'image',
            attributes: ['url', 'backgroundColor'],
          },
        ],
        attributes: ['name', 'id'],
        where: {
          id: CharacterData?.path,
        },
        raw: true, // <----- HERE
        nest: true, // <----- HERE
      });
      const Image = await CharacterImage.findAll({
        where: {
          characterId: query.id,
          layout: {
            [Op.notLike]: '%card',
          },
        },
        order: [['layout', 'DESC']],
        raw: true, // <----- HERE
      });
      outCharacterData.element = elementType;
      outCharacterData.path = pathType;
      // 아이템 구문 처리
      outCharacterData.info.itemData.card = await itemForSearch(
        CharacterData.info.itemData.card,
      );
      outCharacterData.info.itemData.relics = await itemForSearch(
        CharacterData.info.itemData.relics,
      );
      outCharacterData.info.itemData.accessories = await itemForSearch(
        CharacterData.info.itemData.accessories,
      );
      outCharacterData.images = Image;

      console.log(outCharacterData.images);

      res.status(200).json({
        resultCode: 200,
        resultMsg: 'NORMAL SERVICE',
        items: outCharacterData,
      });
    } else {
      res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }
  }
}

export default new CharacterController();
