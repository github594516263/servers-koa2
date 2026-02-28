const Router = require('koa-router')
const authRouter = require('./auth')
const roleRouter = require('./role')
// const permissionRouter = require('./permission')  // 方案一：不再使用独立的权限管理
const menuRouter = require('./menu')
const userRouter = require('./user')
const articleRouter = require('./article')
const taskRouter = require('./task')
const operationLogRouter = require('./operationLog')
const notificationRouter = require('./notification')

const router = new Router({
  prefix: '/api',
})

// 健康检查
router.get('/health', (ctx) => {
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
})

// 注册认证路由
router.use(authRouter.routes(), authRouter.allowedMethods())

// 注册角色路由
router.use(roleRouter.routes(), roleRouter.allowedMethods())

// 注册权限路由 - 方案一：不再使用独立的权限管理，权限通过菜单的 permission_code 管理
// router.use(permissionRouter.routes(), permissionRouter.allowedMethods())

// 注册菜单路由
router.use(menuRouter.routes(), menuRouter.allowedMethods())

// 注册用户路由
router.use(userRouter.routes(), userRouter.allowedMethods())

// 注册业务模块路由
router.use(articleRouter.routes(), articleRouter.allowedMethods())
router.use(taskRouter.routes(), taskRouter.allowedMethods())
router.use(operationLogRouter.routes(), operationLogRouter.allowedMethods())
router.use(notificationRouter.routes(), notificationRouter.allowedMethods())

module.exports = router
