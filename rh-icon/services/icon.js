import path from 'path';
import fs from 'fs';
import { conf } from '../conf.js';

export class IconService {
  static cache = {};

  static singleton() {
    if (!this.singletonInstance) {
      this.singletonInstance = this.factory();
    }

    return this.singletonInstance;
  }

  static factory() {
    const service = new this();
    if (!this.singletonInstance) {
      this.singletonInstance = service;
    }

    return service;
  }

  searchIconPathInModulesForName(name) {
    const ext = path.extname(name);
    const { modules } = conf.global;
    for (const module of modules) {
      if (module.iconsPath) {
        let fullPath = path.join(module.iconsPath, name);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        } else if (!ext) {
          for (const iconExt of conf.iconExtensions) {
            fullPath = path.join(module.iconsPath, `${name}.${iconExt}`);
            if (fs.existsSync(fullPath)) {
              return fullPath;
            }   
          }
        }
      }
    }

    return null;
  }

  getPathForNameOrNull(name) {
    if (!IconService.cache[name] && typeof IconService.cache[name] === 'undefined') {
      IconService.cache[name] = this.searchIconPathInModulesForName(name);
      if (!IconService.cache[name]) {
        const dashName = name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .split(/([^a-zA-Z0-9]|(?<=[a-z])(?=[A-Z0-9])|(?<=[A-Z])(?=[0-9])|(?<=[0-9])(?=[a-zA-Z]))/)
          .map(t => t.trim().toLowerCase())
          .filter(t => t && t.match(/[a-zA-Z0-9]/))
          .join('-')
          .trim();
        IconService.cache[name] = this.searchIconPathInModulesForName(dashName);
      }
    }

    return IconService.cache[name];
  }
}
