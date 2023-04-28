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
        source: {
            type: DataTypes.STRING,
            allowNull: false
        },
        translation: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return TranslationCache;
};
