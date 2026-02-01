const { error } = require('../utils/response')

/**
 * 全局错误处理中间件
 */
async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (err) {
    // 记录错误日志
    console.error('Error:', err)
    
    // 确定状态码
    const status = err.status || err.statusCode || 500
    
    // 确定错误信息
    const message = err.message || '服务器内部错误'
    
    // 设置响应
    ctx.status = status
    ctx.body = error(message, status)
    
    // 触发 Koa 错误事件
    ctx.app.emit('error', err, ctx)
  }
}

module.exports = errorMiddleware

