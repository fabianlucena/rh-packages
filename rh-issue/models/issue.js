import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class Issue extends sequelize.Sequelize.Model {
    static associate(models) {
      if (!models.Project) {
        throw new Error('There is no Project model. Try adding RH Project module to the project.');
      }
        
      this.belongsTo(models.Project,          { as: 'project',     foreignKey: 'projectId' });
      this.belongsTo(models.IssueType,        { as: 'type',        foreignKey: 'typeId' });
      this.belongsTo(models.IssuePriority,    { as: 'priority',    foreignKey: 'priorityId' });
      this.belongsTo(models.IssueCloseReason, { as: 'closeReason', foreignKey: 'closeReasonId' });
    }

    static postAssociate(models) {      
      this.hasMany(models.IssueRelated, { as: 'relatedTo',   foreignKey: 'fromId' });
      this.hasMany(models.IssueRelated, { as: 'relatedFrom', foreignKey: 'toId'   });
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
      allowNull: true,
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
    closeReasonId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Issue',
    schema: conf.schema,
  });
  return Issue;
};
