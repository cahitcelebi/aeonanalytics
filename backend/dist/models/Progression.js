import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class Progression extends Model {
    id;
    playerId;
    gameId;
    levelNumber;
    levelName;
    startTime;
    endTime;
    completionStatus;
    score;
    stars;
    attempts;
    createdAt;
}
Progression.init({
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
}, {
    sequelize,
    modelName: 'Progression',
    tableName: 'progression',
    timestamps: false,
});
export default Progression;
