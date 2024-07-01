import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class IssueRelated extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Issue,             {as: 'from',         foreignKey: 'fromId'});
            this.belongsTo(models.Issue,             {as: 'to',           foreignKey: 'toId'});
            this.belongsTo(models.IssueRelationship, {as: 'relationship', foreignKey: 'relationshipId'});
        }
    }
    IssueRelated.init({
        fromId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        toId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        relationshipId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'Related',
        schema: conf.schema,
    });
    return IssueRelated;
};
