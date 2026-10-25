# Sistema de ventas — Snack UAB

Proyecto individual de Práctica Empresarial 1, Ingeniería de Sistemas.

Estado: definición técnica y de alcance. Todavía no existe una aplicación ejecutable.

La primera entrega comprende **Gestión de Productos** y **Reportes y Consolidación de Ventas**, con un registro mínimo de ventas que permita demostrar el funcionamiento completo de los reportes.

## Base tecnológica

- Frontend: React y TypeScript, con Vite y navegación SPA.
- Interfaces: Tailwind CSS y componentes shadcn/ui.
- Backend: API REST con Hono, ejecutada con Bun.
- Base de datos: PostgreSQL.
- Acceso a datos y migraciones: Drizzle ORM; seleccionar versiones estables compatibles al implementar.
- Validación de entradas: Zod.
- Control de versiones: Git local; la publicación en GitHub la realizará el estudiante.

## Documentación

- [Decisiones de arquitectura](docs/arquitectura.md)
- [Alcance y criterios de aceptación](docs/alcance.md)

Las versiones exactas quedarán fijadas al crear la aplicación y su archivo de bloqueo. La compatibilidad documental no sustituye las pruebas de instalación, compilación y conexión a PostgreSQL.
