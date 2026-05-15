import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ScheduleService } from '../../services/schedule.service';
import { CreateScheduleRequest, MyScheduleResponse, UserClass } from '../../models/schedule.model';

@Component({
  selector: 'app-mi-horario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-horario.component.html',
  styleUrls: ['./mi-horario.component.scss']
})
export class MiHorarioComponent implements OnInit {
  readonly weekDays = [
    { key: 'MONDAY', value: 1, label: 'Lun' },
    { key: 'TUESDAY', value: 2, label: 'Mar' },
    { key: 'WEDNESDAY', value: 3, label: 'Mi\u00e9' },
    { key: 'THURSDAY', value: 4, label: 'Jue' },
    { key: 'FRIDAY', value: 5, label: 'Vie' },
    { key: 'SATURDAY', value: 6, label: 'S\u00e1b' },
    { key: 'SUNDAY', value: 7, label: 'Dom' }
  ];

  newClass = this.createEmptyClassForm();
  classes: UserClass[] = [];
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  emptyMessage = '';
  formMessage = '';
  formErrorMessage = '';

  constructor(
    private scheduleService: ScheduleService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.currentUser?.role?.trim().toUpperCase() === 'GUARDIA') {
      this.router.navigate(['/dashboard-guardia']);
      return;
    }

    this.loadSchedule();
  }

  goBack(): void {
    this.router.navigate(['/dashboard-usuario']);
  }

  formatDay(day: string | number): string {
    switch (day) {
      case 1:
      case 'MONDAY':
        return 'Lunes';
      case 2:
      case 'TUESDAY':
        return 'Martes';
      case 3:
      case 'WEDNESDAY':
        return 'Mi\u00e9rcoles';
      case 4:
      case 'THURSDAY':
        return 'Jueves';
      case 5:
      case 'FRIDAY':
        return 'Viernes';
      case 6:
      case 'SATURDAY':
        return 'S\u00e1bado';
      case 7:
      case 'SUNDAY':
        return 'Domingo';
      default:
        return String(day);
    }
  }

  getClassesForDay(day: string | number): UserClass[] {
    const dayNumber = this.getDayNumber(day);
    return this.classes.filter((item) => this.getDayNumber(item.dayOfWeek) === dayNumber);
  }

  addClass(): void {
    this.formMessage = '';
    this.formErrorMessage = '';

    if (!this.auth.getToken()) {
      this.formErrorMessage = 'Debes iniciar sesi\u00f3n para agregar clases';
      this.router.navigate(['/login']);
      return;
    }

    if (!this.validateClassForm()) {
      return;
    }

    const payload: CreateScheduleRequest = {
      dayOfWeek: this.getDayNumber(this.newClass.dayOfWeek),
      startTime: this.newClass.startTime,
      endTime: this.newClass.endTime,
      subject: this.newClass.subject.trim(),
      classroom: this.newClass.classroom.trim()
    };

    this.isSaving = true;
    this.scheduleService
      .createMySchedule(payload)
      .pipe(
        take(1),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: () => {
          this.formMessage = 'Clase agregada correctamente';
          this.resetForm();
          this.loadSchedule();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.formErrorMessage = 'Debes iniciar sesi\u00f3n para agregar clases';
            this.router.navigate(['/login']);
            return;
          }

          this.formErrorMessage = this.getErrorMessage(error);
        }
      });
  }

  private validateClassForm(): boolean {
    if (!this.newClass.dayOfWeek) {
      this.formErrorMessage = 'El d\u00eda es obligatorio';
      return false;
    }

    if (!this.newClass.startTime) {
      this.formErrorMessage = 'La hora de inicio es obligatoria';
      return false;
    }

    if (!this.newClass.endTime) {
      this.formErrorMessage = 'La hora de fin es obligatoria';
      return false;
    }

    if (this.newClass.startTime >= this.newClass.endTime) {
      this.formErrorMessage = 'La hora de inicio debe ser menor a la hora de fin';
      return false;
    }

    if (!this.newClass.subject.trim()) {
      this.formErrorMessage = 'La materia es obligatoria';
      return false;
    }

    return true;
  }

  private resetForm(): void {
    this.newClass = this.createEmptyClassForm();
  }

  private createEmptyClassForm(): {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    subject: string;
    classroom: string;
  } {
    return {
      dayOfWeek: '',
      startTime: '',
      endTime: '',
      subject: '',
      classroom: ''
    };
  }

  private getDayNumber(day: string | number): number {
    if (typeof day === 'number') {
      return day;
    }

    const parsedDay = Number(day);
    if (!Number.isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 7) {
      return parsedDay;
    }

    return this.weekDays.find((item) => item.key === day)?.value ?? 0;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const message = error.error?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message || 'No se pudo agregar la clase';
  }

  private loadSchedule(): void {
    if (!this.auth.getToken()) {
      window.alert('Debes iniciar sesi\u00f3n para ver tu horario');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.emptyMessage = '';

    this.scheduleService
      .getMySchedule()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response: MyScheduleResponse) => {
          this.classes = response.data?.classes ?? [];
          if (!this.classes.length) {
            this.emptyMessage = 'A\u00fan no tienes clases registradas';
          }
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            window.alert('Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente');
            this.router.navigate(['/login']);
            return;
          }

          if (error.status === 403) {
            this.errorMessage = 'No tienes permisos para ver este recurso';
            return;
          }

          this.errorMessage = 'No se pudo cargar tu horario';
        }
      });
  }
}
