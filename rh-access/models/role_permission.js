'use strict';

const conf = require('../index');

module.exports = (sequelize, DataTypes) => {
  class RolePermission extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Role,       {foreignKey: 'roleId'});
      this.belongsTo(models.Permission, {foreignKey: 'permissionId'});
    }
  }
  RolePermission.init({
    roleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    permissionId: {
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
  return RolePermission;
};
