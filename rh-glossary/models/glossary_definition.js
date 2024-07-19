import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class GlossaryDefinition extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,       { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.GlossaryTerm, { as: 'term',        foreignKey: { name: 'termId', allowNull: false }});
      this.belongsTo(models.GlossaryType, { as: 'type',        foreignKey: { name: 'typeId', allowNull: false }});
    }
  }
  GlossaryDefinition.init({
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
    definition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'definition',
    schema: conf.schema,
  });
  return GlossaryDefinition;
};
