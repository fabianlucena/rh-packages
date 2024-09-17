import { conf } from '../conf.js';
import { defaultLoc } from 'rf-locale';

export default (sequelize, DataTypes) => {
  class WfWorkflowOfEntity extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models.ModelEntityName) {
        throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
      }

      this.belongsTo(models.Module,          { as: 'ownerModule',     foreignKey: { name: 'ownerModuleId',     allowNull: true }});
      this.belongsTo(models.WfWorkflow,      { as: 'workflow',        foreignKey: { name: 'workflowId',        allowNull: false }});
      this.belongsTo(models.ModelEntityName, { as: 'modelEntityName', foreignKey: { name: 'modelEntityNameId', allowNull: false }});
    }
  }
  WfWorkflowOfEntity.init({
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
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modelUuidProperty: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'uuid',
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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'workflow',
    },
    workflowTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: defaultLoc._cf('workflow', 'Workflow'),
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
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'currentStatuses',
    },
    currentStatusTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: defaultLoc._cf('workflow', 'Statuses'),
    },
    showAssigneeInColumn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    showAssigneeInDetail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    assigneeName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'assignees',
    },
    assigneeTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: defaultLoc._cf('workflow', 'Assignees'),
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'WorkflowOfEntity',
    schema: conf.schema,
  });
  return WfWorkflowOfEntity;
};
