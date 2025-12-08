import { GoogleGenAI } from '@google/genai';
import type { ExerciseEntry, WeeklySummary } from '../types';
import { calculateWeekStats } from './supabaseService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

/**
 * 生成周总结
 */
export async function generateWeeklySummary(
    currentWeekEntries: ExerciseEntry[],
    lastWeekEntries: ExerciseEntry[] | null,
    weekStart: string
): Promise<Omit<WeeklySummary, 'id' | 'user_id' | 'created_at'>> {
    if (!ai) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local');
    }

    const currentStats = calculateWeekStats(currentWeekEntries);
    const lastWeekStats = lastWeekEntries ? calculateWeekStats(lastWeekEntries) : null;

    const prompt = `
你是一位专业的健身教练助手。请根据以下健身数据生成一份鼓励性的周总结。

【本周训练数据】
- 总训练时长：${currentStats.totalDuration} 分钟
- 动作统计：${JSON.stringify(currentStats.exerciseStats, null, 2)}
- 详细记录：${JSON.stringify(currentWeekEntries.map(e => ({
        日期: e.date,
        动作: e.exercise,
        数量: e.count,
        时长: e.duration,
        感受: e.feeling
    })), null, 2)}

${lastWeekStats ? `【上周训练数据】
- 总训练时长：${lastWeekStats.totalDuration} 分钟
- 动作统计：${JSON.stringify(lastWeekStats.exerciseStats, null, 2)}` : '【上周数据】无上周数据'}

请生成包含以下两部分内容的总结（用中文回复）：

1. **周对比分析**（comparison_with_last_week）：
   - 本周总训练时长和次数
   - 与上周相比的变化（如有上周数据）
   - 哪些动作有进步，哪些需要加强
   - 用鼓励性的语气

2. **改进建议**（improvement_suggestions）：
   - 基于本周训练数据，给出具体可行的改进建议
   - 下周可以尝试的新训练方式
   - 保持动力的小贴士

请用 JSON 格式回复，格式如下：
{
  "comparison_with_last_week": "对比分析内容...",
  "improvement_suggestions": "改进建议内容..."
}

只返回 JSON，不要包含其他内容。
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-05-20',
            contents: prompt,
        });

        const text = response.text || '';

        // 提取 JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            week_start: weekStart,
            total_duration: currentStats.totalDuration,
            exercise_stats: currentStats.exerciseStats,
            comparison_with_last_week: parsed.comparison_with_last_week || '暂无对比数据',
            improvement_suggestions: parsed.improvement_suggestions || '继续保持训练！',
            generated_at: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error generating weekly summary:', error);
        throw error;
    }
}
