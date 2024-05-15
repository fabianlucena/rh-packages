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

  getForNameOrNull(name) {
    if (!IconService.cache[name]) {
      const { modules } = conf.global;
      for (const module of modules) {
        if (module.iconsPath) {
          const fullPath = path.join(module.iconsPath, name);
          if (fs.existsSync(fullPath)) {
            IconService.cache[name] = fullPath;
          }
        }
      }

      if (!IconService.cache[name]) {
        return null;
      }
    }

    return Buffer.from(fs.readFileSync(IconService.cache[name], 'binary'), 'binary');
  }
}