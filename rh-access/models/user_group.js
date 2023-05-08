'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class UserGroup extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Module, {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
            this.belongsTo(models.User,   {foreignKey: 'userId',  as: 'User'});
            this.belongsTo(models.User,   {foreignKey: 'groupId', as: 'Group'});
        }
    }
    UserGroup.init({
        userId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        groupId: {
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
    return UserGroup;
};
