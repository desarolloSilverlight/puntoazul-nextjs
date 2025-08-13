# Especificaciones de Endpoints para Reportes Literal B

## Resumen
Este documento especifica los nuevos endpoints necesarios para implementar el sistema de reportes Literal B con tres tipos de reportes: **Grupo**, **Peso** y **Estado**.

## Endpoints Requeridos

### 1. Obtener Años Disponibles para Literal B
**Endpoint:** `GET /api/informacion-b/getAnosReporte`

**Descripción:** Retorna la lista de años disponibles para generar reportes de Literal B.

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": [2021, 2022, 2023, 2024]
}
```

### 2. Reporte de Grupos y Peso
**Endpoint:** `GET /api/informacion-b/reporteGrupoPeso`

**Parámetros:**
- `ano` (number): Año del reporte
- `tipo` (string): 'grupo' o 'peso'

**Descripción:** 
- Para `tipo=grupo`: Retorna empresas agrupadas por clasificación para el año especificado
- Para `tipo=peso`: Retorna empresas con sus pesos de facturación para el año especificado

**Respuesta para tipo=grupo:**
```json
{
  "success": true,
  "data": [
    {
      "nombre": "Empresa ABC S.A.S",
      "nit": "900123456-1",
      "ano": 2023,
      "grupo": "Grupo A"
    },
    {
      "nombre": "Empresa XYZ Ltda",
      "nit": "800987654-2", 
      "ano": 2023,
      "grupo": "Grupo B"
    }
  ]
}
```

**Respuesta para tipo=peso:**
```json
{
  "success": true,
  "data": [
    {
      "nombre": "Empresa ABC S.A.S",
      "nit": "900123456-1",
      "ano": 2023,
      "totalPesoFacturacion": "1250.75"
    },
    {
      "nombre": "Empresa XYZ Ltda",
      "nit": "800987654-2",
      "ano": 2023, 
      "totalPesoFacturacion": "890.25"
    }
  ]
}
```

### 3. Reporte de Estados
**Endpoint:** `GET /api/informacion-b/reporteEstado`

**Parámetros:**
- `cliente` (string, opcional): ID del cliente específico

**Descripción:** Retorna el estado actual de los formularios Literal B por empresa. Si se especifica un cliente, filtra solo las empresas de ese cliente.

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "nombre": "Empresa ABC S.A.S",
      "nit": "900123456-1",
      "correo_facturacion": "facturacion@empresaabc.com",
      "estado": "Aprobado"
    },
    {
      "nombre": "Empresa XYZ Ltda", 
      "nit": "800987654-2",
      "correoFacturacion": "admin@empresaxyz.com",
      "estado": "Pendiente"
    },
    {
      "nombre": "Empresa DEF Corp",
      "nit": "700555111-3",
      "correo_facturacion": "contabilidad@empresadef.com", 
      "estado": "Rechazado"
    }
  ]
}
```

## Estados Válidos para Literal B
- **Iniciado**: Formulario creado pero sin completar
- **Guardado**: Formulario guardado como borrador
- **Pendiente**: Formulario enviado, esperando revisión
- **Aprobado**: Formulario aprobado por funcionario
- **Rechazado**: Formulario rechazado, requiere correcciones

## Funcionalidades Frontend Implementadas

### 1. Interfaz de Usuario
- Selector de tipo de literal (Línea Base / Literal B)
- Selector de tipo de reporte (Estado, Grupo, Peso)
- Selector de año (para reportes de Grupo y Peso)
- Selector de cliente (para reporte de Estado)
- Botón de búsqueda con validaciones

### 2. Tablas DataTables
Cada reporte incluye:
- **Paginación**: 5, 10, 25, 50 resultados por página
- **Búsqueda**: Filtrado en tiempo real por texto
- **Información de resultados**: "Mostrando X a Y de Z resultados"
- **Navegación**: Botones Anterior/Siguiente y números de página

### 3. Gráficos Específicos

#### Reporte de Grupos
- **Tipo**: Gráfico de barras
- **Muestra**: Distribución de empresas por grupo en el año seleccionado
- **Tooltip**: Número y porcentaje de empresas por grupo

#### Reporte de Peso  
- **Tipo**: Gráfico de pastel
- **Muestra**: Distribución de peso por rangos dinámicos (cuartiles)
- **Tooltip**: Peso total, porcentaje y número de empresas por rango
- **Información adicional**: Peso total facturado en el año

#### Reporte de Estado
- **Tipo**: Gráfico de pastel  
- **Muestra**: Distribución de empresas por estado
- **Tooltip**: Número y porcentaje de empresas por estado
- **Colores**: Verde (aprobado), Azul (guardado), Amarillo (pendiente), Rojo (rechazado), Gris (otros)

### 4. Indicadores de Progreso
- **Estado Línea Base**: Barra de progreso mostrando % de empresas finalizadas
- **Estado Literal B**: Barra de progreso mostrando % de empresas aprobadas

## Notas de Implementación

1. **Consistencia de Datos**: Los campos `correo_facturacion` y `correoFacturacion` se manejan indistintamente en el frontend.

2. **Manejo de Errores**: El frontend está preparado para manejar respuestas de error del backend.

3. **Carga de Datos**: Al cambiar el tipo de literal, el frontend carga automáticamente los años disponibles.

4. **Validaciones**: 
   - Año requerido para reportes de Grupo y Peso
   - Cliente opcional para reporte de Estado
   - Validación de campos requeridos antes de hacer búsqueda

5. **Responsive Design**: Todas las tablas y gráficos son responsivos.

## Siguientes Pasos

1. **Backend**: Implementar los 3 endpoints especificados
2. **Testing**: Probar la integración completa frontend-backend
3. **Optimización**: Agregar caché si es necesario para mejorar performance
4. **Documentación**: Actualizar documentación de usuario final

## Estructura de Archivos Modificados

- `pages/admin/reportes.js`: Implementación completa del sistema de reportes
- `components/Dashboard/DashboardVinculado.js`: Dashboard para usuarios vinculados  
- `components/Cards/CardValidarB.js`: Corrección de validación de IDs
- `pages/admin/dashboard.js`: Integración de DashboardVinculado

El sistema está completamente implementado en el frontend y listo para la integración con los endpoints del backend.
