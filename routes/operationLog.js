/**
 * 操作日志路由
 * 仅管理员可访问
 */

const Router = require('koa-router')
const router = new Router({ prefix: '/operation-logs' })
const operationLogController = require('../controllers/operationLogController')
const authMiddleware = require('../middleware/auth')
const { checkRole } = require('../middleware/permission')

// 所有路由都需要登录
router.use(authMiddleware)

// 获取日志列表 - 仅管理员
router.get('/', checkRole('admin', 'super_admin'), operationLogController.getLogs)

// 清空日志 - 仅超级管理员
router.delete('/clear', checkRole('super_admin'), operationLogController.clearLogs)

module.exports = router
