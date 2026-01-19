# 📊 INFORME TÉCNICO: CAMBIO MULTI-EMPRESA

**Fecha:** 19 de enero de 2026  
**Analista:** Equipo de Desarrollo  
**Asunto:** Evaluación técnica para permitir que un usuario gestione múltiples empresas

---

## 📋 RESUMEN EJECUTIVO

**Solicitud:** Permitir que un usuario gestione formularios Literal B y F de múltiples empresas (NITs diferentes).

**Veredicto:** **VIABLE** pero requiere reestructuración significativa de backend y frontend.

**Complejidad:** 🔴 ALTA | **Riesgo:** 🔴 CRÍTICO | **Impacto:** 🟡 MEDIO-ALTO  
**Esfuerzo:** ~70 horas | **Plazo:** 4-5 semanas

---

## 🎯 EL CAMBIO SOLICITADO

**Sistema Actual (1:1):** Un usuario → Una empresa → Un conjunto de formularios  
**Sistema Solicitado (1:N):** Un usuario → Múltiples empresas → Selector para alternar

**Ejemplo:**
```
Usuario Juan Pérez → Empresa A (NIT: 900123456)
                   → Empresa B (NIT: 860002693)
                   → Empresa C (NIT: 800456789)
```

**Implicación clave:** El sistema fue diseñado asumiendo relación 1:1. TODO el código, validaciones, permisos y flujos están construidos sobre esta premisa

---

## 🔍 IMPLICACIONES TÉCNICAS CRÍTICAS

### **1. BASE DE DATOS** 🏗️
**Problema:** La tabla `informacionB` tiene restricción UNIQUE en el campo `nit` que **bloquea completamente** tener múltiples registros del mismo NIT.  
**Cambio requerido:** Eliminar restricción UNIQUE y crear constraint compuesto `(idUsuario, nit)`.  
**Riesgo:** Sin nuevas validaciones, podrían crearse duplicados accidentales.

### **2. ENDPOINTS Y LÓGICA DE NEGOCIO** 🔧
**Problema:** Los endpoints asumen relación 1:1 y retornan UN SOLO registro.  
**Archivos críticos afectados:**
- `getByIdUsuario()` → Debe retornar ARRAY de empresas, no objeto único
- `validarAnosDuplicados()` → Inconsistencia detectada: usa ID en frontend pero NIT en backend
- Todos los formularios (InformacionB.js, Informacion.js) esperan objeto único

**Cambio requerido:** Refactorizar 10+ endpoints y 8 componentes frontend.

### **3. AUTENTICACIÓN Y CONTEXTO** 🔐
**Problema:** Después del login, el sistema carga datos automáticamente asumiendo una única empresa.  
**Cambio requerido:**
- Crear selector de empresas post-login
- Mantener contexto de "empresa activa" en todo el sistema
- Validar que usuario tenga permisos para la empresa que intenta acceder

**Impacto UX:** Usuario debe seleccionar empresa en cada sesión. Ya no es directo.

### **4. VALIDACIONES Y SEGURIDAD** 🛡️
**Problema:** Actualmente: "Si eres el usuario, puedes editar". No hay concepto de permisos por empresa.  
**Cambio requerido:**
- Implementar validación: ¿Este usuario tiene acceso a este NIT?
- Prevenir manipulación de localStorage para acceder empresas no autorizadas
- Opción básica: Validar en backend que `informacionB.idUsuario` coincida con usuario logueado
- Opción avanzada: Tabla `usuarioEmpresas` con permisos granulares

### **5. HERRAMIENTAS ADMINISTRATIVAS** 📊
**Funciones afectadas:** Renovar formularios, Limpiar formularios, Reportes consolidados, Notificaciones.  
**Problema:** Todo está diseñado para "Usuario X hizo Y", ahora debe ser "Usuario X hizo Y en Empresa Z".  
**Impacto:** Operaciones admin más lentas, lógica de notificaciones más compleja

---

## 🚨 RIESGOS Y PROBLEMAS DETECTADOS

### **Riesgos Técnicos**
| Riesgo | Probabilidad | Impacto |
|--------|--------------|---------|
| Usuarios accediendo empresas no autorizadas | 🟡 MEDIA | CRÍTICO |
| Duplicados de información | 🟡 MEDIA | ALTO |
| Errores en validaciones de años (existente) | 🔴 ALTA | ALTO |
| Pérdida de datos durante migración | 🟢 BAJA | CRÍTICO |

### **Riesgos Operacionales**
- Usuarios necesitarán capacitación (nuevo flujo de trabajo)
- Soporte incrementado durante transición
- Operaciones admin más lentas (renovar, limpiar formularios)
- Rollback complejo si algo falla

### **Problema Crítico Detectado**
⚠️ **Validación de años duplicados tiene inconsistencias graves:**
- Frontend envía NIT pero backend espera ID de usuario
- No hay coherencia entre Literal B y Literal F
- **Requiere corrección inmediata** independientemente de este cambio

---

## 📊 ALTERNATIVAS DE IMPLEMENTACIÓN

### **Opción A: Usuarios Múltiples (Rápida pero no escalable)**
**Descripción:** Crear usuarios separados por cada empresa (`juan@empresa.com`, `juan+empresaB@empresa.com`)  
**Tiempo:** 1-2 horas | **Pros:** Sin cambios de código | **Contras:** Múltiples credenciales, no escalable

### **Opción B: Multi-empresa Completa (Recomendada)**
**Descripción:** Refactorizar sistema completo para soportar 1:N  
**Tiempo:** 70 horas (5 semanas) | **Pros:** Escalable, profesional | **Contras:** Requiere esfuerzo significativo

### **Opción C: Por Fases (Óptima)**
**Descripción:** MVP básico (30h) → Piloto con usuarios (2 sem) → Sistema completo (20h)  
**Tiempo:** 6 semanas totales | **Pros:** Menor riesgo, validación temprana | **Contras:** Plazo más largo

---

## 🎯 RECOMENDACIÓN

**Implementar Opción C** (Por Fases) con el siguiente plan:

**Fase 1 (2 semanas):** Backend básico + Selector empresas + Validaciones mínimas  
**Fase 2 (2 semanas):** Piloto con 2-3 usuarios reales + Feedback  
**Fase 3 (2 semanas):** Permisos avanzados + Herramientas admin + Deploy producción

**Justificación:** Minimiza riesgos, permite ajustes según experiencia real, inversión gradual.

---

## ⚠️ CONSIDERACIONES FINALES

**ESTO NO ES UN CAMBIO SIMPLE:**
- Afecta ~20 archivos de código
- Requiere modificar estructura de base de datos
- Cambia flujo de usuario (deben seleccionar empresa)
- Necesita nuevas validaciones de seguridad
- Implica capacitación a usuarios

**ADVERTENCIAS:**
- Sistema actual tiene bug en validación de años (corregir YA)
- No podemos garantizar cero incidencias
- Requiere backup completo antes de iniciar
- Plan de rollback es esencial

**DECISIONES PENDIENTES:**
- ¿Cuántos usuarios gestionarán múltiples empresas?
- ¿Necesitan permisos granulares por empresa?
- ¿Prioridad alta/media/baja?
- ¿Presupuesto aprobado?

---

**Documento generado el 19 de enero de 2026**  
**Versión 1.0 - Resumen Técnico**
