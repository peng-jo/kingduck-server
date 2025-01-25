import { Op } from 'sequelize';
import { Character } from '../../models/character/CharacterDef.Vo';
import { CharacterInfo } from '../../models/character/CharacterInfo.Vo';
import { CharacterImage } from '../../models/character/CharacterImage.Vo';
import { TypeDef } from '../../models/type/TypeDef.Vo';
import { TypeImage } from '../../models/type/TypeImage.Vo';
import Skill from '../../models/skill/SkillDef.Vo';
import SkillImage from '../../models/skill/SkillImage.Vo';
import { GameQuery } from '../AllGame/GameQuery';
/**
 * 붕괴: 스타레일 캐릭터 조회 관리 클래스
 * GameQuery 클래스를 상속받아 공통 기능을 재사용
 */
export class GirlsFrontline2CharacterQuery extends GameQuery {
  /**
   * 캐릭터 목록 조회
   * @param gameId - 게임 ID
   * @returns 캐릭터 목록과 카드 이미지 정보
   */
  async getCharacterList(gameId: number) {
    return await Character.findAll({
      include: [
        {
          model: CharacterImage,
          as: 'images',
          where: { layout: 'card' },
          attributes: ['url', 'layout'],
        },
      ],
      attributes: ['isNew', 'isReleased', 'name', 'rarity', 'id', 'type'],
      order: [
        ['rarity', 'DESC'],
        ['releaseDate', 'DESC'],
      ],
      where: { gameId },
      raw: true,
      nest: true,
    });
  }
}
export default new GirlsFrontline2CharacterQuery();
