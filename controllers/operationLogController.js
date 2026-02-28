/**
 * 操作日志控制器
 * 仅提供查询功能，日志由审计中间件自动写入
 */

const OperationLog = require('../models/OperationLog')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

/**
 * 获取操作日志列表（分页 + 筛选）
 */
exports.getLogs = async (ctx) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      username,
      module: mod,
      action,
      result,
      startTime,
      endTime,
    } = ctx.query

    const where = {}

    if (username) {
      where.username = { [Op.like]: `%${username}%` }
    }

    if (mod) {
      where.module = mod
    }

    if (action) {
      where.action = action
    }

    if (result) {
      where.result = result
    }

    // 时间范围筛选
    if (startTime || endTime) {
      where.createdAt = {}
      if (startTime) where.createdAt[Op.gte] = new Date(startTime)
      if (endTime) where.createdAt[Op.lte] = new Date(endTime)
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const { count, rows } = await OperationLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset,
    })

    ctx.body = success({
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / parseInt(pageSize)),
    })
  } catch (err) {
    console.error('获取操作日志失败:', err)
    ctx.status = 500
    ctx.body = error('获取操作日志失败', 500)
  }
}

/**
 * 清空日志（仅超级管理员）
 */
exports.clearLogs = async (ctx) => {
  try {
    const { beforeDays } = ctx.query
    const where = {}

    if (beforeDays) {
      const date = new Date()
      date.setDate(date.getDate() - parseInt(beforeDays))
      where.createdAt = { [Op.lt]: date }
    }

    const count = await OperationLog.destroy({ where })

    ctx.body = success({ deleted: count }, `清除了 ${count} 条日志`)
  } catch (err) {
    console.error('清空日志失败:', err)
    ctx.status = 500
    ctx.body = error('清空日志失败', 500)
  }
}
