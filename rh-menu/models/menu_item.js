'use strict';

const conf = require('../index');

module.exports = (sequelize, DataTypes) => {
    class MenuItem extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.MenuItem,   {foreignKey: 'parentId', allowNull: true, onUpdate: 'NO ACTION', onDelete: 'NO ACTION'});
            this.belongsTo(models.Permission, {foreignKey: 'permissionId'});
        }
    }
    MenuItem.init({
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
            unique: true
        },
        service: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema
    });
    return MenuItem;
};
