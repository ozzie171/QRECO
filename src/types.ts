export interface QrDesign {
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  logoSize: number;
  bordered: boolean;
  shape: 'square' | 'circle';
  /** ID of a selected entry from the "Genel QR" library, or '' to use the
   * employee's own profile page. */
  generalQrId: string;
  /** Snapshot of that entry's URL at selection time — this is what every
   * QR-generation path (download, card, email signature) actually encodes,
   * so they never need an extra lookup against the library. */
  generalQrUrl: string;
  /** Set by the server whenever the signature QR PNG is re-uploaded; used
   * only to cache-bust `qrPngUrl`. */
  pngVersion?: number;
}

export interface SocialLinks {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  youtube: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  phone: string;
  website: string;
  photoUrl: string;
  address: string;
  enPosition: string;
  enAddress: string;
  social: SocialLinks;
  bgColorStart: string;
  bgColorEnd: string;
  textColor: string;
  qr: QrDesign;
  scanCount: number;
  /** Public storage URL of the pre-rendered signature QR PNG, or '' if it
   * hasn't been generated yet. */
  qrPngUrl?: string;
  detectedLang: 'tr' | 'en';
  createdAt: string;
  updatedAt: string;
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'scanCount' | 'detectedLang'>;
