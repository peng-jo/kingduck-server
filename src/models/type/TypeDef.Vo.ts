import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
  HasMany,
  ForeignKey,
} from 'sequelize';
import sequelize from '..';

interface TypeDefAttributes {
  id?: number;
  gameId: number;
  group: string;
  name: any;
  info?: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TypeDef extends Model<
  InferAttributes<TypeDef>,
  InferCreationAttributes<TypeDef>
> {
  id!: CreationOptional<number>;
  gameId!: number;
  group!: string;
  name!: any;
  info!: string;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

TypeDef.init(
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
      defaultValue: 0,
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    info: {
      type: DataTypes.STRING,
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
    modelName: 'TypeDef',
    tableName: 'path_type',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // createdAt, updatedAt 컬럼 생성
    paranoid: true, // deletedAt 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);

import { TypeImage } from './TypeImage.Vo';
TypeDef.hasOne(TypeImage, {
  foreignKey: 'pathTypeId',
  as: 'image',
});
