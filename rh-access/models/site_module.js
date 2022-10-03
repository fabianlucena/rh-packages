'use strict';

const conf = require('../index');

module.exports = (sequelize, DataTypes) => {
    class SiteModule extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Module, {foreignKey: 'moduleId'});
            this.belongsTo(models.Site,   {foreignKey: 'siteId'});
        }
    }
    SiteModule.init({
        moduleId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        siteId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return SiteModule;
};
