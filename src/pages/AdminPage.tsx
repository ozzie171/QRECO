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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
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
} from '@ant-design/icons';
import EmployeeFormDrawer from '../components/EmployeeFormDrawer';
import QrCodeCard from '../components/QrCodeCard';
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from '../api';
import { downloadEmployeeQrSvg } from '../lib/qrSvg';
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
          <Tooltip title="QR Kodu Görüntüle">
            <Button icon={<QrcodeOutlined />} onClick={() => setQrEmployee(employee)} />
          </Tooltip>
          <Tooltip title="QR Kodu İndir">
            <Button
              icon={<DownloadOutlined />}
              loading={downloadingId === employee.id}
              onClick={() => handleDownloadQr(employee)}
            />
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          QRECO · Çalışan QR Yönetimi
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Yeni Çalışan Ekle
        </Button>
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
    </Layout>
  );
}
