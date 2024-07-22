import { runSequentially } from 'rf-util';
import { conf as localConf } from './conf.js';
import dependency from 'rf-dependency';

export const conf = localConf;
conf.configure = configure;
conf.init = [init];

let sessionDataService,
  perspectiveService,
  perspectiveMenuItemService;

async function configure(global) {
  global.eventBus?.$on('menuFilter', menuFilter);

  dependency.addSingleton('getCurrentPerspective', getCurrentPerspective);
}

async function init() {
  sessionDataService =         dependency.get('sessionDataService');
  perspectiveService =         dependency.get('perspectiveService');
  perspectiveMenuItemService = dependency.get('perspectiveMenuItemService');
}

conf.updateData = async function(global) {
  await runSequentially(global?.data?.perspectives, async data => await perspectiveService.createIfNotExists(data, { skipDeleteExtern: true }));
};

async function getCurrentPerspective({ context }) {
  if (!context?.sessionId) {
    return;
  }

  const sessionData = await sessionDataService.getDataIfExistsForSessionId(context.sessionId);
  return sessionData?.perspective;
}

async function menuFilter(data, { context, loc }) {
  const perspectives = await perspectiveService.getList({ loc });
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

  const perspective = await getCurrentPerspective({ context });
  if (!perspective) {
    return;
  }

  const overrideMenuItems = await perspectiveMenuItemService.getFor(
    { perspective: { id: perspective.id }},
    { include: { menuItem: true }},
  );

  for (const overrideMenuItem of overrideMenuItems) {
    if (overrideMenuItem.isEnabled === false) {
      const menuItemIndex = data.menu.findIndex(mi => mi.uuid == overrideMenuItem.menuItem.uuid);
      if (typeof menuItemIndex !== 'undefined') {
        data.menu.splice(menuItemIndex, 1);
      }

      continue;
    }

    const menuItem = data.menu.find(mi => mi.name == overrideMenuItem.name);
    if (!menuItem) {
      continue;
    }

    for (const k in overrideMenuItem) {
      menuItem[k] = overrideMenuItem[k];
    }
  }
}