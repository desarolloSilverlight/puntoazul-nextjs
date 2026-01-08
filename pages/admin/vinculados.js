import React from "react";
import Link from "next/link";
import CardTable from "components/Cards/CardVinculados.js";
import Admin from "layouts/Admin.js";

export default function Tables() {
  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          {/* Botón de acceso rápido a limpieza */}
          <div className="mb-4 flex justify-end">
            <Link href="/admin/limpiar-formularios" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Renovar Formularios
            </Link>
          </div>
          <CardTable color="light" />
        </div>
      </div>
    </>
  );
}

Tables.layout = Admin;
