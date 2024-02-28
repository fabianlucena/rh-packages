import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class WfStatusIsInitial extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.WfStatus, {foreignKey: 'statusId'});
        }
    }
    WfStatusIsInitial.init({
        statusId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'StatusIsInitial',
        schema: conf.schema,
    });
    return WfStatusIsInitial;
};
