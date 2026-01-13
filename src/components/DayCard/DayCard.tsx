import { useState } from 'react';
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
    
    // 管理每个动作的展开/收起状态，默认全部收起
    const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
    
    const toggleExercise = (exercise: string) => {
        setExpandedExercises((prev) => {
            const next = new Set(prev);
            if (next.has(exercise)) {
                next.delete(exercise);
            } else {
                next.add(exercise);
            }
            return next;
        });
    };

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

            {record?.warmup && (
                <div className="warmup-card">
                    <div className="warmup-header">
                        <span className="warmup-icon">🔥</span>
                        <span className="warmup-title">热身</span>
                        {record.warmup.duration > 0 && (
                            <span className="warmup-duration">{record.warmup.duration}分钟</span>
                        )}
                    </div>
                    {record.warmup.description && (
                        <div className="warmup-description">{record.warmup.description}</div>
                    )}
                </div>
            )}

            <div className="day-card-content">
                {hasEntries ? (
                    <div className="exercise-list">
                        {Array.from(groupedEntries.entries()).map(([exercise, entries]) => {
                            const isExpanded = expandedExercises.has(exercise);
                            return (
                                <div key={exercise} className="exercise-item">
                                    <div 
                                        className="exercise-header"
                                        onClick={() => toggleExercise(exercise)}
                                    >
                                        <div className="exercise-header-left">
                                            <button className="expand-toggle" title={isExpanded ? '收起' : '展开'}>
                                                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                                            </button>
                                            <span className="exercise-name">{exercise}</span>
                                        </div>
                                        <span className="exercise-sets-count">{entries.length}组</span>
                                    </div>
                                    {isExpanded && (
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEditClick(entry.id);
                                                            }}
                                                            title="编辑"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteClick(entry.id);
                                                            }}
                                                            title="删除"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
