import express from 'express';

// 컨트롤러 참조
import TestController from './itemTestController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/test/RelicsSet', TestController.itemRelicsSet);
router.get('/test/PlanetarySet', TestController.itemPlanetarySet);
router.get('/test/Set', TestController.itemSet);
router.get('/test/search', TestController.itemSearch);

export default router;
