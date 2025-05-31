export interface Task {
  id?: string;
  title: string;
  description?: string;
  date: string; // Formato: YYYY-MM-DD
  startTime: string; // Formato: HH:MM
  endTime: string; // Formato: HH:MM
  completed: boolean;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  priority?: 'low' | 'medium' | 'high';
  
  // INTEGRACIÓN CON CATEGORÍAS Y MATERIAS
  categoryId?: string; // ID de la categoría (reemplaza category: string)
  subjectId?: string; // ID de la materia asociada
  
  // Campos adicionales existentes
  tags?: string[];
  reminder?: boolean;
  reminderTime?: string; // Minutos antes de la tarea
  location?: string;
  notes?: string;
}

// Interfaz extendida para tareas con información completa
export interface TaskWithDetails extends Task {
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    semester: number;
  };
}

export interface TaskStatistics {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  tasksThisWeek: number;
  tasksThisMonth: number;
  averageTasksPerDay: number;
  
  // NUEVAS ESTADÍSTICAS
  byCategory: { [categoryId: string]: number };
  bySubject: { [subjectId: string]: number };
  byPriority: { low: number; medium: number; high: number };
}

export interface TaskFilter {
  dateFrom?: string;
  dateTo?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  categoryId?: string; // Cambiado de category a categoryId
  subjectId?: string; // Nuevo filtro por materia
  searchTerm?: string;
}

export interface TaskSummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  percentage: number;
  categories: { [categoryId: string]: number };
  subjects: { [subjectId: string]: number };
}

// Utilidades actualizadas para trabajar con tareas
export class TaskUtils {
  
  // Verificar si una tarea está vencida
  static isOverdue(task: Task): boolean {
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    if (task.completed) return false;
    if (task.date < today) return true;
    if (task.date === today && task.endTime < currentTime) return true;
    return false;
  }

  // Obtener duración de una tarea en minutos
  static getDurationMinutes(task: Task): number {
    const [startHour, startMin] = task.startTime.split(':').map(Number);
    const [endHour, endMin] = task.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  // Formatear duración de tarea
  static formatDuration(task: Task): string {
    const minutes = this.getDurationMinutes(task);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  // Obtener color de la tarea basado en categoría o estado
  static getTaskColor(task: TaskWithDetails): string {
    if (task.category) {
      // Usar color de la categoría
      return task.category.color;
    }
    
    // Fallback al color por estado
    if (task.completed) return '#28ba62'; // Verde para completadas
    if (this.isOverdue(task)) return '#eb445a'; // Rojo para vencidas
    if (this.isToday(task)) return '#ffc409'; // Amarillo para hoy
    return '#3880ff'; // Azul para futuras
  }

  // Verificar si una tarea es para hoy
  static isToday(task: Task): boolean {
    const today = new Date().toISOString().split('T')[0];
    return task.date === today;
  }

  // Verificar si una tarea es para mañana
  static isTomorrow(task: Task): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return task.date === tomorrowStr;
  }

  // Verificar si una tarea es para esta semana
  static isThisWeek(task: Task): boolean {
    const today = new Date();
    const taskDate = new Date(task.date);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return taskDate >= startOfWeek && taskDate <= endOfWeek;
  }

  // Obtener el tiempo restante hasta una tarea
  static getTimeUntilTask(task: Task): string {
    const now = new Date();
    const taskDateTime = new Date(`${task.date}T${task.startTime}`);
    const diffMs = taskDateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Ya pasó';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    }
  }

  // Obtener prioridad visual
  static getPriorityLabel(priority?: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Normal';
    }
  }

  // Obtener color de prioridad
  static getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'high': return '#eb445a';
      case 'medium': return '#ffc409';
      case 'low': return '#2dd36f';
      default: return '#92949c';
    }
  }

  // Filtrar tareas según criterios (actualizado)
  static filterTasks(tasks: TaskWithDetails[], filter: TaskFilter): TaskWithDetails[] {
    return tasks.filter(task => {
      // Filtro por fecha
      if (filter.dateFrom && task.date < filter.dateFrom) return false;
      if (filter.dateTo && task.date > filter.dateTo) return false;
      
      // Filtro por completado
      if (filter.completed !== undefined && task.completed !== filter.completed) return false;
      
      // Filtro por prioridad
      if (filter.priority && task.priority !== filter.priority) return false;
      
      // Filtro por categoría
      if (filter.categoryId && task.categoryId !== filter.categoryId) return false;
      
      // Filtro por materia
      if (filter.subjectId && task.subjectId !== filter.subjectId) return false;
      
      // Filtro por término de búsqueda
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        const categoryMatch = task.category?.name.toLowerCase().includes(searchLower);
        const subjectMatch = task.subject?.name.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descMatch && !categoryMatch && !subjectMatch) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Agrupar tareas por categoría
  static groupTasksByCategory(tasks: TaskWithDetails[]): Map<string, TaskWithDetails[]> {
    const grouped = new Map<string, TaskWithDetails[]>();
    
    tasks.forEach(task => {
      const categoryId = task.categoryId || 'uncategorized';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)!.push(task);
    });
    
    return grouped;
  }

  // Agrupar tareas por materia
  static groupTasksBySubject(tasks: TaskWithDetails[]): Map<string, TaskWithDetails[]> {
    const grouped = new Map<string, TaskWithDetails[]>();
    
    tasks.forEach(task => {
      const subjectId = task.subjectId || 'no-subject';
      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, []);
      }
      grouped.get(subjectId)!.push(task);
    });
    
    return grouped;
  }

  // Crear estadísticas avanzadas
  static createAdvancedStatistics(tasks: TaskWithDetails[]): TaskStatistics {
    const completed = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed && !this.isOverdue(t));
    const overdue = tasks.filter(t => this.isOverdue(t));
    
    // Estadísticas por categoría
    const byCategory: { [categoryId: string]: number } = {};
    tasks.forEach(task => {
      if (task.categoryId) {
        byCategory[task.categoryId] = (byCategory[task.categoryId] || 0) + 1;
      }
    });
    
    // Estadísticas por materia
    const bySubject: { [subjectId: string]: number } = {};
    tasks.forEach(task => {
      if (task.subjectId) {
        bySubject[task.subjectId] = (bySubject[task.subjectId] || 0) + 1;
      }
    });
    
    // Estadísticas por prioridad
    const byPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length
    };
    
    return {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
      tasksThisWeek: tasks.filter(t => this.isThisWeek(t)).length,
      tasksThisMonth: tasks.filter(t => this.isThisMonth(t)).length,
      averageTasksPerDay: this.calculateAverageTasksPerDay(tasks),
      byCategory,
      bySubject,
      byPriority
    };
  }

  // Verificar si una tarea es de este mes
  private static isThisMonth(task: Task): boolean {
    const today = new Date();
    const taskDate = new Date(task.date);
    return taskDate.getMonth() === today.getMonth() && 
           taskDate.getFullYear() === today.getFullYear();
  }

  // Calcular promedio de tareas por día
  private static calculateAverageTasksPerDay(tasks: Task[]): number {
    if (tasks.length === 0) return 0;
    
    const dates = new Set(tasks.map(t => t.date));
    return Math.round((tasks.length / dates.size) * 100) / 100;
  }
}