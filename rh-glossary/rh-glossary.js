import dependency from 'rf-dependency';
import { conf as localConf } from './conf.js';
import { runSequentially } from 'rf-util';

export const conf = localConf;

conf.configure = configure;
conf.updateData = updateData;

async function configure(global, options) {
  for (const k in options) {
    conf[k] = options[k];
  }
}

async function updateData(global) {
  const data = global?.data;
  const glossaryService =           dependency.get('glossaryService');
  const glossaryCategoryService =   dependency.get('glossaryCategory');
  const glossaryTypeService =       dependency.get('glossaryTypeService');
  const glossaryTermService =       dependency.get('glossaryTermService');
  const glossaryDefinitionService = dependency.get('glossaryDefinitionService');

  await runSequentially(data?.glossaries,            async data => await glossaryService.          createIfNotExists(data));
  await runSequentially(data?.glossariesCategories,  async data => await glossaryCategoryService.  createIfNotExists(data));
  await runSequentially(data?.glossariesTypes,       async data => await glossaryTypeService.      createIfNotExists(data));
  await runSequentially(data?.glossariesTerms,       async data => await glossaryTermService.      createIfNotExists(data));
  await runSequentially(data?.glossariesDefinitions, async data => await glossaryDefinitionService.createIfNotExists(data));
}