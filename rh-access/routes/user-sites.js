import { corsSimplePreflight, methodNotAllowed } from 'http-util';
import dependency from 'rf-dependency';

export default (app, checkPermission) => {
  app.options('/user-sites', corsSimplePreflight('GET,HEAD'));
  app.get('/user-sites', checkPermission('user-access.get'), async (req, res) => {
    try {
      const userUuid = req.query?.userUuid;
      const username = req.query?.username;
      if (!userUuid && !username) {
        return res.status(200).json({ count: 0, rows: [] });
      }

      const userService = dependency.get('userService');
      let user;
      if (userUuid) {
        user = await userService.getSingleForUuid(userUuid, { skipNoRowsError: true });
      } else if (username) {
        user = await userService.getSingleForUsername(username, { skipNoRowsError: true });
      }

      if (!user) {
        return res.status(200).json({ count: 0, rows: [] });
      }

      const sequelize = userService.model?.sequelize || dependency.get('userSiteRoleService')?.model?.sequelize;
      if (!sequelize) {
        throw new Error('Sequelize database connection is not available on models.');
      }

      const UserSiteRole = sequelize.models?.UserSiteRole || dependency.get('userSiteRoleService')?.model?.model;
      const Site = sequelize.models?.Site || dependency.get('siteService')?.model?.model;
      const Role = sequelize.models?.Role || dependency.get('roleService')?.model?.model;

      if (!UserSiteRole || !Site || !Role) {
        throw new Error('Sequelize models (UserSiteRole, Site, Role) are not available.');
      }

      const results = await UserSiteRole.findAll({
        where: {
          userId: user.id,
          isEnabled: true,
        },
        include: [
          {
            model: Site,
            as: 'site',
            attributes: ['uuid', 'name', 'title', 'isTranslatable'],
            where: { isEnabled: true },
            required: true,
          },
          {
            model: Role,
            as: 'role',
            attributes: ['uuid', 'name', 'title', 'isTranslatable'],
            where: { isEnabled: true },
            required: false,
          },
        ],
      });

      const loc = req.loc;
      const sitesMap = new Map();
      for (const item of results) {
        const row = item?.get ? item.get({ plain: true }) : item;
        const site = row?.site;
        if (!site || !site.uuid) continue;

        const sUuid = site.uuid;
        if (!sitesMap.has(sUuid)) {
          let siteTitle = site.title || site.name;
          if (loc && site.isTranslatable && site.title) {
            siteTitle = await loc._(site.title);
          }

          sitesMap.set(sUuid, {
            uuid: sUuid,
            name: site.name,
            title: siteTitle,
            roles: [],
          });
        }

        const role = row?.role;
        if (role && role.uuid) {
          let roleTitle = role.title || role.name;
          if (loc && role.isTranslatable && role.title) {
            roleTitle = await loc._(role.title);
          }

          sitesMap.get(sUuid).roles.push({
            uuid: role.uuid,
            name: role.name,
            title: roleTitle,
          });
        }
      }

      const rows = Array.from(sitesMap.values());
      rows.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
      for (const site of rows) {
        site.roles.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
      }
      return res.status(200).json({ count: rows.length, rows });
    } catch (err) {
      console.error('Error in /user-sites:', err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.all('/user-sites', methodNotAllowed);
};
