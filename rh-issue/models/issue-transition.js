import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class IssueTransition extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.IssueWorkflow, {foreignKey: 'workflowId'});
            this.belongsTo(models.IssueStatus,   {as: 'From', foreignKey: 'fromId'});
            this.belongsTo(models.IssueStatus,   {as: 'To',   foreignKey: 'toId'});
        }
    }
    IssueTransition.init({
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
        workflowId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        fromId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        toId: {
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
        freezeTableName: true,
        schema: conf.schema,
    });
    return IssueTransition;
};
