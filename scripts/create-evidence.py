"""Genera una página de evidencia a partir de capturas reales del navegador.
Requiere reportlab. Ejecutar desde cualquier ubicación; las rutas son relativas a este archivo.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
path = OUT / 'evidencia-snack-uab.pdf'
page = canvas.Canvas(str(path), pagesize=landscape(A4))
page.setTitle('Snack UAB - Evidencia funcional')
page.setAuthor('Proyecto individual - Práctica Empresarial 1')
W, H = landscape(A4)
navy, blue, muted = HexColor('#182A4F'), HexColor('#2449ED'), HexColor('#65738C')
page.setFillColor(blue)
page.rect(0, H - 7, W, 7, fill=1, stroke=0)
page.setFillColor(navy)
page.setFont('Helvetica-Bold', 20)
page.drawString(34, H - 45, 'Snack UAB | Evidencia funcional')
page.setFillColor(muted)
page.setFont('Helvetica', 10)
page.drawString(34, H - 65, 'Gestión de Productos y Consolidación de Ventas - Práctica Empresarial 1')
page.drawImage(str(ROOT / 'apps/web/public/brand/uab.png'), W - 105, H - 62, width=68, height=37, preserveAspectRatio=True, mask='auto')
page.setFont('Helvetica', 8.5)
page.drawString(34, H - 86, 'React + TypeScript | Bun + Hono | PostgreSQL + Drizzle | Pruebas: 24/10/2026 | Revisión: 25/10/2026')

gap, margin = 22, 34
width = (W - 2 * margin - gap) / 2
image_top = H - 128
for x, filename, heading, caption in [
    (margin, 'producto-registrado.png', '01  Gestión de Productos', 'PAN-004: Salteña de pollo registrada a Bs 7,50 y localizada por código.'),
    (margin + width + gap, 'reporte-ventas.png', '02  Consolidación de Ventas', 'Dos ventas: Bs 10,00 en efectivo + Bs 15,00 por QR = Bs 25,00.'),
]:
    page.setFillColor(navy)
    page.setFont('Helvetica-Bold', 11)
    page.drawString(x, H - 113, heading)
    image = ImageReader(str(ROOT / 'docs/evidencias' / filename))
    iw, ih = image.getSize()
    height = width * ih / iw
    page.setStrokeColor(HexColor('#DFE6F2'))
    page.roundRect(x - 1, image_top - height - 1, width + 2, height + 2, 5, stroke=1, fill=0)
    page.drawImage(image, x, image_top - height, width=width, height=height)
    page.setFillColor(muted)
    page.setFont('Helvetica', 8)
    page.drawString(x, image_top - height - 16, caption)

page.setFillColor(HexColor('#EEF3FF'))
page.roundRect(34, 35, W - 68, 53, 7, fill=1, stroke=0)
page.setFillColor(blue)
page.setFont('Helvetica-Bold', 10)
page.drawString(48, 68, 'Verificación: 22 pruebas automatizadas correctas + recorrido funcional en navegador')
page.setFillColor(muted)
page.setFont('Helvetica', 8)
page.drawString(48, 52, 'Capturas reales con datos de demostración. QR simulado con confirmación manual; no se realizaron cobros bancarios.')
page.setFillColor(muted)
page.setFont('Helvetica', 7)
page.drawString(34, 19, 'Entrega local. Repositorio GitHub y validación institucional pendientes a cargo del estudiante.')
page.drawRightString(W - 34, 19, '1 / 1')
page.save()
print(path)
