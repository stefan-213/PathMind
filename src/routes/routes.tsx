import { Navigate, Route, createRoutesFromElements } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';
import { HomePage } from '../pages/Home';
import { TaskDetailPage, TasksPage } from '../pages/Tasks';
import { GraphPage } from '../pages/Graph';
import { ConsultPage } from '../pages/Consult';
import { ProfilePage } from '../pages/Profile';
import { LoginPage, RegisterPage } from '../pages/Auth';
import { RootLayout } from './RootLayout';

export const routes = createRoutesFromElements(
  <Route element={<RootLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
    <Route path="/task-detail" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
    <Route path="/graph" element={<ProtectedRoute><GraphPage /></ProtectedRoute>} />
    <Route path="/consult" element={<ProtectedRoute><ConsultPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
);
