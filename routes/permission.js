const router = require('koa-router')()
const permissionController = require('../controllers/permissionController')
const authMiddleware = require('../middleware/auth')
const { checkPermission } = require('../middleware/permission')

router.prefix('/permissions')

// 获取权限列表（分页）
router.get('/', authMiddleware, checkPermission('permission:view'), permissionController.getPermissionList)

// 获取所有权限（不分页，用于角色分配权限）
router.get('/all', authMiddleware, checkPermission('permission:view'), permissionController.getAllPermissions)

// 获取权限分类列表
router.get('/categories', authMiddleware, checkPermission('permission:view'), permissionController.getPermissionCategories)

// 获取权限详情
router.get('/:id', authMiddleware, checkPermission('permission:view'), permissionController.getPermissionDetail)

// 创建权限
router.post('/', authMiddleware, checkPermission('permission:create'), permissionController.createPermission)

// 更新权限
router.put('/:id', authMiddleware, checkPermission('permission:edit'), permissionController.updatePermission)

// 删除权限
router.delete('/:id', authMiddleware, checkPermission('permission:delete'), permissionController.deletePermission)

// 批量删除权限
router.post('/batch-delete', authMiddleware, checkPermission('permission:delete'), permissionController.batchDeletePermissions)

module.exports = router
