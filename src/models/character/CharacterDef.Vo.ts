import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '..';

interface CharacterAttributes {
  id?: number;
  gameId: number;
  pageId?: string;
  isNew?: boolean;
  isReleased?: boolean;
  name: any;
  rarity?: string;
  type?: any;
  voiceActors?: any;
  releaseDate?: Date;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Character extends Model<CharacterAttributes> {
  id!: number;
  gameId!: number;
  pageId!: string;
  isNew!: boolean;
  isReleased!: boolean;
  name!: any;
  rarity!: string;
  type!: any;
  voiceActors!: any;
  releaseDate!: Date;
  deletedAt?: Date;
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
    },
    pageId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isReleased: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    rarity: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    type: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    voiceActors: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    releaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
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
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

// CharacterImage 모델과의 관계 설정
import { CharacterImage } from './CharacterImage.Vo';
import { CharacterInfo } from './CharacterInfo.Vo';

Character.hasMany(CharacterImage, {
  foreignKey: 'characterId',
  as: 'images',
});
Character.hasOne(CharacterInfo, {
  foreignKey: 'characterId',
  as: 'info',
});

export default Character;
