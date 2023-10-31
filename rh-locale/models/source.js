import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Source extends sequelize.Sequelize.Model {
    }
    Source.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        uuid: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            unique: true
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        isJson: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
            //unique: true
        },
        ref: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
        /*indexes: [
            {
                //unique: true,
                type: 'FULLTEXT',
                fields: [
                    'isJson',
                    {
                        name: 'text',
                    },
                ],
            },
        ],*/
    });
    return Source;
};
