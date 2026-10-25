# Verificación de la primera entrega

Pruebas funcionales: 24/10/2026. Revisión final: 25/10/2026, hora de Bolivia.

## Verificación automática

- `bun run typecheck`: correcto.
- `bun run test`: 9 pruebas unitarias correctas.
- `bun run test:integration`: 13 pruebas con PostgreSQL real correctas.
- `bun run build`: compilación de la SPA para distribución.

Se cubren centavos exactos, importes inválidos, fechas y límites locales, QR sin confirmar, productos repetidos, códigos duplicados, permisos, sesión, efectivo insuficiente, ambos métodos, consolidación, precios históricos, carritos desactualizados, doble envío concurrente, desactivación, anulación y CSV. La integración emplea una base temporal exclusiva; no borra la base de trabajo.

## Recorrido en el navegador

1. Inicio de sesión con la cuenta de demostración.
2. V-00001: un sándwich de Bs 10,00; efectivo recibido Bs 20,00; cambio Bs 10,00.
3. V-00002: tres empanadas de Bs 5,00; QR simulado de Bs 15,00, referencia DEMO-QR-001.
4. Reporte del 24/10/2026: dos ventas, Bs 25,00, efectivo Bs 10,00, QR Bs 15,00 y cuatro unidades.
5. Registro de PAN-004, Salteña de pollo, categoría Panadería, Bs 7,50.
6. Búsqueda por PAN-004 con mensaje de registro exitoso.
7. Revisión visual de navegación adaptable y comprobante.

No se observaron errores de consola durante el recorrido. Se revisó la vista normal del navegador integrado, el catálogo a 1366 px de escritorio y a 390 px en móvil. Se corrigió un desbordamiento horizontal causado por una etiqueta accesible de la tabla; la tabla conserva su propio desplazamiento horizontal en móvil. Se comprobó también la carga del producto persistido desde la SPA compilada servida por Bun, sin errores de consola. Esto no constituye una matriz completa de dispositivos. No se probó impresión física ni conexión bancaria. Las capturas de evidencia son reales.

## Límites

Datos de ejemplo; QR manual; carrito en memoria; roles aplicados en la API sin administración visual de cuentas. Pendientes: existencias, pedidos de estudiantes y arqueo/cierre de caja. No se ha medido reducción de filas. No se publicó en GitHub ni se envió el formulario institucional.
