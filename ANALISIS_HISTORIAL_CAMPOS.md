# Análisis de Campos para Tabla histInformacionF

## Resumen Ejecutivo
Se ha analizado toda la estructura de formularios de Literal F para verificar qué campos se guardan y cómo mapearlos a la tabla `histInformacionF`.

## Tablas Involucradas en el Flujo
El formulario de Literal F guarda información en **6 tablas diferentes**:

1. **informacionF** - Información general del formulario
2. **empaques_primarios** - Productos con empaques primarios
3. **empaques_secundarios** - Productos con empaques secundarios
4. **empaques_plasticos** - Productos con empaques plásticos
5. **envases_retornables** - Matriz de retornabilidad
6. **distribucion_geografica** - Distribución por departamentos y preguntas adicionales

## Campos de la Tabla histInformacionF (38 campos)

### ✅ Campos que YA EXISTEN en informacionF (Mapeo directo)
1. `id` - AUTO_INCREMENT (nuevo en historial)
2. `nombre` - ✅ nombre
3. `nit` - ✅ nit
4. `direccion` - ✅ direccion
5. `ciudad` - ✅ ciudad
6. `correo_facturacion` - ✅ correo_facturacion
7. `persona_contacto` - ✅ persona_contacto
8. `telefono` - ✅ telefono
9. `celular` - ✅ celular
10. `cargo` - ✅ cargo
11. `correo_electronico` - ✅ correo_electronico
12. `fecha_diligenciamiento` - ✅ fecha_diligenciamiento
13. `ano_reportado` - ✅ ano_reportado
14. `empresas` - ✅ empresas (empresas representadas)
15. `tipo_reporte` - ✅ tipo_reporte (unitario/totalizado)
16. `idUsuario` - ✅ idUsuario
17. `estado` - ✅ estado
18. `fechaAsociacion` - ✅ fechaAsociacion
19. `toneladas_reportadas` - ✅ toneladas_reportadas (calculado)
20. `toneladas_plasticos` - ✅ toneladas_plasticos (calculado)
21. `toneladas_total` - ✅ toneladas_total (calculado)

### ✅ Campos con MAPEO desde informacionF (usar campos existentes)
22. `representante_legal` - ✅ Mapear desde `persona_contacto` (ya existe)
23. `telefono_representante` - ✅ Mapear desde `telefono` o `celular` (ya existe)
24. `tarifa` - ✅ NULL o calcular si es necesario

### ⚠️ Campos CALCULADOS (no existen en informacionF, se calculan)
25. `toneladas_primarios` - ⚠️ Se puede calcular desde empaques_primarios
26. `toneladas_secundarios` - ⚠️ Se puede calcular desde empaques_secundarios
27. `toneladas_plasticos_liquidos` - ⚠️ Se puede calcular desde empaques_plasticos (líquidos)
28. `toneladas_plasticos_otros` - ⚠️ Se puede calcular desde empaques_plasticos (otros)
29. `toneladas_plasticos_construccion` - ⚠️ Se puede calcular desde empaques_plasticos (construcción)
30. `detalle_materiales` - ⚠️ Se puede generar como JSON de todos los productos
31. `tiene_empaques_primarios` - ⚠️ Boolean: COUNT(empaques_primarios) > 0
32. `tiene_empaques_secundarios` - ⚠️ Boolean: COUNT(empaques_secundarios) > 0
33. `tiene_empaques_plasticos` - ⚠️ Boolean: COUNT(empaques_plasticos) > 0
34. `tiene_envases_retornables` - ⚠️ Boolean: COUNT(envases_retornables) > 0
35. `tiene_distribucion` - ⚠️ Boolean: EXISTS(distribucion_geografica)
36. `cantidad_productos_primarios` - ⚠️ COUNT(empaques_primarios)
37. `cantidad_productos_secundarios` - ⚠️ COUNT(empaques_secundarios)
38. `cantidad_productos_plasticos` - ⚠️ COUNT(empaques_plasticos)

### 🆕 Campos Adicionales (NO están en histInformacionF)
- `pais` - ✅ en informacionF pero NO en histInformacionF
- `urlDoc` - 🔴 **CRÍTICO** en informacionF pero NO en histInformacionF (carta firmada)
- `departamentos` - JSON en distribucion_geografica (NO en histInformacionF)
- `pregunta1` - AV (aprovechamiento materiales) - NO en histInformacionF
- `pregunta2` - AW (investigación y desarrollo) - NO en histInformacionF
- `pregunta3` - AX (sensibilización) - NO en histInformacionF
- `pregunta4` - AY (gestores y recicladores) - NO en histInformacionF
- `pregunta5` - AZ (punto autogestionado) - NO en histInformacionF
- `observaciones` - NO en histInformacionF

## 🚨 CAMPOS FALTANTES CRÍTICOS

### ⚠️ IMPORTANTE: informacionF NO necesita modificaciones
La tabla `informacionF` ya tiene todos los campos necesarios:
- ✅ `persona_contacto` (se mapea a representante_legal)
- ✅ `telefono` y `celular` (se mapea a telefono_representante)
- ✅ `urlDoc` (MUY IMPORTANTE - carta firmada)
- ✅ Todos los demás campos ya existen

### 🔴 CRÍTICO: Campo urlDoc
El campo `urlDoc` ya existe en `informacionF` y es de suma importancia:
- Almacena la carta firmada que el vinculado debe subir
- Cuando se sube la carta → estado cambia a "Finalizado"
- **DEBE agregarse a histInformacionF** para trazabilidad

### 1. En tabla `histInformacionF` (agregar campos faltantes):
```sql
ALTER TABLE histInformacionF 
ADD COLUMN pais VARCHAR(100) NULL AFTER ciudad,
ADD COLUMN urlDoc VARCHAR(500) NULL COMMENT 'URL de carta firmada - CRÍTICO para trazabilidad' AFTER pais,
ADD COLUMN departamentos TEXT NULL COMMENT 'JSON con distribución por departamentos',
ADD COLUMN pregunta1 TEXT NULL COMMENT 'AV - Actividades de aprovechamiento',
ADD COLUMN pregunta2 TEXT NULL COMMENT 'AW - Investigación y desarrollo',
ADD COLUMN pregunta3 TEXT NULL COMMENT 'AX - Sensibilización',
ADD COLUMN pregunta4 TEXT NULL COMMENT 'AY - Gestores y recicladores',
ADD COLUMN pregunta5 TEXT NULL COMMENT 'AZ - Punto autogestionado',
ADD COLUMN observaciones TEXT NULL;
```

**Nota:** El campo `urlDoc` es CRÍTICO porque:
1. Demuestra el consentimiento formal del vinculado
2. Es requisito para que el formulario pase a "Finalizado"
3. Debe mantenerse en el histórico para auditorías futuras

## Estrategia de Migración

### Opción 1: Migración Completa (Recomendada)
Copiar todos los datos relacionados preservando las tablas secundarias:
- histInformacionF (tabla principal)
- hist_empaques_primarios
- hist_empaques_secundarios
- hist_empaques_plasticos
- hist_envases_retornables
- hist_distribucion_geografica

### Opción 2: Migración Consolidada (Actual)
Todo en una tabla con campos calculados y JSON. Pros: más simple. Contras: menos detalle.

## Cálculos Necesarios

### Toneladas por Tipo de Empaque
```javascript
// Ejemplo para empaques_primarios
const toneladasPrimarios = productos.reduce((sum, p) => {
  const pesoUnitario = (parseFloat(p.papel) + parseFloat(p.metal_ferrosos) + 
                        parseFloat(p.metal_no_ferrososs) + parseFloat(p.carton) + 
                        parseFloat(p.vidrio)) / 1000000; // gramos a toneladas
  return sum + (pesoUnitario * parseInt(p.unidades));
}, 0);
```

## Próximos Pasos

1. ✅ Ejecutar ALTER TABLE en ambas tablas (informacionF y histInformacionF)
2. ✅ Crear endpoint backend para migración manual de registros Finalizados actuales
3. ✅ Crear función automática en updateEstado para copiar cuando estado = "Finalizado"
4. ✅ Crear endpoint de limpieza que elimine de las 6 tablas
5. ✅ Crear interfaz frontend para gestión de limpieza
