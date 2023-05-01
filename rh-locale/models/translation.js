'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Translation extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Source,   {foreignKey: 'sourceId',   allowNull: false });
            this.belongsTo(models.Language, {foreignKey: 'languageId', allowNull: false });
            this.belongsTo(models.Domain,   {foreignKey: 'domainId',   allowNull: true });
        }
    }
    Translation.init({
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
        isDraft: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isJson: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        text: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ref: {
            type: DataTypes.STRING,
            allowNull: true
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return Translation;
};
