# MiParking UCB — Frontend

Sistema inteligente de gestión de parqueo para la Universidad Católica Boliviana (campus Tupuraya). Informa en tiempo real la disponibilidad de espacios mediante una aplicación web y señalización inteligente, reduciendo el tiempo de búsqueda y la congestión vehicular dentro del campus.

## Tecnologías

- Angular 17 (standalone components)
- TypeScript 5.4
- SCSS
- Angular Router con lazy loading

## Requisitos previos

- Node.js 18 o superior
- Angular CLI 17

```bash
npm install -g @angular/cli
```

## Instalación

```bash
npm install
```

## Servidor de desarrollo

```bash
npm start
```

Abre `http://localhost:4200/` en tu navegador. La aplicación se recarga automáticamente al guardar cambios.

## Compilar para producción

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`.

## Estructura del proyecto

```
src/
├── app/
│   ├── Pages/
│   │   ├── login/            # Pantalla de inicio de sesión
│   │   ├── register/         # Formulario de registro
│   │   └── dashboard-usuario/# Panel principal de disponibilidad
│   ├── services/
│   │   └── auth.service.ts   # Autenticación y gestión de sesión
│   ├── guards/
│   │   └── auth.guard.ts     # Protección de rutas
│   └── interceptors/
│       └── auth.interceptor.ts # Inyección de token Bearer
├── assets/
│   └── images/               # Recursos gráficos
└── styles.scss               # Estilos globales y variables CSS
```

## Perfiles de usuario

| Perfil        | Descripción                        |
|---------------|------------------------------------|
| Usuario       | Estudiante o miembro de la UCB     |
| Guardia       | Personal de seguridad del campus   |
| Administrador | Gestión completa del sistema       |
| Pantalla      | Modo señalización en entrada       |
| Invitado      | Acceso de solo lectura sin cuenta  |

## Rutas disponibles

| Ruta                | Descripción                        | Acceso       |
|---------------------|------------------------------------|--------------|
| `/login`            | Inicio de sesión                   | Público      |
| `/register`         | Crear cuenta nueva                 | Público      |
| `/dashboard-usuario`| Panel de disponibilidad            | Todos        |
