import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export interface MonetizationAttributes {
  id?: number;
  transactionId: string;
  playerId: number;
  gameId: number;
  productId: string;
  productType?: string;
  amount: number;
  currency: string;
  platform?: string;
  timestamp: Date;
  createdAt?: Date;
}

class Monetization extends Model<MonetizationAttributes> implements MonetizationAttributes {
  public id!: number;
  public transactionId!: string;
  public playerId!: number;
  public gameId!: number;
  public productId!: string;
  public productType!: string;
  public amount!: number;
  public currency!: string;
  public platform!: string;
  public timestamp!: Date;
  public createdAt!: Date;
}

Monetization.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'transactionId',
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
    productId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'productId',
    },
    productType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'productType',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'amount',
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'currency',
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'platform',
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'timestamp',
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
    modelName: 'Monetization',
    tableName: 'monetization',
    timestamps: false,
  }
);

export default Monetization; 