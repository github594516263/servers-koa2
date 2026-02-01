/**
 * 文章控制器
 * 演示数据权限：普通用户只能操作自己的文章，管理员可以操作所有
 */

const Article = require('../models/Article')
const User = require('../models/User')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

/**
 * 获取文章列表
 * 数据权限示例：
 * - 普通用户：只能看到自己的文章
 * - 管理员/超管：可以看到所有文章
 */
exports.getArticles = async (ctx) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, category, authorId } = ctx.query
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    // 构建查询条件
    const where = {}

    // 🔐 数据权限控制：非管理员只能看自己的文章
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    if (!isAdmin) {
      where.authorId = currentUser.id
    } else if (authorId) {
      // 管理员可以按作者筛选
      where.authorId = authorId
    }

    // 关键词搜索
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ]
    }

    // 状态筛选
    if (status) {
      where.status = status
    }

    // 分类筛选
    if (category) {
      where.category = category
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset
    })

    success(ctx, {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / parseInt(pageSize))
    })
  } catch (err) {
    console.error('获取文章列表失败:', err)
    error(ctx, '获取文章列表失败', 500)
  }
}

/**
 * 获取文章详情
 */
exports.getArticle = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const article = await Article.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    })

    if (!article) {
      return error(ctx, '文章不存在', 404)
    }

    // 🔐 数据权限检查
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    if (!isAdmin && article.authorId !== currentUser.id) {
      return error(ctx, '无权查看此文章', 403)
    }

    // 增加浏览次数
    await article.increment('viewCount')

    success(ctx, article)
  } catch (err) {
    console.error('获取文章详情失败:', err)
    error(ctx, '获取文章详情失败', 500)
  }
}

/**
 * 创建文章
 */
exports.createArticle = async (ctx) => {
  try {
    const { title, content, summary, cover, category, tags, status } = ctx.request.body
    const currentUser = ctx.state.user

    if (!title || !content) {
      return error(ctx, '标题和内容不能为空', 400)
    }

    const article = await Article.create({
      title,
      content,
      summary: summary || content.substring(0, 200),
      cover,
      category,
      tags,
      status: status || 'draft',
      authorId: currentUser.id,
      publishedAt: status === 'published' ? new Date() : null
    })

    success(ctx, article, '创建文章成功')
  } catch (err) {
    console.error('创建文章失败:', err)
    error(ctx, '创建文章失败', 500)
  }
}

/**
 * 更新文章
 */
exports.updateArticle = async (ctx) => {
  try {
    const { id } = ctx.params
    const { title, content, summary, cover, category, tags, status } = ctx.request.body
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const article = await Article.findByPk(id)
    if (!article) {
      return error(ctx, '文章不存在', 404)
    }

    // 🔐 数据权限检查：只有作者或管理员可以编辑
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    if (!isAdmin && article.authorId !== currentUser.id) {
      return error(ctx, '无权编辑此文章', 403)
    }

    // 更新字段
    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (summary !== undefined) updateData.summary = summary
    if (cover !== undefined) updateData.cover = cover
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (status !== undefined) {
      updateData.status = status
      // 首次发布时设置发布时间
      if (status === 'published' && !article.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    await article.update(updateData)

    success(ctx, article, '更新文章成功')
  } catch (err) {
    console.error('更新文章失败:', err)
    error(ctx, '更新文章失败', 500)
  }
}

/**
 * 删除文章
 */
exports.deleteArticle = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const article = await Article.findByPk(id)
    if (!article) {
      return error(ctx, '文章不存在', 404)
    }

    // 🔐 数据权限检查：只有作者或管理员可以删除
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    if (!isAdmin && article.authorId !== currentUser.id) {
      return error(ctx, '无权删除此文章', 403)
    }

    await article.destroy()

    success(ctx, null, '删除文章成功')
  } catch (err) {
    console.error('删除文章失败:', err)
    error(ctx, '删除文章失败', 500)
  }
}

/**
 * 批量删除文章
 */
exports.batchDeleteArticles = async (ctx) => {
  try {
    const { ids } = ctx.request.body
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(ctx, '请选择要删除的文章', 400)
    }

    // 🔐 数据权限检查
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    
    let where = { id: { [Op.in]: ids } }
    if (!isAdmin) {
      // 非管理员只能删除自己的文章
      where.authorId = currentUser.id
    }

    const deletedCount = await Article.destroy({ where })

    success(ctx, { deletedCount }, `成功删除 ${deletedCount} 篇文章`)
  } catch (err) {
    console.error('批量删除文章失败:', err)
    error(ctx, '批量删除文章失败', 500)
  }
}

/**
 * 发布/取消发布文章
 */
exports.togglePublish = async (ctx) => {
  try {
    const { id } = ctx.params
    const currentUser = ctx.state.user
    const userRoles = currentUser.roles || []

    const article = await Article.findByPk(id)
    if (!article) {
      return error(ctx, '文章不存在', 404)
    }

    // 🔐 数据权限检查
    const isAdmin = userRoles.some(r => ['super_admin', 'admin'].includes(r.code || r))
    if (!isAdmin && article.authorId !== currentUser.id) {
      return error(ctx, '无权操作此文章', 403)
    }

    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await article.update({
      status: newStatus,
      publishedAt: newStatus === 'published' ? new Date() : article.publishedAt
    })

    success(ctx, article, newStatus === 'published' ? '发布成功' : '已取消发布')
  } catch (err) {
    console.error('切换发布状态失败:', err)
    error(ctx, '操作失败', 500)
  }
}

/**
 * 获取文章分类列表
 */
exports.getCategories = async (ctx) => {
  try {
    const categories = await Article.findAll({
      attributes: ['category'],
      group: ['category'],
      where: {
        category: { [Op.ne]: null }
      }
    })

    success(ctx, categories.map(c => c.category))
  } catch (err) {
    console.error('获取分类失败:', err)
    error(ctx, '获取分类失败', 500)
  }
}

