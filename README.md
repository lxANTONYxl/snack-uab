# Snack UAB

Aplicación individual de **Práctica Empresarial 1 - Ingeniería de Sistemas**.

Primera entrega funcional: Gestión de Productos y Reportes y Consolidación de Ventas, con un punto de venta básico que alimenta los reportes. SPA en español, identidad azul basada en los logos proporcionados por el estudiante y moneda BOB.

## Funcionalidades

- Sesiones de ocho horas, cierre de sesión y permisos comprobados en la API.
- Categorías, registro, búsqueda, edición y desactivación de productos.
- Venta de varios productos, efectivo recibido y cambio.
- Registro QR con confirmación manual y referencia opcional.
- Comprobante interno imprimible; no es factura fiscal.
- Reportes por fecha, efectivo/QR, unidades, gráficos y detalle de ventas.
- CSV del periodo completo; la tabla muestra los últimos 100 movimientos.
- Anulación administrativa con motivo, preservando el historial.
- Protección contra doble envío y carritos con precios desactualizados.

## Tecnologías

React + TypeScript + Vite; Tailwind CSS y componentes adaptados del patrón shadcn/ui (Radix UI + CVA); Hono sobre Bun; PostgreSQL 17; Drizzle ORM con postgres.js; Zod. Versiones en `package.json` y `bun.lock`.

## Ejecutar en Windows

Requisitos: Bun y Docker Desktop iniciado con contenedores Linux. Node.js puede ser necesario para herramientas auxiliares; el servidor se ejecuta con Bun.

Desde la raíz del proyecto:

```powershell
bun install --frozen-lockfile
Copy-Item .env.example .env
bun run db:up
bun run db:migrate
bun run db:seed
bun run dev
```

Si `.env` ya existe, conserva su configuración. Si PostgreSQL todavía inicia, consulta `docker compose ps` y espera a que esté saludable antes de migrar.

- Aplicación: http://127.0.0.1:5173
- API: http://127.0.0.1:3001/api/health
- PostgreSQL: puerto local 54329; datos persistidos en el volumen `snack_pgdata` de Docker Compose.
- Cuenta de demostración: **admin@snack.uab** / **SnackUAB2026!**.

Estas credenciales de `.env.example` son exclusivamente para ejemplos locales. Configúralas antes de sembrar una instalación con datos reales. La semilla no cambia contraseñas de cuentas existentes.

Abre exactamente `127.0.0.1`: `APP_ORIGIN` limita el origen de las operaciones de escritura. Ctrl+C detiene los servidores; `docker compose stop db` detiene la base sin eliminar datos.

La semilla crea cuatro categorías y doce productos, sin ventas. Durante la verificación se agregó **PAN-004 / Salteña de pollo** y se registraron dos ventas de demostración el **24/10/2026**: V-00001, Bs 10 en efectivo; V-00002, Bs 15 por QR simulado, referencia DEMO-QR-001. Se conservaron para demostrar el reporte y no representan cobros reales. Una instalación nueva no incluye esas operaciones.

## Verificar

```powershell
bun run typecheck
bun run test
bun run test:integration
bun run build
```

Las pruebas de integración crean y eliminan una base exclusiva `snack_uab_test_<id>`. No modifican los datos de trabajo. El usuario PostgreSQL de pruebas necesita permiso para crear bases; el contenedor local ya lo tiene.

La compilación deja la SPA en `apps/web/dist`. Para probarla, configura `APP_ORIGIN=http://127.0.0.1:3001` y ejecuta `bun run start`, sin el servidor API de desarrollo simultáneo. Un despliegue real requiere dominio, HTTPS, cookies seguras y copias de seguridad; esta entrega está validada localmente.

## Estructura y documentación

`apps/api/src` contiene API, autenticación, reglas y esquema; `apps/web/src`, pantallas y componentes; `drizzle`, migraciones; `scripts`, utilidades; `tests`, integración; `docs`, documentación y capturas; `output/pdf`, evidencia.

- [Arquitectura](docs/arquitectura.md)
- [Modelo de datos](docs/modelo-datos.md)
- [Alcance](docs/alcance.md)
- [Verificación](docs/verificacion.md)
- [Texto para el formulario](docs/formulario-entrega.md)

Pedidos pendientes, inventario, administración visual de usuarios y apertura/arqueo/cierre de caja son ampliaciones posteriores. El carrito vive en memoria y se descarta al salir de la pantalla. El QR no está conectado al banco. Los reportes expresan ventas, no utilidad.

Los commits son locales; el estudiante realizará la publicación en GitHub.
