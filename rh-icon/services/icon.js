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
    }

    return IconService.cache[name];
  }
}