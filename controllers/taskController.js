/**
 * 任务控制器
 * 演示操作权限和状态流转权限
 */

const Task = require('../models/Task')
const User = require('../models/User')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

/**
 * 获取任务列表
 * 权限示例：
 * - 普通用户：只能看到自己创建的或分配给自己的任务
 * - 管理员：可以看到所有任务
 */
exports.getTasks = async (ctx) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, priority, assigneeId, creatorId, scope } = ctx.query
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    // 构建查询条件
    const where = {}
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))

    // 🔐 数据权限控制
    if (!isAdmin) {
      // 普通用户根据 scope 参数决定查看范围
      if (scope === 'created') {
        // 我创建的
        where.creatorId = currentUser.id
      } else if (scope === 'assigned') {
        // 分配给我的
        where.assigneeId = currentUser.id
      } else {
        // 默认：我创建的 + 分配给我的
        where[Op.or] = [
          { creatorId: currentUser.id },
          { assigneeId: currentUser.id }
        ]
      }
    } else {
      // 管理员可以按创建者/执行者筛选
      if (creatorId) where.creatorId = creatorId
      if (assigneeId) where.assigneeId = assigneeId
    }

    // 关键词搜索
    if (keyword) {
      where[Op.and] = where[Op.and] || []
      where[Op.and].push({
        [Op.or]: [
          { title: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ]
      })
    }

    // 状态筛选
    if (status) {
      where.status = status
    }

    // 优先级筛选
    if (priority) {
      where.priority = priority
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(pageSize),
      offset
    })

    ctx.body = success({
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / parseInt(pageSize))
    })
  } catch (err) {
    console.error('获取任务列表失败:', err)
    ctx.status = 500
    ctx.body = error('获取任务列表失败', 500)
  }
}

/**
 * 获取任务详情
 */
exports.getTask = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    })

    if (!task) {
      ctx.status = 404
      ctx.body = error('任务不存在', 404)
      return
    }

    // 🔐 数据权限检查
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    const isCreator = task.creatorId === currentUser.id
    const isAssignee = task.assigneeId === currentUser.id

    if (!isAdmin && !isCreator && !isAssignee) {
      ctx.status = 403
      ctx.body = error('无权查看此任务', 403)
      return
    }

    ctx.body = success(task)
  } catch (err) {
    console.error('获取任务详情失败:', err)
    ctx.status = 500
    ctx.body = error('获取任务详情失败', 500)
  }
}

/**
 * 创建任务
 */
exports.createTask = async (ctx) => {
  try {
    const { title, description, priority, assigneeId, dueDate, remark } = ctx.request.body
    const currentUser = ctx.state.user

    if (!title) {
      ctx.status = 400
      ctx.body = error('任务标题不能为空', 400)
      return
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'medium',
      status: 'pending',
      creatorId: currentUser.id,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      remark
    })

    // 重新查询以获取关联数据
    const result = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    })

    ctx.body = success(result, '创建任务成功')
  } catch (err) {
    console.error('创建任务失败:', err)
    ctx.status = 500
    ctx.body = error('创建任务失败', 500)
  }
}

/**
 * 更新任务
 * 🔐 权限控制：
 * - 创建者：可以编辑任务信息
 * - 执行者：只能更新状态
 * - 管理员：可以编辑所有
 */
exports.updateTask = async (ctx) => {
  try {
    const { id } = ctx.params
    const { title, description, priority, assigneeId, dueDate, remark, status } = ctx.request.body
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const task = await Task.findByPk(id)
    if (!task) {
      ctx.status = 404
      ctx.body = error('任务不存在', 404)
      return
    }

    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    const isCreator = task.creatorId === currentUser.id
    const isAssignee = task.assigneeId === currentUser.id

    // 🔐 权限检查
    if (!isAdmin && !isCreator && !isAssignee) {
      ctx.status = 403
      ctx.body = error('无权编辑此任务', 403)
      return
    }

    // 构建更新数据
    const updateData = {}

    // 执行者只能更新状态和备注
    if (isAssignee && !isCreator && !isAdmin) {
      if (status !== undefined) updateData.status = status
      if (remark !== undefined) updateData.remark = remark
    } else {
      // 创建者和管理员可以更新所有字段
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (priority !== undefined) updateData.priority = priority
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId
      if (dueDate !== undefined) updateData.dueDate = dueDate
      if (remark !== undefined) updateData.remark = remark
      if (status !== undefined) updateData.status = status
    }

    // 完成任务时记录完成时间
    if (status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date()
    }

    await task.update(updateData)

    // 重新查询以获取关联数据
    const result = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    })

    ctx.body = success(result, '更新任务成功')
  } catch (err) {
    console.error('更新任务失败:', err)
    ctx.status = 500
    ctx.body = error('更新任务失败', 500)
  }
}

/**
 * 删除任务
 * 🔐 只有创建者或管理员可以删除
 */
exports.deleteTask = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const task = await Task.findByPk(id)
    if (!task) {
      ctx.status = 404
      ctx.body = error('任务不存在', 404)
      return
    }

    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    const isCreator = task.creatorId === currentUser.id

    // 🔐 权限检查：只有创建者或管理员可以删除
    if (!isAdmin && !isCreator) {
      ctx.status = 403
      ctx.body = error('无权删除此任务', 403)
      return
    }

    await task.destroy()

    ctx.body = success(null, '删除任务成功')
  } catch (err) {
    console.error('删除任务失败:', err)
    ctx.status = 500
    ctx.body = error('删除任务失败', 500)
  }
}

/**
 * 分配任务
 * 🔐 只有管理员可以分配任务
 */
exports.assignTask = async (ctx) => {
  try {
    const { id } = ctx.params
    const { assigneeId } = ctx.request.body
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const task = await Task.findByPk(id)
    if (!task) {
      ctx.status = 404
      ctx.body = error('任务不存在', 404)
      return
    }

    // 🔐 权限检查：只有管理员或创建者可以分配任务
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    const isCreator = task.creatorId === currentUser.id

    if (!isAdmin && !isCreator) {
      ctx.status = 403
      ctx.body = error('无权分配此任务', 403)
      return
    }

    // 验证被分配人是否存在
    if (assigneeId) {
      const assignee = await User.findByPk(assigneeId)
      if (!assignee) {
        ctx.status = 400
        ctx.body = error('被分配人不存在', 400)
        return
      }
    }

    await task.update({ assigneeId })

    // 重新查询以获取关联数据
    const result = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nickname', 'avatar']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }
      ]
    })

    ctx.body = success(result, '分配任务成功')
  } catch (err) {
    console.error('分配任务失败:', err)
    ctx.status = 500
    ctx.body = error('分配任务失败', 500)
  }
}

/**
 * 更新任务状态
 * 🔐 创建者和执行者都可以更新状态
 */
exports.updateTaskStatus = async (ctx) => {
  try {
    const { id } = ctx.params
    const { status } = ctx.request.body
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    if (!status) {
      ctx.status = 400
      ctx.body = error('状态不能为空', 400)
      return
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      ctx.status = 400
      ctx.body = error('无效的状态值', 400)
      return
    }

    const task = await Task.findByPk(id)
    if (!task) {
      ctx.status = 404
      ctx.body = error('任务不存在', 404)
      return
    }

    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    const isCreator = task.creatorId === currentUser.id
    const isAssignee = task.assigneeId === currentUser.id

    // 🔐 权限检查
    if (!isAdmin && !isCreator && !isAssignee) {
      ctx.status = 403
      ctx.body = error('无权更新此任务状态', 403)
      return
    }

    const updateData = { status }
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    await task.update(updateData)

    ctx.body = success(task, '状态更新成功')
  } catch (err) {
    console.error('更新任务状态失败:', err)
    ctx.status = 500
    ctx.body = error('更新任务状态失败', 500)
  }
}

/**
 * 获取任务统计
 */
exports.getTaskStats = async (ctx) => {
  try {
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))

    // 构建基础查询条件
    const baseWhere = isAdmin ? {} : {
      [Op.or]: [
        { creatorId: currentUser.id },
        { assigneeId: currentUser.id }
      ]
    }

    // 统计各状态数量
    const [pending, inProgress, completed, cancelled] = await Promise.all([
      Task.count({ where: { ...baseWhere, status: 'pending' } }),
      Task.count({ where: { ...baseWhere, status: 'in_progress' } }),
      Task.count({ where: { ...baseWhere, status: 'completed' } }),
      Task.count({ where: { ...baseWhere, status: 'cancelled' } })
    ])

    // 统计优先级分布
    const [low, medium, high, urgent] = await Promise.all([
      Task.count({ where: { ...baseWhere, priority: 'low' } }),
      Task.count({ where: { ...baseWhere, priority: 'medium' } }),
      Task.count({ where: { ...baseWhere, priority: 'high' } }),
      Task.count({ where: { ...baseWhere, priority: 'urgent' } })
    ])

    ctx.body = success({
      byStatus: { pending, inProgress, completed, cancelled },
      byPriority: { low, medium, high, urgent },
      total: pending + inProgress + completed + cancelled
    })
  } catch (err) {
    console.error('获取任务统计失败:', err)
    ctx.status = 500
    ctx.body = error('获取任务统计失败', 500)
  }
}

