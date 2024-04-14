import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class AssignableRolePerRole extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Role,   { as: 'AssignableRole', foreignKey: 'assignableRoleId' });
      this.belongsTo(models.Role,   { as: 'Role',           foreignKey: 'roleId' });
      this.belongsTo(models.Module, { as: 'OwnerModule',    foreignKey: 'ownerModuleId', allowNull: true });
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
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return AssignableRolePerRole;
};
