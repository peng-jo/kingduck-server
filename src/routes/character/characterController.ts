import express from 'express';
import GameQuery from '../../manager/AllGame/GameQuery';
import CharacterSearch from '../../manager/HonkaiStarRail/CharacterSearch';

export class CharacterController {
  /**
   * 캐릭터 목록 조회 API
   * 1. 게임 정보 조회
   * 2. 타입(속성, 경로) 정보 조회
   * 3. 캐릭터 기본 정보 및 이미지 조회
   * 4. 캐릭터별 속성/경로 정보 매핑
   */
  async getCharacterList(req: any, res: any): Promise<void> {
    const { slug } = req.params;

    // 1. 게임 정보 조회
    const gameData = await GameQuery.getGameInfo(slug);

    if (!gameData) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'GAME NOT FOUND',
      });
    }

    const result = await CharacterSearch.searchCharacterList(gameData);

    return res.status(200).json(result);
  }

  /**
   * 캐릭터 상세 정보 조회 API
   * 1. 게임 정보 조회
   * 2. 캐릭터 기본 정보 조회
   * 3. 추가 정보 병렬 조회 (속성, 경로, 스킬, 이미지)
   * 4. 장착 아이템 정보 조회
   * 5. 응답 데이터 구성
   */
  async getCharacter(req: any, res: any): Promise<void> {
    const { slug, id } = req.params;

    // 1. 게임 정보 조회
    const gameData = await GameQuery.getGameInfo(slug);

    if (!gameData) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'GAME NOT FOUND',
      });
    }

    const result = await CharacterSearch.searchCharacterDetail(gameData, id);
    return res.status(200).json(result);
  }
}

export default new CharacterController();
