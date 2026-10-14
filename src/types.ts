export interface QrDesign {
  fgColor: string;
  bgColor: string;
  logoUrl: string;
  logoSize: number;
  bordered: boolean;
  shape: 'square' | 'circle';
}

export interface SocialLinks {
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
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
  createdAt: string;
  updatedAt: string;
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>;
