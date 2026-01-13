-- 用户自定义动作表
CREATE TABLE IF NOT EXISTS user_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise)
);

-- 启用行级安全策略 (RLS)
ALTER TABLE user_exercises ENABLE ROW LEVEL SECURITY;

-- 用户只能访问和管理自己的动作
CREATE POLICY "Users can manage own exercises" ON user_exercises
  FOR ALL USING (auth.uid() = user_id);

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

CREATE TRIGGER update_user_exercises_updated_at BEFORE UPDATE ON user_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
