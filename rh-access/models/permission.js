import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Permission extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,   { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsToMany(models.Role, { as: 'roles',       through: 'RolePermission', foreignKey: 'permissionId', otherKey: 'roleId' });
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
    },
    isTranslatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
  return Permission;
};
