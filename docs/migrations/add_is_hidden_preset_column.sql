-- 增量迁移：为已存在的 user_exercises 表添加 is_hidden_preset 字段
-- 如果之前已经执行过完整的 create_user_exercises_table.sql，只需要执行这个脚本即可

-- 添加 is_hidden_preset 字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_exercises' AND column_name = 'is_hidden_preset'
  ) THEN
    ALTER TABLE user_exercises ADD COLUMN is_hidden_preset BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_hidden_preset column to user_exercises table';
  ELSE
    RAISE NOTICE 'Column is_hidden_preset already exists, skipping';
  END IF;
END $$;
