import { useState } from 'react';
import { App, Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import RoundedQrCanvas from './RoundedQrCanvas';
import { downloadEmployeeQrSvg } from '../lib/qrSvg';
import type { Employee } from '../types';

interface Props {
  employee: Employee;
  size?: number;
  showDownload?: boolean;
}

// logoSize/padding are tuned by eye against this reference canvas size (the
// size EmployeeFormDrawer's preview uses); scaling them by size/REFERENCE
// keeps the logo's proportion to the QR consistent at any render size,
// instead of a fixed-size logo swallowing a small canvas like the table's
// inline thumbnail.
const REFERENCE_SIZE = 176;

export default function QrCodeCard({ employee, size = 192, showDownload = true }: Props) {
  const { qr } = employee;
  const profileUrl = `${window.location.origin}/profile/${employee.id}`;
  // A logo blanks out a chunk of the modules in the middle of the code, so a
  // logo'd QR needs the high error-correction tier — at the default "M" tier
  // that hole alone exceeds the correctable error budget and real phone
  // cameras fail to scan it (verified by decoding a rendered copy with jsQR).
  const errorLevel = qr.logoUrl ? 'H' : 'L';
  const [downloading, setDownloading] = useState(false);
  const { message } = App.useApp();
  const scale = size / REFERENCE_SIZE;
  const scaledLogoSize = qr.logoUrl ? qr.logoSize * scale : qr.logoSize;
  const padding = Math.round(20 * scale);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadEmployeeQrSvg(employee, size);
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
          padding,
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
          logoSize={scaledLogoSize}
          errorLevel={errorLevel}
        />
      </div>
      {showDownload && (
        <Button icon={<DownloadOutlined />} onClick={handleDownload} loading={downloading}>
          QR Kodu İndir (SVG)
        </Button>
      )}
    </Space>
  );
}
