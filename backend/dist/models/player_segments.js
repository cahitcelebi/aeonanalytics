import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
class PlayerSegment extends Model {
    id;
    gameId;
    segmentName;
    segmentCriteria;
    playerCount;
    createdAt;
}
PlayerSegment.init({
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
    segmentName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'segmentName',
    },
    segmentCriteria: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'segmentCriteria',
    },
    playerCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'playerCount',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'createdAt',
    },
}, {
    sequelize,
    modelName: 'PlayerSegment',
    tableName: 'player_segments',
    timestamps: false,
    underscored: false,
});
export default PlayerSegment;
