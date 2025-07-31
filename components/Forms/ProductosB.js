import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../utils/config';

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
  
  // Determinar si los campos son editables basado en el estado y readonly
  const isEditable = !readonly && (estado === "Iniciado" || estado === "Guardado" || estado === "Rechazado" || !estado);

  // Obtener productos desde el backend al cargar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-b/getProdValidarB/${idInformacionB}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron productos para este idInformacionB.");
            return; // Si no hay productos, no hacemos nada
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Productos obtenidos:", data);
        setProductos(data); // Guardar los productos en el estado
      } catch (error) {
        console.error("Error al obtener los productos:", error);
      }
    };

    if (idInformacionB) {
      fetchProductos();
    }
  }, [idInformacionB, propIdUsuario, propIdInformacionB]);

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
    
    // Validar campos obligatorios
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
    }
    
    // Validar que todos los campos numéricos sean enteros
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
      "pesoTotalMuestrasMedicas",
      "totalPesoEmpaques",
      "totalPesoProducto"
    ];
    for (const producto of productos) {
      for (const campo of camposNumericos) {
        const valor = producto[campo];
        if (valor && valor !== "N/A") {
          const num = Number(valor);
          if (!Number.isInteger(num) || num < 0) {
            alert(`El campo "${campo}" debe ser un número entero mayor o igual a 0. Valor ingresado: ${valor}`);
            return;
          }
        }
      }
    }
    // Mostrar un alert de confirmación
    const isConfirmed = window.confirm("¿Estás seguro de que los datos ingresados son correctos?");
    if (!isConfirmed) {
      return; // Si el usuario cancela, no se ejecuta la lógica de guardar
    }
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-b/createProductos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productos),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Obtener respuesta en texto para debug
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      console.log("Productos enviados:", productos); // Ver productos en consola
      const result = await response.json();
      console.log("Respuesta de la API:", result); // Ver respuesta en consola
      alert(result.message);
      window.location.reload();
    } catch (error) {
      console.error("Error al enviar los productos:", error);
      alert(`Error: ${error.message}`); // Mostrar error en una alerta
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

    // Agregar fórmulas para las columnas de totales después de crear la hoja
    plantillaData.forEach((_, index) => {
      const rowNumber = index + 2; // Las filas en Excel empiezan en 2 (después del header)
      
      // Fórmula para Total Peso Empaques (suma de columnas F, H, J, L, N)
      ws[`Q${rowNumber}`] = { f: `F${rowNumber}+H${rowNumber}+J${rowNumber}+L${rowNumber}+N${rowNumber}` };
      
      // Fórmula para Total Peso Producto (suma de columnas G, I, K, M, O)
      ws[`R${rowNumber}`] = { f: `G${rowNumber}+I${rowNumber}+K${rowNumber}+M${rowNumber}+O${rowNumber}` };
    });

    // Agregar headers para las columnas de totales
    ws['Q1'] = { v: 'Total Peso Empaques (kg)', t: 's' };
    ws['R1'] = { v: 'Total Peso Producto (kg)', t: 's' };

    // Actualizar el rango de la hoja para incluir las nuevas columnas
    const range = XLSX.utils.decode_range(ws['!ref']);
    range.e.c = 17; // Extender hasta la columna R (17)
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Configurar ancho de columnas
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
      { width: 15 }, // Fabricación
      { width: 20 }, // Total Peso Empaques
      { width: 20 }  // Total Peso Producto
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

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validar y procesar datos
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
          const fabricacion = row["Fabricación"] || row["fabricacion"] || "";

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

          // Campos calculados (opcionales, se calcularán automáticamente si no están presentes)
          const totalPesoEmpaquesExcel = row["Total Peso Empaques (kg)"] || row["totalPesoEmpaques"] || null;
          const totalPesoProductoExcel = row["Total Peso Producto (kg)"] || row["totalPesoProducto"] || null;

          // Validaciones de campos obligatorios
          if (!razonSocial || razonSocial.trim() === "") {
            erroresFila.push("Razón Social es requerida");
          }
          if (!marca || marca.trim() === "") {
            erroresFila.push("Marca es requerida");
          }
          if (!nombreGenerico || nombreGenerico.trim() === "") {
            erroresFila.push("Nombre Genérico es requerido");
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

          // Agregar validación para totales si están presentes
          if (totalPesoEmpaquesExcel !== null) {
            camposNumericos.push({ valor: totalPesoEmpaquesExcel, nombre: "Total Peso Empaques" });
          }
          if (totalPesoProductoExcel !== null) {
            camposNumericos.push({ valor: totalPesoProductoExcel, nombre: "Total Peso Producto" });
          }

          camposNumericos.forEach(campo => {
            const num = parseFloat(campo.valor);
            if (isNaN(num) || num < 0) {
              erroresFila.push(`${campo.nombre} debe ser un número mayor o igual a 0`);
            } else if (!Number.isInteger(num)) {
              erroresFila.push(`${campo.nombre} debe ser un número entero. Valor ingresado: ${campo.valor}`);
            }
          });

          // Verificar fabricación (dropdown)
          const fabricacionValida = ["Local", "Importado"];
          if (fabricacion && !fabricacionValida.includes(fabricacion)) {
            erroresFila.push(`Fabricación debe ser "Local" o "Importado"`);
          }

          if (erroresFila.length > 0) {
            errores.push(`Fila ${rowNumber}: ${erroresFila.join(", ")}`);
          } else {
            // Calcular totales automáticamente (usar valores del Excel si están presentes)
            const totalPesoEmpaques = totalPesoEmpaquesExcel !== null 
              ? parseFloat(totalPesoEmpaquesExcel) 
              : parseFloat(pesoEmpaqueComercialRX) + parseFloat(pesoEmpaqueComercialOTC) + 
                parseFloat(pesoEmpaqueInstitucional) + parseFloat(pesoEmpaqueIntrahospitalario) + 
                parseFloat(pesoEmpaqueMuestrasMedicas);
            
            const totalPesoProducto = totalPesoProductoExcel !== null 
              ? parseFloat(totalPesoProductoExcel)
              : parseFloat(pesoTotalComercialRX) + parseFloat(pesoTotalComercialOTC) + 
                parseFloat(pesoTotalInstitucional) + parseFloat(pesoTotalIntrahospitalario) + 
                parseFloat(pesoTotalMuestrasMedicas);

            productosValidados.push({
              id: productos.length + productosValidados.length + 1,
              idInformacionB,
              razonSocial: razonSocial.trim(),
              marca: marca.trim(),
              nombreGenerico: nombreGenerico.trim(),
              numeroRegistros: numeroRegistros.trim(),
              codigoEstandarDatos: codigoEstandar.trim(),
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
              fabricacion: fabricacion || "Local",
              totalPesoEmpaques: totalPesoEmpaques,
              totalPesoProducto: totalPesoProducto
            });
          }
        });

        // Mostrar errores si los hay
        if (errores.length > 0) {
          alert(`Se encontraron los siguientes errores:\n\n${errores.join("\n")}\n\nPor favor corrija los errores y vuelva a intentar.`);
          return;
        }

        if (productosValidados.length === 0) {
          alert("No se encontraron productos válidos en el archivo Excel.");
          return;
        }

        // Preguntar si quiere agregar o reemplazar
        const mensaje = `Se encontraron ${productosValidados.length} productos válidos.\n\n¿Desea agregarlos a la tabla actual?\n\n- Aceptar: Agregar productos\n- Cancelar: No cargar`;
        const proceder = window.confirm(mensaje);

        if (proceder) {
          // Agregar productos a la tabla existente
          const productosActualizados = [...productos, ...productosValidados];
          setProductos(productosActualizados);

          alert(`Se cargaron exitosamente ${productosValidados.length} productos.\n\nRecuerde guardar los cambios usando el botón "Guardar".`);
        }

      } catch (error) {
        alert(`Error al procesar el archivo Excel: ${error.message}\n\nAsegúrese de que el archivo tenga el formato correcto.`);
      }

      // Limpiar el input
      e.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
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
                {productos.map((producto, index) => (
                  <tr key={producto.idProductosB} className="border-t text-center">
                    <td className="p-2">{index+1}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "razonSocial", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.razonSocial}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "marca", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.marca}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "nombreGenerico", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.nombreGenerico}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "numeroRegistros", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.numeroRegistros}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "codigoEstandarDatos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.codigoEstandarDatos}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueComercialRX", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueComercialRX}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoTotalComercialRX", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalComercialRX}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueComercialOTC", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueComercialOTC}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoTotalComercialOTC", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalComercialOTC}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueInstitucional", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueInstitucional}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoTotalInstitucional", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalInstitucional}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueIntrahospitalario", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueIntrahospitalario}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoTotalIntrahospitalario", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalIntrahospitalario}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueMuestrasMedicas", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueMuestrasMedicas}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "pesoTotalMuestrasMedicas", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalMuestrasMedicas}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      {isEditable ? (
                        <select
                          className="border p-1 w-full"
                          value={producto.fabricacion || ""}
                          onChange={(e) => handleChange(index, "fabricacion", e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          <option value="Local">Local</option>
                          <option value="Importado">Importado</option>
                        </select>
                      ) : (
                        <div className="w-fit max-w-full p-1 border border-transparent bg-gray-100 cursor-not-allowed">
                          {producto.fabricacion}
                        </div>
                      )}
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "totalPesoEmpaques", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.totalPesoEmpaques}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={isEditable}
                        onBlur={(e) => handleChange(index, "totalPesoProducto", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.totalPesoProducto}
                      </div>
                    </td>
                    <td>
                      {!readonly && (
                        <button 
                          className={`px-4 py-1 rounded ${
                            isEditable 
                              ? "bg-red-500 hover:bg-red-700 text-white" 
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          onClick={() => setProductos(productos.filter((_, i) => i !== index))}
                          disabled={!isEditable}
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          {!readonly && (
            <button
              type="submit"
              className={`px-4 py-2 rounded mt-3 ${
                isEditable 
                  ? "bg-lightBlue-600 hover:bg-lightBlue-700 text-white" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isEditable}
            >
            Guardar
            </button>
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