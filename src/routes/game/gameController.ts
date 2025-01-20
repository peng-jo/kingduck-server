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
  async getGame(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('게임 리스트 - 게임 리스트 내보내기 ');
    console.log('----------------------------------');

    const query = req.query;

    try {
      const gameList: any = await Game.findOne({
        where: {
          'title.en': query.en,
        },
      });
      console.log(gameList);

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
    } catch (error) {
      console.error('Error fetching game list:', error);
      res.status(500).json({
        resultCode: 500,
        resultMsg: 'INTERNAL SERVER ERROR',
      });
    }
  }
}

export default new GameController();
