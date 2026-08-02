import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { Skeleton } from '../components/common';

const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
});

function PageSkeleton() {
  return (
    <div style={{
      padding: '60px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      <Skeleton height={32} width="60%" />
      <Skeleton height={16} width="40%" />
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <Skeleton height={44} width={120} borderRadius="999px" />
        <Skeleton height={44} width={120} borderRadius="999px" />
      </div>
      <div style={{ marginTop: '24px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={14} style={{ marginBottom: '12px' }} />
        ))}
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}