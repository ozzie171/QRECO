import { useState } from 'react';
import { App, Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import RoundedQrCanvas from './RoundedQrCanvas';
import { buildQrSvgMarkup } from '../lib/qrSvg';
import type { Employee } from '../types';

interface Props {
  employee: Employee;
  size?: number;
  showDownload?: boolean;
}

export default function QrCodeCard({ employee, size = 192, showDownload = true }: Props) {
  const { qr } = employee;
  const profileUrl = `${window.location.origin}/profile/${employee.id}`;
  const errorLevel = qr.logoUrl ? 'M' : 'L';
  const [downloading, setDownloading] = useState(false);
  const { message } = App.useApp();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const svgMarkup = await buildQrSvgMarkup({
        value: profileUrl,
        size,
        fgColor: qr.fgColor,
        bgColor: qr.bgColor,
        errorLevel,
        logoUrl: qr.logoUrl || undefined,
        logoSize: qr.logoSize,
      });
      const name = [employee.firstName, employee.lastName].filter(Boolean).join('-') || 'calisan';
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${name}-qr.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('QR kodu indirilirken bir hata oluştu.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Space orientation="vertical" align="center">
      <div
        style={{
          display: 'inline-block',
          borderRadius: qr.shape === 'circle' ? 999 : 16,
          overflow: 'hidden',
          background: '#bfbfbf',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: 20,
            background: qr.bgColor,
            borderRadius: qr.shape === 'circle' ? 999 : 16,
            border: qr.bordered ? '1px solid #e8e8e8' : 'none',
            boxShadow: qr.bordered ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
            lineHeight: 0,
          }}
        >
          <RoundedQrCanvas
            value={profileUrl}
            size={size}
            fgColor={qr.fgColor}
            bgColor={qr.bgColor}
            logoUrl={qr.logoUrl || undefined}
            logoSize={qr.logoSize}
            errorLevel={errorLevel}
          />
        </div>
      </div>
      {showDownload && (
        <Button icon={<DownloadOutlined />} onClick={handleDownload} loading={downloading}>
          QR Kodu İndir (SVG)
        </Button>
      )}
    </Space>
  );
}
