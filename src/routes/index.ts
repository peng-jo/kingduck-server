import { Router } from 'express';
import test from './test/router';
import game from './game/router';
import item from './item/router';
import character from './character/router';

const routes = Router();

// 라우터 분기시 사용
routes.use('/api/v0/test/', test);
routes.use('/api/v0/game/', game);
routes.use('/api/v0/item/', item);
routes.use('/api/v0/character/', character);

export default routes;
