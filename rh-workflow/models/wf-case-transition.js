import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class WfCaseTransition extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.WfCase,   {foreignKey: 'caseId'});
            this.belongsTo(models.WfStatus, {as: 'From', foreignKey: 'fromId'});
            this.belongsTo(models.WfStatus, {as: 'To',   foreignKey: 'toId'});
        }
    }
    WfCaseTransition.init({
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
        caseId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        fromId: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        toId: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'Case',
        schema: conf.schema,
    });
    return WfCaseTransition;
};
