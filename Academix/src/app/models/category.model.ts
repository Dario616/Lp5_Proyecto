export interface Category {
  id?: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  userId: string;
  isDefault?: boolean; // Para categorías predeterminadas del sistema
  createdAt?: Date;
  updatedAt?: Date;
}

// Colores predefinidos para las categorías
export const CATEGORY_COLORS = [
  { name: 'Azul', value: 'primary', hex: '#3880ff' },
  { name: 'Verde', value: 'success', hex: '#2dd36f' },
  { name: 'Rojo', value: 'danger', hex: '#eb445a' },
  { name: 'Naranja', value: 'warning', hex: '#ffc409' },
  { name: 'Púrpura', value: 'secondary', hex: '#3dc2ff' },
  { name: 'Gris', value: 'medium', hex: '#92949c' },
  { name: 'Rosa', value: 'tertiary', hex: '#7044ff' },
  { name: 'Verde Claro', value: 'light', hex: '#f4f5f8' }
];

// Íconos predefinidos para las categorías
export const CATEGORY_ICONS = [
  { name: 'Examen', value: 'school-outline' },
  { name: 'Proyecto', value: 'code-working-outline' },
  { name: 'Tarea', value: 'document-text-outline' },
  { name: 'Investigación', value: 'search-outline' },
  { name: 'Presentación', value: 'easel-outline' },
  { name: 'Lectura', value: 'book-outline' },
  { name: 'Práctica', value: 'fitness-outline' },
  { name: 'Reunión', value: 'people-outline' },
  { name: 'Laboratorio', value: 'flask-outline' },
  { name: 'Conferencia', value: 'megaphone-outline' },
  { name: 'Entrega', value: 'send-outline' },
  { name: 'Revisión', value: 'checkmark-circle-outline' }
];

// Categorías predeterminadas del sistema
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Examen',
    color: 'danger',
    icon: 'school-outline',
    description: 'Evaluaciones y exámenes',
    isDefault: true
  },
  {
    name: 'Proyecto',
    color: 'primary',
    icon: 'code-working-outline',
    description: 'Proyectos y trabajos grandes',
    isDefault: true
  },
  {
    name: 'Tarea',
    color: 'success',
    icon: 'document-text-outline',
    description: 'Tareas y actividades regulares',
    isDefault: true
  },
  {
    name: 'Investigación',
    color: 'warning',
    icon: 'search-outline',
    description: 'Investigaciones y estudios',
    isDefault: true
  }
];