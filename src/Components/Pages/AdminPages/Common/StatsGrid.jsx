// src/components/StatsGrid.jsx
import React from "react";

const StatsGrid = ({ stats, variant = "A" }) => {
  // Grid columns for different screen sizes
  const gridCols =
    variant === "A"
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4 mb-5`}>
      {stats.map((item, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl shadow-sm px-3 py-6 flex items-center gap-4 w-full max-w-full overflow-hidden"
        >
          {/* Icon Section */}
          {variant === "A" ? (
            <div className="rounded-full flex items-center justify-center flex-shrink-0">
              <img
                src={item.icon}
                className="w-6 h-6 object-contain"
                alt={item.title}
              />
            </div>
          ) : (
            <div
              className={`min-w-[50px] min-h-[50px] p-3 rounded-full flex items-center justify-center flex-shrink-0 ${item.bg}`}
            >
              <img
                src={item.icon}
                className="w-6 h-6 object-contain"
                alt={item.title}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-col w-full overflow-hidden">
            {/* Title */}
            <p
              className={`leading-tight truncate ${
                variant === "A" ? "text-[14px] text-gray-500" : "text-sm text-gray-500"
              }`}
              title={item.title}
            >
              {item.title}
            </p>

            <div className="flex gap-2 items-center flex-wrap ">
              <div className="text-[16px] font-semibold text-[#282829] flex items-center flex-wrap gap-1 ">
                {item.value && (
                  <span className="font-semibold truncate" title={item.value}>
                    {item.value}
                  </span>
                )}

                {item.subValue && (
                  <span
                    className="text-[14px] font-normal text-green-500 truncate whitespace-nowrap"
                    title={item.subValue}
                  >
                    {item.subValue}
                  </span>
                )}
              </div>

              {/* Change Tag */}
              {item.change && (
                <span
                  className={`text-xs font-medium mt-1 flex-shrink-0 ${item.color || ""}`}
                  title={item.change}
                >
                  {item.change}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;
