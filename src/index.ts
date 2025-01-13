import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// DB ORM 참조
import Sequelize from 'sequelize';

const app = express();
const port = 3000;

var corOptions = {
  // 주소 필요
  origin: 'http://localhost:8081',
};

app.use(cors(corOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (_, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
