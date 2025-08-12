import React from "react";
import PropTypes from "prop-types";

export default function StatsCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    blue: {
      bg: "bg-lightBlue-500",
      text: "text-lightBlue-600",
      bgLight: "bg-lightBlue-50"
    },
    green: {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      bgLight: "bg-emerald-50"
    },
    orange: {
      bg: "bg-orange-500",
      text: "text-orange-600",
      bgLight: "bg-orange-50"
    },
    purple: {
      bg: "bg-purple-500",
      text: "text-purple-600",
      bgLight: "bg-purple-50"
    },
    red: {
      bg: "bg-red-500",
      text: "text-red-600",
      bgLight: "bg-red-50"
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Línea de color superior */}
      <div className={`h-1 ${colors.bg}`}></div>
      
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
              {title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className={`${colors.bgLight} p-3 rounded-full`}>
            <i className={`${icon} text-2xl ${colors.text}`}></i>
          </div>
        </div>
      </div>
      
      {/* Efecto de hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'orange', 'purple', 'red'])
};

StatsCard.defaultProps = {
  color: 'blue'
};
