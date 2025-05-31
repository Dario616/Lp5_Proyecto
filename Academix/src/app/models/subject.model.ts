export interface Subject {
  id?: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  semester: number;
  professor?: string;
  schedule?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}