import { Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { MenuController } from '@ionic/angular';
import { FirebaseService } from './services/firebase.service';
import { UtilsService } from './services/utils.service';
import {
  add,
  calendarOutline,
  trashOutline,
  close,
  checkmarkCircle,
  timeOutline,
  personCircleOutline,
  home,
  settings,
  notifications,
  search,
  menu,
  arrowBack,
} from 'ionicons/icons';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  menuCtrl = inject(MenuController);
  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  constructor() {
    // Registrar todos los iconos que usa la aplicación
    addIcons({
      // Iconos principales del calendario
      add: add,
      'calendar-outline': calendarOutline,
      'trash-outline': trashOutline,
      close: close,
      'checkmark-circle': checkmarkCircle,
      'time-outline': timeOutline,

      // Iconos adicionales comunes que podrías necesitar
      'person-circle-outline': personCircleOutline,
      home: home,
      settings: settings,
      notifications: notifications,
      search: search,
      menu: menu,
      'arrow-back': arrowBack,
    });
  }
  // Navegar y cerrar menú
  async navigateAndClose(url: string) {
    await this.menuCtrl.close();
    this.utilsSvc.routerLink(url);
  }

  // Cerrar sesión
  signOut() {
    this.menuCtrl.close();
    this.firebaseSvc.signOut();
  }
}
