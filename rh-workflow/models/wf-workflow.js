import { conf } from '../conf.js';
import { loc } from 'rf-locale';

export default (sequelize, DataTypes) => {
  class WfWorkflow extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models.ModelEntityName) {
        throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
      }

      this.belongsTo(models.Module,          { as: 'ownerModule',     foreignKey: 'ownerModuleId' });
      this.belongsTo(models.WfWorkflowType,  { as: 'workflowType',    foreignKey: 'workflowTypeId' });
      this.belongsTo(models.ModelEntityName, { as: 'modelEntityName', foreignKey: 'modelEntityNameId' });
    }
  }
  WfWorkflow.init({
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
      defaultValue: false,
    },
    translationContext: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    modelEntityNameId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    workflowTypeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    showCurrentStatusInColumn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showCurrentStatusInDetail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    currentStatusName: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'currentStatus',
    },
    currentStatusTitle: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'Status',
    },
    showAssigneeInColumn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    showAssigneeInDetail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    assigneeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'assignee',
    },
    assigneeTitle: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: loc._f('Assignee'),
    },
    showWorkflowInColumn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    showWorkflowInDetail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    workflowName: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'workflow',
    },
    workflowTitle: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: loc._f('Workflow'),
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Workflow',
    schema: conf.schema,
  });
  return WfWorkflow;
};
