import { PrivilegesService } from '../services/privileges.js';
import { errorHandler } from 'rf-util';
import { defaultLoc } from 'rf-locale';

const privilegesService = PrivilegesService.singleton();

export class PrivilegesController {
  static middleware() {
    return (req, res, next) => {
      const loc = req.loc ?? defaultLoc;
      privilegesService.getJSONForUsernameAndSessionIdCached(req?.user?.username, req?.session?.id)
        .then(privileges => {
          if (privileges) {
            req.sites = privileges.sites;
            req.site = privileges.site;
            req.roles = privileges.roles;
            req.groups = privileges.groups;
            req.permissions = privileges.permissions;
          }
                        
          next();
        })
        .catch(err => {
          errorHandler(err, loc);
          next();
        });
    };
  }
  
  static async get(req, res) {
    let result;

    if (req) {
      result = {
        username: req.user?.username ?? null,
        displayName: req.user?.displayName ?? null,
        site: req.site?.name ?? null,
        sites:  req.sites,
        roles: req.roles,
        groups: req.groups,
        permissions: req.permissions,
      };

      if (!req.site?.name) {
        const loc = req.loc ?? defaultLoc;
        result.warning = await (loc ?? loc)._('No current site selected');
      }
    } else {
      result = {};
    }

    res.status(200).send({ count: 1, rows: [result] });
  }
}
