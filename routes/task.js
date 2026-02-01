/**
 * 任务管理路由
 * 演示操作权限控制
 */

const Router = require('koa-router')
const router = new Router({ prefix: '/tasks' })
const taskController = require('../controllers/taskController')
const authMiddleware = require('../middleware/auth')
const { checkPermission } = require('../middleware/permission')

// 所有路由都需要登录
router.use(authMiddleware)

// 获取任务统计 - 需要 task:view 权限
router.get('/stats', checkPermission('task:view'), taskController.getTaskStats)

// 获取任务列表 - 需要 task:view 权限
router.get('/', checkPermission('task:view'), taskController.getTasks)

// 获取任务详情 - 需要 task:view 权限
router.get('/:id', checkPermission('task:view'), taskController.getTask)

// 创建任务 - 需要 task:create 权限
router.post('/', checkPermission('task:create'), taskController.createTask)

// 更新任务 - 需要 task:edit 权限
router.put('/:id', checkPermission('task:edit'), taskController.updateTask)

// 删除任务 - 需要 task:delete 权限
router.delete('/:id', checkPermission('task:delete'), taskController.deleteTask)

// 分配任务 - 需要 task:assign 权限
router.put('/:id/assign', checkPermission('task:assign'), taskController.assignTask)

// 更新任务状态 - 需要 task:edit 权限（创建者和执行者都可以）
router.put('/:id/status', checkPermission('task:edit'), taskController.updateTaskStatus)

module.exports = router

