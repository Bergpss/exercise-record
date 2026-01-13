import { GoogleGenAI } from '@google/genai';

// Vercel serverless function types
interface VercelRequest {
    method?: string;
    headers: Record<string, string | string[] | undefined>;
    body?: any;
    query?: Record<string, string | string[]>;
}

interface VercelResponse {
    status: (code: number) => VercelResponse;
    json: (data: any) => void;
    setHeader: (name: string, value: string) => void;
    end: () => void;
}

interface ExerciseEntry {
    id: string;
    date: string;
    exercise: string;
    count: number;
    duration: number;
    feeling: string;
    created_at: string;
}

interface RequestBody {
    currentWeekEntries: ExerciseEntry[];
    lastWeekEntries: ExerciseEntry[] | null;
    weekStart: string;
}

interface WeekStats {
    totalDuration: number;
    exerciseStats: Record<string, number>;
}

function calculateWeekStats(entries: ExerciseEntry[]): WeekStats {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    // Note: Cannot use both Access-Control-Allow-Credentials: true and Access-Control-Allow-Origin: *
    // Since we're using Bearer tokens, we don't need credentials, so we can use *
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Require authentication (Supabase access token)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
    const accessToken = bearerMatch?.[1]?.trim();

    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get environment variables
    // Support both formats: production (no prefix) and local development (VITE_ prefix)
    const supabaseUrlRaw = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseUrl = supabaseUrlRaw ? supabaseUrlRaw.replace(/\/+$/, '') : supabaseUrlRaw;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing environment variables:');
        console.error('  SUPABASE_URL:', supabaseUrlRaw ? 'found' : 'missing');
        console.error('  SUPABASE_ANON_KEY:', supabaseAnonKey ? 'found' : 'missing');
        console.error('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'found' : 'missing');
        console.error('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'found' : 'missing');
        return res.status(500).json({ error: 'Server configuration error: Missing Supabase credentials' });
    }

    // Validate token against Supabase Auth
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
        },
    });

    if (!userResponse.ok) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get API key from server environment
    // Support both formats: production (no prefix) and local development (VITE_ prefix)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not found in environment');
        console.error('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'found' : 'missing');
        console.error('  VITE_GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'found' : 'missing');
        return res.status(500).json({ error: 'Server configuration error: Gemini API key missing' });
    }

    try {
        const body: RequestBody = req.body;
        const { currentWeekEntries, lastWeekEntries, weekStart } = body;

        if (!currentWeekEntries || !weekStart) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const ai = new GoogleGenAI({ apiKey });

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
   - 本周总训练时长和有锻炼的天数
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

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response.text;
        if (!text) {
            throw new Error('AI response is empty');
        }

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to extract JSON from AI response');
        }

        let parsed: { comparison_with_last_week?: string; improvement_suggestions?: string };
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response text:', text);
            throw new Error('Failed to parse AI response as JSON');
        }

        const result = {
            week_start: weekStart,
            total_duration: currentStats.totalDuration,
            exercise_stats: currentStats.exerciseStats,
            comparison_with_last_week: parsed.comparison_with_last_week || '暂无对比数据',
            improvement_suggestions: parsed.improvement_suggestions || '继续保持训练！',
            generated_at: new Date().toISOString(),
        };

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error generating summary:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            error: 'Failed to generate summary',
            details: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
