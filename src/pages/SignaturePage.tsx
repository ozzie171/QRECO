import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { App, Button, Input, Result, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { fetchEmployee, fetchSignatureExtraLogo } from '../api';
import { buildEmailSignatureHtml, type SignatureImageMode } from '../lib/emailSignature';
import type { Employee } from '../types';

const { Title, Text } = Typography;

export default function SignaturePage() {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode: SignatureImageMode = searchParams.get('mode') === 'photo' ? 'photo' : 'qr';

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [extraLogoUrl, setExtraLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    Promise.all([fetchEmployee(id), fetchSignatureExtraLogo().catch(() => null)])
      .then(([emp, logoUrl]) => {
        setEmployee(emp);
        setExtraLogoUrl(logoUrl);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#141414',
        }}
      >
        <img
          src="/eco-logo-beyaz.svg"
          alt="Yükleniyor"
          style={{ width: 100, animation: 'qreco-pulse 1.4s ease-in-out infinite' }}
        />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Result status="404" title="İmza Bulunamadı" subTitle="Bu bağlantı geçerli bir mail imzasına bağlı değil." />
      </div>
    );
  }

  const signatureHtml = buildEmailSignatureHtml(employee, mode, extraLogoUrl);
  const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(' ');

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': new Blob([signatureHtml], { type: 'text/html' }),
            'text/plain': new Blob([signatureHtml], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(signatureHtml);
      }
      message.success('İmza panoya kopyalandı. Mail imza kutunuza yapıştırabilirsiniz.');
    } catch {
      message.error('Panoya kopyalanırken bir hata oluştu. Aşağıdaki kutudan manuel olarak kopyalayabilirsiniz.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f6f6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
      }}
    >
      <img src="/eco-logo-kirmizi.svg" alt="eco" style={{ height: 40, marginBottom: 24 }} />
      <Title level={4} style={{ marginBottom: 4, textAlign: 'center' }}>
        {fullName} · Mail İmzanız Hazır
      </Title>
      <Text type="secondary" style={{ marginBottom: 24, textAlign: 'center', maxWidth: 480 }}>
        Aşağıdaki "Kodu Kopyala" butonuna bastıktan sonra mail imza düzenleme kutunuza (Gmail, Outlook vb.)
        doğrudan yapıştırabilirsiniz.
      </Text>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          maxWidth: 760,
          width: '100%',
          overflow: 'auto',
        }}
      >
        <iframe
          title="Mail İmzası Önizleme"
          srcDoc={`<html><body style="margin:0;">${signatureHtml}</body></html>`}
          style={{ width: '100%', height: 280, border: 'none' }}
        />
      </div>

      <Button type="primary" size="large" icon={<CopyOutlined />} onClick={handleCopy} style={{ marginBottom: 20 }}>
        Kodu Kopyala
      </Button>

      <div style={{ maxWidth: 760, width: '100%' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Kopyalama çalışmazsa aşağıdaki kutudan kodu seçip manuel olarak kopyalayabilirsiniz.
        </Text>
        <Input.TextArea value={signatureHtml} readOnly autoSize={{ minRows: 4, maxRows: 10 }} />
      </div>
    </div>
  );
}
