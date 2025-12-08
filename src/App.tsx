import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header/Header';
import { WeekView } from './components/WeekView/WeekView';
import { ExerciseForm } from './components/ExerciseForm/ExerciseForm';
import { WeeklySummary as WeeklySummaryComponent } from './components/WeeklySummary/WeeklySummary';
import {
  getExerciseEntries,
  addExerciseEntry,
  updateExerciseEntry,
  deleteExerciseEntry,
  getWeeklySummary,
  saveWeeklySummary,
} from './services/supabaseService';
import { generateWeeklySummary } from './services/geminiService';
import {
  getWeekStart,
  getWeekEnd,
  formatDate,
  getPreviousWeekStart,
  getNextWeekStart,
} from './utils/dateUtils';
import type { DayRecord, ExerciseEntry, ExerciseFormData, WeeklySummary } from './types';
import './App.css';

function App() {
  // 当前周起始日期
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // 训练记录数据
  const [records, setRecords] = useState<Map<string, DayRecord>>(new Map());
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);

  // 周总结
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // 表单状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExerciseEntry | null>(null);
  const [defaultFormDate, setDefaultFormDate] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载周数据
  const loadWeekData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const weekStartStr = formatDate(currentWeekStart);
      const weekEndStr = formatDate(getWeekEnd(currentWeekStart));

      // 获取训练记录
      const entriesData = await getExerciseEntries(weekStartStr, weekEndStr);
      setEntries(entriesData);

      // 按日期分组
      const recordsMap = new Map<string, DayRecord>();
      entriesData.forEach((entry) => {
        const existing = recordsMap.get(entry.date);
        if (existing) {
          existing.entries.push(entry);
          existing.totalDuration += entry.duration;
        } else {
          recordsMap.set(entry.date, {
            date: entry.date,
            entries: [entry],
            totalDuration: entry.duration,
          });
        }
      });
      setRecords(recordsMap);

      // 获取周总结
      const summary = await getWeeklySummary(weekStartStr);
      setWeeklySummary(summary);
    } catch (err) {
      console.error('Error loading week data:', err);
      setError('加载数据失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  // 导航处理
  const handlePrevWeek = () => {
    setCurrentWeekStart(getPreviousWeekStart(currentWeekStart));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(getNextWeekStart(currentWeekStart));
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // 表单处理
  const handleAddClick = (date?: string) => {
    setEditingEntry(null);
    setDefaultFormDate(date || formatDate(new Date()));
    setIsFormOpen(true);
  };

  const handleEditClick = (entryId: string) => {
    const entry = entries.find((e) => e.id === entryId);
    if (entry) {
      setEditingEntry(entry);
      setDefaultFormDate(entry.date);
      setIsFormOpen(true);
    }
  };

  const handleDeleteClick = async (entryId: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      await deleteExerciseEntry(entryId);
      await loadWeekData();
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('删除失败，请重试');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    setDefaultFormDate('');
  };

  const handleFormSubmit = async (formData: ExerciseFormData) => {
    try {
      if (editingEntry) {
        await updateExerciseEntry(editingEntry.id, formData);
      } else {
        await addExerciseEntry(formData);
      }
      await loadWeekData();
    } catch (err) {
      console.error('Error saving entry:', err);
      alert('保存失败，请重试');
    }
  };

  // AI 周总结生成
  const handleGenerateSummary = async () => {
    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);

    try {
      const weekStartStr = formatDate(currentWeekStart);
      const prevWeekStart = getPreviousWeekStart(currentWeekStart);
      const prevWeekStartStr = formatDate(prevWeekStart);
      const prevWeekEndStr = formatDate(getWeekEnd(prevWeekStart));

      // 获取上周数据
      const lastWeekEntries = await getExerciseEntries(prevWeekStartStr, prevWeekEndStr);

      // 生成总结
      const summaryData = await generateWeeklySummary(
        entries,
        lastWeekEntries.length > 0 ? lastWeekEntries : null,
        weekStartStr
      );

      // 保存总结
      const savedSummary = await saveWeeklySummary(summaryData);
      setWeeklySummary(savedSummary);
    } catch (err) {
      console.error('Error generating summary:', err);
      alert('生成总结失败，请检查 API 配置');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="app">
      <Header
        currentWeekStart={currentWeekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onAddClick={() => handleAddClick()}
      />

      <main className="main-content">
        {error ? (
          <div className="error-message">
            <span>❌</span>
            <span>{error}</span>
            <button className="btn btn-secondary" onClick={loadWeekData}>
              重试
            </button>
          </div>
        ) : isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner large"></div>
            <span>加载中...</span>
          </div>
        ) : (
          <>
            <WeekView
              weekStart={currentWeekStart}
              records={records}
              onAddClick={handleAddClick}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />

            <WeeklySummaryComponent
              summary={weeklySummary}
              entries={entries}
              onGenerate={handleGenerateSummary}
              isLoading={isGeneratingSummary}
            />
          </>
        )}
      </main>

      <ExerciseForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingEntry}
        defaultDate={defaultFormDate}
      />
    </div>
  );
}

export default App;
