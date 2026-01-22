# Prompt Backend - Ajuste Endpoints getAnosReporte para Incluir Año Actual

## Problema
Los endpoints que retornan la lista de años disponibles para el selector solo están retornando años históricos, pero **NO incluyen el año actual (2025)** que está en la tabla activa (`informacionB` / `informacionF`).

## Endpoints a Modificar

### 1. GET /informacion-b/getAnosReporte (Literal B)

**Comportamiento actual (incorrecto):**
```javascript
// Solo retorna años del histórico
SELECT DISTINCT anoReporte 
FROM histInformacionB 
ORDER BY anoReporte DESC
```
**Resultado:** `[2024, 2023, 2022]` ❌ Falta 2025

**Comportamiento requerido (correcto):**
```javascript
// Combinar años del histórico + año actual
const anosHistoricos = await db.query(`
  SELECT DISTINCT anoReporte 
  FROM histInformacionB 
  WHERE anoReporte IS NOT NULL
  ORDER BY anoReporte DESC
`);

const anosActuales = await db.query(`
  SELECT DISTINCT anoReporte 
  FROM informacionB 
  WHERE anoReporte IS NOT NULL
  ORDER BY anoReporte DESC
`);

// Combinar ambos arrays, eliminar duplicados y ordenar
const todosLosAnos = [...new Set([
  ...anosActuales.map(a => a.anoReporte),
  ...anosHistoricos.map(a => a.anoReporte)
])].sort((a, b) => b - a); // Orden descendente

return {
  success: true,
  data: todosLosAnos
};
```
**Resultado esperado:** `[2025, 2024, 2023, 2022]` ✅

---

### 2. GET /informacion-f/getAnosReporte (Línea Base)

**Comportamiento actual (incorrecto):**
```javascript
// Solo retorna años del histórico
SELECT DISTINCT anoReporte 
FROM histInformacionF 
ORDER BY anoReporte DESC
```
**Resultado:** `[2024, 2023, 2022]` ❌ Falta 2025

**Comportamiento requerido (correcto):**
```javascript
// Combinar años del histórico + año actual
const anosHistoricos = await db.query(`
  SELECT DISTINCT anoReporte 
  FROM histInformacionF 
  WHERE anoReporte IS NOT NULL
  ORDER BY anoReporte DESC
`);

const anosActuales = await db.query(`
  SELECT DISTINCT anoReporte 
  FROM informacionF 
  WHERE anoReporte IS NOT NULL
  ORDER BY anoReporte DESC
`);

// Combinar ambos arrays, eliminar duplicados y ordenar
const todosLosAnos = [...new Set([
  ...anosActuales.map(a => a.anoReporte),
  ...anosHistoricos.map(a => a.anoReporte)
])].sort((a, b) => b - a); // Orden descendente

return {
  success: true,
  data: todosLosAnos
};
```
**Resultado esperado:** `[2025, 2024, 2023, 2022]` ✅

---

## Alternativa con UNION SQL (Más eficiente)

### Para Literal B:
```sql
SELECT DISTINCT anoReporte 
FROM (
  SELECT anoReporte FROM informacionB WHERE anoReporte IS NOT NULL
  UNION
  SELECT anoReporte FROM histInformacionB WHERE anoReporte IS NOT NULL
) AS anios
ORDER BY anoReporte DESC
```

### Para Línea Base:
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

## Casos de Uso

### Escenario 1: Empresas llenando formularios 2025
- Tabla `informacionB` tiene registros con `anoReporte = 2025`
- Tabla `histInformacionB` tiene años 2024, 2023, 2022
- **Selector debe mostrar:** `[2025, 2024, 2023, 2022]`

### Escenario 2: Transición de año
- Tabla `informacionB` tiene registros con `anoReporte = 2025` (en proceso)
- Algunos finalizados de 2024 ya pasaron a `histInformacionB`
- Aún hay algunos 2024 en `informacionB` (atrasados)
- **Selector debe mostrar:** `[2025, 2024, 2023, 2022]` (sin duplicar 2024)

### Escenario 3: Nuevo año sin datos
- Tabla `informacionB` vacía o sin `anoReporte`
- Solo hay históricos: 2024, 2023, 2022
- **Selector debe mostrar:** `[2024, 2023, 2022]`

---

## Testing

### Test 1: Verificar que incluye 2025
```bash
curl -X GET http://localhost:3000/api/informacion-b/getAnosReporte
```
**Respuesta esperada:**
```json
{
  "success": true,
  "data": [2025, 2024, 2023, 2022]
}
```

### Test 2: Verificar orden descendente
Los años deben estar ordenados de mayor a menor (más reciente primero).

### Test 3: Sin duplicados
Si 2024 aparece tanto en `informacionB` como en `histInformacionB`, debe aparecer solo una vez en el resultado.

---

## Impacto

**Reportes afectados que usan estos endpoints:**
- ✅ Reporte de Estado (Literal B y Línea Base) - **CRÍTICO**
- ✅ Reporte de Grupo (Literal B)
- ✅ Reporte de Variación de Grupo (Literal B)
- ✅ Reporte de Facturación (ambos literales)
- ✅ Reporte de Consolidado (Literal B)
- ✅ Reporte de Toneladas (Línea Base)
- ✅ Reporte de Rangos (Línea Base)

**Sin este ajuste:**
- ❌ Los usuarios NO pueden seleccionar 2025 en el selector
- ❌ NO pueden ver el estado actual de los formularios en proceso
- ❌ Solo ven datos históricos

**Con este ajuste:**
- ✅ Los usuarios pueden seleccionar 2025
- ✅ Pueden ver quién está llenando actualmente
- ✅ Pueden ver el progreso en tiempo real

---

## Código de Ejemplo Completo

```javascript
// Endpoint: GET /informacion-b/getAnosReporte
async function getAnosReporte(req, res) {
  try {
    // Query con UNION para combinar años actuales e históricos
    const query = `
      SELECT DISTINCT anoReporte 
      FROM (
        SELECT anoReporte FROM informacionB WHERE anoReporte IS NOT NULL
        UNION
        SELECT anoReporte FROM histInformacionB WHERE anoReporte IS NOT NULL
      ) AS anios
      ORDER BY anoReporte DESC
    `;
    
    const resultados = await db.query(query);
    const anos = resultados.map(row => row.anoReporte);
    
    console.log('📅 Años disponibles:', anos);
    
    return res.json({
      success: true,
      data: anos
    });
    
  } catch (error) {
    console.error('Error obteniendo años:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener años disponibles'
    });
  }
}
```

---

## Prioridad
🔴 **CRÍTICA** - Sin este ajuste, el reporte de estado del año 2025 no es accesible.

## Tiempo Estimado
⏱️ 10-15 minutos por endpoint (son casi idénticos)

## Dependencias
Este cambio debe implementarse **ANTES** de los cambios en `reporteEstado`, ya que los usuarios necesitan poder seleccionar el año 2025 primero.
