import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class RolePermission extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Role,       { as: 'role',        foreignKey: 'roleId' });
      this.belongsTo(models.Permission, { as: 'permission',  foreignKey: 'permissionId' });
      this.belongsTo(models.Module,     { as: 'ownerModule', foreignKey: 'ownerModuleId' });
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
    ownerModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return RolePermission;
};
