import { Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
