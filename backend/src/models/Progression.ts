import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export interface ProgressionAttributes {
  id?: number;
  playerId: number;
  gameId: number;
  levelNumber: number;
  levelName?: string;
  startTime: Date;
  endTime?: Date;
  completionStatus?: string;
  score?: number;
  stars?: number;
  attempts?: number;
  createdAt?: Date;
}

class Progression extends Model<ProgressionAttributes> implements ProgressionAttributes {
  public id!: number;
  public playerId!: number;
  public gameId!: number;
  public levelNumber!: number;
  public levelName!: string;
  public startTime!: Date;
  public endTime!: Date;
  public completionStatus!: string;
  public score!: number;
  public stars!: number;
  public attempts!: number;
  public createdAt!: Date;
}

Progression.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'playerId',
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'gameId',
    },
    levelNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'levelNumber',
    },
    levelName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'levelName',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'startTime',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'endTime',
    },
    completionStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'completionStatus',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'score',
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'stars',
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      field: 'attempts',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'createdAt',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Progression',
    tableName: 'progression',
    timestamps: false,
  }
);

export default Progression; 