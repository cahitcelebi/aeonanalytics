const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Event model representing analytics events collected from games
 * @class Event
 */
class Event extends Model {}

Event.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    event_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    session_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    event_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    event_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            isIn: [['System', 'User', 'Progression', 'Business', 'Resource', 'Error', 'Design', 'Custom']]
        }
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    parameters: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
    },
    game_id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        },
        references: {
            model: 'games',
            key: 'game_id'
        }
    },
    timezone_offset_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'event',
    tableName: 'events',
    timestamps: false,
    indexes: [
        {
            name: 'events_game_id_idx',
            fields: ['game_id']
        },
        {
            name: 'events_user_id_idx',
            fields: ['user_id']
        },
        {
            name: 'events_timestamp_idx',
            fields: ['timestamp']
        },
        {
            name: 'events_event_type_idx',
            fields: ['event_type']
        }
    ]
});

module.exports = Event; 