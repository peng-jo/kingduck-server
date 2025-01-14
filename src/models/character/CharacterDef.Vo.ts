import { Model, DataTypes, Sequelize } from 'sequelize';

interface CharacterAttributes {
  id?: number;
  gameId: number;
  pageId?: string;
  isNew?: boolean;
  isReleased?: boolean;
  name: any; // You can create a more specific interface for JSONB field if needed
  element?: string;
  path?: string;
  rarity?: string;
  voiceActors?: any; // You can create a more specific interface for JSONB field if needed
  releaseDate?: Date;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class Character
  extends Model<CharacterAttributes>
  implements CharacterAttributes
{
  public id!: number;
  public gameId!: number;
  public pageId!: string;
  public isNew!: boolean;
  public isReleased!: boolean;
  public name!: any;
  public element!: string;
  public path!: string;
  public rarity!: string;
  public voiceActors!: any;
  public releaseDate!: Date;
  public deletedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
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
        },
        isNew: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        isReleased: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        name: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        element: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        path: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        rarity: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        voiceActors: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        releaseDate: {
          type: DataTypes.DATE,
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
        tableName: 'character',
        timestamps: true,
        paranoid: true,
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
      },
    );
  }

  static associate(db: any) {
    db.Character.belongsTo(db.Game, {
      foreignKey: 'gameId',
      targetKey: 'id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
}

export default Character;
