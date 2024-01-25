import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class CommentEntityType extends sequelize.Sequelize.Model {
    }
    CommentEntityType.init({
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        sequelize,
        timestamps: true,
        tableName: 'EntityType',
        schema: conf.schema,
    });
    return CommentEntityType;
};
