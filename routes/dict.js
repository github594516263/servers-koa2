/**
 * 数据字典路由
 */

const Router = require('koa-router')
const router = new Router({ prefix: '/dicts' })
const dictController = require('../controllers/dictController')
const authMiddleware = require('../middleware/auth')
const { checkAdmin } = require('../middleware/permission')

// 所有路由都需要登录
router.use(authMiddleware)

// ========== 公开查询接口（登录即可） ==========

// 根据字典编码获取字典项（前端下拉选项专用）
router.get('/code/:code', dictController.getDictItemsByCode)

// 批量获取字典项（按编码，逗号分隔）
router.get('/codes', dictController.getDictItemsByCodes)

// 获取所有字典类型（不分页）
router.get('/all', dictController.getAllDicts)

// ========== 管理接口（需要权限） ==========

// 获取字典类型列表（分页）
router.get('/', checkAdmin(), dictController.getDicts)

// 创建字典类型
router.post('/', checkAdmin(), dictController.createDict)

// 更新字典类型
router.put('/:id', checkAdmin(), dictController.updateDict)

// 删除字典类型
router.delete('/:id', checkAdmin(), dictController.deleteDict)

// 获取字典项列表
router.get('/:dictId/items', checkAdmin(), dictController.getDictItems)

// 创建字典项
router.post('/:dictId/items', checkAdmin(), dictController.createDictItem)

// 更新字典项
router.put('/items/:id', checkAdmin(), dictController.updateDictItem)

// 删除字典项
router.delete('/items/:id', checkAdmin(), dictController.deleteDictItem)

module.exports = router
