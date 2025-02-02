import express from 'express';

// 컨트롤러 참조
import VideoController from './videoController';

const router = express.Router();

//router.use(cors(corsOpt));

// 요청 method 별로 라우팅itemSet
router.get(
  '/get/youtube/:characterId/:youtubeVideoId',
  VideoController.getYoutubeVideo,
);

export default router;
