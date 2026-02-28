# 消息通知中心 — 后端实现文档

## 一、架构概览

```
请求流程：
Client → Route(notification.js) → authMiddleware(鉴权) → Controller(notificationController.js) → Model(Notification.js) → MySQL
```

### 涉及文件

| 文件 | 职责 |
|------|------|
| `models/Notification.js` | Sequelize 数据模型，定义 notifications 表结构 |
| `controllers/notificationController.js` | 业务逻辑层，处理 CRUD 和发送 |
| `routes/notification.js` | 路由定义，URL → Controller 映射 |
| `routes/index.js` | 路由注册入口，挂载到 `/api` 前缀下 |
| `models/associations.js` | 模型关联配置（Notification ↔ User） |

---

## 二、数据模型 — `Notification`

**表名**：`notifications`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | INTEGER | ✅ | 自增 | 主键 |
| `userId` | INTEGER | ✅ | - | 接收用户 ID |
| `title` | STRING(200) | ✅ | - | 通知标题 |
| `content` | TEXT | ❌ | null | 通知正文 |
| `type` | ENUM | ❌ | `'system'` | 类型：`system` / `task` / `article` / `other` |
| `isRead` | TINYINT | ❌ | `0` | 是否已读：0=未读, 1=已读 |
| `readAt` | DATE | ❌ | null | 阅读时间 |
| `senderId` | INTEGER | ❌ | null | 发送者 ID（系统通知为空） |
| `relatedId` | INTEGER | ❌ | null | 关联业务 ID（如任务 ID） |
| `relatedType` | STRING(50) | ❌ | null | 关联业务类型（如 `task`） |
| `createdAt` | DATETIME | 自动 | - | 创建时间 |
| `updatedAt` | DATETIME | 自动 | - | 更新时间 |
| `deletedAt` | DATETIME | 自动 | null | 软删除时间（paranoid） |

### 索引

| 索引名 | 字段 | 用途 |
|--------|------|------|
| `idx_user_id` | `userId` | 按用户查通知 |
| `idx_is_read` | `isRead` | 筛选已读/未读 |
| `idx_type` | `type` | 按类型筛选 |
| `idx_user_read` | `userId, isRead` | 联合索引，查未读数量 |
| `idx_created_at` | `createdAt` | 按时间排序 |

### 模型关联

```
Notification.belongsTo(User, { foreignKey: 'userId', as: 'receiver' })
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' })
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' })
```

---

## 三、API 接口

所有接口均需要 **Bearer Token** 鉴权（`authMiddleware`）。

### 3.1 获取通知列表

```
GET /api/notifications?page=1&pageSize=10&type=system&isRead=0
```

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | ❌ | 页码，默认 1 |
| `pageSize` | number | ❌ | 每页条数，默认 10 |
| `type` | string | ❌ | 通知类型筛选 |
| `isRead` | number | ❌ | 已读状态：0=未读, 1=已读 |

**响应**：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": 1,
        "userId": 2,
        "title": "你有一个新任务",
        "content": "请及时处理...",
        "type": "task",
        "isRead": 0,
        "readAt": null,
        "senderId": 1,
        "createdAt": "2026-02-28T08:00:00.000Z",
        "sender": {
          "id": 1,
          "username": "admin",
          "nickname": "管理员",
          "avatar": null
        }
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

**原理**：
- 通过 `ctx.state.user.id` 只查询当前用户的通知（数据隔离）
- 使用 Sequelize `include` 联表查询 `sender` 用户信息
- 支持 `type` 和 `isRead` 可选筛选条件
- `findAndCountAll` 同时返回总数和分页数据

---

### 3.2 获取未读通知数量

```
GET /api/notifications/unread-count
```

**响应**：

```json
{
  "code": 200,
  "data": { "count": 5 }
}
```

**原理**：
- `Notification.count({ where: { userId, isRead: 0 } })` 统计未读数
- 前端每 30 秒轮询此接口，驱动 Header 铃铛 badge 数字

---

### 3.3 标记单条已读

```
PUT /api/notifications/:id/read
```

**原理**：
1. 通过 `id + userId` 联合查询，确保只能操作自己的通知
2. 将 `isRead` 设为 1，同时记录 `readAt` 时间戳
3. 如果已经是已读状态则跳过更新（幂等）

---

### 3.4 全部标记已读

```
PUT /api/notifications/read-all
```

**原理**：
- 批量 `UPDATE notifications SET isRead=1, readAt=NOW() WHERE userId=? AND isRead=0`
- 返回实际更新条数 `updatedCount`

---

### 3.5 删除单条通知

```
DELETE /api/notifications/:id
```

**原理**：
- 同样校验 `id + userId`，防止越权删除
- 使用 Sequelize `paranoid: true` 软删除（仅设置 `deletedAt`，数据仍在）

---

### 3.6 批量删除通知

```
POST /api/notifications/batch-delete
```

**请求体**：

```json
{ "ids": [1, 2, 3] }
```

**原理**：
- `WHERE id IN (:ids) AND userId = :currentUserId`
- 双重条件确保只能删除自己的通知

---

### 3.7 发送通知（管理员）

```
POST /api/notifications/send
```

**权限**：需要 `admin` 或 `super_admin` 角色（`checkRole` 中间件）

**请求体**：

```json
{
  "title": "系统维护通知",
  "content": "系统将于今晚 22:00 进行维护",
  "type": "system",
  "userIds": [2, 3, 4]
}
```

**原理**：
1. 校验 `title` 和 `userIds` 必填
2. 构造通知数组，每个 `userId` 一条记录，`senderId` 为当前管理员 ID
3. 使用 `Notification.bulkCreate()` 批量插入，一次 SQL 完成

---

## 四、权限控制

```
routes/notification.js:

router.use(authMiddleware)                    // 所有接口需登录
router.post('/send', checkRole('admin', 'super_admin'), ...)  // 发送需管理员
```

- **authMiddleware**：解析 JWT → 获取用户角色 → 挂载到 `ctx.state.user`
- **checkRole**：验证用户是否拥有指定角色，否则返回 403
- **数据权限**：所有查询/操作都带 `userId = ctx.state.user.id` 条件，实现数据隔离

---

## 五、数据流示意

```
管理员发送通知:
Admin → POST /send → bulkCreate → notifications 表写入 N 条记录

用户查看通知:
User → GET / → findAndCountAll(userId=当前用户) → 返回列表

用户读取通知:
User → PUT /:id/read → update(isRead=1, readAt=NOW)

Header 铃铛轮询:
前端 30s → GET /unread-count → count(userId, isRead=0) → 更新 badge 数字
```

---

## 六、后续扩展方向

1. **WebSocket 实时推送**：替代轮询，服务端发送通知后立即推送给在线用户
2. **业务自动触发**：在 taskController / articleController 中，任务分配、状态变更时自动创建通知
3. **通知模板**：预定义常用通知模板，简化发送流程
4. **邮件/短信通知**：对离线用户发送邮件或短信提醒
