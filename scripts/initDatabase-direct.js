const { Sequelize, DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs')

// 直接指定数据库配置（临时解决方案）
const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  database: 'mynode',
  username: 'root',
  password: '594516263',
  dialect: 'mysql',
  timezone: '+08:00',
  logging: console.log,
})

// 定义 User 模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密）',
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '昵称',
  },
  avatar: {
    type: DataTypes.STRING(255),
    defaultValue: null,
    comment: '头像URL',
  },
  email: {
    type: DataTypes.STRING(100),
    defaultValue: null,
    comment: '邮箱',
  },
  phone: {
    type: DataTypes.STRING(20),
    defaultValue: null,
    comment: '手机号',
  },
  roles: {
    type: DataTypes.JSON,
    defaultValue: ['user'],
    comment: '角色列表',
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '权限列表',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1=正常，0=禁用',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    defaultValue: null,
    comment: '最后登录时间',
  },
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
})

/**
 * 加密密码
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * 初始化数据库
 */
async function initDatabase() {
  try {
    console.log('🔄 Starting database initialization...')
    
    // 测试连接
    await sequelize.authenticate()
    console.log('✅ Database connection established successfully.')
    
    // 同步数据库表（force: true 会删除已存在的表）
    await sequelize.sync({ force: true })
    console.log('✅ Database tables synced successfully')
    
    // 创建测试用户
    const adminPassword = await hashPassword('123456')
    const userPassword = await hashPassword('123456')
    
    const users = await User.bulkCreate([
      {
        username: 'admin',
        password: adminPassword,
        nickname: '管理员',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'admin@example.com',
        phone: '13800138000',
        roles: ['admin', 'user'],
        permissions: ['*:*:*'],
        status: 1,
      },
      {
        username: 'user',
        password: userPassword,
        nickname: '普通用户',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        email: 'user@example.com',
        phone: '13800138001',
        roles: ['user'],
        permissions: ['system:user:view', 'system:user:edit'],
        status: 1,
      },
    ])
    
    console.log('✅ Test users created successfully')
    console.log('\n📋 Test Accounts:')
    console.log('   Admin - username: admin, password: 123456')
    console.log('   User  - username: user, password: 123456')
    
    console.log('\n🎉 Database initialization completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

// 运行初始化
initDatabase()

