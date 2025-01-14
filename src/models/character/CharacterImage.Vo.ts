import { Model, DataTypes, Sequelize } from 'sequelize';

interface CharacterImageAttributes {
  id?: number;
  characterId: number;
  backgroundColor?: string;
  layout?: string;
  url: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class CharacterImage
  extends Model<CharacterImageAttributes>
  implements CharacterImageAttributes
{
  public id!: number;
  public characterId!: number;
  public backgroundColor!: string;
  public layout!: string;
  public url!: string;
  public deletedAt!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
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
        tableName: 'character_image',
        timestamps: true,
        paranoid: true,
        updatedAt: 'updatedAt',
        createdAt: 'createdAt',
        deletedAt: 'deletedAt',
      },
    );
  }

  static associate(db: any) {
    db.CharacterImage.belongsTo(db.Character, {
      foreignKey: 'characterId',
      targetKey: 'id',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
}

export default CharacterImage;
