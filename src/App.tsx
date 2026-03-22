import { useEffect } from 'react';
import AppRouter from './routes';
import { useAuthStore } from './stores/authStore';
import './App.scss';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // 应用初始化时检查登录状态
    checkAuth();
  }, [checkAuth]);

  return <AppRouter />;
}

export default App;
