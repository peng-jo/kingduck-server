import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';

export class Character extends Model<
  InferAttributes<Character>,
  InferCreationAttributes<Character>
> {
  id!: CreationOptional<number>;
  gameId!: number;
  pageId!: string;
  isNew!: boolean;
  isReleased!: boolean;
  name!: any;
  element!: string;
  path!: string;
  rarity!: string;
  voiceActors!: any;
  releaseDate!: Date;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

Character.init(
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
    pageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isReleased: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    element: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    voiceActors: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    releaseDate: {
      type: DataTypes.DATE,
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
    modelName: 'Character',
    tableName: 'character',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // create_at, updated_at 컬럼 생성
    paranoid: true, // deleted_at 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);
