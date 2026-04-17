import { useEffect, useRef } from 'react';
import AppRouter from './routes';
import { useAuthStore } from './stores/authStore';
import './App.scss';

function App() {
  const { checkAuth } = useAuthStore();
  const initRef = useRef(false);

  useEffect(() => {
    // 应用初始化时检查登录状态（只执行一次）
    if (!initRef.current) {
      initRef.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  return <AppRouter />;
}

export default App;
