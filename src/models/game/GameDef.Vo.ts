import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';

export class Game extends Model<
  InferAttributes<Game>,
  InferCreationAttributes<Game>
> {
  id!: CreationOptional<number>;
  title!: any; // You can create a more specific interface for JSONB field if needed
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    title: {
      type: DataTypes.JSONB,
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
    modelName: 'Game',
    tableName: 'game',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // create_at, updated_at 컬럼 생성
    paranoid: true, // deleted_at 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);
