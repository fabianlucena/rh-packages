'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class RoleParentSite extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Module, {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
            this.belongsTo(models.Role,   {foreignKey: 'roleId',   as: 'Role'});
            this.belongsTo(models.Role,   {foreignKey: 'parentId', as: 'Parent'});
            this.belongsTo(models.Site,   {foreignKey: 'siteId'});
        }
    }
    RoleParentSite.init({
        roleId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        parentId: {
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
    return RoleParentSite;
};
