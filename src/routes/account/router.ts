import express from 'express';

// 컨트롤러 참조
import AccountController from './AccountController';
import LoginController from './LoginController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.post('/create/account', AccountController.AccountCreateAll);
router.post('/validate/email', AccountController.AccountCheckEmail);
router.post('/login', LoginController.Login);

export default router;
