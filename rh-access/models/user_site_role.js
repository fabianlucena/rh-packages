'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class UserSiteRole extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.User,   {foreignKey: 'userId'});
            this.belongsTo(models.Site,   {foreignKey: 'siteId'});
            this.belongsTo(models.Role,   {foreignKey: 'roleId'});
            this.belongsTo(models.Module, {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});

            models.Site.belongsToMany(models.User, {through: models.UserSiteRole, foreignKey: 'siteId', otherKey: 'userId', uniqueKey: false});
            models.User.belongsToMany(models.Site, {through: models.UserSiteRole, foreignKey: 'userId', otherKey: 'siteId', uniqueKey: false});
            models.Site.belongsToMany(models.Role, {through: models.UserSiteRole, foreignKey: 'siteId', otherKey: 'roleId', uniqueKey: false});
        }
    }
    UserSiteRole.init({
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        siteId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        roleId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return UserSiteRole;
};
