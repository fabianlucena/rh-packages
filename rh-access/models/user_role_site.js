'use strict';

const conf = require('../index');

module.exports = (sequelize, DataTypes) => {
  class UserRoleSite extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.User, {foreignKey: 'userId'});
      this.belongsTo(models.Role, {foreignKey: 'roleId'});
      this.belongsTo(models.Site, {foreignKey: 'siteId'});
    }
  }
  UserRoleSite.init({
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    siteId: {
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
  return UserRoleSite;
};
