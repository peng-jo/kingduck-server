import express from 'express';
import fs from 'fs';
// 데이터 베이스 값 참조
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import sequelize from '../../models';
import { QueryTypes, where } from 'sequelize';

// 데이터 베이트 테이블 참조

export class CharacterController {
  async getCharacter(req: any, res: any): Promise<void> {
    console.log('----------------------------------');
    console.log('게임 리스트 - 게임 리스트 내보내기 ');
    console.log('----------------------------------');

    const query = req.query;

    let characterContent: any = {};

    const printVOquery = {
      where: {
        pageId: 'theherta', //query,
      },
      raw: true,
    };
    let CharacterData: any = await Character.findOne(printVOquery);

    const printCharacterInfoQuery = {
      where: {
        characterId: CharacterData.id,
      },
      raw: true,
    };
    let CharacterInfoData: any = await CharacterInfo.findOne(
      printCharacterInfoQuery,
    );
    CharacterData.info = CharacterInfoData;

    if (CharacterData) {
      res.status(200).json({
        resultCode: 200,
        resultMsg: 'NORMAL SERVICE',
        items: CharacterData,
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
