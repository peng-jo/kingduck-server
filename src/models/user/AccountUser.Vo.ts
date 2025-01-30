import { Model, DataTypes, Sequelize } from 'sequelize';
import sequelize from '..';

interface UserAttributes {
  id?: number;
  email: string;
  password: string;
  name: string;
  uuid: string;
  teamId: number;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> {
  id!: number;
  email!: string;
  password!: string;
  name!: string;
  uuid!: string;
  teamId!: number;
  deletedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    modelName: 'User',
    tableName: 'user',
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);

export default User;
