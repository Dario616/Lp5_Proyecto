import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AddSubjectPageRoutingModule } from './add-subject-routing.module';
import { AddSubjectPage } from './add-subject.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AddSubjectPageRoutingModule
  ],
  declarations: [AddSubjectPage]
})
export class AddSubjectPageModule {}