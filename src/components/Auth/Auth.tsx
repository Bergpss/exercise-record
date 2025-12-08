import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('注册成功！请查看邮箱确认链接（如果启用了邮箱确认）');
                }
            }
        } catch (err) {
            setError('发生未知错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-logo">💪</span>
                    <h1 className="auth-title">健身记录</h1>
                    <p className="auth-subtitle">
                        {isLogin ? '登录您的账户' : '创建新账户'}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">邮箱</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">密码</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span>❌</span> {error}
                        </div>
                    )}

                    {message && (
                        <div className="auth-message">
                            <span>✅</span> {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`btn btn-primary auth-submit ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                处理中...
                            </>
                        ) : isLogin ? (
                            '登录'
                        ) : (
                            '注册'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isLogin ? '还没有账户？' : '已有账户？'}
                        <button
                            type="button"
                            className="auth-switch-btn"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setMessage(null);
                            }}
                        >
                            {isLogin ? '注册' : '登录'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
