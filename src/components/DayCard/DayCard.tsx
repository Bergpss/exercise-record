import type { DayRecord } from '../../types';
import { getDayName, formatDate, formatDateShort, isToday } from '../../utils/dateUtils';
import './DayCard.css';

interface DayCardProps {
    date: Date;
    record: DayRecord | null;
    onAddClick: (date: string) => void;
    onEditClick: (entryId: string) => void;
    onDeleteClick: (entryId: string) => void;
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
                        <span className="stat-value">{record.entries.length}</span>
                        <span className="stat-label">项</span>
                    </div>
                </div>
            )}

            <div className="day-card-content">
                {hasEntries ? (
                    <div className="exercise-list">
                        {record.entries.map((entry) => (
                            <div key={entry.id} className="exercise-item">
                                <div className="exercise-info">
                                    <span className="exercise-name">{entry.exercise}</span>
                                    <span className="exercise-count">×{entry.count}</span>
                                    {entry.weight ? (
                                        <span className="exercise-weight">{entry.weight}kg</span>
                                    ) : (
                                        <span className="exercise-weight bodyweight">徒手</span>
                                    )}
                                    <span className="exercise-duration">{entry.duration}分钟</span>
                                </div>
                                <div className="exercise-actions">
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
