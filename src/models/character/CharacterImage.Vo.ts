import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '..';
import { Character } from './CharacterDef.Vo'; // 올바른 모델 임포트

interface CharacterImageAttributes {
  id?: number;
  characterId: number;
  backgroundColor: string;
  layout?: string;
  url: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CharacterImage extends Model<CharacterImageAttributes> {
  id!: number;
  characterId!: number;
  backgroundColor!: string;
  layout!: string;
  url!: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt!: Date;
}

CharacterImage.init(
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
    modelName: 'CharacterImage',
    tableName: 'character_image',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

// Character 모델과의 관계 설정

CharacterImage.belongsTo(Character, {
  foreignKey: 'characterId',
  as: 'character',
});

export default CharacterImage;
