import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Event extends Model {
}
Event.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sessionId',
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
    eventName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'eventName',
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'eventType',
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    parameters: {
        type: DataTypes.JSONB,
        allowNull: true,
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
}, {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
    underscored: false,
});
export default Event;
