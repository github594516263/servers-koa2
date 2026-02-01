const User = require('../models/User')
const { hashPassword, comparePassword } = require('../utils/password')
const { generateToken } = require('../utils/jwt')
const { success, error } = require('../utils/response')
const { getUserPermissions, getUserRoles } = require('../utils/permission')
const sequelize = require('../config/database')

/**
 * 获取用户的角色和权限
 * @param {number} userId 
 * @returns {Promise<{roles: Array, permissions: Array}>}
 */
async function getUserRolesAndPermissions(userId) {
  // 使用 utils/permission.js 中的方法获取角色和权限
  const [roles, permissions] = await Promise.all([
    getUserRoles(userId),
    getUserPermissions(userId)
  ])
  
  return {
    roles,
    permissions
  }
}

/**
 * 用户注册
 */
async function register(ctx) {
  const transaction = await sequelize.transaction()
  
  try {
    const { username, password, email, nickname, phone } = ctx.request.body
    
    // 参数验证
    if (!username || !password) {
      ctx.status = 400
      ctx.body = error('用户名和密码不能为空', 400)
      return
    }
    
    // 用户名长度验证
    if (username.length < 3 || username.length > 20) {
      ctx.status = 400
      ctx.body = error('用户名长度应在 3-20 个字符之间', 400)
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
      email: email || null,
      nickname: nickname || username,
      phone: phone || null,
      avatar: null,
      status: 1,
    }, { transaction })
    
    // 分配默认角色（普通用户）
    const defaultRole = await Role.findOne({ where: { code: 'user' } })
    if (defaultRole) {
      await UserRole.create({
        userId: user.id,
        roleId: defaultRole.id
      }, { transaction })
    }
    
    await transaction.commit()
    
    // 获取用户角色和权限
    const { roles, permissions } = await getUserRolesAndPermissions(user.id)
    
    // 生成 Token
    const token = generateToken({
      id: user.id,
      username: user.username,
    })
    
    // 返回用户信息和 Token
    ctx.body = success({
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        roles,
        permissions,
      },
    }, '注册成功')
  } catch (err) {
    await transaction.rollback()
    console.error('注册失败:', err)
    ctx.status = 500
    ctx.body = error('注册失败', 500)
  }
}

/**
 * 用户登录
 */
async function login(ctx) {
  try {
    const { username, password } = ctx.request.body
    
    // 参数验证
    if (!username || !password) {
      ctx.status = 400
      ctx.body = error('用户名和密码不能为空', 400)
      return
    }
    
    // 查找用户
    const user = await User.findOne({ 
      where: { username },
      attributes: { exclude: ['deletedAt'] }
    })
    
    if (!user) {
      ctx.status = 400
      ctx.body = error('用户名或密码错误', 400)
      return
    }
    
    // 验证密码
    const isValidPassword = await comparePassword(password, user.password)
    
    if (!isValidPassword) {
      ctx.status = 400
      ctx.body = error('用户名或密码错误', 400)
      return
    }
    
    // 检查用户状态
    if (user.status !== 1) {
      ctx.status = 403
      ctx.body = error('账号已被禁用', 403)
      return
    }
    
    // 获取用户角色和权限
    const { roles, permissions } = await getUserRolesAndPermissions(user.id)
    
    // 生成 Token
    const token = generateToken({
      id: user.id,
      username: user.username,
    })
    
    // 更新最后登录时间
    await user.update({ lastLoginAt: new Date() })
    
    // 返回用户信息和 Token
    ctx.body = success({
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        roles,
        permissions,
      },
    }, '登录成功')
  } catch (err) {
    console.error('登录失败:', err)
    ctx.status = 500
    ctx.body = error('登录失败', 500)
  }
}

/**
 * 用户登出
 */
async function logout(ctx) {
  // 前端清除 Token 即可
  // 后端可以在这里记录登出日志或将 Token 加入黑名单
  
  ctx.body = success(null, '登出成功')
}

/**
 * 获取用户信息
 */
async function getUserInfo(ctx) {
  try {
    const userId = ctx.state.user.id
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'deletedAt'] }
    })
    
    if (!user) {
      ctx.status = 404
      ctx.body = error('用户不存在', 404)
      return
    }
    
    if (user.status !== 1) {
      ctx.status = 403
      ctx.body = error('账号已被禁用', 403)
      return
    }
    
    // 获取用户角色和权限
    const { roles, permissions } = await getUserRolesAndPermissions(userId)
    
    ctx.body = success({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      roles,
      permissions,
    })
  } catch (err) {
    console.error('获取用户信息失败:', err)
    ctx.status = 500
    ctx.body = error('获取用户信息失败', 500)
  }
}

/**
 * 刷新 Token
 */
async function refreshToken(ctx) {
  try {
    const userId = ctx.state.user.id
    
    const user = await User.findByPk(userId)
    
    if (!user) {
      ctx.status = 404
      ctx.body = error('用户不存在', 404)
      return
    }
    
    if (user.status !== 1) {
      ctx.status = 403
      ctx.body = error('账号已被禁用', 403)
      return
    }
    
    // 生成新 Token
    const token = generateToken({
      id: user.id,
      username: user.username,
    })
    
    ctx.body = success({ token }, 'Token 刷新成功')
  } catch (err) {
    console.error('刷新Token失败:', err)
    ctx.status = 500
    ctx.body = error('刷新Token失败', 500)
  }
}

/**
 * 修改密码
 */
async function changePassword(ctx) {
  try {
    const userId = ctx.state.user.id
    const { oldPassword, newPassword, confirmPassword } = ctx.request.body
    
    // 参数验证
    if (!oldPassword || !newPassword || !confirmPassword) {
      ctx.status = 400
      ctx.body = error('参数不完整', 400)
      return
    }
    
    if (newPassword !== confirmPassword) {
      ctx.status = 400
      ctx.body = error('两次密码输入不一致', 400)
      return
    }
    
    if (newPassword.length < 6) {
      ctx.status = 400
      ctx.body = error('新密码长度至少为 6 位', 400)
      return
    }
    
    // 查找用户
    const user = await User.findByPk(userId)
    
    if (!user) {
      ctx.status = 404
      ctx.body = error('用户不存在', 404)
      return
    }
    
    // 验证旧密码
    const isValidPassword = await comparePassword(oldPassword, user.password)
    
    if (!isValidPassword) {
      ctx.status = 400
      ctx.body = error('旧密码错误', 400)
      return
    }
    
    // 加密新密码
    const hashedPassword = await hashPassword(newPassword)
    
    // 更新密码
    await user.update({ password: hashedPassword })
    
    ctx.body = success(null, '密码修改成功')
  } catch (err) {
    console.error('修改密码失败:', err)
    ctx.status = 500
    ctx.body = error('修改密码失败', 500)
  }
}

module.exports = {
  register,
  login,
  logout,
  getUserInfo,
  refreshToken,
  changePassword,
}
