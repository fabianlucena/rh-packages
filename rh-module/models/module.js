'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Module extends sequelize.Sequelize.Model {
        static associate(models) {
            if (models.Site) models.Site.belongsToMany(models.Module, {through: models.SiteModule, foreignKey: 'siteId', otherKey: 'moduleId'});
        }
    }
    Module.init({
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        version: {
            type: DataTypes.STRING
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Module;
};
