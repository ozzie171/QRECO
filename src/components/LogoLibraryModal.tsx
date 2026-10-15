import { useEffect, useState } from "react";
import { App, Button, Modal, Popconfirm, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { fetchLogos, deleteLogo } from "../api";
import type { LogoLibraryItem } from "../api";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

/** Shared "pick a previously uploaded logo" picker, used both by the QR
 * design tab (employee's own QR logo) and the profile card preview (a
 * one-off logo just for that exported card). */
export default function LogoLibraryModal({ open, onClose, onSelect }: Props) {
  const { message } = App.useApp();
  const [logos, setLogos] = useState<LogoLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLogos()
      .then(setLogos)
      .catch(() => message.error("Logo kütüphanesi yüklenirken bir hata oluştu."))
      .finally(() => setLoading(false));
  }, [open, message]);

  const handleDelete = async (name: string) => {
    try {
      await deleteLogo(name);
      setLogos((prev) => prev.filter((logo) => logo.name !== name));
      message.success("Logo silindi.");
    } catch {
      message.error("Logo silinirken bir hata oluştu.");
    }
  };

  return (
    <Modal title="Mevcut Logolardan Seç" open={open} onCancel={onClose} footer={null}>
      {loading ? (
        <Text type="secondary">Yükleniyor...</Text>
      ) : logos.length === 0 ? (
        <Text type="secondary">Henüz yüklenmiş bir logo yok.</Text>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {logos.map((logo) => (
            <div key={logo.name} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => onSelect(logo.url)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
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
              <Popconfirm
                title="Bu logo silinsin mi?"
                onConfirm={() => handleDelete(logo.name)}
                okText="Sil"
                cancelText="Vazgeç"
              >
                <Button
                  danger
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined />}
                  style={{ position: "absolute", top: -8, right: -8 }}
                />
              </Popconfirm>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
