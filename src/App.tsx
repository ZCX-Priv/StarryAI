import useStore from '@/hooks/useStore';
import AppShell from '@/components/layout/AppShell';

export default function App() {
  const { initialized, error } = useStore();

  if (error) {
    return (
      <div style={{ padding: 40, color: 'var(--text-primary)' }}>
        <h2>初始化失败</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="loading-page">
        <img src="/logo.png" alt="星语" className="loading-logo" />
        <div className="loading-indicator">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
        <span className="loading-text">加载中</span>
      </div>
    );
  }

  return <AppShell />;
}
