import type { DayRecord } from '../../types';
import { getWeekDates, formatDate } from '../../utils/dateUtils';
import { DayCard } from '../DayCard/DayCard';
import './WeekView.css';

interface WeekViewProps {
    weekStart: Date;
    records: Map<string, DayRecord>;
    onAddClick: (date: string) => void;
    onEditClick: (entryId: string) => void;
    onDeleteClick: (entryId: string) => void;
}

export function WeekView({
    weekStart,
    records,
    onAddClick,
    onEditClick,
    onDeleteClick,
}: WeekViewProps) {
    const weekDates = getWeekDates(weekStart);

    return (
        <div className="week-view">
            <div className="week-grid">
                {weekDates.map((date) => {
                    const dateStr = formatDate(date);
                    const record = records.get(dateStr) || null;

                    return (
                        <DayCard
                            key={dateStr}
                            date={date}
                            record={record}
                            onAddClick={onAddClick}
                            onEditClick={onEditClick}
                            onDeleteClick={onDeleteClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}
