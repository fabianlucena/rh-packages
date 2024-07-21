import { runSequentially } from 'rf-util';
import { conf as localConf } from './conf.js';
import dependency from 'rf-dependency';

export const conf = localConf;
conf.configure = configure;
conf.init = [init];

let perspectiveService;

async function configure(global, options) {
  if (options?.filters) {
    conf.filters = options.filters;
  }

  global.eventBus?.$on('menuFilter', menuFilter);
}

async function init() {
  perspectiveService = dependency.get('perspectiveService');
}

conf.updateData = async function(global) {
  await runSequentially(global?.data?.perspectives, async data => await perspectiveService.createIfNotExists(data, { skipDeleteExtern: true }));
};

async function menuFilter(data, options) {
  const perspectives = await perspectiveService.getList({ loc: options.loc });
  if (!perspectives.length) {
    return;
  }

  for (const perspective of perspectives) {
    data.menu.push({
      name:      perspective.name,
      parent:    'perspective.switch',
      label:     perspective.title,
      icon:      perspective.icon,
      action:    'apiCall',
      service:   `perspective/switch/${perspective.uuid}`,
      method:    'POST',
      onSuccess: { reloadMenu: true },
    });
  }
}