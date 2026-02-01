const Permission = require('../models/Permission')
const RolePermission = require('../models/RolePermission')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

/**
 * 获取权限列表（支持分页和搜索）
 */
async function getPermissionList(ctx) {
  try {
    const { page = 1, pageSize = 10, keyword = '', category, status } = ctx.query
    
    // 构建查询条件
    const where = {}
    
    if (keyword) {
      where[Op.or] = [
        { code: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }
    
    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)
    
    const { count, rows } = await Permission.findAndCountAll({
      where,
      offset,
      limit,
      order: [['category', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: ['deletedAt'] }
    })
    
    ctx.body = success({
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    })
  } catch (err) {
    console.error('获取权限列表失败:', err)
    ctx.status = 500
    ctx.body = error('获取权限列表失败', 500)
  }
}

/**
 * 获取所有权限（不分页，用于角色分配权限）
 */
async function getAllPermissions(ctx) {
  try {
    const { status, category } = ctx.query
    
    // 构建查询条件
    const where = {}
    
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    } else {
      where.status = 1 // 默认只返回启用的权限
    }
    
    if (category) {
      where.category = category
    }
    
    const permissions = await Permission.findAll({
      where,
      order: [['category', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: ['deletedAt'] }
    })
    
    // 按分类分组
    const groupedPermissions = {}
    permissions.forEach(p => {
      const cat = p.category || 'other'
      if (!groupedPermissions[cat]) {
        groupedPermissions[cat] = []
      }
      groupedPermissions[cat].push(p)
    })
    
    ctx.body = success({
      list: permissions,
      grouped: groupedPermissions
    })
  } catch (err) {
    console.error('获取所有权限失败:', err)
    ctx.status = 500
    ctx.body = error('获取所有权限失败', 500)
  }
}

/**
 * 获取权限分类列表
 */
async function getPermissionCategories(ctx) {
  try {
    const permissions = await Permission.findAll({
      where: { status: 1 },
      attributes: ['category'],
      group: ['category']
    })
    
    const categories = permissions.map(p => p.category).filter(Boolean)
    
    ctx.body = success(categories)
  } catch (err) {
    console.error('获取权限分类失败:', err)
    ctx.status = 500
    ctx.body = error('获取权限分类失败', 500)
  }
}

/**
 * 获取权限详情
 */
async function getPermissionDetail(ctx) {
  try {
    const { id } = ctx.params
    
    const permission = await Permission.findByPk(id, {
      attributes: { exclude: ['deletedAt'] }
    })
    
    if (!permission) {
      ctx.status = 404
      ctx.body = error('权限不存在', 404)
      return
    }
    
    ctx.body = success(permission)
  } catch (err) {
    console.error('获取权限详情失败:', err)
    ctx.status = 500
    ctx.body = error('获取权限详情失败', 500)
  }
}

/**
 * 创建权限
 */
async function createPermission(ctx) {
  try {
    const { code, name, description, category, status = 1 } = ctx.request.body
    
    // 参数验证
    if (!code || !name) {
      ctx.status = 400
      ctx.body = error('权限编码和名称不能为空', 400)
      return
    }
    
    // 检查编码是否已存在
    const existingPermission = await Permission.findOne({ where: { code } })
    if (existingPermission) {
      ctx.status = 400
      ctx.body = error('权限编码已存在', 400)
      return
    }
    
    // 创建权限
    const permission = await Permission.create({
      code,
      name,
      description,
      category,
      status: parseInt(status)
    })
    
    ctx.body = success(permission, '创建权限成功')
  } catch (err) {
    console.error('创建权限失败:', err)
    ctx.status = 500
    ctx.body = error('创建权限失败', 500)
  }
}

/**
 * 更新权限
 */
async function updatePermission(ctx) {
  try {
    const { id } = ctx.params
    const { code, name, description, category, status } = ctx.request.body
    
    // 查找权限
    const permission = await Permission.findByPk(id)
    if (!permission) {
      ctx.status = 404
      ctx.body = error('权限不存在', 404)
      return
    }
    
    // 如果修改了编码，检查新编码是否已存在
    if (code && code !== permission.code) {
      const existingPermission = await Permission.findOne({ where: { code } })
      if (existingPermission) {
        ctx.status = 400
        ctx.body = error('权限编码已存在', 400)
        return
      }
    }
    
    // 更新权限
    const updateData = {}
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = parseInt(status)
    
    await permission.update(updateData)
    
    ctx.body = success(permission, '更新权限成功')
  } catch (err) {
    console.error('更新权限失败:', err)
    ctx.status = 500
    ctx.body = error('更新权限失败', 500)
  }
}

/**
 * 删除权限
 */
async function deletePermission(ctx) {
  try {
    const { id } = ctx.params
    
    // 查找权限
    const permission = await Permission.findByPk(id)
    if (!permission) {
      ctx.status = 404
      ctx.body = error('权限不存在', 404)
      return
    }
    
    // 检查是否有角色正在使用该权限
    const rolePermissions = await RolePermission.findAll({
      where: { permissionId: id }
    })
    
    if (rolePermissions.length > 0) {
      ctx.status = 400
      ctx.body = error('该权限正在被角色使用，不能删除', 400)
      return
    }
    
    // 软删除权限
    await permission.destroy()
    
    ctx.body = success(null, '删除权限成功')
  } catch (err) {
    console.error('删除权限失败:', err)
    ctx.status = 500
    ctx.body = error('删除权限失败', 500)
  }
}

/**
 * 批量删除权限
 */
async function batchDeletePermissions(ctx) {
  try {
    const { ids } = ctx.request.body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.status = 400
      ctx.body = error('请选择要删除的权限', 400)
      return
    }
    
    // 检查是否有角色正在使用这些权限
    const rolePermissions = await RolePermission.findAll({
      where: { permissionId: ids }
    })
    
    if (rolePermissions.length > 0) {
      ctx.status = 400
      ctx.body = error('部分权限正在被角色使用，不能删除', 400)
      return
    }
    
    // 批量软删除
    await Permission.destroy({
      where: { id: ids }
    })
    
    ctx.body = success(null, '批量删除权限成功')
  } catch (err) {
    console.error('批量删除权限失败:', err)
    ctx.status = 500
    ctx.body = error('批量删除权限失败', 500)
  }
}

module.exports = {
  getPermissionList,
  getAllPermissions,
  getPermissionCategories,
  getPermissionDetail,
  createPermission,
  updatePermission,
  deletePermission,
  batchDeletePermissions,
}
