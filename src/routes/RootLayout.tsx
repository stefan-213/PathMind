import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../components/providers/ErrorBoundary';
import { ScrollToTop } from '../components/providers/ScrollToTop';

export function RootLayout() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Outlet />
    </ErrorBoundary>
  );
}