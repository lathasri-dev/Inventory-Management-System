const ROLE_IDS = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  SUPER_ADMIN: 'admin',
  INVENTORY_MANAGER: 'manager',
  VIEWER: 'user',
};

const LEGACY_ROLE_MAP = {
  superadmin: ROLE_IDS.ADMIN,
  super_admin: ROLE_IDS.ADMIN,
  'super admin': ROLE_IDS.ADMIN,
  admin: ROLE_IDS.ADMIN,
  manager: ROLE_IDS.MANAGER,
  inventorymanager: ROLE_IDS.MANAGER,
  'inventory manager': ROLE_IDS.MANAGER,
  salesstaff: ROLE_IDS.USER,
  'sales staff': ROLE_IDS.USER,
  employee: ROLE_IDS.USER,
  viewer: ROLE_IDS.USER,
  user: ROLE_IDS.USER,
};

const normalizeRole = (role) => {
  if (!role) {
    return ROLE_IDS.USER;
  }

  const normalized = String(role).trim().toLowerCase().replace(/[-\s]+/g, '_');

  if (Object.values(ROLE_IDS).includes(normalized)) {
    return normalized;
  }

  return LEGACY_ROLE_MAP[String(role).trim().toLowerCase().replace(/[_\s-]+/g, '')] || ROLE_IDS.USER;
};

const roleMatches = (role, allowedRoles = []) => {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowed = allowedRoles.map((item) => normalizeRole(item));
  return normalizedAllowed.includes(normalizedRole);
};

module.exports = {
  ROLE_IDS,
  normalizeRole,
  roleMatches,
};