import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { config } from '../config/config';

const basename = path.basename(__filename);

/*
 * NODE.JS - Sequelize ORM 연결 처리
 *
 * 기본 설정 - config 참조
 * TIME - UTC +9 (서울/도쿄)
 *
 */

const sequelize = new Sequelize(
  config.db_server.database,
  config.db_server.user,
  config.db_server.password,
  {
    host: config.db_server.host,
    dialect: config.db_server.dialect,
    define: {
      timestamps: true,
    },
    dialectOptions: {
      useUTC: false, // for reading from database
      timezone: '+09:00',
      dateStrings: true,
      typeCast(field: { type: string; string: () => any }, next: () => any) {
        // for reading from database
        if (field.type === 'DATETIME') {
          return field.string();
        }
        return next();
      },
    },
    timezone: '+09:00',
    pool: config.db_server.pool,
    logging: process.env.NODE_ENV === 'prod' ? false : console.log,
  },
);

//checking if connection is done
sequelize
  .authenticate()
  .then(() => {
    console.log(`Database connected to discover`);
  })
  .catch((err) => {
    console.log(err);
  });

const Database: any = {};
Database.Sequelize = Sequelize;
Database.sequelize = sequelize;

/*
 * DB 모델 처리 구간
 *
 * 테이블에 대한 정보 표기시 해당 표기 원직을 지켜주세요.
 *
 * 만약 테이블이 추가가 되는 상황이 있는 경우 SQL 폴더에 테이블 생성 구문을 업데이트 할것
 *
 ** 정보 처리
 **
 *
 */

export default Database;
