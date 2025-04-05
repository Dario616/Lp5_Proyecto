import { Component, inject, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  private navCtrl = inject(NavController);

  // Fecha seleccionada
  selectedDate: string = new Date().toISOString();

  ngOnInit() {
    // Inicialización
  }

  goBack() {
    this.navCtrl.back();
  }

  onDateChange() {
    console.log('Fecha seleccionada:', this.selectedDate);
    // Aquí puedes cargar las tareas para la fecha seleccionada
  }

  signOut() {
    this.firebaseSvc.signOut();
  }
}