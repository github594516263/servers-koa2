/**
 * 文章管理路由
 * 演示权限控制
 */

const Router = require('koa-router')
const router = new Router({ prefix: '/articles' })
const articleController = require('../controllers/articleController')
const authMiddleware = require('../middleware/auth')
const { checkPermission } = require('../middleware/permission')

// 所有路由都需要登录
router.use(authMiddleware)

// 获取文章分类列表（所有登录用户）
router.get('/categories', articleController.getCategories)

// 获取文章列表 - 需要 article:view 权限
router.get('/', checkPermission('article:view'), articleController.getArticles)

// 获取文章详情 - 需要 article:view 权限
router.get('/:id', checkPermission('article:view'), articleController.getArticle)

// 创建文章 - 需要 article:create 权限
router.post('/', checkPermission('article:create'), articleController.createArticle)

// 更新文章 - 需要 article:edit 权限
router.put('/:id', checkPermission('article:edit'), articleController.updateArticle)

// 删除文章 - 需要 article:delete 权限
router.delete('/:id', checkPermission('article:delete'), articleController.deleteArticle)

// 批量删除文章 - 需要 article:delete 权限
router.post('/batch-delete', checkPermission('article:delete'), articleController.batchDeleteArticles)

// 发布/取消发布文章 - 需要 article:publish 权限
router.put('/:id/toggle-publish', checkPermission('article:publish'), articleController.togglePublish)

module.exports = router

