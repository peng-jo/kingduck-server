import express from 'express';

// 컨트롤러 참조
import TestController from './testController';
import routes from '..';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get('/code', TestController.getCodeTest);
router.get('/youtube', TestController.get_youtubeTest);
router.get('/namuwiki', TestController.getNamuWikiContent);

export default router;
