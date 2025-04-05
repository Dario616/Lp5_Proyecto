import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TicketsSoportePage } from './tickets-soporte.page';

const routes: Routes = [
  {
    path: '',
    component: TicketsSoportePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TicketsSoportePageRoutingModule {}
