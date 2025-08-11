import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Session extends Model {
  declare id: number;
  declare sessionId: string;
  declare playerId: number;
  declare deviceId: number;
  declare gameId: number;
  declare startTime: Date;
  declare endTime?: Date;
  declare durationSeconds?: number;
  declare gameVersion?: string;
  declare timezoneOffsetMinutes?: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Session.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'sessionId',
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'playerId',
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'deviceId',
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'gameId',
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
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'durationSeconds',
    },
    gameVersion: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'gameVersion',
    },
    timezoneOffsetMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'timezoneOffsetMinutes',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'createdAt',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updatedAt',
    },
  },
  {
    sequelize,
    modelName: 'Session',
    tableName: 'sessions',
    timestamps: true,
    underscored: false,
  }
);

export default Session; 