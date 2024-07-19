import { conf } from '../conf.js';

export default (sequelize) => {
  class GlossaryProject extends sequelize.Sequelize.Model {
    static associate(models) {
      this.belongsTo(models.Module,   { as: 'ownerModule', foreignKey: 'ownerModuleId' });
      this.belongsTo(models.Glossary, { as: 'glossary',    foreignKey: 'glossaryId' });
      if (models.Project) {
        this.belongsTo(models.Project,  { as: 'project',     foreignKey: 'projectId' });
      }
    }
  }
  GlossaryProject.init({
  }, {
    sequelize,
    timestamps: true,
    tableName: 'GlossaryProject',
    schema: conf.schema,
  });
  return GlossaryProject;
};
