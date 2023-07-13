'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Language extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Language, {as: 'Parent', foreignKey: 'parentId', allowNull: true, onUpdate: 'NO ACTION', onDelete: 'NO ACTION'});
        }
    }
    Language.init({
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
        isTranslatable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        pluralsCount: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        plurals: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return Language;
};
