# KoneneKoh Smile Maker (Web Edition 2.0 Pro) 🦷🪐

Sistema clínico odontológico y de gestión de presupuestos basado en odontograma interactivo, migrado y modernizado desde FileMaker a una aplicación web completa, responsiva y accesible desde cualquier navegador, iPad, tablet o computadora sin costo de licencias.

---

## 🚀 Nuevas Características y Módulos Modernizados

### 1. 📅 Consultas con Vista de Calendario Interactivo
- **Vista Mensual Dinámica**: Navegación de mes a mes, indicador de día actual, selección de fecha y conteo de citas por día con micro-etiquetas de horario y paciente.
- **Agenda Detallada del Día**:
  - Horario programado (inicio y fin), duración en minutos.
  - Fotografía, nombre completo, expediente y contacto por WhatsApp del paciente.
  - Doctor asignado y sillón clínico (ej. *Sillón 1 Pediatría*, *Sillón 2 Ortodoncia*).
  - Motivo de consulta y diagnóstico clínico.
  - **Selector de Estatus en tiempo real**: `Programada` ➔ `En sala de espera` ➔ `En atención (Sillón)` ➔ `Completada` ➔ `Cancelada`.
- **Botón "+ Nueva Cita"**: Modal intuitivo con sugerencias rápidas de procedimientos frecuentes.

### 2. 📦 Inventario & Stock Profesional (Kardex)
- **KPIs Ejecutivos en tiempo real**:
  - Total de SKUs y unidades físicas en clínica.
  - Valor total del inventario a costo de adquisición.
  - Valor proyectado de venta con IVA.
  - **Alerta de Reorden**: Contador de productos en nivel crítico o por debajo del stock mínimo.
- **Clasificación por Categorías**:
  - *Material Restaurador* (Resinas Filtek, Adhesivos 3M, Grabadores).
  - *Preventivos & Odontopediatría* (Selladores Clinpro, Barniz de Flúor Duraphat).
  - *Higiene Dental* (Cepillos Curaprox, Pastas Enzical/Cleanpro, Hilo dental).
  - *Insumos de Protección* (Guantes de nitrilo, cubrebocas).
  - *Anestesia & Fármacos* (Mepivacaína, agujas).
- **Control de Niveles de Stock**: Indicadores visuales automáticos (🟢 Óptimo, 🟡 Bajo Stock, 🔴 Crítico).
- **Ajuste Rápido & Kardex**: Registro de entradas por compra a proveedor o salidas por consumo clínico, guardando la trazabilidad de fecha, motivo y usuario.

### 3. 📱 Diseño Moderno, Pulido y 100% Responsivo
- **Adaptabilidad a cualquier pantalla**:
  - En **tablets/iPads y móviles**: Menú colapsable, navegación fluida tipo maestro-detalle con botón de retorno, y odontograma táctil optimizado.
  - En **computadoras de escritorio**: Interfaz multipanel a 3 columnas con acceso instantáneo a pacientes, odontograma, pagos y expediente.
- **Estética Contemporánea**: Bordes suaves (`rounded-3xl`), efectos de desenfoque (`backdrop-blur`), gradientes profesionales en turquesa y aguamarina, y tipografía médica clara.

### 4. 🦷 Odontograma Interactivo & Presupuestos Dinámicos
- Notación estándar **FDI (ISO 3950)**: Dentición Adulta (11–48), Pediátrica (51–85) y Mixta.
- Selección por caras (Vestibular, Lingual/Palatina, Mesial, Distal, Oclusal) y afecciones generales (Corona, Endodoncia, Extracción).
- Vinculación directa con el catálogo de tratamientos: calcula costos automáticamente y añade cada procedimiento al presupuesto con seguimiento de estatus (`Pendiente` ➔ `En proceso` ➔ `Realizado`).

### 5. 💳 Pagos & Estado de Cuenta
- Tarjetas de resumen: **Total Presupuestado**, **Total Pagado** y **Saldo Pendiente**.
- Registro de abonos con soporte para Efectivo, Tarjetas y Transferencias bancarias.

### 6. 🏢 Gestión Multi-Sucursal & Dashboard por Sede
- Soporte para redes de clínicas y consultorios independientes.
- Selector de contexto: Visualiza métricas, citas e inventarios de una sede específica o de toda la red completa.

### 7. 💊 Recetas Médicas Odontológicas Membretadas
- Generación de recetas oficiales con logotipo personalizado, cédula profesional, datos de registro sanitario y posología.
- Formato optimizado para impresión directa y descarga digital.

### 8. 🔑 Motor de Licencias Criptográficas & Pasarela de Pagos
- Licenciamiento con tokens HMAC-SHA256 offline-ready.
- **Modo Consulta (Solo Lectura)**: Si la licencia expira, el usuario puede consultar su historial clínico y exportar datos, pero se bloquea la creación de nuevos pacientes y citas hasta la renovación.
- Pasarela de renovación con soporte para tarjeta, Stripe y Mercado Pago.
- Soporte para despliegue de demo interactiva gratuita en GitHub Pages vía LocalStorage.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons.
- **Backend**: Node.js + Express REST API.
- **Base de Datos**: SQLite3 relacional autónoma (`server/konenekoh.db`).
- **Despliegue Demo**: GitHub Actions + GitHub Pages (`.github/workflows/deploy.yml`).

---

## 💻 Instrucciones para Ejecutar

### Opción 1: Servidor de Producción (Recomendado)
```bash
node server/index.js
```
Abre en tu navegador: **`http://localhost:5001`** (o en cualquier tablet/iPad en la red local: `http://<IP_DE_ESTA_MAC>:5001`).

### Opción 2: Modo Desarrollo
```bash
npm start
```
Abre en tu navegador: **`http://localhost:3000`**.
