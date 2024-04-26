import { conf } from '../conf.js';
import { Controller } from 'rh-controller';
import { runSequentially } from 'rf-util';
import { defaultLoc } from 'rf-locale';
import dependency from 'rf-dependency';

export class MenuController extends Controller {
  constructor() {
    super();

    this.menuItemService = dependency.get('menuItemService');
  }

  async get(req, res) {
    const permissions = req?.permissions;
    const options = {
      loc: req.loc,
      view: true,
      include: {
        parentMenuItems: true,
      },
      where: { permission: { name: permissions }},
    };

    const rows = await this.menuItemService.getList(options);
    const loc = req.loc ?? defaultLoc;
    let menu = await runSequentially(rows, async mi => {
      if (mi.parent) {
        mi.parent = mi.parent.name;
      }

      if (mi.data) {
        mi = { ...mi, data: undefined, ...mi.data };
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

    const data = { menu };
    await conf.global.eventBus?.$emit('menuGet', data, { loc, sessionId: req.session?.id, params: req.query });
    await conf.global.eventBus?.$emit('menuFilter', data, { loc, sessionId: req.session?.id, params: req.query });

    res.status(200).send(data);
  }
}