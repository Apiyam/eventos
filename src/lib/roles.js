export const STAFF_ROLES = [
  { id: 1, name: 'Superuser' },
  { id: 2, name: 'Administrador' },
  { id: 3, name: 'Tienda' },
  { id: 4, name: 'Platicas' },
]

export function userRole(user) {
  return String(user?.metadata?.role || user?.role || '').trim()
}

export function roleKey(user) {
  const fromName = userRole(user)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
  if (fromName) return fromName
  const id = Number(user?.role_id)
  if (id === 1) return 'superuser'
  if (id === 2) return 'administrador'
  if (id === 3) return 'tienda'
  if (id === 4) return 'platicas'
  return ''
}

export function isSuperUser(user) {
  return roleKey(user) === 'superuser' || Number(user?.role_id) === 1
}

export function isManager(user) {
  const key = roleKey(user)
  return key === 'superuser' || key === 'administrador' || key === 'admin'
}

const ROLE_PATHS = {
  superuser: null,
  administrador: null,
  admin: null,
  tienda: ['/admin', '/admin/canje', '/admin/tienda', '/admin/perfil'],
  platicas: ['/admin', '/admin/ingreso', '/admin/charlas', '/admin/perfil'],
}

export function allowedAdminPaths(user) {
  const key = roleKey(user)
  return ROLE_PATHS[key] ?? null
}

export function canAccessAdminPath(user, pathname) {
  const allowed = allowedAdminPaths(user)
  if (!allowed) return true
  return allowed.some((path) => (path === '/admin' ? pathname === '/admin' : pathname === path || pathname.startsWith(`${path}/`)))
}
