import express from 'express';
import fs from 'fs';
// 데이터 베이스 값 참조
import { Game } from '../../models/game/GameDef.Vo';
import sequelize from '../../models';
import { QueryTypes } from 'sequelize';

// 데이터 베이트 테이블 참조

export class GameController {
  async getGameList(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('게임 리스트 - 게임 리스트 내보내기 ');
    console.log('----------------------------------');

    const query = req.query;

    /*
    const querys = `SELECT * FROM game`;
    const result = await sequelize.query(querys, { type: QueryTypes.SELECT });
    console.log(result);

    // 요청 페이지 넘버
    let page = query.pageNum;
    let offset = 0;

    if (page > 1) {
      offset = query.pageSize * (page - 1);
    }

    // 쿼리문
    const printVOquery = {
      order: [[query.key, query.dir]],
      offset: offset,
      limit: query.pageSize,
    };
    */

    const gameList: any = await Game.findAll();
    if (gameList) {
      res.status(200).json({
        resultCode: 200,
        resultMsg: 'NORMAL SERVICE',
        items: gameList,
      });
    } else {
      res.status(200).json({
        resultCode: 400,
        resultMsg: 'DATA BASE ERROR',
      });
    }
  }
}

export default new GameController();
