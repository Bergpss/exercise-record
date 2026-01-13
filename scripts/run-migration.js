#!/usr/bin/env node

/**
 * 执行数据库迁移脚本
 * 
 * 使用方法：
 * 1. 确保已设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
 * 2. 运行: node scripts/run-migration.js <migration-file>
 * 
 * 示例：
 * node scripts/run-migration.js docs/migrations/create_daily_warmups_table.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从环境变量或 .env.local 文件读取配置
function getEnvVar(name) {
  // 尝试从 process.env 读取
  if (process.env[name]) {
    return process.env[name];
  }
  
  // 尝试读取 .env.local 文件
  try {
    const envPath = resolve(__dirname, '../.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(new RegExp(`^${name}=(.+)$`, 'm'));
    if (match) {
      return match[1].trim();
    }
  } catch (error) {
    // .env.local 文件不存在或无法读取
  }
  
  return null;
}

async function runMigration(migrationFile) {
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 错误: 未找到 Supabase 配置');
    console.error('请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
    console.error('或者在 .env.local 文件中配置这些值');
    process.exit(1);
  }

  // 读取迁移文件
  const migrationPath = resolve(__dirname, '..', migrationFile);
  let sql;
  try {
    sql = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    console.error(`❌ 错误: 无法读取迁移文件 ${migrationPath}`);
    console.error(error.message);
    process.exit(1);
  }

  console.log(`📄 读取迁移文件: ${migrationFile}`);
  console.log(`🔗 连接到 Supabase: ${supabaseUrl}`);

  // 创建 Supabase 客户端
  // 注意：迁移需要使用 service_role key，但这里使用 anon key 作为示例
  // 如果使用 anon key，某些操作可能会失败，建议使用 Supabase Dashboard
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 执行 SQL
    // 注意：Supabase JS 客户端不直接支持执行原始 SQL
    // 这个方法可能不工作，建议使用 Supabase Dashboard 或 Supabase CLI
    console.log('⚠️  警告: Supabase JS 客户端不支持直接执行原始 SQL');
    console.log('请使用以下方式之一执行迁移:');
    console.log('');
    console.log('方式 1: 通过 Supabase Dashboard');
    console.log('  1. 访问 https://supabase.com/dashboard');
    console.log('  2. 选择你的项目');
    console.log('  3. 打开 SQL Editor');
    console.log('  4. 复制并粘贴以下 SQL:');
    console.log('');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('');
    console.log('方式 2: 使用 Supabase CLI');
    console.log('  1. 安装: npm install -g supabase');
    console.log('  2. 登录: supabase login');
    console.log('  3. 链接项目: supabase link --project-ref <your-project-ref>');
    console.log('  4. 执行: supabase db push');
    console.log('');
    
    // 尝试使用 RPC（如果可用）
    // 但大多数情况下，直接执行 SQL 需要通过 Dashboard 或 CLI
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行迁移时出错:');
    console.error(error.message);
    process.exit(1);
  }
}

// 主函数
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ 错误: 请指定迁移文件路径');
  console.error('');
  console.error('使用方法:');
  console.error('  node scripts/run-migration.js <migration-file>');
  console.error('');
  console.error('示例:');
  console.error('  node scripts/run-migration.js docs/migrations/create_daily_warmups_table.sql');
  process.exit(1);
}

runMigration(migrationFile).catch((error) => {
  console.error('❌ 未预期的错误:');
  console.error(error);
  process.exit(1);
});
