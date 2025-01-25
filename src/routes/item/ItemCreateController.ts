// 필수 모듈 임포트
import HonkaiStarRailItemCreate from '../../manager/HonkaiStarRail/ItemCreate';
import GirlsFrontline2ItemCreate from '../../manager/GirlsFrontline2/ItemCreate';

/**
 * 아이템 데이터 생성 및 관리를 위한 컨트롤러 클래스
 */
export class ItemCreateController {
  /**
   * 붕괴: 스타레일 아이템 데이터 생성 메서드
   * @param req Express 요청 객체
   * @param res Express 응답 객체
   * @returns 생성된 아이템 데이터 또는 에러 응답
   */
  async HonkaiStarRailItemSetAll(req: any, res: any): Promise<void> {
    try {
      // 아이템 데이터 생성 실행
      const result = await HonkaiStarRailItemCreate.itemSetAll();

      // 결과가 없는 경우 에러 응답
      if (!result) {
        return res.status(200).json({
          resultCode: 400,
          resultMsg: 'GAME NOT FOUND',
        });
      }

      // 성공 응답 반환
      return res.status(200).json({
        resultCode: 200,
        item: result, // 오타 수정: itme -> item
        resultMsg: '생성 완료',
      });
    } catch (error) {
      // 에러 발생 시 에러 응답
      return res.status(500).json({
        resultCode: 500,
        resultMsg: '서버 오류가 발생했습니다.',
      });
    }
  }

  /**
   * 소녀전선2: 망령 아이템 데이터 생성 메서드
   * @param req Express 요청 객체
   * @param res Express 응답 객체
   * @returns 생성된 아이템 데이터 또는 에러 응답
   */
  async GirlsFrontline2ItemSetAll(req: any, res: any): Promise<void> {
    try {
      // 아이템 데이터 생성 실행
      const result = await GirlsFrontline2ItemCreate.itemSetAll();

      // 결과가 없는 경우 에러 응답
      if (!result) {
        return res.status(200).json({
          resultCode: 400,
          resultMsg: 'GAME NOT FOUND',
        });
      }

      // 성공 응답 반환
      return res.status(200).json({
        resultCode: 200,
        item: result, // 오타 수정: itme -> item
        resultMsg: '생성 완료',
      });
    } catch (error) {
      // 에러 발생 시 에러 응답
      return res.status(500).json({
        resultCode: 500,
        resultMsg: '서버 오류가 발생했습니다.',
      });
    }
  }
}

// 컨트롤러 인스턴스 생성 및 내보내기
export default new ItemCreateController();
