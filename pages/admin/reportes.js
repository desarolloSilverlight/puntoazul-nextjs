import React from "react";

// components

import CardLineChart from "components/Cards/CardLineChart.js";

// layout for page

import Admin from "layouts/Admin.js";

export default function Reportes() {
  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full xl:w-12/12 mb-12 xl:mb-0 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-blueGray-700">
            <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
              <div className="flex flex-wrap items-center">
                <div className="relative w-full max-w-full flex-grow flex-1">
                  <h6 className="uppercase text-blueGray-100 mb-1 text-xs font-semibold">
                    Reportes
                  </h6>
                  <h2 className="text-white text-xl font-semibold">Pagina en construccion</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Reportes.layout = Admin;
