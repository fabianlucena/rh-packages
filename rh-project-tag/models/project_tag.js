'use strict';

import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class ProjectTag extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.Project, {foreignKey: 'projectId'});
            this.belongsTo(models.Tag,     {foreignKey: 'tagId'});
        }
    }
    ProjectTag.init({
        projectId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
        tagId: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return ProjectTag;
};
