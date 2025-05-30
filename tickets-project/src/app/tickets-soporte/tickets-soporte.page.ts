import { Component, OnInit } from '@angular/core';
import { getData, addData, updateData, deleteData } from 'src/services/firebaseServices';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tickets-soporte',
  templateUrl: './tickets-soporte.page.html',
  styleUrls: ['./tickets-soporte.page.scss'],
  standalone: false
})
export class TicketsSoportePage implements OnInit {

  Medicos: any[] = [];
  showForm: boolean = false;
  isEditing: boolean = false;
  currentEditId: string = '';

  // Modelo para el formulario
  formData = {
    asunto: '',
    descripcion: '',
    estado: 'en espera',
    precio: 0,
    fecha_creacion: '',
    asignado_a: '',
    situacion: ''
  };

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  async getProducts() {
    this.Medicos = await getData();
  }

  ngOnInit() {
    this.getProducts();
  }

  // Mostrar formulario para agregar
  showAddForm() {
    this.resetForm();
    this.isEditing = false;
    this.showForm = true;
  }

  // Mostrar formulario para editar
  editMedico(medico: any) {
    this.formData = { ...medico };
    this.currentEditId = medico.id;
    this.isEditing = true;
    this.showForm = true;
  }

  // Resetear formulario
  resetForm() {
    this.formData = {
      asunto: '',
      descripcion: '',
      estado: 'en espera',
      precio: 0,
      fecha_creacion: '',
      asignado_a: '',
      situacion: ''
    };
    this.currentEditId = '';
  }

  // Cancelar operación
  cancelOperation() {
    this.showForm = false;
    this.resetForm();
  }

  // Guardar (agregar o editar)
  async saveMedico() {
    if (!this.formData.asunto || !this.formData.descripcion) {
      this.showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }

    // Si no hay fecha, agregar la actual
    if (!this.formData.fecha_creacion) {
      this.formData.fecha_creacion = new Date().toLocaleDateString('es-ES');
    }

    let result;
    if (this.isEditing) {
      result = await updateData(this.currentEditId, this.formData);
    } else {
      result = await addData(this.formData);
    }

    if (result.success) {
      this.showToast(
        this.isEditing ? 'Registro actualizado exitosamente' : 'Registro agregado exitosamente',
        'success'
      );
      this.getProducts(); // Recargar lista
      this.cancelOperation();
    } else {
      this.showToast('Error al guardar el registro', 'danger');
    }
  }

  // Confirmar eliminación
  async confirmDelete(medico: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar el ticket "${medico.asunto}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteMedico(medico.id);
          }
        }
      ]
    });

    await alert.present();
  }

  // Eliminar registro
  async deleteMedico(id: string) {
    const result = await deleteData(id);
    
    if (result.success) {
      this.showToast('Registro eliminado exitosamente', 'success');
      this.getProducts(); // Recargar lista
    } else {
      this.showToast('Error al eliminar el registro', 'danger');
    }
  }

  // Mostrar toast
  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}