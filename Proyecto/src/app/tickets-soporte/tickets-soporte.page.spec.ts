import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketsSoportePage } from './tickets-soporte.page';

describe('TicketsSoportePage', () => {
  let component: TicketsSoportePage;
  let fixture: ComponentFixture<TicketsSoportePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketsSoportePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
