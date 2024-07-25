import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfBranch extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.WfCase,   { as: 'case',     foreignKey: 'caseId' });
      this.belongsTo(models.WfStatus, { as: 'status',   foreignKey: 'statusId' });
      this.belongsTo(models.User,     { as: 'assignee', foreignKey: 'assigneeId' });
    }
  }
  WfBranch.init({
    caseId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    statusId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    assigneeId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Branch',
    schema: conf.schema,
  });
  return WfBranch;
};
