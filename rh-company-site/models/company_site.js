'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class CompanySite extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Module , {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
            this.belongsTo(models.Company, {foreignKey: 'companyId',     as: 'Company'});
            this.belongsTo(models.Site,    {foreignKey: 'groupId',       as: 'Site'});
        }
    }
    CompanySite.init({
        companyId: {
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
    return CompanySite;
};
