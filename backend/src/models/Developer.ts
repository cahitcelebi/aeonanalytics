import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

class Developer extends Model {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare companyName?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

Developer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'companyName',
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
  },
  {
    sequelize,
    modelName: 'Developer',
    tableName: 'developers',
    timestamps: true,
    underscored: false,
    hooks: {
      beforeCreate: async (developer: Developer) => {
        console.log('[HOOK] beforeCreate çalıştı:', developer.email);
        if (developer.password) {
          const salt = await bcrypt.genSalt(10);
          developer.password = await bcrypt.hash(developer.password, salt);
        }
      },
      beforeUpdate: async (developer: Developer) => {
        console.log('[HOOK] beforeUpdate çalıştı:', developer.email);
        if (developer.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          developer.password = await bcrypt.hash(developer.password, salt);
        }
      },
    },
  }
);

export default Developer; 