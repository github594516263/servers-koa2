const sequelize = require('../config/database')

/**
 * 清理数据库 - 删除所有表（包括旧表）
 * 用于从旧架构迁移到新架构时清理旧表
 */
async function cleanDatabase() {
  try {
    console.log('🔄 开始清理数据库...')
    
    // 禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;')
    console.log('✅ 已禁用外键检查')
    
    // 获取所有表
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `)
    
    console.log(`📋 找到 ${tables.length} 个表:`)
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`)
    })
    
    // 删除所有表
    for (const table of tables) {
      const tableName = table.TABLE_NAME
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\`;`)
      console.log(`   ✅ 已删除表: ${tableName}`)
    }
    
    // 重新启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;')
    console.log('✅ 已重新启用外键检查')
    
    console.log('\n🎉 数据库清理完成!')
    console.log('💡 现在可以运行 npm run init:db 来初始化数据库')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库清理失败:', error)
    
    // 确保重新启用外键检查
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;')
    } catch (e) {
      // 忽略错误
    }
    
    process.exit(1)
  }
}

// 运行清理
cleanDatabase()

