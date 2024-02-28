import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class WfCase extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.WfWorkflow,  {foreignKey: 'workflowId'});
        }
    }
    WfCase.init({
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
        entityId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'Case',
        schema: conf.schema,
    });
    return WfCase;
};
