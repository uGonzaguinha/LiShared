import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonButton, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonAlert 
} from '@ionic/angular/standalone';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonAlert,
    RouterLink,
    FormsModule,
    ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SignupPage {
  signupForm: FormGroup;
  loading = false;
  error = '';
  showSuccessAlert = false;

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ arrowBackOutline });
    this.signupForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]], // Removida validação de tamanho mínimo
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.signup(this.signupForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          // this.showSuccessAlert = true;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error = response.message;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro no cadastro:', error);
        this.error = error.error?.message || 'Erro ao realizar cadastro';
        this.loading = false;
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }
}
