import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../utils/config';
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';

// Necesario para accesibilidad con react-modal
if (typeof window !== 'undefined') {
  Modal.setAppElement("#__next");
}

export default function FormularioAfiliado({ color, idUsuario: propIdUsuario, estado: propEstado, readonly = false, idInformacionB: propIdInformacionB }) {
  // Usar propIdInformacionB si está disponible (modo readonly), 
  // sino usar el localStorage (modo normal)
  let idInformacionB = propIdInformacionB || localStorage.getItem("idInformacionB");
  let estado = propEstado || localStorage.getItem("estadoInformacionB");
  const [productos, setProductos] = useState([]); // Estado para los productos
  const [isOpen, setIsOpen] = useState(false); // Estado para el modal
  const [isLoading, setIsLoading] = useState(false); // Loader al guardar
  const [loadingMessage, setLoadingMessage] = useState("Cargando...");
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 }); // Progreso de lotes
  // Paginación
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Descarga un archivo .txt con el detalle de errores
  const descargarErroresTXT = (errores = [], nombreArchivoOriginal = "") => {
    try {
      const encabezado = [
        "Errores de carga - Productos Literal B",
        `Archivo: ${nombreArchivoOriginal || "(sin nombre)"}`,
        `Fecha: ${new Date().toLocaleString()}`,
        "",
      ];
      const lineas = errores.length > 0 ? errores.map((e) => `- ${e}`) : ["(Sin detalles adicionales)"];
      const contenido = [...encabezado, ...lineas].join("\r\n");
      const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = nombreArchivoOriginal ? nombreArchivoOriginal.replace(/\.[^/.]+$/, "") : "errores_carga";
      a.href = url;
      a.download = `${base}_errores.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("No se pudo descargar el archivo de errores:", e);
    }
  };
  
  // Determinar si los campos son editables basado en el estado y readonly
  const isEditable = !readonly && (estado === "Iniciado" || estado === "Guardado" || estado === "Rechazado" || !estado);

  // Obtener productos desde el backend al cargar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      if (!idInformacionB) return;
      
      setIsLoading(true);
      setLoadingMessage("Cargando productos...");
      
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-b/getProdValidarB/${idInformacionB}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron productos para este idInformacionB.");
            setIsLoading(false);
            return; // Si no hay productos, no hacemos nada
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        setLoadingMessage("Procesando datos...");
        const data = await response.json();
        console.log("Productos obtenidos:", data);
        setProductos(data); // Guardar los productos en el estado
        setCurrentPage(1);
        setLoadingMessage(`${data.length} productos cargados correctamente`);
      } catch (error) {
        console.error("Error al obtener los productos:", error);
        setLoadingMessage("Error al cargar productos");
      } finally {
        setIsLoading(false);
      }
    };

    if (idInformacionB) {
      fetchProductos();
    }
  }, [idInformacionB, propIdUsuario, propIdInformacionB]);

  // Mantener currentPage dentro de rango cuando cambian productos o pageSize
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((productos?.length || 0) / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [productos, pageSize]);

  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        id: productos.length + 1,
        idInformacionB,
        razonSocial: "",
        marca: "",
        nombreGenerico: "",
        numeroRegistros: "",
        codigoEstandarDatos: "",
        pesoEmpaqueComercialRX: 0,
        pesoTotalComercialRX: 0,
        pesoEmpaqueComercialOTC: 0,
        pesoTotalComercialOTC: 0,
        pesoEmpaqueInstitucional: 0,
        pesoTotalInstitucional: 0,
        pesoEmpaqueIntrahospitalario: 0,
        pesoTotalIntrahospitalario: 0,
        pesoEmpaqueMuestrasMedicas: 0,
        pesoTotalMuestrasMedicas: 0,
        fabricacion: "",
        totalPesoEmpaques: 0,
        totalPesoProducto: 0,
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
  
    // Actualizar el campo modificado
    nuevosProductos[index][field] = value;
  
    // Calcular `totalPesoEmpaques`
    const pesoEmpaqueComercialRX = parseFloat(nuevosProductos[index].pesoEmpaqueComercialRX) || 0;
    const pesoEmpaqueComercialOTC = parseFloat(nuevosProductos[index].pesoEmpaqueComercialOTC) || 0;
    const pesoEmpaqueInstitucional = parseFloat(nuevosProductos[index].pesoEmpaqueInstitucional) || 0;
    const pesoEmpaqueIntrahospitalario = parseFloat(nuevosProductos[index].pesoEmpaqueIntrahospitalario) || 0;
    const pesoEmpaqueMuestrasMedicas = parseFloat(nuevosProductos[index].pesoEmpaqueMuestrasMedicas) || 0;
  
    nuevosProductos[index].totalPesoEmpaques =
      pesoEmpaqueComercialRX +
      pesoEmpaqueComercialOTC +
      pesoEmpaqueInstitucional +
      pesoEmpaqueIntrahospitalario +
      pesoEmpaqueMuestrasMedicas;
  
    // Calcular `totalPesoProducto`
    const pesoTotalComercialRX = parseFloat(nuevosProductos[index].pesoTotalComercialRX) || 0;
    const pesoTotalComercialOTC = parseFloat(nuevosProductos[index].pesoTotalComercialOTC) || 0;
    const pesoTotalInstitucional = parseFloat(nuevosProductos[index].pesoTotalInstitucional) || 0;
    const pesoTotalIntrahospitalario = parseFloat(nuevosProductos[index].pesoTotalIntrahospitalario) || 0;
    const pesoTotalMuestrasMedicas = parseFloat(nuevosProductos[index].pesoTotalMuestrasMedicas) || 0;
  
    nuevosProductos[index].totalPesoProducto =
      pesoTotalComercialRX +
      pesoTotalComercialOTC +
      pesoTotalInstitucional +
      pesoTotalIntrahospitalario +
      pesoTotalMuestrasMedicas;
  
    // Actualizar el estado
    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validar campos obligatorios (sin activar loader todavía)
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      const numeroProducto = i + 1;

      if (!producto.razonSocial || producto.razonSocial.trim() === "") {
        alert(`Producto ${numeroProducto}: El campo "Razón Social" es obligatorio.`);
        return;
      }
      if (!producto.marca || producto.marca.trim() === "") {
        alert(`Producto ${numeroProducto}: El campo "Marca" es obligatorio.`);
        return;
      }
      if (!producto.nombreGenerico || producto.nombreGenerico.trim() === "") {
        alert(`Producto ${numeroProducto}: El campo "Nombre Genérico" es obligatorio.`);
        return;
      }
      if (!producto.numeroRegistros || String(producto.numeroRegistros).trim() === "") {
        alert(`Producto ${numeroProducto}: El campo "Número de Registros" es obligatorio.`);
        return;
      }
      if (!producto.codigoEstandarDatos || String(producto.codigoEstandarDatos).trim() === "") {
        alert(`Producto ${numeroProducto}: El campo "Código Estándar de Datos" es obligatorio.`);
        return;
      }
      // Validar selección de Fabricación
      {
        const fabRaw = (producto.fabricacion ?? "").toString().trim();
        if (!fabRaw) {
          alert(`Producto ${numeroProducto}: Debe diligenciar la "Fabricación" (Local o Importado).`);
          return;
        }
        const fabLower = fabRaw.toLowerCase();
        const fabNorm = fabLower === 'local' ? 'Local' : (fabLower === 'importado' ? 'Importado' : null);
        if (!fabNorm) {
          alert(`Producto ${numeroProducto}: "Fabricación" debe ser Local o Importado (se acepta sin importar mayúsculas/minúsculas).`);
          return;
        }
        // Normalizar en memoria para el envío
        productos[i].fabricacion = fabNorm;
      }
    }

    // 2. Validar campos numéricos: solo enteros >= 0. No se aceptan decimales (punto o coma)
    const camposNumericos = [
      "pesoEmpaqueComercialRX",
      "pesoTotalComercialRX",
      "pesoEmpaqueComercialOTC",
      "pesoTotalComercialOTC",
      "pesoEmpaqueInstitucional",
      "pesoTotalInstitucional",
      "pesoEmpaqueIntrahospitalario",
      "pesoTotalIntrahospitalario",
      "pesoEmpaqueMuestrasMedicas",
      "pesoTotalMuestrasMedicas"
    ];

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      const numeroProducto = i + 1;
      for (const campo of camposNumericos) {
        let raw = producto[campo];
        if (raw === undefined || raw === null || raw === "" || raw === "N/A") continue; // permitir vacío/N/A previo a validación global
        if (typeof raw === 'number') raw = raw.toString();
        const valor = String(raw).trim();

        // Rechazar comas o puntos (decimales)
        if (valor.includes(',') || valor.includes('.')) {
          alert(`Producto ${numeroProducto}: El campo "${campo}" no acepta valores decimales. Ingrese solo números enteros (>= 0). Valor ingresado: ${valor}`);
          return;
        }
        if (!/^\d+$/.test(valor)) {
          alert(`Producto ${numeroProducto}: El campo "${campo}" debe contener solo dígitos (0-9). Valor ingresado: ${valor}`);
          return;
        }
        const num = Number(valor);
        if (num < 0) {
          alert(`Producto ${numeroProducto}: El campo "${campo}" debe ser >= 0. Valor ingresado: ${valor}`);
          return;
        }
      }
    }

    // 3. Confirmación del usuario
    const isConfirmed = window.confirm("¿Estás seguro de que los datos ingresados son correctos?");
    if (!isConfirmed) return;

    // 4. Activar loader SOLO después de pasar validaciones
    setIsLoading(true);

    // 5. Preparar payload y enviar
    try {
      const payload = productos.map((p) => {
        const fabLower = (p.fabricacion ?? '').toString().trim().toLowerCase();
        const fabricacionNorm = fabLower === 'local' ? 'Local' : (fabLower === 'importado' ? 'Importado' : '');
        return ({
        idInformacionB,
        razonSocial: p.razonSocial,
        marca: p.marca,
        nombreGenerico: p.nombreGenerico,
        numeroRegistros: p.numeroRegistros,
        codigoEstandarDatos: p.codigoEstandarDatos,
        pesoEmpaqueComercialRX: p.pesoEmpaqueComercialRX,
        pesoTotalComercialRX: p.pesoTotalComercialRX,
        pesoEmpaqueComercialOTC: p.pesoEmpaqueComercialOTC,
        pesoTotalComercialOTC: p.pesoTotalComercialOTC,
        pesoEmpaqueInstitucional: p.pesoEmpaqueInstitucional,
        pesoTotalInstitucional: p.pesoTotalInstitucional,
        pesoEmpaqueIntrahospitalario: p.pesoEmpaqueIntrahospitalario,
        pesoTotalIntrahospitalario: p.pesoTotalIntrahospitalario,
        pesoEmpaqueMuestrasMedicas: p.pesoEmpaqueMuestrasMedicas,
        pesoTotalMuestrasMedicas: p.pesoTotalMuestrasMedicas,
        fabricacion: fabricacionNorm,
        totalPesoEmpaques: p.totalPesoEmpaques,
        totalPesoProducto: p.totalPesoProducto,
      });
      });

      // --- Chunking dinámico adaptado al límite de paquete del servidor ---
      const resolveServerPacketLimit = () => {
        const stored = parseInt(localStorage.getItem('serverMaxPacketBytes'), 10);
        if (!isNaN(stored) && stored > 0) {
          console.info('[ProductosB] Usando serverMaxPacketBytes de localStorage =', stored);
          return stored;
        }
        console.warn('[ProductosB] Usando límite por defecto 536870912 bytes (512MB). Si cambió max_allowed_packet ejecute localStorage.setItem("serverMaxPacketBytes", "NUEVO_VALOR") para usar valor personalizado.');
        return 536870912;
      };
      const SERVER_MAX_PACKET_BYTES = resolveServerPacketLimit();
      const SAFE_TARGET = Math.floor(SERVER_MAX_PACKET_BYTES * 0.70);
      const TARGET_MAX_BYTES = Math.max(SAFE_TARGET, 1000);

      // Calcular promedio bytes/fila
      const SAMPLE_COUNT = Math.min(20, payload.length);
      let avgBytesPerRow = 0;
      if (SAMPLE_COUNT > 0) {
        let total = 0;
        for (let i = 0; i < SAMPLE_COUNT; i++) {
          total += new TextEncoder().encode(JSON.stringify(payload[i])).length;
        }
        avgBytesPerRow = total / SAMPLE_COUNT;
      }
      let rowsPerChunk = 50; // Reducido de 120 para lotes más pequeños
      if (avgBytesPerRow > 0) {
        rowsPerChunk = Math.floor(TARGET_MAX_BYTES / avgBytesPerRow);
        if (SERVER_MAX_PACKET_BYTES <= 4096) {
          rowsPerChunk = Math.max(1, Math.min(50, rowsPerChunk));
        } else {
          rowsPerChunk = Math.max(50, Math.min(150, rowsPerChunk)); // Reducido de 500 a 150 para evitar error 413
        }
      }
      if (avgBytesPerRow > SAFE_TARGET) {
        console.warn('[ProductosB] Una fila (' + avgBytesPerRow + ' bytes) excede SAFE_TARGET=' + SAFE_TARGET + ' -> forzando 1 por chunk');
        rowsPerChunk = 1;
      }
      // Chunks preliminares
      const prelim = [];
      for (let i = 0; i < payload.length; i += rowsPerChunk) {
        prelim.push(payload.slice(i, i + rowsPerChunk));
      }
      // Refinar por tamaño
      const refined = [];
      for (const ch of prelim) {
        const size = new TextEncoder().encode(JSON.stringify(ch)).length;
        if (size <= TARGET_MAX_BYTES) {
          refined.push(ch);
        } else {
          let start = 0;
          let estimate = Math.max(1, Math.floor(ch.length * (TARGET_MAX_BYTES / size)));
          while (start < ch.length) {
            let subSize = Math.min(estimate, ch.length - start);
            while (subSize > 0) {
              const tentative = ch.slice(start, start + subSize);
              const tBytes = new TextEncoder().encode(JSON.stringify(tentative)).length;
              if (tBytes <= TARGET_MAX_BYTES || tentative.length === 1) {
                refined.push(tentative);
                start += tentative.length;
                break;
              }
              subSize = Math.floor(subSize / 2);
            }
            if (subSize === 0) { // fallback
              refined.push([ch[start]]);
              start += 1;
            }
          }
        }
      }
      const chunks = refined;
      console.log('[ProductosB] avgBytesPerRow=', avgBytesPerRow.toFixed(2), 'rowsPerChunk=', rowsPerChunk, 'prelim=', prelim.length, 'final=', chunks.length, 'TARGET_MAX_BYTES=', TARGET_MAX_BYTES, 'SERVER_MAX_PACKET_BYTES=', SERVER_MAX_PACKET_BYTES);
      chunks.forEach((c,i)=>{
        const b = new TextEncoder().encode(JSON.stringify(c)).length;
        console.log(`[ProductosB] Chunk ${i+1}/${chunks.length} bytes=${b}`);
      });
      const importId = `${idInformacionB || 'no-id'}-${Date.now()}`;
      const totalChunks = chunks.length;
      const concurrency = 2;
      setUploadProgress({ done: 0, total: totalChunks });

      const postBatch = async (batch, batchIndex, mode) => {
        const url = `${API_BASE_URL}/informacion-b/createProductos?importId=${encodeURIComponent(importId)}&batchIndex=${batchIndex}&batchCount=${totalChunks}&mode=${mode}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(batch),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Lote ${batchIndex + 1}/${totalChunks}: ${resp.status} ${errText}`);
        }
        setUploadProgress(p => ({ done: p.done + 1, total: p.total }));
      };

      // Subir secuencial el primer chunk (replace) y luego concurrente
      if (totalChunks > 0) {
        await postBatch(chunks[0], 0, 'replace');
      }
      let nextIndex = 1;
      const workers = Array.from({ length: Math.min(concurrency, totalChunks) }, async () => {
        while (true) {
          const current = nextIndex++;
          if (current >= totalChunks) break;
            await postBatch(chunks[current], current, 'append');
        }
      });
      await Promise.all(workers);

      alert(`Se guardaron ${payload.length} registros de Productos (Literal B) en ${totalChunks} lote(s).`);
      if (SERVER_MAX_PACKET_BYTES === 536870912 && payload.length > 10000) {
        console.info("[ProductosB] Rendimiento óptimo: Con max_allowed_packet=512MB puede procesar lotes grandes eficientemente.");
      }
    } catch (error) {
      console.error('Error al enviar los productos:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  };

  // Función para descargar plantilla Excel
  const descargarPlantilla = () => {
    // Crear múltiples filas de ejemplo para mostrar cómo se maneja múltiples productos
    const plantillaData = [
      {
        "Razón Social": "Ejemplo Empresa S.A.S",
        "Marca": "Marca Ejemplo 1",
        "Nombre Genérico": "Acetaminofén",
        "Número de Registros": "INVIMA-123456",
        "Código Estándar de Datos": "7891234567890",
        "Peso Empaque Comercial RX (kg)": 1,
        "Peso Total Comercial RX (kg)": 25,
        "Peso Empaque Comercial OTC (kg)": 1,
        "Peso Total Comercial OTC (kg)": 15,
        "Peso Empaque Institucional (kg)": 1,
        "Peso Total Institucional (kg)": 40,
        "Peso Empaque Intrahospitalario (kg)": 1,
        "Peso Total Intrahospitalario (kg)": 10,
        "Peso Empaque Muestras Médicas (kg)": 1,
        "Peso Total Muestras Médicas (kg)": 5,
        "Fabricación": "Local"
      },
      {
        "Razón Social": "Ejemplo Empresa S.A.S",
        "Marca": "Marca Ejemplo 2",
        "Nombre Genérico": "Ibuprofeno",
        "Número de Registros": "INVIMA-789123",
        "Código Estándar de Datos": "7891234567891",
        "Peso Empaque Comercial RX (kg)": 1,
        "Peso Total Comercial RX (kg)": 20,
        "Peso Empaque Comercial OTC (kg)": 1,
        "Peso Total Comercial OTC (kg)": 12,
        "Peso Empaque Institucional (kg)": 1,
        "Peso Total Institucional (kg)": 30,
        "Peso Empaque Intrahospitalario (kg)": 1,
        "Peso Total Intrahospitalario (kg)": 8,
        "Peso Empaque Muestras Médicas (kg)": 1,
        "Peso Total Muestras Médicas (kg)": 3,
        "Fabricación": "Importado"
      },
      {
        "Razón Social": "Ejemplo Empresa S.A.S",
        "Marca": "Marca Ejemplo 3",
        "Nombre Genérico": "Aspirina",
        "Número de Registros": "INVIMA-456789",
        "Código Estándar de Datos": "7891234567892",
        "Peso Empaque Comercial RX (kg)": 1,
        "Peso Total Comercial RX (kg)": 15,
        "Peso Empaque Comercial OTC (kg)": 1,
        "Peso Total Comercial OTC (kg)": 18,
        "Peso Empaque Institucional (kg)": 1,
        "Peso Total Institucional (kg)": 25,
        "Peso Empaque Intrahospitalario (kg)": 1,
        "Peso Total Intrahospitalario (kg)": 6,
        "Peso Empaque Muestras Médicas (kg)": 1,
        "Peso Total Muestras Médicas (kg)": 4,
        "Fabricación": "Local"
      }
    ];

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(plantillaData);

    // Configurar ancho de columnas (sin columnas de totales finales)
    ws['!cols'] = [
      { width: 25 }, // Razón Social
      { width: 20 }, // Marca
      { width: 25 }, // Nombre Genérico
      { width: 20 }, // Número de Registros
      { width: 20 }, // Código Estándar
      { width: 20 }, // Peso Empaque Comercial RX
      { width: 20 }, // Peso Total Comercial RX
      { width: 20 }, // Peso Empaque Comercial OTC
      { width: 20 }, // Peso Total Comercial OTC
      { width: 20 }, // Peso Empaque Institucional
      { width: 20 }, // Peso Total Institucional
      { width: 20 }, // Peso Empaque Intrahospitalario
      { width: 20 }, // Peso Total Intrahospitalario
      { width: 20 }, // Peso Empaque Muestras Médicas
      { width: 20 }, // Peso Total Muestras Médicas
      { width: 15 } // Fabricación
    ];

    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Descargar archivo
    XLSX.writeFile(wb, "Plantilla_ProductosB.xlsx");
  };

  // Función para cargar datos desde Excel
  const cargarDesdeExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage("Analizando archivo Excel...");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setLoadingMessage("Procesando datos del archivo...");
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validar y procesar datos
        setLoadingMessage(`Validando ${jsonData.length} registros...`);
        const productosValidados = [];
        const errores = [];

        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 porque empezamos en fila 2 (después del header)
          const erroresFila = [];

          // Mapear nombres de columnas (flexible para diferentes formatos)
          const razonSocial = row["Razón Social"] || row["razonSocial"] || "";
          const marca = row["Marca"] || row["marca"] || "";
          const nombreGenerico = row["Nombre Genérico"] || row["nombreGenerico"] || "";
          const numeroRegistros = row["Número de Registros"] || row["numeroRegistros"] || "";
          const codigoEstandar = row["Código Estándar de Datos"] || row["codigoEstandarDatos"] || "";
          let fabricacion = row["Fabricación"] || row["fabricacion"] || "";

          // Campos numéricos
          const pesoEmpaqueComercialRX = row["Peso Empaque Comercial RX (kg)"] || row["pesoEmpaqueComercialRX"] || 0;
          const pesoTotalComercialRX = row["Peso Total Comercial RX (kg)"] || row["pesoTotalComercialRX"] || 0;
          const pesoEmpaqueComercialOTC = row["Peso Empaque Comercial OTC (kg)"] || row["pesoEmpaqueComercialOTC"] || 0;
          const pesoTotalComercialOTC = row["Peso Total Comercial OTC (kg)"] || row["pesoTotalComercialOTC"] || 0;
          const pesoEmpaqueInstitucional = row["Peso Empaque Institucional (kg)"] || row["pesoEmpaqueInstitucional"] || 0;
          const pesoTotalInstitucional = row["Peso Total Institucional (kg)"] || row["pesoTotalInstitucional"] || 0;
          const pesoEmpaqueIntrahospitalario = row["Peso Empaque Intrahospitalario (kg)"] || row["pesoEmpaqueIntrahospitalario"] || 0;
          const pesoTotalIntrahospitalario = row["Peso Total Intrahospitalario (kg)"] || row["pesoTotalIntrahospitalario"] || 0;
          const pesoEmpaqueMuestrasMedicas = row["Peso Empaque Muestras Médicas (kg)"] || row["pesoEmpaqueMuestrasMedicas"] || 0;
          const pesoTotalMuestrasMedicas = row["Peso Total Muestras Médicas (kg)"] || row["pesoTotalMuestrasMedicas"] || 0;

          // Totales se ignorarán si vienen en el archivo (se recalculan siempre)

          // Validaciones de campos obligatorios
          if (!razonSocial || String(razonSocial).trim() === "") {
            erroresFila.push("Razón Social es requerida");
          }
          if (!marca || String(marca).trim() === "") {
            erroresFila.push("Marca es requerida");
          }
          if (!nombreGenerico || String(nombreGenerico).trim() === "") {
            erroresFila.push("Nombre Genérico es requerido");
          }
          if (!numeroRegistros || String(numeroRegistros).trim() === "") {
            erroresFila.push("Número de Registros es requerido");
          }
          if (!codigoEstandar || String(codigoEstandar).trim() === "") {
            erroresFila.push("Código Estándar de Datos es requerido");
          }

          // Validaciones de campos numéricos
          const camposNumericos = [
            { valor: pesoEmpaqueComercialRX, nombre: "Peso Empaque Comercial RX" },
            { valor: pesoTotalComercialRX, nombre: "Peso Total Comercial RX" },
            { valor: pesoEmpaqueComercialOTC, nombre: "Peso Empaque Comercial OTC" },
            { valor: pesoTotalComercialOTC, nombre: "Peso Total Comercial OTC" },
            { valor: pesoEmpaqueInstitucional, nombre: "Peso Empaque Institucional" },
            { valor: pesoTotalInstitucional, nombre: "Peso Total Institucional" },
            { valor: pesoEmpaqueIntrahospitalario, nombre: "Peso Empaque Intrahospitalario" },
            { valor: pesoTotalIntrahospitalario, nombre: "Peso Total Intrahospitalario" },
            { valor: pesoEmpaqueMuestrasMedicas, nombre: "Peso Empaque Muestras Médicas" },
            { valor: pesoTotalMuestrasMedicas, nombre: "Peso Total Muestras Médicas" }
          ];


          camposNumericos.forEach(campo => {
            const num = parseFloat(campo.valor);
            if (isNaN(num) || num < 0) {
              erroresFila.push(`${campo.nombre} debe ser un número mayor o igual a 0`);
            } else if (!Number.isInteger(num)) {
              erroresFila.push(`${campo.nombre} debe ser un número entero. Valor ingresado: ${campo.valor}`);
            }
          });

          // Verificar fabricación (obligatorio, case-insensitive) y normalizar a 'Local' | 'Importado'
          const fabRaw = (fabricacion ?? '').toString().trim();
          if (!fabRaw) {
            erroresFila.push("Fabricación es requerida (Local o Importado)");
          }
          const fabLower = fabRaw.toLowerCase();
          const fabNorm = fabLower === 'local' ? 'Local' : (fabLower === 'importado' ? 'Importado' : null);
          if (fabRaw && !fabNorm) {
            erroresFila.push(`Fabricación debe ser "Local" o "Importado"`);
          }
          fabricacion = fabNorm || fabricacion; // dejar normalizado si es válido

          if (erroresFila.length > 0) {
            errores.push(`Fila ${rowNumber}: ${erroresFila.join(", ")}`);
          } else {
            // Calcular totales siempre a partir de los campos base
            const totalPesoEmpaques = 
              parseFloat(pesoEmpaqueComercialRX) + parseFloat(pesoEmpaqueComercialOTC) + 
              parseFloat(pesoEmpaqueInstitucional) + parseFloat(pesoEmpaqueIntrahospitalario) + 
              parseFloat(pesoEmpaqueMuestrasMedicas);

            const totalPesoProducto = 
              parseFloat(pesoTotalComercialRX) + parseFloat(pesoTotalComercialOTC) + 
              parseFloat(pesoTotalInstitucional) + parseFloat(pesoTotalIntrahospitalario) + 
              parseFloat(pesoTotalMuestrasMedicas);

            productosValidados.push({
              id: productos.length + productosValidados.length + 1,
              idInformacionB,
              razonSocial: String(razonSocial).trim(),
              marca: String(marca).trim(),
              nombreGenerico: String(nombreGenerico).trim(),
              numeroRegistros: String(numeroRegistros).trim(),
              codigoEstandarDatos: String(codigoEstandar).trim(),
              pesoEmpaqueComercialRX: parseFloat(pesoEmpaqueComercialRX),
              pesoTotalComercialRX: parseFloat(pesoTotalComercialRX),
              pesoEmpaqueComercialOTC: parseFloat(pesoEmpaqueComercialOTC),
              pesoTotalComercialOTC: parseFloat(pesoTotalComercialOTC),
              pesoEmpaqueInstitucional: parseFloat(pesoEmpaqueInstitucional),
              pesoTotalInstitucional: parseFloat(pesoTotalInstitucional),
              pesoEmpaqueIntrahospitalario: parseFloat(pesoEmpaqueIntrahospitalario),
              pesoTotalIntrahospitalario: parseFloat(pesoTotalIntrahospitalario),
              pesoEmpaqueMuestrasMedicas: parseFloat(pesoEmpaqueMuestrasMedicas),
              pesoTotalMuestrasMedicas: parseFloat(pesoTotalMuestrasMedicas),
              fabricacion: fabricacion, // ya normalizado y obligatorio
              totalPesoEmpaques: totalPesoEmpaques,
              totalPesoProducto: totalPesoProducto
            });
          }
        });

        // Mostrar errores si los hay
        if (errores.length > 0) {
          descargarErroresTXT(errores, file?.name);
          alert(`Se encontraron ${errores.length} errores. Se descargó un archivo .txt con el detalle para su corrección.`);
          // Limpiar el input antes de salir para permitir recargar el mismo archivo
          if (e && e.target) e.target.value = "";
          setIsLoading(false);
          return;
        }

        if (productosValidados.length === 0) {
          descargarErroresTXT(["No se encontraron productos válidos en el archivo Excel."], file?.name);
          alert("No se encontraron productos válidos. Se descargó un archivo .txt con el detalle.");
          if (e && e.target) e.target.value = "";
          setIsLoading(false);
          return;
        }

        // Reemplazar siempre la tabla actual por el contenido del Excel (comportamiento solicitado)
        const mensaje = `Se encontraron ${productosValidados.length} productos válidos en el archivo.\n\nEsta acción REEMPLAZARÁ los ${productos.length} registro(s) actualmente visibles por los del archivo.\n\n¿Desea continuar?`;
        const confirmarReemplazo = window.confirm(mensaje);
        if (!confirmarReemplazo) {
          if (e && e.target) e.target.value = ""; // permitir recargar el mismo archivo
          setIsLoading(false);
          return;
        }

        setLoadingMessage("Cargando datos en la tabla...");
        // Normalizar IDs consecutivos desde 1
        const productosReemplazados = productosValidados.map((p, idx) => ({
          ...p,
          id: idx + 1,
        }));
        setProductos(productosReemplazados);
        setCurrentPage(1);
        
        setLoadingMessage(`${productosValidados.length} productos cargados correctamente`);
        setTimeout(() => {
          setIsLoading(false);
          alert(`Se reemplazó la tabla con ${productosValidados.length} productos del archivo.\n\nRecuerde presionar "Guardar" para persistir los cambios.`);
        }, 500);

      } catch (error) {
        descargarErroresTXT([
          `Error al procesar el archivo Excel: ${error.message}`,
          "Asegúrese de que el archivo tenga el formato correcto.",
        ], file?.name);
        alert("Ocurrió un error al procesar el archivo. Se descargó un archivo .txt con el detalle.");
        setIsLoading(false);
      }

      // Limpiar el input
      e.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  // este fracmento lo hizo Andres pero solo se usa para simular un archivo de carga.
  // useEffect(() => {
  //   setIsLoading(true);
  //   setUploadProgress({ done: 0, total: 100 });

  //   // Simular progreso
  //   let done = 0;
  //   const interval = setInterval(() => {
  //     done += 5;
  //     if (done > 100) {
  //       clearInterval(interval);
  //       setIsLoading(false);
  //     } else {
  //       setUploadProgress({ done, total: 100 });
  //     }
  //   }, 200);
  // }, []);

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* Loader Backdrop Overlay */}
      <Backdrop
        sx={{ color: '#2563eb', zIndex: (theme) => theme.zIndex.modal + 1000 }}
        open={isLoading}
      >
        <div className="flex flex-col items-center">
          <Oval
            height={60}
            width={60}
            color="#2563eb"
            secondaryColor="#60a5fa"
            strokeWidth={5}
            ariaLabel="oval-loading"
            visible={true}
          />

          {/* Texto del progreso */}
          {(() => {
            const percentage = uploadProgress.total > 0
              ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
              : 0;
            return (
              <>
                <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">
                  {uploadProgress.total > 0 ? `Guardando información... ${percentage}%` : loadingMessage}
                </span>

                {/* Barra de progreso - solo mostrar durante guardado */}
                {uploadProgress.total > 0 && (
                  <div className="w-64 h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </Backdrop>

      {/* SECCIÓN II */}
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Medicamentos&nbsp;
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="flex justify-between mt-3">
          {/* Botones solo visibles si no es readonly y en estados editables */}
          {!readonly && (estado === "Iniciado" || estado === "Guardado" || estado === "Rechazado" || !estado) && (
            <>
              <button 
                className={`px-4 py-2 rounded ${
                  isEditable 
                    ? "bg-lightBlue-600 hover:bg-lightBlue-700 text-white" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                onClick={agregarProducto}
                disabled={!isEditable}
              >
                Agregar Producto
              </button>
              
              <input 
                type="file" 
                id="excel-upload" 
                accept=".xlsx,.xls" 
                onChange={cargarDesdeExcel}
                style={{ display: 'none' }}
                disabled={!isEditable}
              />
              <label 
                htmlFor="excel-upload"
                className={`px-4 py-2 rounded cursor-pointer inline-block ${
                  isEditable 
                    ? "bg-lightBlue-600 hover:bg-lightBlue-700 text-white" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Cargar desde Excel
              </label>
              
              <button 
                className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
                onClick={descargarPlantilla}
              >
                Descargar Plantilla Excel
              </button>
            </>
          )}
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en Kilogramos
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los campos deben ser diligenciados en caso de no tener informacion colocar N/A
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Los campos numericos deben ser numeros enteros o aproximados.
        </div>
        <form onSubmit={handleSubmit}>
        {/* Controles de paginación: tamaño de página */}
        <div className="mt-3 flex items-center gap-3 px-4">
          <label className="text-sm text-gray-600">Filas por página:</label>
          <select
            className="border px-2 py-1 rounded"
            value={pageSize}
            onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">Total: {productos.length}</span>
        </div>
        <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">No.</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Razón Social</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Marca</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Generico</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Número de Registros</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Código de estándar de datos</th>
                  <th colSpan={10} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Distribución y comercialización</th>
                  <th colSpan={1} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Fabricacion</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DEL PRODUCTO</th>
                </tr>
                <tr className="bg-gray-200">
                  <th colSpan={4} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Comercial</th>
                  <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Institucional</th>
                  <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Intrahospitalario</th>
                  <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Muestras médicas</th>
                  <th colSpan={1} rowSpan={3} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Local / Importado</th>
                </tr>
                <tr className="bg-gray-200">
                  <th colSpan={2} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">RX</th>
                  <th colSpan={2} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">OTC</th>
                </tr>
                <tr className="bg-gray-200">
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
                  <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan={readonly ? "16" : "17"} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center">
                        <i className="fas fa-pills text-4xl text-gray-400 mb-3"></i>
                        <p className="text-lg font-medium">No hay productos registrados</p>
                        <p className="text-sm">Agregue productos manualmente o cargue un archivo Excel</p>
                      </div>
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan={readonly ? "16" : "17"} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-gray-600">{loadingMessage}</span>
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const totalItems = productos.length;
                  const startIdx = (currentPage - 1) * pageSize;
                  const endIdx = Math.min(totalItems, startIdx + pageSize);
                  return productos.slice(startIdx, endIdx).map((producto, idx) => {
                    const index = startIdx + idx;
                    const gIdx = index;
                    return (
                  <tr key={producto.idProductosB || producto.id || gIdx} className="border-t text-center">
                    <td className="p-2">{gIdx+1}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "razonSocial", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.razonSocial}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "marca", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.marca}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "nombreGenerico", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.nombreGenerico}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "numeroRegistros", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.numeroRegistros}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "codigoEstandarDatos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.codigoEstandarDatos}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoEmpaqueComercialRX", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueComercialRX}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoTotalComercialRX", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalComercialRX}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoEmpaqueComercialOTC", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueComercialOTC}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoTotalComercialOTC", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalComercialOTC}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoEmpaqueInstitucional", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueInstitucional}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoTotalInstitucional", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalInstitucional}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoEmpaqueIntrahospitalario", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueIntrahospitalario}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoTotalIntrahospitalario", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalIntrahospitalario}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoEmpaqueMuestrasMedicas", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueMuestrasMedicas}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(gIdx, "pesoTotalMuestrasMedicas", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalMuestrasMedicas}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {isEditable ? (
                          <select
                            className={`border p-1 w-full ${!producto.fabricacion ? "border-red-500 ring-1 ring-red-300" : ""}`}
                            value={producto.fabricacion || ""}
                            onChange={(e) => handleChange(gIdx, "fabricacion", e.target.value)}
                            required
                            aria-invalid={!producto.fabricacion}
                            title={!producto.fabricacion ? "Seleccione Local o Importado" : undefined}
                          >
                            <option value="" disabled>Seleccione...</option>
                            <option value="Local">Local</option>
                            <option value="Importado">Importado</option>
                          </select>
                        ) : (
                        <div className="w-fit max-w-full p-1 border border-transparent bg-gray-100 cursor-not-allowed">
                          {producto.fabricacion}
                        </div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300 bg-gray-100 cursor-not-allowed" title="Campo calculado automáticamente">
                      {producto.totalPesoEmpaques}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300 bg-gray-100 cursor-not-allowed" title="Campo calculado automáticamente">
                      {producto.totalPesoProducto}
                    </td>
                    <td>
                      {!readonly && (
                        <button 
                          className={`px-4 py-1 rounded ${
                            isEditable 
                              ? "bg-red-500 hover:bg-red-700 text-white" 
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          onClick={() => setProductos(productos.filter((_, i) => i !== gIdx))}
                          disabled={!isEditable}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                </tr>
                )});
                })()}
                {/* Closing the ternary operator for the tbody content */}
            </tbody>
              {/* Totales sobre TODOS los registros (no por página) */}
              {productos.length > 0 && (
                (() => {
                  const num = (v) => {
                    if (v === null || v === undefined) return 0;
                    if (v === 'N/A') return 0;
                    const n = Number(v);
                    return Number.isFinite(n) ? n : 0;
                  };
                  const sum = (key) => productos.reduce((acc, p) => acc + num(p[key]), 0);
                  const totals = {
                    pesoEmpaqueComercialRX: sum('pesoEmpaqueComercialRX'),
                    pesoTotalComercialRX: sum('pesoTotalComercialRX'),
                    pesoEmpaqueComercialOTC: sum('pesoEmpaqueComercialOTC'),
                    pesoTotalComercialOTC: sum('pesoTotalComercialOTC'),
                    pesoEmpaqueInstitucional: sum('pesoEmpaqueInstitucional'),
                    pesoTotalInstitucional: sum('pesoTotalInstitucional'),
                    pesoEmpaqueIntrahospitalario: sum('pesoEmpaqueIntrahospitalario'),
                    pesoTotalIntrahospitalario: sum('pesoTotalIntrahospitalario'),
                    pesoEmpaqueMuestrasMedicas: sum('pesoEmpaqueMuestrasMedicas'),
                    pesoTotalMuestrasMedicas: sum('pesoTotalMuestrasMedicas'),
                    totalPesoEmpaques: sum('totalPesoEmpaques'),
                    totalPesoProducto: sum('totalPesoProducto'),
                  };
                  return (
                    <tr className="bg-gray-50 font-semibold text-center">
                      {/* No., Razón, Marca, Nombre Genérico, Número de Registros, Código Estándar */}
                      <td className="border border-gray-300 px-2 py-1 text-right" colSpan={6}>Totales</td>
                      {/* Comercial RX */}
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoEmpaqueComercialRX}</td>
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoTotalComercialRX}</td>
                      {/* Comercial OTC */}
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoEmpaqueComercialOTC}</td>
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoTotalComercialOTC}</td>
                      {/* Institucional */}
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoEmpaqueInstitucional}</td>
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoTotalInstitucional}</td>
                      {/* Intrahospitalario */}
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoEmpaqueIntrahospitalario}</td>
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoTotalIntrahospitalario}</td>
                      {/* Muestras Médicas */}
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoEmpaqueMuestrasMedicas}</td>
                      <td className="border border-gray-300 px-2 py-1">{totals.pesoTotalMuestrasMedicas}</td>
                      {/* Fabricación (no numérico) */}
                      <td className="border border-gray-300 px-2 py-1"></td>
                      {/* Totales finales */}
                      <td className="border border-gray-300 px-2 py-1">{totals.totalPesoEmpaques}</td>
                      <td className="border border-gray-300 px-2 py-1">{totals.totalPesoProducto}</td>
                      {/* Acciones (si aplica) */}
                      {!readonly && <td className="border border-gray-300 px-2 py-1"></td>}
                    </tr>
                  );
                })()
              )}
          </table>
        </div>
          {/* Paginación inferior */}
          {productos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2">
              {(() => {
                const totalItems = productos.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
                return (
                  <>
                    <div className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages} — Mostrando {Math.min(pageSize, totalItems - (currentPage - 1) * pageSize)} de {totalItems}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        onClick={() => setCurrentPage(p => {
                          const tp = Math.max(1, Math.ceil(totalItems / pageSize));
                          return Math.min(tp, p + 1);
                        })}
                        disabled={currentPage >= Math.ceil(totalItems / pageSize)}
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          {!readonly && (
            <div className="flex items-center justify-between mt-3">
              <button
                type="submit"
                className={`px-4 py-2 rounded ${
                  isEditable
                    ? "bg-lightBlue-600 hover:bg-lightBlue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!isEditable}
              >
                Guardar
              </button>

              <button
                type="button"
                onClick={agregarProducto}
                className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
              >
                Agregar Producto
              </button>
            </div>
          )}
        </form>
      </div>
      {/* Modal using react-modal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        contentLabel="Instructivo de la sección"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          },
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px',
            border: 'none',
            borderRadius: '8px',
          },
        }}
      >
        <div>
          <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-4 py-2">#</th>
                    <th className="border border-gray-300 px-4 py-2">Campo</th>
                    <th className="border border-gray-300 px-4 py-2">Tipo</th>
                    <th className="border border-gray-300 px-4 py-2">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1", "Razón Social", "Texto", "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa participante. Titular de registro del medicamento a relacionar."],
                    ["2", "Marca", "Texto", "Nombre comercial del medicamento. (Si el medicamento no es de marca, diligencie únicamente el nombre genérico en la casilla D"],
                    ["3", "Nombre genérico", "Texto", "Nombre genérico del medicamento. Solamente si no llenó la casilla C."],
                    ["4", "Número de registro", "Texto", "Número, otorgado por el INVIMA, correspondiente al registro sanitario de cada uno de los medicamentos. Únicamente registro de medicamentos. Si es medicamento vital, no debe diligenciar nada, y deberá aclararlo en observaciones."],
                    ["5", "Peso de empaques, envases y envolturas RX", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de empaques, envases y envolturas de los productos que han sido comercializados bajo fórmula médica, tipo RX. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1.\n RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL LOS ENVASES Y EMPAQUES DE MEDICAMENTOS (VACIOS) MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR.<br>EJEMPLO:<br>Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco vacío + caja o plegadiza vacía, multiplicado por las unidades puestas en el mercado."],
                    ["6", "Peso total del producto RX", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de (empaques, envases y envolturas más medicamento) de los productos que han sido comercializados bajo fórmula médica, tipo RX. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1.RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL PRODUCTO TAL Y COMO SALE AL MERCADO MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR.EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco con el liquido + caja o plegadiza + los insertos, multiplicado por las unidades puestas en el mercado."],
                    ["7", "Peso de empaques, envases y envolturas OTC", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de empaques, envases y envolturas de los productos que fueron comercializados por venta libre, tipo OTC. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1.RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL LOS ENVASES Y EMPAQUES DE MEDICAMENTOS (VACIOS) MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco vacío + caja o plegadiza vacía, multiplicado por las unidades puestas en el mercado."],
                    ["8", "Peso total del producto OTC", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de (empaques, envases y envolturas más medicamento) de los productos que fueron comercializados por venta libre, tipo OTC. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL PRODUCTO TAL Y COMO SALE AL MERCADO MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco con el liquido + caja o plegadiza + los insertos, multiplicado por las unidades puestas en el mercado."],
                    ["9", "Peso de empaques, envases y envolturas Institucional", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de empaques, envases y envolturas de los productos que han sido comercializados a través del canal institucional, es decir por la IPS a la que se encuentre afiliado el consumidor del medicamento. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL LOS ENVASES Y EMPAQUES DE MEDICAMENTOS (VACIOS) MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco vacío + caja o plegadiza vacía, multiplicado por las unidades puestas en el mercado."],
                    ["10", "Peso total del producto Institucional", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de (empaques, envases y envolturas más medicamento) de los productos que han sido comercializados a través del canal institucional, es decir por la IPS a la que se encuentre afiliado el consumidor del medicamento. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL PRODUCTO TAL Y COMO SALE AL MERCADO MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco con el liquido + caja o plegadiza + los insertos, multiplicado por las unidades puestas en el mercado."],
                    ["11", "Peso de empaques, envases y envolturas Intrahospitalario", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de empaques, envases y envolturas de los productos que han sido comercializados a través del canal intrahospitalario. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL LOS ENVASES Y EMPAQUES DE MEDICAMENTOS (VACIOS) MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco vacío + caja o plegadiza vacía, multiplicado por las unidades puestas en el mercado."],
                    ["12", "Peso total del producto Intrahospitalario", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de (empaques, envases y envolturas más medicamento) de los productos que han sido comercializados a través del canal intrahospitalario. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL PRODUCTO TAL Y COMO SALE AL MERCADO MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco con el liquido + caja o plegadiza + los insertos, multiplicado por las unidades puestas en el mercado."],
                    ["13", "Peso de empaques, envases y envolturas. Muestras médicas", "Kilogramos", "Cantidad TOTAL KILOGRAMOS de empaques, envases y envolturas de las muestras médicas producidas o importadas durante el año de reporte. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL LOS ENVASES Y EMPAQUES DE MEDICAMENTOS (VACIOS) MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco vacío + caja o plegadiza vacía, multiplicado por las unidades puestas en el mercado."],
                    ["14", "Peso total del producto Muestras", "Kilogramos", "Cantidad TOTAL KILOGRAMOS (empaques, envases y envolturas más medicamento) de muestras médicas producidas o importadas durante el año de reporte. No poner decimales. En caso que sea cero, deberá diligenciarlo con 0,1. RECUERDE QUE LA OPERACIÓN A REALIZAR ES EL PESO EN KILOGRAMOS DEL PRODUCTO TAL Y COMO SALE AL MERCADO MULTIPLICADO POR LA UNIDADES PUESTAS EN EL MERCADO EL AÑO ANTERIOR. EJEMPLO: Si su medicamento es un jarabe que viene dentro de un frasco de plástico y a la vez este viene dentro de una caja o plegadiza, el peso que deberá reportar es el peso del frasco con el liquido + caja o plegadiza + los insertos, multiplicado por las unidades puestas en el mercado."],
                    ["15", "Local/Importado", "Kilogramos", "Indique si el medicamento fue producido en Colombia o es importado."],
                    ["16", "Total de peso de empaques, envases y envolturas", "Kilogramos", "Cantidad TOTAL KILOGRAMOS correspondiente a la suma de las celdas señaladas con las letras G, I, K, M, O que hacen referencia a “Peso de empaques, envases y envolturas”."],
                    ["17", "Total de peso del producto", "Kilogramos", "Cantidad TOTAL KILOGRAMOS correspondiente a la suma de las celdas señaladas con las letras H, J, L, N, P que hacen referencia a “Peso total del producto”."]
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-4 py-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </button>
          </div>
      </Modal>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
  idUsuario: PropTypes.string,
  estado: PropTypes.string,
  readonly: PropTypes.bool,
  idInformacionB: PropTypes.string,
};