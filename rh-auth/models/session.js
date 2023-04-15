'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Session extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.User,   {foreignKey: 'userId'});
            this.belongsTo(models.Device, {foreignKey: 'deviceId'});
        }
    }
    Session.init({
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
        authToken: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        index: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        open: {
            type: DataTypes.DATE(6),
            allowNull: false,
        },
        close: {
            type: DataTypes.DATE(6),
            allowNull: true,
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Session;
};
