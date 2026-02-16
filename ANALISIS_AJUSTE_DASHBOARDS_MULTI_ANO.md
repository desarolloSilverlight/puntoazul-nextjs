# Análisis de ajuste de dashboards multi-año

## 1) Objetivo
Evitar confusión en métricas del dashboard cuando conviven formularios de distintos años (por ejemplo 2024 y 2025) por la funcionalidad de renovación.

Se analiza:
1. Opción A: selector de año en dashboards.
2. Opción B: métricas atemporales.
3. Reutilización de funciones/endpoints de reportes.
4. Paso a paso recomendado para implementar.

---

## 2) Estado actual (hallazgos en frontend)

### 2.1 Dashboard administrativo
Archivo: `components/Dashboard/DashboardAdmin.js`

Hoy consume:
- `GET /users/perfilUser?nombrePerfil=Vinculado`
- `GET /users/perfilUser?nombrePerfil=Asociado`
- `GET /informacion-f/count-by-status`
- `GET /informacion-b/count-by-status`

Observaciones:
- No hay selector de año.
- Los endpoints de conteo usados no reciben año en frontend.
- Se mezclan métricas de formularios sin contexto temporal.
- `progresoPorAno` está simulado (2024/2023 con valores de ejemplo), no es real.

### 2.2 Dashboard asociado
Archivo: `components/Dashboard/DashboardAsociado.js`

Hoy consume:
- `GET /informacion-b/getByIdUsuario/:id`

Observaciones:
- No recibe año.
- El mensaje dice “para este año”, pero no hay selección explícita ni indicador del año activo.

### 2.3 Dashboard vinculado
Archivo: `components/Dashboard/DashboardVinculado.js`

Hoy consume:
- `GET /informacion-f/getByIdUsuario/:id`

Observaciones:
- No recibe año.
- Igual que asociado, no hay control explícito de año visible para el usuario.

---

## 3) Qué ya existe en reportes y sirve para reutilizar
Archivo principal: `pages/admin/reportes.js`

Ya implementado:
- Selector de año (`ano`) y listado dinámico de años (`anosDisponibles`).
- Endpoints de años:
  - `GET /informacion-f/getAnosReporte`
  - `GET /informacion-b/getAnosReporte`
- Endpoints que aceptan año para reportes de estado:
  - `POST /informacion-f/reporteEstado` (con `ano`)
  - `POST /informacion-b/reporteEstado` (con `ano`)
- Lógica de no mezclar actual/histórico según año en backend (documentada en `RESUMEN_CAMBIOS_LINEA_BASE.md`).

Conclusión de reutilización:
- Sí se puede reutilizar el patrón de selector y carga de años de reportes.
- Para dashboard, los endpoints ideales a reutilizar primero son los de `reporteEstado` (porque ya filtran por año y fuente correcta).
- Los endpoints `count-by-status` actuales no evidencian soporte por año, por lo que pueden ser insuficientes para multi-año.

---

## 4) Evaluación de opciones

## Opción A: Selector de año en dashboard (recomendada)
Descripción:
- Agregar selector de año en `DashboardAdmin`.
- Cargar años con `getAnosReporte`.
- Calcular métricas del dashboard para el año seleccionado (sin mezclar años).

Ventajas:
- El funcionario analiza un corte temporal claro.
- Consistencia con módulo de reportes.
- Evita ambigüedad 2024 vs 2025.
- Permite comparaciones futuras (año actual vs anterior).

Riesgos/costos:
- Ajuste de frontend del dashboard.
- Posible ajuste backend si faltan endpoints agregados de conteo por año (o si se quiere evitar calcular en frontend).

## Opción B: Métricas atemporales
Descripción:
- Mantener dashboard sin selector de año.
- Mostrar solo métricas que “no dependan” del año.

Ventajas:
- Menor esfuerzo inicial.
- Menos cambios de UX.

Riesgos/costos:
- Se pierde contexto analítico clave para seguimiento anual.
- Puede ocultar señales importantes (caídas/subidas por año).
- Puede seguir generando dudas cuando una métrica sí cambia por ciclo anual.

## Veredicto
La mejor base es **Opción A**.

Si se quiere reducir riesgo de implementación, aplicar un enfoque híbrido:
1. Dashboard principal con selector de año (métricas anuales).
2. Bloque secundario pequeño de métricas globales atemporales (ejemplo: total usuarios activos), claramente rotuladas como “Global”.

---

## 5) Recomendación funcional por dashboard

### 5.1 DashboardAdmin
Implementar:
- Selector de año visible arriba del panel.
- Etiqueta de contexto: “Mostrando métricas del año X”.
- Todas las tarjetas y gráficos dependientes del año.

Fuente de datos sugerida (fase inicial sin endpoint nuevo):
- Usar `reporteEstado` por literal (LB/B) y agregar en frontend por estado para construir tarjetas.

Fuente ideal (fase optimizada):
- Crear endpoint agregado de dashboard por año (uno por literal o uno unificado) para reducir payload y lógica frontend.

### 5.2 DashboardAsociado y DashboardVinculado
No necesitan tablero analítico complejo, pero sí claridad temporal:
- Mostrar badge “Año activo: X”.
- (Opcional) selector de año solo si el negocio necesita consultar estado de años anteriores desde dashboard.
- Si no habrá selector, dejar explícito que el dashboard muestra el ciclo vigente.

---

## 6) ¿Reutilizar reportes o crear nuevos endpoints?

## Reutilización inmediata (sí)
Se pueden reutilizar ya:
- `getAnosReporte` (LB y B) para poblar selector de año.
- `reporteEstado` (LB y B) para obtener estados por año y derivar conteos.

## Nuevos endpoints (recomendado a mediano plazo)
Para rendimiento y simplicidad de frontend, conviene crear:
- `POST /dashboard/resumen-anual` (unificado) o
- `POST /informacion-f/dashboardResumen` y `POST /informacion-b/dashboardResumen`

Respuesta sugerida:
- Conteos por estado (iniciado/guardado/pendiente/aprobado/rechazado/finalizado).
- Total empresas esperadas para cobertura.
- Metadatos: `ano`, `fuente`, `timestamp`.

---

## 7) Paso a paso recomendado (plan de ejecución)

### Fase 1 - Decisión funcional (rápida)
1. Confirmar que dashboard oficial será por año (no atemporal puro).
2. Definir año por defecto:
   - recomendado: año más reciente disponible.
3. Definir si asociado/vinculado tendrán solo badge de año o también selector.

### Fase 2 - Implementación frontend mínima viable
1. Extraer/reutilizar lógica de año desde `reportes.js`:
   - carga de años disponibles.
   - estado `ano`.
2. Agregar selector de año en `DashboardAdmin`.
3. Reemplazar cálculo actual de métricas por cálculo basado en datos del año seleccionado.
4. Mostrar texto de contexto temporal en la cabecera.

### Fase 3 - Validación funcional
1. Probar con año actual (ej. 2025): no debe mezclar con 2024.
2. Probar con año histórico (ej. 2024): debe traer histórico correctamente.
3. Validar totales y cobertura contra reporte de estado del mismo año.

### Fase 4 - Optimización backend (si aplica)
1. Medir tiempos/payload usando `reporteEstado`.
2. Si carga es alta, implementar endpoint agregado de dashboard por año.
3. Mantener compatibilidad con lógica de reportes y mismas reglas de año actual vs histórico.

---

## 8) Criterios de éxito
- El usuario siempre sabe qué año está viendo.
- No se mezclan métricas de distintos años en tarjetas/gráficas principales.
- Totales del dashboard coinciden con reportes del mismo año.
- El flujo de renovación deja de generar confusión operativa.

---

## 9) Decisión recomendada para Punto Azul
Aplicar **Opción A (selector de año)** como estrategia principal.

Usar Opción B solo como complemento en un bloque pequeño de métricas globales explícitamente etiquetadas, no como sustituto del análisis anual.

Con esto se conserva claridad analítica, consistencia con reportes y escalabilidad para próximos ciclos de renovación.