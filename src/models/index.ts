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
    logging: false, //process.env.NODE_ENV === 'prod' ? false : console.log,
  },
);

export default sequelize;
