'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class UserRoleSite extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.User,   {foreignKey: 'userId'});
            this.belongsTo(models.Role,   {foreignKey: 'roleId'});
            this.belongsTo(models.Site,   {foreignKey: 'siteId'});
            this.belongsTo(models.Module, {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});

            models.Site.belongsToMany(models.User, {through: models.UserRoleSite, foreignKey: 'siteId', otherKey: 'userId'});
            models.Site.belongsToMany(models.Role, {through: models.UserRoleSite, foreignKey: 'siteId', otherKey: 'roleId'});
            models.User.belongsToMany(models.Site, {through: models.UserRoleSite, foreignKey: 'userId', otherKey: 'siteId'});
        }
    }
    UserRoleSite.init({
        userId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        roleId: {
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
    return UserRoleSite;
};
