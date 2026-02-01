const { Sequelize } = require('sequelize')
const config = require('./index')

const sequelize = new Sequelize(config.database)

// 测试连接
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection established successfully.')
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err)
  })

module.exports = sequelize

