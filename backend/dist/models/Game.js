import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Developer from './Developer.js';
class Game extends Model {
}
Game.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'apiKey',
    },
    platform: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    gameVersion: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'gameVersion',
    },
    developerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'developerId',
        references: {
            model: Developer,
            key: 'id',
        },
        onDelete: 'CASCADE',
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
    modelName: 'Game',
    tableName: 'games',
    timestamps: true,
    underscored: false,
});
Game.belongsTo(Developer, { foreignKey: 'developerId', as: 'developer' });
Developer.hasMany(Game, { foreignKey: 'developerId', as: 'games' });
export default Game;
