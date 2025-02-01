import express from 'express';

// 컨트롤러 참조
import TypeCreateController from './typeCreateController';
import TypeController from './typeController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/set/GirlsFrontline2', TypeCreateController.GirlsFrontline2TypeSet);
router.get('/set/Nikke', TypeCreateController.NikkeTypeSet);
// 요청 method 별로 라우팅
router.get('/get/:slug', TypeController.getGameType); // 전체 리스트 조회

export default router;
