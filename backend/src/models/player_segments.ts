import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class PlayerSegment extends Model {
  public id!: number;
  public gameId!: number;
  public segmentName!: string;
  public segmentCriteria!: object;
  public playerCount!: number;
  public readonly createdAt!: Date;
}

PlayerSegment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'gameId',
    },
    segmentName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'segmentName',
    },
    segmentCriteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'segmentCriteria',
    },
    playerCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'playerCount',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'createdAt',
    },
  },
  {
    sequelize,
    modelName: 'PlayerSegment',
    tableName: 'player_segments',
    timestamps: false,
    underscored: false,
  }
);

export default PlayerSegment; 