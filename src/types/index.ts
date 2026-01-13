// 单次训练记录
export interface ExerciseEntry {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    exercise: string;
    count: number;
    duration: number; // 分钟
    weight?: number; // 负重（kg），为空或0表示徒手
    feeling: string;
    created_at: string;
    updated_at: string;
}

// 日训练汇总
export interface DayRecord {
    date: string;
    entries: ExerciseEntry[];
    totalDuration: number;
}

// 周训练数据
export interface WeekData {
    weekStart: string;
    weekEnd: string;
    days: DayRecord[];
}

// AI 周总结
export interface WeeklySummary {
    id: string;
    user_id: string;
    week_start: string;
    total_duration: number;
    exercise_stats: Record<string, number>;
    comparison_with_last_week: string;
    improvement_suggestions: string;
    generated_at: string;
    created_at: string;
}

// 单组数据（负重 × 次数）
export interface ExerciseSet {
    weight?: number; // 负重（kg），为空或0表示徒手
    count: number;   // 次数
}

// 表单数据
export interface ExerciseFormData {
    date: string;
    exercise: string;
    sets: ExerciseSet[];  // 多组训练数据
    duration: number;     // 总时长（分钟）
    feeling: string;
}

// 常用训练动作（默认预设）
export const COMMON_EXERCISES = [
    '俯卧撑',
    '深蹲',
    '引体向上',
    '仰卧起坐',
    '平板支撑',
    '跑步',
    '跳绳',
    '哑铃弯举',
    '硬拉',
    '卧推',
] as const;

// 用户自定义动作
export interface UserExercise {
    id: string;
    user_id: string;
    exercise: string;
    is_hidden_preset?: boolean; // 标记是否为隐藏的预设动作
    created_at: string;
    updated_at: string;
}
