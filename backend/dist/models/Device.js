import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Device extends Model {
}
Device.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'devices_gameId_deviceId_unique',
        field: 'deviceId',
    },
    playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    platform: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    osVersion: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    deviceModel: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    screenResolution: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    language: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    country: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize,
    modelName: 'Device',
    tableName: 'devices',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['gameId', 'deviceId'],
            name: 'devices_gameId_deviceId_unique'
        }
    ]
});
export default Device;
