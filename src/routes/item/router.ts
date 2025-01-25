import express from 'express';

// 컨트롤러 참조
import ItemCreateController from './ItemCreateController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get(
  '/HonkaiStarRail/all',
  ItemCreateController.HonkaiStarRailItemSetAll,
);
router.get(
  '/GirlsFrontline2/all',
  ItemCreateController.GirlsFrontline2ItemSetAll,
);

export default router;
