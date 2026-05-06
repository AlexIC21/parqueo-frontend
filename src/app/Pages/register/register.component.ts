import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

const REMEMBER_KEY = 'mp_register_remember';

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

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group(
      {
        nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
        apodo: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        recordarme: [false]
      },
      { validators: passwordsMatch }
    );
  }

  ngOnInit(): void {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.form.patchValue({ ...data, recordarme: true });
      } catch { /* ignore */ }
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
      const toSave = {
        nombreCompleto: this.nombreCompleto.value,
        apodo: this.apodo.value,
        email: this.email.value
      };
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(toSave));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    this.loading = true;
    this.errorMessage = '';

    // Placeholder — conectar al backend cuando esté listo
    setTimeout(() => {
      this.loading = false;
      this.success = true;
      setTimeout(() => this.router.navigate(['/login']), 1800);
    }, 1000);
  }
}
