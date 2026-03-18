import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(
  routes.map((route) => ({
    path: route.path,
    element: route.element,
  }))
);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
