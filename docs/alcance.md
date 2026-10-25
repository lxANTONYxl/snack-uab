# Alcance y criterios de aceptación

Estado al 25/10/2026: primera entrega implementada y verificada localmente. Consultar verificacion.md para las comprobaciones y los límites; la ampliación posterior sigue pendiente.

## Primera entrega académica

### Gestión de Productos

- Registrar productos con código único, nombre, categoría y precio.
- Consultar, buscar y editar productos.
- Desactivar productos sin perder las ventas históricas.
- Validar campos obligatorios, precios y códigos duplicados.

Se considerará terminado cuando las operaciones persistan en PostgreSQL, se comuniquen los errores en la interfaz y se compruebe que editar el precio no altera ventas anteriores.

### Reportes y Consolidación de Ventas

- Consultar una fecha o un intervalo de fechas.
- Mostrar el importe total vendido, el desglose por efectivo y QR y la cantidad de ventas confirmadas.
- Mostrar cantidades e importes vendidos por producto.
- Permitir revisar las ventas que originan los totales.
- Mostrar correctamente un día sin ventas.

Se considerará terminado cuando los resultados coincidan con un conjunto de ventas conocido, respeten la fecha local y excluyan ventas pendientes y anuladas. El resultado expresa ventas, no utilidad: no se están descontando costos ni gastos.

### Funcionalidad de apoyo

Al ser un trabajo individual, incorporar un registro básico de venta con selección de productos, cantidades, cálculo del total y confirmación del pago en efectivo o QR. Añadir acceso de usuarios para proteger las operaciones. Esta funcionalidad hace posible usar y demostrar los dos módulos principales.

En la primera versión se propone un solo método de pago por venta y confirmación manual del QR. El registro de pago no implica integración bancaria.

## Ampliación posterior

Después de terminar y verificar los módulos asignados:

1. Validar quién toma el pedido, quién cobra y quién entrega, y cuántos dispositivos están disponibles.
2. Ampliar el punto de venta y los permisos para vendedores y cajero.
3. Incorporar pedidos, estados de preparación/entrega y coordinación entre puestos.
4. Incorporar inventario y movimientos de existencias.
5. Incorporar apertura, arqueo y cierre de caja con comparación del efectivo contado y esperado.
6. Evaluar integración bancaria si se dispone del proveedor y de sus condiciones de acceso.

No se atribuirá una reducción de filas o tiempos sin medirla. Los primeros módulos resuelven el registro de productos y la consolidación de ventas; la atención durante recreos requiere evaluar también el flujo operativo.

## Evidencia y formulario

Título provisional: **Módulos de Gestión de Productos y Consolidación de Ventas para la tienda de snacks de la UAB**.

Justificación provisional: desarrollar una aplicación web que centralice el catálogo y consolide automáticamente las ventas registradas, con desglose de cobros en efectivo y QR, para facilitar la consulta y reducir el cálculo manual. Tecnologías previstas: React, TypeScript, Bun, Hono y PostgreSQL. Actualizar esta descripción con lo efectivamente implementado.

Preparar al finalizar:

- Enlace accesible de lectura al repositorio publicado por el estudiante o a una demostración funcional.
- PDF preferiblemente de una página, con capturas reales del catálogo, registro de venta y reporte, y una breve explicación de la prueba realizada.
- Ejemplo reproducible: una venta en efectivo de Bs 10,00 y otra por QR de Bs 15,00 generan dos ventas y un total de Bs 25,00; una operación pendiente y otra anulada no incrementan ese total.
- Pruebas adicionales de precios históricos, límites de fecha, doble confirmación y validaciones de productos.

Los requisitos administrativos de sellos, firmas y aprobación deben confirmarse con la docente; no se infieren del formulario. El enlace al formulario, su fecha límite y sus condiciones de envío todavía no se conocen.

## Trabajo y versionado

Crear commits locales por avances coherentes: documentación, base del proyecto, productos, registro de ventas, reportes y evidencia. Ejecutar las verificaciones pertinentes antes de cada entrega funcional. La publicación en GitHub corresponde al estudiante.

Preparar al final la defensa sobre relaciones, claves, normalización, transacciones, arquitectura, interfaz, validaciones y pruebas, usando el código real y las decisiones registradas.
