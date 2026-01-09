import { useState, useEffect } from 'react';
import type { ExerciseFormData, ExerciseEntry, ExerciseSet } from '../../types';
import { COMMON_EXERCISES } from '../../types';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.exercise.trim()) {
            alert('请输入训练动作');
            return;
        }
        if (formData.sets.length === 0) {
            alert('请至少添加一组训练');
            return;
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
                                {COMMON_EXERCISES.map((exercise) => (
                                    <button
                                        key={exercise}
                                        type="button"
                                        className={`suggestion-btn ${
                                            formData.exercise === exercise ? 'active' : ''
                                        }`}
                                        onClick={() => selectExercise(exercise)}
                                    >
                                        {exercise}
                                    </button>
                                ))}
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
