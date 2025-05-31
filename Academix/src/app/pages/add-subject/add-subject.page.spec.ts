import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSubjectPage } from './add-subject.page';

describe('AddSubjectPage', () => {
  let component: AddSubjectPage;
  let fixture: ComponentFixture<AddSubjectPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSubjectPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
