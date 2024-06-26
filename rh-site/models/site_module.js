import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class SiteModule extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module, { as: 'module', foreignKey: 'moduleId' });
      this.belongsTo(models.Site,   { as: 'site',   foreignKey: 'siteId' });
    }
  }
  SiteModule.init({
    moduleId: {
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
  return SiteModule;
};
