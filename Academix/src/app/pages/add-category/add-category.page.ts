import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/models/user.model';
import { Category, CATEGORY_COLORS, CATEGORY_ICONS } from 'src/app/models/category.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.page.html',
  styleUrls: ['./add-category.page.scss'],
  standalone: false
})
export class AddCategoryPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  route = inject(ActivatedRoute);

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]),
    description: new FormControl('', [Validators.maxLength(100)]),
    color: new FormControl('primary', [Validators.required]),
    icon: new FormControl('pricetag-outline', [Validators.required])
  });

  user = {} as User;
  isEditMode = false;
  categoryId: string | null = null;
  availableColors = CATEGORY_COLORS;
  availableIcons = CATEGORY_ICONS;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
    if (!this.user || !this.user.uid) {
      this.utilsSvc.routerLink('/auth');
      return;
    }

    // Verificar si estamos en modo edición
    this.categoryId = this.route.snapshot.paramMap.get('id');
    if (this.categoryId) {
      this.isEditMode = true;
      this.loadCategoryForEdit();
    }
  }

  // Cargar categoría para editar
  async loadCategoryForEdit() {
    if (!this.categoryId) return;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      const category = await this.firebaseSvc.getCategoryById(this.categoryId);
      if (category) {
        this.form.patchValue({
          name: category.name,
          description: category.description || '',
          color: category.color,
          icon: category.icon
        });
      } else {
        this.utilsSvc.presentToast({
          message: 'Categoría no encontrada',
          duration: 2500,
          color: 'danger'
        });
        this.goBack();
      }
    } catch (error) {
      console.error('Error al cargar categoría:', error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar la categoría',
        duration: 2500,
        color: 'danger'
      });
      this.goBack();
    } finally {
      loading.dismiss();
    }
  }

  // Seleccionar color
  selectColor(colorValue: string) {
    this.form.patchValue({ color: colorValue });
  }

  // Seleccionar ícono
  selectIcon(iconValue: string) {
    this.form.patchValue({ icon: iconValue });
  }

  // Obtener nombre del color
  getColorName(colorValue: string): string {
    const color = this.availableColors.find(c => c.value === colorValue);
    return color ? color.name : 'Color';
  }

  // Enviar formulario
  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        const formValue = this.form.value;
        
        if (this.isEditMode && this.categoryId) {
          // Actualizar categoría existente
          const category: Category = {
            id: this.categoryId,
            name: formValue.name || '',
            description: formValue.description || '',
            color: formValue.color || 'primary',
            icon: formValue.icon || 'pricetag-outline',
            userId: this.user.uid
          };

          await this.firebaseSvc.updateCategory(category);

          this.utilsSvc.presentToast({
            message: 'Categoría actualizada exitosamente',
            duration: 2500,
            color: 'success',
            position: 'middle',
            icon: 'checkmark-circle-outline'
          });
        } else {
          // Crear nueva categoría
          const category: Category = {
            name: formValue.name || '',
            description: formValue.description || '',
            color: formValue.color || 'primary',
            icon: formValue.icon || 'pricetag-outline',
            userId: this.user.uid,
            isDefault: false
          };

          await this.firebaseSvc.addCategory(category);

          this.utilsSvc.presentToast({
            message: 'Categoría creada exitosamente',
            duration: 2500,
            color: 'success',
            position: 'middle',
            icon: 'checkmark-circle-outline'
          });
        }

        this.form.reset();
        this.goBack();

      } catch (error: any) {
        console.error('Error al guardar categoría:', error);
        
        let errorMessage = this.isEditMode 
          ? 'Error al actualizar la categoría' 
          : 'Error al crear la categoría';
        
        if (error.code === 'permission-denied') {
          errorMessage = 'Error de permisos. Verifica tu autenticación.';
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
    } else {
      this.utilsSvc.presentToast({
        message: 'Por favor completa todos los campos requeridos',
        duration: 2500,
        color: 'warning'
      });
    }
  }

  // Volver atrás
  goBack() {
    this.utilsSvc.routerLink('/categories');
  }
}