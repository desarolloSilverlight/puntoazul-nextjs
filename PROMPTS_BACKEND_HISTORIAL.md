# PROMPTS PARA BACKEND - Sistema de Historial Literal F

## 📋 CONTEXTO GENERAL
Estamos implementando un sistema de historial para formularios de Literal F que pasan por estados: Guardado → Pendiente → Aprobado/Rechazado → Finalizado.

Cuando un formulario llega a estado "Finalizado", debe copiarse automáticamente a la tabla `histInformacionF` como respaldo histórico. Luego, el administrador podrá "limpiar" formularios finalizados para que los vinculados puedan reportar un nuevo año.

## 🗄️ ESTRUCTURA DE DATOS

### Tablas Involucradas:
- `informacionF` (tabla principal)
- `empaques_primarios`
- `empaques_secundarios`
- `empaques_plasticos`
- `envases_retornables`
- `distribucion_geografica`

### Tabla Destino:
- `histInformacionF` (38 campos consolidados)

---

## 🔧 PROMPT 1: ALTER TABLE y CREAR TABLAS HISTÓRICAS

```
Necesito que ejecutes este script SQL para agregar campos faltantes en la tabla histInformacionF y crear 5 nuevas tablas históricas:

⚠️ IMPORTANTE: La tabla informacionF NO necesita modificaciones. Ya tiene todos los campos necesarios incluyendo:
- persona_contacto (se usará como representante_legal)
- telefono y celular (se usarán como telefono_representante)
- urlDoc (carta firmada - CRÍTICO)

--- PARTE 1: Modificar histInformacionF ---

ALTER TABLE histInformacionF 
ADD COLUMN idInformacionF INT NULL COMMENT 'ID del formulario original en informacionF - Para referencia y trazabilidad' AFTER id,
ADD COLUMN pais VARCHAR(100) NULL AFTER ciudad,
ADD COLUMN urlDoc VARCHAR(500) NULL COMMENT 'URL de carta firmada - CRÍTICO para trazabilidad' AFTER pais,
ADD COLUMN departamentos TEXT NULL COMMENT 'JSON con distribución por departamentos' AFTER urlDoc,
ADD COLUMN pregunta1 TEXT NULL COMMENT 'AV - Actividades de aprovechamiento' AFTER cantidad_productos_plasticos,
ADD COLUMN pregunta2 TEXT NULL COMMENT 'AW - Investigación y desarrollo' AFTER pregunta1,
ADD COLUMN pregunta3 TEXT NULL COMMENT 'AX - Sensibilización' AFTER pregunta2,
ADD COLUMN pregunta4 TEXT NULL COMMENT 'AY - Gestores y recicladores' AFTER pregunta3,
ADD COLUMN pregunta5 TEXT NULL COMMENT 'AZ - Punto autogestionado' AFTER pregunta4,
ADD COLUMN observaciones TEXT NULL AFTER pregunta5;

-- Agregar índice para búsquedas rápidas por idInformacionF
CREATE INDEX idx_idInformacionF ON histInformacionF(idInformacionF);

--- PARTE 2: Crear Tablas Históricas de Empaques ---

-- 1. Tabla para empaques primarios históricos
CREATE TABLE IF NOT EXISTS histEmpaquePrimario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idInformacionF INT NOT NULL COMMENT 'FK al formulario original informacionF.idInformacionF',
  idOriginal INT NULL COMMENT 'ID original de empaques_primarios',
  empresa VARCHAR(255) NULL,
  nombre_producto VARCHAR(255) NULL,
  papel DECIMAL(10,2) NULL COMMENT 'Peso en gramos',
  metal_ferrosos DECIMAL(10,2) NULL COMMENT 'Peso en gramos',
  metal_no_ferrososs DECIMAL(10,2) NULL COMMENT 'Peso en gramos',
  carton DECIMAL(10,2) NULL COMMENT 'Peso en gramos',
  vidrio DECIMAL(10,2) NULL COMMENT 'Peso en gramos',
  unidades INT NULL,
  fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_informacionF (idInformacionF)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de empaques primarios';

-- 2. Tabla para empaques secundarios históricos
CREATE TABLE IF NOT EXISTS histEmpaqueSecundario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idInformacionF INT NOT NULL COMMENT 'FK al formulario original informacionF.idInformacionF',
  idOriginal INT NULL COMMENT 'ID original de empaques_secundarios',
  empresa VARCHAR(255) NULL,
  nombre_producto VARCHAR(255) NULL,
  papel DECIMAL(10,2) NULL,
  metal_ferrosos DECIMAL(10,2) NULL,
  metal_no_ferrososs DECIMAL(10,2) NULL,
  carton DECIMAL(10,2) NULL,
  vidrio DECIMAL(10,2) NULL,
  unidades INT NULL,
  fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_informacionF (idInformacionF)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de empaques secundarios';

-- 3. Tabla para empaques plásticos históricos
CREATE TABLE IF NOT EXISTS histEmpaquePlastico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idInformacionF INT NOT NULL COMMENT 'FK al formulario original informacionF.idInformacionF',
  idOriginal INT NULL COMMENT 'ID original de empaques_plasticos',
  empresa VARCHAR(255) NULL,
  nombre_producto VARCHAR(255) NULL,
  pet DECIMAL(10,2) NULL COMMENT 'Peso en gramos',
  liquidos TEXT NULL COMMENT 'JSON con materiales líquidos',
  otros TEXT NULL COMMENT 'JSON con otros materiales',
  construccion TEXT NULL COMMENT 'JSON con materiales de construcción',
  unidades INT NULL,
  fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_informacionF (idInformacionF)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de empaques plásticos';

-- 4. Tabla para envases retornables históricos
CREATE TABLE IF NOT EXISTS histEnvaseRetornable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idInformacionF INT NOT NULL COMMENT 'FK al formulario original informacionF.idInformacionF',
  idOriginal INT NULL COMMENT 'ID original de envases_retornables',
  empresa VARCHAR(255) NULL,
  nombre_producto VARCHAR(255) NULL,
  descripcion TEXT NULL,
  cantidad INT NULL,
  peso_unitario DECIMAL(10,2) NULL,
  material VARCHAR(100) NULL,
  fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_informacionF (idInformacionF)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de envases retornables';

-- 5. Tabla para distribución geográfica histórica
CREATE TABLE IF NOT EXISTS histDistribucionGeografica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idInformacionF INT NOT NULL COMMENT 'FK al formulario original informacionF.idInformacionF',
  idOriginal INT NULL COMMENT 'ID original de distribucion_geografica',
  departamentos TEXT NULL COMMENT 'JSON con distribución por departamentos',
  pregunta1 TEXT NULL COMMENT 'AV - Actividades de aprovechamiento',
  pregunta2 TEXT NULL COMMENT 'AW - Investigación y desarrollo',
  pregunta3 TEXT NULL COMMENT 'AX - Sensibilización',
  pregunta4 TEXT NULL COMMENT 'AY - Gestores y recicladores',
  pregunta5 TEXT NULL COMMENT 'AZ - Punto autogestionado',
  observaciones TEXT NULL,
  fecha_copia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_informacionF (idInformacionF)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Historial de distribución geográfica';

Nota: Si algún campo ya existe, omítelo o usa IF NOT EXISTS si tu versión de MySQL lo soporta.

🔴 CAMPOS CRÍTICOS: 
1. idInformacionF: Mantiene la referencia al registro original para trazabilidad
   - En histInformacionF: guarda el ID original del formulario en informacionF
   - En tablas hist*: liga todos los registros históricos al mismo formulario
2. urlDoc: Almacena la URL de la carta firmada que el vinculado sube
   - Es obligatorio para que el formulario pase a estado "Finalizado"
   - DEBE mantenerse en el historial para trazabilidad y auditorías
3. idOriginal: Guarda el ID original de cada registro para referencia

💡 ESTRUCTURA DEL SISTEMA:
- histInformacionF: Tabla principal con datos consolidados
- histEmpaquePrimario: Detalle de cada producto primario
- histEmpaqueSecundario: Detalle de cada producto secundario
- histEmpaquePlastico: Detalle de cada producto plástico
- histEnvaseRetornable: Detalle de cada envase retornable
- histDistribucionGeografica: Distribución y preguntas del formulario

Todas las tablas hist* se relacionan mediante idInformacionF (el ID del formulario original).
Para consultar datos completos: JOIN histInformacionF con las tablas hist* usando idInformacionF.
```

---

## 🔧 PROMPT 2: Función Auxiliar para Calcular Toneladas

```
Necesito crear una función auxiliar en el archivo de servicios o helpers de informacionF que calcule las toneladas por tipo de empaque. Esta función será reutilizada en múltiples endpoints.

Crea un archivo llamado `informacionF.helper.js` en la carpeta de helpers/utils con las siguientes funciones:

/**
 * Calcula las toneladas totales de empaques primarios
 * @param {Number} idInformacionF - ID del formulario
 * @param {Object} connection - Conexión a la BD
 * @returns {Number} Toneladas calculadas
 */
async function calcularToneladasPrimarios(idInformacionF, connection) {
  const [productos] = await connection.query(
    'SELECT papel, metal_ferrosos, metal_no_ferrososs, carton, vidrio, unidades FROM empaques_primarios WHERE idInformacionF = ?',
    [idInformacionF]
  );
  
  return productos.reduce((sum, p) => {
    const pesoUnitarioGramos = (parseFloat(p.papel || 0) + parseFloat(p.metal_ferrosos || 0) + 
                                 parseFloat(p.metal_no_ferrososs || 0) + parseFloat(p.carton || 0) + 
                                 parseFloat(p.vidrio || 0));
    const pesoUnitarioToneladas = pesoUnitarioGramos / 1000000;
    return sum + (pesoUnitarioToneladas * parseInt(p.unidades || 0));
  }, 0);
}

/**
 * Calcula las toneladas totales de empaques secundarios
 */
async function calcularToneladasSecundarios(idInformacionF, connection) {
  const [productos] = await connection.query(
    'SELECT papel, metal_ferrosos, metal_no_ferrososs, carton, vidrio, unidades FROM empaques_secundarios WHERE idInformacionF = ?',
    [idInformacionF]
  );
  
  return productos.reduce((sum, p) => {
    const pesoUnitarioGramos = (parseFloat(p.papel || 0) + parseFloat(p.metal_ferrosos || 0) + 
                                 parseFloat(p.metal_no_ferrososs || 0) + parseFloat(p.carton || 0) + 
                                 parseFloat(p.vidrio || 0));
    const pesoUnitarioToneladas = pesoUnitarioGramos / 1000000;
    return sum + (pesoUnitarioToneladas * parseInt(p.unidades || 0));
  }, 0);
}

/**
 * Calcula las toneladas de empaques plásticos por categoría
 */
async function calcularToneladasPlasticos(idInformacionF, connection) {
  const [productos] = await connection.query(
    'SELECT liquidos, otros, construccion, pet, unidades FROM empaques_plasticos WHERE idInformacionF = ?',
    [idInformacionF]
  );
  
  let toneladasLiquidos = 0;
  let toneladasOtros = 0;
  let toneladasConstruccion = 0;
  
  productos.forEach(p => {
    const pesoUnitarioPET = parseFloat(p.pet || 0) / 1000000; // gramos a toneladas
    const unidades = parseInt(p.unidades || 0);
    
    const liquidos = JSON.parse(p.liquidos || '{}');
    const otros = JSON.parse(p.otros || '{}');
    const construccion = JSON.parse(p.construccion || '{}');
    
    // Sumar pesos de materiales líquidos
    if (Object.keys(liquidos).length > 0) {
      const pesoLiquidos = Object.values(liquidos).reduce((s, v) => s + parseFloat(v || 0), 0) / 1000000;
      toneladasLiquidos += pesoLiquidos * unidades;
    }
    
    // Sumar pesos de otros productos
    if (Object.keys(otros).length > 0) {
      const pesoOtros = Object.values(otros).reduce((s, v) => s + parseFloat(v || 0), 0) / 1000000;
      toneladasOtros += pesoOtros * unidades;
    }
    
    // Sumar pesos de construcción
    if (Object.keys(construccion).length > 0) {
      const pesoConstruccion = Object.values(construccion).reduce((s, v) => s + parseFloat(v || 0), 0) / 1000000;
      toneladasConstruccion += pesoConstruccion * unidades;
    }
    
    // PET se suma a líquidos por defecto
    toneladasLiquidos += pesoUnitarioPET * unidades;
  });
  
  return {
    liquidos: toneladasLiquidos,
    otros: toneladasOtros,
    construccion: toneladasConstruccion,
    total: toneladasLiquidos + toneladasOtros + toneladasConstruccion
  };
}

/**
 * Genera un detalle consolidado de todos los materiales en formato JSON
 */
async function generarDetalleMateriales(idInformacionF, connection) {
  const detalle = {
    primarios: [],
    secundarios: [],
    plasticos: []
  };
  
  // Empaques primarios
  const [primarios] = await connection.query(
    'SELECT empresa, nombre_producto, papel, metal_ferrosos, metal_no_ferrososs, carton, vidrio, unidades FROM empaques_primarios WHERE idInformacionF = ?',
    [idInformacionF]
  );
  detalle.primarios = primarios;
  
  // Empaques secundarios
  const [secundarios] = await connection.query(
    'SELECT empresa, nombre_producto, papel, metal_ferrosos, metal_no_ferrososs, carton, vidrio, unidades FROM empaques_secundarios WHERE idInformacionF = ?',
    [idInformacionF]
  );
  detalle.secundarios = secundarios;
  
  // Empaques plásticos
  const [plasticos] = await connection.query(
    'SELECT empresa, nombre_producto, pet, liquidos, otros, construccion, unidades FROM empaques_plasticos WHERE idInformacionF = ?',
    [idInformacionF]
  );
  detalle.plasticos = plasticos;
  
  return JSON.stringify(detalle);
}

module.exports = {
  calcularToneladasPrimarios,
  calcularToneladasSecundarios,
  calcularToneladasPlasticos,
  generarDetalleMateriales
};

Importante: Asegúrate de que estas funciones manejen valores NULL o undefined correctamente con || 0 para evitar NaN.
```

---

## 🔧 PROMPT 3: Función para Copiar a Historial

```
Necesito crear una función que copie un registro completo de informacionF a histInformacionF con todos los cálculos. Esta función se llamará automáticamente cuando el estado cambie a "Finalizado" y también manualmente para migrar registros existentes.

Crea una función en el controlador de informacionF llamada `copiarAHistorial`:

const { 
  calcularToneladasPrimarios, 
  calcularToneladasSecundarios, 
  calcularToneladasPlasticos,
  generarDetalleMateriales 
} = require('../helpers/informacionF.helper'); // Ajusta la ruta según tu estructura

/**
 * Copia un registro de informacionF a histInformacionF
 * @param {Number} idInformacionF - ID del formulario a copiar
 * @param {Object} connection - Conexión a la BD (opcional, usa pool si no se provee)
 * @returns {Object} Resultado de la operación
 */
async function copiarAHistorial(idInformacionF, connection = null) {
  const conn = connection || await pool.getConnection();
  
  try {
    if (!connection) await conn.beginTransaction();
    
    // 1. Obtener datos de informacionF
    const [infoRows] = await conn.query(
      'SELECT * FROM informacionF WHERE idInformacionF = ?',
      [idInformacionF]
    );
    
    if (infoRows.length === 0) {
      throw new Error(`No se encontró el formulario con ID ${idInformacionF}`);
    }
    
    const info = infoRows[0];
    
    // 2. Verificar que el estado sea "Finalizado" y tenga urlDoc
    if (info.estado !== 'Finalizado') {
      throw new Error(`El formulario debe estar en estado "Finalizado". Estado actual: ${info.estado}`);
    }
    
    // 🔴 CRÍTICO: Verificar que existe urlDoc (carta firmada)
    if (!info.urlDoc) {
      console.warn(`⚠️ El formulario ${idInformacionF} no tiene urlDoc (carta firmada). Se copiará sin documento.`);
    }
    
    // 3. Verificar si ya existe en el historial
    const [histExiste] = await conn.query(
      'SELECT id FROM histInformacionF WHERE idUsuario = ? AND ano_reportado = ? AND nit = ?',
      [info.idUsuario, info.ano_reportado, info.nit]
    );
    
    if (histExiste.length > 0) {
      console.log(`Ya existe un registro histórico para este vinculado y año: ${info.nit} - ${info.ano_reportado}`);
      return { success: true, message: 'Ya existe en el historial', duplicado: true };
    }
    
    // 4. Calcular toneladas por tipo
    const toneladasPrimarios = await calcularToneladasPrimarios(idInformacionF, conn);
    const toneladasSecundarios = await calcularToneladasSecundarios(idInformacionF, conn);
    const toneladasPlasticosObj = await calcularToneladasPlasticos(idInformacionF, conn);
    
    // 5. Verificar existencia de datos en tablas secundarias
    const [countPrimarios] = await conn.query('SELECT COUNT(*) as total FROM empaques_primarios WHERE idInformacionF = ?', [idInformacionF]);
    const [countSecundarios] = await conn.query('SELECT COUNT(*) as total FROM empaques_secundarios WHERE idInformacionF = ?', [idInformacionF]);
    const [countPlasticos] = await conn.query('SELECT COUNT(*) as total FROM empaques_plasticos WHERE idInformacionF = ?', [idInformacionF]);
    const [countRetornables] = await conn.query('SELECT COUNT(*) as total FROM envases_retornables WHERE idInformacionF = ?', [idInformacionF]);
    const [countDistribucion] = await conn.query('SELECT COUNT(*) as total FROM distribucion_geografica WHERE idInformacionF = ?', [idInformacionF]);
    
    // 6. Obtener datos de distribución geográfica
    const [distribucionRows] = await conn.query('SELECT * FROM distribucion_geografica WHERE idInformacionF = ?', [idInformacionF]);
    const distribucion = distribucionRows[0] || {};
    
    // 7. Generar detalle de materiales
    const detalleMateriales = await generarDetalleMateriales(idInformacionF, conn);
    
    // 8. Insertar en histInformacionF
    const insertQuery = `
      INSERT INTO histInformacionF (
        idInformacionF, urlDoc,
        nombre, nit, direccion, ciudad, pais, correo_facturacion, persona_contacto, 
        telefono, celular, cargo, correo_electronico, fecha_diligenciamiento, 
        ano_reportado, empresas, tipo_reporte, idUsuario, estado, fechaAsociacion, 
        toneladas_reportadas, toneladas_plasticos, toneladas_total, 
        representante_legal, telefono_representante, tarifa,
        toneladas_primarios, toneladas_secundarios, 
        toneladas_plasticos_liquidos, toneladas_plasticos_otros, toneladas_plasticos_construccion,
        detalle_materiales,
        tiene_empaques_primarios, tiene_empaques_secundarios, tiene_empaques_plasticos, 
        tiene_envases_retornables, tiene_distribucion,
        cantidad_productos_primarios, cantidad_productos_secundarios, cantidad_productos_plasticos,
        departamentos, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [resultHistInformacion] = await conn.query(insertQuery, [
      idInformacionF,
      info.urlDoc || null,
      info.nombre,
      info.nit,
      info.direccion,
      info.ciudad,
      info.pais || null,
      info.correo_facturacion,
      info.persona_contacto,
      info.telefono,
      info.celular,
      info.cargo,
      info.correo_electronico,
      info.fecha_diligenciamiento,
      info.ano_reportado,
      info.empresas,
      info.tipo_reporte,
      info.idUsuario,
      info.estado,
      info.fechaAsociacion,
      info.toneladas_reportadas || '0',
      info.toneladas_plasticos || 0,
      info.toneladas_total || 0,
      info.representante_legal || null,
      info.telefono_representante || null,
      info.tarifa || null,
      toneladasPrimarios,
      toneladasSecundarios,
      toneladasPlasticosObj.liquidos,
      toneladasPlasticosObj.otros,
      toneladasPlasticosObj.construccion,
      detalleMateriales,
      countPrimarios[0].total > 0 ? 1 : 0,
      countSecundarios[0].total > 0 ? 1 : 0,
      countPlasticos[0].total > 0 ? 1 : 0,
      countRetornables[0].total > 0 ? 1 : 0,
      countDistribucion[0].total > 0 ? 1 : 0,
      countPrimarios[0].total || 0,
      countSecundarios[0].total || 0,
      countPlasticos[0].total || 0,
      distribucion.departamentos || null,
      distribucion.pregunta1 || null,
      distribucion.pregunta2 || null,
      distribucion.pregunta3 || null,
      distribucion.pregunta4 || null,
      distribucion.pregunta5 || null,
      distribucion.observaciones || null
    ]);
    
    console.log(`📝 Registro principal copiado a histInformacionF con ID: ${resultHistInformacion.insertId}`);
    
    // 9. Copiar empaques primarios a histEmpaquePrimario
    if (countPrimarios[0].total > 0) {
      const [primarios] = await conn.query(
        'SELECT * FROM empaques_primarios WHERE idInformacionF = ?',
        [idInformacionF]
      );
      
      for (const primario of primarios) {
        await conn.query(
          `INSERT INTO histEmpaquePrimario 
           (idInformacionF, idOriginal, empresa, nombre_producto, papel, metal_ferrosos, metal_no_ferrososs, carton, vidrio, unidades)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idInformacionF,
            primario.id,
            primario.empresa,
            primario.nombre_producto,
            primario.papel,
            primario.metal_ferrosos,
            primario.metal_no_ferrososs,
            primario.carton,
            primario.vidrio,
            primario.unidades
          ]
        );
      }
      console.log(`✅ ${primarios.length} empaques primarios copiados a historial`);
    }
    
    // 10. Copiar empaques secundarios a histEmpaqueSecundario
    if (countSecundarios[0].total > 0) {
      const [secundarios] = await conn.query(
        'SELECT * FROM empaques_secundarios WHERE idInformacionF = ?',
        [idInformacionF]
      );
      
      for (const secundario of secundarios) {
        await conn.query(
          `INSERT INTO histEmpaqueSecundario 
           (idInformacionF, idOriginal, empresa, nombre_producto, papel, metal_ferrosos, metal_no_ferrososs, carton, vidrio, unidades)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idInformacionF,
            secundario.id,
            secundario.empresa,
            secundario.nombre_producto,
            secundario.papel,
            secundario.metal_ferrosos,
            secundario.metal_no_ferrososs,
            secundario.carton,
            secundario.vidrio,
            secundario.unidades
          ]
        );
      }
      console.log(`✅ ${secundarios.length} empaques secundarios copiados a historial`);
    }
    
    // 11. Copiar empaques plásticos a histEmpaquePlastico
    if (countPlasticos[0].total > 0) {
      const [plasticos] = await conn.query(
        'SELECT * FROM empaques_plasticos WHERE idInformacionF = ?',
        [idInformacionF]
      );
      
      for (const plastico of plasticos) {
        await conn.query(
          `INSERT INTO histEmpaquePlastico 
           (idInformacionF, idOriginal, empresa, nombre_producto, pet, liquidos, otros, construccion, unidades)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idInformacionF,
            plastico.id,
            plastico.empresa,
            plastico.nombre_producto,
            plastico.pet,
            plastico.liquidos,
            plastico.otros,
            plastico.construccion,
            plastico.unidades
          ]
        );
      }
      console.log(`✅ ${plasticos.length} empaques plásticos copiados a historial`);
    }
    
    // 12. Copiar envases retornables a histEnvaseRetornable
    if (countRetornables[0].total > 0) {
      const [retornables] = await conn.query(
        'SELECT * FROM envases_retornables WHERE idInformacionF = ?',
        [idInformacionF]
      );
      
      for (const retornable of retornables) {
        await conn.query(
          `INSERT INTO histEnvaseRetornable 
           (idInformacionF, idOriginal, empresa, nombre_producto, descripcion, cantidad, peso_unitario, material)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idInformacionF,
            retornable.id,
            retornable.empresa,
            retornable.nombre_producto,
            retornable.descripcion,
            retornable.cantidad,
            retornable.peso_unitario,
            retornable.material
          ]
        );
      }
      console.log(`✅ ${retornables.length} envases retornables copiados a historial`);
    }
    
    // 13. Copiar distribución geográfica a histDistribucionGeografica
    if (countDistribucion[0].total > 0) {
      await conn.query(
        `INSERT INTO histDistribucionGeografica 
         (idInformacionF, idOriginal, departamentos, pregunta1, pregunta2, pregunta3, pregunta4, pregunta5, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          idInformacionF,
          distribucion.id || null,
          distribucion.departamentos,
          distribucion.pregunta1,
          distribucion.pregunta2,
          distribucion.pregunta3,
          distribucion.pregunta4,
          distribucion.pregunta5,
          distribucion.observaciones
        ]
      );
      console.log(`✅ Distribución geográfica copiada a historial`);
    }
    
    if (!connection) await conn.commit();
    
    console.log(`✅ Formulario ${idInformacionF} copiado al historial exitosamente`);
    return { success: true, message: 'Copiado al historial exitosamente' };
    
  } catch (error) {
    if (!connection) await conn.rollback();
    console.error('Error al copiar a historial:', error);
    throw error;
  } finally {
    if (!connection) conn.release();
  }
}

module.exports = {
  copiarAHistorial,
  // ... otros exports
};

Importante: Esta función debe ser transaccional y manejar errores adecuadamente.
```

---

## 🔧 PROMPT 4: Endpoint para Subir Carta Firmada (YA IMPLEMENTADO)

```
✅ ESTE ENDPOINT YA ESTÁ IMPLEMENTADO Y FUNCIONANDO CORRECTAMENTE

🔴 FLUJO ACTUAL:
El administrador NO cambia manualmente de "Aprobado" a "Finalizado".
El VINCULADO debe subir una carta firmada cuando el formulario está en estado "Aprobado".
Al subir la carta, el estado cambia automáticamente a "Finalizado" y se copia al historial.

El endpoint existente es: POST /api/informacion-f/cargaCartaUrl/:idInformacionF

⚠️ AJUSTE NECESARIO: Agregar la llamada a copiarAHistorial() después de guardar urlDoc.

Modifica el endpoint existente /api/informacion-f/cargaCartaUrl/:idInformacionF para agregar:

// POST /api/informacion-f/cargaCartaUrl/:idInformacionF
// El vinculado sube la carta firmada cuando el formulario está en estado "Aprobado"
// Al subir la carta, el estado cambia automáticamente a "Finalizado"
router.post('/subir-carta-firmada/:idInformacionF', upload.single('carta'), async (req, res) => {
  const { idInformacionF } = req.params;
  const connection = await pool.getConnection();
  
  try {
    // Validar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Debe subir un archivo PDF con la carta firmada' 
      });
    }
    
    await connection.beginTransaction();
    
    // 1. Verificar que el formulario existe y está en estado "Aprobado"
    const [info] = await connection.query(
      'SELECT estado, idUsuario FROM informacionF WHERE idInformacionF = ?',
      [idInformacionF]
    );
    
    if (info.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Formulario no encontrado' 
      });
    }
    
    if (info[0].estado !== 'Aprobado') {
      return res.status(400).json({ 
        success: false, 
        error: `El formulario debe estar en estado "Aprobado". Estado actual: ${info[0].estado}` 
      });
    }
    
    // 2. Validar que el usuario logueado es el dueño del formulario
    if (req.user.id !== info[0].idUsuario) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tiene permisos para subir carta a este formulario' 
      });
    }
    
    // 3. Guardar el archivo (ajusta según tu configuración de storage)
    // Ejemplo con almacenamiento local:
    const urlDoc = `/uploads/cartas/${req.file.filename}`; // O URL de S3, etc.
    
    // 4. Actualizar informacionF con la URL y cambiar estado a "Finalizado"
    await connection.query(
      'UPDATE informacionF SET urlDoc = ?, estado = ? WHERE idInformacionF = ?',
      [urlDoc, 'Finalizado', idInformacionF]
    );
    
    // 5. Copiar automáticamente al historial (AGREGAR ESTE BLOQUE)
    try {
      await copiarAHistorial(idInformacionF, connection);
      console.log(`✅ Carta subida y formulario ${idInformacionF} copiado al historial`);
    } catch (histError) {
      console.error('⚠️ Error al copiar al historial:', histError);
      // No revertir el cambio de estado, se puede copiar manualmente después
    }
    
    await connection.commit();
    
    res.json({ 
      success: true,
      message: 'Carta firmada subida correctamente. El formulario ha sido finalizado.',
      urlDoc,
      estado: 'Finalizado'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error al subir carta firmada:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

⚠️ NOTA: La configuración de multer ya existe en tu backend.
Solo necesitas agregar la llamada a copiarAHistorial() después de guardar la URL.

Importante: 
1. El endpoint existente /cargaCartaUrl/:idInformacionF ya maneja la subida de archivo
2. Solo necesitas agregar la llamada a copiarAHistorial() después de actualizar urlDoc
3. La función debe ejecutarse DENTRO de la misma transacción
4. Si falla la copia al historial, loguear el error pero NO revertir la transacción
5. El vinculado debe poder ver que su carta se subió exitosamente aunque falle el historial
```

---

## 🔧 PROMPT 5: Modificar updateEstado (YA NO SE USA PARA FINALIZAR)

```
⚠️ CAMBIO IMPORTANTE: 
El endpoint updateEstado ya NO debe usarse para cambiar de "Aprobado" a "Finalizado".
Ese cambio ahora es automático cuando el vinculado sube la carta firmada.

Sin embargo, el updateEstado aún se usa para otros cambios de estado:
- Guardado → Pendiente (vinculado envía a validación)
- Pendiente → Aprobado (validador aprueba)
- Pendiente → Rechazado (validador rechaza)
- Rechazado → Pendiente (vinculado reenvía después de corregir)

Modifica la función updateEstado para agregar una validación:

async function updateEstado(req, res) {
  const { idInformacionF } = req.params;
  const { estado } = req.body;
  
  // 🔴 VALIDACIÓN CRÍTICA: No permitir cambio manual a "Finalizado"
  if (estado === 'Finalizado') {
    return res.status(400).json({ 
      success: false,
      error: 'No se puede cambiar manualmente a estado "Finalizado". El vinculado debe subir la carta firmada.'
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Actualizar el estado
    await connection.query(
      'UPDATE informacionF SET estado = ? WHERE idInformacionF = ?',
      [estado, idInformacionF]
    );
    
    await connection.commit();
    
    res.json({ 
      success: true,
      message: 'Estado actualizado correctamente',
      estado
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    connection.release();
  }
}

Importante: 
- Ya NO hay auto-copia en updateEstado
- La copia al historial SOLO ocurre en el endpoint de subir carta
- Se bloquea el cambio manual a "Finalizado"
```

---

## 🔧 PROMPT 6: Endpoint para Migración Manual

```
Necesito crear un endpoint para ejecutar manualmente la migración de registros finalizados al historial. Este endpoint será útil para:
1. Migrar todos los registros finalizados existentes (antes de implementar la copia automática)
2. Corregir registros que no se copiaron por algún error

Crea estos dos endpoints en el router de informacionF:

// POST /api/informacion-f/migrar-historial
// Migra UN registro específico al historial
router.post('/migrar-historial/:idInformacionF', async (req, res) => {
  const { idInformacionF } = req.params;
  
  try {
    const resultado = await copiarAHistorial(parseInt(idInformacionF));
    res.json(resultado);
  } catch (error) {
    console.error('Error en migración manual:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/informacion-f/migrar-historial-masivo
// Migra TODOS los registros finalizados al historial
router.post('/migrar-historial-masivo', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    // Obtener todos los registros finalizados
    const [finalizados] = await connection.query(
      'SELECT idInformacionF FROM informacionF WHERE estado = ?',
      ['Finalizado']
    );
    
    console.log(`📊 Encontrados ${finalizados.length} registros finalizados para migrar`);
    
    const resultados = {
      total: finalizados.length,
      exitosos: 0,
      fallidos: 0,
      duplicados: 0,
      errores: []
    };
    
    for (const registro of finalizados) {
      try {
        const resultado = await copiarAHistorial(registro.idInformacionF, connection);
        
        if (resultado.duplicado) {
          resultados.duplicados++;
        } else {
          resultados.exitosos++;
        }
        
        console.log(`✅ ${registro.idInformacionF}: ${resultado.message}`);
        
      } catch (error) {
        resultados.fallidos++;
        resultados.errores.push({
          idInformacionF: registro.idInformacionF,
          error: error.message
        });
        console.error(`❌ Error en ${registro.idInformacionF}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Migración masiva completada',
      resultados
    });
    
  } catch (error) {
    console.error('Error en migración masiva:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

Importante: El endpoint masivo debe tener protección de autorización (solo admin).
```

---

## 🔧 PROMPT 7: Endpoint para Listar Vinculados con Formularios

```
Necesito crear un endpoint que liste todos los vinculados que tienen formularios en informacionF, ordenados por estado (Finalizados primero) para la interfaz de limpieza.

Crea este endpoint en el router de informacionF:

// GET /api/informacion-f/vinculados-con-formularios
// Lista todos los vinculados que tienen formularios, con información del estado
router.get('/vinculados-con-formularios', async (req, res) => {
  try {
    const query = `
      SELECT 
        i.idInformacionF,
        i.idUsuario,
        i.nombre,
        i.nit,
        i.ano_reportado as anioReportado,
        i.estado,
        i.fecha_diligenciamiento as fechaDiligenciamiento,
        i.toneladas_total as toneladasTotal,
        u.email,
        u.celular,
        CASE 
          WHEN i.estado = 'Finalizado' THEN 1
          WHEN i.estado = 'Aprobado' THEN 2
          WHEN i.estado = 'Rechazado' THEN 3
          WHEN i.estado = 'Pendiente' THEN 4
          WHEN i.estado = 'Guardado' THEN 5
          ELSE 6
        END as orden_estado
      FROM informacionF i
      INNER JOIN users u ON i.idUsuario = u.id
      WHERE u.perfil = 'Vinculado'
      ORDER BY orden_estado ASC, i.ano_reportado DESC, i.nombre ASC
    `;
    
    const [vinculados] = await pool.query(query);
    
    res.json({
      success: true,
      data: vinculados,
      total: vinculados.length
    });
    
  } catch (error) {
    console.error('Error al obtener vinculados con formularios:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

Importante: Este endpoint debe devolver SOLO vinculados, ordenados por estado como especificaste.
```

---

## 🔧 PROMPT 8: Endpoint para Limpiar Formularios (con Respaldo)

```
Necesito crear un endpoint que LIMPIE (elimine) formularios finalizados de las tablas operativas.
Antes de eliminar, el sistema debe verificar que los datos estén respaldados en las tablas históricas.

Crea este endpoint en el router de informacionF:

// POST /api/informacion-f/limpiar-formularios
// Limpia formularios finalizados después de verificar que estén en el historial
router.post('/limpiar-formularios', async (req, res) => {
  const { idsInformacionF } = req.body; // Array de IDs a limpiar
  
  if (!Array.isArray(idsInformacionF) || idsInformacionF.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Debe proporcionar un array de IDs' 
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const resultados = {
      total: idsInformacionF.length,
      eliminados: 0,
      errores: [],
      noFinalizados: [],
      sinRespaldo: []
    };
    
    for (const idInformacionF of idsInformacionF) {
      try {
        // 1. Verificar que esté en estado "Finalizado"
        const [info] = await connection.query(
          'SELECT estado, nit, nombre FROM informacionF WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        if (info.length === 0) {
          resultados.errores.push({ 
            id: idInformacionF, 
            error: 'No encontrado' 
          });
          continue;
        }
        
        if (info[0].estado !== 'Finalizado') {
          resultados.noFinalizados.push({ 
            id: idInformacionF, 
            empresa: info[0].nombre,
            estado: info[0].estado 
          });
          continue;
        }
        
        // 2. Verificar que exista en histInformacionF
        const [histExiste] = await connection.query(
          'SELECT id FROM histInformacionF WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        if (histExiste.length === 0) {
          resultados.sinRespaldo.push({ 
            id: idInformacionF, 
            empresa: info[0].nombre 
          });
          continue;
        }
        
        const idHistInformacionF = histExiste[0].id;
        
        // 3. Verificar que los detalles estén respaldados
        const [countPrimarios] = await connection.query(
          'SELECT COUNT(*) as total FROM empaques_primarios WHERE idInformacionF = ?',
          [idInformacionF]
        );
        const [countHistPrimarios] = await connection.query(
          'SELECT COUNT(*) as total FROM histEmpaquePrimario WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        const [countSecundarios] = await connection.query(
          'SELECT COUNT(*) as total FROM empaques_secundarios WHERE idInformacionF = ?',
          [idInformacionF]
        );
        const [countHistSecundarios] = await connection.query(
          'SELECT COUNT(*) as total FROM histEmpaqueSecundario WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        const [countPlasticos] = await connection.query(
          'SELECT COUNT(*) as total FROM empaques_plasticos WHERE idInformacionF = ?',
          [idInformacionF]
        );
        const [countHistPlasticos] = await connection.query(
          'SELECT COUNT(*) as total FROM histEmpaquePlastico WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        // Validar que las cantidades coincidan
        if (countPrimarios[0].total !== countHistPrimarios[0].total ||
            countSecundarios[0].total !== countHistSecundarios[0].total ||
            countPlasticos[0].total !== countHistPlasticos[0].total) {
          resultados.sinRespaldo.push({ 
            id: idInformacionF, 
            empresa: info[0].nombre,
            detalle: 'Cantidades no coinciden en tablas históricas'
          });
          continue;
        }
        
        // 4. ELIMINAR de tablas operativas (en orden inverso por FKs)
        await connection.query(
          'DELETE FROM distribucion_geografica WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        await connection.query(
          'DELETE FROM envases_retornables WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        await connection.query(
          'DELETE FROM empaques_plasticos WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        await connection.query(
          'DELETE FROM empaques_secundarios WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        await connection.query(
          'DELETE FROM empaques_primarios WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        await connection.query(
          'DELETE FROM informacionF WHERE idInformacionF = ?',
          [idInformacionF]
        );
        
        resultados.eliminados++;
        console.log(`🗑️ Formulario ${idInformacionF} (${info[0].nombre}) limpiado exitosamente`);
        
      } catch (error) {
        console.error(`Error al limpiar formulario ${idInformacionF}:`, error);
        resultados.errores.push({ 
          id: idInformacionF, 
          error: error.message 
        });
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: `Limpieza completada: ${resultados.eliminados}/${resultados.total} formularios eliminados`,
      resultados
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error en limpieza de formularios:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

⚠️ IMPORTANTE:
1. Solo se pueden limpiar formularios en estado "Finalizado"
2. SIEMPRE verificar que exista respaldo completo en las tablas hist*
3. Validar que las cantidades de registros coincidan entre tablas operativas e históricas
4. Eliminar en orden correcto para respetar foreign keys
5. El endpoint debe protegerse con autorización (solo admin)
6. Registrar en log cada eliminación para auditoría

💡 FLUJO DE LIMPIEZA:
1. Vinculado sube carta firmada → Estado cambia a "Finalizado"
2. Sistema copia automáticamente a histInformacionF y tablas hist*
3. Administrador revisa formularios finalizados
4. Administrador ejecuta limpieza desde la interfaz
5. Sistema verifica respaldo completo
6. Sistema elimina de tablas operativas
7. Vinculado puede crear nuevo formulario para el siguiente año
```

---

## 📝 RESUMEN DE ENDPOINTS NECESARIOS

1. ✅ **POST** `/api/informacion-f/subir-carta-firmada/:idInformacionF` - 🔴 NUEVO: Vinculado sube carta → Auto-finaliza
2. ✅ **POST** `/api/informacion-f/migrar-historial/:idInformacionF` - Migrar un registro específico
3. ✅ **POST** `/api/informacion-f/migrar-historial-masivo` - Migrar todos los finalizados
4. ✅ **GET** `/api/informacion-f/vinculados-con-formularios` - Listar vinculados con formularios
5. ✅ **DELETE** `/api/informacion-f/limpiar-formularios` - Eliminar formularios finalizados
6. ✅ Modificación en `updateEstado` - Bloquear cambio manual a "Finalizado"

---

## 🔒 CONSIDERACIONES DE SEGURIDAD

Todos los endpoints deben validar:
1. Usuario autenticado
2. Rol de Administrador (excepto GET vinculados-con-formularios que puede ser admin o validador)
3. IDs válidos y numéricos
4. Estados correctos antes de operar

Ejemplo de middleware de autorización:
```javascript
function requireAdmin(req, res, next) {
  if (req.user.perfil !== 'Administrador') {
    return res.status(403).json({ error: 'Acceso denegado. Requiere rol de Administrador.' });
  }
  next();
}

// Aplicar en las rutas:
router.post('/migrar-historial-masivo', requireAdmin, async (req, res) => { ... });
```

---

## ✅ TESTING

Después de implementar, probar en este orden:
1. Ejecutar ALTER TABLE (PROMPT 1)
2. Crear helpers (PROMPT 2)
3. Crear función copicarga de carta (PROMPT 4) - 🔴 NUEVO FLUJO
5. Modificar updateEstado para bloquear "Finalizado" (PROMPT 5)
6. Crear endpoint de migración manual (PROMPT 6)
7. Probar migración manual de UN registro: POST /api/informacion-f/migrar-historial/123
8. Probar migración masiva: POST /api/informacion-f/migrar-historial-masivo
9. Verificar en la BD que histInformacionF tiene los registros (incluyendo urlDoc)
10. Crear endpoint de listado (PROMPT 7)
11. Crear endpoint de limpieza (PROMPT 8)
12. Probar limpieza con IDs de prueba

🔴 TESTING CRÍTICO DEL NUEVO FLUJO:
1. Crear formulario de prueba → estado "Guardado"
2. Cambiar a "Pendiente" → OK
3. Cambiar a "Aprobado" → OK
4. POST /api/informacion-f/subir-carta-firmada/:id` → 🔴 NUEVO: Botón para vinculado cuando estado = "Aprobado"
- `GET /api/informacion-f/vinculados-con-formularios` → Para listar en la interfaz de limpieza
- `DELETE /api/informacion-f/limpiar-formularios` → Para eliminar los seleccionados
- `POST /api/informacion-f/migrar-historial-masivo` → Botón admin para migrar históricos actuales (una sola vez)

El frontend deberá:
1. Mostrar botón "Subir Carta Firmada" cuando estado = "Aprobado" (solo para vinculado dueño)
2. Mostrar una tabla con checkboxes habilitados SOLO para registros con estado "Finalizado"
3. Validar que la carta sea PDF antes de enviar
4. Mostrar progreso de carga de archivo

---

## 📞 CONTACTO CON FRONTEND

Una vez implementados estos endpoints, el frontend los consumirá así:
- `GET /api/informacion-f/vinculados-con-formularios` → Para listar en la interfaz de limpieza
- `DELETE /api/informacion-f/limpiar-formularios` → Para eliminar los seleccionados
- `POST /api/informacion-f/migrar-historial-masivo` → Botón admin para migrar históricos actuales (una sola vez)

El frontend deberá mostrar una tabla con checkboxes habilitados SOLO para registros con estado "Finalizado".
