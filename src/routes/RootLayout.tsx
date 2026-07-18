import { Outlet } from 'react-router-dom';
import { ErrorBoundary, ScrollToTop } from '../components/common';

export function RootLayout() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Outlet />
    </ErrorBoundary>
  );
}