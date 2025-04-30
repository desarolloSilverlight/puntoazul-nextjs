import React, { useState, useEffect } from "react";

export default function CardValidarF({ color }) {
  const [clientes, setClientes] = useState([]); // Clientes con formulario F pendiente
  const [selectedCliente, setSelectedCliente] = useState(null); // Cliente seleccionado
  const [activeTab, setActiveTab] = useState("empaques"); // Pestaña activa
  const [empaques, setEmpaques] = useState([]); // Resumen de empaques
  const [plasticos, setPlasticos] = useState([]); // Resumen de plásticos

  // Obtener clientes con formulario F pendiente
  const fetchClientes = async () => {
    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-f/getClientesPendientes", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Clientes obtenidos:", data); // Verifica los clientes obtenidos
      setClientes(data);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };
  useEffect(() => {

    fetchClientes();
  }, []);

  // Manejar selección de cliente
  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);

    try {
      // Obtener empaques primarios
      const primariosResponse = await fetch(`https://nestbackend.fidare.com/informacion-f/getEmpaquesPrimarios/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!primariosResponse.ok) {
        throw new Error(`Error ${primariosResponse.status}: ${primariosResponse.statusText}`);
      }

      const primariosData = await primariosResponse.json();

      // Obtener empaques secundarios
      const secundariosResponse = await fetch(`https://nestbackend.fidare.com/informacion-f/getEmpaquesSecundarios/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!secundariosResponse.ok) {
        throw new Error(`Error ${secundariosResponse.status}: ${secundariosResponse.statusText}`);
      }

      const secundariosData = await secundariosResponse.json();

      // Calcular totales y porcentajes
      const empaquesData = primariosData.map((primario, index) => {
        const secundario = secundariosData[index] || {};
        const totalPrimarios =
          parseFloat(primario.papel || 0) +
          parseFloat(primario.metal_ferrosos || 0) +
          parseFloat(primario.metal_no_ferrososs || 0) +
          parseFloat(primario.carton || 0) +
          parseFloat(primario.vidrios || 0);

        const totalSecundarios =
          parseFloat(secundario.papel || 0) +
          parseFloat(secundario.metal_ferrosos || 0) +
          parseFloat(secundario.metal_no_ferrososs || 0) +
          parseFloat(secundario.carton || 0) +
          parseFloat(secundario.vidrios || 0);

        const total = totalPrimarios + totalSecundarios;
        const porcPrimarios = total > 0 ? ((totalPrimarios / total) * 100).toFixed(2) : 0;
        const porcSecundarios = total > 0 ? ((totalSecundarios / total) * 100).toFixed(2) : 0;
        const totalMetalPrimarios = parseFloat(primario.metal_ferrosos || 0) + parseFloat(primario.metal_no_ferrososs || 0);
        const totalMetalSecundarios = parseFloat(secundario.metal_ferrosos || 0) + parseFloat(secundario.metal_no_ferrososs || 0);

        return {
          razonSocial: primario.empresa || secundario.empresa,
          papelPrimarios: primario.papel || 0,
          metalPrimarios: totalMetalPrimarios || 0,
          cartonPrimarios: primario.carton || 0,
          vidrioPrimarios: primario.vidrios || 0,
          papelSecundarios: secundario.papel || 0,
          metalSecundarios: totalMetalSecundarios || 0,
          cartonSecundarios: secundario.carton || 0,
          vidrioSecundarios: secundario.vidrios || 0,
          total,
          porcPrimarios,
          porcSecundarios,
        };
      });

      setEmpaques(empaquesData);

      // Obtener resumen de plásticos
      const plasticosResponse = await fetch(`https://nestbackend.fidare.com/informacion-f/getEmpaquesPlasticos/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!plasticosResponse.ok) {
        throw new Error(`Error ${plasticosResponse.status}: ${plasticosResponse.statusText}`);
      }

      const plasticosData = await plasticosResponse.json();
      console.log("Resumen de plásticos:", plasticosData); // Verifica los datos de plásticos
      setPlasticos(plasticosData);
    } catch (error) {
      console.error("Error al obtener los datos del cliente:", error);
    }
  };

  // Manejar acción de firmar
  const handleFirmar = async () => {
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Aprobado" }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("El formulario ha sido aprobado.");
      setSelectedCliente(null); // Volver a la lista de clientes
      fetchClientes();
    } catch (error) {
      console.error("Error al aprobar el formulario:", error);
      alert("Hubo un error al aprobar el formulario.");
    }
  };

  // Manejar acción de rechazar
  const handleRechazar = async () => {
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Rechazado" }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("El formulario ha sido rechazado.");
      setSelectedCliente(null); // Volver a la lista de clientes
      fetchClientes();
    } catch (error) {
      console.error("Error al rechazar el formulario:", error);
      alert("Hubo un error al rechazar el formulario.");
    }
  };

  return (
    <div
      className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${
        color === "light" ? "bg-white" : "bg-blueGray-700 text-white"
      }`}
    >
      {!selectedCliente ? (
        <>
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <h3 className="text-lg font-semibold flex items-center">Validacion Literal F</h3>
        </div>
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Razón Social</th>
                <th className="p-2">NIT</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.idInformacionF} className="border-t text-center">
                  <td className="p-2">{cliente.nombre}</td>
                  <td className="p-2">{cliente.nit}</td>
                  <td className="p-2">
                    <button
                      className="bg-lightBlue-600 text-white font-bold text-xs px-4 py-2 rounded shadow hover:shadow-md"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      Validar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <button
              className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg ${activeTab === "empaques" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
              onClick={() => setActiveTab("empaques")}
            >
              Empaques
            </button>
            <button
              className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg ${activeTab === "plasticos" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
              onClick={() => setActiveTab("plasticos")}
            >
              Plásticos
            </button>
          </div>

          {activeTab === "empaques" ? (
            <div>
            <div className="w-full overflow-x-auto p-4">
              <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Razón Social
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Papel (Primarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Metal (Primarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Cartón (Primarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Vidrio (Primarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Papel (Secundarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Metal (Secundarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Cartón (Secundarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Vidrio (Secundarios)
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      %Primarios
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      %Secundarios
                    </th>
                    <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {empaques.map((empaque, index) => (
                    <tr key={index} className="border-t text-center">
                      <td className="p-2 border border-gray-300">{empaque.razonSocial}</td>
                      <td className="p-2 border border-gray-300">{empaque.papelPrimarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.metalPrimarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.cartonPrimarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.vidrioPrimarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.papelSecundarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.metalSecundarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.cartonSecundarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.vidrioSecundarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.porcPrimarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.porcSecundarios}</td>
                      <td className="p-2 border border-gray-300">{empaque.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          ) : (
            <div>
              <div className="w-full overflow-x-auto p-4">
              <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Empresa Titular</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Producto</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso Unitario (g)</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Unidades</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">HDP</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PVC</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">LDPE</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PP</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PS</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Liquidos</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Otros Productos</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Construccion</th>
                    <th rowSpan="3" colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {plasticos.map((plastico, index) => {
                    // Convertir las cadenas JSON en objetos
                    const liquidos = JSON.parse(plastico.liquidos || "{}");
                    const otros = JSON.parse(plastico.otros || "{}");
                    const construccion = JSON.parse(plastico.construccion || "{}");
                    
                    // Calcular totales por tipo de plástico
                    const totalPet = parseFloat(liquidos.PET || 0) + parseFloat(otros.PET || 0) + parseFloat(construccion.PET || 0);
                    const totalHdpe = parseFloat(liquidos.HDPE || 0) + parseFloat(otros.HDPE || 0) + parseFloat(construccion.HDPE || 0);
                    const totalPvc = parseFloat(liquidos.PVC || 0) + parseFloat(otros.PVC || 0) + parseFloat(construccion.PVC || 0);
                    const totalLdpe = parseFloat(liquidos.LDPE || 0) + parseFloat(otros.LDPE || 0) + parseFloat(construccion.LDPE || 0);
                    const totalPp = parseFloat(liquidos.PP || 0) + parseFloat(otros.PP || 0) + parseFloat(construccion.PP || 0);
                    const totalPs = parseFloat(liquidos.PS || 0) + parseFloat(otros.PS || 0) + parseFloat(construccion.PS || 0);
                    const totalOtros = parseFloat(liquidos.Otros || 0) + parseFloat(otros.Otros || 0) + parseFloat(construccion.Otros || 0);

                    // Calcular totales por categoría
                    const totalLiquidos =
                      parseFloat(liquidos.PET || 0) +
                      parseFloat(liquidos.HDPE || 0) +
                      parseFloat(liquidos.PVC || 0) +
                      parseFloat(liquidos.LDPE || 0) +
                      parseFloat(liquidos.PP || 0) +
                      parseFloat(liquidos.PS || 0) +
                      parseFloat(liquidos.Otros || 0);

                    const totalOtrosProductos =
                      parseFloat(otros.PET || 0) +
                      parseFloat(otros.HDPE || 0) +
                      parseFloat(otros.PVC || 0) +
                      parseFloat(otros.LDPE || 0) +
                      parseFloat(otros.PP || 0) +
                      parseFloat(otros.PS || 0) +
                      parseFloat(otros.Otros || 0);

                    const totalConstruccion =
                      parseFloat(construccion.PET || 0) +
                      parseFloat(construccion.HDPE || 0) +
                      parseFloat(construccion.PVC || 0) +
                      parseFloat(construccion.LDPE || 0) +
                      parseFloat(construccion.PP || 0) +
                      parseFloat(construccion.PS || 0) +
                      parseFloat(construccion.Otros || 0);

                    // Calcular el total general
                    const total = totalLiquidos + totalOtrosProductos + totalConstruccion;

                    return (
                      <tr key={index} className="border-t text-center">
                        <td className="p-2 border border-gray-300">{plastico.empresa}</td>
                        <td className="p-2 border border-gray-300">{plastico.nombre_producto}</td>
                        <td className="p-2 border border-gray-300">{plastico.peso}</td>
                        <td className="p-2 border border-gray-300">{plastico.unidades}</td>
                        <td className="p-2 border border-gray-300">{ totalPet || 0}</td>
                        <td className="p-2 border border-gray-300">{ totalHdpe || 0}</td>
                        <td className="p-2 border border-gray-300">{ totalPvc || 0}</td>
                        <td className="p-2 border border-gray-300">{ totalLdpe || 0}</td>
                        <td className="p-2 border border-gray-300">{ totalPp || 0}</td>
                        <td className="p-2 border border-gray-300">{ totalPs || 0}</td>
                        <td className="p-2 border border-gray-300">{ totalOtros || 0}</td>
                        <td className="p-2 border border-gray-300">{totalLiquidos}</td>
                        <td className="p-2 border border-gray-300">{totalOtrosProductos}</td>
                        <td className="p-2 border border-gray-300">{totalConstruccion}</td>
                        <td className="p-2 border border-gray-300">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}

          <div className=" flex gap-2 p-4">
            <button className="bg-green text-white mr-3 px-4 py-2 rounded" onClick={handleFirmar}>
              Firmar
            </button>
            <button className="bg-orange-500 text-white mr-3 px-4 py-2 rounded" onClick={handleRechazar}>
              Rechazar
            </button>
            <button className="bg-blueGray-600 text-white px-4 py-2 rounded" onClick={() => setSelectedCliente(null)}>
              Atrás
            </button>
          </div>
        </>
      )}
    </div>
  );
}