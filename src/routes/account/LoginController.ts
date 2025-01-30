import { User } from '../../models/user/AccountUser.Vo';
import Login from '../../manager/Login/Login';
import { HashEncryptionUtil } from '../../manager/Login/HashEncryptionUtil';

export class LoginController {
  /**
   * 로그인 메서드
   * @param req - 요청 객체
   * @param res - 응답 객체
   * @returns json
   * {
   *   resultCode: 코드,
   *   item: 항목,
   *   resultMsg: 에러메세지
   * }
   */
  async Login(req: any, res: any): Promise<void> {
    const { email, password } = JSON.parse(JSON.stringify(req.body));

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({
        resultCode: 400,
        item: 'email',
        resultMsg: '존재하지 않는 이메일입니다.',
      });
    }

    let isAdmin = user.teamId !== 0;

    const loginResult = await Login.processLogin(
      password,
      user.password,
      user.email,
      isAdmin,
    );

    if (loginResult.success) {
      console.log('로그인 성공, 토큰:', loginResult.token);
      return res.status(200).json({
        resultCode: 200,
        accessToken: loginResult.token,
        refreshToken: loginResult.refreshToken,
        resultMsg: '로그인 성공',
      });
    } else {
      console.log('로그인 실패:', loginResult.message);
      return res.status(400).json({
        resultCode: 400,
        item: 'password',
        resultMsg: loginResult.message || '비밀번호가 일치하지 않습니다.',
      });
    }
  }
}

export default new LoginController();
