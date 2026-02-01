const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const cors = require('koa-cors')
const config = require('./config')
const errorMiddleware = require('./middleware/error')
const loggerMiddleware = require('./middleware/logger')
const router = require('./routes')
const { setupAssociations } = require('./models/associations')

const app = new Koa()

// 设置模型关联关系（必须在使用模型之前调用）
setupAssociations()

// 注意：数据库初始化请使用命令: npm run init
// 不再使用自动初始化，避免开发时意外重置数据

// 错误处理
app.use(errorMiddleware)

// 日志
app.use(loggerMiddleware)

// CORS 跨域
app.use(cors(config.cors))

// Body 解析
app.use(bodyParser({
  enableTypes: ['json', 'form', 'text'],
  jsonLimit: '10mb',
  textLimit: '10mb',
}))

// 路由
app.use(router.routes())
app.use(router.allowedMethods())

// 错误事件监听
app.on('error', (err, ctx) => {
  console.error('Server error:', err)
})

module.exports = app
