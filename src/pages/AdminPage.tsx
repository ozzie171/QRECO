import { useEffect, useState } from 'react';
import {
  App,
  Layout,
  Table,
  Button,
  Space,
  Avatar,
  Typography,
  Popconfirm,
  Modal,
  Tooltip,
  Spin,
  Segmented,
  Input,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  LinkOutlined,
  ScanOutlined,
  CopyOutlined,
  DownloadOutlined,
  IdcardOutlined,
  EyeOutlined,
  MailOutlined,
  LoadingOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import EmployeeFormDrawer from '../components/EmployeeFormDrawer';
import QrCodeCard from '../components/QrCodeCard';
import LogoLibraryModal from '../components/LogoLibraryModal';
import RoundedQrCanvas from '../components/RoundedQrCanvas';
import {
  createEmployee,
  deleteEmployee,
  deleteSignatureExtraLogo,
  fetchEmployees,
  fetchSignatureExtraLogo,
  updateEmployee,
  uploadSignatureExtraLogo,
} from '../api';
import { downloadEmployeeQrSvg, buildQrSvgMarkup } from '../lib/qrSvg';
import { buildProfileCardDataUrl, downloadProfileCardImage } from '../lib/profileCardImage';
import { buildEmailSignatureHtml, type SignatureImageMode } from '../lib/emailSignature';
import { withHttpProtocol } from '../lib/url';
import type { Employee, EmployeeInput } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function AdminPage() {
  const { message } = App.useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(true);
  const [cardEmployee, setCardEmployee] = useState<Employee | null>(null);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const [cardPreviewLoading, setCardPreviewLoading] = useState(false);
  const [cardLogoLibraryOpen, setCardLogoLibraryOpen] = useState(false);
  const [signatureEmployee, setSignatureEmployee] = useState<Employee | null>(null);
  const [signatureMode, setSignatureMode] = useState<SignatureImageMode>('qr');
  const [extraLogoUrl, setExtraLogoUrl] = useState<string | null>(null);
  const [extraLogoUploading, setExtraLogoUploading] = useState(false);
  const [generalQrOpen, setGeneralQrOpen] = useState(false);
  const [generalQrUrl, setGeneralQrUrl] = useState('');
  const [generalQrLogoUrl, setGeneralQrLogoUrl] = useState('');
  const [generalQrLogoLibraryOpen, setGeneralQrLogoLibraryOpen] = useState(false);
  const [generalQrDownloading, setGeneralQrDownloading] = useState(false);

  const loadExtraLogo = async () => {
    try {
      const url = await fetchSignatureExtraLogo();
      setExtraLogoUrl(url);
    } catch {
      // Non-critical — the signature just renders without the extra logo.
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch {
      message.error('Çalışanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadExtraLogo();
  }, []);

  const openCreate = () => {
    setEditingEmployee(null);
    setDrawerOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: EmployeeInput) => {
    try {
      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, values);
        setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        message.success('Çalışan güncellendi.');
      } else {
        const created = await createEmployee(values);
        setEmployees((prev) => [...prev, created]);
        message.success('Çalışan oluşturuldu.');
      }
      setDrawerOpen(false);
    } catch {
      message.error('Kaydetme sırasında bir hata oluştu.');
    }
  };

  const handleDownloadQr = async (employee: Employee) => {
    setDownloadingId(employee.id);
    try {
      await downloadEmployeeQrSvg(employee);
    } catch {
      message.error('QR kodu indirilirken bir hata oluştu.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadProfileCard = async (employee: Employee) => {
    setDownloadingCardId(employee.id);
    try {
      await downloadProfileCardImage(employee);
    } catch {
      message.error('Profil kartı indirilirken bir hata oluştu.');
    } finally {
      setDownloadingCardId(null);
    }
  };

  const handlePreviewCard = async (employee: Employee) => {
    setCardEmployee(employee);
    setCardPreviewUrl(null);
    setCardPreviewLoading(true);
    try {
      const dataUrl = await buildProfileCardDataUrl(employee, { qrLogoUrl: employee.qr.logoUrl });
      setCardPreviewUrl(dataUrl);
    } catch {
      message.error('Kart önizlemesi oluşturulurken bir hata oluştu.');
    } finally {
      setCardPreviewLoading(false);
    }
  };

  const handleChangeCardLogo = async (url: string) => {
    setCardLogoLibraryOpen(false);
    if (!cardEmployee) return;
    setCardPreviewLoading(true);
    try {
      const dataUrl = await buildProfileCardDataUrl(cardEmployee, { qrLogoUrl: url });
      setCardPreviewUrl(dataUrl);
    } catch {
      message.error('Kart önizlemesi oluşturulurken bir hata oluştu.');
    } finally {
      setCardPreviewLoading(false);
    }
  };

  const handleDownloadPreviewedCard = () => {
    if (!cardEmployee || !cardPreviewUrl) return;
    const name = [cardEmployee.firstName, cardEmployee.lastName].filter(Boolean).join('-') || 'calisan';
    const link = document.createElement('a');
    link.download = `${name}-profil-karti.png`;
    link.href = cardPreviewUrl;
    link.click();
  };

  const handleOpenSignature = (employee: Employee) => {
    setSignatureEmployee(employee);
    setSignatureMode('qr');
  };

  const handleCopySignature = async (html: string) => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([html], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(html);
      }
      message.success('İmza panoya kopyalandı. Mail imza kutunuza yapıştırabilirsiniz.');
    } catch {
      message.error('Panoya kopyalanırken bir hata oluştu.');
    }
  };

  const handleUploadExtraLogo: UploadProps['beforeUpload'] = async (file) => {
    setExtraLogoUploading(true);
    try {
      const url = await uploadSignatureExtraLogo(file);
      setExtraLogoUrl(url);
      message.success('Logo yüklendi.');
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Logo yüklenemedi.');
    } finally {
      setExtraLogoUploading(false);
    }
    return false;
  };

  const handleRemoveExtraLogo = async () => {
    try {
      await deleteSignatureExtraLogo();
      setExtraLogoUrl(null);
      message.success('Logo kaldırıldı.');
    } catch {
      message.error('Logo kaldırılırken bir hata oluştu.');
    }
  };

  const handleDownloadGeneralQr = async () => {
    if (!generalQrUrl.trim()) {
      message.error('Önce bir bağlantı girin.');
      return;
    }
    setGeneralQrDownloading(true);
    try {
      // Matches QrCodeCard's own logoSize/size reference ratio so a logo
      // picked here looks proportioned the same way as everywhere else.
      const size = 480;
      const referenceSize = 176;
      const rawLogoSize = 46;
      const svgMarkup = await buildQrSvgMarkup({
        value: generalQrUrl.trim(),
        size,
        fgColor: '#000000',
        bgColor: 'transparent',
        errorLevel: generalQrLogoUrl ? 'H' : 'L',
        logoUrl: generalQrLogoUrl || undefined,
        logoSize: generalQrLogoUrl ? rawLogoSize * (size / referenceSize) : rawLogoSize,
      });
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'qr-kodu.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('QR kodu oluşturulurken bir hata oluştu.');
    } finally {
      setGeneralQrDownloading(false);
    }
  };

  const handleDuplicate = async (employee: Employee) => {
    try {
      const duplicated = await createEmployee({
        firstName: employee.firstName ? `${employee.firstName} (Kopya)` : employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        phone: employee.phone,
        website: employee.website,
        photoUrl: employee.photoUrl,
        address: employee.address,
        enPosition: employee.enPosition,
        enAddress: employee.enAddress,
        social: employee.social,
        bgColorStart: employee.bgColorStart,
        bgColorEnd: employee.bgColorEnd,
        textColor: employee.textColor,
        qr: employee.qr,
      });
      setEmployees((prev) => [...prev, duplicated]);
      message.success('Çalışan çoğaltıldı.');
      setEditingEmployee(duplicated);
      setDrawerOpen(true);
    } catch {
      message.error('Çoğaltma sırasında bir hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      message.success('Çalışan silindi.');
    } catch {
      message.error('Silme sırasında bir hata oluştu.');
    }
  };

  const columns: ColumnsType<Employee> = [
    {
      title: 'Çalışan',
      key: 'name',
      render: (_, employee) => (
        <Space>
          <Avatar src={employee.photoUrl || undefined} icon={!employee.photoUrl && <UserOutlined />} />
          <div>
            <div>
              <Text strong>
                {employee.firstName} {employee.lastName}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {employee.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Pozisyon',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => position || <Text type="secondary">-</Text>,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || <Text type="secondary">-</Text>,
    },
    {
      title: 'Web Sitesi',
      dataIndex: 'website',
      key: 'website',
      render: (website: string) =>
        website ? (
          <a href={withHttpProtocol(website)} target="_blank" rel="noreferrer">
            {website}
          </a>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Sayfa Rengi',
      key: 'bgColor',
      render: (_, employee) => (
        <Tooltip title={`${employee.bgColorStart} → ${employee.bgColorEnd}`}>
          <div
            style={{
              width: 48,
              height: 24,
              borderRadius: 6,
              border: '1px solid #d9d9d9',
              background: `linear-gradient(180deg, ${employee.bgColorStart}, ${employee.bgColorEnd})`,
            }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'QR',
      key: 'qr',
      align: 'center',
      render: (_, employee) =>
        qrVisible ? <QrCodeCard employee={employee} size={140} showDownload={false} /> : null,
    },
    {
      title: 'Tarama Sayısı',
      dataIndex: 'scanCount',
      key: 'scanCount',
      sorter: (a, b) => a.scanCount - b.scanCount,
      render: (scanCount: number) => (
        <Space>
          <ScanOutlined />
          <Text>{scanCount ?? 0}</Text>
        </Space>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_, employee) => (
        <Space>
          <Tooltip title="Profil Sayfasını Aç">
            <Button
              icon={<LinkOutlined />}
              onClick={() => window.open(`/profile/${employee.id}`, '_blank')}
            />
          </Tooltip>
          {!qrVisible && (
            <Tooltip title="QR Kodu Görüntüle">
              <Button icon={<QrcodeOutlined />} onClick={() => setQrEmployee(employee)} />
            </Tooltip>
          )}
          <Tooltip title="QR Kodu İndir">
            <Button
              icon={<DownloadOutlined />}
              loading={downloadingId === employee.id}
              onClick={() => handleDownloadQr(employee)}
            />
          </Tooltip>
          <Tooltip title="Kartı Görüntüle">
            <Button icon={<EyeOutlined />} onClick={() => handlePreviewCard(employee)} />
          </Tooltip>
          <Tooltip title="QR'lı Profil Görseli İndir">
            <Button
              icon={<IdcardOutlined />}
              loading={downloadingCardId === employee.id}
              onClick={() => handleDownloadProfileCard(employee)}
            />
          </Tooltip>
          <Tooltip title="Mail İmzası">
            <Button icon={<MailOutlined />} onClick={() => handleOpenSignature(employee)} />
          </Tooltip>
          <Tooltip title="Düzenle">
            <Button icon={<EditOutlined />} onClick={() => openEdit(employee)} />
          </Tooltip>
          <Tooltip title="Çoğalt">
            <Button icon={<CopyOutlined />} onClick={() => handleDuplicate(employee)} />
          </Tooltip>
          <Popconfirm
            title="Bu çalışanı silmek istediğinize emin misiniz?"
            okText="Sil"
            cancelText="Vazgeç"
            onConfirm={() => handleDelete(employee.id)}
          >
            <Tooltip title="Sil">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const signatureHtml = signatureEmployee
    ? buildEmailSignatureHtml(signatureEmployee, signatureMode, extraLogoUrl)
    : '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          QRECO · Çalışan QR Yönetimi
        </Title>
        <Space>
          <Button icon={<QrcodeOutlined />} onClick={() => setQrVisible((v) => !v)}>
            {qrVisible ? "QR'ları Gizle" : "QR'ları Göster"}
          </Button>
          <Button icon={<LinkOutlined />} onClick={() => setGeneralQrOpen(true)}>
            Genel QR Oluştur
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Yeni Çalışan Ekle
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: 24 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={employees}
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
        />
      </Content>

      <EmployeeFormDrawer
        open={drawerOpen}
        employee={editingEmployee}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      />

      <Modal
        title={qrEmployee ? `${qrEmployee.firstName} ${qrEmployee.lastName} · QR Kodu` : ''}
        open={!!qrEmployee}
        onCancel={() => setQrEmployee(null)}
        footer={null}
        destroyOnHidden
      >
        {qrEmployee && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <QrCodeCard employee={qrEmployee} size={220} />
          </div>
        )}
      </Modal>

      <Modal
        title={cardEmployee ? `${cardEmployee.firstName} ${cardEmployee.lastName} · Profil Kartı` : ''}
        open={!!cardEmployee}
        onCancel={() => {
          setCardEmployee(null);
          setCardPreviewUrl(null);
        }}
        destroyOnHidden
        footer={
          cardPreviewUrl
            ? [
                <Button key="logo" onClick={() => setCardLogoLibraryOpen(true)}>
                  Logoyu Değiştir
                </Button>,
                <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPreviewedCard}>
                  İndir
                </Button>,
              ]
            : null
        }
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16, minHeight: 200, alignItems: 'center' }}>
          {cardPreviewLoading && <Spin />}
          {cardPreviewUrl && (
            <img
              src={cardPreviewUrl}
              alt="Profil kartı önizlemesi"
              style={{ maxHeight: '70vh', maxWidth: '100%', borderRadius: 12 }}
            />
          )}
        </div>
      </Modal>

      <LogoLibraryModal
        open={cardLogoLibraryOpen}
        onClose={() => setCardLogoLibraryOpen(false)}
        onSelect={handleChangeCardLogo}
        zIndex={1100}
      />

      <Modal
        title={signatureEmployee ? `${signatureEmployee.firstName} ${signatureEmployee.lastName} · Mail İmzası` : ''}
        open={!!signatureEmployee}
        onCancel={() => setSignatureEmployee(null)}
        width={760}
        footer={[
          <Button key="close" onClick={() => setSignatureEmployee(null)}>
            Kapat
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => handleCopySignature(signatureHtml)}
          >
            Panoya Kopyala
          </Button>,
        ]}
      >
        {signatureEmployee && (
          <>
            <Segmented
              value={signatureMode}
              onChange={(value) => setSignatureMode(value as SignatureImageMode)}
              options={[
                { label: 'QR Kodu', value: 'qr' },
                { label: 'Fotoğraf', value: 'photo', disabled: !signatureEmployee.photoUrl },
              ]}
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Sağdaki Ekstra Logo
              </Typography.Text>
              <Space align="center">
                {extraLogoUrl && (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                    }}
                  >
                    <img src={extraLogoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  </div>
                )}
                <Upload accept=".svg,image/svg+xml" maxCount={1} showUploadList={false} beforeUpload={handleUploadExtraLogo}>
                  <Button icon={extraLogoUploading ? <LoadingOutlined /> : <PlusOutlined />} loading={extraLogoUploading}>
                    {extraLogoUrl ? 'Logoyu Değiştir' : 'Logo Yükle (SVG)'}
                  </Button>
                </Upload>
                {extraLogoUrl && (
                  <Button danger type="text" icon={<CloseOutlined />} onClick={handleRemoveExtraLogo}>
                    Kaldır
                  </Button>
                )}
              </Space>
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                Bu logo tüm çalışanların mail imzasında ortak olarak görünür.
              </Typography.Text>
            </div>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, marginBottom: 16 }}>
              <iframe
                title="Mail İmzası Önizleme"
                srcDoc={`<html><body style="margin:0;">${signatureHtml}</body></html>`}
                style={{ width: '100%', height: 220, border: 'none' }}
              />
            </div>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              "Panoya Kopyala" butonuna bastıktan sonra mail imza düzenleme kutunuza (Gmail, Outlook vb.)
              doğrudan yapıştırabilirsiniz. Aşağıda ham HTML kodu da yer alıyor.
            </Typography.Text>
            <Input.TextArea value={signatureHtml} readOnly autoSize={{ minRows: 4, maxRows: 8 }} />
          </>
        )}
      </Modal>

      <Modal
        title="Genel QR Oluştur"
        open={generalQrOpen}
        onCancel={() => setGeneralQrOpen(false)}
        footer={[
          <Button key="close" onClick={() => setGeneralQrOpen(false)}>
            Kapat
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            loading={generalQrDownloading}
            onClick={handleDownloadGeneralQr}
          >
            QR Kodu İndir (SVG)
          </Button>,
        ]}
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Çalışan profillerinden bağımsız, herhangi bir bağlantıya giden bir QR kod oluşturun.
        </Typography.Text>
        <Input
          placeholder="https://..."
          value={generalQrUrl}
          onChange={(e) => setGeneralQrUrl(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-block',
              padding: 20,
              background: '#bfbfbf',
              borderRadius: 16,
              lineHeight: 0,
            }}
          >
            {generalQrUrl.trim() ? (
              <RoundedQrCanvas
                value={generalQrUrl.trim()}
                size={200}
                fgColor="#000000"
                bgColor="transparent"
                errorLevel={generalQrLogoUrl ? 'H' : 'L'}
                logoUrl={generalQrLogoUrl || undefined}
                logoSize={generalQrLogoUrl ? 46 * (200 / 176) : 46}
              />
            ) : (
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography.Text type="secondary">Önizleme için bağlantı girin</Typography.Text>
              </div>
            )}
          </div>
        </div>
        <Space>
          <Button onClick={() => setGeneralQrLogoLibraryOpen(true)}>
            {generalQrLogoUrl ? 'Logoyu Değiştir' : 'Logo Ekle'}
          </Button>
          {generalQrLogoUrl && (
            <Button danger type="text" icon={<CloseOutlined />} onClick={() => setGeneralQrLogoUrl('')}>
              Logoyu Kaldır
            </Button>
          )}
        </Space>
      </Modal>

      <LogoLibraryModal
        open={generalQrLogoLibraryOpen}
        onClose={() => setGeneralQrLogoLibraryOpen(false)}
        onSelect={(url) => {
          setGeneralQrLogoUrl(url);
          setGeneralQrLogoLibraryOpen(false);
        }}
        zIndex={1100}
      />
    </Layout>
  );
}
