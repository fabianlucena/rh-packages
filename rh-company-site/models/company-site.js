import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class CompanySite extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,  { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.Company, { as: 'company',     foreignKey: 'companyId'     });
      this.belongsTo(models.Site,    { as: 'site',        foreignKey: 'siteId'        });
    }
  }
  CompanySite.init({
    companyId: {
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
  return CompanySite;
};
