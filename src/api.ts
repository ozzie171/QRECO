import axios from 'axios';
import type { Employee, EmployeeInput } from './types';

const client = axios.create({ baseURL: '/api' });

export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await client.get<Employee[]>('/users');
  return data;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const { data } = await client.get<Employee>(`/users/${id}`);
  return data;
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  const { data } = await client.post<Employee>('/users', input);
  return data;
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<Employee> {
  const { data } = await client.put<Employee>(`/users/${id}`, input);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await client.delete(`/users/${id}`);
}

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('photo', file);
  const { data } = await client.post<{ url: string }>('/upload/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export async function uploadLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await client.post<{ url: string }>('/upload/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export interface LogoLibraryItem {
  name: string;
  url: string;
}

export async function fetchLogos(): Promise<LogoLibraryItem[]> {
  const { data } = await client.get<LogoLibraryItem[]>('/logos');
  return data;
}

export async function deleteLogo(name: string): Promise<void> {
  await client.delete('/logos', { params: { name } });
}

/** The single, site-wide extra logo shown in every email signature. */
export async function fetchSignatureExtraLogo(): Promise<string | null> {
  const { data } = await client.get<{ url: string | null }>('/upload/signature-logo');
  return data.url;
}

export async function uploadSignatureExtraLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append('logo', file);
  const { data } = await client.post<{ url: string }>('/upload/signature-logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

export async function deleteSignatureExtraLogo(): Promise<void> {
  await client.delete('/upload/signature-logo');
}
