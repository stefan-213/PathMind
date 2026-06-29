import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScrollToTop } from '../components/ScrollToTop';

export function RootLayout() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Outlet />
    </ErrorBoundary>
  );
}