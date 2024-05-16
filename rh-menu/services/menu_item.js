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
      const parentMenuItem = await this.create({
        isEnabled: true,
        name: data.parent,
        label: ucfirst(spacialize(data.parent)),
      });

      data.parentId = parentMenuItem.id;
    }

    return super.validateForCreation(data);
  }

  async getList(options) {
    let menuItems = super.getList({
      ...options,
      include: {
        ...options.include,
        parentMenuItems: undefined,
      },
    });
    if (!options?.include?.parentMenuItems) {
      return menuItems;
    }
        
    menuItems = await menuItems;

    const menuItemsName = menuItems.map(menuItem => menuItem.name).filter(menuItemName => menuItemName);
    let parentsNameToLoad = [];
    for (const menuItem of menuItems) {
      const parentName = menuItem.parent?.name;
      if (!parentName || menuItemsName.includes(parentName) || parentsNameToLoad.includes(parentName)) {
        continue;
      }

      parentsNameToLoad.push(menuItem.parent.name);
    }

    const parentOptions = {
      where: {},
      ...options,
    };

    if (parentOptions.include?.parentMenuItems) {
      delete parentOptions.include?.parentMenuItems;
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
        const parentName = menuItem.parent?.name;
        if (!parentName || menuItemsName.includes(parentName) || parentsNameToLoad.includes(parentName)) {
          continue;
        }

        parentsNameToLoad.push(menuItem.parent.name);
      }
    }

    return menuItems;
  }

  async override(data1, options1) {
    const arrangedOptions = { ...options1, translate: false };
    const arrangedData = { ...data1 };
    if (!arrangedOptions.where) {
      if (arrangedData.id) {
        arrangedOptions.where = { id: arrangedData.id };
        delete arrangedData.id;
      } else if (arrangedData.uuid) {
        arrangedOptions.where = { uuid: arrangedData.uuid };
        delete arrangedData.uuid;
      } else if (arrangedData.name) {
        arrangedOptions.where = { name: arrangedData.name };
        delete arrangedData.name;
      }
    }

    const miList = await this.getList(arrangedOptions);

    delete arrangedOptions.where;
    let result = 0;
    for (let mi of miList) {
      delete mi.jsonData;
      const { id } = mi;
      mi = {
        ...mi,
        ...arrangedData,
        data: { ...mi.data, ...arrangedData.data },
      };
      delete mi.id;
      delete mi.uuid;
      delete mi.name;
      result += await this.updateForId(mi, id, arrangedOptions);
    }

    return result;
  }
}