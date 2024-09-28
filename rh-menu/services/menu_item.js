import { Service } from 'rf-service';
import { spacialize, ucfirst } from 'rf-util';

export class MenuItemService extends Service.IdUuidEnableNameOwnerModuleTranslatable {
  references = {
    permission: true,
    parent: 'menuItemService',
  };
  defaultTranslationContext = 'menu';
  viewAttributes = ['uuid', 'name', 'jsonData', 'isTranslatable', 'data'];

  async validateForCreation(data) {
    let { uuid, isEnabled, name, parent, parentId, permission, permissionId, isTranslatable, translationContext, ownerModule, ownerModuleId, ...resData } = {
      ...data, 
      ...data.data, 
    };

    data = { uuid, isEnabled, name, parent, parentId, permission, permissionId, isTranslatable, translationContext, ownerModule, ownerModuleId, data: resData };

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
    if (!options?.include?.parentMenuItems) {
      return super.getList(options);
    }

    let menuItems = await super.getList({
      ...options,
      include: {
        ...options.include,
        parentMenuItems: undefined,
      },
    });

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
      ...options,
      where: {},
    };
    delete parentOptions.include?.parentMenuItems;

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

  async create(data) {
    return super.create(data);
  }

  async createIfNotExists(data) {
    let created;
    if (data.permissions) {
      data = { ...data };
      let permissions = data.permissions;
      delete data.permissions;
      if (!Array.isArray(permissions)) {
        permissions = permissions.split(',');
      }

      await Promise.all(permissions.map(async permission => {
        if (await this.createIfNotExists({ ...data, permission })) {
          created = true;
        }
      }));
    } else {
      created = await super.createIfNotExists(data);
    }

    return created;
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
      if (mi.parentId && mi.parent === null) {
        mi.parentId = null;
      }
      
      result += await this.updateForId(mi, id, arrangedOptions);
    }

    return result;
  }
}