const Router = require('koa-router')
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')

const router = new Router({
  prefix: '/auth',
})

// 注册（不需要认证）
router.post('/register', authController.register)

// 登录（不需要认证）
router.post('/login', authController.login)

// 登出（需要认证）
router.post('/logout', authMiddleware, authController.logout)

// 获取用户信息（需要认证）
router.get('/userinfo', authMiddleware, authController.getUserInfo)

// 刷新 Token（需要认证）
router.post('/refresh', authMiddleware, authController.refreshToken)

// 修改密码（需要认证）
router.post('/change-password', authMiddleware, authController.changePassword)

module.exports = router

