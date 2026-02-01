const { hasPermission, hasRole } = require('../utils/permission')
const { error } = require('../utils/response')

/**
 * 权限验证中间件
 * @param {string|string[]} requiredPermissions - 需要的权限编码（单个或数组）
 * @param {string} mode - 验证模式：'AND' 或 'OR'，默认 'OR'
 * @returns {Function} Koa 中间件
 */
function checkPermission(requiredPermissions, mode = 'OR') {
  return async (ctx, next) => {
    try {
      // 检查用户是否已登录
      if (!ctx.state.user || !ctx.state.user.id) {
        ctx.status = 401
        ctx.body = error('未登录或登录已过期', 401)
        return
      }
      
      const userId = ctx.state.user.id
      
      // 检查用户是否有所需权限
      const hasAccess = await hasPermission(userId, requiredPermissions, mode)
      
      if (!hasAccess) {
        ctx.status = 403
        ctx.body = error('权限不足', 403)
        return
      }
      
      // 权限验证通过，继续执行
      await next()
    } catch (err) {
      console.error('权限验证失败:', err)
      ctx.status = 500
      ctx.body = error('权限验证失败', 500)
    }
  }
}

/**
 * 角色验证中间件
 * @param {string|string[]} requiredRoles - 需要的角色编码（单个或数组）
 * @param {string} mode - 验证模式：'AND' 或 'OR'，默认 'OR'
 * @returns {Function} Koa 中间件
 */
function checkRole(requiredRoles, mode = 'OR') {
  return async (ctx, next) => {
    try {
      // 检查用户是否已登录
      if (!ctx.state.user || !ctx.state.user.id) {
        ctx.status = 401
        ctx.body = error('未登录或登录已过期', 401)
        return
      }
      
      const userId = ctx.state.user.id
      
      // 检查用户是否有所需角色
      const hasRequiredRole = await hasRole(userId, requiredRoles, mode)
      
      if (!hasRequiredRole) {
        ctx.status = 403
        ctx.body = error('角色权限不足', 403)
        return
      }
      
      // 权限验证通过，继续执行
      await next()
    } catch (err) {
      console.error('角色验证失败:', err)
      ctx.status = 500
      ctx.body = error('权限验证失败', 500)
    }
  }
}

/**
 * 检查是否为管理员（包括超级管理员和管理员）
 * @returns {Function} Koa 中间件
 */
function checkAdmin() {
  return checkRole(['super_admin', 'admin'], 'OR')
}

/**
 * 检查是否为超级管理员
 * @returns {Function} Koa 中间件
 */
function checkSuperAdmin() {
  return checkRole('super_admin')
}

module.exports = {
  checkPermission,
  checkRole,
  checkAdmin,
  checkSuperAdmin,
}
