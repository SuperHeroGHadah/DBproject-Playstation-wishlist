
// role definitions
const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// permission definitions
const PERMISSIONS = {
  user: [
    // auth
    'auth:login',
    'auth:register',
    'auth:view_own_profile',
    
    // read only access to games
    'games:view',
    'games:search',
    
    // access to own reviews
    'reviews:create',
    'reviews:view',
    'reviews:update_own',
    'reviews:delete_own',
    
    // access to own game list
    'gamelist:view_own',
    'gamelist:manage_own_wishlist',
    'gamelist:manage_own_played',
    
    // access to own activities
    'activities:view_own',
  ],
  
  admin: [
    // inherits all user permissions
    ...PERMISSIONS.user,
    
    // can manage users
    'users:view_all',
    'users:view',
    'users:update',
    'users:delete',
    
    // can manage games
    'games:create',
    'games:update',
    'games:delete',
    
    // can moderate reviews
    'reviews:delete_any',
    
    // can view and manage all activities
    'activities:view_all',
    'activities:delete',
    
    // has unrestricted access to the system
    'system:full_access',
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  const rolePermissions = PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

/**
 * Middleware to check if user has required permission
 * @param {string} permission - Required permission
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required permission: ${permission}`,
      });
    }

    next();
  };
};

/**
 * Grant access to specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  hasPermission,
  checkPermission,
  authorize,
};