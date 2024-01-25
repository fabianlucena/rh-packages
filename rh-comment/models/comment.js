import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Comment extends sequelize.Sequelize.Model {
        static associate(models) {
            this.belongsTo(models.CommentEntityType, {foreignKey: 'entityTypeId'});
            this.belongsTo(models.CommentType,       {foreignKey: 'commentTypeId'});
            this.belongsTo(models.User,              {foreignKey: 'userId'});
        }
    }
    Comment.init({
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
        entityTypeId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        entityId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        commentTypeId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        userId: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'Comment',
        schema: conf.schema,
    });
    return Comment;
};
