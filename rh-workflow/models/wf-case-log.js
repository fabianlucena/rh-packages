import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfCaseLog extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.WfCase,   { as: 'case',     foreignKey: 'caseId' });
      this.belongsTo(models.WfStatus, { as: 'status',   foreignKey: 'statusId' });
      this.belongsTo(models.User,     { as: 'assignee', foreignKey: 'assigneeId' });
      this.belongsTo(models.User,     { as: 'operator', foreignKey: 'operatorId' });
    }
  }
  WfCaseLog.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    caseId: {
      type: DataTypes.BIGINT,
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
    operatorId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'CaseLog',
    schema: conf.schema,
  });
  return WfCaseLog;
};
