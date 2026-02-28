/**
 * 通知路由
 * 站内信相关接口
 */

const Router = require('koa-router')
const router = new Router({ prefix: '/notifications' })
const notificationController = require('../controllers/notificationController')
const authMiddleware = require('../middleware/auth')
const { checkRole } = require('../middleware/permission')

// 所有路由都需要登录
router.use(authMiddleware)

// 获取当前用户通知列表
router.get('/', notificationController.getNotifications)

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount)

// 标记单条通知为已读
router.put('/:id/read', notificationController.markAsRead)

// 全部标记为已读
router.put('/read-all', notificationController.markAllAsRead)

// 删除单条通知
router.delete('/:id', notificationController.deleteNotification)

// 批量删除通知
router.post('/batch-delete', notificationController.batchDeleteNotifications)

// 发送通知 - 仅管理员
router.post('/send', checkRole('admin', 'super_admin'), notificationController.sendNotification)

module.exports = router
