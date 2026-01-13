-- 用户自定义动作表
CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise VARCHAR(100) NOT NULL,
  is_hidden_preset BOOLEAN DEFAULT FALSE,  -- 标记是否为隐藏的预设动作
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise)
);

-- 如果表已存在，添加 is_hidden_preset 字段（用于迁移）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_exercises' AND column_name = 'is_hidden_preset'
  ) THEN
    ALTER TABLE user_exercises ADD COLUMN is_hidden_preset BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 启用行级安全策略 (RLS)
ALTER TABLE user_exercises ENABLE ROW LEVEL SECURITY;

-- 用户只能访问和管理自己的动作（如果策略不存在则创建）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_exercises' 
    AND policyname = 'Users can manage own exercises'
  ) THEN
    CREATE POLICY "Users can manage own exercises" ON user_exercises
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON user_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exercises_exercise ON user_exercises(exercise);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建更新时间触发器（如果不存在）
DROP TRIGGER IF EXISTS update_user_exercises_updated_at ON user_exercises;
CREATE TRIGGER update_user_exercises_updated_at BEFORE UPDATE ON user_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
