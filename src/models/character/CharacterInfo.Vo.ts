import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from 'sequelize';
import sequelize from '..';
import { Character } from './CharacterDef.Vo'; // 올바른 모델 임포트

interface CharacterInfoAttributes {
  id?: number;
  characterId: number;
  lang: string;
  stats?: any;
  itemData?: any;
  ranks?: any;
  propertyBase?: any;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CharacterInfo extends Model<
  InferAttributes<CharacterInfo>,
  InferCreationAttributes<CharacterInfo>
> {
  id!: CreationOptional<number>;
  characterId!: number;
  lang!: string;
  stats!: any;
  itemData!: any;
  ranks!: any;
  propertyBase!: any;
  deletedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

CharacterInfo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    characterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    lang: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'kr',
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    itemData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    propertyBase: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ranks: {
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
    modelName: 'CharacterInfo',
    tableName: 'character_details',
    freezeTableName: true, // 테이블명 변경 불가
    timestamps: true, // createdAt, updatedAt 컬럼 생성
    paranoid: true, // deletedAt 컬럼 생성, soft delete 시 나중에 복구 가능
  },
);

// Character 모델과의 관계 설정

CharacterInfo.belongsTo(Character, {
  foreignKey: 'characterId',
  as: 'character',
});
