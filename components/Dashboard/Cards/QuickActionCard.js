import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";

export default function QuickActionCard({ title, description, icon, color, link, badge }) {
  const colorClasses = {
    blue: {
      bg: "bg-lightBlue-600 hover:bg-lightBlue-700",
      bgLight: "bg-lightBlue-50",
      text: "text-lightBlue-600",
      border: "border-lightBlue-200"
    },
    green: {
      bg: "bg-emerald-600 hover:bg-emerald-700",
      bgLight: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200"
    },
    orange: {
      bg: "bg-orange-600 hover:bg-orange-700",
      bgLight: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200"
    },
    purple: {
      bg: "bg-purple-600 hover:bg-purple-700",
      bgLight: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200"
    },
    red: {
      bg: "bg-red-600 hover:bg-red-700",
      bgLight: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200"
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const CardContent = () => (
    <div className={`relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${colors.border} group cursor-pointer`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`${colors.bgLight} p-2 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
              <i className={`${icon} text-lg ${colors.text}`}></i>
            </div>
            
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-200">
                {title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {description}
              </p>
            </div>
          </div>
          
          {badge && badge > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
              {badge}
            </div>
          )}
        </div>
        
        <div className="mt-3 flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
          <span>Ir a la sección</span>
          <i className="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform duration-200"></i>
        </div>
      </div>
      
      {/* Efecto de hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-lg"></div>
    </div>
  );

  return link ? (
    <Link href={link}>
      <CardContent />
    </Link>
  ) : (
    <CardContent />
  );
}

QuickActionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'orange', 'purple', 'red']),
  link: PropTypes.string,
  badge: PropTypes.number
};

QuickActionCard.defaultProps = {
  color: 'blue'
};
