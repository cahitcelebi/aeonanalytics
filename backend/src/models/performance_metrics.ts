import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class PerformanceMetric extends Model {
  public id!: number;
  public gameId!: number;
  public deviceModel!: string;
  public osVersion!: string;
  public avgFps!: number;
  public avgLoadTime!: number;
  public crashCount!: number;
  public date!: Date;
  public readonly createdAt!: Date;
}

PerformanceMetric.init(
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
    deviceModel: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'deviceModel',
    },
    osVersion: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'osVersion',
    },
    avgFps: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'avgFps',
    },
    avgLoadTime: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'avgLoadTime',
    },
    crashCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'crashCount',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
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
    modelName: 'PerformanceMetric',
    tableName: 'performance_metrics',
    timestamps: false,
    underscored: false,
  }
);

export default PerformanceMetric; 