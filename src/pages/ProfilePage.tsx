import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Result, Spin } from 'antd';
import { fetchEmployee } from '../api';
import ProfileCard from '../components/ProfileCard';
import type { Employee } from '../types';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    fetchEmployee(id)
      .then(setEmployee)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Result status="404" title="Çalışan Bulunamadı" subTitle="Bu QR kod geçerli bir profile bağlı değil." />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${employee.bgColorStart || '#f5f5f5'}, ${employee.bgColorEnd || '#e0e0e0'})`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <img
        src="/eco-logo-beyaz.svg"
        alt="Şirket Logosu"
        style={{ height: 62, marginTop: 48, marginBottom: 16 }}
      />
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <ProfileCard data={employee} />
      </div>
    </div>
  );
}
