'use strict';

const conf = require('../index');

module.exports = (sequelize, DataTypes) => {
  class Permission extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,         {foreignKey: 'moduleId'});
      this.belongsTo(models.PermissionType, {foreignKey: 'typeId'});
      
      this.belongsToMany(models.Role, {through: models.RolePermission, foreignKey: 'permissionId', otherKey: 'roleId'});
    }
  }
  Permission.init({
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
    }
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return Permission;
};
