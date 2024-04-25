import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class RoleParentSite extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module, { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.Role,   { as: 'role',        foreignKey: 'roleId' });
      this.belongsTo(models.Role,   { as: 'parent',      foreignKey: 'parentId' });
      this.belongsTo(models.Site,   { as: 'site',        foreignKey: 'siteId' });
    }
  }
  RoleParentSite.init({
    roleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    siteId: {
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
  return RoleParentSite;
};
