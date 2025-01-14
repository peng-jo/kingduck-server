import { Model, DataTypes, Sequelize } from 'sequelize';

interface GameAttributes {
  id?: number;
  title: any; // You can create a more specific interface for JSONB field if needed
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class Game extends Model<GameAttributes> implements GameAttributes {
  public id!: number;
  public title!: any;
  public deletedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
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
        tableName: 'game',
        timestamps: true,
        paranoid: true,
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
      },
    );
  }
  static associate(Database: any) {
    Database.Game.hasMany(Database.GameImage, {
      foreignKey: 'gameId',
      sourceKey: 'id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
    Database.Game.hasMany(Database.GameSetting, {
      foreignKey: 'gameId',
      sourceKey: 'id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
}

export default Game;
