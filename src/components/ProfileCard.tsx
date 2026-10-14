import type { ReactNode } from 'react';
import { Avatar, Space, Typography } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  ContactsOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  TwitterOutlined,
  FacebookOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export interface ProfileSocialLinks {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
}

export interface ProfileCardData {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  phone: string;
  website: string;
  photoUrl: string;
  address: string;
  social: ProfileSocialLinks;
  textColor: string;
}

interface Props {
  data: ProfileCardData;
  compact?: boolean;
}

const SOCIAL_ICONS: { key: keyof ProfileSocialLinks; icon: ReactNode; label: string }[] = [
  { key: 'linkedin', icon: <LinkedinOutlined />, label: 'LinkedIn' },
  { key: 'instagram', icon: <InstagramOutlined />, label: 'Instagram' },
  { key: 'twitter', icon: <TwitterOutlined />, label: 'Twitter / X' },
  { key: 'facebook', icon: <FacebookOutlined />, label: 'Facebook' },
];

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function buildVCard(data: ProfileCardData, fullName: string): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(data.lastName)};${escapeVCardValue(data.firstName)};;;`,
    `FN:${escapeVCardValue(fullName || 'İsimsiz Çalışan')}`,
  ];
  if (data.position) lines.push(`TITLE:${escapeVCardValue(data.position)}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(data.phone)}`);
  if (data.email) lines.push(`EMAIL:${escapeVCardValue(data.email)}`);
  if (data.website) lines.push(`URL:${escapeVCardValue(data.website)}`);
  if (data.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(data.address)};;;;`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export default function ProfileCard({ data, compact = false }: Props) {
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  const color = data.textColor || '#1f1f1f';
  const mapsUrl = data.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`
    : '';
  const social = data.social || { linkedin: '', instagram: '', twitter: '', facebook: '' };
  const activeSocial = SOCIAL_ICONS.filter((item) => social[item.key]);

  const vcardHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard(data, fullName))}`;
  const vcardFileName = `${[data.firstName, data.lastName].filter(Boolean).join('-') || 'kisi'}.vcf`;

  const actionButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 18px',
    borderRadius: 999,
    border: `1px solid ${color}55`,
    color,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
  } as const;

  const contactRows: { key: string; icon: ReactNode; href: string; label: string; text: string; external?: boolean }[] =
    [
      data.email
        ? { key: 'email', icon: <MailOutlined />, href: `mailto:${data.email}`, label: 'E-posta', text: data.email }
        : null,
      data.phone
        ? { key: 'phone', icon: <PhoneOutlined />, href: `tel:${data.phone}`, label: 'Telefon', text: data.phone }
        : null,
      data.website
        ? {
            key: 'website',
            icon: <GlobalOutlined />,
            href: data.website,
            label: 'Web Sitesi',
            text: data.website,
            external: true,
          }
        : null,
      data.address
        ? {
            key: 'address',
            icon: <EnvironmentOutlined />,
            href: mapsUrl,
            label: 'Adres',
            text: data.address,
            external: true,
          }
        : null,
    ].filter((item) => item !== null);

  return (
    <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', color }}>
      <Avatar
        size={compact ? 72 : 120}
        src={data.photoUrl || undefined}
        icon={!data.photoUrl && <UserOutlined />}
        style={{ marginBottom: 16 }}
      />
      <Title level={compact ? 4 : 3} style={{ marginBottom: 0, color }}>
        {fullName || 'İsimsiz Çalışan'}
      </Title>
      {data.position && (
        <Text style={{ fontSize: compact ? 14 : 16, color, opacity: 0.75, display: 'block' }}>
          {data.position}
        </Text>
      )}

      <div style={{ marginTop: compact ? 14 : 20 }}>
        <a href={vcardHref} download={vcardFileName} style={actionButtonStyle}>
          <ContactsOutlined />
          Rehbere Ekle
        </a>
      </div>

      {contactRows.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: compact ? 10 : 12,
            marginTop: compact ? 16 : 24,
          }}
        >
          {contactRows.map((item) => (
            <a
              key={item.key}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                maxWidth: compact ? 260 : 320,
                padding: compact ? '8px 14px' : '10px 18px',
                borderRadius: 14,
                border: `1px solid ${color}33`,
                background: `${color}0d`,
                color,
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  width: compact ? 30 : 36,
                  height: compact ? 30 : 36,
                  borderRadius: '50%',
                  background: `${color}1a`,
                  fontSize: compact ? 14 : 16,
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: compact ? 12 : 14,
                  wordBreak: 'break-word',
                  textAlign: 'left',
                }}
              >
                {item.text}
              </span>
            </a>
          ))}
        </div>
      )}

      {(mapsUrl || activeSocial.length > 0) && (
        <div
          style={{
            marginTop: compact ? 16 : 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: compact ? 12 : 16,
          }}
        >
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={actionButtonStyle}>
              <EnvironmentOutlined />
              Yol Tarifi Al
            </a>
          )}

          {activeSocial.length > 0 && (
            <Space size={12}>
              {activeSocial.map((item) => (
                <a
                  key={item.key}
                  href={social[item.key]}
                  target="_blank"
                  rel="noreferrer"
                  title={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: `1px solid ${color}33`,
                    background: `${color}1a`,
                    color,
                    fontSize: 16,
                  }}
                >
                  {item.icon}
                </a>
              ))}
            </Space>
          )}
        </div>
      )}
    </div>
  );
}
