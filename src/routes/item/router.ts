import express from 'express';

// 컨트롤러 참조
import ItemTestController from './itemTestController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/test/RelicsSet', ItemTestController.itemRelicsSet);
router.get('/test/itemSet', ItemTestController.itemSet);
router.get('/test/search', ItemTestController.itemSearch);
router.get('/test/cardSet', ItemTestController.itemCardSet);

export default router;
