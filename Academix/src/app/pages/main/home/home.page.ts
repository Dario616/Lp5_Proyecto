import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { NavController } from '@ionic/angular';
import { Task, TaskWithDetails, TaskFilter, TaskUtils } from '../../../models/task.model';
import { Category } from '../../../models/category.model';
import { Subject } from '../../../models/subject.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, AfterViewInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  private navCtrl = inject(NavController);

  @ViewChild('calendar', { read: ElementRef }) calendarRef!: ElementRef;

  // Datos del calendario y tareas
  selectedDate: string = new Date().toISOString();
  allTasks: TaskWithDetails[] = [];
  filteredTasks: TaskWithDetails[] = [];
  loading: boolean = false;
  
  // Datos para categorías y materias
  availableCategories: Category[] = [];
  availableSubjects: Subject[] = [];
  
  // Filtros
  currentFilter: TaskFilter = {};
  tempFilter: TaskFilter = {};
  isFilterModalOpen: boolean = false;
  
  // Modal para agregar tarea
  isAddTaskModalOpen: boolean = false;
  saving: boolean = false;
  editingTask: TaskWithDetails | null = null;
  newTask: Partial<Task> = {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    completed: false,
    categoryId: '',
    subjectId: '',
    priority: undefined
  };

  // Usuario actual
  currentUser: any;

  ngOnInit() {
    this.currentUser = this.firebaseSvc.getAuth().currentUser;
    if (this.currentUser) {
      this.initializeData();
    }
  }

  ngAfterViewInit() {
    this.setupCalendarObserver();
  }

  // === INICIALIZACIÓN ===

  async initializeData() {
    this.loading = true;
    try {
      // Cargar datos en paralelo
      await Promise.all([
        this.loadTasks(),
        this.loadCategories(),
        this.loadSubjects()
      ]);
      
      this.filterTasksByDate();
    } catch (error) {
      console.error('Error al inicializar datos:', error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar los datos',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      this.loading = false;
    }
  }

  // Cargar todas las tareas del usuario con detalles
  async loadTasks() {
    try {
      if (this.currentUser) {
        this.allTasks = await this.firebaseSvc.getUserTasksWithDetails(this.currentUser.uid);
        this.updateCalendarBadges();
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      throw error;
    }
  }

  // Cargar categorías disponibles
  async loadCategories() {
    try {
      if (this.currentUser) {
        this.availableCategories = await this.firebaseSvc.getUserCategories(this.currentUser.uid);
        
        // Si no tiene categorías, inicializar las por defecto
        if (this.availableCategories.length === 0) {
          await this.firebaseSvc.initializeDefaultCategories(this.currentUser.uid);
          this.availableCategories = await this.firebaseSvc.getUserCategories(this.currentUser.uid);
        }
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      throw error;
    }
  }

  // Cargar materias disponibles
  async loadSubjects() {
    try {
      if (this.currentUser) {
        this.availableSubjects = await this.firebaseSvc.getUserSubjects(this.currentUser.uid);
      }
    } catch (error) {
      console.error('Error al cargar materias:', error);
      throw error;
    }
  }

  // === FILTROS ===

  // Filtrar tareas por la fecha seleccionada y filtros activos
  filterTasksByDate() {
    const selectedDateStr = this.selectedDate.split('T')[0];
    
    // Primero filtrar por fecha
    let tasksForDate = this.allTasks.filter(task => task.date === selectedDateStr);
    
    // Aplicar filtros adicionales
    if (this.hasActiveFilters()) {
      const filter: TaskFilter = {
        ...this.currentFilter,
        dateFrom: selectedDateStr,
        dateTo: selectedDateStr
      };
      tasksForDate = TaskUtils.filterTasks(tasksForDate, filter);
    }
    
    // Ordenar por hora de inicio
    this.filteredTasks = tasksForDate.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return !!(this.currentFilter.categoryId || 
              this.currentFilter.subjectId || 
              this.currentFilter.priority || 
              this.currentFilter.completed !== undefined);
  }

  // Abrir modal de filtros
  openFilterModal() {
    this.tempFilter = { ...this.currentFilter };
    this.isFilterModalOpen = true;
  }

  // Cerrar modal de filtros
  closeFilterModal() {
    this.isFilterModalOpen = false;
    this.tempFilter = {};
  }

  // Aplicar filtros
  applyFilters() {
    this.currentFilter = { ...this.tempFilter };
    this.filterTasksByDate();
    this.closeFilterModal();
    
    this.utilsSvc.presentToast({
      message: 'Filtros aplicados',
      duration: 1500,
      color: 'success'
    });
  }

  // Limpiar todos los filtros
  clearAllFilters() {
    this.currentFilter = {};
    this.tempFilter = {};
    this.filterTasksByDate();
    this.closeFilterModal();
    
    this.utilsSvc.presentToast({
      message: 'Filtros eliminados',
      duration: 1500,
      color: 'primary'
    });
  }

  // Limpiar filtro específico
  clearCategoryFilter() {
    this.currentFilter.categoryId = undefined;
    this.filterTasksByDate();
  }

  clearSubjectFilter() {
    this.currentFilter.subjectId = undefined;
    this.filterTasksByDate();
  }

  clearPriorityFilter() {
    this.currentFilter.priority = undefined;
    this.filterTasksByDate();
  }

  // === MÉTODOS AUXILIARES PARA UI ===

  // Obtener nombre de categoría
  getCategoryName(categoryId: string): string {
    const category = this.availableCategories.find(c => c.id === categoryId);
    return category ? category.name : 'Categoría';
  }

  // Obtener nombre de materia
  getSubjectName(subjectId: string): string {
    const subject = this.availableSubjects.find(s => s.id === subjectId);
    return subject ? `${subject.code} - ${subject.name}` : 'Materia';
  }

  // Obtener etiqueta de prioridad
  getPriorityLabel(priority: string): string {
    return TaskUtils.getPriorityLabel(priority);
  }

  // Obtener color de categoría
  getCategoryColor(colorName: string): string {
    const colorMap: { [key: string]: string } = {
      'primary': '#3880ff',
      'success': '#2dd36f',
      'danger': '#eb445a',
      'warning': '#ffc409',
      'secondary': '#3dc2ff',
      'tertiary': '#7044ff',
      'medium': '#92949c',
      'light': '#f4f5f8'
    };
    return colorMap[colorName] || '#3880ff';
  }

  // Obtener color de chip de prioridad
  getPriorityChipColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  // Obtener categoría seleccionada en el modal
  getSelectedCategory(): Category | null {
    if (!this.newTask.categoryId) return null;
    return this.availableCategories.find(c => c.id === this.newTask.categoryId) || null;
  }

  // Obtener materia seleccionada en el modal
  getSelectedSubject(): Subject | null {
    if (!this.newTask.subjectId) return null;
    return this.availableSubjects.find(s => s.id === this.newTask.subjectId) || null;
  }

  // === FUNCIONES DEL CALENDARIO (mantenidas del código original) ===

  onDateChange() {
    console.log('Fecha seleccionada:', this.selectedDate);
    this.filterTasksByDate();
  }

  getFormattedDate(): string {
    const date = new Date(this.selectedDate);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('es-ES', options);
  }

  private setupCalendarObserver() {
    setTimeout(() => {
      this.updateCalendarBadges();
    }, 1000);
    
    setInterval(() => {
      this.updateCalendarBadges();
    }, 5000);
  }

  getHighlightedDates() {
    const highlightedDates: any[] = [];
    const tasksByDate = this.groupTasksByDate();
    
    for (const [dateStr, tasks] of tasksByDate.entries()) {
      const allCompleted = tasks.every(task => task.completed);
      const hasAnyTask = tasks.length > 0;
      const hasOverdue = this.dateHasOverdueTasks(dateStr);
      const hasMixed = tasks.some(t => t.completed) && tasks.some(t => !t.completed);
      
      if (hasAnyTask) {
        let textColor = '#3880ff';
        let backgroundColor = '#e3f2fd';
        
        if (hasOverdue) {
          textColor = '#eb445a';
          backgroundColor = '#ffeaea';
        } else if (allCompleted) {
          textColor = '#28ba62';
          backgroundColor = '#e8f5e8';
        } else if (hasMixed) {
          textColor = '#ffc409';
          backgroundColor = '#fff8e1';
        }
        
        highlightedDates.push({
          date: dateStr,
          textColor: textColor,
          backgroundColor: backgroundColor
        });
      }
    }
    
    return highlightedDates;
  }

  private groupTasksByDate(): Map<string, TaskWithDetails[]> {
    const tasksByDate = new Map<string, TaskWithDetails[]>();
    
    this.allTasks.forEach(task => {
      if (!tasksByDate.has(task.date)) {
        tasksByDate.set(task.date, []);
      }
      tasksByDate.get(task.date)!.push(task);
    });
    
    return tasksByDate;
  }

  private updateCalendarBadges() {
    setTimeout(() => {
      const calendarElement = document.querySelector('ion-datetime');
      if (!calendarElement) return;

      const dayElements = calendarElement.shadowRoot?.querySelectorAll('.calendar-day');
      if (!dayElements) return;

      dayElements.forEach((dayElement: any) => {
        const dateStr = this.getDayElementDate(dayElement);
        if (dateStr) {
          this.setDayBadgeAttributes(dayElement, dateStr);
        }
      });
    }, 100);
  }

  private getDayElementDate(dayElement: any): string | null {
    try {
      const ariaLabel = dayElement.getAttribute('aria-label');
      if (ariaLabel) {
        const dateMatch = ariaLabel.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = this.getMonthNumber(dateMatch[2]);
          const year = dateMatch[3];
          return `${year}-${month}-${day}`;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private getMonthNumber(monthName: string): string {
    const months: { [key: string]: string } = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };
    return months[monthName.toLowerCase()] || '01';
  }

  private setDayBadgeAttributes(dayElement: any, dateStr: string) {
    const dateTasks = this.allTasks.filter(task => task.date === dateStr);
    
    dayElement.removeAttribute('data-has-tasks');
    dayElement.removeAttribute('data-all-completed');
    dayElement.removeAttribute('data-overdue');
    dayElement.removeAttribute('data-mixed');

    if (dateTasks.length === 0) return;

    const completedTasks = dateTasks.filter(task => task.completed);
    const pendingTasks = dateTasks.filter(task => !task.completed);
    const isPastDate = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);

    dayElement.setAttribute('data-has-tasks', 'true');

    if (completedTasks.length === dateTasks.length) {
      dayElement.setAttribute('data-all-completed', 'true');
    } else if (pendingTasks.length > 0 && isPastDate) {
      dayElement.setAttribute('data-overdue', 'true');
    } else if (completedTasks.length > 0 && pendingTasks.length > 0) {
      dayElement.setAttribute('data-mixed', 'true');
    }
  }

  // === ESTADÍSTICAS ===

  getCompletedTasksCount(): number {
    return this.filteredTasks.filter(task => task.completed).length;
  }

  getPendingTasksCount(): number {
    return this.filteredTasks.filter(task => !task.completed && !this.isTaskOverdue(task)).length;
  }

  getOverdueTasksCount(): number {
    return this.filteredTasks.filter(task => this.isTaskOverdue(task)).length;
  }

  getCompletionPercentage(): number {
    if (this.filteredTasks.length === 0) return 0;
    return Math.round((this.getCompletedTasksCount() / this.filteredTasks.length) * 100);
  }

  getTotalOverdueTasks(): TaskWithDetails[] {
    return this.allTasks.filter(task => TaskUtils.isOverdue(task));
  }

  // === VALIDACIONES ===

  isTaskOverdue(task: Task): boolean {
    return TaskUtils.isOverdue(task);
  }

  isTaskToday(task: Task): boolean {
    return TaskUtils.isToday(task);
  }

  isTaskSoon(task: Task): boolean {
    const today = new Date();
    const taskDate = new Date(task.date);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    return taskDate > today && taskDate <= threeDaysFromNow;
  }

  dateHasOverdueTasks(dateStr: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr >= today) return false;
    
    const dateTasks = this.allTasks.filter(task => task.date === dateStr);
    return dateTasks.some(task => !task.completed);
  }

  getTaskDuration(task: Task): string {
    return TaskUtils.formatDuration(task);
  }

  hasTimeConflict(): boolean {
    if (!this.newTask.startTime || !this.newTask.endTime) return false;
    return this.newTask.startTime >= this.newTask.endTime;
  }

  // === NAVEGACIÓN ===

  hasPreviousTaskDates(): boolean {
    const today = this.selectedDate.split('T')[0];
    return this.allTasks.some(task => task.date < today);
  }

  hasNextTaskDates(): boolean {
    const today = this.selectedDate.split('T')[0];
    return this.allTasks.some(task => task.date > today);
  }

  goToNextTaskDate() {
    const currentDate = this.selectedDate.split('T')[0];
    const futureTasks = this.allTasks
      .filter(task => task.date > currentDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (futureTasks.length > 0) {
      this.selectedDate = new Date(futureTasks[0].date).toISOString();
      this.filterTasksByDate();
    }
  }

  goToPreviousTaskDate() {
    const currentDate = this.selectedDate.split('T')[0];
    const pastTasks = this.allTasks
      .filter(task => task.date < currentDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (pastTasks.length > 0) {
      this.selectedDate = new Date(pastTasks[0].date).toISOString();
      this.filterTasksByDate();
    }
  }

  // === MODALES Y ALERTAS ===

  async showDaySummary() {
    const completed = this.getCompletedTasksCount();
    const pending = this.getPendingTasksCount();
    const overdue = this.getOverdueTasksCount();
    const totalOverdue = this.getTotalOverdueTasks().length;
    
    let message = `📅 Resumen para ${this.getFormattedDate()}:\n\n`;
    message += `✅ ${completed} completadas\n`;
    message += `⏳ ${pending} pendientes\n`;
    
    if (overdue > 0) {
      message += `⚠️ ${overdue} vencidas\n`;
    }
    
    if (totalOverdue > 0) {
      message += `\n🚨 Total de tareas vencidas: ${totalOverdue}`;
    }

    const alert = document.createElement('ion-alert');
    alert.header = 'Resumen de Tareas';
    alert.message = message;
    alert.buttons = ['OK'];
    
    document.body.appendChild(alert);
    await alert.present();
  }

  async showOverdueTasks() {
    const overdueTasks = this.getTotalOverdueTasks();
    
    let message = '🚨 Tareas vencidas:\n\n';
    overdueTasks.slice(0, 5).forEach(task => {
      message += `• ${task.title} (${task.date})\n`;
    });
    
    if (overdueTasks.length > 5) {
      message += `\n... y ${overdueTasks.length - 5} más`;
    }

    const alert = document.createElement('ion-alert');
    alert.header = 'Tareas Vencidas';
    alert.message = message;
    alert.buttons = [
      {
        text: 'OK',
        role: 'cancel'
      },
      {
        text: 'Ir a la primera',
        handler: () => {
          if (overdueTasks.length > 0) {
            this.selectedDate = new Date(overdueTasks[0].date).toISOString();
            this.filterTasksByDate();
          }
        }
      }
    ];
    
    document.body.appendChild(alert);
    await alert.present();
  }

  // === GESTIÓN DE TAREAS ===

  openAddTaskModal() {
    this.editingTask = null;
    this.newTask = {
      title: '',
      description: '',
      date: this.selectedDate.split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      completed: false,
      categoryId: '',
      subjectId: '',
      priority: undefined
    };
    this.isAddTaskModalOpen = true;
  }

  editTask(task: TaskWithDetails) {
    this.editingTask = task;
    this.newTask = {
      title: task.title,
      description: task.description,
      date: task.date,
      startTime: task.startTime,
      endTime: task.endTime,
      completed: task.completed,
      categoryId: task.categoryId || '',
      subjectId: task.subjectId || '',
      priority: task.priority
    };
    this.isAddTaskModalOpen = true;
  }

  closeAddTaskModal() {
    this.isAddTaskModalOpen = false;
    this.editingTask = null;
    this.newTask = {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      completed: false,
      categoryId: '',
      subjectId: '',
      priority: undefined
    };
  }

  async addTask() {
    if (!this.newTask.title?.trim()) {
      this.utilsSvc.presentToast({
        message: 'El título es obligatorio',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    if (this.hasTimeConflict()) {
      this.utilsSvc.presentToast({
        message: 'La hora de fin debe ser posterior a la hora de inicio',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    this.saving = true;
    try {
      if (this.currentUser) {
        if (this.editingTask) {
          // Actualizar tarea existente
          const updatedTask: Task = {
            ...this.editingTask,
            title: this.newTask.title.trim(),
            description: this.newTask.description?.trim() || '',
            date: this.newTask.date!,
            startTime: this.newTask.startTime!,
            endTime: this.newTask.endTime!,
            categoryId: this.newTask.categoryId || undefined,
            subjectId: this.newTask.subjectId || undefined,
            priority: this.newTask.priority,
            updatedAt: new Date()
          };

          await this.firebaseSvc.updateTask(updatedTask);
          
          this.utilsSvc.presentToast({
            message: 'Tarea actualizada exitosamente',
            duration: 2000,
            color: 'success'
          });
        } else {
          // Crear nueva tarea
          const task: Task = {
            title: this.newTask.title.trim(),
            description: this.newTask.description?.trim() || '',
            date: this.newTask.date!,
            startTime: this.newTask.startTime!,
            endTime: this.newTask.endTime!,
            completed: false,
            userId: this.currentUser.uid,
            categoryId: this.newTask.categoryId || undefined,
            subjectId: this.newTask.subjectId || undefined,
            priority: this.newTask.priority,
            createdAt: new Date()
          };

          await this.firebaseSvc.addTaskWithValidation(task);

          this.utilsSvc.presentToast({
            message: 'Tarea agregada exitosamente',
            duration: 2000,
            color: 'success'
          });
        }

        // Recargar datos
        await this.loadTasks();
        this.filterTasksByDate();
        this.updateCalendarBadges();
        this.closeAddTaskModal();
      }
    } catch (error: any) {
      console.error('Error al guardar tarea:', error);
      
      let errorMessage = 'Error al guardar la tarea';
      if (error.message.includes('Categoría no válida')) {
        errorMessage = 'La categoría seleccionada no es válida';
      } else if (error.message.includes('Materia no válida')) {
        errorMessage = 'La materia seleccionada no es válida';
      }
      
      this.utilsSvc.presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger'
      });
    } finally {
      this.saving = false;
    }
  }

  async toggleTaskCompletion(task: TaskWithDetails) {
    try {
      task.completed = !task.completed;
      await this.firebaseSvc.updateTask(task);
      
      this.utilsSvc.presentToast({
        message: task.completed ? 'Tarea completada' : 'Tarea marcada como pendiente',
        duration: 1500,
        color: task.completed ? 'success' : 'primary'
      });
      
      this.updateCalendarBadges();
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      task.completed = !task.completed;
      this.utilsSvc.presentToast({
        message: 'Error al actualizar la tarea',
        duration: 2000,
        color: 'danger'
      });
    }
  }

  async deleteTask(task: TaskWithDetails) {
    try {
      const alert = document.createElement('ion-alert');
      alert.header = 'Confirmar eliminación';
      alert.message = `¿Estás seguro de que quieres eliminar "${task.title}"?`;
      alert.buttons = [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'confirm',
          handler: async () => {
            try {
              if (task.id) {
                await this.firebaseSvc.deleteTask(task.id);
                await this.loadTasks();
                this.filterTasksByDate();
                this.updateCalendarBadges();
                
                this.utilsSvc.presentToast({
                  message: 'Tarea eliminada',
                  duration: 2000,
                  color: 'success'
                });
              }
            } catch (error) {
              console.error('Error al eliminar tarea:', error);
              this.utilsSvc.presentToast({
                message: 'Error al eliminar la tarea',
                duration: 2000,
                color: 'danger'
              });
            }
          }
        }
      ];
      
      document.body.appendChild(alert);
      await alert.present();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  trackByTaskId(index: number, task: TaskWithDetails): string {
    return task.id || index.toString();
  }

  goBack() {
    this.navCtrl.back();
  }

  signOut() {
    this.firebaseSvc.signOut();
  }
}