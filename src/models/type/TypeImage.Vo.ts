import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';

interface TypeImageAttributes {
  id?: number;
  pathTypeId: number;
  backgroundColor: string;
  layout?: string;
  url: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TypeImage extends Model<
  InferAttributes<TypeImage>,
  InferCreationAttributes<TypeImage>
> {
  id!: CreationOptional<number>;
  pathTypeId!: number;
  backgroundColor!: string;
  layout!: string;
  url!: string;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

TypeImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    pathTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    backgroundColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#ffffff',
    },
    layout: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: 'TypeImage',
    tableName: 'path_type_image',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // createdAt, updatedAt 컬럼 생성
    paranoid: true, // deletedAt 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);
