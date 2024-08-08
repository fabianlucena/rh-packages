import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { runSequentially } from 'rf-util';
import { makeContext } from 'http-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class MenuController extends Controller {
  constructor() {
    super();

    this.menuItemService = dependency.get('menuItemService');
  }

  async get(req, res) {
    const options = {
      loc: req.loc,
      view: true,
      include: {
        parent: true,
        parentMenuItems: true,
      },
      where: { permission: { name: req.permissions ?? null }},
      skipDeleteIsTranslatable: true,
    };

    const rows = await this.menuItemService.getList(options);
    const loc = req.loc ?? defaultLoc;
    const menu = await runSequentially(rows, async menuItem => {
      let mi = menuItem;
      
      if (mi.parent) {
        mi.parent = mi.parent.name;
      }

      if (mi.data) {
        const { data } = mi;
        delete mi.data;
        mi = { ...mi, ...data };
      }

      if (mi.jsonData) {
        delete mi.jsonData;
      }

      if (mi.isTranslatable) {
        if (mi.label) {
          mi.label = await loc._c(mi.translationContext ?? 'menu', mi.label);
        }

        delete mi.isTranslatable;
        delete mi.translationContext;
      }

      if (mi.alias) {
        mi.name = mi.alias;
        delete mi.alias;
      }

      return mi;
    });

    const data = { menu },
      eventOptions = { context: makeContext(req, res), loc, sessionId: req.session?.id, params: req.query };
    await conf.global.eventBus?.$emit('menuGet',    data, eventOptions);
    await conf.global.eventBus?.$emit('menuFilter', data, eventOptions);

    res.status(200).send(data);
  }
}