'use strict';

const conf = require('../index');
const httpUtil = require('http-util');
const sqlUtil = require('sql-util');

module.exports = (sequelize, DataTypes) => {
    class User extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.UserType, {foreignKey: 'typeId'});
        }

        static async check(asyncMethodList) {
            await httpUtil.execAsyncMethodListAsync(asyncMethodList, 'UserType');
            const userTypeId = await sqlUtil.getSingleRowProperty(sequelize.models.UserType, {name: 'user'}, 'id');
            await sqlUtil.addIfNotExists(
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
