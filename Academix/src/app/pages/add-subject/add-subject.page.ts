import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { Subject } from 'src/app/models/subject.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-subject',
  templateUrl: './add-subject.page.html',
  styleUrls: ['./add-subject.page.scss'],
  standalone: false
})
export class AddSubjectPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    code: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    credits: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(10)]),
    semester: new FormControl<number | null>(null, [Validators.required]),
    professor: new FormControl(''),
    schedule: new FormControl('')
  });

  user = {} as User;

  ngOnInit() {
    this.user = this.utilsSvc.getFromLocalStorage('user');
  }

  async submit() {
    if (this.form.valid) {
      const loading = await this.utilsSvc.loading();
      await loading.present();

      try {
        const formValue = this.form.value;
        const subject: Subject = {
          name: formValue.name || '',
          code: formValue.code || '',
          description: formValue.description || '',
          credits: formValue.credits || 0,
          semester: formValue.semester || 1,
          professor: formValue.professor || '',
          schedule: formValue.schedule || '',
          userId: this.user.uid
        };

        await this.firebaseSvc.addSubject(subject);

        this.utilsSvc.presentToast({
          message: 'Materia agregada exitosamente',
          duration: 2500,
          color: 'success',
          position: 'middle',
          icon: 'checkmark-circle-outline'
        });

        this.form.reset();
        this.goBack();

      } catch (error) {
        console.log(error);
        this.utilsSvc.presentToast({
          message: 'Error al agregar la materia',
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

  goBack() {
    this.utilsSvc.routerLink('/subjects');
  }
}