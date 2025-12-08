/**
 * 获取指定日期所在周的起始日期（周一）
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * 获取指定日期所在周的结束日期（周日）
 */
export function getWeekEnd(date: Date): Date {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * 获取一周中的所有日期
 */
export function getWeekDates(weekStart: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        dates.push(d);
    }
    return dates;
}

/**
 * 获取星期几的中文名称
 */
export function getDayName(date: Date): string {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
}

/**
 * 获取上一周的起始日期
 */
export function getPreviousWeekStart(weekStart: Date): Date {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    return prev;
}

/**
 * 获取下一周的起始日期
 */
export function getNextWeekStart(weekStart: Date): Date {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    return next;
}

/**
 * 判断是否是今天
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return formatDate(date) === formatDate(today);
}

/**
 * 格式化日期显示（MM/DD）
 */
export function formatDateShort(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

/**
 * 格式化周范围显示
 */
export function formatWeekRange(weekStart: Date): string {
    const weekEnd = getWeekEnd(weekStart);
    const startMonth = weekStart.getMonth() + 1;
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.getMonth() + 1;
    const endDay = weekEnd.getDate();

    if (startMonth === endMonth) {
        return `${startMonth}月${startDay}日 - ${endDay}日`;
    }
    return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
}
