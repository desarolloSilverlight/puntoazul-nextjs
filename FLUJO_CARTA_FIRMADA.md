# 🔴 CAMBIO CRÍTICO EN EL FLUJO - Carga de Carta Firmada

## ⚠️ RESUMEN DEL CAMBIO

### ❌ FLUJO ANTERIOR (INCORRECTO)
```
Aprobado → Admin cambia a "Finalizado" → Se copia a historial
```

### ✅ FLUJO NUEVO (CORRECTO)
```
Aprobado → Vinculado sube carta firmada → 
  → Se guarda urlDoc → 
  → Estado cambia a "Finalizado" automáticamente →
  → Se copia a historial (incluyendo urlDoc)
```

---

## 🔑 PUNTOS CLAVE

### 1. Campo urlDoc
- ✅ **YA EXISTE** en la tabla `informacionF`
- 🔴 **DEBE AGREGARSE** a la tabla `histInformacionF`
- 📄 Almacena la URL de la carta firmada (PDF)
- 🔒 Es **OBLIGATORIO** para que el formulario pase a "Finalizado"
- 📊 Se mantiene en el historial para **trazabilidad y auditorías**

### 2. Tabla informacionF
- ✅ **NO necesita modificaciones**
- ✅ Ya tiene todos los campos necesarios:
  - `urlDoc` ✅
  - `persona_contacto` ✅ (se mapea a representante_legal)
  - `telefono` y `celular` ✅ (se mapean a telefono_representante)
  - Todos los demás campos ✅

### 3. Nuevo Endpoint CRÍTICO
```
POST /api/informacion-f/subir-carta-firmada/:idInformacionF
```

**Validaciones:**
- ✅ Formulario debe estar en estado "Aprobado"
- ✅ Solo el dueño del formulario puede subir la carta
- ✅ Archivo debe ser PDF
- ✅ Tamaño máximo 5MB

**Acciones automáticas al subir:**
1. Guardar archivo en servidor
2. Actualizar `urlDoc` en `informacionF`
3. Cambiar estado a "Finalizado"
4. Copiar registro completo a `histInformacionF` (con urlDoc)

### 4. Bloqueo de Cambio Manual
El endpoint `updateEstado` ahora **RECHAZA** cambios manuales a "Finalizado":
```javascript
if (estado === 'Finalizado') {
  return res.status(400).json({ 
    error: 'No se puede cambiar manualmente a "Finalizado". El vinculado debe subir la carta firmada.'
  });
}
```

---

## 🎨 Interfaz de Usuario

### Vinculado - Vista cuando estado = "Aprobado"

```
┌────────────────────────────────────────────────────────────┐
│  📋 FORMULARIO LITERAL F                                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ ¡Felicidades! Tu formulario ha sido APROBADO           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📄 PASO FINAL: Subir Carta Firmada                │   │
│  │                                                     │   │
│  │  Para completar el proceso y finalizar tu          │   │
│  │  formulario, debes subir la carta de compromiso    │   │
│  │  debidamente firmada.                               │   │
│  │                                                     │   │
│  │  Requisitos:                                        │   │
│  │  • Formato: PDF                                     │   │
│  │  • Tamaño máximo: 5MB                              │   │
│  │  • La carta debe estar firmada                      │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  📎 Seleccionar archivo...                   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  Archivo seleccionado: carta-firmada.pdf (2.3 MB)  │   │
│  │                                                     │   │
│  │  [📤 Subir Carta Firmada]                          │   │
│  │                                                     │   │
│  │  ℹ️ Al subir la carta, tu formulario pasará        │   │
│  │     automáticamente a estado "FINALIZADO"          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Ver Detalles del Formulario ▼]                          │
└────────────────────────────────────────────────────────────┘
```

### Durante la carga:

```
┌────────────────────────────────────────────────────────────┐
│  📤 Subiendo carta firmada...                              │
│                                                             │
│  ████████████████░░░░░░░░░░ 65%                           │
│                                                             │
│  Por favor espera, no cierres esta ventana                 │
└────────────────────────────────────────────────────────────┘
```

### Después de subir:

```
┌────────────────────────────────────────────────────────────┐
│  ✅ ¡Carta subida exitosamente!                            │
│                                                             │
│  Tu formulario ha sido FINALIZADO                          │
│                                                             │
│  📄 Carta firmada: carta-firmada-2024.pdf                  │
│  📅 Fecha de finalización: 06/01/2026 15:30               │
│                                                             │
│  Tu información ha sido registrada en el sistema.          │
│  Gracias por tu participación.                             │
│                                                             │
│  [Volver al Dashboard]                                     │
└────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementación Frontend

### 1. Modificar componente de formulario

Agregar en `components/Forms/Informacion.js` (o el componente principal):

```javascript
// Agregar estados
const [mostrarSubirCarta, setMostrarSubirCarta] = useState(false);
const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
const [subiendo, setSubiendo] = useState(false);
const [progresoSubida, setProgresoSubida] = useState(0);

// Efecto para mostrar componente de carga
useEffect(() => {
  // Mostrar solo si estado = "Aprobado" y NO está en modo readonly
  if (estado === 'Aprobado' && !readonly) {
    setMostrarSubirCarta(true);
  } else {
    setMostrarSubirCarta(false);
  }
}, [estado, readonly]);

// Manejador de selección de archivo
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validar formato
  if (file.type !== 'application/pdf') {
    alert('❌ Error: Solo se permiten archivos PDF');
    e.target.value = '';
    return;
  }
  
  // Validar tamaño (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('❌ Error: El archivo no debe superar 5MB');
    e.target.value = '';
    return;
  }
  
  setArchivoSeleccionado(file);
};

// Manejador de subida
const handleSubirCarta = async () => {
  if (!archivoSeleccionado) {
    alert('⚠️ Debes seleccionar un archivo PDF');
    return;
  }
  
  // Confirmar antes de subir
  const confirmar = window.confirm(
    '¿Estás seguro de subir esta carta?\n\n' +
    'Al confirmar, tu formulario pasará automáticamente a estado FINALIZADO ' +
    'y no podrás hacer más cambios.\n\n' +
    'Archivo: ' + archivoSeleccionado.name
  );
  
  if (!confirmar) return;
  
  const formData = new FormData();
  formData.append('carta', archivoSeleccionado);
  
  setSubiendo(true);
  setProgresoSubida(0);
  
  try {
    const xhr = new XMLHttpRequest();
    
    // Progreso de subida
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const porcentaje = Math.round((e.loaded / e.total) * 100);
        setProgresoSubida(porcentaje);
      }
    });
    
    // Promise para manejar la respuesta
    const respuesta = await new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(xhr.statusText));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Error de red')));
      
      xhr.open('POST', `${API_BASE_URL}/informacion-f/subir-carta-firmada/${idInformacionF}`);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
    
    // Éxito
    alert(
      '✅ ¡Carta subida exitosamente!\n\n' +
      'Tu formulario ha sido FINALIZADO.\n' +
      'La información ha sido registrada en el sistema.'
    );
    
    // Actualizar estado local
    setEstado('Finalizado');
    setMostrarSubirCarta(false);
    
    // Recargar para mostrar vista de finalizado
    window.location.reload();
    
  } catch (error) {
    console.error('Error al subir carta:', error);
    alert('❌ Error al subir la carta: ' + error.message);
  } finally {
    setSubiendo(false);
    setProgresoSubida(0);
  }
};
```

### 2. JSX del componente de carga

```jsx
{mostrarSubirCarta && (
  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
    <div className="flex items-center mb-4">
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
        <i className="fas fa-check text-white text-2xl"></i>
      </div>
      <div>
        <h3 className="text-xl font-bold text-green-700">
          ¡Felicidades! Tu formulario ha sido APROBADO
        </h3>
        <p className="text-green-600">
          Completa el último paso para finalizar
        </p>
      </div>
    </div>
    
    <div className="bg-white rounded-lg p-4 border border-green-300">
      <h4 className="font-semibold text-lg mb-3 flex items-center">
        <i className="fas fa-file-pdf text-red-500 mr-2"></i>
        PASO FINAL: Subir Carta Firmada
      </h4>
      
      <p className="text-sm text-gray-600 mb-4">
        Para completar el proceso y finalizar tu formulario, debes subir 
        la carta de compromiso debidamente firmada.
      </p>
      
      <div className="bg-blue-50 rounded p-3 mb-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">Requisitos:</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Formato: PDF</li>
          <li>• Tamaño máximo: 5MB</li>
          <li>• La carta debe estar firmada</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar archivo:
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-50 file:text-green-700
            hover:file:bg-green-100"
          disabled={subiendo}
        />
        
        {archivoSeleccionado && (
          <p className="mt-2 text-sm text-gray-600">
            <i className="fas fa-paperclip mr-1"></i>
            Archivo seleccionado: <strong>{archivoSeleccionado.name}</strong>
            ({(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>
      
      {subiendo && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Subiendo carta...
            </span>
            <span className="text-sm font-medium text-gray-700">
              {progresoSubida}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progresoSubida}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Por favor espera, no cierres esta ventana
          </p>
        </div>
      )}
      
      <button
        onClick={handleSubirCarta}
        disabled={!archivoSeleccionado || subiendo}
        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center
          ${!archivoSeleccionado || subiendo
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700 transition-colors'
          }`}
      >
        <i className="fas fa-upload mr-2"></i>
        {subiendo ? 'Subiendo...' : 'Subir Carta Firmada'}
      </button>
      
      <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-xs text-yellow-800">
          <i className="fas fa-info-circle mr-1"></i>
          <strong>Importante:</strong> Al subir la carta, tu formulario pasará 
          automáticamente a estado <strong>FINALIZADO</strong> y no podrás 
          hacer más cambios.
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 🔧 Configuración del Backend

### Multer para Carga de Archivos

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio si no existe
const uploadDir = 'uploads/cartas';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `carta-${timestamp}-${random}${ext}`);
  }
});

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

module.exports = upload;
```

---

## ✅ Verificación de Implementación

### Checklist de Testing

- [ ] Crear formulario de prueba
- [ ] Cambiar estado a "Guardado" → "Pendiente"
- [ ] Cambiar estado a "Pendiente" → "Aprobado"
- [ ] ✅ Verificar que aparece componente de carga de carta
- [ ] ❌ Intentar cambiar manualmente a "Finalizado" → Debe rechazar
- [ ] 📄 Intentar subir archivo no-PDF → Debe rechazar
- [ ] 📏 Intentar subir PDF >5MB → Debe rechazar
- [ ] ✅ Subir PDF válido < 5MB
- [ ] ✅ Verificar que muestra barra de progreso
- [ ] ✅ Verificar que estado cambió a "Finalizado"
- [ ] ✅ Verificar que `urlDoc` se guardó en `informacionF`
- [ ] ✅ Verificar que se copió a `histInformacionF`
- [ ] ✅ Verificar que `urlDoc` está en `histInformacionF`
- [ ] 📥 Verificar que el archivo PDF está en el servidor
- [ ] 🔒 Intentar subir carta con otro usuario → Debe rechazar

---

**Última actualización:** 06/01/2026
**Estado:** 🔴 CRÍTICO - Implementar antes de continuar
