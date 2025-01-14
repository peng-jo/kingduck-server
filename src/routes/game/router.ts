import express from 'express';

// 컨트롤러 참조
import GameController from './gameController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅
router.get('/', GameController.getGameList);

export default router;
