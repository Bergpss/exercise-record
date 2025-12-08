import type { WeeklySummary as WeeklySummaryType, ExerciseEntry } from '../../types';
import './WeeklySummary.css';

interface WeeklySummaryProps {
    summary: WeeklySummaryType | null;
    entries: ExerciseEntry[];
    onGenerate: () => Promise<void>;
    isLoading: boolean;
}

export function WeeklySummary({
    summary,
    entries,
    onGenerate,
    isLoading,
}: WeeklySummaryProps) {

    // 计算本地统计
    const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);
    const exerciseStats: Record<string, number> = {};
    entries.forEach((entry) => {
        exerciseStats[entry.exercise] = (exerciseStats[entry.exercise] || 0) + entry.count;
    });

    const hasData = entries.length > 0;

    return (
        <div className="weekly-summary">
            <div className="summary-header">
                <h3 className="summary-title">
                    <span className="summary-icon">📊</span>
                    周总结
                </h3>
                <button
                    className={`btn btn-primary generate-btn ${isLoading ? 'loading' : ''}`}
                    onClick={onGenerate}
                    disabled={isLoading || !hasData}
                >
                    {isLoading ? (
                        <>
                            <span className="loading-spinner"></span>
                            生成中...
                        </>
                    ) : (
                        <>
                            <span>✨</span>
                            AI 生成总结
                        </>
                    )}
                </button>
            </div>

            <div className="summary-content">
                {!hasData ? (
                    <div className="no-summary">
                        <div className="no-summary-icon">📝</div>
                        <p className="no-summary-text">本周还没有训练记录</p>
                        <p>开始记录你的训练吧！</p>
                    </div>
                ) : (
                    <>
                        {/* 统计卡片 */}
                        <div className="summary-stats">
                            <div className="stat-card">
                                <div className="stat-card-value">{totalDuration}</div>
                                <div className="stat-card-label">总训练时长（分钟）</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-value">{entries.length}</div>
                                <div className="stat-card-label">训练次数</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-card-value">{Object.keys(exerciseStats).length}</div>
                                <div className="stat-card-label">训练动作种类</div>
                            </div>
                        </div>

                        {/* 动作统计标签 */}
                        <div className="exercise-stats">
                            {Object.entries(exerciseStats).map(([exercise, count]) => (
                                <div key={exercise} className="exercise-stat-tag">
                                    <span className="exercise-stat-name">{exercise}</span>
                                    <span className="exercise-stat-count">×{count}</span>
                                </div>
                            ))}
                        </div>

                        {/* AI 总结内容 */}
                        {summary && (
                            <div className="ai-section">
                                <h4 className="ai-section-title">
                                    <span>📈</span>
                                    周对比分析
                                </h4>
                                <div className="ai-content">{summary.comparison_with_last_week}</div>

                                <h4 className="ai-section-title">
                                    <span>💡</span>
                                    改进建议
                                </h4>
                                <div className="ai-content">{summary.improvement_suggestions}</div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
