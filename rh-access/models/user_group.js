import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class UserGroup extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module, { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.User,   { as: 'user',        foreignKey: 'userId' });
      this.belongsTo(models.User,   { as: 'group',       foreignKey: 'groupId' });
    }
  }
  UserGroup.init({
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    groupId: {
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
  return UserGroup;
};
