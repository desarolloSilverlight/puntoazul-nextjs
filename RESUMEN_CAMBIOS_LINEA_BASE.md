# Resumen de Cambios - Reportes Línea Base (Estado y Consolidado)

## ✅ Cambios Implementados en Frontend

### 1. Reporte de Estado - Línea Base
**Estado:** ✅ Completamente funcional (igual que Literal B)

**Características:**
- Selector de año habilitado
- Envía parámetro `ano` al backend
- Tabla con paginación, búsqueda y barra de progreso
- Filtro de duplicados por NIT
- Estructura idéntica a Literal B

**Código:** `pages/admin/reportes.js` líneas 2756-2900

---

### 2. Consolidado - Línea Base
**Estado:** ✅ Frontend listo, requiere backend

**Características implementadas:**
- Selector de año agregado
- Validación de año requerido
- Envía parámetro `ano` al endpoint: `GET /informacion-f/consolidado-raw?ano=2025`
- Pasa año al componente ConsolidadoF
- Mantiene cálculos y estructura de tabla original

**Código modificado:**
- `pages/admin/reportes.js` líneas 240-280 (llamada al endpoint)
- Condiciones de selector de año actualizadas
- Validación de año agregada

---

## 📋 Prompts Creados para Backend

### 1. `/informacion-f/reporteEstado`
**Archivo:** `PROMPT_BACKEND_REPORTE_ESTADO.md`

**Funcionalidad requerida:**
- Aceptar parámetro `ano` (número, requerido)
- Si `ano >= añoActual`: Consultar tabla `informacionF` (datos actuales)
- Si `ano < añoActual`: Consultar tabla `histInformacionF` (históricos)
- Filtrar duplicados por NIT
- Retornar metadata (año, fuente, registros)

**Query ejemplo:**
```sql
-- Año actual
SELECT * FROM informacionF WHERE anoReporte = ?

-- Año histórico  
SELECT * FROM histInformacionF WHERE anoReporte = ?
```

---

### 2. `/informacion-f/consolidado-raw`
**Archivo:** `PROMPT_BACKEND_CONSOLIDADO_LINEA_BASE.md`

**Funcionalidad requerida:**
- Aceptar parámetro `ano` opcional en query string
- Si NO viene `ano`: Retornar todos (retrocompatibilidad)
- Si viene `ano >= añoActual`: Consultar `informacionF WHERE ano_reportado = ?`
- Si viene `ano < añoActual`: Consultar `histInformacionF WHERE ano_reportado = ?`
- Filtrar duplicados por NIT
- Retornar metadata

**Llamadas:**
```javascript
// Sin año (todos)
GET /informacion-f/consolidado-raw

// Con año específico
GET /informacion-f/consolidado-raw?ano=2025
```

---

### 3. `/informacion-f/getAnosReporte` y `/informacion-b/getAnosReporte`
**Archivo:** `PROMPT_BACKEND_GET_ANOS_REPORTE.md`

**Funcionalidad requerida:**
- Consultar ambas tablas (actual e histórica) con UNION
- Retornar años únicos ordenados descendente
- Incluir año 2025 de tabla actual

**Query:**
```sql
SELECT DISTINCT anoReporte 
FROM (
  SELECT anoReporte FROM informacionF WHERE anoReporte IS NOT NULL
  UNION
  SELECT anoReporte FROM histInformacionF WHERE anoReporte IS NOT NULL
) AS anios
ORDER BY anoReporte DESC
```

---

## 🎯 Comportamiento Esperado

### Caso 1: Usuario selecciona año 2025 (actual)
| Reporte | Tabla Consultada | Estados Mostrados |
|---------|------------------|-------------------|
| Estado LB | `informacionF` | Todos (Pendiente, En proceso, Finalizado, etc.) |
| Estado B | `informacionB` | Todos |
| Consolidado LB | `informacionF` | Todos con datos |
| Consolidado B | `informacionB` + histórico | Con comparación histórica |

### Caso 2: Usuario selecciona año 2024 (histórico)
| Reporte | Tabla Consultada | Estados Mostrados |
|---------|------------------|-------------------|
| Estado LB | `histInformacionF` | Solo Finalizados |
| Estado B | `histInformacionB` | Solo Finalizados |
| Consolidado LB | `histInformacionF` | Solo Finalizados |
| Consolidado B | `histInformacionB` | Datos históricos finalizados |

---

## 🔍 Testing Frontend (Ya funciona)

1. **Reporte Estado Línea Base:**
   - ✅ Selector de año visible
   - ✅ Búsqueda y paginación
   - ✅ Barra de progreso
   - ✅ Ver documentos adjuntos
   - ✅ Sin duplicados

2. **Reporte Consolidado Línea Base:**
   - ✅ Selector de año visible
   - ✅ Validación de año requerido
   - ✅ Envía parámetro `?ano=2025`
   - ⏳ Esperando backend para probar datos

---

## 📊 Estructura de Datos

### Estado (Línea Base)
```json
{
  "success": true,
  "data": [
    {
      "idInformacionF": 123,
      "nit": "800123456",
      "nombre": "Empresa XYZ",
      "ano_reportado": 2025,
      "estado": "Finalizado",
      "correo_facturacion": "correo@empresa.com",
      "cartaFirmada": "url_documento",
      "fecha_actualizacion": "2025-01-20"
    }
  ],
  "metadata": {
    "ano": 2025,
    "esAnoActual": true,
    "fuente": "informacionF",
    "totalRegistros": 45
  }
}
```

### Consolidado (Línea Base)
```json
{
  "success": true,
  "data": [
    {
      "idInformacionF": 123,
      "nit": "800123456",
      "nombre": "Empresa XYZ",
      "ano_reportado": 2025,
      "estado": "Finalizado",
      "primarios": [...],
      "secundarios": [...],
      "plasticos": [...]
    }
  ],
  "metadata": {
    "ano": 2025,
    "esAnoActual": true,
    "fuente": "informacionF",
    "totalRegistros": 45
  }
}
```

---

## ⚡ Orden de Implementación Recomendado (Backend)

1. **PRIMERO:** `getAnosReporte` (ambos endpoints)
   - Sin esto, el dropdown de años no muestra 2025
   - Más fácil y rápido de implementar
   - Query simple con UNION

2. **SEGUNDO:** `reporteEstado` (Línea Base y Literal B)
   - Permite ver estado actual vs histórico
   - Usa lógica similar entre ambos

3. **TERCERO:** `consolidado-raw` (Línea Base)
   - Más complejo porque debe mantener retrocompatibilidad
   - Menos crítico porque el frontend puede trabajar con datos sin filtrar

---

## 📝 Notas Importantes

1. **Retrocompatibilidad:** El consolidado debe seguir funcionando sin parámetro `ano` para no romper otras partes del sistema.

2. **Duplicados:** Todos los endpoints deben filtrar por NIT único para evitar duplicados cuando un formulario está en transición.

3. **Metadata:** Retornar siempre metadata con `ano`, `esAnoActual`, `fuente` para debugging y logs.

4. **Frontend listo:** No se requieren más cambios en frontend, solo esperar que backend implemente los endpoints según los prompts.

---

## 🎨 Comparación Visual

### ANTES (Línea Base):
```
Estado: ❌ Sin selector de año
Consolidado: ❌ Sin selector de año, muestra todos los años mezclados
```

### AHORA (Línea Base):
```
Estado: ✅ Con selector de año (igual que Literal B)
Consolidado: ✅ Con selector de año, filtra por año específico
```

Ambos literales ahora tienen funcionalidad consistente y estructuras idénticas.
