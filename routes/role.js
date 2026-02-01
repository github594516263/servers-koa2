const router = require('koa-router')()
const roleController = require('../controllers/roleController')
const authMiddleware = require('../middleware/auth')
const { checkAdmin } = require('../middleware/permission')

router.prefix('/roles')

// 获取所有角色（不分页，用于下拉选择）
router.get('/all', authMiddleware, roleController.getAllRoles)

// 获取角色列表
router.get('/', authMiddleware, checkAdmin(), roleController.getRoleList)

// 获取角色详情
router.get('/:id', authMiddleware, checkAdmin(), roleController.getRoleDetail)

// 创建角色
router.post('/', authMiddleware, checkAdmin(), roleController.createRole)

// 更新角色
router.put('/:id', authMiddleware, checkAdmin(), roleController.updateRole)

// 删除角色
router.delete('/:id', authMiddleware, checkAdmin(), roleController.deleteRole)

// 为角色分配权限
router.post('/:id/permissions', authMiddleware, checkAdmin(), roleController.assignPermissions)

module.exports = router

