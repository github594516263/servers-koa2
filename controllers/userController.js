const User = require('../models/User')
const Role = require('../models/Role')
const UserRole = require('../models/UserRole')
const { Op } = require('sequelize')
const { hashPassword } = require('../utils/password')
const { success, error } = require('../utils/response')
const sequelize = require('../config/database')

class UserController {
  // 创建用户
  async createUser(ctx) {
    const transaction = await sequelize.transaction()
    
    try {
      const { username, password, nickname, email, phone, roleIds, status } = ctx.request.body

      // 参数验证
      if (!username || !password) {
        ctx.status = 400
        ctx.body = error('用户名和密码不能为空', 400)
        return
      }

      // 用户名长度验证
      if (username.length < 3 || username.length > 50) {
        ctx.status = 400
        ctx.body = error('用户名长度应在 3-50 个字符之间', 400)
        return
      }

      // 密码长度验证
      if (password.length < 6) {
        ctx.status = 400
        ctx.body = error('密码长度至少为 6 位', 400)
        return
      }

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ where: { username } })
      if (existingUser) {
        ctx.status = 400
        ctx.body = error('用户名已存在', 400)
        return
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (email) {
        const existingEmail = await User.findOne({ where: { email } })
        if (existingEmail) {
          ctx.status = 400
          ctx.body = error('邮箱已被使用', 400)
          return
        }
      }

      // 加密密码
      const hashedPassword = await hashPassword(password)

      // 创建用户
      const user = await User.create({
        username,
        password: hashedPassword,
        nickname: nickname || username,
        email: email || null,
        phone: phone || null,
        status: status !== undefined ? status : 1
      }, { transaction })

      // 分配角色
      if (roleIds && roleIds.length > 0) {
        // 验证角色是否存在
        const validRoles = await Role.findAll({
          where: { id: roleIds, status: 1 }
        })
        
        if (validRoles.length > 0) {
          const userRoles = validRoles.map(role => ({
            userId: user.id,
            roleId: role.id
          }))
          await UserRole.bulkCreate(userRoles, { transaction })
        }
      } else {
        // 默认分配普通用户角色
        const defaultRole = await Role.findOne({ where: { code: 'user' } })
        if (defaultRole) {
          await UserRole.create({
            userId: user.id,
            roleId: defaultRole.id
          }, { transaction })
        }
      }

      await transaction.commit()

      // 获取用户的角色信息
      const userRoles = await UserRole.findAll({
        where: { userId: user.id },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        }]
      })

      // 返回用户信息
      ctx.body = success({
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles: userRoles.map(ur => ur.role),
        createdAt: user.createdAt
      }, '创建用户成功')
    } catch (err) {
      await transaction.rollback()
      console.error('创建用户失败:', err)
      ctx.status = 500
      ctx.body = error('创建用户失败', 500)
    }
  }

  // 获取用户列表（支持分页和搜索）
  async getUsers(ctx) {
    try {
      const { keyword = '', page = 1, pageSize = 10, status } = ctx.query
      
      // 构建查询条件
      const whereCondition = {}
      if (keyword) {
        whereCondition[Op.or] = [
          { username: { [Op.like]: `%${keyword}%` } },
          { nickname: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } }
        ]
      }
      
      if (status !== undefined && status !== '') {
        whereCondition.status = parseInt(status)
      }

      // 计算偏移量
      const offset = (parseInt(page) - 1) * parseInt(pageSize)
      const limit = parseInt(pageSize)

      // 查询用户列表
      const { count, rows } = await User.findAndCountAll({
        where: whereCondition,
        attributes: { exclude: ['password'] },
        offset,
        limit,
        order: [['createdAt', 'DESC']]
      })

      // 获取每个用户的角色
      const userIds = rows.map(u => u.id)
      const userRoles = await UserRole.findAll({
        where: { userId: userIds },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        }]
      })

      // 组装用户角色数据
      const userRoleMap = {}
      userRoles.forEach(ur => {
        if (!userRoleMap[ur.userId]) {
          userRoleMap[ur.userId] = []
        }
        if (ur.role) {
          userRoleMap[ur.userId].push(ur.role)
        }
      })

      const list = rows.map(user => ({
        ...user.toJSON(),
        roles: userRoleMap[user.id] || []
      }))

      ctx.body = success({
        list,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / parseInt(pageSize))
      })
    } catch (err) {
      console.error('获取用户列表失败:', err)
      ctx.status = 500
      ctx.body = error('获取用户列表失败', 500)
    }
  }

  // 根据ID获取用户详情
  async getUserById(ctx) {
    try {
      const { id } = ctx.params
      
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      })

      if (!user) {
        ctx.status = 404
        ctx.body = error('用户不存在', 404)
        return
      }

      // 获取用户角色
      const userRoles = await UserRole.findAll({
        where: { userId: id },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        }]
      })

      ctx.body = success({
        ...user.toJSON(),
        roles: userRoles.map(ur => ur.role),
        roleIds: userRoles.map(ur => ur.roleId)
      })
    } catch (err) {
      console.error('获取用户详情失败:', err)
      ctx.status = 500
      ctx.body = error('获取用户详情失败', 500)
    }
  }

  // 更新用户信息
  async updateUser(ctx) {
    const transaction = await sequelize.transaction()
    
    try {
      const { id } = ctx.params
      const { nickname, email, phone, avatar, status, roleIds } = ctx.request.body

      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = error('用户不存在', 404)
        return
      }

      // 检查邮箱是否已被其他用户使用
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ 
          where: { email, id: { [Op.ne]: id } } 
        })
        if (existingEmail) {
          ctx.status = 400
          ctx.body = error('邮箱已被使用', 400)
          return
        }
      }

      // 更新用户信息
      const updateData = {}
      if (nickname !== undefined) updateData.nickname = nickname
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (avatar !== undefined) updateData.avatar = avatar
      if (status !== undefined) updateData.status = parseInt(status)

      await user.update(updateData, { transaction })

      // 更新角色
      if (roleIds !== undefined) {
        // 删除旧的角色关联
        await UserRole.destroy({
          where: { userId: id },
          transaction
        })
        
        // 添加新的角色关联
        if (roleIds.length > 0) {
          const validRoles = await Role.findAll({
            where: { id: roleIds, status: 1 }
          })
          
          if (validRoles.length > 0) {
            const userRoles = validRoles.map(role => ({
              userId: parseInt(id),
              roleId: role.id
            }))
            await UserRole.bulkCreate(userRoles, { transaction })
          }
        }
      }

      await transaction.commit()

      // 获取更新后的用户角色
      const userRoles = await UserRole.findAll({
        where: { userId: id },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'code']
        }]
      })

      ctx.body = success({
        ...user.toJSON(),
        roles: userRoles.map(ur => ur.role)
      }, '更新用户成功')
    } catch (err) {
      await transaction.rollback()
      console.error('更新用户失败:', err)
      ctx.status = 500
      ctx.body = error('更新用户失败', 500)
    }
  }

  // 更新用户状态
  async updateUserStatus(ctx) {
    try {
      const { id } = ctx.params
      const { status } = ctx.request.body

      if (status === undefined || ![0, 1].includes(status)) {
        ctx.status = 400
        ctx.body = error('状态参数无效，必须为0或1', 400)
        return
      }

      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = error('用户不存在', 404)
        return
      }

      await user.update({ status })

      ctx.body = success({
        id: user.id,
        status: user.status
      }, '更新用户状态成功')
    } catch (err) {
      console.error('更新用户状态失败:', err)
      ctx.status = 500
      ctx.body = error('更新用户状态失败', 500)
    }
  }

  // 删除用户
  async deleteUser(ctx) {
    const transaction = await sequelize.transaction()
    
    try {
      const { id } = ctx.params

      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = error('用户不存在', 404)
        return
      }

      // 检查是否为系统预设用户
      if (['superadmin', 'admin'].includes(user.username)) {
        ctx.status = 400
        ctx.body = error('系统预设用户不能删除', 400)
        return
      }

      // 删除用户角色关联
      await UserRole.destroy({
        where: { userId: id },
        transaction
      })

      // 软删除用户
      await user.destroy({ transaction })

      await transaction.commit()

      ctx.body = success(null, '删除用户成功')
    } catch (err) {
      await transaction.rollback()
      console.error('删除用户失败:', err)
      ctx.status = 500
      ctx.body = error('删除用户失败', 500)
    }
  }

  // 重置用户密码
  async resetPassword(ctx) {
    try {
      const { id } = ctx.params
      const { password } = ctx.request.body

      if (!password || password.length < 6) {
        ctx.status = 400
        ctx.body = error('密码长度至少为 6 位', 400)
        return
      }

      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = error('用户不存在', 404)
        return
      }

      const hashedPassword = await hashPassword(password)
      await user.update({ password: hashedPassword })

      ctx.body = success(null, '重置密码成功')
    } catch (err) {
      console.error('重置密码失败:', err)
      ctx.status = 500
      ctx.body = error('重置密码失败', 500)
    }
  }

  // 为用户分配角色
  async assignRoles(ctx) {
    const transaction = await sequelize.transaction()
    
    try {
      const { id } = ctx.params
      const { roleIds = [] } = ctx.request.body

      const user = await User.findByPk(id)
      if (!user) {
        ctx.status = 404
        ctx.body = error('用户不存在', 404)
        return
      }

      // 验证角色是否存在
      if (roleIds.length > 0) {
        const validRoles = await Role.findAll({
          where: { id: roleIds },
          attributes: ['id']
        })
        
        if (validRoles.length !== roleIds.length) {
          ctx.status = 400
          ctx.body = error('部分角色ID无效', 400)
          return
        }
      }

      // 删除旧的角色关联
      await UserRole.destroy({
        where: { userId: id },
        transaction
      })

      // 创建新的角色关联
      if (roleIds.length > 0) {
        const userRoles = roleIds.map(roleId => ({
          userId: parseInt(id),
          roleId: parseInt(roleId)
        }))
        await UserRole.bulkCreate(userRoles, { transaction })
      }

      await transaction.commit()

      ctx.body = success(null, '分配角色成功')
    } catch (err) {
      await transaction.rollback()
      console.error('分配角色失败:', err)
      ctx.status = 500
      ctx.body = error('分配角色失败', 500)
    }
  }
}

module.exports = new UserController()
