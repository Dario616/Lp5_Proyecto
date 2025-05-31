import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { User } from '../models/user.model';
import { Task, TaskWithDetails, TaskStatistics, TaskFilter, TaskUtils } from '../models/task.model';
import { Category, DEFAULT_CATEGORIES } from '../models/category.model';
import { Subject } from '../models/subject.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  deleteField,
  orderBy,
} from '@angular/fire/firestore';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  utilsSvc = inject(UtilsService);

  // === AUTENTICACIÓN ===

  // Iniciar sesión
  signIn(user: User) {
    return signInWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Obtener instancia de autenticación
  getAuth() {
    return getAuth();
  }

  // Obtener instancia de Firestore
  getFirestore() {
    return getFirestore();
  }

  // Crear Usuario
  signUp(user: User) {
    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);
  }

  // Actualizar Usuario
  updateUser(displayName: string) {
    return updateProfile(getAuth().currentUser, { displayName });
  }

  // Recuperar contraseña
  sendRecoveryEmail(email: string) {
    return sendPasswordResetEmail(getAuth(), email);
  }

  // Cerrar sesión
  signOut() {
    getAuth().signOut();
    localStorage.removeItem('user');
    this.utilsSvc.routerLink('/auth');
  }

  // === BASE DE DATOS ===

  // Setear un documento
  setDocument(path: string, data: any) {
    return setDoc(doc(getFirestore(), path), data);
  }

  // Obtener un documento
  async getDocument(path: string) {
    return (await getDoc(doc(getFirestore(), path))).data();
  }

  // === MÉTODOS PARA TAREAS ===

  // Agregar una nueva tarea
  async addTask(task: Task): Promise<string> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const docRef = await addDoc(tasksCollection, {
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error al agregar tarea:', error);
      throw error;
    }
  }

  // Obtener todas las tareas de un usuario
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('userId', '==', userId));

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({
          id: doc.id,
          ...taskData,
        });
      });

      // Ordenar en el cliente en lugar de en Firestore
      return tasks.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      throw error;
    }
  }

  // Obtener tareas de un usuario para una fecha específica
  async getUserTasksByDate(userId: string, date: string): Promise<Task[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({
          id: doc.id,
          ...taskData,
        });
      });

      // Ordenar por hora de inicio en el cliente
      return tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    } catch (error) {
      console.error('Error al obtener tareas por fecha:', error);
      throw error;
    }
  }

  // Actualizar una tarea
  async updateTask(task: Task): Promise<void> {
    try {
      if (!task.id) {
        throw new Error('ID de tarea requerido para actualizar');
      }

      const db = getFirestore();
      const taskDoc = doc(db, 'tasks', task.id);

      const updateData: any = {
        title: task.title,
        description: task.description,
        date: task.date,
        startTime: task.startTime,
        endTime: task.endTime,
        completed: task.completed,
        updatedAt: new Date(),
      };

      // Agregar campos opcionales si existen
      if (task.categoryId !== undefined) {
        updateData.categoryId = task.categoryId;
      }
      if (task.subjectId !== undefined) {
        updateData.subjectId = task.subjectId;
      }
      if (task.priority !== undefined) {
        updateData.priority = task.priority;
      }

      await updateDoc(taskDoc, updateData);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
  }

  // Eliminar una tarea
  async deleteTask(taskId: string): Promise<void> {
    try {
      const db = getFirestore();
      const taskDoc = doc(db, 'tasks', taskId);
      await deleteDoc(taskDoc);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  }

  // Marcar tarea como completada/incompleta
  async toggleTaskCompletion(
    taskId: string,
    completed: boolean
  ): Promise<void> {
    try {
      const db = getFirestore();
      const taskDoc = doc(db, 'tasks', taskId);

      await updateDoc(taskDoc, {
        completed: completed,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al cambiar estado de tarea:', error);
      throw error;
    }
  }

  // Obtener tareas pendientes de un usuario
  async getPendingTasks(userId: string): Promise<Task[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('completed', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({
          id: doc.id,
          ...taskData,
        });
      });

      // Ordenar en el cliente
      return tasks.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
    } catch (error) {
      console.error('Error al obtener tareas pendientes:', error);
      throw error;
    }
  }

  // === MÉTODOS ADICIONALES PARA ESTADÍSTICAS ===

  // Obtener tareas completadas de un usuario
  async getCompletedTasks(userId: string): Promise<Task[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('completed', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({
          id: doc.id,
          ...taskData,
        });
      });

      return tasks.sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date); // Más recientes primero
        }
        return b.startTime.localeCompare(a.startTime);
      });
    } catch (error) {
      console.error('Error al obtener tareas completadas:', error);
      throw error;
    }
  }

  // Obtener tareas vencidas de un usuario
  async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('completed', '==', false),
        where('date', '<', today)
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({
          id: doc.id,
          ...taskData,
        });
      });

      return tasks.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error al obtener tareas vencidas:', error);
      throw error;
    }
  }

  // Obtener estadísticas del usuario
  async getUserStatistics(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  }> {
    try {
      const allTasks = await this.getUserTasks(userId);
      const completedTasks = allTasks.filter((task) => task.completed);
      const pendingTasks = allTasks.filter((task) => !task.completed);
      const today = new Date().toISOString().split('T')[0];
      const overdueTasks = pendingTasks.filter((task) => task.date < today);

      return {
        total: allTasks.length,
        completed: completedTasks.length,
        pending: pendingTasks.length - overdueTasks.length,
        overdue: overdueTasks.length,
        completionRate:
          allTasks.length > 0
            ? Math.round((completedTasks.length / allTasks.length) * 100)
            : 0,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // Obtener tareas de un rango de fechas
  async getTasksByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Task[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({
          id: doc.id,
          ...taskData,
        });
      });

      return tasks.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
    } catch (error) {
      console.error('Error al obtener tareas por rango de fechas:', error);
      throw error;
    }
  }

  // Duplicar una tarea
  async duplicateTask(task: Task): Promise<string> {
    try {
      const newTask: Partial<Task> = {
        title: `${task.title} (Copia)`,
        description: task.description,
        date: task.date,
        startTime: task.startTime,
        endTime: task.endTime,
        completed: false,
        userId: task.userId,
        categoryId: task.categoryId,
        subjectId: task.subjectId,
        priority: task.priority,
      };

      return await this.addTask(newTask as Task);
    } catch (error) {
      console.error('Error al duplicar tarea:', error);
      throw error;
    }
  }

  // Marcar múltiples tareas como completadas
  async markMultipleTasksAsCompleted(taskIds: string[]): Promise<void> {
    try {
      const db = getFirestore();
      const promises = taskIds.map((taskId) => {
        const taskDoc = doc(db, 'tasks', taskId);
        return updateDoc(taskDoc, {
          completed: true,
          updatedAt: new Date(),
        });
      });

      await Promise.all(promises);
    } catch (error) {
      console.error(
        'Error al marcar múltiples tareas como completadas:',
        error
      );
      throw error;
    }
  }

  // Eliminar múltiples tareas
  async deleteMultipleTasks(taskIds: string[]): Promise<void> {
    try {
      const db = getFirestore();
      const promises = taskIds.map((taskId) => {
        const taskDoc = doc(db, 'tasks', taskId);
        return deleteDoc(taskDoc);
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error al eliminar múltiples tareas:', error);
      throw error;
    }
  }

  // === MÉTODOS PARA MATERIAS ===

  // Agregar una nueva materia
  async addSubject(subject: Subject): Promise<string> {
    try {
      const db = getFirestore();
      const subjectsCollection = collection(db, 'subjects');
      const docRef = await addDoc(subjectsCollection, {
        ...subject,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error al agregar materia:', error);
      throw error;
    }
  }

  // Obtener todas las materias de un usuario
  async getUserSubjects(userId: string): Promise<Subject[]> {
    try {
      const db = getFirestore();
      const subjectsCollection = collection(db, 'subjects');
      const q = query(subjectsCollection, where('userId', '==', userId));

      const querySnapshot = await getDocs(q);
      const subjects: Subject[] = [];

      querySnapshot.forEach((doc) => {
        const subjectData = doc.data() as Subject;
        subjects.push({
          id: doc.id,
          ...subjectData,
        });
      });

      // Ordenar por semestre y nombre
      return subjects.sort((a, b) => {
        if (a.semester !== b.semester) {
          return a.semester - b.semester;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error al obtener materias:', error);
      throw error;
    }
  }

  // Eliminar una materia
  async deleteSubject(subjectId: string): Promise<void> {
    try {
      const db = getFirestore();
      const subjectDoc = doc(db, 'subjects', subjectId);
      await deleteDoc(subjectDoc);
    } catch (error) {
      console.error('Error al eliminar materia:', error);
      throw error;
    }
  }

  // === MÉTODOS PARA CATEGORÍAS ===

  // Inicializar categorías por defecto para un nuevo usuario
  async initializeDefaultCategories(userId: string): Promise<void> {
    try {
      const db = getFirestore();
      const categoriesCollection = collection(db, 'categories');

      // Verificar si ya tiene categorías
      const existingCategories = await this.getUserCategories(userId);
      if (existingCategories.length > 0) {
        return; // Ya tiene categorías, no necesita inicializar
      }

      // Crear categorías por defecto
      const promises = DEFAULT_CATEGORIES.map((categoryData) => {
        return addDoc(categoriesCollection, {
          ...categoryData,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await Promise.all(promises);
      console.log('Categorías por defecto inicializadas');
    } catch (error) {
      console.error('Error al inicializar categorías por defecto:', error);
      throw error;
    }
  }

  // Crear una nueva categoría
  async addCategory(category: Category): Promise<string> {
    try {
      const db = getFirestore();
      const categoriesCollection = collection(db, 'categories');

      const docRef = await addDoc(categoriesCollection, {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error al agregar categoría:', error);
      throw error;
    }
  }

  // Obtener todas las categorías de un usuario
  async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const db = getFirestore();
      const categoriesCollection = collection(db, 'categories');
      const q = query(categoriesCollection, where('userId', '==', userId));

      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];

      querySnapshot.forEach((doc) => {
        const categoryData = doc.data() as Category;
        categories.push({
          id: doc.id,
          ...categoryData,
        });
      });

      // Ordenar: primero las por defecto, luego por nombre
      return categories.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  }

  // Obtener una categoría por ID
  async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const db = getFirestore();
      const categoryDoc = doc(db, 'categories', categoryId);
      const docSnap = await getDoc(categoryDoc);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Category;
      }

      return null;
    } catch (error) {
      console.error('Error al obtener categoría:', error);
      throw error;
    }
  }

  // Actualizar una categoría
  async updateCategory(category: Category): Promise<void> {
    try {
      if (!category.id) {
        throw new Error('ID de categoría requerido para actualizar');
      }

      const db = getFirestore();
      const categoryDoc = doc(db, 'categories', category.id);

      await updateDoc(categoryDoc, {
        name: category.name,
        color: category.color,
        icon: category.icon,
        description: category.description,
        updatedAt: new Date(),
        // No actualizar isDefault ni userId por seguridad
      });
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  }

  // Verificar si una categoría está siendo utilizada por tareas
  async isCategoryInUse(categoryId: string, userId: string): Promise<boolean> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(
        tasksCollection,
        where('userId', '==', userId),
        where('categoryId', '==', categoryId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error al verificar uso de categoría:', error);
      return true; // En caso de error, asumir que está en uso por seguridad
    }
  }

  // Eliminar una categoría
  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    try {
      // Verificar si la categoría está en uso
      const inUse = await this.isCategoryInUse(categoryId, userId);
      if (inUse) {
        throw new Error(
          'No se puede eliminar una categoría que está siendo utilizada por tareas'
        );
      }

      const db = getFirestore();
      const categoryDoc = doc(db, 'categories', categoryId);
      await deleteDoc(categoryDoc);
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  }

  // Obtener categorías con estadísticas de uso
  async getCategoriesWithStats(
    userId: string
  ): Promise<(Category & { taskCount: number })[]> {
    try {
      const categories = await this.getUserCategories(userId);
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');

      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const q = query(
            tasksCollection,
            where('userId', '==', userId),
            where('categoryId', '==', category.id)
          );

          const querySnapshot = await getDocs(q);

          return {
            ...category,
            taskCount: querySnapshot.size,
          };
        })
      );

      return categoriesWithStats;
    } catch (error) {
      console.error('Error al obtener categorías con estadísticas:', error);
      throw error;
    }
  }

  // Duplicar una categoría
  async duplicateCategory(
    categoryId: string,
    newName: string
  ): Promise<string> {
    try {
      const originalCategory = await this.getCategoryById(categoryId);
      if (!originalCategory) {
        throw new Error('Categoría no encontrada');
      }

      const duplicatedCategory: Category = {
        name: newName,
        color: originalCategory.color,
        icon: originalCategory.icon,
        description: originalCategory.description,
        userId: originalCategory.userId,
        isDefault: false, // Las copias nunca son por defecto
      };

      return await this.addCategory(duplicatedCategory);
    } catch (error) {
      console.error('Error al duplicar categoría:', error);
      throw error;
    }
  }

  // === MÉTODOS INTEGRADOS PARA TAREAS, CATEGORÍAS Y MATERIAS ===

  async getUserTasksWithDetails(userId: string): Promise<TaskWithDetails[]> {
    try {
      const [tasks, categories, subjects] = await Promise.all([
        this.getUserTasks(userId),
        this.getUserCategories(userId),
        this.getUserSubjects(userId),
      ]);

      const categoryMap = new Map(categories.map((cat) => [cat.id!, cat]));
      const subjectMap = new Map(subjects.map((sub) => [sub.id!, sub]));

      return tasks.map((task) => {
        const taskWithDetails: TaskWithDetails = { ...task };
        if (task.categoryId && categoryMap.has(task.categoryId)) {
          const category = categoryMap.get(task.categoryId)!;
          taskWithDetails.category = {
            id: category.id!,
            name: category.name,
            color: category.color,
            icon: category.icon,
          };
        }
        if (task.subjectId && subjectMap.has(task.subjectId)) {
          const subject = subjectMap.get(task.subjectId)!;
          taskWithDetails.subject = {
            id: subject.id!,
            name: subject.name,
            code: subject.code,
            semester: subject.semester,
          };
        }
        return taskWithDetails;
      });
    } catch (error) {
      console.error('Error al obtener tareas con detalles:', error);
      throw error;
    }
  }

  async getFilteredTasksWithDetails(userId: string, filter: TaskFilter): Promise<TaskWithDetails[]> {
    try {
      const allTasks = await this.getUserTasksWithDetails(userId);
      return TaskUtils.filterTasks(allTasks, filter);
    } catch (error) {
      console.error('Error al obtener tareas filtradas:', error);
      throw error;
    }
  }

  async getTasksByCategory(userId: string, categoryId: string): Promise<TaskWithDetails[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('userId', '==', userId), where('categoryId', '==', categoryId));
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({ id: doc.id, ...taskData });
      });

      const [categories, subjects] = await Promise.all([this.getUserCategories(userId), this.getUserSubjects(userId)]);
      const categoryMap = new Map(categories.map((cat) => [cat.id!, cat]));
      const subjectMap = new Map(subjects.map((sub) => [sub.id!, sub]));

      return tasks.map((task) => {
        const taskWithDetails: TaskWithDetails = { ...task };
        if (task.categoryId && categoryMap.has(task.categoryId)) {
          const category = categoryMap.get(task.categoryId)!;
          taskWithDetails.category = {
            id: category.id!,
            name: category.name,
            color: category.color,
            icon: category.icon,
          };
        }
        if (task.subjectId && subjectMap.has(task.subjectId)) {
          const subject = subjectMap.get(task.subjectId)!;
          taskWithDetails.subject = {
            id: subject.id!,
            name: subject.name,
            code: subject.code,
            semester: subject.semester,
          };
        }
        return taskWithDetails;
      }).sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
    } catch (error) {
      console.error('Error al obtener tareas por categoría:', error);
      throw error;
    }
  }

  async getTasksBySubject(userId: string, subjectId: string): Promise<TaskWithDetails[]> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('userId', '==', userId), where('subjectId', '==', subjectId));
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as Task;
        tasks.push({ id: doc.id, ...taskData });
      });

      const [categories, subjects] = await Promise.all([this.getUserCategories(userId), this.getUserSubjects(userId)]);
      const categoryMap = new Map(categories.map((cat) => [cat.id!, cat]));
      const subjectMap = new Map(subjects.map((sub) => [sub.id!, sub]));

      return tasks.map((task) => {
        const taskWithDetails: TaskWithDetails = { ...task };
        if (task.categoryId && categoryMap.has(task.categoryId)) {
          const category = categoryMap.get(task.categoryId)!;
          taskWithDetails.category = {
            id: category.id!,
            name: category.name,
            color: category.color,
            icon: category.icon,
          };
        }
        if (task.subjectId && subjectMap.has(task.subjectId)) {
          const subject = subjectMap.get(task.subjectId)!;
          taskWithDetails.subject = {
            id: subject.id!,
            name: subject.name,
            code: subject.code,
            semester: subject.semester,
          };
        }
        return taskWithDetails;
      }).sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
    } catch (error) {
      console.error('Error al obtener tareas por materia:', error);
      throw error;
    }
  }

  async getAdvancedUserStatistics(userId: string): Promise<TaskStatistics> {
    try {
      const tasks = await this.getUserTasksWithDetails(userId);
      return TaskUtils.createAdvancedStatistics(tasks);
    } catch (error) {
      console.error('Error al obtener estadísticas avanzadas:', error);
      throw error;
    }
  }

  async getTasksGroupedByCategory(userId: string): Promise<Map<string, TaskWithDetails[]>> {
    try {
      const tasks = await this.getUserTasksWithDetails(userId);
      return TaskUtils.groupTasksByCategory(tasks);
    } catch (error) {
      console.error('Error al agrupar tareas por categoría:', error);
      throw error;
    }
  }

  async getTasksGroupedBySubject(userId: string): Promise<Map<string, TaskWithDetails[]>> {
    try {
      const tasks = await this.getUserTasksWithDetails(userId);
      return TaskUtils.groupTasksBySubject(tasks);
    } catch (error) {
      console.error('Error al agrupar tareas por materia:', error);
      throw error;
    }
  }

  async isSubjectInUse(subjectId: string, userId: string): Promise<boolean> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('userId', '==', userId), where('subjectId', '==', subjectId));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error al verificar uso de materia:', error);
      return true;
    }
  }

  async getTodayTasksWithDetails(userId: string): Promise<TaskWithDetails[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const filter: TaskFilter = { dateFrom: today, dateTo: today };
      return await this.getFilteredTasksWithDetails(userId, filter);
    } catch (error) {
      console.error('Error al obtener tareas de hoy:', error);
      throw error;
    }
  }

  async getPendingTasksWithDetails(userId: string): Promise<TaskWithDetails[]> {
    try {
      const filter: TaskFilter = { completed: false };
      return await this.getFilteredTasksWithDetails(userId, filter);
    } catch (error) {
      console.error('Error al obtener tareas pendientes:', error);
      throw error;
    }
  }

  async getOverdueTasksWithDetails(userId: string): Promise<TaskWithDetails[]> {
    try {
      const allTasks = await this.getUserTasksWithDetails(userId);
      return allTasks.filter((task) => TaskUtils.isOverdue(task));
    } catch (error) {
      console.error('Error al obtener tareas vencidas:', error);
      throw error;
    }
  }

  async migrateTaskCategories(userId: string): Promise<void> {
    try {
      const db = getFirestore();
      const tasksCollection = collection(db, 'tasks');
      const q = query(tasksCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const categories = await this.getUserCategories(userId);
      const categoryMap = new Map(categories.map((cat) => [cat.name.toLowerCase(), cat.id!]));
      const updatePromises: Promise<void>[] = [];

      querySnapshot.forEach((doc) => {
        const taskData = doc.data() as any;
        if (taskData.category && typeof taskData.category === 'string' && !taskData.categoryId) {
          const categoryId = categoryMap.get(taskData.category.toLowerCase());
          if (categoryId) {
            const taskDoc = doc.ref;
            updatePromises.push(
              updateDoc(taskDoc, {
                categoryId: categoryId,
                category: deleteField(),
              })
            );
          }
        }
      });

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        console.log(`Migradas ${updatePromises.length} tareas`);
      }
    } catch (error) {
      console.error('Error al migrar categorías de tareas:', error);
      throw error;
    }
  }

  async addTaskWithValidation(task: Task): Promise<string> {
    try {
      if (task.categoryId) {
        const category = await this.getCategoryById(task.categoryId);
        if (!category || category.userId !== task.userId) {
          throw new Error('Categoría no válida');
        }
      }
      if (task.subjectId) {
        const subject = await this.getSubjectById(task.subjectId);
        if (!subject || subject.userId !== task.userId) {
          throw new Error('Materia no válida');
        }
      }
      return await this.addTask(task);
    } catch (error) {
      console.error('Error al agregar tarea con validación:', error);
      throw error;
    }
  }

  async getSubjectById(subjectId: string): Promise<Subject | null> {
    try {
      const db = getFirestore();
      const subjectDoc = doc(db, 'subjects', subjectId);
      const docSnap = await getDoc(subjectDoc);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Subject;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener materia:', error);
      throw error;
    }
  }
}