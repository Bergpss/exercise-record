import { formatWeekRange } from '../../utils/dateUtils';
import './Header.css';

interface HeaderProps {
    currentWeekStart: Date;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onToday: () => void;
    onAddClick: () => void;
}

export function Header({
    currentWeekStart,
    onPrevWeek,
    onNextWeek,
    onToday,
    onAddClick,
}: HeaderProps) {
    return (
        <header className="header">
            <div className="header-brand">
                <span className="header-logo">💪</span>
                <h1 className="header-title">健身记录</h1>
            </div>

            <div className="header-nav">
                <div className="week-navigator">
                    <button className="nav-btn" onClick={onPrevWeek} title="上一周">
                        ←
                    </button>
                    <span className="week-display">{formatWeekRange(currentWeekStart)}</span>
                    <button className="nav-btn" onClick={onNextWeek} title="下一周">
                        →
                    </button>
                    <button className="today-btn" onClick={onToday}>
                        今天
                    </button>
                </div>

                <button className="btn btn-primary" onClick={onAddClick}>
                    <span>+</span>
                    <span>添加记录</span>
                </button>
            </div>
        </header>
    );
}
