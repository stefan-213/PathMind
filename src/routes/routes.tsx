import { lazy } from 'react';
import { Navigate, Route, createRoutesFromElements } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from '../components/ProtectedRoute';
import { RootLayout } from './RootLayout';
import { HomePage } from '../pages/Home';

// 懒加载路由组件
const LoginPage = lazy(() => import('../pages/Auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/Auth').then(m => ({ default: m.RegisterPage })));
const TasksPage = lazy(() => import('../pages/Tasks').then(m => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('../pages/Tasks').then(m => ({ default: m.TaskDetailPage })));
const GraphPage = lazy(() => import('../pages/Graph').then(m => ({ default: m.GraphPage })));
const ConsultPage = lazy(() => import('../pages/Consult').then(m => ({ default: m.ConsultPage })));
const KnowledgeBasePage = lazy(() => import('../pages/KnowledgeBase').then(m => ({ default: m.KnowledgeBasePage })));
const ProfilePage = lazy(() => import('../pages/Profile').then(m => ({ default: m.ProfilePage })));

export const routes = createRoutesFromElements(
  <Route element={<RootLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
    <Route path="/task-detail" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
    <Route path="/graph" element={<ProtectedRoute><GraphPage /></ProtectedRoute>} />
    <Route path="/consult" element={<ProtectedRoute><ConsultPage /></ProtectedRoute>} />
    <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>
);
