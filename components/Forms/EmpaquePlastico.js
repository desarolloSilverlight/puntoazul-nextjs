import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
export default function FormularioAfiliado({ color, readonly = false, idInformacionF: propIdInformacionF }) {
  const [isLoading, setIsLoading] = useState(false);
  let idInformacionF = propIdInformacionF || localStorage.getItem("idInformacionF");
  let estadoInformacionF = localStorage.getItem("estadoInformacionF");
  // Solo editable si estado es Guardado o Rechazado Y no está en modo readonly
  const esEditable = !readonly && (estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado");
  const [productos, setProductos] = useState([]);
  // Paginación
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [toneladasAcumuladasGlobal, setToneladasAcumuladasGlobal] = useState(0);
  const [erroresCampos, setErroresCampos] = useState({});

  // Helper: descarga un TXT con el resumen de errores de carga Excel
  const descargarErroresTXT = (errores = [], nombreArchivoOriginal = "archivo.xlsx") => {
    try {
      const ahora = new Date();
      const encabezado = [
        `Archivo procesado: ${nombreArchivoOriginal}`,
        `Fecha: ${ahora.toLocaleString()}`,
        `Total de errores: ${errores.length}`,
        "",
        "DETALLE:"
      ].join("\n");
      const contenido = `${encabezado}\n${errores.join("\n")}`;
      const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `errores_empaques_plasticos_${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("No se pudo generar el archivo TXT de errores:", e);
      alert("No se pudo generar el archivo TXT de errores.");
    }
  };

  // Obtener productos desde el backend al cargar el componente
  // --- Toneladas acumuladas globales ---
  // Definir la función fuera del useEffect para poder reutilizarla
  const fetchToneladasAcumuladas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/getToneladasAcumuladasPlasticos/${idInformacionF}`);
      if (!response.ok) throw new Error("No se pudo obtener toneladas acumuladas");
      const data = await response.json();
      setToneladasAcumuladasGlobal(Number(data.toneladas) || 0);
    } catch {
      setToneladasAcumuladasGlobal(0);
    }
  };
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPlasticos/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques plásticos para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Empaques plásticos obtenidos:", data);
        // Mapear los datos recibidos al formato esperado por el componente
  const productosFormateados = data.map(producto => ({
          id: producto.idEmpaque,
          idInformacionF: producto.idInformacionF,
          empresaTitular: producto.empresa || "",
          nombreProducto: producto.nombre_producto || "",
          pet: producto.pet || "",
          unidades: producto.unidades || "",
          liquidos: JSON.parse(producto.liquidos || "{}"),
          otrosProductos: JSON.parse(producto.otros || "{}"),
          construccion: JSON.parse(producto.construccion || "{}"),
          excepciones: producto.excepciones || "",
          prohibiciones: producto.prohibiciones || "",
        }));
        setProductos(productosFormateados);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error al obtener los empaques plásticos:", error);
      }
    };
    if (idInformacionF) {
      fetchProductos();
      fetchToneladasAcumuladas();
    }
  }, [idInformacionF]);

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
        idInformacionF,
        empresaTitular: "",
        nombreProducto: "",
        liquidos: {
          "PET Agua": '0,00',
          "PET Otros": '0,00',
          "PET": '0,00',
          HDPE: '0,00',
          PVC: '0,00',
          LDPE: '0,00',
          PP: '0,00',
          PS: '0,00',
          Otros: '0,00'
        },
        otrosProductos: {
          PET: '0,00',
          HDPE: '0,00',
          PVC: '0,00',
          LDPE: '0,00',
          PP: '0,00',
          PS: '0,00',
          Otros: '0,00'
        },
        construccion: {
          PET: '0,00',
          HDPE: '0,00',
          PVC: '0,00',
          LDPE: '0,00',
          PP: '0,00',
          PS: '0,00',
          Otros: '0,00'
        },
        excepciones: "",
        prohibiciones: "",
        unidades: localStorage.getItem("tipoReporte") === "totalizado" ? "1" : ""
      },
    ]);
  };

  // Helper formato dos decimales
  const format2 = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const num = parseFloat(v.toString().replace(',', '.'));
    if (isNaN(num)) return v;
    return num.toFixed(2).replace('.', ',');
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    const tipoReporteLocal = localStorage.getItem('tipoReporte');
    const registrar = (objRef, subField, raw) => {
      let val = raw.trim();
      const keyErr = `${index}-${field}`;
      const nuevoErr = { ...erroresCampos };
      if (val.includes('.')) {
        nuevoErr[keyErr] = 'Use coma (,) para decimales';
      } else if (val !== '' && !/^\d+(,\d{0,2})?$/.test(val)) {
        nuevoErr[keyErr] = 'Máx 2 decimales con coma';
      } else {
        delete nuevoErr[keyErr];
      }
      setErroresCampos(nuevoErr);
      objRef[subField] = val === '' ? '' : val; // mantener tal cual; formateo visual con format2
    };
    if (field.startsWith('liquidos.')) {
      const sub = field.split('.')[1];
      if (typeof nuevosProductos[index].liquidos === 'string') {
        try { nuevosProductos[index].liquidos = JSON.parse(nuevosProductos[index].liquidos); } catch { nuevosProductos[index].liquidos = {}; }
      }
      registrar(nuevosProductos[index].liquidos, sub, value);
    } else if (field.startsWith('otrosProductos.')) {
      const sub = field.split('.')[1];
      if (typeof nuevosProductos[index].otrosProductos === 'string') {
        try { nuevosProductos[index].otrosProductos = JSON.parse(nuevosProductos[index].otrosProductos); } catch { nuevosProductos[index].otrosProductos = {}; }
      }
      registrar(nuevosProductos[index].otrosProductos, sub, value);
    } else if (field.startsWith('construccion.')) {
      const sub = field.split('.')[1];
      if (typeof nuevosProductos[index].construccion === 'string') {
        try { nuevosProductos[index].construccion = JSON.parse(nuevosProductos[index].construccion); } catch { nuevosProductos[index].construccion = {}; }
      }
      registrar(nuevosProductos[index].construccion, sub, value);
    } else if (field === 'excepciones' || field === 'prohibiciones') {
      nuevosProductos[index][field] = value;
    } else if (field === 'unidades') {
      if (tipoReporteLocal === 'totalizado') {
        nuevosProductos[index].unidades = '1';
      } else {
        const val = value.trim();
        const keyErr = `${index}-unidades`;
        const nuevoErr = { ...erroresCampos };
        if (val.includes('.') || val.includes(',')) {
          nuevoErr[keyErr] = 'Solo enteros';
        } else if (val !== '' && !/^\d+$/.test(val)) {
          nuevoErr[keyErr] = 'Solo dígitos';
        } else {
          delete nuevoErr[keyErr];
        }
        setErroresCampos(nuevoErr);
        nuevosProductos[index].unidades = val;
      }
    } else {
      nuevosProductos[index][field] = value;
    }
    setProductos(nuevosProductos);
  };

  // Post por lotes para evitar cargas masivas en una sola petición
  const postInBatches = async (url, payloadArray, chunkSize = 1000) => {
    let okCount = 0;
    for (let i = 0; i < payloadArray.length; i += chunkSize) {
      const chunk = payloadArray.slice(i, i + chunkSize);
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(chunk),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Lote ${Math.floor(i / chunkSize) + 1}: ${resp.status} ${errText}`);
      }
      okCount += chunk.length;
    }
    return okCount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  const camposLiquidos = ["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
  const camposOtros = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
  const decimalRegexComa = /^\d+(,\d{1,2})?$/;
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // Validación de empresaTitular, nombreProducto y unidades
      if (!producto.empresaTitular || producto.empresaTitular.trim() === "") {
        alert(`El campo 'Empresa Titular' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!producto.nombreProducto || producto.nombreProducto.trim() === "") {
        alert(`El campo 'Nombre Producto' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!producto.unidades || producto.unidades.toString().trim() === "") {
        alert(`El campo 'Unidades Puestas en el mercado' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      // Validación de excepciones y prohibiciones
      const excepcion = producto.excepciones;
      const prohibicion = producto.prohibiciones;
      // Ambos deben tener una opción válida seleccionada
      if (!excepcion || excepcion === "" || excepcion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Excepciones Ley 2232' en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!prohibicion || prohibicion === "" || prohibicion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Prohibiciones Ley 2232' en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      // Uno de los dos debe ser 'no_aplica'
      if (excepcion !== "no_aplica" && prohibicion !== "no_aplica") {
        alert(`En la fila ${i + 1}, uno de los campos 'Excepciones Ley 2232' o 'Prohibiciones Ley 2232' debe ser 'No Aplica'.`);
        setIsLoading(false);
        return;
      }
      const validarGrupo = (grupo, nombreGrupo) => {
        for (const campo of grupo) {
          let valor = producto[nombreGrupo][campo];
          if (valor === null || valor === undefined || valor === '') {
            producto[nombreGrupo][campo] = '0';
            continue;
          }
          const str = valor.toString();
          if (str.includes('.')) { alert(`Fila ${i+1} ${nombreGrupo}.${campo}: No use punto, use coma.`); setIsLoading(false); return false; }
          if (str !== '' && !decimalRegexComa.test(str)) { alert(`Fila ${i+1} ${nombreGrupo}.${campo}: Formato inválido (máx 2 decimales con coma).`); setIsLoading(false); return false; }
        }
        return true;
      };
      if (!validarGrupo(camposLiquidos, 'liquidos')) return;
      if (!validarGrupo(camposOtros, 'otrosProductos')) return;
      if (!validarGrupo(camposOtros, 'construccion')) return;
    }
    // Serializar los campos de plásticos solo una vez antes de enviar
    const convertir = v => {
      if (v === null || v === undefined || v === '') return '0';
      if (typeof v === 'string') {
        if (v.includes('.')) throw new Error('Formato con punto detectado en números (no permitido).');
        return v.replace(',', '.');
      }
      return String(v);
    };
    const productosSerializados = productos.map((producto) => {
      const liq = typeof producto.liquidos === 'string' ? JSON.parse(producto.liquidos) : producto.liquidos;
      const otr = typeof producto.otrosProductos === 'string' ? JSON.parse(producto.otrosProductos) : producto.otrosProductos;
      const cons = typeof producto.construccion === 'string' ? JSON.parse(producto.construccion) : producto.construccion;
      const normGrupo = (g) => Object.fromEntries(Object.entries(g).map(([k,v]) => [k, convertir(v)]));
      return {
        ...producto,
        liquidos: normGrupo(liq),
        otrosProductos: normGrupo(otr),
        construccion: normGrupo(cons)
      };
    });
    try {
      const total = await postInBatches(`${API_BASE_URL}/informacion-f/crearEmpaquePlastico`, productosSerializados, 1000);
      alert(`Se guardaron ${total} registros de Empaque Plástico en lotes.`);
      await fetchToneladasAcumuladas();
      // No recargar la página
    } catch (error) {
      console.error("Error al enviar los empaques plásticos:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Excel download functionality
  const descargarPlantilla = async () => {
    const tipoReporte = localStorage.getItem('tipoReporte');
    const headers = [
      'Empresa titular','Nombre Producto',
      'Liquidos PET Agua (g)','Liquidos PET Otros (g)','Liquidos PET (g)','Liquidos HDPE (g)','Liquidos PVC (g)','Liquidos LDPE (g)','Liquidos PP (g)','Liquidos PS (g)','Liquidos Otros (g)',
      'OtrosProductos PET (g)','OtrosProductos HDPE (g)','OtrosProductos PVC (g)','OtrosProductos LDPE (g)','OtrosProductos PP (g)','OtrosProductos PS (g)','OtrosProductos Otros (g)',
      'Construccion PET (g)','Construccion HDPE (g)','Construccion PVC (g)','Construccion LDPE (g)','Construccion PP (g)','Construccion PS (g)','Construccion Otros (g)',
      'Excepciones','Prohibiciones','Unidades'
    ];
    const workbook = new ExcelJS.Workbook();
    workbook.creator='PuntoAzul'; workbook.created=new Date();
    const sheetEntrada = workbook.addWorksheet('Empaques');
    sheetEntrada.addRow(headers); sheetEntrada.getRow(1).font={bold:true}; sheetEntrada.columns.forEach(c=> c.width=20);
    const sheetEjemplos = workbook.addWorksheet('Ejemplos_Instrucciones');
    sheetEjemplos.addRow(headers).font={bold:true};
    const unidadesEj = tipoReporte==='totalizado'?'1':'500';
    const ejemplo2U = tipoReporte==='totalizado'?'1':'750';
    const ejemplos = [
      ['Ejemplo Empresa A','Envase Plástico 1','2,50','0','1,80','0','0','0,50','0','0','0','3,20','0','0','0','1,10','0','0','0','0','0','0','0','0','0','no_aplica','bolsas_pago',unidadesEj],
      ['Ejemplo Empresa B','Envase Plástico 2','0','3,70','0','2,10','0','0','0','0','0','0','4,50','0','0','0','0','1,80','0','0','0','0','0','0','0','medicos','no_aplica',ejemplo2U]
    ];
    ejemplos.forEach(r=> sheetEjemplos.addRow(r));
    sheetEjemplos.columns.forEach(c=> c.width=22);
    sheetEjemplos.addRow([]);
    const instrucciones = [
      'INSTRUCCIONES IMPORTANTES PARA EMPAQUES PLÁSTICOS:',
      '',
      'Campos obligatorios: Empresa titular, Nombre Producto, Unidades, Excepciones, Prohibiciones',
      "Regla: Uno de Excepciones o Prohibiciones debe ser 'no_aplica'",
      'Valores numéricos: coma (,) para decimales, máx 2. No usar punto.',
      'Campos vacíos se interpretan como 0,00',
      'Opciones Excepciones: medicos, quimicos, alimentos, higiene, asistencia, impacto, residuos, reciclado, pitillos, no_aplica',
      'Opciones Prohibiciones: bolsas_pago, bolsas_publicidad, rollos_bolsas, mezcladores_pitillos, soportes_bombas, soportes_copitos, envases_liquidos, platos_utensilios, confeti_manteles, empaques_alimentos, laminas_alimentos, empaques_frutas, adhesivos_etiquetas, no_aplica'
    ];
    if (tipoReporte==='totalizado') instrucciones.unshift('IMPORTANTE: Unidades deben ser 1 para reporte totalizado','');
    instrucciones.forEach(t=> { const row=sheetEjemplos.addRow([t]); sheetEjemplos.mergeCells(`A${row.number}:AC${row.number}`); if(/INSTRUCCIONES|IMPORTANTE/.test(t)) row.font={bold:true}; });
    const nombreArchivo = tipoReporte==='totalizado'?'plantilla_empaques_plasticos_totalizado.xlsx':'plantilla_empaques_plasticos.xlsx';
    try { const buf = await workbook.xlsx.writeBuffer(); const blob = new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=nombreArchivo; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);} catch(e){ console.error('Error generando Excel:',e); alert('No se pudo generar la plantilla Excel.'); }
  };

  // Excel upload functionality
  const cargarDesdeExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (!rawRows || rawRows.length===0){
          const errores = ['El archivo Excel está vacío.'];
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          return;
        }
        let headerIndex = rawRows.findIndex(r => Array.isArray(r) && r.some(c=> typeof c==='string' && c.toLowerCase().includes('empresa')) && r.some(c=> typeof c==='string' && c.toLowerCase().includes('nombre')));
        if (headerIndex === -1){
          const errores = [
            'No se encontraron encabezados válidos.',
            'Asegúrese de incluir columnas como Empresa titular, Nombre Producto, Excepciones, Prohibiciones y Unidades, además de las columnas numéricas.'
          ];
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          return;
        }
        const headers = rawRows[headerIndex].map(h => (h||'').toString().trim());
        const dataMatrix = rawRows.slice(headerIndex+1).filter(r => r.some(c=> c!==null && c!==undefined && c!==''));
        const jsonData = dataMatrix.map(r => { const o={}; headers.forEach((h,i)=> o[h]=r[i]); return o; });
        if (jsonData.length===0){
          const errores = ['No hay filas de datos después de encabezados.'];
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          return;
        }
        const mapearColumnas = (row) => {
          const keys = Object.keys(row); const lower = keys.map(k=>k.toLowerCase()); const find=(pred)=> { const i=lower.findIndex(pred); return i>=0? keys[i]: null; };
          const g = (pref, material) => row[find(k=> k.includes(pref) && k.includes(material))] || '0';
          return {
            empresaTitular: row[find(k=> k.includes('empresa') || k.includes('titular'))] || '',
            nombreProducto: row[find(k=> k.includes('nombre') && k.includes('producto'))] || '',
            liquidos: {
              'PET Agua': g('liquidos','agua'),
              'PET Otros': g('liquidos','otros'),
              'PET': (()=>{ const k = keys.find(k=> k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('pet') && !k.toLowerCase().includes('agua') && !k.toLowerCase().includes('otros')); return row[k] || '0'; })(),
              'HDPE': g('liquidos','hdpe'),
              'PVC': g('liquidos','pvc'),
              'LDPE': g('liquidos','ldpe'),
              'PP': g('liquidos','pp'),
              'PS': g('liquidos','ps'),
              'Otros': g('liquidos','otros')
            },
            otrosProductos: {
              'PET': g('otrosproductos','pet'),
              'HDPE': g('otrosproductos','hdpe'),
              'PVC': g('otrosproductos','pvc'),
              'LDPE': g('otrosproductos','ldpe'),
              'PP': g('otrosproductos','pp'),
              'PS': g('otrosproductos','ps'),
              'Otros': g('otrosproductos','otros')
            },
            construccion: {
              'PET': g('construccion','pet'),
              'HDPE': g('construccion','hdpe'),
              'PVC': g('construccion','pvc'),
              'LDPE': g('construccion','ldpe'),
              'PP': g('construccion','pp'),
              'PS': g('construccion','ps'),
              'Otros': g('construccion','otros')
            },
            excepciones: row[find(k=> k.includes('excepciones'))] || '',
            prohibiciones: row[find(k=> k.includes('prohibiciones'))] || '',
            unidades: row[find(k=> k.includes('unidades'))] || ''
          };
        };
        const productosValidados = []; const errores = [];
        const decimalRegexFlexible = /^\d+(?:[\.,]\d{1,10})?$/;
        const tipoReporte = localStorage.getItem('tipoReporte');

        // Opciones válidas
        const opcionesExcepciones = ["medicos", "quimicos", "alimentos", "higiene", "asistencia", "impacto", "residuos", "reciclado", "pitillos", "no_aplica"];
        const opcionesProhibiciones = ["bolsas_pago", "bolsas_publicidad", "rollos_bolsas", "mezcladores_pitillos", "soportes_bombas", "soportes_copitos", "envases_liquidos", "platos_utensilios", "confeti_manteles", "empaques_alimentos", "laminas_alimentos", "empaques_frutas", "adhesivos_etiquetas", "no_aplica"];

        jsonData.forEach((row, index) => {
          const producto = mapearColumnas(row);
          const numeroFila = headerIndex + 2 + index;

          // 1. Validar campos obligatorios
          if (!producto.empresaTitular.trim()) {
            errores.push(`Fila ${numeroFila}: 'Empresa titular' es obligatorio`);
          }
          if (!producto.nombreProducto.trim()) {
            errores.push(`Fila ${numeroFila}: 'Nombre Producto' es obligatorio`);
          }
          if (!producto.unidades.toString().trim()) {
            errores.push(`Fila ${numeroFila}: 'Unidades' es obligatorio`);
          }

          // 2. Validar excepciones y prohibiciones
          if (!opcionesExcepciones.includes(producto.excepciones)) {
            errores.push(`Fila ${numeroFila}: 'Excepciones' debe ser una opción válida. Opciones: ${opcionesExcepciones.join(', ')}`);
          }
          if (!opcionesProhibiciones.includes(producto.prohibiciones)) {
            errores.push(`Fila ${numeroFila}: 'Prohibiciones' debe ser una opción válida. Opciones: ${opcionesProhibiciones.join(', ')}`);
          }

          // 3. Validar regla mutua exclusión
          if (producto.excepciones !== "no_aplica" && producto.prohibiciones !== "no_aplica") {
            errores.push(`Fila ${numeroFila}: Uno de 'Excepciones' o 'Prohibiciones' debe ser 'no_aplica'`);
          }

          const normalizarGrupo = (grp, nombre) => {
            Object.keys(grp).forEach(k => {
              let v = grp[k];
              if (v === null || v === undefined || v === '') { grp[k] = '0,00'; return; }
              const s = v.toString().trim();
              if (!decimalRegexFlexible.test(s)) { errores.push(`Fila ${numeroFila}: '${nombre}.${k}' número inválido (${v})`); return; }
              const num = parseFloat(s.replace(',', '.'));
              if (isNaN(num)) { errores.push(`Fila ${numeroFila}: '${nombre}.${k}' no interpretable (${v})`); return; }
              grp[k] = num.toFixed(2).replace('.', ',');
            });
          };
          normalizarGrupo(producto.liquidos, 'Líquidos');
          normalizarGrupo(producto.otrosProductos, 'OtrosProductos');
          normalizarGrupo(producto.construccion, 'Construccion');

          // 5. Validar unidades según tipoReporte
          if (tipoReporte === "totalizado") {
            if (producto.unidades.toString() !== "1") {
              console.warn(`Fila ${numeroFila}: Las unidades fueron ajustadas a 1 porque el tipo de reporte es totalizado. Valor original: ${producto.unidades}`);
            }
            producto.unidades = "1";
          }

          // Formatear producto para el estado
          const productoFormateado = {
            id: productosValidados.length + 1,
            idInformacionF,
            empresaTitular: producto.empresaTitular,
            nombreProducto: producto.nombreProducto,
            liquidos: producto.liquidos,
            otrosProductos: producto.otrosProductos,
            construccion: producto.construccion,
            excepciones: producto.excepciones,
            prohibiciones: producto.prohibiciones,
            unidades: producto.unidades.toString()
          };

          productosValidados.push(productoFormateado);
        });

        if (errores.length > 0) {
          descargarErroresTXT(errores, file.name);
          alert('Se generó un TXT con los errores encontrados.');
          event.target.value = '';
          return;
        }

  // Actualizar estado con productos validados y reiniciar a la primera página
  setProductos(productosValidados);
  setCurrentPage(1);
        
        // Mensaje informativo según el tipo de reporte
        let mensaje = `Se cargaron exitosamente ${productosValidados.length} productos desde Excel.`;
        if (tipoReporte === "totalizado") {
          mensaje += "\n\nNota: Las unidades fueron ajustadas automáticamente a 1 porque el tipo de reporte es totalizado.";
        }
        alert(mensaje);

      } catch (error) {
        console.error('Error al procesar archivo Excel:', error);
        const errores = [
          'Error al procesar el archivo Excel. Verifique que el formato sea correcto.',
          `Detalle: ${error?.message || error}`
        ];
        descargarErroresTXT(errores, file?.name || 'archivo.xlsx');
        alert('Se generó un TXT con el detalle del error.');
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const plasticsData = [
    {  type: "PET", unit: "Gramos", description: "(Polietilentereftalato) Es un plástico transparente y ligero, común en botellas de agua y bebidas. Se puede reconocer porque es claro, rígido y suele llevar el número 1 dentro del símbolo de reciclaje." },
    {  type: "HDPE", unit: "Gramos", description: "(Polietileno de alta densidad) Es más opaco y resistente, común en envases de detergentes y productos de limpieza. Se puede identificar por su textura rígida y generalmente lleva el número 2 en el símbolo de reciclaje." },
    {  type: "PVC", unit: "Gramos", description: "(Policloruro de vinilo) Es un plástico rígido o flexible, usado en tuberías y algunos envases de alimentos. Suele ser más difícil de doblar y lleva el número 3 en el símbolo de reciclaje." },
    {  type: "LDPE", unit: "Gramos", description: "(Polietileno de baja densidad) es un plástico flexible y ligero, común en bolsas de plástico, envolturas y algunos tipos de envases. Se puede reconocer por su textura suave y flexible, y generalmente lleva el número 4 en el símbolo de reciclaje." },
    {  type: "PP", unit: "Gramos", description: "(Polipropileno) es un plástico resistente al calor, común en tapas de botellas, envases de alimentos y productos médicos. Se puede reconocer porque es rígido pero ligero, y generalmente lleva el número 5 en el símbolo de reciclaje." },
    {  type: "PS", unit: "Gramos", description: "(Poliestireno) es un plástico ligero y frágil, utilizado en vasos desechables, envases de comida y materiales de embalaje. Se puede reconocer por su textura rígida o espumosa y suele llevar el número 6 en el símbolo de reciclaje." },
    {  type: "OTROS", unit: "Gramos", description: "(Otros) se refiere a plásticos que no entran en las categorías comunes (1 a 6), como mezclas de diferentes tipos de plásticos o plásticos menos frecuentes. Se pueden reconocer por llevar el número 7 en el símbolo de reciclaje y suelen ser más difíciles de reciclar." }
  ];

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
          <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">Guardando información...</span>
        </div>
      </Backdrop>
      {/* SECCIÓN II */}
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Empaques Plasticos&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="mt-2 mb-2 text-blue-700 font-bold text-lg">
          Toneladas acumuladas (Plasticos): {Number(toneladasAcumuladasGlobal).toFixed(10)}
        </div>
        {!readonly && (
          <div className="flex justify-between mt-3 gap-2">
            <button 
              type="button"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded hover:bg-lightBlue-700" 
              onClick={agregarProducto}
            >
              Agregar Producto
            </button>
            
            <label className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded cursor-pointer inline-flex items-center">
              Cargar Excel
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={cargarDesdeExcel}
                className="hidden"
              />
            </label>
            <button 
                type="button"
                className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
                onClick={descargarPlantilla}
              >
                Descargar Plantilla Excel
              </button>
          </div>
        )}
        {/* Controles de paginación: tamaño de página */}
        <div className="mt-3 flex items-center gap-3">
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
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en gramos y sin separador de miles.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">No.</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Empresa Titular</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Producto</th>
                  <th colSpan="9" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Líquidos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros Productos Plásticos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plásticos de Construcción</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Excepciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Prohibiciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Unidades Puestas en el mercado</th>
                  {!readonly && <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Acciones</th>}
                </tr>
                <tr className="bg-gray-200">
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de botellas PET de agua (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de botellas PET de otro tipo de bebidas (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET para otros líquidos (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">HDPE (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PVC (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">LDPE (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PP (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PS (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros (g)</th>
                  {['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Otros'].map((item) => (
                    <th key={`otros-${item}`} className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{item} (g)</th>
                  ))}
                  {['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Otros'].map((item) => (
                    <th key={`construccion-${item}`} className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{item} (g)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalItems = productos.length;
                  const startIdx = (currentPage - 1) * pageSize;
                  const endIdx = Math.min(totalItems, startIdx + pageSize);
                  return productos.slice(startIdx, endIdx).map((producto, idx) => {
                    const index = startIdx + idx;
                  // Parsear los campos que vienen como string JSON
                  // Usar siempre el valor local (mayúsculas) si existe, si no, fallback al backend
                  const liquidos = typeof producto.liquidos === "string" ? JSON.parse(producto.liquidos || "{}") : (producto.liquidos || {});
                  const otrosProductos = typeof producto.otrosProductos === "string" ? JSON.parse(producto.otrosProductos || "{}") : (producto.otrosProductos || {});
                  const construccion = typeof producto.construccion === "string" ? JSON.parse(producto.construccion || "{}") : (producto.construccion || {});

                  return (
                    <tr key={producto.idEmpaque || index} className="border-t text-center">
                      <td className="p-2 border border-gray-300">{index + 1}</td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "empresaTitular", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.empresaTitular !== undefined ? producto.empresaTitular : (producto.empresa || "")}
                          </div>
                        ) : (
                          <div className="p-1">{producto.empresaTitular !== undefined ? producto.empresaTitular : (producto.empresa || "")}</div>
                        )}
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "nombreProducto", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.nombreProducto !== undefined ? producto.nombreProducto : (producto.nombre_producto || "")}
                          </div>
                        ) : (
                          <div className="p-1">{producto.nombreProducto !== undefined ? producto.nombreProducto : (producto.nombre_producto || "")}</div>
                        )}
                      </td>
                      {/* Líquidos */}
                      {["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`liquidos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `liquidos.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {liquidos[key] !== undefined ? liquidos[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{liquidos[key] !== undefined ? liquidos[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Otros Productos */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`otrosProductos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `otrosProductos.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {otrosProductos[key] !== undefined ? otrosProductos[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{otrosProductos[key] !== undefined ? otrosProductos[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Construcción */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`construccion-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `construccion.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {construccion[key] !== undefined ? construccion[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{construccion[key] !== undefined ? construccion[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.excepciones}
                          onChange={e => handleChange(index, "excepciones", e.target.value)}
                          disabled={!esEditable}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="medicos">Propósitos médicos</option>
                          <option value="quimicos">Químicos con riesgo a la salud humana o al medio ambiente</option>
                          <option value="alimentos">Alimentos, líquidos y bebidas de origen animal, por razones de asepsia o inocuidad</option>
                          <option value="higiene">Fines específicos que por razones de higiene o salud requieren bolsa</option>
                          <option value="asistencia">Uso del plástico en los establecimientos que brindan asistencia médica</option>
                          <option value="impacto">Los plásticos de un solo uso cuyos sustitutos tengan un impacto ambiental y humano mayor</option>
                          <option value="residuos">Empacar o envasar residuos peligrosos</option>
                          <option value="reciclado">Aquellos productos fabricados con 100% de materia reciclada</option>
                          <option value="pitillos">Pitillos adheridos a envases de hasta 300 ml con sistema de retención</option>
                          <option value="no_aplica">No Aplica</option>
                        </select>
                      </td>
                      {/* Prohibiciones */}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.prohibiciones}
                          onChange={e => handleChange(index, "prohibiciones", e.target.value)}
                          disabled={!esEditable}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="bolsas_pago">Bolsas de punto de pago (2024)</option>
                          <option value="bolsas_publicidad">Bolsas para publicidad, facturas y lavanderías (2024)</option>
                          <option value="rollos_bolsas">Rollos de bolsas vacías en comercios (2024)</option>
                          <option value="mezcladores_pitillos">Mezcladores y pitillos para bebidas (2024)</option>
                          <option value="soportes_bombas">Soportes plásticos para bombas de inflar (2024)</option>
                          <option value="soportes_copitos">Soportes plásticos de los hisopos flexibles (2024)</option>
                          <option value="envases_liquidos">Envases y bolsas para líquidos no preenvasados (2030)</option>
                          <option value="platos_utensilios">Platos, bandejas, cubiertos, vasos y guantes para comer (2030)</option>
                          <option value="confeti_manteles">Confeti, manteles y serpentinas (2030)</option>
                          <option value="empaques_alimentos">Empaques para comidas no preenvasadas (2030)</option>
                          <option value="laminas_alimentos">Láminas para servir o envolver alimentos (2030)</option>
                          <option value="empaques_frutas">Empaques para frutas, verduras y tubérculos frescos (2030)</option>
                          <option value="adhesivos_etiquetas">Adhesivos, etiquetas o distintivos en vegetales (2030)</option>
                          <option value="no_aplica">No Aplica</option>
                        </select>
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {localStorage.getItem("tipoReporte") === "totalizado" ? (
                          <div className="w-fit max-w-full p-1 border border-gray-300 bg-gray-100 text-center">1</div>
                        ) : esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "unidades", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.unidades}
                          </div>
                        ) : (
                          <div className="p-1">{producto.unidades}</div>
                        )}
                      </td>
                      {!readonly && (
                        <td>
                          <button 
                            className="bg-red-500 text-white px-4 py-1 rounded" 
                            onClick={e => { e.preventDefault(); setProductos(productos.filter((_, i) => i !== index)); }}
                            disabled={!esEditable}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                });
                })()}
              </tbody>
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
            <button
              type="submit"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
              disabled={!esEditable}
            >
              Guardar
            </button>
          )}
        </form>
      </div>
      {/* Modal con react-modal y estilos de Informacion.js */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Instructivo de la sección"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border px-4 py-2">Tipo</th>
                <th className="border px-4 py-2">Unidad</th>
                <th className="border px-4 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {plasticsData.map((plastic) => (
                <tr key={plastic.code} className="border">
                  <td className="border px-4 py-2 text-center">{plastic.type}</td>
                  <td className="border px-4 py-2 text-center">{plastic.unit}</td>
                  <td className="border px-4 py-2">{plastic.description}</td>
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
      </Modal>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};