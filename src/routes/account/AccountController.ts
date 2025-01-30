import { User } from '../../models/user/AccountUser.Vo';
import { HashEncryptionUtil } from '../../manager/Login/HashEncryptionUtil';
/**
 * 계정 생성 및 관리를 위한 컨트롤러 클래스
 */
export class AccountController {
  /**
   * 계정 생성 메서드
   * @param req - 요청 객체
   * @param res - 응답 객체
   * @returns json
   * {
   *   resultCode: 코드,
   *   item: 항목,
   *   resultMsg: 에러메세지
   * }
   */
  async AccountCreateAll(req: any, res: any): Promise<void> {
    const { email, password, name, passwordChk } = JSON.parse(
      JSON.stringify(req.body),
    );

    console.log(email, password, name);

    const user = await User.findOne({ where: { email } });

    // 이메일 유효성 검사 - 이메일 중복
    if (user) {
      return res.status(400).json({
        resultCode: 400,
        item: 'email',
        resultMsg: '이미 존재하는 이메일입니다.',
      });
    }
    // 비밀번호 유효성 검사 - 비밀번호 일치
    if (password !== passwordChk) {
      return res.status(400).json({
        resultCode: 400,
        item: 'password',
        resultMsg: '비밀번호가 일치하지 않습니다.',
      });
    }
    // 비밀번호 유효성 검사 - 8자 이상
    if (password.length < 8) {
      return res.status(400).json({
        resultCode: 400,
        item: 'password',
        resultMsg: '비밀번호는 8자 이상이어야 합니다.',
      });
    }

    const hashEncryptionUtil = new HashEncryptionUtil(15);
    const hashedPwd = await hashEncryptionUtil.encryptPassword(password);

    const uuid = crypto.randomUUID();

    try {
      // 사용자 데이터 생성 실행
      const result = await User.create({
        email,
        password: hashedPwd,
        name,
        uuid,
        teamId: 0,
      });

      // 결과가 없는 경우 에러 응답
      if (!result) {
        return res.status(500).json({
          resultCode: 500,
          item: 'user',
          resultMsg: '계정생성에 오류가 있습니다.',
        });
      }

      // 성공 응답 반환
      return res.status(200).json({
        resultCode: 200,
        item: 'ok', // 오타 수정: itme -> item
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
   * 이메일 중복 체크 메서드
   * @param req - 요청 객체
   * @param res - 응답 객체
   * @returns json
   * {
   *   resultCode: 코드,
   *   item: 항목,
   *   resultMsg: 에러메세지
   * }
   */
  async AccountCheckEmail(req: any, res: any): Promise<void> {
    const { email } = JSON.parse(JSON.stringify(req.body));

    const user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(400).json({
        resultCode: 400,
        item: 'email',
        resultMsg: '이미 존재하는 이메일입니다.',
      });
    }

    // 성공 응답 반환
    return res.status(200).json({
      resultCode: 200,
      item: 'ok', // 오타 수정: itme -> item
      resultMsg: '생성 완료',
    });
  }
}

export default new AccountController();
