import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfCaseTransition extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.WfCase,   { as: 'case',     foreignKey: 'caseId' });
      this.belongsTo(models.WfStatus, { as: 'from',     foreignKey: 'fromId' });
      this.belongsTo(models.WfStatus, { as: 'to',       foreignKey: 'toId' });
      this.belongsTo(models.User,     { as: 'operator', foreignKey: 'userId' });
    }
  }
  WfCaseTransition.init({
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
    fromId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    toId: {
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
    tableName: 'CaseTransition',
    schema: conf.schema,
  });
  return WfCaseTransition;
};
