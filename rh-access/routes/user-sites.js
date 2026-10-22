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

      const [results] = await sequelize.query(`
        SELECT 
          s.uuid AS siteUuid,
          s.name AS siteName,
          s.title AS siteTitle,
          r.uuid AS roleUuid,
          r.name AS roleName,
          r.title AS roleTitle,
          usr.isEnabled AS isEnabled
        FROM [acc].[UserSiteRole] usr
        JOIN [syst].[Site] s ON s.id = usr.siteId
        JOIN [acc].[Role] r ON r.id = usr.roleId
        WHERE usr.userId = :userId AND usr.isEnabled = 1
        ORDER BY s.title, r.title
      `, {
        replacements: { userId: user.id },
      });

      const sitesMap = new Map();
      for (const row of results) {
        const sUuid = row.siteUuid;
        if (!sitesMap.has(sUuid)) {
          sitesMap.set(sUuid, {
            uuid: sUuid,
            name: row.siteName,
            title: row.siteTitle || row.siteName,
            roles: [],
          });
        }
        if (row.roleUuid) {
          sitesMap.get(sUuid).roles.push({
            uuid: row.roleUuid,
            name: row.roleName,
            title: row.roleTitle || row.roleName,
          });
        }
      }

      const rows = Array.from(sitesMap.values());
      return res.status(200).json({ count: rows.length, rows });
    } catch (err) {
      console.error('Error in /user-sites:', err);
      return res.status(500).json({ error: err.message });
    }
  });
  app.all('/user-sites', methodNotAllowed);
};
