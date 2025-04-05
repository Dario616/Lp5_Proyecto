import { Component, OnInit } from '@angular/core';
import { getData } from 'src/services/firebaseServices';

@Component({
  selector: 'app-tickets-soporte',
  templateUrl: './tickets-soporte.page.html',
  styleUrls: ['./tickets-soporte.page.scss'],
  standalone : false
})
export class TicketsSoportePage implements OnInit {

  Medicos: any[] = []; 

  async getProducts() {
    this.Medicos = await getData();
  }

  ngOnInit() {
    this.getProducts();
  }
}

