import { Component, inject, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { Category } from 'src/app/models/category.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false
})
export class CategoriesPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  alertCtrl = inject(AlertController);

  categories: (Category & { taskCount: number })[] = [];
  user = {} as User;
  loading = false;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    if (!this.user || !this.user.uid) {
      this.utilsSvc.routerLink('/auth');
      return;
    }
  }

  ionViewWillEnter() {
    this.loadCategories();
  }

  // Cargar categorías con estadísticas
  async loadCategories() {
    if (this.loading) return;
    
    this.loading = true;
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      this.categories = await this.firebaseSvc.getCategoriesWithStats(this.user.uid);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar las categorías',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
      this.loading = false;
    }
  }

  // Obtener categorías por defecto
  getDefaultCategories() {
    return this.categories.filter(cat => cat.isDefault);
  }

  // Obtener categorías personalizadas
  getCustomCategories() {
    return this.categories.filter(cat => !cat.isDefault);
  }

  // Obtener número de categorías en uso
  getUsedCategoriesCount(): number {
    return this.categories.filter(cat => cat.taskCount > 0).length;
  }

  // Inicializar categorías por defecto
  async initializeDefaultCategories() {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.initializeDefaultCategories(this.user.uid);
      
      this.utilsSvc.presentToast({
        message: 'Categorías por defecto agregadas exitosamente',
        duration: 2500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      await this.loadCategories();
    } catch (error) {
      console.error('Error al inicializar categorías:', error);
      this.utilsSvc.presentToast({
        message: 'Error al agregar categorías por defecto',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  // Ir a agregar categoría
  goToAddCategory() {
    this.utilsSvc.routerLink('/add-category');
  }

  // Editar categoría
  editCategory(category: Category) {
    this.utilsSvc.routerLink(`/edit-category/${category.id}`);
  }

  // Duplicar categoría
  async duplicateCategory(category: Category) {
    const alert = await this.alertCtrl.create({
      header: 'Duplicar Categoría',
      message: 'Ingresa el nombre para la nueva categoría:',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la categoría',
          value: `${category.name} (Copia)`
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Duplicar',
          handler: (data) => {
            if (data.name && data.name.trim()) {
              this.performDuplication(category.id!, data.name.trim());
              return true; 
            } else {
              this.utilsSvc.presentToast({
                message: 'El nombre es requerido',
                duration: 2000,
                color: 'warning'
              });
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Realizar duplicación
  async performDuplication(categoryId: string, newName: string) {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.duplicateCategory(categoryId, newName);
      
      this.utilsSvc.presentToast({
        message: 'Categoría duplicada exitosamente',
        duration: 2500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      await this.loadCategories();
    } catch (error) {
      console.error('Error al duplicar categoría:', error);
      this.utilsSvc.presentToast({
        message: 'Error al duplicar la categoría',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  // Confirmar eliminación
  async confirmDelete(category: Category & { taskCount: number }) {
    if (category.taskCount > 0) {
      this.utilsSvc.presentToast({
        message: 'No se puede eliminar una categoría que está siendo utilizada',
        duration: 3000,
        color: 'warning',
        position: 'middle'
      });
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteCategory(category)
        }
      ]
    });

    await alert.present();
  }

  // Eliminar categoría
  async deleteCategory(category: Category) {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.deleteCategory(category.id!, this.user.uid);
      
      this.utilsSvc.presentToast({
        message: 'Categoría eliminada exitosamente',
        duration: 2500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      await this.loadCategories();
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      
      let errorMessage = 'Error al eliminar la categoría';
      if (error.message && error.message.includes('utilizada')) {
        errorMessage = 'No se puede eliminar una categoría en uso';
      }
      
      this.utilsSvc.presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }
}