import { Request, Response } from 'express';

export class TestController {
  async get_test(req: Request, res: Response): Promise<void> {
    console.log('----------------------------------');
    console.log('chat');
    console.log('파일 데이터 테스트');
    console.log('----------------------------------');
    res.send('hello!');
  }
}

export default new TestController();
