const Role = require('../models/Role')
const Menu = require('../models/Menu')
const RoleMenu = require('../models/RoleMenu')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')
const sequelize = require('../config/database')

/**
 * 获取所有角色（不分页，用于下拉选择）
 */
async function getAllRoles(ctx) {
  try {
    const roles = await Role.findAll({
      where: { status: 1 }, // 只返回启用状态的角色
      order: [['sort', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'name', 'code', 'description']
    })
    
    ctx.body = success(roles)
  } catch (err) {
    console.error('获取所有角色失败:', err)
    ctx.status = 500
    ctx.body = error('获取所有角色失败', 500)
  }
}

/**
 * 获取角色列表
 */
async function getRoleList(ctx) {
  try {
    const { page = 1, pageSize = 10, keyword = '', status } = ctx.query

    // 构建查询条件
    const where = {}

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ]
    }

    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }

    // 分页查询
    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const limit = parseInt(pageSize)

    const { count, rows } = await Role.findAndCountAll({
      where,
      offset,
      limit,
      order: [['sort', 'ASC'], ['id', 'ASC']],
      attributes: { exclude: ['deletedAt'] }
    })

    // 为每个角色查询关联的菜单
    const rolesWithMenus = await Promise.all(
      rows.map(async (role) => {
        const roleMenus = await RoleMenu.findAll({
          where: { roleId: role.id },
          attributes: ['menuId']
        })

        const menuIds = roleMenus.map(rm => rm.menuId)

        // 查询菜单详情
        const menus = await Menu.findAll({
          where: { id: menuIds },
          attributes: ['id', 'name', 'title', 'type', 'permission_code', 'status']
        })

        return {
          ...role.toJSON(),
          menus
        }
      })
    )

    ctx.body = success({
      list: rolesWithMenus,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    })
  } catch (err) {
    console.error('获取角色列表失败:', err)
    ctx.status = 500
    ctx.body = error('获取角色列表失败', 500)
  }
}

/**
 * 获取角色详情
 */
async function getRoleDetail(ctx) {
  try {
    const { id } = ctx.params
    
    const role = await Role.findByPk(id, {
      attributes: { exclude: ['deletedAt'] }
    })
    
    if (!role) {
      ctx.status = 404
      ctx.body = error('角色不存在', 404)
      return
    }
    
    // 获取角色的菜单ID列表
    const roleMenus = await RoleMenu.findAll({
      where: { roleId: id },
      attributes: ['menuId']
    })
    
    const menuIds = roleMenus.map(rm => rm.menuId)
    
    ctx.body = success({
      ...role.toJSON(),
      menuIds
    })
  } catch (err) {
    console.error('获取角色详情失败:', err)
    ctx.status = 500
    ctx.body = error('获取角色详情失败', 500)
  }
}

/**
 * 创建角色
 */
async function createRole(ctx) {
  try {
    const { name, code, description, status = 1, sort = 0 } = ctx.request.body
    
    // 参数验证
    if (!name || !code) {
      ctx.status = 400
      ctx.body = error('角色名称和编码不能为空', 400)
      return
    }
    
    // 检查编码是否已存在
    const existingRole = await Role.findOne({ where: { code } })
    if (existingRole) {
      ctx.status = 400
      ctx.body = error('角色编码已存在', 400)
      return
    }
    
    // 创建角色
    const role = await Role.create({
      name,
      code,
      description,
      status: parseInt(status),
      sort: parseInt(sort)
    })
    
    ctx.body = success(role, '创建角色成功')
  } catch (err) {
    console.error('创建角色失败:', err)
    ctx.status = 500
    ctx.body = error('创建角色失败', 500)
  }
}

/**
 * 更新角色
 */
async function updateRole(ctx) {
  try {
    const { id } = ctx.params
    const { name, code, description, status, sort } = ctx.request.body
    
    // 查找角色
    const role = await Role.findByPk(id)
    if (!role) {
      ctx.status = 404
      ctx.body = error('角色不存在', 404)
      return
    }
    
    // 如果修改了编码，检查新编码是否已存在
    if (code && code !== role.code) {
      const existingRole = await Role.findOne({ where: { code } })
      if (existingRole) {
        ctx.status = 400
        ctx.body = error('角色编码已存在', 400)
        return
      }
    }
    
    // 更新角色
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = parseInt(status)
    if (sort !== undefined) updateData.sort = parseInt(sort)
    
    await role.update(updateData)
    
    ctx.body = success(role, '更新角色成功')
  } catch (err) {
    console.error('更新角色失败:', err)
    ctx.status = 500
    ctx.body = error('更新角色失败', 500)
  }
}

/**
 * 删除角色
 */
async function deleteRole(ctx) {
  try {
    const { id } = ctx.params
    
    // 查找角色
    const role = await Role.findByPk(id)
    if (!role) {
      ctx.status = 404
      ctx.body = error('角色不存在', 404)
      return
    }
    
    // 检查是否为系统预设角色（admin 和 user 不能删除）
    if (role.code === 'admin' || role.code === 'user') {
      ctx.status = 400
      ctx.body = error('系统预设角色不能删除', 400)
      return
    }
    
    // 软删除角色
    await role.destroy()
    
    // 删除角色菜单关联
    await RoleMenu.destroy({
      where: { roleId: id }
    })
    
    ctx.body = success(null, '删除角色成功')
  } catch (err) {
    console.error('删除角色失败:', err)
    ctx.status = 500
    ctx.body = error('删除角色失败', 500)
  }
}

/**
 * 为角色分配菜单（方案一：角色直接关联菜单）
 */
async function assignMenus(ctx) {
  // 开启事务
  const transaction = await sequelize.transaction()
  
  try {
    const { id } = ctx.params
    let { menuIds } = ctx.request.body
    
    // 必须显式传递 menuIds 参数（区分"不传"和"传空数组"）
    if (menuIds === undefined) {
      ctx.status = 400
      ctx.body = error('必须提供 menuIds 参数', 400)
      await transaction.rollback()
      return
    }
    
    // 参数类型验证
    if (!Array.isArray(menuIds)) {
      ctx.status = 400
      ctx.body = error('菜单ID必须是数组', 400)
      await transaction.rollback()
      return
    }
    
    // 过滤并去重菜单ID（移除无效值和重复值）
    menuIds = [...new Set(
      menuIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0)
    )]
    
    // 查找角色
    const role = await Role.findByPk(id, { transaction })
    if (!role) {
      ctx.status = 404
      ctx.body = error('角色不存在', 404)
      await transaction.rollback()
      return
    }
    
    // 验证菜单ID是否有效
    if (menuIds.length > 0) {
      const validMenus = await Menu.findAll({
        where: { id: menuIds },
        attributes: ['id'],
        transaction
      })
      
      if (validMenus.length !== menuIds.length) {
        ctx.status = 400
        ctx.body = error('部分菜单ID无效', 400)
        await transaction.rollback()
        return
      }
    }
    
    // 删除旧的菜单关联（在事务中）
    await RoleMenu.destroy({
      where: { roleId: id },
      transaction
    })
    
    // 创建新的菜单关联（在事务中）
    if (menuIds.length > 0) {
      const roleMenus = menuIds.map(menuId => ({
        roleId: parseInt(id),
        menuId: menuId
      }))
      
      await RoleMenu.bulkCreate(roleMenus, { transaction })
    }
    
    // 提交事务
    await transaction.commit()
    
    ctx.body = success(null, '分配菜单成功')
  } catch (err) {
    // 回滚事务
    await transaction.rollback()
    console.error('分配菜单失败:', err)
    ctx.status = 500
    ctx.body = error('分配菜单失败', 500)
  }
}

// 保留旧的方法名作为别名，便于过渡
const assignPermissions = assignMenus

module.exports = {
  getAllRoles,
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignMenus,        // 新方法名
  assignPermissions,  // 保留旧方法名作为别名，便于过渡
}

