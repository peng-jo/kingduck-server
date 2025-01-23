import HonkaiStarRailCharacterCreate from '../../manager/HonkaiStarRail/CharacterCreate';
import GirlsFrontline2CharacterCreate from '../../manager/GirlsFrontline2/CharacterCreate';

/**
 * 캐릭터 데이터 생성 및 업데이트 컨트롤러 클래스
 */
export class characterCreateController {
  /**
   * 캐릭터 데이터 설정 메서드
   * @param req 요청 객체
   * @param res 응답 객체
   */
  async HonkaiStarRailCharacterSet(req: any, res: any): Promise<void> {
    // 자동으로 참조한 곳의 json 데이터를 저장 하게 설계 함
    const result: any = await HonkaiStarRailCharacterCreate.CharacterSet();
    if (!result) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'GAME NOT FOUND',
      });
    }

    return res.status(200).json({
      resultCode: 200,
      resultMsg: '생성 완료',
    });
  }
  async GirlsFrontline2CharacterSet(req: any, res: any): Promise<void> {
    const result: any = await GirlsFrontline2CharacterCreate.CharacterSet();
    if (!result) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'GAME NOT FOUND',
      });
    }

    return res.status(200).json({
      resultCode: 200,
      resultMsg: '생성 완료',
    });
  }
}

export default new characterCreateController();
