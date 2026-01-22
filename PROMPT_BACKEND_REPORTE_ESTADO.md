# Prompt Backend - Ajuste Reporte de Estado para Mostrar Año Actual y Histórico

## Contexto
El reporte de estado necesita mostrar tanto datos históricos (años anteriores finalizados) como datos actuales (año en curso con formularios en proceso de llenado).

## Problema Actual
Los endpoints de reporte de estado solo consultan una tabla (histórico o actual) pero no distinguen dinámicamente según el año solicitado.

**IMPORTANTE:** Cuando un formulario llega a estado "Finalizado", puede existir temporalmente tanto en la tabla actual como en la histórica, causando duplicados. La consulta debe filtrar por registros únicos usando el NIT como clave.

## Solución Requerida

### 1. Endpoint: POST /informacion-f/reporteEstado (Línea Base)

**Parámetros recibidos:**
```json
{
  "literal": "linea_base",
  "reporte": "estado",
  "ano": 2025,
  "cliente": null
}
```

**Lógica a implementar:**

```javascript
// 1. Determinar el año actual del sistema
const anoActual = new Date().getFullYear(); // 2026 por ejemplo
// O mejor: obtener el último año reportado activo en informacionF
const anoActualReporte = await db.query(`
  SELECT MAX(anoReporte) as anoActual FROM informacionF WHERE anoReporte IS NOT NULL
`);
const yearActual = anoActualReporte[0]?.anoActual || anoActual;

// 2. Decidir de qué tabla consultar según el año solicitado
let query;
let params = [];

if (parseInt(ano) >= yearActual) {
  // AÑO ACTUAL O FUTURO: Consultar informacionF (datos en proceso)
  query = `
    SELECT 
      inf.idInformacionF,
      inf.nit,
      u.nombre as razonSocial,
      inf.anoReporte,
      inf.estado,
      inf.carta_firmada as cartaFirmada,
      inf.fecha_actualizacion as fechaActualizacion,
      inf.fecha_creacion as fechaCreacion,
      -- Agregar todos los campos necesarios para el reporte
      inf.*
    FROM informacionF inf
    INNER JOIN usuarios u ON inf.nit = u.identificacion
    WHERE inf.anoReporte = ?
    ORDER BY u.nombre ASC
  `;
  params = [ano];
  
} else {
  // AÑO ANTERIOR: Consultar histInformacionF (datos históricos finalizados)
  query = `
    SELECT 
      hist.idhistInformacionF as idInformacionF,
      hist.nit,
      hist.razonSocial,
      hist.anoReporte,
      hist.estado,
      hist.carta_firmada as cartaFirmada,
      hist.fecha_actualizacion as fechaActualizacion,
      hist.fecha_creacion as fechaCreacion,
      -- Agregar todos los campos necesarios
      hist.*
    FROM histInformacionF hist
    WHERE hist.anoReporte = ?
    ORDER BY hist.razonSocial ASC
  `;
  params = [ano];
}

const resultados = await db.query(query, params);

// 3. IMPORTANTE: Filtrar duplicados por NIT
// Cuando un formulario se finaliza, puede estar en ambas tablas temporalmente
const registrosUnicos = new Map();
resultados.forEach(registro => {
  const key = `${registro.nit}_${registro.anoReporte}`;
  if (!registrosUnicos.has(key)) {
    registrosUnicos.set(key, registro);
  }
  // Si ya existe, mantener el de la tabla actual (tiene prioridad)
});

const resultadosFiltrados = Array.from(registrosUnicos.values());

// 4. Retornar datos con metadatos
return {
  success: true,
  data: resultadosFiltrados,
  metadata: {
    ano: parseInt(ano),
    esAnoActual: parseInt(ano) >= yearActual,
    fuente: parseInt(ano) >= yearActual ? 'informacionF' : 'histInformacionF',
    totalRegistros: resultadosFiltrados.length,
    registrosOriginales: resultados.length,
    duplicadosEliminados: resultados.length - resultadosFiltrados.length
  }
};
```

### 2. Endpoint: POST /informacion-b/reporteEstado (Literal B)

**Parámetros recibidos:**
```json
{
  "literal": "literal_b",
  "reporte": "estado",
  "ano": 2025,
  "cliente": null
}
```

**Lógica a implementar:**

```javascript
// 1. Determinar el año actual del sistema
const anoActual = new Date().getFullYear();
// O mejor: obtener el último año reportado activo
const anoActualReporte = await db.query(`
  SELECT MAX(anoReporte) as anoActual FROM informacionB WHERE anoReporte IS NOT NULL
`);
const yearActual = anoActualReporte[0]?.anoActual || anoActual;

// 2. Decidir de qué tabla consultar según el año solicitado
let query;
let params = [];

if (parseInt(ano) >= yearActual) {
  // AÑO ACTUAL O FUTURO: Consultar informacionB (datos en proceso)
  query = `
    SELECT 
      inf.idInformacionB,
      inf.nit,
      u.nombre as razonSocial,
      inf.anoReporte,
      inf.estado,
      inf.grupo,
      inf.totalPesoFacturacion,
      inf.carta_firmada as cartaFirmada,
      inf.fecha_actualizacion as fechaActualizacion,
      inf.fecha_creacion as fechaCreacion,
      -- Agregar campos necesarios
      inf.*,
      -- Contar productos asociados
      (SELECT COUNT(*) FROM productosB p WHERE p.informacionB_idInformacionB = inf.idInformacionB) as totalProductos
    FROM informacionB inf
    INNER JOIN usuarios u ON inf.nit = u.identificacion
    WHERE inf.anoReporte = ?
    ORDER BY u.nombre ASC
  `;
  params = [ano];
  
} else {
  // AÑO ANTERIOR: Consultar histInformacionB (datos históricos finalizados)
  query = `
    SELECT 
      hist.idhistInformacionB as idInformacionB,
      hist.nit,
      hist.razonSocial,
      hist.anoReporte,
      hist.estado,
      hist.grupo,
      hist.totalPesoFacturacion,
      hist.carta_firmada as cartaFirmada,
      hist.fecha_actualizacion as fechaActualizacion,
      hist.fecha_creacion as fechaCreacion,
      hist.*,
      0 as totalProductos -- Los productos históricos están en otra estructura
    FROM histInformacionB hist
    WHERE hist.anoReporte = ?
    ORDER BY hist.razonSocial ASC
  `;
  params = [ano];
}

const resultados = await db.query(query, params);

// 3. IMPORTANTE: Filtrar duplicados por NIT
// Cuando un formulario se finaliza, puede estar en ambas tablas temporalmente
const registrosUnicos = new Map();
resultados.forEach(registro => {
  const key = `${registro.nit}_${registro.anoReporte}`;
  if (!registrosUnicos.has(key)) {
    registrosUnicos.set(key, registro);
  }
  // Si ya existe, mantener el de la tabla actual (tiene prioridad)
});

const resultadosFiltrados = Array.from(registrosUnicos.values());

// 4. Retornar datos con metadatos
return {
  success: true,
  data: resultadosFiltrados,
  metadata: {
    ano: parseInt(ano),
    esAnoActual: parseInt(ano) >= yearActual,
    fuente: parseInt(ano) >= yearActual ? 'informacionB' : 'histInformacionB',
    totalRegistros: resultadosFiltrados.length,
    registrosOriginales: resultados.length,
    duplicadosEliminados: resultados.length - resultadosFiltrados.length
  }
};
```

## Casos de Uso

### Caso 1: Usuario selecciona año 2025 (año actual)
- Frontend envía: `{ ano: 2025 }`
- Backend detecta: `ano >= yearActual` → Consulta `informacionB`
- Retorna: Formularios en **cualquier estado** (Pendiente, En proceso, Finalizado, Aprobado, Rechazado)
- Usuario ve: Estado actual de todos los formularios del 2025

### Caso 2: Usuario selecciona año 2024 (año anterior)
- Frontend envía: `{ ano: 2024 }`
- Backend detecta: `ano < yearActual` → Consulta `histInformacionB`
- Retorna: Formularios finalizados del histórico 2024
- Usuario ve: Estado final de los formularios del 2024

### Caso 3: Usuario selecciona año 2023 (histórico)
- Frontend envía: `{ ano: 2023 }`
- Backend detecta: `ano < yearActual` → Consulta `histInformacionB`
- Retorna: Formularios finalizados del histórico 2023
- Usuario ve: Estado final de los formularios del 2023

## Consideraciones Importantes

1. **Año Actual**: Puede obtenerse de:
   - `new Date().getFullYear()` → Año del sistema
   - `MAX(anoReporte)` de la tabla actual → Último año reportado
   - Variable de configuración del sistema

2. **Estados a mostrar**:
   - Año actual: TODOS los estados (para ver progreso)
   - Años históricos: Solo formularios que llegaron a "Finalizado" o "Aprobado"

3. **Campos importantes**:
   - `estado`: Estado del formulario
   - `anoReporte`: Año que se está reportando
   - `cartaFirmada`: URL del archivo adjunto
   - `fechaActualizacion`: Última modificación
   - Para Literal B: `grupo`, `totalPesoFacturacion`, `totalProductos`

4. **Respuesta esperada**:
```json
{
  "success": true,
  "data": [
    {
      "idInformacionB": 123,
      "nit": "800123456",
      "razonSocial": "Empresa XYZ",
      "anoReporte": 2025,
      "estado": "En proceso",
      "grupo": "2",
      "totalPesoFacturacion": 150.50,
      "cartaFirmada": "https://...",
      "fechaActualizacion": "2025-01-20",
      "totalProductos": 15
    }
  ],
  "metadata": {
    "ano": 2025,
    "esAnoActual": true,
    "fuente": "informacionB",
    "totalRegistros": 45
  }
}
```

## Testing

Para probar los cambios:

1. **Consultar año actual (2025)**:
```bash
POST /informacion-b/reporteEstado
{
  "literal": "literal_b",
  "reporte": "estado",
  "ano": 2025,
  "cliente": null
}
```
Debe retornar datos de `informacionB` con todos los estados.

2. **Consultar año histórico (2024)**:
```bash
POST /informacion-b/reporteEstado
{
  "literal": "literal_b",
  "reporte": "estado",
  "ano": 2024,
  "cliente": null
}
```
Debe retornar datos de `histInformacionB` WHERE anoReporte = 2024.

3. **Verificar metadata**:
La respuesta debe incluir el campo `metadata.esAnoActual` para que el frontend sepa si está viendo datos actuales o históricos.

## Frontend Listo
El frontend ya está preparado para:
- Enviar el parámetro `ano` correctamente
- Mostrar selector de año
- Procesar los datos recibidos
- No requiere cambios adicionales, solo que el backend retorne los datos correctos

## Prioridad
🔴 **ALTA** - Necesario para poder visualizar el progreso del año actual 2025 y comparar con históricos.
