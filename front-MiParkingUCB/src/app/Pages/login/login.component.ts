import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  readonly roles: { value: UserRole; label: string }[] = [
    { value: 'usuario', label: 'Usuario' },
    { value: 'docente', label: 'Docente' },
    { value: 'administrador', label: 'Administrador' },
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['usuario', Validators.required]
    });
  }

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get role() { return this.form.get('role')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Credenciales incorrectas. Intenta de nuevo.';
      }
    });
  }

  enterAsGuest(): void {
    this.auth.loginAsGuest();
  }
}
