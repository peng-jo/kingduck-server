import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '..';

interface SkillImageAttributes {
  id?: number;
  skillId: number;
  backgroundColor: string;
  layout?: string;
  url: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SkillImage extends Model<SkillImageAttributes> {
  id!: number;
  skillId!: number;
  backgroundColor!: string;
  layout!: string;
  url!: string;
  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

SkillImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    skillId: {
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
    modelName: 'SkillImage',
    tableName: 'skill_image',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

// Skill 모델과의 관계 설정
/*
import Skill from './SkillDef.Vo'; // Skill 모델 임포트
SkillImage.belongsTo(Skill, {
  foreignKey: 'skillId',
  as: 'skill',
});
*/

export default SkillImage;
