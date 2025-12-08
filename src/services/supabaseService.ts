import { supabase } from '../lib/supabase';
import type { ExerciseEntry, ExerciseFormData, WeeklySummary } from '../types';
// Date utilities imported as needed

/**
 * 获取指定日期范围内的训练记录
 */
export async function getExerciseEntries(
    startDate: string,
    endDate: string
): Promise<ExerciseEntry[]> {
    const { data, error } = await supabase
        .from('exercise_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching exercise entries:', error);
        throw error;
    }

    return data || [];
}

/**
 * 添加训练记录
 */
export async function addExerciseEntry(
    formData: ExerciseFormData
): Promise<ExerciseEntry> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('exercise_entries')
        .insert({
            user_id: userData.user?.id,
            date: formData.date,
            exercise: formData.exercise,
            count: formData.count,
            duration: formData.duration,
            feeling: formData.feeling,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding exercise entry:', error);
        throw error;
    }

    return data;
}

/**
 * 更新训练记录
 */
export async function updateExerciseEntry(
    id: string,
    formData: Partial<ExerciseFormData>
): Promise<ExerciseEntry> {
    const { data, error } = await supabase
        .from('exercise_entries')
        .update({
            ...formData,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating exercise entry:', error);
        throw error;
    }

    return data;
}

/**
 * 删除训练记录
 */
export async function deleteExerciseEntry(id: string): Promise<void> {
    const { error } = await supabase
        .from('exercise_entries')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting exercise entry:', error);
        throw error;
    }
}

/**
 * 获取周总结
 */
export async function getWeeklySummary(
    weekStart: string
): Promise<WeeklySummary | null> {
    const { data, error } = await supabase
        .from('weekly_summaries')
        .select('*')
        .eq('week_start', weekStart)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching weekly summary:', error);
        throw error;
    }

    return data;
}

/**
 * 保存周总结
 */
export async function saveWeeklySummary(
    summary: Omit<WeeklySummary, 'id' | 'user_id' | 'created_at'>
): Promise<WeeklySummary> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('weekly_summaries')
        .upsert(
            {
                ...summary,
                user_id: userData.user?.id,
            },
            {
                onConflict: 'user_id,week_start',
            }
        )
        .select()
        .single();

    if (error) {
        console.error('Error saving weekly summary:', error);
        throw error;
    }

    return data;
}

/**
 * 计算周训练统计
 */
export function calculateWeekStats(entries: ExerciseEntry[]): {
    totalDuration: number;
    exerciseStats: Record<string, number>;
} {
    const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);
    const exerciseStats: Record<string, number> = {};

    entries.forEach((entry) => {
        if (exerciseStats[entry.exercise]) {
            exerciseStats[entry.exercise] += entry.count;
        } else {
            exerciseStats[entry.exercise] = entry.count;
        }
    });

    return { totalDuration, exerciseStats };
}
