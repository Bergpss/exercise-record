import type { DayRecord, ExerciseEntry } from '../../types';
import { getDayName, formatDateShort, isToday, formatDate } from '../../utils/dateUtils';
import './DayCard.css';

interface DayCardProps {
    date: Date;
    record: DayRecord | null;
    onAddClick: (date: string) => void;
    onEditClick: (entryId: string) => void;
    onDeleteClick: (entryId: string) => void;
}

// 将相同动作的记录分组
function groupEntriesByExercise(entries: ExerciseEntry[]): Map<string, ExerciseEntry[]> {
    const groups = new Map<string, ExerciseEntry[]>();
    entries.forEach((entry) => {
        const existing = groups.get(entry.exercise);
        if (existing) {
            existing.push(entry);
        } else {
            groups.set(entry.exercise, [entry]);
        }
    });
    return groups;
}

export function DayCard({
    date,
    record,
    onAddClick,
    onEditClick,
    onDeleteClick,
}: DayCardProps) {
    const today = isToday(date);
    const hasEntries = record && record.entries.length > 0;
    const dateStr = formatDate(date);

    // 将相同动作的记录分组
    const groupedEntries = hasEntries ? groupEntriesByExercise(record.entries) : new Map();

    return (
        <div className={`day-card ${today ? 'is-today' : ''} ${!hasEntries ? 'is-rest' : ''}`}>
            <div className="day-card-header">
                <div className="day-info">
                    <span className="day-name">{getDayName(date)}</span>
                    <span className="day-date">{formatDateShort(date)}</span>
                </div>
                {today && <span className="today-badge">今天</span>}
            </div>

            {hasEntries && (
                <div className="day-stats">
                    <div className="stat-item">
                        <span className="stat-icon">⏱️</span>
                        <span className="stat-value">{record.totalDuration}</span>
                        <span className="stat-label">分钟</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">🏋️</span>
                        <span className="stat-value">{groupedEntries.size}</span>
                        <span className="stat-label">个动作</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">📊</span>
                        <span className="stat-value">{record.entries.length}</span>
                        <span className="stat-label">组</span>
                    </div>
                </div>
            )}

            <div className="day-card-content">
                {hasEntries ? (
                    <div className="exercise-list">
                        {Array.from(groupedEntries.entries()).map(([exercise, entries]) => (
                            <div key={exercise} className="exercise-item">
                                <div className="exercise-header">
                                    <span className="exercise-name">{exercise}</span>
                                    <span className="exercise-sets-count">{entries.length}组</span>
                                </div>
                                <div className="exercise-sets">
                                    {entries.map((entry: ExerciseEntry) => (
                                        <div key={entry.id} className="exercise-set">
                                            <span className="set-details">
                                                {entry.weight ? (
                                                    <span className="set-weight">{entry.weight}kg</span>
                                                ) : (
                                                    <span className="set-weight bodyweight">徒手</span>
                                                )}
                                                <span className="set-count">×{entry.count}</span>
                                            </span>
                                            <div className="set-actions">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => onEditClick(entry.id)}
                                                    title="编辑"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => onDeleteClick(entry.id)}
                                                    title="删除"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-day">
                        <span className="empty-day-icon">😴</span>
                        <span>休息日</span>
                    </div>
                )}
            </div>

            <button className="add-exercise-btn" onClick={() => onAddClick(dateStr)}>
                + 添加训练
            </button>
        </div>
    );
}
