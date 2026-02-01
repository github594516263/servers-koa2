const Router = require('koa-router')
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/auth')
const { checkPermission } = require('../middleware/permission')

const router = new Router({
  prefix: '/users',
})

// 获取用户列表（需要认证和权限）
router.get('/', authMiddleware, checkPermission('user:view'), userController.getUsers)

// 根据ID获取用户详情（需要认证和权限）
router.get('/:id', authMiddleware, checkPermission('user:view'), userController.getUserById)

// 创建用户（需要认证和权限）
router.post('/', authMiddleware, checkPermission('user:create'), userController.createUser)

// 更新用户信息（需要认证和权限）
router.put('/:id', authMiddleware, checkPermission('user:edit'), userController.updateUser)

// 更新用户状态（需要认证和权限）
router.put('/:id/status', authMiddleware, checkPermission('user:edit'), userController.updateUserStatus)

// 删除用户（需要认证和权限）
router.delete('/:id', authMiddleware, checkPermission('user:delete'), userController.deleteUser)

// 重置用户密码（需要认证和权限）
router.put('/:id/reset-password', authMiddleware, checkPermission('user:edit'), userController.resetPassword)

// 为用户分配角色（需要认证和权限）
router.put('/:id/roles', authMiddleware, checkPermission('user:assign_role'), userController.assignRoles)

module.exports = router
