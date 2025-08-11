const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Metric model for storing game analytics metrics
 * @class Metric
 */
class Metric extends Model {}

Metric.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    "metricName": {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    "gameId": {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        },
        references: {
            model: 'games',
            key: 'gameId'
        }
    },
    value: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    sequelize,
    modelName: 'metric',
    tableName: 'metrics',
    timestamps: true,
    indexes: [
        { 
            name: 'metricGameDateIdx',
            fields: ['metricName', 'gameId', 'date']
        },
        {
            name: 'metricDateIdx',
            fields: ['date']
        },
        {
            name: 'metricGameIdx',
            fields: ['gameId']
        }
    ]
});

module.exports = Metric; 