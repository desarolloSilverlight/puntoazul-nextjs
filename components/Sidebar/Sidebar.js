import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";

export default function Sidebar() {
  const [permisos, setPermisos] = useState([]); // Estado para almacenar los permisos del usuario
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Lista de accesos totales disponibles en el frontend
  const ACCESOS_DISPONIBLES = [
    { nombre: "Formulario Linea Base", ruta: "/admin/literalf", icono: "fas fa-clipboard-list" },
    { nombre: "Formulario Literal B", ruta: "/admin/literalb", icono: "fas fa-clipboard-list" },
    { nombre: "Enviar Formulario", ruta: "/admin/correos", icono: "fas fa-envelope" },
    { nombre: "Validar Linea Base", ruta: "/admin/validarf", icono: "fas fa-clipboard-list" },
    { nombre: "Validar Literal B", ruta: "/admin/validarb", icono: "fas fa-clipboard-list" },
    { nombre: "Reportes", ruta: "/admin/reportes", icono: "fas fa-table" },
    { nombre: "Usuarios", ruta: "/admin/usuarios", icono: "fas fa-user-circle" },
    { nombre: "Perfiles", ruta: "/admin/perfiles", icono: "fas fa-user-tie" },
    { nombre: "Asociados", ruta: "/admin/asociados", icono: "fas fa-people-arrows" },
    { nombre: "Vinculados", ruta: "/admin/vinculados", icono: "fas fa-people-arrows" },
    { nombre: "Parametros", ruta: "/admin/parametros", icono: "fas fa-wand-magic" },
  ];

  // Fetch para obtener los permisos del usuario o perfil actual
  useEffect(() => {
    const fetchPermisos = async () => {
      try {
        let nombre = localStorage.getItem("perfil");
        if (!nombre) {
          // Si no hay perfil, redirigir al login
          router.push("/auth/login");
          return;
        }
        const response = await fetch("https://nestbackend.fidare.com/users/accesos?idPerfil="+nombre, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Permisos obtenidos:", data); // Verifica los permisos obtenidos
        setPermisos(data.map((item) => item.permiso)); // Extraer solo los nombres de los permisos
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermisos();
  }, [router]);

  const handleLogout = async () => {
    try {
      const response = await fetch("https://nestbackend.fidare.com/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cerrar sesión");
      }
      localStorage.clear();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return <p>Cargando permisos...</p>;
  }

  if (error) {
    return <p>Error al cargar permisos: {error}</p>;
  }

  return (
    <>
      <nav className="md:left-0 md:block md:fixed md:top-0 md:bottom-0 md:overflow-y-auto md:flex-row md:flex-nowrap md:overflow-hidden shadow-xl bg-lightBlue-100 flex flex-wrap items-center justify-between relative md:w-64 z-10 py-4 px-6">
        <div className="md:flex-col md:items-stretch md:min-h-full md:flex-nowrap px-0 flex flex-wrap items-center justify-between w-full mx-auto">
          {/* Brand */}
          <div className="flex justify-center items-center">
            <Link legacyBehavior href="/admin/dashboard">
              <Image
                src="/Logo_PuntoAzul_Horizontal.png"
                alt="Logo Punto Azul"
                width={250}
                height={125}
              />            
            </Link>
          </div>

          {/* Navigation */}
          <ul className="md:flex-col md:min-w-full flex flex-col list-none">
            {ACCESOS_DISPONIBLES.map((acceso) =>
              permisos.includes(acceso.nombre) ? ( // Mostrar solo si el permiso está en la lista
                <li key={acceso.nombre} className="items-center">
                  <Link legacyBehavior href={acceso.ruta}>
                    <button
                      className="text-blueGray-700 hover:text-blueGray-500 text-xs uppercase py-3 font-bold block"
                    >
                      <i className={`${acceso.icono} text-blueGray-400 mr-2 text-sm`}></i>{" "}
                      {acceso.nombre}
                    </button>
                  </Link>
                </li>
              ) : null
            )}
          </ul>

          {/* Logout */}
          <ul className="md:flex-col md:min-w-full flex flex-col list-none md:mb-4">
            <li className="inline-flex">
              <button
                onClick={handleLogout}
                className="text-blueGray-700 hover:text-blueGray-500 text-xs uppercase py-3 font-bold block"
              >
                <i className="fas fa-circle-notch text-blueGray-400 mr-2 text-sm"></i>{" "}
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}