import React from "react";
import Link from "next/link";
import CardTable from "components/Cards/CardVinculados.js";
import Admin from "layouts/Admin.js";

export default function Tables() {
  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          {/* Botón de acceso rápido a renovar formularios */}
          <div className="mb-4 flex justify-end">
            <Link href="/admin/renovar-formularios-b" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
