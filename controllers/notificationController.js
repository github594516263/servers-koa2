/**
 * 通知控制器
 * 站内信的增删改查、已读标记等
 */

const Notification = require('../models/Notification')
const User = require('../models/User')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

/**
 * 获取当前用户的通知列表（分页 + 筛选）
 */
exports.getNotifications = async (ctx) => {
  try {
    const { page = 1, pageSize = 10, type, isRead } = ctx.query
    const currentUser = ctx.state.user

    const where = { userId: currentUser.id }

    if (type) {
      where.type = type
    }

    if (isRead !== undefined && isRead !== '') {
      where.isRead = parseInt(isRead)
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'nickname', 'avatar'],
        required: false,
      }],
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
    console.error('获取通知列表失败:', err)
    ctx.status = 500
    ctx.body = error('获取通知列表失败', 500)
  }
}

/**
 * 获取未读通知数量
 */
exports.getUnreadCount = async (ctx) => {
  try {
    const currentUser = ctx.state.user

    const count = await Notification.count({
      where: {
        userId: currentUser.id,
        isRead: 0,
      },
    })

    ctx.body = success({ count })
  } catch (err) {
    console.error('获取未读数量失败:', err)
    ctx.status = 500
    ctx.body = error('获取未读数量失败', 500)
  }
}

/**
 * 标记单条通知为已读
 */
exports.markAsRead = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user

    const notification = await Notification.findOne({
      where: { id, userId: currentUser.id },
    })

    if (!notification) {
      ctx.status = 404
      ctx.body = error('通知不存在', 404)
      return
    }

    if (notification.isRead === 0) {
      await notification.update({
        isRead: 1,
        readAt: new Date(),
      })
    }

    ctx.body = success(notification, '已标记为已读')
  } catch (err) {
    console.error('标记已读失败:', err)
    ctx.status = 500
    ctx.body = error('标记已读失败', 500)
  }
}

/**
 * 全部标记为已读
 */
exports.markAllAsRead = async (ctx) => {
  try {
    const currentUser = ctx.state.user

    const [updatedCount] = await Notification.update(
      { isRead: 1, readAt: new Date() },
      { where: { userId: currentUser.id, isRead: 0 } }
    )

    ctx.body = success({ updatedCount }, `已将 ${updatedCount} 条通知标记为已读`)
  } catch (err) {
    console.error('全部标记已读失败:', err)
    ctx.status = 500
    ctx.body = error('全部标记已读失败', 500)
  }
}

/**
 * 删除单条通知
 */
exports.deleteNotification = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user

    const notification = await Notification.findOne({
      where: { id, userId: currentUser.id },
    })

    if (!notification) {
      ctx.status = 404
      ctx.body = error('通知不存在', 404)
      return
    }

    await notification.destroy()

    ctx.body = success(null, '删除成功')
  } catch (err) {
    console.error('删除通知失败:', err)
    ctx.status = 500
    ctx.body = error('删除通知失败', 500)
  }
}

/**
 * 批量删除通知
 */
exports.batchDeleteNotifications = async (ctx) => {
  try {
    const { ids } = ctx.request.body
    const currentUser = ctx.state.user

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.status = 400
      ctx.body = error('请选择要删除的通知', 400)
      return
    }

    const deletedCount = await Notification.destroy({
      where: {
        id: { [Op.in]: ids },
        userId: currentUser.id,
      },
    })

    ctx.body = success({ deletedCount }, `成功删除 ${deletedCount} 条通知`)
  } catch (err) {
    console.error('批量删除通知失败:', err)
    ctx.status = 500
    ctx.body = error('批量删除通知失败', 500)
  }
}

/**
 * 发送通知（管理员接口）
 * 可向指定用户或全体用户发送系统通知
 */
exports.sendNotification = async (ctx) => {
  try {
    const { title, content, type = 'system', userIds } = ctx.request.body
    const currentUser = ctx.state.user

    if (!title) {
      ctx.status = 400
      ctx.body = error('通知标题不能为空', 400)
      return
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      ctx.status = 400
      ctx.body = error('请选择接收用户', 400)
      return
    }

    // 批量创建通知
    const notifications = userIds.map((userId) => ({
      userId,
      title,
      content,
      type,
      senderId: currentUser.id,
    }))

    await Notification.bulkCreate(notifications)

    ctx.body = success(null, `已向 ${userIds.length} 位用户发送通知`)
  } catch (err) {
    console.error('发送通知失败:', err)
    ctx.status = 500
    ctx.body = error('发送通知失败', 500)
  }
}
