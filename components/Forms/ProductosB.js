import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  let idInformacionB = localStorage.getItem("idInformacionB");
  let estado = localStorage.getItem("estadoInformacionB");
  const [productos, setProductos] = useState([]); // Estado para los productos
  const [isOpen, setIsOpen] = useState(false); // Estado para el modal

  // Obtener productos desde el backend al cargar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-b/getProdValidarB/${idInformacionB}`, {
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
  }, [idInformacionB]);

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
        pesoEmpaqueComercialRX: "",
        pesoTotalComercialRX: "",
        pesoEmpaqueComercialOTC: "",
        pesoTotalComercialOTC: "",
        pesoEmpaqueInstitucional: "",
        pesoTotalInstitucional: "",
        pesoEmpaqueIntrahospitalario: "",
        pesoTotalIntrahospitalario: "",
        pesoEmpaqueMuestrasMedicas: "",
        pesoTotalMuestrasMedicas: "",
        fabricacion: "",
        totalPesoEmpaques: "",
        totalPesoProducto: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];

    // Reemplazar comas por puntos en los valores ingresados
    const sanitizedValue = value.replace(",", ".");
  
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
    // Mostrar un alert de confirmación
    const isConfirmed = window.confirm("¿Estás seguro de que los datos ingresados son correctos?");
    if (!isConfirmed) {
      return; // Si el usuario cancela, no se ejecuta la lógica de guardar
    }
    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-b/createProductos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productos),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Obtener respuesta en texto para debug
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API:", result); // Ver respuesta en consola
      alert(result.message);
      window.location.reload();
    } catch (error) {
      console.error("Error al enviar los productos:", error);
      alert(`Error: ${error.message}`); // Mostrar error en una alerta
    }
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
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded" onClick={agregarProducto}>
            Agregar Producto
          </button>
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded">
            Cargar Informacion
          </button>
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded">
            Descargar Excel
          </button>
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en gramos
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
                  <th colSpan={2} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Fabricacion</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
                  <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DEL PRODUCTO</th>
                </tr>
                <tr className="bg-gray-200">
                  <th colSpan={4} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Comercial</th>
                  <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Institucional</th>
                  <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Intrahospitalario</th>
                  <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Muestras médicas</th>
                  <th colSpan={1} rowSpan={3} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Local</th>
                  <th colSpan={1} rowSpan={3} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Importado</th>
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
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "razonSocial", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.razonSocial}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "marca", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.marca}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "nombreGenerico", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.nombreGenerico}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "numeroRegistros", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.numeroRegistros}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "codigoEstandarDatos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.codigoEstandarDatos}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueComercialRX", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueComercialRX}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoTotalComercialRX", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalComercialRX}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueComercialOTC", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueComercialOTC}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoTotalComercialOTC", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalComercialOTC}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueInstitucional", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueInstitucional}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoTotalInstitucional", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalInstitucional}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueIntrahospitalario", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueIntrahospitalario}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoTotalIntrahospitalario", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalIntrahospitalario}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoEmpaqueMuestrasMedicas", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoEmpaqueMuestrasMedicas}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "pesoTotalMuestrasMedicas", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.pesoTotalMuestrasMedicas}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "fabricacion", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.fabricacion}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "totalPesoEmpaques", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.totalPesoEmpaques}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "totalPesoProducto", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.totalPesoProducto}
                      </div>
                    </td>
                    <td>
                      <button className="bg-red-500 text-white px-4 py-1 rounded" onClick={() => setProductos(productos.filter((_, i) => i !== index))}>
                        Eliminar
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={estado == "Aprobado"} // Bloquear si el estado no es "Aprobado" o si isSaveDisabled es true
          >
          Guardar
          </button>
        </form>
      </div>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-5 rounded-lg shadow-lg max-h-260-px overflow-y-auto">
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
        </div>
      )}
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};