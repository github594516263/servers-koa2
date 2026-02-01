const { verifyToken } = require('../utils/jwt')
const { error } = require('../utils/response')

/**
 * 验证 Token 中间件
 */
async function authMiddleware(ctx, next) {
  // 从请求头获取 Token
  const authorization = ctx.headers.authorization
  
  if (!authorization) {
    ctx.status = 401
    ctx.body = error('未登录或登录已过期', 401)
    return
  }
  
  // 提取 Token（格式：Bearer token）
  const token = authorization.replace('Bearer ', '')
  
  if (!token) {
    ctx.status = 401
    ctx.body = error('Token 格式错误', 401)
    return
  }
  
  // 验证 Token
  const decoded = verifyToken(token)
  
  if (!decoded) {
    ctx.status = 401
    ctx.body = error('Token 无效或已过期', 401)
    return
  }
  
  // 将用户信息挂载到 ctx.state
  ctx.state.user = decoded
  
  await next()
}

module.exports = authMiddleware

