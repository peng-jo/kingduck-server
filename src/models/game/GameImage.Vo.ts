import { Model, DataTypes, Sequelize } from 'sequelize';

interface GameImageAttributes {
  id?: number;
  gameId: number;
  url: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class GameImage
  extends Model<GameImageAttributes>
  implements GameImageAttributes
{
  public id!: number;
  public gameId!: number;
  public url!: string;
  public deletedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    GameImage.init(
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
        tableName: 'game_image',
        timestamps: true,
        paranoid: true,
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
      },
    );
  }

  static associate(db: any) {
    db.GameImage.belongsTo(db.Game, {
      foreignKey: 'gameId',
      targetKey: 'id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
}

export default GameImage;
