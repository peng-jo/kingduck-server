import express from 'express';

// 컨트롤러 참조
import CharacterController from './characterController';
import CharacterTestController from './characterTestController';
import characterController from './characterController';

const router = express.Router();

//router.use(cors(corsOpt));

// 테스트용
router.get('/test/setData', CharacterTestController.CharacterSet);

// 요청 method 별로 라우팅
router.get('/:slug', characterController.getCharacterList); // 전체 리스트 조회
router.get('/:slug/:id', CharacterController.getCharacter); // 특정 캐릭터 조회

export default router;
