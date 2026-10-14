import { useEffect, useState } from "react";
import {
  App,
  Drawer,
  Form,
  Input,
  Button,
  Space,
  Upload,
  Avatar,
  ColorPicker,
  Modal,
  Segmented,
  Slider,
  Switch,
  Tabs,
  Typography,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  LoadingOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  TwitterOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { uploadPhoto, uploadLogo, fetchLogos } from "../api";
import type { LogoLibraryItem } from "../api";
import QrCodeCard from "./QrCodeCard";
import ProfileCard from "./ProfileCard";
import type { Employee, EmployeeInput, QrDesign, SocialLinks } from "../types";

const { Text } = Typography;

interface Props {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSubmit: (values: EmployeeInput) => Promise<void>;
}

const defaultQr: QrDesign = {
  fgColor: "#000000",
  bgColor: "#ffffff",
  logoUrl: "",
  logoSize: 40,
  bordered: true,
  shape: "square",
};

const defaultSocial: SocialLinks = {
  linkedin: "",
  instagram: "",
  twitter: "",
  facebook: "",
};

const emptyValues: EmployeeInput = {
  firstName: "",
  lastName: "",
  email: "",
  position: "",
  phone: "",
  website: "",
  photoUrl: "",
  address: "",
  enPosition: "",
  enAddress: "",
  social: defaultSocial,
  bgColorStart: "#f5f5f5",
  bgColorEnd: "#e0e0e0",
  textColor: "#1f1f1f",
  qr: defaultQr,
};

function toHex(color: unknown): string {
  if (typeof color === "string") return color;
  if (color && typeof color === "object" && "toHexString" in color) {
    return (color as { toHexString: () => string }).toHexString();
  }
  return "#000000";
}

export default function EmployeeFormDrawer({
  open,
  employee,
  onClose,
  onSubmit,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EmployeeInput>();
  const [photoLoading, setPhotoLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoLibraryOpen, setLogoLibraryOpen] = useState(false);
  const [logoLibrary, setLogoLibrary] = useState<LogoLibraryItem[]>([]);
  const [logoLibraryLoading, setLogoLibraryLoading] = useState(false);
  const values = Form.useWatch([], form);

  useEffect(() => {
    if (open) {
      form.setFieldsValue(
        employee
          ? {
              ...emptyValues,
              ...employee,
              qr: { ...defaultQr, ...employee.qr },
              social: { ...defaultSocial, ...employee.social },
            }
          : emptyValues,
      );
    }
  }, [open, employee, form]);

  const handlePhotoUpload: UploadProps["beforeUpload"] = async (file) => {
    setPhotoLoading(true);
    try {
      const url = await uploadPhoto(file);
      form.setFieldValue("photoUrl", url);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Fotoğraf yüklenemedi.");
    } finally {
      setPhotoLoading(false);
    }
    return false;
  };

  const handleLogoUpload: UploadProps["beforeUpload"] = async (file) => {
    setLogoLoading(true);
    try {
      const url = await uploadLogo(file);
      form.setFieldValue(["qr", "logoUrl"], url);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Logo yüklenemedi.");
    } finally {
      setLogoLoading(false);
    }
    return false;
  };

  const openLogoLibrary = async () => {
    setLogoLibraryOpen(true);
    setLogoLibraryLoading(true);
    try {
      const logos = await fetchLogos();
      setLogoLibrary(logos);
    } catch {
      message.error("Logo kütüphanesi yüklenirken bir hata oluştu.");
    } finally {
      setLogoLibraryLoading(false);
    }
  };

  const handleSelectLibraryLogo = (url: string) => {
    form.setFieldValue(["qr", "logoUrl"], url);
    setLogoLibraryOpen(false);
  };

  const handleFinish = async (fieldsValues: EmployeeInput) => {
    setSaving(true);
    try {
      await onSubmit(fieldsValues);
    } finally {
      setSaving(false);
    }
  };

  const previewEmployee: Employee = {
    id: employee?.id ?? "onizleme",
    createdAt: employee?.createdAt ?? "",
    updatedAt: employee?.updatedAt ?? "",
    firstName: values?.firstName ?? "",
    lastName: values?.lastName ?? "",
    email: values?.email ?? "",
    position: values?.position ?? "",
    phone: values?.phone ?? "",
    website: values?.website ?? "",
    photoUrl: values?.photoUrl ?? "",
    address: values?.address ?? "",
    enPosition: values?.enPosition ?? "",
    enAddress: values?.enAddress ?? "",
    detectedLang: employee?.detectedLang ?? "tr",
    social: { ...defaultSocial, ...values?.social },
    bgColorStart: values?.bgColorStart ?? "#f5f5f5",
    bgColorEnd: values?.bgColorEnd ?? "#e0e0e0",
    textColor: values?.textColor ?? "#1f1f1f",
    qr: { ...defaultQr, ...values?.qr },
    scanCount: employee?.scanCount ?? 0,
  };

  return (
    <Drawer
      title={employee ? "Çalışanı Düzenle" : "Yeni Çalışan Ekle"}
      open={open}
      onClose={onClose}
      size={960}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>İptal</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            Kaydet
          </Button>
        </Space>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: 1, minWidth: 0, padding: 24, overflowY: "auto" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={emptyValues}
          >
            <Tabs
              items={[
                {
                  key: "info",
                  label: "Bilgiler",
                  children: (
                    <>
                      <Form.Item label="Profil Fotoğrafı">
                        <Space align="center">
                          <Avatar
                            size={64}
                            src={values?.photoUrl || undefined}
                            icon={!values?.photoUrl && <UserOutlined />}
                          />
                          <Upload
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={handlePhotoUpload}
                          >
                            <Button
                              icon={
                                photoLoading ? (
                                  <LoadingOutlined />
                                ) : (
                                  <PlusOutlined />
                                )
                              }
                              loading={photoLoading}
                            >
                              Fotoğraf Yükle
                            </Button>
                          </Upload>
                        </Space>
                      </Form.Item>
                      <Form.Item name="photoUrl" hidden>
                        <Input />
                      </Form.Item>

                      <Space.Compact block>
                        <Form.Item
                          label="Ad"
                          name="firstName"
                          rules={[
                            { required: true, message: "Ad zorunludur." },
                          ]}
                          style={{ width: "50%" }}
                        >
                          <Input placeholder="Ad" />
                        </Form.Item>
                        <Form.Item
                          label="Soyad"
                          name="lastName"
                          rules={[
                            { required: true, message: "Soyad zorunludur." },
                          ]}
                          style={{ width: "50%" }}
                        >
                          <Input placeholder="Soyad" />
                        </Form.Item>
                      </Space.Compact>

                      <Form.Item
                        label="E-posta"
                        name="email"
                        rules={[
                          {
                            type: "email",
                            message: "Geçerli bir e-posta girin.",
                          },
                        ]}
                      >
                        <Input placeholder="ornek@sirket.com" />
                      </Form.Item>

                      <Form.Item label="Şirket İçi Pozisyon" name="position">
                        <Input placeholder="Örn. Yazılım Mühendisi" />
                      </Form.Item>

                      <Form.Item label="Telefon Numarası" name="phone">
                        <Input placeholder="+90 5xx xxx xx xx" />
                      </Form.Item>

                      <Form.Item label="Şirket Web Sitesi" name="website">
                        <Input placeholder="https://www.sirket.com" />
                      </Form.Item>

                      <Form.Item label="Adres" name="address">
                        <Input.TextArea
                          placeholder="Şirket adresi"
                          autoSize={{ minRows: 2, maxRows: 3 }}
                        />
                      </Form.Item>

                      <Text strong style={{ display: "block", marginBottom: 4 }}>
                        İngilizce Sürüm (isteğe bağlı)
                      </Text>
                      <Text
                        type="secondary"
                        style={{ display: "block", marginBottom: 12, fontSize: 12 }}
                      >
                        QR kod Türkiye dışından okutulduğunda pozisyon ve
                        adres burada girdiğiniz İngilizce metinlerle
                        gösterilir; boş bırakılırsa Türkçe metin kullanılır.
                      </Text>

                      <Form.Item label="Pozisyon (İngilizce)" name="enPosition">
                        <Input placeholder="e.g. Software Engineer" />
                      </Form.Item>

                      <Form.Item label="Adres (İngilizce)" name="enAddress">
                        <Input.TextArea
                          placeholder="Company address in English"
                          autoSize={{ minRows: 2, maxRows: 3 }}
                        />
                      </Form.Item>

                      <Text strong style={{ display: "block", marginBottom: 12 }}>
                        Sosyal Medya
                      </Text>
                      <Space.Compact block>
                        <Form.Item
                          name={["social", "linkedin"]}
                          style={{ width: "50%" }}
                        >
                          <Input
                            prefix={<LinkedinOutlined />}
                            placeholder="LinkedIn bağlantısı"
                          />
                        </Form.Item>
                        <Form.Item
                          name={["social", "instagram"]}
                          style={{ width: "50%" }}
                        >
                          <Input
                            prefix={<InstagramOutlined />}
                            placeholder="Instagram bağlantısı"
                          />
                        </Form.Item>
                      </Space.Compact>
                      <Space.Compact block style={{ marginBottom: 24 }}>
                        <Form.Item
                          name={["social", "twitter"]}
                          style={{ width: "50%" }}
                        >
                          <Input
                            prefix={<TwitterOutlined />}
                            placeholder="Twitter / X bağlantısı"
                          />
                        </Form.Item>
                        <Form.Item
                          name={["social", "facebook"]}
                          style={{ width: "50%" }}
                        >
                          <Input
                            prefix={<FacebookOutlined />}
                            placeholder="Facebook bağlantısı"
                          />
                        </Form.Item>
                      </Space.Compact>

                      <Space.Compact block>
                        <Form.Item
                          label="Arkaplan Rengi (Üst)"
                          name="bgColorStart"
                          style={{ width: "50%" }}
                          getValueFromEvent={(color) => toHex(color)}
                        >
                          <ColorPicker showText />
                        </Form.Item>
                        <Form.Item
                          label="Arkaplan Rengi (Alt)"
                          name="bgColorEnd"
                          style={{ width: "50%" }}
                          getValueFromEvent={(color) => toHex(color)}
                        >
                          <ColorPicker showText />
                        </Form.Item>
                      </Space.Compact>

                      <Form.Item
                        label="Yazı Rengi"
                        name="textColor"
                        getValueFromEvent={(color) => toHex(color)}
                      >
                        <ColorPicker showText />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: "qr",
                  label: "QR Tasarımı",
                  children: (
                    <>
                      <Space.Compact block>
                        <Form.Item
                          label="QR Rengi"
                          name={["qr", "fgColor"]}
                          style={{ width: "50%" }}
                          getValueFromEvent={(color) => toHex(color)}
                        >
                          <ColorPicker showText />
                        </Form.Item>
                        <Form.Item
                          label="QR Arkaplan Rengi"
                          name={["qr", "bgColor"]}
                          style={{ width: "50%" }}
                          getValueFromEvent={(color) => toHex(color)}
                        >
                          <ColorPicker
                            showText
                            disabled={values?.qr?.bgColor === "transparent"}
                          />
                        </Form.Item>
                      </Space.Compact>

                      <Form.Item label="Şeffaf Arkaplan">
                        <Switch
                          checked={values?.qr?.bgColor === "transparent"}
                          onChange={(checked) =>
                            form.setFieldValue(
                              ["qr", "bgColor"],
                              checked ? "transparent" : "#ffffff",
                            )
                          }
                        />
                      </Form.Item>

                      <Form.Item label="Çerçeve Şekli" name={["qr", "shape"]}>
                        <Segmented
                          options={[
                            { label: "Kare", value: "square" },
                            { label: "Daire", value: "circle" },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Çerçeve Göster"
                        name={["qr", "bordered"]}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item label="Şirket Logosu (SVG)">
                        <Space>
                          <Upload
                            accept=".svg,image/svg+xml"
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={handleLogoUpload}
                          >
                            <Button
                              icon={
                                logoLoading ? (
                                  <LoadingOutlined />
                                ) : (
                                  <PlusOutlined />
                                )
                              }
                              loading={logoLoading}
                            >
                              Logo Yükle
                            </Button>
                          </Upload>
                          <Button onClick={openLogoLibrary}>
                            Mevcut Logolardan Seç
                          </Button>
                          {values?.qr?.logoUrl && (
                            <Button
                              danger
                              type="text"
                              onClick={() =>
                                form.setFieldValue(["qr", "logoUrl"], "")
                              }
                            >
                              Logoyu Kaldır
                            </Button>
                          )}
                        </Space>
                      </Form.Item>
                      <Form.Item name={["qr", "logoUrl"]} hidden>
                        <Input />
                      </Form.Item>

                      {values?.qr?.logoUrl && (
                        <Form.Item
                          label="Logo Boyutu"
                          name={["qr", "logoSize"]}
                        >
                          <Slider min={20} max={70} />
                        </Form.Item>
                      )}

                      <Text type="secondary">
                        Bu QR kod, çalışanın profil sayfasına yönlendirir. Logo
                        ekledikten sonra QR kodun okunabildiğini bir telefonla
                        test edin.
                      </Text>
                    </>
                  ),
                },
              ]}
            />
          </Form>
        </div>

        <div
          style={{
            width: 340,
            flexShrink: 0,
            borderLeft: "1px solid #f0f0f0",
            padding: 24,
            overflowY: "auto",
            background: "#fafafa",
          }}
        >
          <Text strong style={{ display: "block", marginBottom: 12 }}>
            Profil Sayfası Önizlemesi
          </Text>
          <div
            style={{
              background: `linear-gradient(180deg, ${previewEmployee.bgColorStart}, ${previewEmployee.bgColorEnd})`,
              borderRadius: 12,
              padding: 24,
              display: "flex",
              justifyContent: "center",
              marginBottom: 32,
            }}
          >
            <ProfileCard data={previewEmployee} compact />
          </div>

          <Text strong style={{ display: "block", marginBottom: 12 }}>
            QR Kodu Önizlemesi
          </Text>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <QrCodeCard
              employee={previewEmployee}
              size={176}
              showDownload={false}
            />
          </div>
        </div>
      </div>

      <Modal
        title="Mevcut Logolardan Seç"
        open={logoLibraryOpen}
        onCancel={() => setLogoLibraryOpen(false)}
        footer={null}
      >
        {logoLibraryLoading ? (
          <Text type="secondary">Yükleniyor...</Text>
        ) : logoLibrary.length === 0 ? (
          <Text type="secondary">Henüz yüklenmiş bir logo yok.</Text>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {logoLibrary.map((logo) => (
              <button
                key={logo.name}
                type="button"
                onClick={() => handleSelectLibraryLogo(logo.url)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 72,
                  padding: 8,
                  border: "1px solid #e8e8e8",
                  borderRadius: 8,
                  background: "#fafafa",
                  cursor: "pointer",
                }}
              >
                <img
                  src={logo.url}
                  alt={logo.name}
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </button>
            ))}
          </div>
        )}
      </Modal>
    </Drawer>
  );
}
