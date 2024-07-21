import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Role extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module, { as: 'ownerModule', foreignKey: 'ownerModuleId' });

      this.       belongsToMany(models.Permission,  { as: 'permissions', through: models.RolePermission, foreignKey: 'roleId', otherKey: 'permissionId' });
      this.       belongsToMany(models.User,        { as: 'users',       through: models.UserSiteRole,   foreignKey: 'roleId', otherKey: 'userId', unique: false });
      this.       belongsToMany(models.Site,        { as: 'sites',       through: models.UserSiteRole,   foreignKey: 'roleId', otherKey: 'siteId', unique: false });
      models.User.belongsToMany(models.Role,        { as: 'roles',       through: models.UserSiteRole,   foreignKey: 'userId', otherKey: 'roleId', unique: false });
    }
  }
  Role.init({
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
    },
    isTranslatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    translationContext: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
  return Role;
};
