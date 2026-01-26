# Prompt Backend - Ajuste Consolidado Línea Base para Soportar Selección de Año

## Contexto
El consolidado de Literal B ya soporta selección de año específico, pero el consolidado de Línea Base retorna TODOS los años sin filtro. Necesitamos que funcione igual: permitir seleccionar un año específico y retornar datos actuales o históricos según corresponda.

## Endpoint a Modificar

### GET /informacion-f/consolidado-raw

**Comportamiento actual (incorrecto):**
```javascript
// Retorna TODOS los registros finalizados sin filtrar por año
SELECT * FROM informacionF 
WHERE estado = 'Finalizado'
ORDER BY ano_reportado, nombre
```

**Comportamiento requerido (correcto):**
```javascript
// Debe aceptar parámetro de año y consultar tabla actual o histórica según corresponda

// 1. Determinar el año actual del sistema
const anoActual = new Date().getFullYear();
const anoActualReporte = await db.query(`
  SELECT MAX(anoReporte) as anoActual FROM informacionF WHERE anoReporte IS NOT NULL
`);
const yearActual = anoActualReporte[0]?.anoActual || anoActual;

// 2. Recibir año desde query params (si viene, sino retornar todos)
const anoFiltro = req.query.ano ? parseInt(req.query.ano) : null;

let query;
let params = [];

if (!anoFiltro) {
  // SIN FILTRO: Comportamiento actual (retrocompatibilidad)
  // Retorna todos los años finalizados
  query = `
    SELECT 
      inf.*,
      u.nombre,
      u.identificacion as nit
    FROM informacionF inf
    INNER JOIN usuarios u ON inf.nit = u.identificacion
    WHERE inf.estado = 'Finalizado'
    ORDER BY inf.ano_reportado DESC, u.nombre ASC
  `;
  
} else if (parseInt(anoFiltro) >= yearActual) {
  // AÑO ACTUAL O FUTURO: Consultar informacionF (tabla actual)
  // Puede incluir estados en proceso, no solo finalizados
  query = `
    SELECT 
      inf.*,
      u.nombre,
      u.identificacion as nit
    FROM informacionF inf
    INNER JOIN usuarios u ON inf.nit = u.identificacion
    WHERE inf.ano_reportado = ?
    ORDER BY u.nombre ASC
  `;
  params = [anoFiltro];
  
} else {
  // AÑO HISTÓRICO: Consultar histInformacionF
  query = `
    SELECT 
      hist.*,
      hist.nombre,
      hist.nit
    FROM histInformacionF hist
    WHERE hist.ano_reportado = ?
    ORDER BY hist.nombre ASC
  `;
  params = [anoFiltro];
}

const resultados = await db.query(query, params);

// 3. Eliminar duplicados por NIT (igual que en estado)
const registrosUnicos = new Map();
resultados.forEach(registro => {
  const key = `${registro.nit}_${registro.ano_reportado || anoFiltro}`;
  if (!registrosUnicos.has(key)) {
    registrosUnicos.set(key, registro);
  }
});

const resultadosFiltrados = Array.from(registrosUnicos.values());

return {
  success: true,
  data: resultadosFiltrados,
  metadata: {
    ano: anoFiltro,
    esAnoActual: anoFiltro ? parseInt(anoFiltro) >= yearActual : null,
    fuente: !anoFiltro ? 'informacionF (todos)' : 
            (parseInt(anoFiltro) >= yearActual ? 'informacionF' : 'histInformacionF'),
    totalRegistros: resultadosFiltrados.length
  }
};
```

## Casos de Uso

### Caso 1: Sin parámetro de año (comportamiento actual - retrocompatibilidad)
```bash
GET /informacion-f/consolidado-raw
```
**Resultado:** Retorna todos los registros finalizados de todos los años ✅
**Frontend:** ConsolidadoF agrupa por año y muestra todos

### Caso 2: Con año actual (2025)
```bash
GET /informacion-f/consolidado-raw?ano=2025
```
**Resultado:** Consulta `informacionF WHERE ano_reportado = 2025`
**Frontend:** Muestra solo datos de 2025 (actuales, en proceso)

### Caso 3: Con año histórico (2024)
```bash
GET /informacion-f/consolidado-raw?ano=2024
```
**Resultado:** Consulta `histInformacionF WHERE ano_reportado = 2024`
**Frontend:** Muestra solo datos de 2024 (históricos finalizados)

## Estructura de Respuesta

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

## Importante

1. **Retrocompatibilidad:** Si NO viene el parámetro `ano`, debe funcionar como antes (retornar todos los años)
2. **Duplicados:** Filtrar por NIT para evitar registros duplicados
3. **Estados:** Para año actual, puede incluir estados en proceso; para histórico solo finalizados
4. **Estructura de datos:** Mantener la misma estructura que ya existe, solo agregar metadata

## Frontend

El frontend será modificado para:
1. Agregar selector de año (igual que Literal B)
2. Pasar parámetro `ano` al endpoint cuando se seleccione
3. Mostrar datos filtrados por año
4. Mantener la tabla actual sin cambios (solo filtrar datos)

## Prioridad
🟠 **MEDIA** - Mejora de funcionalidad para consistencia entre reportes

## Tiempo Estimado
⏱️ 20-30 minutos
