import { Model, DataTypes, Sequelize } from 'sequelize';

interface CharacterDetailsAttributes {
  id?: number;
  characterId: number;
  lang?: string;
  stats?: any; // You can create a more specific interface for JSONB field if needed
  itemData?: any; // You can create a more specific interface for JSONB field if needed
  ranks?: any; // You can create a more specific interface for JSONB field if needed
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class CharacterDetails
  extends Model<CharacterDetailsAttributes>
  implements CharacterDetailsAttributes
{
  public id!: number;
  public characterId!: number;
  public lang!: string;
  public stats!: any;
  public itemData!: any;
  public ranks!: any;
  public deletedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    CharacterDetails.init(
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
        tableName: 'character_details',
        timestamps: true,
        paranoid: true,
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
      },
    );
  }

  static associate(db: any) {
    db.CharacterDetails.belongsTo(db.Character, {
      foreignKey: 'characterId',
      targetKey: 'id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
}

export default CharacterDetails;
