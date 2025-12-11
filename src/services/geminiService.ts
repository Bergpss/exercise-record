import type { ExerciseEntry, WeeklySummary } from '../types';
import { calculateWeekStats } from './supabaseService';

/**
 * 生成周总结 - 通过后端 API 代理调用 Gemini
 */
export async function generateWeeklySummary(
    currentWeekEntries: ExerciseEntry[],
    lastWeekEntries: ExerciseEntry[] | null,
    weekStart: string
): Promise<Omit<WeeklySummary, 'id' | 'user_id' | 'created_at'>> {
    try {
        const response = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentWeekEntries,
                lastWeekEntries,
                weekStart,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const result = await response.json();

        // 确保返回必要字段
        const currentStats = calculateWeekStats(currentWeekEntries);

        return {
            week_start: weekStart,
            total_duration: currentStats.totalDuration,
            exercise_stats: currentStats.exerciseStats,
            comparison_with_last_week: result.comparison_with_last_week || '暂无对比数据',
            improvement_suggestions: result.improvement_suggestions || '继续保持训练！',
            generated_at: result.generated_at || new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error generating weekly summary:', error);
        throw error;
    }
}

