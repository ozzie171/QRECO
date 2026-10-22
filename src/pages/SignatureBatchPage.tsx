import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { App, Button, Input, Result, Select, Spin, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { fetchEmployee, fetchSignatureExtraLogo } from '../api';
import { buildEmailSignatureHtml, type SignatureImageMode } from '../lib/emailSignature';
import type { Employee } from '../types';

const { Title, Text } = Typography;

/** Shared, multi-employee version of SignaturePage: one link (listing
 * several employee ids) that each person opens, picks their own name from,
 * and copies their own signature from — so an admin can hand out a single
 * link to a whole team instead of one link per person. */
export default function SignatureBatchPage() {
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const ids = useMemo(
    () => Array.from(new Set((searchParams.get('ids') || '').split(',').map((id) => id.trim()).filter(Boolean))),
    [searchParams],
  );
  const mode: SignatureImageMode = searchParams.get('mode') === 'photo' ? 'photo' : 'qr';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extraLogoUrl, setExtraLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      Promise.allSettled(ids.map((id) => fetchEmployee(id))),
      fetchSignatureExtraLogo().catch(() => null),
    ]).then(([results, logoUrl]) => {
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<Employee> => r.status === 'fulfilled')
        .map((r) => r.value);
      setEmployees(loaded);
      setExtraLogoUrl(logoUrl);
      setLoading(false);
    });
  }, [ids]);

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

  if (ids.length === 0 || employees.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Result status="404" title="İmza Listesi Bulunamadı" subTitle="Bu bağlantı geçerli bir çalışan listesine bağlı değil." />
      </div>
    );
  }

  const sortedEmployees = [...employees].sort((a, b) =>
    [a.firstName, a.lastName].join(' ').localeCompare([b.firstName, b.lastName].join(' '), 'tr'),
  );
  const selectedEmployee = sortedEmployees.find((e) => e.id === selectedId) || null;
  const signatureHtml = selectedEmployee ? buildEmailSignatureHtml(selectedEmployee, mode, extraLogoUrl) : '';

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
        Mail İmzanızı Alın
      </Title>
      <Text type="secondary" style={{ marginBottom: 24, textAlign: 'center', maxWidth: 480 }}>
        Aşağıdaki listeden kendi isminizi seçin, önizlemenizi kontrol edin ve "Kodu Kopyala" butonuyla mail
        imza düzenleme kutunuza (Gmail, Outlook vb.) doğrudan yapıştırın.
      </Text>

      <Select
        showSearch
        allowClear
        placeholder="İsminizi seçin..."
        value={selectedId || undefined}
        onChange={(value) => setSelectedId(value || null)}
        onClear={() => setSelectedId(null)}
        filterOption={(input, option) => (option?.label as string).toLocaleLowerCase('tr').includes(input.toLocaleLowerCase('tr'))}
        options={sortedEmployees.map((e) => ({
          value: e.id,
          label: [e.firstName, e.lastName].filter(Boolean).join(' ') || 'İsimsiz Çalışan',
        }))}
        style={{ width: '100%', maxWidth: 360, marginBottom: 24 }}
        size="large"
      />

      {!selectedEmployee ? (
        <Spin spinning={false}>
          <Text type="secondary">İmzanızı görmek için önce isminizi seçin.</Text>
        </Spin>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
