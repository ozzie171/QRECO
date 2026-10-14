import { useRef } from 'react';
import { Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import RoundedQrCanvas from './RoundedQrCanvas';
import type { Employee } from '../types';

interface Props {
  employee: Employee;
  size?: number;
  showDownload?: boolean;
}

export default function QrCodeCard({ employee, size = 192, showDownload = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { qr } = employee;
  const profileUrl = `${window.location.origin}/profile/${employee.id}`;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const name = [employee.firstName, employee.lastName].filter(Boolean).join('-') || 'calisan';
    link.download = `${name}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Space orientation="vertical" align="center">
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
          ref={canvasRef}
          value={profileUrl}
          size={size}
          fgColor={qr.fgColor}
          bgColor={qr.bgColor}
          logoUrl={qr.logoUrl || undefined}
          logoSize={qr.logoSize}
          errorLevel={qr.logoUrl ? 'M' : 'L'}
        />
      </div>
      {showDownload && (
        <Button icon={<DownloadOutlined />} onClick={handleDownload}>
          QR Kodu İndir
        </Button>
      )}
    </Space>
  );
}
