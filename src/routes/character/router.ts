import express from 'express';

// 컨트롤러 참조
import CharacterController from './characterController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅
router.get('/', CharacterController.getCharacter);

export default router;
