'use strict';

import {conf} from '../conf.js';
import {execAsyncMethodListAsync} from 'http-util';
import {getSingleRowProperty, addIfNotExists} from 'sql-util';

export default (sequelize, DataTypes) => {
    class User extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.UserType, {foreignKey: 'typeId'});
        }

        static async check(asyncMethodList) {
            await execAsyncMethodListAsync(asyncMethodList, 'UserType');
            const userTypeId = await getSingleRowProperty(sequelize.models.UserType, {name: 'user'}, 'id');
            await addIfNotExists(
                User,
                'username',
                {
                    typeId:       userTypeId,
                    isEnabled:    1,
                    username:     'admin',
                    displayName:  'Admin'
                });
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
