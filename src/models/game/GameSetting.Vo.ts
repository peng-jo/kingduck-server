import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';

export class GameSetting extends Model<
  InferAttributes<GameSetting>,
  InferCreationAttributes<GameSetting>
> {
  id!: CreationOptional<number>;
  gameId!: number;
  devCorp!: string;
  relatedUrl!: any;
  storeUrl!: any;
  setting!: any;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

GameSetting.init(
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
    devCorp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relatedUrl: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    storeUrl: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    setting: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    modelName: 'GameSetting',
    tableName: 'game_setting',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // create_at, updated_at 컬럼 생성
    paranoid: true, // deleted_at 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);
