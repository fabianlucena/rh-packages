import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Issue extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models.Project) {
        throw new Error('There is no Project model. Try adding RH Project module to the project.');
      }
        
      this.belongsTo(models.Project,          { foreignKey: 'projectId'  });
      this.belongsTo(models.IssueType,        { as: 'Type',        foreignKey: 'typeId' });
      this.belongsTo(models.IssuePriority,    { as: 'Priority',    foreignKey: 'priorityId' });
      this.belongsTo(models.User,             { as: 'Assignee',    foreignKey: 'assigneesId' });
      this.belongsTo(models.IssueCloseReason, { as: 'CloseReason', foreignKey: 'closeReasonId' });
    }
  }
  Issue.init({
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
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    typeId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    priorityId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    assigneeId: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    closeReasonId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    schema: conf.schema,
  });
  return Issue;
};
