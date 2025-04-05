import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TicketsSoportePageRoutingModule } from './tickets-soporte-routing.module';

import { TicketsSoportePage } from './tickets-soporte.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TicketsSoportePageRoutingModule
  ],
  declarations: [TicketsSoportePage]
})
export class TicketsSoportePageModule {}
