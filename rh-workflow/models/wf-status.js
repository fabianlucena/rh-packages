import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class WfStatus extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,         { foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true });
      this.belongsTo(models.WfWorkflowType, { foreignKey: 'workflowTypeId' });
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
    workflowTypeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
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
