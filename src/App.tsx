import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth/Auth';
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
  const { user, loading: authLoading, signOut } = useAuth();

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

  // 将 entries 转换为 records Map 的辅助函数
  const entriesToRecordsMap = useCallback((entriesData: ExerciseEntry[]) => {
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
    return recordsMap;
  }, []);

  // 加载周数据（只在首次加载或切换周时显示loading）
  const loadWeekData = useCallback(async (showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const weekStartStr = formatDate(currentWeekStart);
      const weekEndStr = formatDate(getWeekEnd(currentWeekStart));

      // 获取训练记录
      const entriesData = await getExerciseEntries(weekStartStr, weekEndStr);
      setEntries(entriesData);
      setRecords(entriesToRecordsMap(entriesData));

      // 获取周总结
      const summary = await getWeeklySummary(weekStartStr);
      setWeeklySummary(summary);
    } catch (err) {
      console.error('Error loading week data:', err);
      setError('加载数据失败，请检查网络连接');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [currentWeekStart, user, entriesToRecordsMap]);

  useEffect(() => {
    if (user) {
      loadWeekData();
    }
  }, [loadWeekData, user]);

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

    // 乐观更新：立即从本地状态中移除
    const deletedEntry = entries.find((e) => e.id === entryId);
    const newEntries = entries.filter((e) => e.id !== entryId);
    setEntries(newEntries);
    setRecords(entriesToRecordsMap(newEntries));

    try {
      await deleteExerciseEntry(entryId);
      // 后台静默刷新数据以确保同步
      loadWeekData(false);
    } catch (err) {
      console.error('Error deleting entry:', err);
      // 回滚：恢复被删除的记录
      if (deletedEntry) {
        const restoredEntries = [...newEntries, deletedEntry].sort(
          (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)
        );
        setEntries(restoredEntries);
        setRecords(entriesToRecordsMap(restoredEntries));
      }
      alert('删除失败，请重试');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    setDefaultFormDate('');
  };

  const handleFormSubmit = async (formData: ExerciseFormData) => {
    // 创建临时的乐观更新数据
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticEntry: ExerciseEntry = {
      id: editingEntry?.id || tempId,
      user_id: user?.id || '',
      date: formData.date,
      exercise: formData.exercise,
      count: formData.count,
      duration: formData.duration,
      weight: formData.weight,
      feeling: formData.feeling,
      created_at: editingEntry?.created_at || now,
      updated_at: now,
    };

    // 乐观更新本地状态
    let newEntries: ExerciseEntry[];
    if (editingEntry) {
      newEntries = entries.map((e) => (e.id === editingEntry.id ? optimisticEntry : e));
    } else {
      newEntries = [...entries, optimisticEntry];
    }
    newEntries.sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
    setEntries(newEntries);
    setRecords(entriesToRecordsMap(newEntries));

    try {
      if (editingEntry) {
        await updateExerciseEntry(editingEntry.id, formData);
      } else {
        await addExerciseEntry(formData);
      }
      // 后台静默刷新以获取正确的服务器数据（如真实ID）
      loadWeekData(false);
    } catch (err) {
      console.error('Error saving entry:', err);
      // 回滚：重新加载数据
      loadWeekData(false);
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

  // 登出处理
  const handleSignOut = async () => {
    await signOut();
  };

  // 认证加载中
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-state full-screen">
          <div className="loading-spinner large"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  // 未登录显示登录页面
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      <Header
        currentWeekStart={currentWeekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        onAddClick={() => handleAddClick()}
        userEmail={user.email}
        onSignOut={handleSignOut}
      />

      <main className="main-content">
        {error ? (
          <div className="error-message">
            <span>❌</span>
            <span>{error}</span>
            <button className="btn btn-secondary" onClick={() => loadWeekData()}>
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
