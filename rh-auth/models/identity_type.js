'use strict';

import {conf} from '../conf.js';
import {addIfNotExistsByName} from 'sql-util';

export default (sequelize, DataTypes) => {
    class IdentityType extends sequelize.Sequelize.Model {
        static check() {
            return addIfNotExistsByName(
                IdentityType,
                {
                    name: 'local',
                    title: 'Local'
                }
            );
        }
    }

    IdentityType.init({
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
        schema: conf.schema
    });
    return IdentityType;
};
