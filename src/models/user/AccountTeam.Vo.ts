import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '..';

interface TeamAttributes {
  id?: number;
  isAuthority: number;
  name: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Team extends Model<TeamAttributes> {
  id!: number;
  isAuthority!: number;
  name!: string;
  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

Team.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    isAuthority: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
    modelName: 'Team',
    tableName: 'team',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

export default Team;
