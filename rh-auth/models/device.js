'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Device extends sequelize.Sequelize.Model {
    }
    Device.init({
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
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        data: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return Device;
};
