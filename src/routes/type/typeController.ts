import express from 'express';
import fs from 'fs';
// 데이터 베이스 값 참조
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';
import GameQuery from '../../manager/AllGame/GameQuery';

export class TypeController {
  // 아이템 넣기 - json 데이터 형태
  // 붕괴 스타레일 유효
  async getGameType(req: any, res: any): Promise<void> {
    const { slug } = req.params;

    console.log(slug);

    // 1. 게임 정보 조회
    const gameData = await GameQuery.getGameInfo(slug);

    console.log(gameData);

    // 1-1. 게임 정보 없으면 오류 반환
    if (!gameData) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'GAME NOT FOUND',
      });
    }

    // 2. 타입 정보 조회
    const typeDataRaw = await TypeDef.findAll({
      where: { gameId: gameData.id },
      include: [
        {
          model: TypeImage,
          as: 'image',
          attributes: ['url', 'backgroundColor'],
        },
      ],
      raw: true,
      nest: true,
    });

    // group별로 데이터 분류
    const typeData = typeDataRaw.reduce((acc: any, curr: any) => {
      const group = curr.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(curr);
      return acc;
    }, {});

    if (typeData) {
      res.status(200).json({
        resultCode: 200,
        resultMsg: 'NORMAL SERVICE',
        items: typeData,
      });
    } else {
      res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }
  }
}

export default new TypeController();
