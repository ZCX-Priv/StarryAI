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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        加载中...
      </div>
    );
  }

  return <AppShell />;
}
