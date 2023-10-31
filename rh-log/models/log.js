import {conf} from '../conf.js';

export default (sequelize, DataTypes) => {
    class Log extends sequelize.Sequelize.Model {
        static postAssociate(models) {
            if (models.Session)
                this.belongsTo(models.Session, {foreignKey: 'sessionId', required: false});
        }
    }
    Log.init({
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        dateTime: {
            type: DataTypes.DATE(6),
            defaultValue: DataTypes.NOW,
            allowNull: true,
        },
        ref: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sessionId: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        jsonData: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        data: {
            type: DataTypes.VIRTUAL,
            get() {
                const jsonData = this.getDataValue('jsonData');
                if (!jsonData) {
                    return null;
                }

                return JSON.parse(jsonData);
            },
            set(data) {
                const jsonData = JSON.stringify(data) ?? null;
                
                this.setDataValue('jsonData', jsonData);
            },
        },
    }, {
        sequelize,
        timestamps: true,
        freezeTableName: true,
        schema: conf.schema,
    });
    return Log;
};
