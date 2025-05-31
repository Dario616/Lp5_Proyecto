import { Component, inject, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { Subject } from 'src/app/models/subject.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.page.html',
  styleUrls: ['./subjects.page.scss'],
  standalone: false
})
export class SubjectsPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  alertCtrl = inject(AlertController);

  subjects: Subject[] = [];
  filteredSubjects: Subject[] = [];
  selectedSemester: string | number = 'all';
  user = {} as User;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getSubjects();
  }

  // Obtener materias del usuario
  async getSubjects() {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      this.subjects = await this.firebaseSvc.getUserSubjects(this.user.uid);
      this.filterBySemester();
    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al cargar las materias',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }

  // Filtrar materias por semestre
  filterBySemester() {
    if (this.selectedSemester === 'all') {
      this.filteredSubjects = [...this.subjects];
    } else {
      this.filteredSubjects = this.subjects.filter(
        subject => subject.semester === Number(this.selectedSemester)
      );
    }
  }

  // Ir a agregar materia
  goToAddSubject() {
    this.utilsSvc.routerLink('/add-subject');
  }

  // Editar materia (por implementar)
  editSubject(subject: Subject) {
    // Implementar navegación a página de edición
    console.log('Editar materia:', subject);
    this.utilsSvc.presentToast({
      message: 'Función de edición en desarrollo',
      duration: 2000,
      color: 'warning',
      position: 'middle'
    });
  }

  // Confirmar eliminación
  async confirmDelete(subject: Subject) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la materia "${subject.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => this.deleteSubject(subject)
        }
      ]
    });

    await alert.present();
  }

  // Eliminar materia
  async deleteSubject(subject: Subject) {
    const loading = await this.utilsSvc.loading();
    await loading.present();

    try {
      await this.firebaseSvc.deleteSubject(subject.id!);
      
      this.utilsSvc.presentToast({
        message: 'Materia eliminada exitosamente',
        duration: 2500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });

      this.getSubjects(); // Recargar lista
    } catch (error) {
      console.log(error);
      this.utilsSvc.presentToast({
        message: 'Error al eliminar la materia',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }
}