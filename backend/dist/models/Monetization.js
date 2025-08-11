import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Monetization extends Model {
    id;
    transactionId;
    playerId;
    gameId;
    productId;
    productType;
    amount;
    currency;
    platform;
    timestamp;
    createdAt;
}
Monetization.init({
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
}, {
    sequelize,
    modelName: 'Monetization',
    tableName: 'monetization',
    timestamps: false,
});
export default Monetization;
