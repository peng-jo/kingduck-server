import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { config } from '../config/config';

// 테이블 연결
import Game from './game/GameDef.Vo';
import GameImage from './game/GameImage.Vo';
import Character from './character/CharacterDef.Vo';
import CharacterImage from './character/CharacterImage.Vo';
import CharacterDetails from './character/CharacterInfo.Vo';

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

// Initialize models
Game.initialize(sequelize);
GameImage.initialize(sequelize);
Character.initialize(sequelize);
CharacterDetails.initialize(sequelize);
CharacterImage.initialize(sequelize);
// Initialize CharacterImage model

// Associate models
Game.associate(Database);
GameImage.associate(Database);
Character.associate(Database);
CharacterDetails.associate(Database);
CharacterImage.associate(Database);
// Associate CharacterImage model

Database.Game = Game;
Database.GameImage = GameImage;
Database.Character = Character;
Database.CharacterDetails = CharacterDetails;
Database.CharacterImage = CharacterImage;

export default Database;
