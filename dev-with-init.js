/**
 * 开发环境启动脚本（包含自动初始化）
 * 如果 .env 文件不存在，使用默认配置
 */

// 检查 .env 文件是否存在
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found, using default configuration')
  console.log('💡 Tip: Run create-env.bat to create .env file')
  console.log('')
  
  // 设置默认环境变量
  process.env.PORT = '3000'
  process.env.NODE_ENV = 'development'
  process.env.DB_HOST = 'localhost'
  process.env.DB_PORT = '3306'
  process.env.DB_NAME = 'mynode'
  process.env.DB_USER = 'root'
  process.env.DB_PASSWORD = '594516263'
  process.env.JWT_SECRET = 'koa2-backend-jwt-secret-key-change-in-production-32chars-minimum'
  process.env.JWT_EXPIRES_IN = '7d'
  process.env.CORS_ORIGIN = 'http://localhost:5173'
}

// 启动应用
require('./bin/www')

