import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^@\s]+@ucb\.edu\.bo$/i)
        ]
      ],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login({
      email: this.email.value,
      password: this.password.value
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.auth.redirectByRole();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  enterAsGuest(): void {
    this.auth.loginAsGuest();
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const message = typeof error.error?.message === 'string' ? error.error.message : '';

    if (message) {
      return message;
    }

    if (error.status === 400) {
      return 'El correo debe pertenecer al dominio @ucb.edu.bo.';
    }

    if (error.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }

    return 'No se pudo iniciar sesión. Intenta nuevamente.';
  }
}
