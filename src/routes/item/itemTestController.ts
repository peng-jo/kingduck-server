import HonkaiStarRailItemCreate from '../../manager/HonkaiStarRail/ItemCreate';

/**
 * 아이템 데이터 테스트 컨트롤러 클래스
 */
export class ItemTestController {
  /**
   * 아이템 데이터 설정 메서드
   * @param req 요청 객체
   * @param res 응답 객체
   */
  async itemSetAll(req: any, res: any): Promise<void> {
    // 자동으로 참조한 곳의 json 데이터를 저장 하게 설계 함
    const result = await HonkaiStarRailItemCreate.itemSetAll();
    if (!result) {
      return res.status(200).json({
        resultCode: 400,
        resultMsg: 'GAME NOT FOUND',
      });
    }

    return res.status(200).json({
      resultCode: 200,
      itme: result,
      resultMsg: '생성 완료',
    });
  }
}

export default new ItemTestController();
