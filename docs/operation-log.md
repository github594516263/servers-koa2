# 操作日志功能实现原理

## 一、整体架构

```
用户操作 → Koa 请求 → 审计中间件(audit.js) → 异步写入 operation_logs 表
                                                         ↓
前端页面 ← API 接口 ← Controller ← 查询 operation_logs 表
```

核心思想：**中间件自动拦截所有写操作（POST/PUT/PATCH/DELETE），异步记录到数据库，不影响接口响应速度。**

---

## 二、后端实现

### 1. 数据模型 — `models/OperationLog.js`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键自增 |
| userId | INTEGER | 操作用户ID |
| username | STRING(50) | 操作用户名（冗余存储，方便查询） |
| module | STRING(50) | 操作模块：auth/user/role/menu/task/article |
| action | STRING(20) | 操作类型：create/update/delete/login/logout |
| method | STRING(10) | HTTP 请求方法：POST/PUT/DELETE |
| url | STRING(500) | 请求路径 |
| ip | STRING(50) | 客户端 IP |
| params | TEXT | 请求参数（JSON 字符串，敏感字段已脱敏） |
| result | STRING(10) | 操作结果：success/fail |
| detail | STRING(500) | 操作描述（自动生成） |
| duration | INTEGER | 接口耗时（毫秒） |
| createdAt | DATETIME | 记录时间 |

### 2. 审计中间件 — `middleware/audit.js`

这是整个功能的核心，注册在 `app.js` 中，位于 bodyParser 之后、路由之前。

**工作流程：**

```
1. 判断请求方法
   ├── GET → 跳过（只读操作不记录）
   └── POST/PUT/PATCH/DELETE → 继续

2. 判断是否需要跳过
   ├── /api/operation-logs → 跳过（避免查日志时产生日志）
   └── /api/health → 跳过

3. 记录开始时间

4. 执行 await next()（让请求正常走完）

5. 异步写入日志（setImmediate）
   ├── 解析模块名（根据 URL 前缀映射）
   ├── 解析操作类型（根据 HTTP 方法映射）
   ├── 生成操作描述（特殊路由有预定义描述）
   ├── 脱敏请求参数（密码等敏感字段替换为 ******）
   └── 写入 OperationLog 表
```

**关键设计：**

- **异步写入**：使用 `setImmediate()` 将日志写入放到下一个事件循环，不阻塞接口响应
- **参数脱敏**：自动将 password、token 等敏感字段替换为 `******`
- **自动描述**：根据 URL 和 HTTP 方法自动生成中文操作描述
- **异常捕获**：日志写入失败不会影响业务接口

### 3. 控制器 — `controllers/operationLogController.js`

提供两个接口：

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 查询日志 | GET | /api/operation-logs | admin | 支持按用户/模块/类型/结果/时间范围筛选 |
| 清空日志 | DELETE | /api/operation-logs/clear | super_admin | 可按天数清除，或全部清空 |

### 4. 路由 — `routes/operationLog.js`

- 所有路由需要登录（`authMiddleware`）
- 查询：`checkRole('admin', 'super_admin')`
- 清空：`checkRole('super_admin')`

### 5. 注册位置 — `app.js`

```
bodyParser → auditMiddleware → router
```

中间件放在 bodyParser 之后，这样才能读取到 `ctx.request.body`。

---

## 三、前端实现

### 1. API 接口 — `src/api/operationLog.ts`

- `getOperationLogs(params)` — 分页查询日志
- `clearOperationLogs(beforeDays?)` — 清空日志

### 2. 页面 — `src/views/system/operation-log/index.vue`

使用 `PlusPage` 组件，支持：

- **筛选条件**：操作用户、操作模块、操作类型、操作结果
- **表格列**：用户、模块、类型、描述、请求方法、路径、IP、参数、结果、耗时、时间
- **特殊渲染**：
  - 模块/操作类型/结果 → 彩色 Tag
  - 请求方法 → 颜色区分（POST 绿 / PUT 黄 / DELETE 红）
  - 耗时超过 1000ms → 红色标注
  - 请求参数 → 点击弹窗查看格式化 JSON
- **清空功能**：确认弹窗 → 调用清空接口

### 3. 菜单配置

通过菜单管理页面添加：

| 字段 | 值 |
|------|-----|
| 路径 | `/system/operation-log` |
| 组件 | `system/operation-log/index` |

动态路由系统会自动将 `component` 映射到 `/src/views/system/operation-log/index.vue`。

---

## 四、文件清单

```
servers-koa2/
├── models/OperationLog.js          # 数据模型
├── middleware/audit.js             # 审计中间件（核心）
├── controllers/operationLogController.js  # 查询/清空接口
├── routes/operationLog.js          # 路由定义
├── app.js                          # 注册中间件 + sequelize.sync()
├── models/associations.js          # 添加 OperationLog ↔ User 关联
├── routes/index.js                 # 注册路由
└── scripts/autoInitDatabase.js     # 初始化脚本添加菜单项

myAiVue/
├── src/api/operationLog.ts         # API 接口
└── src/views/system/operation-log/index.vue  # 日志管理页面
```

---

## 五、数据流示例

以"创建任务"为例：

```
1. 前端 POST /api/tasks { title: "测试任务" }

2. Koa 中间件链：
   errorMiddleware → loggerMiddleware → auditMiddleware → router

3. auditMiddleware:
   - 检测到 POST 方法 → 需要记录
   - 记录 startTime
   - await next() → 请求进入 taskController.createTask

4. taskController 返回 { code: 200, data: {...} }

5. auditMiddleware（next 之后）:
   - 计算 duration = Date.now() - startTime
   - setImmediate 异步写入:
     {
       userId: 1,
       username: "admin",
       module: "task",
       action: "create",
       method: "POST",
       url: "/api/tasks",
       params: '{"title":"测试任务"}',
       result: "success",
       detail: "创建任务",
       duration: 45
     }

6. 响应已返回给前端，日志在后台异步写入完成
```
