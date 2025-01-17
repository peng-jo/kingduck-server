import express from 'express';

// 컨트롤러 참조
import CharacterController from './characterController';
import CharacterTestController from './characterTestController';
import characterController from './characterController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅
router.get('/', CharacterController.getCharacter);
router.get('/list/', characterController.getCharacterList);

// 테스트용
router.get('/test/setData', CharacterTestController.CharacterSet);

export default router;
