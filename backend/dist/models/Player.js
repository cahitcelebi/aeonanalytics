import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Player extends Model {
}
Player.init({
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
    playerUid: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: 'players_gameId_playerUid_unique',
        field: 'playerUid',
    },
    firstSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'firstSeenAt',
    },
    lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'lastSeenAt',
    },
    totalSessions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'totalSessions',
    },
    totalPlaytimeSeconds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'totalPlaytimeSeconds',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'createdAt',
    },
}, {
    sequelize,
    modelName: 'Player',
    tableName: 'players',
    timestamps: false,
    underscored: false,
    indexes: [
        {
            unique: true,
            fields: ['gameId', 'playerUid'],
            name: 'players_gameId_playerUid_unique'
        }
    ]
});
export default Player;
