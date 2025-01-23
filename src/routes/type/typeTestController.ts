import express from 'express';
import fs from 'fs';
// 데이터 베이스 값 참조
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';

export class ItemTestController {
  // 아이템 넣기 - json 데이터 형태
  // 붕괴 스타레일 유효
  async typeSet(req: any, res: any): Promise<void> {
    const data: any = testType;
    const uniqueTypes: any = {};
    let setTypesItem = [];
    let setTypesImageItem = [];
    let setTypesCount = 0;

    // 캐릭터 전체에서 확인
    const extractUniqueValues = (data: any) => {
      data.forEach((item: any) => {
        if (!uniqueTypes[item.damageType.iconPath]) {
          uniqueTypes[item.damageType.iconPath] = item.damageType;
        }
        if (!uniqueTypes[item.baseType.iconPath]) {
          uniqueTypes[item.baseType.iconPath] = item.baseType;
        }
      });
      return {
        uniqueTypes: Object.values(uniqueTypes),
      };
    };
    const result = extractUniqueValues(data);

    // 재처리
    for (const item of Object.values(result.uniqueTypes)) {
      const koTypeItme: any = koType.find((titem) => titem.name === item.name);
      const jpTypeItme: any = jpType.find(
        (titem) => titem.icon === koTypeItme.icon,
      );
      const enTypeItme: any = enType.find(
        (titem) => titem.icon === koTypeItme.icon,
      );
      const cnTypeItme: any = cnType.find(
        (titem) => titem.icon === koTypeItme.icon,
      );
      console.log(koTypeItme);

      let setTypeBase = {
        group: koTypeItme.group,
        name: {
          ko: koTypeItme.name,
          jp: jpTypeItme.name,
          en: enTypeItme.name,
          cn: cnTypeItme.name,
        },
        info: '',
      };
      setTypesItem[setTypesCount] = setTypeBase;
      const createTypesItem = await TypeDef.create(setTypeBase);

      // 이미지 테이블 처리를 위한 구문
      let setTypeImageBase = {
        pathTypeId: createTypesItem.id,
        backgroundColor: item.color,
        layout: '',
        url: 'assets/image/type/' + item.iconPath,
      };

      setTypesImageItem[setTypesCount] = setTypeImageBase;
      const createTypeImage = await TypeImage.create(setTypeImageBase);

      setTypesCount++;
    }
    res.status(200).json({
      items: setTypesItem,
      images: setTypesImageItem,
    });
  }
}

export default new TestController();
