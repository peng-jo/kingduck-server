import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';

interface GameImageAttributes {
  id?: number;
  gameId: number;
  url: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class GameImage extends Model<
  InferAttributes<GameImage>,
  InferCreationAttributes<GameImage>
> {
  id!: CreationOptional<number>;
  gameId!: number;
  url!: string;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

GameImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('now'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn('now'),
    },
  },
  {
    sequelize,
    modelName: 'GameImage',
    tableName: 'game_image',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // create_at, updated_at 컬럼 생성
    paranoid: true, // deleted_at 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);

import { Game } from './GameDef.Vo';
GameImage.belongsTo(Game, {
  foreignKey: 'gameId',
  as: 'game',
  constraints: false,
});

export default GameImage;
