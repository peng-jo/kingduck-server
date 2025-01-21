import { Game } from '../../models/game/GameDef.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';
import { Item } from '../../models/Item/ItemDef.Vo';

/**
 * 게임 공통 조회 관리 클래스
 */
export class GameQuery {
  /**
   * 아이템 검색 유틸리티 함수
   * @param data 조회할 아이템 ID 배열
   * @returns 아이템 상세 정보 배열
   */
  async itemForSearch(data: any) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const itemSearchArr = [];
    for (const itemId of data) {
      if (!itemId) continue;

      const itemData = await Item.findOne({
        where: { id: Number(itemId) },
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

      if (itemData) {
        itemSearchArr.push(itemData);
      }
    }

    return itemSearchArr;
  }

  /**
   * 게임 정보 조회
   * @param slug 게임 식별자
   * @returns 게임 정보
   */
  async getGameInfo(slug: string) {
    return await Game.findOne({
      where: { 'title.en': slug },
      raw: true,
      nest: true,
    });
  }

  /**
   * 타입 목록 조회
   * @param gameId 게임 ID
   * @returns 타입 목록 (이미지 포함)
   */
  async getTypeList(gameId: number) {
    return await TypeDef.findAll({
      include: [
        {
          model: TypeImage,
          as: 'image',
          attributes: ['url', 'backgroundColor'],
        },
      ],
      attributes: ['name', 'id'],
      where: { gameId },
      raw: true,
      nest: true,
    });
  }
}

export default new GameQuery();
