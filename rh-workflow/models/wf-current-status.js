import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class WfCurrentStatus extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.WfCase,   {as: 'Case',     foreignKey: 'caseId'});
            this.belongsTo(models.WfStatus, {as: 'Status',   foreignKey: 'statusId'});
            this.belongsTo(models.User,     {as: 'Assignee', foreignKey: 'assigneeId'});
        }
    }
    WfCurrentStatus.init({
        caseId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            unique: true,
            allowNull: false,
        },
        statusId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        assigneeId: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'CurrentStatus',
        schema: conf.schema,
    });
    return WfCurrentStatus;
};
