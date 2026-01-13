import { useState, useEffect } from 'react';
import type { ExerciseFormData, ExerciseEntry, ExerciseSet, UserExercise } from '../../types';
import { COMMON_EXERCISES } from '../../types';
import {
    getUserExercises,
    addUserExercise,
    updateUserExercise,
    deleteUserExercise,
    getHiddenPresetExercises,
    hidePresetExercise,
} from '../../services/supabaseService';
import './ExerciseForm.css';

interface ExerciseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ExerciseFormData) => void;
    initialData?: ExerciseEntry | null;
    defaultDate?: string;
}

export function ExerciseForm({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    defaultDate,
}: ExerciseFormProps) {
    const [formData, setFormData] = useState<ExerciseFormData>({
        date: defaultDate || new Date().toISOString().split('T')[0],
        exercise: '',
        sets: [{ count: 0, weight: undefined }],
        duration: 0,
        feeling: '',
    });
    const [userExercises, setUserExercises] = useState<UserExercise[]>([]);
    const [hiddenPresetExercises, setHiddenPresetExercises] = useState<string[]>([]);
    const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
    const [editingExerciseName, setEditingExerciseName] = useState<string>('');
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');

    // 加载用户自定义动作和隐藏的预设动作
    useEffect(() => {
        if (isOpen) {
            loadUserExercises();
            loadHiddenPresetExercises();
        }
    }, [isOpen]);

    const loadUserExercises = async () => {
        try {
            const exercises = await getUserExercises();
            // 过滤掉隐藏的预设动作（这些单独管理）
            setUserExercises(exercises.filter((ex) => !ex.is_hidden_preset));
        } catch (error) {
            console.error('Failed to load user exercises:', error);
        }
    };

    const loadHiddenPresetExercises = async () => {
        try {
            const hidden = await getHiddenPresetExercises();
            setHiddenPresetExercises(hidden);
        } catch (error) {
            console.error('Failed to load hidden preset exercises:', error);
        }
    };

    useEffect(() => {
        if (initialData) {
            // 兼容旧数据：将单条记录转换为一组
            setFormData({
                date: initialData.date,
                exercise: initialData.exercise,
                sets: [{ count: initialData.count, weight: initialData.weight }],
                duration: initialData.duration,
                feeling: initialData.feeling,
            });
        } else if (defaultDate) {
            setFormData((prev) => ({ ...prev, date: defaultDate }));
        }
    }, [initialData, defaultDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.exercise.trim()) {
            alert('请输入训练动作');
            return;
        }
        if (formData.sets.length === 0) {
            alert('请至少添加一组训练');
            return;
        }

        // 自动保存用户输入的动作到常用动作列表
        const exerciseName = formData.exercise.trim();
        const isDefaultExercise = COMMON_EXERCISES.includes(exerciseName as any);
        const isUserExercise = userExercises.some((ue) => ue.exercise === exerciseName);

        if (!isDefaultExercise && !isUserExercise) {
            try {
                await addUserExercise(exerciseName);
                await loadUserExercises();
                await loadHiddenPresetExercises();
            } catch (error) {
                console.error('Failed to save exercise:', error);
                // 即使保存失败也继续提交表单
            }
        }

        onSubmit(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            exercise: '',
            sets: [{ count: 0, weight: undefined }],
            duration: 0,
            feeling: '',
        });
        onClose();
    };

    const selectExercise = (exercise: string) => {
        setFormData((prev) => ({ ...prev, exercise }));
    };

    const addSet = () => {
        setFormData((prev) => ({
            ...prev,
            sets: [...prev.sets, { count: 0, weight: undefined }],
        }));
    };

    const removeSet = (index: number) => {
        if (formData.sets.length <= 1) {
            alert('至少保留一组训练');
            return;
        }
        setFormData((prev) => ({
            ...prev,
            sets: prev.sets.filter((_, i) => i !== index),
        }));
    };

    const updateSet = (index: number, field: keyof ExerciseSet, value: number | undefined) => {
        setFormData((prev) => ({
            ...prev,
            sets: prev.sets.map((set, i) =>
                i === index ? { ...set, [field]: value } : set
            ),
        }));
    };

    // 开始编辑动作
    const startEditExercise = (exercise: UserExercise) => {
        setEditingExerciseId(exercise.id);
        setEditingExerciseName(exercise.exercise);
    };

    // 保存编辑的动作
    const saveEditExercise = async () => {
        if (!editingExerciseId || !editingExerciseName.trim()) {
            return;
        }

        try {
            // 保存旧的动作名称，用于检查是否需要更新表单
            const oldExercise = userExercises.find((ue) => ue.id === editingExerciseId);
            const wasSelected = oldExercise && formData.exercise === oldExercise.exercise;

            await updateUserExercise(editingExerciseId, editingExerciseName.trim());
            await loadUserExercises();
            await loadHiddenPresetExercises();
            setEditingExerciseId(null);
            setEditingExerciseName('');

            // 如果当前选中的动作被编辑了，更新表单
            if (wasSelected) {
                setFormData((prev) => ({ ...prev, exercise: editingExerciseName.trim() }));
            }
        } catch (error) {
            console.error('Failed to update exercise:', error);
            alert('更新动作失败，请重试');
        }
    };

    // 取消编辑
    const cancelEditExercise = () => {
        setEditingExerciseId(null);
        setEditingExerciseName('');
    };

    // 删除动作
    const handleDeleteExercise = async (id: string) => {
        if (!confirm('确定要删除这个常用动作吗？')) {
            return;
        }

        try {
            await deleteUserExercise(id);
            await loadUserExercises();
            await loadHiddenPresetExercises();

            // 如果当前选中的动作被删除了，清空表单
            const deletedExercise = userExercises.find((ue) => ue.id === id);
            if (deletedExercise && formData.exercise === deletedExercise.exercise) {
                setFormData((prev) => ({ ...prev, exercise: '' }));
            }
        } catch (error) {
            console.error('Failed to delete exercise:', error);
            alert('删除动作失败，请重试');
        }
    };

    // 添加新动作
    const handleAddExercise = async () => {
        if (!newExerciseName.trim()) {
            return;
        }

        try {
            await addUserExercise(newExerciseName.trim());
            await loadUserExercises();
            await loadHiddenPresetExercises();
            setNewExerciseName('');
            setIsAddingExercise(false);
        } catch (error) {
            console.error('Failed to add exercise:', error);
            alert('添加动作失败，请重试');
        }
    };

    // 隐藏预设动作
    const handleHidePresetExercise = async (exercise: string) => {
        if (!confirm(`确定要隐藏"${exercise}"这个预设动作吗？`)) {
            return;
        }

        try {
            await hidePresetExercise(exercise);
            await loadHiddenPresetExercises();

            // 如果当前选中的动作被隐藏了，清空表单
            if (formData.exercise === exercise) {
                setFormData((prev) => ({ ...prev, exercise: '' }));
            }
        } catch (error) {
            console.error('Failed to hide preset exercise:', error);
            alert('隐藏动作失败，请重试');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {initialData ? '编辑训练记录' : '添加训练记录'}
                    </h2>
                    <button className="modal-close" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                <form className="exercise-form" onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="label">日期</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">训练动作</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="输入或选择训练动作"
                                value={formData.exercise}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, exercise: e.target.value }))
                                }
                            />
                            <div className="exercise-suggestions">
                                {/* 默认预设动作 */}
                                {COMMON_EXERCISES.filter(
                                    (exercise) => !hiddenPresetExercises.includes(exercise)
                                ).map((exercise) => (
                                    <div key={exercise} className="exercise-item">
                                        <button
                                            type="button"
                                            className={`suggestion-btn ${
                                                formData.exercise === exercise ? 'active' : ''
                                            }`}
                                            onClick={() => selectExercise(exercise)}
                                        >
                                            {exercise}
                                        </button>
                                        <button
                                            type="button"
                                            className="exercise-edit-btn delete"
                                            onClick={() => handleHidePresetExercise(exercise)}
                                            title="隐藏"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {/* 用户自定义动作 */}
                                {userExercises.map((userExercise) => {
                                    if (editingExerciseId === userExercise.id) {
                                        return (
                                            <div key={userExercise.id} className="exercise-edit-item">
                                                <input
                                                    type="text"
                                                    className="input input-sm"
                                                    value={editingExerciseName}
                                                    onChange={(e) => setEditingExerciseName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            saveEditExercise();
                                                        } else if (e.key === 'Escape') {
                                                            cancelEditExercise();
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    className="exercise-edit-btn save"
                                                    onClick={saveEditExercise}
                                                    title="保存"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    type="button"
                                                    className="exercise-edit-btn cancel"
                                                    onClick={cancelEditExercise}
                                                    title="取消"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={userExercise.id} className="exercise-item">
                                            <button
                                                type="button"
                                                className={`suggestion-btn ${
                                                    formData.exercise === userExercise.exercise ? 'active' : ''
                                                }`}
                                                onClick={() => selectExercise(userExercise.exercise)}
                                            >
                                                {userExercise.exercise}
                                            </button>
                                            <button
                                                type="button"
                                                className="exercise-edit-btn edit"
                                                onClick={() => startEditExercise(userExercise)}
                                                title="编辑"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                type="button"
                                                className="exercise-edit-btn delete"
                                                onClick={() => handleDeleteExercise(userExercise.id)}
                                                title="删除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* 添加新动作 */}
                                {isAddingExercise ? (
                                    <div className="exercise-edit-item">
                                        <input
                                            type="text"
                                            className="input input-sm"
                                            placeholder="输入动作名称"
                                            value={newExerciseName}
                                            onChange={(e) => setNewExerciseName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddExercise();
                                                } else if (e.key === 'Escape') {
                                                    setIsAddingExercise(false);
                                                    setNewExerciseName('');
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="exercise-edit-btn save"
                                            onClick={handleAddExercise}
                                            title="添加"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="exercise-edit-btn cancel"
                                            onClick={() => {
                                                setIsAddingExercise(false);
                                                setNewExerciseName('');
                                            }}
                                            title="取消"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="suggestion-btn add-exercise-btn"
                                        onClick={() => setIsAddingExercise(true)}
                                        title="添加常用动作"
                                    >
                                        + 添加
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="sets-header">
                                <label className="label">训练组数</label>
                                <button type="button" className="add-set-btn" onClick={addSet}>
                                    + 添加一组
                                </button>
                            </div>
                            <div className="sets-list">
                                {formData.sets.map((set, index) => (
                                    <div key={index} className="set-row">
                                        <span className="set-number">第{index + 1}组</span>
                                        <div className="set-inputs">
                                            <div className="set-input-group">
                                                <label className="set-label">负重（kg）</label>
                                                <input
                                                    type="number"
                                                    className="input input-sm"
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="徒手"
                                                    value={set.weight || ''}
                                                    onChange={(e) =>
                                                        updateSet(
                                                            index,
                                                            'weight',
                                                            e.target.value ? parseFloat(e.target.value) : undefined
                                                        )
                                                    }
                                                />
                                            </div>
                                            <span className="set-separator">×</span>
                                            <div className="set-input-group">
                                                <label className="set-label">次数</label>
                                                <input
                                                    type="number"
                                                    className="input input-sm"
                                                    min="0"
                                                    value={set.count || ''}
                                                    onChange={(e) =>
                                                        updateSet(
                                                            index,
                                                            'count',
                                                            parseInt(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-set-btn"
                                                onClick={() => removeSet(index)}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">总时长（分钟）</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                value={formData.duration || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        duration: parseInt(e.target.value) || 0,
                                    }))
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">训练感受</label>
                            <textarea
                                className="textarea"
                                placeholder="记录一下今天的训练感受..."
                                value={formData.feeling}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, feeling: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleClose}>
                            取消
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {initialData ? '保存修改' : '添加记录'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
