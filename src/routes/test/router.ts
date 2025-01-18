import express from 'express';

// 컨트롤러 참조
import TestController from './testController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/youtube', TestController.get_youtubeTest);

export default router;
