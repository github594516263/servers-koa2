/**
 * 数据字典控制器
 * 提供字典类型和字典项的增删改查
 */

const Dict = require('../models/Dict')
const DictItem = require('../models/DictItem')
const { success, error } = require('../utils/response')
const { Op } = require('sequelize')

// ==================== 字典类型 ====================

/**
 * 获取字典类型列表（分页）
 */
exports.getDicts = async (ctx) => {
  try {
    const { page = 1, pageSize = 10, keyword, status } = ctx.query

    const where = {}
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ]
    }
    if (status !== undefined && status !== '') {
      where.status = parseInt(status)
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize)
    const { count, rows } = await Dict.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
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
    console.error('获取字典列表失败:', err)
    ctx.status = 500
    ctx.body = error('获取字典列表失败', 500)
  }
}

/**
 * 获取所有字典类型（不分页，用于下拉选择）
 */
exports.getAllDicts = async (ctx) => {
  try {
    const rows = await Dict.findAll({
      where: { status: 1 },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'name', 'code']
    })
    ctx.body = success(rows)
  } catch (err) {
    console.error('获取全部字典失败:', err)
    ctx.status = 500
    ctx.body = error('获取全部字典失败', 500)
  }
}

/**
 * 创建字典类型
 */
exports.createDict = async (ctx) => {
  try {
    const { name, code, description, status } = ctx.request.body

    if (!name || !code) {
      ctx.status = 400
      ctx.body = error('字典名称和编码不能为空', 400)
      return
    }

    // 检查编码唯一性
    const existing = await Dict.findOne({ where: { code } })
    if (existing) {
      ctx.status = 400
      ctx.body = error('字典编码已存在', 400)
      return
    }

    const dict = await Dict.create({
      name,
      code,
      description,
      status: status !== undefined ? status : 1
    })

    ctx.body = success(dict, '创建字典成功')
  } catch (err) {
    console.error('创建字典失败:', err)
    ctx.status = 500
    ctx.body = error('创建字典失败', 500)
  }
}

/**
 * 更新字典类型
 */
exports.updateDict = async (ctx) => {
  try {
    const { id } = ctx.params
    const { name, code, description, status } = ctx.request.body

    const dict = await Dict.findByPk(id)
    if (!dict) {
      ctx.status = 404
      ctx.body = error('字典不存在', 404)
      return
    }

    // 检查编码唯一性（排除自身）
    if (code && code !== dict.code) {
      const existing = await Dict.findOne({ where: { code, id: { [Op.ne]: id } } })
      if (existing) {
        ctx.status = 400
        ctx.body = error('字典编码已存在', 400)
        return
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (code !== undefined) updateData.code = code
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    await dict.update(updateData)

    ctx.body = success(dict, '更新字典成功')
  } catch (err) {
    console.error('更新字典失败:', err)
    ctx.status = 500
    ctx.body = error('更新字典失败', 500)
  }
}

/**
 * 删除字典类型（同时删除关联的字典项）
 */
exports.deleteDict = async (ctx) => {
  try {
    const { id } = ctx.params

    const dict = await Dict.findByPk(id)
    if (!dict) {
      ctx.status = 404
      ctx.body = error('字典不存在', 404)
      return
    }

    // 删除关联的字典项
    await DictItem.destroy({ where: { dictId: id } })
    await dict.destroy()

    ctx.body = success(null, '删除字典成功')
  } catch (err) {
    console.error('删除字典失败:', err)
    ctx.status = 500
    ctx.body = error('删除字典失败', 500)
  }
}

// ==================== 字典项 ====================

/**
 * 获取指定字典的字典项列表
 */
exports.getDictItems = async (ctx) => {
  try {
    const { dictId } = ctx.params

    const dict = await Dict.findByPk(dictId)
    if (!dict) {
      ctx.status = 404
      ctx.body = error('字典不存在', 404)
      return
    }

    const items = await DictItem.findAll({
      where: { dictId },
      order: [['sort', 'ASC'], ['id', 'ASC']]
    })

    ctx.body = success(items)
  } catch (err) {
    console.error('获取字典项失败:', err)
    ctx.status = 500
    ctx.body = error('获取字典项失败', 500)
  }
}

/**
 * 根据字典编码获取字典项（前端下拉选项专用）
 */
exports.getDictItemsByCode = async (ctx) => {
  try {
    const { code } = ctx.params

    const dict = await Dict.findOne({ where: { code, status: 1 } })
    if (!dict) {
      ctx.body = success([])
      return
    }

    const items = await DictItem.findAll({
      where: { dictId: dict.id, status: 1 },
      attributes: ['label', 'value', 'cssClass'],
      order: [['sort', 'ASC'], ['id', 'ASC']]
    })

    ctx.body = success(items)
  } catch (err) {
    console.error('获取字典项失败:', err)
    ctx.status = 500
    ctx.body = error('获取字典项失败', 500)
  }
}

/**
 * 批量根据字典编码获取字典项（减少请求次数）
 */
exports.getDictItemsByCodes = async (ctx) => {
  try {
    const { codes } = ctx.query

    if (!codes) {
      ctx.status = 400
      ctx.body = error('请提供字典编码', 400)
      return
    }

    const codeList = codes.split(',').map(c => c.trim()).filter(Boolean)
    const dicts = await Dict.findAll({
      where: { code: { [Op.in]: codeList }, status: 1 }
    })

    const result = {}
    for (const dict of dicts) {
      const items = await DictItem.findAll({
        where: { dictId: dict.id, status: 1 },
        attributes: ['label', 'value', 'cssClass'],
        order: [['sort', 'ASC'], ['id', 'ASC']]
      })
      result[dict.code] = items
    }

    // 对于未找到的字典编码，返回空数组
    for (const code of codeList) {
      if (!result[code]) result[code] = []
    }

    ctx.body = success(result)
  } catch (err) {
    console.error('批量获取字典项失败:', err)
    ctx.status = 500
    ctx.body = error('批量获取字典项失败', 500)
  }
}

/**
 * 创建字典项
 */
exports.createDictItem = async (ctx) => {
  try {
    const { dictId } = ctx.params
    const { label, value, sort, status, cssClass, remark } = ctx.request.body

    const dict = await Dict.findByPk(dictId)
    if (!dict) {
      ctx.status = 404
      ctx.body = error('字典不存在', 404)
      return
    }

    if (!label || !value) {
      ctx.status = 400
      ctx.body = error('标签和值不能为空', 400)
      return
    }

    // 检查同一字典下 value 唯一
    const existing = await DictItem.findOne({ where: { dictId, value } })
    if (existing) {
      ctx.status = 400
      ctx.body = error('该字典下已存在相同的值', 400)
      return
    }

    const item = await DictItem.create({
      dictId,
      label,
      value,
      sort: sort || 0,
      status: status !== undefined ? status : 1,
      cssClass,
      remark
    })

    ctx.body = success(item, '创建字典项成功')
  } catch (err) {
    console.error('创建字典项失败:', err)
    ctx.status = 500
    ctx.body = error('创建字典项失败', 500)
  }
}

/**
 * 更新字典项
 */
exports.updateDictItem = async (ctx) => {
  try {
    const { id } = ctx.params
    const { label, value, sort, status, cssClass, remark } = ctx.request.body

    const item = await DictItem.findByPk(id)
    if (!item) {
      ctx.status = 404
      ctx.body = error('字典项不存在', 404)
      return
    }

    // 检查同一字典下 value 唯一（排除自身）
    if (value && value !== item.value) {
      const existing = await DictItem.findOne({
        where: { dictId: item.dictId, value, id: { [Op.ne]: id } }
      })
      if (existing) {
        ctx.status = 400
        ctx.body = error('该字典下已存在相同的值', 400)
        return
      }
    }

    const updateData = {}
    if (label !== undefined) updateData.label = label
    if (value !== undefined) updateData.value = value
    if (sort !== undefined) updateData.sort = sort
    if (status !== undefined) updateData.status = status
    if (cssClass !== undefined) updateData.cssClass = cssClass
    if (remark !== undefined) updateData.remark = remark

    await item.update(updateData)

    ctx.body = success(item, '更新字典项成功')
  } catch (err) {
    console.error('更新字典项失败:', err)
    ctx.status = 500
    ctx.body = error('更新字典项失败', 500)
  }
}

/**
 * 删除字典项
 */
exports.deleteDictItem = async (ctx) => {
  try {
    const { id } = ctx.params

    const item = await DictItem.findByPk(id)
    if (!item) {
      ctx.status = 404
      ctx.body = error('字典项不存在', 404)
      return
    }

    await item.destroy()

    ctx.body = success(null, '删除字典项成功')
  } catch (err) {
    console.error('删除字典项失败:', err)
    ctx.status = 500
    ctx.body = error('删除字典项失败', 500)
  }
}
