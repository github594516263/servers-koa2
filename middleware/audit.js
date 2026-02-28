/**
 * 审计日志中间件
 * 自动记录 POST/PUT/DELETE 写操作
 */

const OperationLog = require('../models/OperationLog')

// 路由 → 模块 & 操作描述映射
const MODULE_MAP = {
  '/api/auth': 'auth',
  '/api/users': 'user',
  '/api/roles': 'role',
  '/api/menus': 'menu',
  '/api/tasks': 'task',
  '/api/articles': 'article',
}

const ACTION_MAP = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
}

// 特殊路由描述
const DETAIL_MAP = {
  'POST /api/auth/login': '用户登录',
  'POST /api/auth/logout': '用户登出',
  'POST /api/auth/register': '用户注册',
  'PUT /api/auth/password': '修改密码',
  'POST /api/tasks': '创建任务',
  'PUT /api/tasks/assign': '分配任务',
  'PUT /api/tasks/status': '更新任务状态',
  'POST /api/articles': '创建文章',
  'POST /api/users': '创建用户',
  'POST /api/roles': '创建角色',
  'POST /api/menus': '创建菜单',
}

/**
 * 解析模块名
 */
function resolveModule(url) {
  for (const prefix in MODULE_MAP) {
    if (url.startsWith(prefix)) {
      return MODULE_MAP[prefix]
    }
  }
  return 'other'
}

/**
 * 解析操作描述
 */
function resolveDetail(method, url) {
  // 先精确匹配
  // 去掉 query string 和末尾 ID
  const cleanUrl = url.split('?')[0]
  const key = `${method} ${cleanUrl}`

  for (const pattern in DETAIL_MAP) {
    if (key.startsWith(pattern)) {
      return DETAIL_MAP[pattern]
    }
  }

  // 通用描述
  const module = resolveModule(cleanUrl)
  const actionLabel = { create: '新增', update: '更新', delete: '删除' }
  const action = ACTION_MAP[method] || method
  return `${actionLabel[action] || action} ${module}`
}

/**
 * 过滤敏感字段
 */
function sanitizeParams(body) {
  if (!body || typeof body !== 'object') return null
  const sanitized = { ...body }
  const sensitiveKeys = ['password', 'oldPassword', 'newPassword', 'confirmPassword', 'token']
  sensitiveKeys.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '******'
    }
  })
  return JSON.stringify(sanitized)
}

/**
 * 审计中间件
 * 仅拦截写操作（POST/PUT/PATCH/DELETE）
 * 跳过日志查询接口本身和健康检查
 */
function auditMiddleware() {
  return async (ctx, next) => {
    const method = ctx.method.toUpperCase()

    // 只记录写操作
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return await next()
    }

    // 跳过日志接口本身 和 健康检查
    if (ctx.url.startsWith('/api/operation-logs') || ctx.url === '/api/health') {
      return await next()
    }

    const startTime = Date.now()

    try {
      await next()

      const duration = Date.now() - startTime
      const user = ctx.state.user
      const url = ctx.url.split('?')[0]
      const responseCode = ctx.body?.code

      // 异步写日志，不阻塞响应
      setImmediate(async () => {
        try {
          await OperationLog.create({
            userId: user?.id || null,
            username: user?.username || (ctx.request.body?.username) || null,
            module: resolveModule(url),
            action: ACTION_MAP[method] || method.toLowerCase(),
            method,
            url,
            ip: ctx.ip || ctx.request.ip,
            params: sanitizeParams(ctx.request.body),
            result: (responseCode === 200 || responseCode === 0) ? 'success' : 'fail',
            detail: resolveDetail(method, ctx.url),
            duration,
          })
        } catch (err) {
          console.error('写入操作日志失败:', err.message)
        }
      })
    } catch (err) {
      const duration = Date.now() - startTime
      const user = ctx.state.user
      const url = ctx.url.split('?')[0]

      // 异步写失败日志
      setImmediate(async () => {
        try {
          await OperationLog.create({
            userId: user?.id || null,
            username: user?.username || null,
            module: resolveModule(url),
            action: ACTION_MAP[method] || method.toLowerCase(),
            method,
            url,
            ip: ctx.ip || ctx.request.ip,
            params: sanitizeParams(ctx.request.body),
            result: 'fail',
            detail: `${resolveDetail(method, ctx.url)} - 异常: ${err.message}`,
            duration,
          })
        } catch (logErr) {
          console.error('写入操作日志失败:', logErr.message)
        }
      })

      throw err
    }
  }
}

module.exports = auditMiddleware
