import { useState, useEffect } from 'react';
import type { ExerciseFormData, ExerciseEntry } from '../../types';
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
        count: 0,
        duration: 0,
        weight: undefined,
        feeling: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                exercise: initialData.exercise,
                count: initialData.count,
                duration: initialData.duration,
                weight: initialData.weight,
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
        onSubmit(formData);
        handleClose();
    };

    const handleClose = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            exercise: '',
            count: 0,
            duration: 0,
            weight: undefined,
            feeling: '',
        });
        onClose();
    };

    const selectExercise = (exercise: string) => {
        setFormData((prev) => ({ ...prev, exercise }));
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
                                        className={`suggestion-btn ${formData.exercise === exercise ? 'active' : ''
                                            }`}
                                        onClick={() => selectExercise(exercise)}
                                    >
                                        {exercise}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">数量（次/组）</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="0"
                                    value={formData.count || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            count: parseInt(e.target.value) || 0,
                                        }))
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">时长（分钟）</label>
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
                        </div>

                        <div className="form-group">
                            <label className="label">负重（kg）</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                step="0.5"
                                placeholder="不填写表示徒手训练"
                                value={formData.weight || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        weight: e.target.value ? parseFloat(e.target.value) : undefined,
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
