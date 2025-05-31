import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // 👈 Agregado

import { IonicModule } from '@ionic/angular';

import { AddCategoryPageRoutingModule } from './add-category-routing.module';

import { AddCategoryPage } from './add-category.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // 👈 Agregado aquí
    IonicModule,
    AddCategoryPageRoutingModule
  ],
  declarations: [AddCategoryPage]
})
export class AddCategoryPageModule {}
