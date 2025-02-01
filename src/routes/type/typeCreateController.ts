import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as ImageUtils from '../../utils/imageUtils';
// 데이터 베이스 값 참조
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';

// 타입 데이터 값 처리
import typeJson from '../../manager/GirlsFrontline2/setJosn/type.json';
import nikkeTypeJson from '../../manager/Nikke/setJson/type.json';

export class TypeCreateController {
  /**
   * 소녀전선2: 망명 타입 데이터 설정 함수
   * @param req Express Request 객체
   * @param res Express Response 객체
   */
  async GirlsFrontline2TypeSet(req: any, res: any): Promise<void> {
    // 타입과 이미지 데이터를 저장할 배열 초기화
    const setTypes: any[] = [];
    const setTypesImage: any[] = [];
    let setTypesCount = 0;

    // JSON 데이터 로드
    const data = typeJson;

    // 각 타입 데이터 처리
    for (const item of Object.values(data)) {
      try {
        // 기존 타입 데이터 중복 체크
        const existingType = await TypeDef.findOne({
          where: {
            gameId: 2,
            group: item.group,
            'name.ko': item.name.ko,
          },
        });

        // 중복된 데이터 스킵
        if (existingType) {
          console.log(`이미 존재하는 타입입니다: ${item.name.ko}`);
          continue;
        }

        // 타입 기본 정보 설정
        const setTypeBase = {
          gameId: 2,
          group: item.group,
          name: {
            ko: item.name.ko,
            jp: item.name.jp,
            en: item.name.en,
            cn: item.name.cn,
          },
          info: '',
        };

        // 타입 데이터 저장
        setTypes[setTypesCount] = setTypeBase;
        const createTypesItem = await TypeDef.create(setTypeBase);

        // 이미지 다운로드 처리
        const imageUrl = item.icon;
        const directory = path.join(__dirname, '../../../static/image/type');
        const imageName = uuidv4().replace(/-/g, '');
        const filename = `${imageName}.webp`;

        await ImageUtils.downloadImage(imageUrl, directory, filename);

        // 이미지 정보 설정 및 저장
        const setTypeImageBase = {
          pathTypeId: createTypesItem.id,
          backgroundColor: '#ffffff',
          layout: '',
          url: 'assets/image/type/' + imageName,
        };

        setTypesImage[setTypesCount] = setTypeImageBase;
        await TypeImage.create(setTypeImageBase);

        setTypesCount++;
      } catch (error) {
        console.error('타입 데이터 처리 중 오류 발생:', error);
        throw error;
      }
    }

    // 결과 반환
    res.status(200).json({
      items: setTypes,
      images: setTypesImage,
    });
  }
  /**
   * 승리의 여신 니케 타입 데이터 설정 함수
   * @param req Express Request 객체
   * @param res Express Response 객체
   */
  async NikkeTypeSet(req: any, res: any): Promise<void> {
    // 타입과 이미지 데이터를 저장할 배열 초기화
    const setTypes: any[] = [];
    const setTypesImage: any[] = [];
    let setTypesCount = 0;

    // JSON 데이터 로드
    const data = nikkeTypeJson;

    // 각 타입 데이터 처리
    for (const item of Object.values(data)) {
      try {
        // 기존 타입 데이터 중복 체크
        const existingType = await TypeDef.findOne({
          where: {
            gameId: 2,
            group: item.group,
            'name.ko': item.name.ko,
          },
        });

        // 중복된 데이터 스킵
        if (existingType) {
          console.log(`이미 존재하는 타입입니다: ${item.name.ko}`);
          continue;
        }

        // 타입 기본 정보 설정
        const setTypeBase = {
          gameId: 3,
          group: item.group,
          name: {
            ko: item.name.ko,
            jp: item.name.jp,
            en: item.name.en,
            cn: item.name.cn,
          },
          info: '',
        };

        // 타입 데이터 저장
        setTypes[setTypesCount] = setTypeBase;
        const createTypesItem = await TypeDef.create(setTypeBase);

        // 이미지 다운로드 처리
        const imageUrl = item.icon;
        const directory = path.join(
          __dirname,
          '../../../static/image/nikke/type',
        );
        const imageName = uuidv4().replace(/-/g, '');
        const filename = `${imageName}.webp`;

        await ImageUtils.downloadImage(imageUrl, directory, filename);

        // 이미지 정보 설정 및 저장
        const setTypeImageBase = {
          pathTypeId: createTypesItem.id,
          backgroundColor: '#ffffff',
          layout: '',
          url: 'assets/image/nikke/type/' + imageName,
        };

        setTypesImage[setTypesCount] = setTypeImageBase;
        await TypeImage.create(setTypeImageBase);

        setTypesCount++;
      } catch (error) {
        console.error('타입 데이터 처리 중 오류 발생:', error);
        throw error;
      }
    }

    // 결과 반환
    res.status(200).json({
      items: setTypes,
      images: setTypesImage,
    });
  }
}

export default new TypeCreateController();
