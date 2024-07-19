import { conf } from '../conf.js';

export default (sequelize, DataTypes) => {
  class GlossaryTerm extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,           { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.Glossary,         { as: 'glossary',    foreignKey: { name: 'glossaryId', allowNull: false }});
      this.belongsTo(models.GlossaryCategory, { as: 'category',    foreignKey: { name: 'categoryId', allowNull: false }});
    }
  }
  GlossaryTerm.init({
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
    tableName: 'Term',
    schema: conf.schema,
  });
  return GlossaryTerm;
};
