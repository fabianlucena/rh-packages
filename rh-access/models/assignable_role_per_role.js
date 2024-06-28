import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class AssignableRolePerRole extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Role,   { as: 'assignableRole', foreignKey: 'assignableRoleId' });
      this.belongsTo(models.Role,   { as: 'role',           foreignKey: 'roleId' });
      this.belongsTo(models.Module, { as: 'ownerModule',    foreignKey: 'ownerModuleId' });
    }
  }
  AssignableRolePerRole.init({
    assignableRoleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    roleId: {
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
  return AssignableRolePerRole;
};
