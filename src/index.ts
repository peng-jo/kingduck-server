import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// DB ORM 참조
import { config } from './config/config';
import routers from './routes/';
import sequelize from './models';
import path from 'path';

const app = express();
const port = config.port;

var corOptions = {
  // 주소 필요
  origin: 'http://localhost:5173',
};

app.use(cors(corOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// 이미지 영상 처리
app.use('/assets', express.static(path.join(__dirname, '../static')));

app.use('/', routers);

app.listen(port, async () => {
  console.log(`✅ Example app listening on port ${port}`);

  //checking if connection is done
  await sequelize
    .authenticate()
    .then(() => {
      console.log(`✅ Database connected to discover`);
    })
    .catch((err) => {
      console.log(err);
    });
});
