# 数据库迁移脚本

## 执行迁移的方式

### 方式 1: 通过 Supabase Dashboard（推荐）⭐

这是最简单和安全的方式：

1. **访问 Supabase Dashboard**
   - 打开 https://supabase.com/dashboard
   - 登录你的账户
   - 选择你的项目

2. **打开 SQL Editor**
   - 在左侧菜单中找到 "SQL Editor"
   - 点击 "New query"

3. **执行迁移脚本**
   - 打开迁移文件（例如：`docs/migrations/create_daily_warmups_table.sql`）
   - 复制所有 SQL 代码
   - 粘贴到 SQL Editor 中
   - 点击 "Run" 或按 `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

4. **验证结果**
   - 检查是否有错误信息
   - 在左侧菜单的 "Table Editor" 中确认新表已创建

### 方式 2: 使用 Supabase CLI

如果你已经安装了 Supabase CLI：

```bash
# 1. 安装 Supabase CLI（如果还没有）
npm install -g supabase

# 2. 登录
supabase login

# 3. 链接到你的项目
supabase link --project-ref <your-project-ref>

# 4. 执行迁移
supabase db push
```

### 方式 3: 使用 Node.js 脚本（仅显示 SQL）

```bash
# 显示迁移 SQL（方便复制）
node scripts/run-migration.js docs/migrations/create_daily_warmups_table.sql
```

注意：由于 Supabase JS 客户端的安全限制，无法直接执行原始 SQL。这个脚本主要用于显示 SQL 代码，方便复制到 Dashboard。

## 可用的迁移文件

- `docs/migrations/create_daily_warmups_table.sql` - 创建每日热身记录表（新增功能）

## 注意事项

⚠️ **重要**: 
- 执行迁移前，建议先备份数据库
- 在生产环境执行前，先在开发/测试环境验证
- 确保你使用的是正确的 Supabase 项目
