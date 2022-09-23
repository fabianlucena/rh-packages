'use strict';

const conf = require('../index');

module.exports = (sequelize, DataTypes) => {
  class SessionSite extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Session, {foreignKey: 'sessionId'});
      this.belongsTo(models.Site,    {foreignKey: 'siteId'});

      models.Session.belongsToMany(models.Site, {through: models.SessionSite, foreignKey: 'sessionId', otherKey: 'siteId'});
    }
  }
  SessionSite.init({
    sessionId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    siteId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return SessionSite;
};
