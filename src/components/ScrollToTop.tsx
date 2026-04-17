import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 立即重置窗口滚动到顶部
    window.scrollTo(0, 0);

    // 重置任何可滚动父容器的滚动位置
    const resetScroll = () => {
      window.scrollTo(0, 0);
      const containers = document.querySelectorAll('.graph-wrapper, .chat-area, .main-content, .consult-main');
      containers.forEach(container => {
        if (container instanceof HTMLElement) {
          container.scrollTop = 0;
        }
      });
    };

    // 立即执行一次
    requestAnimationFrame(resetScroll);

    // Draw.io iframe 加载可能会导致滚动，多次延迟确保其初始化完成
    const timeout1 = setTimeout(resetScroll, 300);
    const timeout2 = setTimeout(resetScroll, 800);
    const timeout3 = setTimeout(resetScroll, 1500);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [pathname]);

  return null;
}