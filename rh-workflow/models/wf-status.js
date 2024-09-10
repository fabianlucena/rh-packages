import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfStatus extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,            { as: 'ownerModule', foreignKey: { name: 'ownerModuleId', allowNull: true }});
      this.belongsTo(models.WfWorkflow,        { as: 'workflow',    foreignKey: { name: 'workflowId',    allowNull: false }});
      this.hasOne(   models.WfStatusIsInitial, { as: 'isInitial',   foreignKey: 'statusId' });
      this.hasOne(   models.WfStatusIsFinal,   { as: 'isFinal',     foreignKey: 'statusId' });
    }
  }
  WfStatus.init({
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
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Status',
    schema: conf.schema,
  });
  return WfStatus;
};
