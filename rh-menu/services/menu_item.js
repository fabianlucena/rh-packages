import { ServiceIdUuidNameEnabledTranslatable } from 'rf-service';
import { spacialize, ucfirst } from 'rf-util';

export class MenuItemService extends ServiceIdUuidNameEnabledTranslatable {
  references = {
    permission: true,
    parent: 'menuItemService',
  };
  defaultTranslationContext = 'menu';
  viewAttributes = ['uuid', 'name', 'jsonData', 'isTranslatable', 'data'];

  async validateForCreation(data) {
    if (!data.parentId && data.parent) {
      const parentMenuItem = await MenuItemService.singleton().create({
        isEnabled: true,
        name: data.parent,
        label: ucfirst(spacialize(data.parent)),
      });

      data.parentId = parentMenuItem.id;
    }

    return super.validateForCreation(data);
  }

  async getList(options) {
    if (!options?.include?.ParentAsMenuItem) {
      return super.getList(options);
    }
        
    const menuItems = await super.getList(options);

    const menuItemsName = menuItems.map(menuItem => menuItem.name).filter(menuItemName => menuItemName);
    let parentsNameToLoad = [];
    for (const menuItem of menuItems) {
      const parentName = menuItem.Parent?.name;
      if (!parentName || menuItemsName.includes(parentName) || parentsNameToLoad.includes(parentName)) {
        continue;
      }

      parentsNameToLoad.push(menuItem.Parent.name);
    }

    const parentOptions = {
      where: {},
      ...options,
    };

    if (parentOptions.include?.ParentAsMenuItem) {
      delete parentOptions.include?.ParentAsMenuItem;
    }

    while (parentsNameToLoad.length) {
      parentOptions.where.name = parentsNameToLoad;
      const parentMenuItems = await super.getList(parentOptions);
      if (!parentMenuItems.length) {
        break;
      }

      menuItems.splice(0, 0, ...parentMenuItems);
      menuItemsName.splice(0, 0, ...parentMenuItems.map(menuItem => menuItem.name).filter(menuItemName => menuItemName));
            
      parentsNameToLoad = [];
      for (const menuItem of menuItems) {
        const parentName = menuItem.Parent?.name;
        if (!parentName || menuItemsName.includes(parentName) || parentsNameToLoad.includes(parentName)) {
          continue;
        }

        parentsNameToLoad.push(menuItem.Parent.name);
      }
    }

    return menuItems;
  }

  async override(data, options) {
    if (!options?.where) {
      options ??= {};

      if (data.id) {
        options.where = { id: data.id };
        data = { ...data, id: undefined };
      } else if (data.uuid) {
        options.where = { uuid: data.uuid };
        data = { ...data, uuid: undefined };
      } else if (data.name) {
        options.where = { name: data.name };
        data = { ...data, name: undefined };
      }
    }

    const miList = await this.getList({ ...options, translate: false });

    delete options.where;
    let result = 0;
    for (let mi of miList) {
      const id = mi.id;
      mi = {
        ...mi,
        jsonData: undefined,
        ...data,
        data: { ...mi.data, ...data.data },
        id: undefined,
        uuid: undefined,
        name: undefined,
      };
      result += await this.updateForId(mi, id, options);
    }

    return result;
  }
}