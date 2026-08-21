const ROLE_IDS = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INVENTORY_MANAGER: 'inventory_manager',
  SALES_STAFF: 'sales_staff',
  VIEWER: 'viewer',
};

const LEGACY_ROLE_MAP = {
  superadmin: ROLE_IDS.SUPER_ADMIN,
  super_admin: ROLE_IDS.SUPER_ADMIN,
  'super admin': ROLE_IDS.SUPER_ADMIN,
  admin: ROLE_IDS.ADMIN,
  manager: ROLE_IDS.INVENTORY_MANAGER,
  inventorymanager: ROLE_IDS.INVENTORY_MANAGER,
  'inventory manager': ROLE_IDS.INVENTORY_MANAGER,
  salesstaff: ROLE_IDS.SALES_STAFF,
  'sales staff': ROLE_IDS.SALES_STAFF,
  employee: ROLE_IDS.SALES_STAFF,
  viewer: ROLE_IDS.VIEWER,
};

const normalizeRole = (role) => {
  if (!role) {
    return ROLE_IDS.VIEWER;
  }

  const normalized = String(role).trim().toLowerCase().replace(/[-\s]+/g, '_');

  if (Object.values(ROLE_IDS).includes(normalized)) {
    return normalized;
  }

  return LEGACY_ROLE_MAP[String(role).trim().toLowerCase().replace(/[_\s-]+/g, '')] || ROLE_IDS.VIEWER;
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