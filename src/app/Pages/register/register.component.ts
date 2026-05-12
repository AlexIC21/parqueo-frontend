import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const REMEMBER_FLAG_KEY = 'rememberRegisterData';
const REMEMBER_EMAIL_KEY = 'rememberedEmail';
const REMEMBER_NICKNAME_KEY = 'rememberedNickname';
const UCB_EMAIL_PATTERN = /^[^@\s]+@ucb\.edu\.bo$/i;

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirm = false;
  success = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group(
      {
        nombreCompleto: ['', [Validators.required]],
        apodo: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email, Validators.pattern(UCB_EMAIL_PATTERN)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
        recordarme: [false]
      },
      { validators: passwordsMatch }
    );
  }

  ngOnInit(): void {
    const shouldRemember = localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
    if (shouldRemember) {
      const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) ?? '';
      const rememberedNickname = localStorage.getItem(REMEMBER_NICKNAME_KEY) ?? '';
      this.form.patchValue({
        email: rememberedEmail,
        apodo: rememberedNickname,
        recordarme: true
      });
    }
  }

  get nombreCompleto() { return this.form.get('nombreCompleto')!; }
  get apodo() { return this.form.get('apodo')!; }
  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }
  get recordarme() { return this.form.get('recordarme')!; }

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.confirmPassword.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.recordarme.value) {
      localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
      localStorage.setItem(REMEMBER_EMAIL_KEY, this.email.value);
      localStorage.setItem(REMEMBER_NICKNAME_KEY, this.apodo.value);
    } else {
      localStorage.removeItem(REMEMBER_FLAG_KEY);
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_NICKNAME_KEY);
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.register({
      fullName: this.nombreCompleto.value,
      nickname: this.apodo.value,
      email: this.email.value,
      password: this.password.value,
      confirmPassword: this.confirmPassword.value
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.errorMessage = '';
        this.successMessage = response?.message || 'Usuario registrado correctamente.';
        setTimeout(() => this.router.navigate(['/login']), 1800);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const message = typeof error.error?.message === 'string' ? error.error.message : '';
    return message || 'No se pudo registrar el usuario.';
  }
}
