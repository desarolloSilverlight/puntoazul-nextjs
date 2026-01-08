# 📊 RESUMEN EJECUTIVO - Sistema de Historial Literal F

## 🎯 Objetivo
Implementar un sistema automático de historial para formularios de Literal F que permita:
1. **Backup automático** cuando un formulario llega a estado "Finalizado"
2. **Limpieza controlada** de formularios para permitir nuevos reportes anuales
3. **Migración de datos existentes** de formularios ya finalizados

---

## 🔄 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DEL FORMULARIO                 │
└─────────────────────────────────────────────────────────────────┘

1. CREACIÓN Y EDICIÓN
   ├─ Vinculado crea formulario → Estado: "Guardado"
   ├─ Puede editar mientras esté en "Guardado" o "Rechazado"
   └─ Envía a validación → Estado: "Pendiente"

2. VALIDACIÓN
   ├─ Validador revisa → Aprueba o Rechaza
   ├─ Si rechaza → Vuelve a "Rechazado" (vinculado puede editar)
   └─ Si aprueba → Estado: "Aprobado"

3. CARGA DE CARTA FIRMADA (⚡ PUNTO CLAVE - NUEVO FLUJO)
   ├─ Vinculado ve botón "Subir Carta Firmada" cuando estado = "Aprobado"
   ├─ Selecciona archivo PDF (carta firmada)
   ├─ Sube la carta al servidor
   ├─ 🤖 AUTOMÁTICO: Estado cambia a "Finalizado"
   ├─ 🤖 AUTOMÁTICO: Se guarda urlDoc en informacionF
   └─ 🤖 AUTOMÁTICO: Se copia completo a histInformacionF (incluyendo urlDoc)

4. LIMPIEZA (Nuevo proceso anual)
   ├─ Administrador va a sección "Limpiar Formularios"
   ├─ Ve lista de todos los vinculados con formularios
   ├─ Filtra por "Finalizados" (solo estos se pueden eliminar)
   ├─ Verifica que tienen urlDoc guardado en historial
   ├─ Selecciona los que desea limpiar
   ├─ Confirma eliminación
   └─ 🗑️ Se eliminan de las 6 tablas operativas
   
5. NUEVO CICLO
   └─ Vinculado puede crear formulario para el nuevo año
```

---

## 🗄️ Estructura de Datos

### Tablas Operativas (Se limpian anualmente)
```
informacionF (tabla principal)
  ├─ empaques_primarios
  ├─ empaques_secundarios
  ├─ empaques_plasticos
  ├─ envases_retornables
  └─ distribucion_geografica
```

### Tabla de Histórico (Permanente)
```
histInformacionF (38 campos consolidados + urlDoc)
  ├─ Datos básicos del vinculado
  ├─ 🔴 urlDoc (carta firmada - CRÍTICO)
  ├─ Toneladas calculadas por tipo
  ├─ Flags booleanos (tiene_primarios, tiene_secundarios, etc.)
  ├─ Cantidades de productos
  ├─ Detalle completo en JSON
  └─ Preguntas de distribución geográfica
```

---

## 🛠️ Cambios en el Backend

### 1. Scripts SQL (Ejecutar UNA vez)
```⚠️ IMPORTANTE: informacionF NO necesita modificaciones
-- Ya tiene todos los campos necesarios incluyendo urlDoc

-- Solo agregar campos a histInformacionF
ALTER TABLE histInformacionF 
ADD COLUMN pais VARCHAR(100) NULL AFTER ciudad,
ADD COLUMN urlDoc VARCHAR(500) NULL COMMENT 'URL de carta firmada - CRÍTICO' AFTER pais,
ADD COLUMN departamentos TEXT NULL AFTER urlDocd,
ADD COLUMN departamentos TEXT NULL AFTER pais,
ADD COLUMN pregunta1 TEXT NULL,
ADD COLUMN pregunta2 TEXT NULL,
ADD COLUMN pregunta3 TEXT NULL,
ADD COLUMN pregunta4 TEXT NULL,
ADD COLUMN pregunta5 TEXT NULL,
ADD COLUMN observaciones TEXT NULL;
```

### 2. Nuevos Archivos
- `helpers/informacionF.helper.js` - Funciones de cálculo de toneladas
- Funciones en controlador existente

### 3. Nuevos Endpoints
```
POST   /api/informacion-f/migrar-historial/:idInformacionF
POST   /api/informacion-f/migrar-historial-masivo
GET    /api/informacion-f/subir-carta-firmada/:idInformacionF (🔴 NUEVO - CRÍTICO)
POST   /api/informacion-f/migrar-historial/:idInformacionF
POST   /api/informacion-f/migrar-historial-masivo
GET    /api/informacion-f/vinculados-con-formularios
DELETE /api/informacion-f/limpiar-formularios
```

### 4. Modificaciones
- `updateEstado()` - Bloquear cambio manual a

## 💻 Cambios en el Frontend

### 1. Componente de Carga de Carta (🔴 NUEVO - CRÍTICO)
**Ubicación:** Dentro del formulario cuando estado = "Aprobado"

**Características:**
```javascript
// Mostrar este componente cuando el formulario está en estado "Aprobado"
// y el usuario logueado es el dueño del formulario

┌──────────────────────────────────────────────────────────┐
│  ✅ Tu formulario ha sido APROBADO                       │
│                                                           │
│  📄 Para finalizar, debes subir la carta firmada:        │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  [Seleccionar archivo PDF]  carta-firmada.pdf      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ⚠️ Requisitos:                                           │
│  • Archivo en formato PDF                                │
│  • Tamaño máximo: 5MB                                    │
│  • Carta debe estar firmada                              │
│                                                           │
│  [📤 Subir Carta Firmada]                                │
│                                                           │
│  ℹ️ Al subir la carta, tu formulario pasará              │
│     automáticamente a estado "Finalizado"                │
└──────────────────────────────────────────────────────────┘
```

**Lógica:**
```javascript
// En el componente del formulario (Informacion.js o literalf.js)
const [mostrarSubirCarta, setMostrarSubirCarta] = useState(false);
const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
const [subiendo, setSubiendo] = useState(false);

useEffect(() => {
  // Mostrar componente solo si estado = "Aprobado" y es el dueño
  if (estado === 'Aprobado' && !readonly) {
    setMostrarSubirCarta(true);
  }
}, [estado, readonly]);

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }
    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no debe superar 5MB');
      return;
    }
    setArchivoSeleccionado(file);
  }
};

const handleSubirCarta = async () => {
  if (!archivoSeleccionado) {
    alert('Debes seleccionar un archivo');
    return;
  }
  
  const formData = new FormData();
  formData.append('carta', archivoSeleccionado);
  
  setSubiendo(true);
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/informacion-f/subir-carta-firmada/${idInformacionF}`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData
      }
    );
    
    if (!response.ok) throw new Error('Error al subir carta');
    
    const data = await response.json();
    
    alert('¡Carta subida exitosamente! Tu formulario ha sido finalizado.');
    
    // Actualizar estado local
    setEstado('Finalizado');
    setMostrarSubirCarta(false);
    
    // Recargar o actualizar vista
    window.location.reload();
    
  } catch (error) {
    console.error('Error:', error);
    alert('Error al subir la carta: ' + error.message);
  } finally {
    setSubiendo(false);
  }
};
```

### 2. Nueva Página: Limpieza de Formularios
**Ruta:** `/admin/limpiar-formularios` (o sección dentro de vinculados)

**Componentes a crear:**
- `pages/admin/limpiar-formularios.js` - Página principal
- `components/Cards/CardLimpiarFormularios.js` - Card con tabla

**Características:**
```javascript
┌──────────────────────────────────────────────────────────┐
│  🧹 LIMPIAR FORMULARIOS - LITERAL F                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [← Volver]                    [🔄 Actualizar]    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ☑️ Seleccionar todos los finalizados                     │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ☑ | Nombre           | NIT        | Año  | Estado  │ │
│  │ ☑ | Empresa A        | 900123456  | 2024 | ✅ Final│ │
│  │ ☑ | Empresa B        | 900234567  | 2024 | ✅ Final│ │
│  │ ☐ | Empresa C        | 900345678  | 2024 | ⏳ Aprob│ │ <- Disabled
│  │ ☐ | Empresa D        | 900456789  | 2024 | ⏳ Pend │ │ <- Disabled
│  │ ☐ | Empresa E        | 900567890  | 2024 | 💾 Guard│ │ <- Disabled
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  2 formularios seleccionados                              │
│                                                           │
│  [🗑️ Limpiar Seleccionados]                              │
└──────────────────────────────────────────────────────────┘
```

**Lógica:**
1. Obtener lista con `GET /api/informacion-f/vinculados-con-formularios`
2. Mostrar en tabla ordenada (Finalizados primero)
3. Checkbox habilitado SOLO para estado "Finalizado"
4. Botón "Seleccionar todos" marca solo los finalizados
5. Confirmar antes de eliminar
6. Enviar IDs a `DELETE /api/informacion-f/limpiar-formularios`
7. Mostrar resultados (exitosos/fallidos)

### 2. Modificar Vinculados
**Archivo:** `pages/admin/vinculados.js`

Agregar botón en la esquina superior derecha:
```javascript
<button 
  onClick={() => router.push('/admin/limpiar-formularios')}
  className="bg-orange-500 text-white px-4 py-2 rounded"
>
  🧹 Limpiar Formularios
</button>
```

### 3. Panel de Migración (Admin - Una sola vez)
**Ubicación:** Sección de administrador

Botón para ejecutar migración masiva de registros existentes:
```javascript
<button 
  onClick={migrarHistoricosMasivo}
  className="bg-purple-500 text-white px-4 py-2 rounded"
>
  📋 Migrar Finalizados Existentes al Historial
</button>
```

Este botón ejecuta: `POST /api/informacion-f/migrar-historial-masivo`

---

## 🎨 Diseño de Interfaz

### Estados Visuales
```
✅ Finalizado    → Verde  → Checkbox habilitado  → Puede limpiarse
✔️ Aprobado      → Azul   → Checkbox deshabilitado
❌ Rechazado     → Rojo   → Checkbox deshabilitado
⏳ Pendiente     → Amarillo → Checkbox deshabilitado
💾 Guardado      → Gris   → Checkbox deshabilitado
```

### Confirmación de Limpieza
```
┌─────────────────────────────────────────────┐
│  ⚠️  CONFIRMAR LIMPIEZA                     │
│                                             │
│  Está a punto de eliminar 3 formularios:   │
│                                             │
│  • Empresa A - 2024                         │
│  • Empresa B - 2024                         │
│  • Empresa C - 2024                         │
│                                             │
│  ⚠️ Esta acción es IRREVERSIBLE             │
│  Los datos ya están respaldados en el       │
│  historial.                                 │
│                                             │
│  ¿Desea continuar?                          │
│                                             │
│  [Cancelar]  [✓ Sí, Limpiar]               │
└─────────────────────────────────────────────┘
```

---

## 🔒 Seguridad y Permisos

### Roles con Acceso
```
Administrador:
  ✅ Ver vinculados con formularios
  ✅ Limpiar formularios finalizados
  ✅ Migrar al historial (manual)
  ✅ Cambiar estados a "Finalizado"

AdministradorF:
  ✅ Ver vinculados con formularios
  ✅ Limpiar formularios finalizados
  ⚠️ Verificar si puede cambiar a "Finalizado"

ValidadorF:
  ✅ Ver vinculados con formularios
  ❌ No puede limpiar
  ❌ No puede cambiar a "Finalizado"

Vinculado:
  ❌ No tiene acceso a estas funciones
```

---

## 📝 Checklist de Implementación

### Backend
- [ ] Ejecutar ALTER TABLE en `histInformacionF` (NO en informacionF)
- [ ] Crear `helpers/informacionF.helper.js`
- [ ] Implementar función `copiarAHistorial()` (incluir urlDoc)
- [ ] Crear endpoint `POST /subir-carta-firmada/:id` (🔴 NUEVO Y CRÍTICO)
- [ ] Modificar `updateEstado()` para bloquear cambio manual a "Finalizado"
- [ ] Crear endpoint `POST /migrar-historial/:id`
- [ ] Crear endpoint `POST /migrar-historial-masivo`
- [ ] Crear endpoint `GET /vinculados-con-formularios`
- [ ] Crear endpoint `DELETE /limpiar-formularios`
- [ ] Agregar middleware de autorización
- [ ] Configurar multer para carga de archivos
- [ ] Probar todos los endpoints

### Frontend
- [ ] Crear componente de carga de carta (🔴 NUEVO Y CRÍTICO)
- [ ] Integrar componente en formulario cuando estado = "Aprobado"
- [ ] Validar formato PDF y tamaño de archivo
- [ ] Implementar barra de progreso de carga
- [ ] Crear `pages/admin/limpiar-formularios.js`
- [ ] Crear `components/Cards/CardLimpiarFormularios.js`
- [ ] Agregar botón en `pages/admin/vinculados.js`
- [ ] Implementar lógica de checkboxes (solo finalizados)
- [ ] Implementar "Seleccionar todos"
- [ ] Implementar confirmación de limpieza
- [ ] Mostrar resultados (exitosos/fallidos)
- [ ] Agregar botón de migración masiva (admin)
- [ ] Probar flujo complAprobado"
- [ ] 🔴 Verificar que aparece botón "Subir Carta"
- [ ] 🔴 Subir carta PDF de prueba
- [ ] 🔴 Verificar que estado cambió a "Finalizado" automáticamente
- [ ] 🔴 Verificar que urlDoc se guardó en informacionF
- [ ] Verificar auto-copia a historial
- [ ] 🔴 Verificar que urlDoc está en histInformacionF
- [ ] Intentar cambiar manualmente a "Finalizado" → Debe fallar
### Testing
- [ ] Crear formulario de prueba
- [ ] Cambiar estado a "Finalizado"
- [ ] Verificar auto-copia a historial
- [ ] Probar migración manual de un registro
- [ ] Probar migración masiva
- [ ] Verificar datos en histInformacionF
- [ ] Probar limpieza de un formulario
- [ ] Probar limpieza masiva
- [ ] Verificar que vinculado puede crear nuevo formulario
- [ ] Probar con diferentes roles (permisos)

---

## 📊 Datos de Ejemplo

### Escenario Real
```
2024 - Año reportado
├─ 50 vinculados con formularios
│  ├─ 30 Finalizados ✅ (listos para limpiar)
│  ├─ 10 Aprobados ✔️ (esperando cambio a Finalizado)
│  ├─ 5 Pendientes ⏳ (en revisión)
│  └─ 5 Guardados 💾 (en edición)
│
└─ Proceso de limpieza:
   1. Admin ejecuta migración masiva → 30 registros a historial
   2. Admin va a "Limpiar Formularios"
   3. Selecciona los 30 finalizados
   4. Confirma limpieza
   5. ✅ 30 formularios eliminados de operativas
   6. 30 vinculados pueden reportar 2025
```

---

## ⚠️ Consideraciones Importantes

### 1. Orden de Operaciones
```
SIEMPRE en este orden:
1º Copiar a historial (automático con estado Finalizado)
2º Verificar que existe en histInformacionF
3º Limpiar de tablas operativas
```

### 2. Validaciones Críticas
- ✅ Solo eliminar registros en estado "Finalizado"
- ✅ Verificar que existe en historial antes de eliminar
- ✅ Transacciones en todas las operaciones
- ✅ Logs detallados de cada operación

### 3. Backup
- Se recomienda hacer backup completo de la BD antes de:
  1. Primera migración masiva
  2. Primera limpieza masiva
  
```bash
mysqldump -u usuario -p base_datos > backup_antes_limpieza_$(date +%Y%m%d).sql
```

### 4. Reversión (Si algo sale mal)
Si se necesita recuperar datos eliminados:
```sql
-- Copiar desde historial a operativa (NO RECOMENDADO normalmente)
INSERT INTO informaci2-3 días)
1. Ejecutar script SQL (solo histInformacionF)
2. Crear helpers y funciones
3. Implementar endpoint de carga de carta (🔴 CRÍTICO)
4. Implementar otros endpoints
5. Configurar multer y storage de archivos
6``

---

## 🚀 Roadmap de Implementación
2-3 días)
1. Crear componente de carga de carta (🔴 PRIORIDAD)
2. Crear interfaz de limpieza
3. Integrar con endpoints
4. Testing de UI/UX
5. Validaciones de archivosfunciones
3. Implementar endpoints
4. Testing manual con Postman

### Fase 2: Migración Inicial (30 min)
1. Ejecutar migración masiva
2. Verificar datos en historial
3. Validar integridad

### Fase 3: Frontend (1-2 días)
1. Crear interfaz de limpieza
2. Integrar con endpoints
3. Testing de UI/UX

### Fase 4: Testing Integrado (1 día)
1. Flujo completo end-to-end
2. Testing con diferentes roles
3. Verificar casos límite

### Fase 5: Producción (30 min)
1. Backup de producción
2. Deploy backend
3. Deploy frontend
4. Migración masiva en producción
5. Monitoreo

---

## 📞 Soporte Post-Implementación

### Comandos Útiles (SQL)

**Ver finalizados sin migrar:**
```sql
SELECT i.idInformacionF, i.nombre, i.nit, i.ano_reportado
FROM informacionF i
WHERE i.estado = 'Finalizado'
AND NOT EXISTS (
  SELECT 1 FROM histInformacionF h
  WHERE h.idUsuario = i.idUsuario 
  AND h.ano_reportado = i.ano_reportado
);
```

**Contar registros por estado:**
```sql
SELECT estado, COUNT(*) as total
FROM informacionF
GROUP BY estado;
```
Carga de carta firmada** obligatoria para finalizar (🔴 NUEVO)
2. ✅ **Backup automático** de formularios finalizados (con urlDoc)
3. ✅ **Limpieza controlada** para reportes anuales
4. ✅ **Histórico permanente** de todos los reportes
5. ✅ **Trazabilidad completa** con URL de carta firmada
6. ✅ **Interfaz intuitiva** para vinculados y administradores
7. ✅ **Seguridad** con validaciones y permisos
8. ✅ **Auditoríaado
ORDER BY ano_reportado DESC;
```

---

## ✅ Conclusión

Este sistema proporciona:
1. ✅ **Backup automático** de formularios finalizados
2. ✅ **Limpieza controlada** para reportes anuales
3. ✅ **Histórico permanente** de todos los reportes
4. ✅ **Interfaz intuitiva** para administradores
5. ✅ **Seguridad** con validaciones y permisos
6. ✅ **Trazabilidad** completa de operaciones

El flujo está diseñado para ser:
- **Seguro**: Validaciones en cada paso
- **Reversible**: Datos siempre en historial
- **Auditable**: Logs de todas las operaciones
- **Escalable**: Funciona con muchos vinculados

---

**Fecha de Documento:** Enero 2026
**Versión:** 1.0
**Autor:** Sistema de Documentación
