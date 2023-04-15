'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Role extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Module, {foreignKey: 'moduleId', allowNull: true});

            this.belongsToMany(models.Permission,  {through: models.RolePermission, foreignKey: 'roleId', otherKey: 'permissionId'});
        }
        static postAssociate(models) {
            this.belongsToMany(models.User,        {through: models.UserRoleSite,   foreignKey: 'roleId', otherKey: 'userId'});
            this.belongsToMany(models.Site,        {through: models.UserRoleSite,   foreignKey: 'roleId', otherKey: 'siteId'});
            models.User.belongsToMany(models.Role, {through: models.UserRoleSite,   foreignKey: 'userId', otherKey: 'roleId'});
        }
    }
    Role.init({
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
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Role;
};
