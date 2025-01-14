import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';

interface ItemAttributes {
  id?: number;
  characterId?: number;
  gameId: number;
  itemtype?: string;
  element?: string;
  name?: any;
  desc?: any;
  path?: string;
  rarity?: string;
  levelData?: any;
  itemReferences?: any;
  skillId?: number;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Item extends Model<
  InferAttributes<Item>,
  InferCreationAttributes<Item>
> {
  id!: CreationOptional<number>;
  characterId!: number;
  gameId!: number;
  itemtype!: string;
  element!: string;
  name!: any;
  desc!: any;
  path!: string;
  rarity!: string;
  levelData!: any;
  itemReferences!: any;
  skillId!: number;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

Item.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    characterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    itemtype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    element: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    desc: {
      type: DataTypes.JSONB,
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
    levelData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    itemReferences: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    skillId: {
      type: DataTypes.INTEGER,
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
    modelName: 'Item',
    tableName: 'item',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // createdAt, updatedAt 컬럼 생성
    paranoid: true, // deletedAt 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);
