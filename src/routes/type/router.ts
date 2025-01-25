import express from 'express';

// 컨트롤러 참조
import TypeCreateController from './typeCreateController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/set/GirlsFrontline2', TypeCreateController.GirlsFrontline2TypeSet);

export default router;
