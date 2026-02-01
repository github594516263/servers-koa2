const router = require('koa-router')()
const menuController = require('../controllers/menuController')
const authMiddleware = require('../middleware/auth')
const { checkAdmin } = require('../middleware/permission')

router.prefix('/menus')

// 获取用户菜单树（需要登录）
router.get('/', authMiddleware, menuController.getUserMenuTree)

// 获取完整菜单树（管理员）
router.get('/tree', authMiddleware, checkAdmin(), menuController.getMenuTree)

// 获取菜单列表（管理员）
router.get('/list', authMiddleware, checkAdmin(), menuController.getMenuList)

// 获取菜单详情（管理员）
router.get('/:id', authMiddleware, checkAdmin(), menuController.getMenuDetail)

// 创建菜单（管理员）
router.post('/', authMiddleware, checkAdmin(), menuController.createMenu)

// 更新菜单（管理员）
router.put('/:id', authMiddleware, checkAdmin(), menuController.updateMenu)

// 删除菜单（管理员）
router.delete('/:id', authMiddleware, checkAdmin(), menuController.deleteMenu)

module.exports = router

