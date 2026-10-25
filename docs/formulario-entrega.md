# Texto preparado para el formulario

## Título del entregable

Módulos de Gestión de Productos y Consolidación de Ventas para el Snack UAB.

## Descripción técnica y justificación

Se desarrolló una aplicación web para centralizar el catálogo y calcular automáticamente las ventas registradas de la tienda de snacks de la Universidad Adventista de Bolivia. Permite registrar, consultar, editar y desactivar productos y consultar reportes por fecha con total vendido, cantidad de operaciones, unidades y desglose por efectivo y QR. Incluye un registro básico de ventas como fuente de los reportes y conserva el precio aplicado en cada operación.

La solución utiliza React y TypeScript para la SPA, Vite para desarrollo y compilación, Tailwind CSS y componentes basados en Radix UI/shadcn para las interfaces, Hono sobre Bun para la API, y PostgreSQL con Drizzle ORM para persistencia. Se empleó una arquitectura cliente-servidor con backend modular, validaciones, sesiones, permisos, transacciones y protección contra duplicados. La paleta azul se basa en los logos proporcionados como referencia.

Se verificó mediante 22 pruebas automatizadas y un recorrido en el navegador. Una venta de Bs 10,00 en efectivo y otra de Bs 15,00 por QR simulado produjeron un reporte de Bs 25,00 con ambos métodos separados. El QR se confirma manualmente; no hay integración bancaria. El entregable facilita consolidar ventas y reduce la necesidad de sumar registros manualmente; la reducción de filas requiere una evaluación operativa posterior.

## Enlace al recurso / evidencia funcional

Pendiente: URL del repositorio que publicará el estudiante en GitHub, con acceso de lectura para la docente. La dirección local 127.0.0.1 no sustituye ese enlace.

## Archivo de evidencia

Adjuntar `output/pdf/evidencia-snack-uab.pdf`, de una página, con capturas de ejecución local y resultado de comprobación.

## Pendientes administrativos

Confirmar con la docente sellos, firmas y validación institucional. Aún no se conoce la URL del formulario ni su fecha límite. Este texto está preparado para envío posterior; no se ha enviado.
