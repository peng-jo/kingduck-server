import express from 'express';

// 컨트롤러 참조
import TestController from './testController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/itemRelicsSet', TestController.itemRelicsSet);
router.get('/itemPlanetarySet', TestController.itemPlanetarySet);
router.get('/itemSet', TestController.itemSet);
router.get('/itemsearch', TestController.itemSearch);

router.get('/typeSet', TestController.typeSet);

export default router;
