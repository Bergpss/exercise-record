-- 创建每日热身记录表
CREATE TABLE IF NOT EXISTS daily_warmups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,  -- 热身时长（分钟）
  description TEXT,  -- 热身方式/动作描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)  -- 每个用户每天只有一条热身记录
);

-- 启用行级安全策略 (RLS)
ALTER TABLE daily_warmups ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的热身记录
CREATE POLICY "Users can manage own warmups" ON daily_warmups
  FOR ALL USING (auth.uid() = user_id);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_daily_warmups_user_date ON daily_warmups(user_id, date);
