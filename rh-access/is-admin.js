export function isAdmin({ roles, username }) {
  return !!roles?.includes('admin') || !!roles?.includes('qaaitAdmin') || username === 'admin';
}
