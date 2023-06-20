'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class TranslationCache extends sequelize.Sequelize.Model {
    }
    TranslationCache.init({
        language: {
            type: DataTypes.STRING,
            allowNull: false
        },
        domain: {
            type: DataTypes.STRING,
            allowNull: true
        },
        context: {
            type: DataTypes.STRING,
            allowNull: true
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isJson: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        translation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ref: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isTranslated: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        isDraft: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return TranslationCache;
};
