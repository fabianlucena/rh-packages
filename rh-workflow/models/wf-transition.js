import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfTransition extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,     { as: 'ownerModule', foreignKey: { name: 'ownerModuleId', allowNull: true }});
      this.belongsTo(models.WfStatus,   { as: 'from',        foreignKey: { name: 'fromId',        allowNull: false }});
      this.belongsTo(models.WfStatus,   { as: 'to',          foreignKey: { name: 'toId',          allowNull: false }});
      this.belongsTo(models.WfWorkflow, { as: 'workflow',    foreignKey: { name: 'workflowId',    allowNull: false }});
    }
  }
  WfTransition.init({
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
    tableName: 'Transition',
    schema: conf.schema,
  });
  return WfTransition;
};
