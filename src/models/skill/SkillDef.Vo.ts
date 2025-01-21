import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '..';
import SkillImage from './SkillImage.Vo'; // SkillImage 모델 임포트

interface SkillAttributes {
  id?: number;
  gameId: number;
  characterId: number;
  name: any;
  tag?: string;
  info?: string;
  type?: string;
  levelReq?: number;
  promotionReq?: number;
  levelData?: any;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Skill extends Model<SkillAttributes> {
  id!: number;
  gameId!: number;
  characterId!: number;
  name!: any;
  tag!: string;
  info!: string;
  type!: string;
  levelReq!: number;
  promotionReq!: number;
  levelData!: any;
  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

Skill.init(
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
    characterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    info: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    levelReq: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    promotionReq: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    levelData: {
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
    modelName: 'Skill',
    tableName: 'skill',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

// SkillImage 모델과의 관계 설정
Skill.hasMany(SkillImage, {
  foreignKey: 'skillId',
  as: 'image',
});
export default Skill;
