'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class User extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.UserType, {foreignKey: 'typeId'});
            if (models.Module)
                this.belongsTo(models.Module, {foreignKey: 'ownerModuleId', allowNull: true});
        }
    }
    User.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        displayName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return User;
};
