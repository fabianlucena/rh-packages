'use strict';

const conf = require('../index');
const sqlUtil = require('sql-util');

module.exports = (sequelize, DataTypes) => {
    class UserType extends sequelize.Sequelize.Model {
        static check() {
            return sqlUtil.addIfNotExistsByName(
                UserType,
                {
                    name: 'user',
                    title: 'User'
                },
                {
                    name: 'group',
                    title: 'Group'
                });
        }
    }
    UserType.init({
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        title: {
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
    return UserType;
};
