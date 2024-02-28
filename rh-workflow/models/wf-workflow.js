import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class WfWorkflow extends sequelize.Sequelize.Model {
        static associate(models) {
            if (!models.ModelEntityName) {
                throw new Error('There is no ModelEntityName model. Try adding RH Model Entity Name module to the project.');
            }

            this.belongsTo(models.Module,          {foreignKey: 'ownerModuleId', as: 'OwnerModule', allowNull: true});
            this.belongsTo(models.WfWorkflowType,  {foreignKey: 'workflowTypeId'});
            this.belongsTo(models.ModelEntityName, {foreignKey: 'modelEntityNameId'});
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
        modelEntityNameId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        workflowTypeId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'Workflow',
        schema: conf.schema,
    });
    return WfWorkflow;
};
