import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfStatusIsFinal extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.WfStatus, { foreignKey: 'statusId' });
    }
  }
  WfStatusIsFinal.init({
    statusId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'StatusIsFinal',
    schema: conf.schema,
  });
  return WfStatusIsFinal;
};
