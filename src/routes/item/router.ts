import express from 'express';

// 컨트롤러 참조
import ItemTestController from './itemTestController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/test/all', ItemTestController.itemSetAll);

export default router;
