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

function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 1;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export default function QrCodeCard({ employee, size = 192, showDownload = true }: Props) {
  const { qr } = employee;
  const profileUrl = `${window.location.origin}/profile/${employee.id}`;
  const errorLevel = qr.logoUrl ? 'M' : 'L';
  const [downloading, setDownloading] = useState(false);
  const { message } = App.useApp();
  const fgIsLight = getLuminance(qr.fgColor) > 0.6;
  const backdropColor = fgIsLight ? '#2b2b2b' : '#d9d9d9';

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
          background: backdropColor,
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
