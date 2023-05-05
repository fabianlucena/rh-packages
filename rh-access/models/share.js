'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Share extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.ObjectName, {foreignKey: 'ObjectNameId',  allowNull: false, onDelete: 'cascade'});
            this.belongsTo(models.User,       {foreignKey: 'userId',        allowNull: false, onDelete: 'cascade'});
            this.belongsTo(models.ShareType,  {foreignKey: 'typeId',        allowNull: false});
            this.belongsTo(models.Module,     {foreignKey: 'ownerModuleId', allowNull: true});
        }
    }
    Share.init({
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
        objectNameId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        objectId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        typeId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        ownerModuleId: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return Share;
};
