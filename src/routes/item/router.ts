import express from 'express';

// 컨트롤러 참조
import ItemCreateController from './ItemCreateController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get(
  '/set/HonkaiStarRail/all',
  ItemCreateController.HonkaiStarRailItemSetAll,
);
router.get(
  '/set/GirlsFrontline2/all',
  ItemCreateController.GirlsFrontline2ItemSetAll,
);
router.get('/set/Nikke/all', ItemCreateController.NikkeItemSetAll);

export default router;
