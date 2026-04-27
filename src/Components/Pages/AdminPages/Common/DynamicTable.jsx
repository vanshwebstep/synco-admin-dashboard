// src/components/DynamicTable.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { useGlobalSearch } from "../contexts/GlobalSearchContext";

const DynamicTable = ({
  columns,
  data = [],
  from,
  selectedIds = [],
  setSelectedStudents,
  onRowClick,
  isFilterApplied,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { searchQuery } = useGlobalSearch();
  /* =============================
     Selection
  ============================== */
  const toggleSelect = (id) => {
    if (!setSelectedStudents) return;

    setSelectedStudents((prev = []) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  /* =============================
     Flatten Data
  ============================== */
  const flattenedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.flatMap((item) =>
      (item?.students || []).map((student, index) => ({
        ...item,
        parent: item,
        student,
        studentIndex: index,
      }))
    );
  }, [data]);

  /* =============================
     Group Data
  ============================== */
  const groupedData = useMemo(() => {
    const grouped = {};

    flattenedData.forEach((row) => {
      const key =
        row?.bookingId ||
        row?.id ||
        row?.parent?.bookingId;

      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = {
          ...row,
          students: [],
        };
      }

      if (row.student) {
        grouped[key].students.push(row.student);
      }
    });

    return Object.values(grouped);
  }, [flattenedData]);

  const useGrouped =
    ["request to cancel", "full cancel", "all cancel"].includes(from);

  const finalData = useGrouped ? groupedData : flattenedData;
  const searchableKeys = ["name", "email", "phone"]; // customize

  const searchedData = useMemo(() => {
    if (!searchQuery) return finalData;

    const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

    return finalData.filter((row) => {
      const venueName = (row?.venue?.name || row?.address || row?.parent?.venue?.name || row?.parent?.address || "").toLowerCase();
      
      const searchString = `${row?.student?.studentFirstName || ""} ${row?.student?.studentLastName || ""} ${row?.student?.age || ""} ${venueName}`.toLowerCase();

      return queryWords.every(word => searchString.includes(word));
    });
  }, [finalData, searchQuery]);
  /* =============================
     Pagination
  ============================== */
  const totalItems = searchedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * rowsPerPage;

  const paginatedData = useMemo(() => {
    return searchedData.slice(startIndex, startIndex + rowsPerPage);
  }, [searchedData, startIndex, rowsPerPage]);

  // Keep page in range
  useEffect(() => {
    if (currentPage !== validCurrentPage) {
      setCurrentPage(validCurrentPage);
    }
  }, [validCurrentPage, currentPage]);

  // Reset on filter
  useEffect(() => {
    if (isFilterApplied) {
      setCurrentPage(1);
    }
  }, [isFilterApplied]);

  // Reset when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  /* =============================
     Render
  ============================== */
  return (
    <div className="mt-5 w-full rounded-3xl overflow-hidden border border-[#E2E1E5]">
      <div className="overflow-auto">
        <table className="min-w-full bg-white text-sm border-separate border-spacing-0">
          {/* HEADER */}
          <thead className="bg-[#F5F5F5]">
            <tr className="font-semibold">
              {columns.map((col, idx) => {
                const header = col.header.toLowerCase();
                const shouldCenter = header.includes("status");

                return (
                  <th
                    key={idx}
                    className={`p-4 text-[#717073] whitespace-nowrap ${shouldCenter ? "text-center" : "text-left"
                      }`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const uniqueId =
                  row?.id ||
                  row?.bookingId ||
                  `row-${startIndex + index}`;

                const trKey = row?.studentIndex !== undefined
                  ? `${uniqueId}-student-${row.studentIndex}`
                  : `${uniqueId}-idx-${index}`;

                const isSelected =
                  selectedIds?.includes(uniqueId);

                return (
                  <tr
                    key={trKey}
                    onClick={
                      onRowClick
                        ? () => onRowClick(row, from)
                        : undefined
                    }
                    className="border-t font-semibold text-[#282829] border-[#EFEEF2] hover:bg-gray-50"
                  >
                    {columns.map((col, cIdx) => {
                      /* Selectable Column */
                      if (col.selectable) {
                        return (
                          <td key={cIdx} className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(uniqueId);
                                }}
                                className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${isSelected
                                  ? "bg-blue-500 border-blue-500 text-white"
                                  : "border-gray-300 text-transparent"
                                  }`}
                              >
                                {isSelected && <Check size={14} />}
                              </button>

                              <span>
                                {col.header === "Parent Name"
                                  ? `${row?.parents?.[0]?.parentFirstName || ""} ${row?.parents?.[0]?.parentLastName || ""
                                    }`.trim() || "N/A"
                                  : `${row?.student?.studentFirstName || ""} ${row?.student?.studentLastName || ""
                                    }`.trim() || "N/A"}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      /* Custom Render */
                      if (col.render) {
                        return (
                          <td key={cIdx} className="p-4 whitespace-nowrap">
                            {col.render(
                              row,                   // full row
                              row?.student || null,  // student
                              row?.parent || null    // parent
                            )}
                          </td>
                        );
                      }

                      /* Default Cell */
                      return (
                        <td key={cIdx} className="p-4 whitespace-nowrap">
                          {row?.[col.key] ??
                            row?.student?.[col.key] ??
                            "-"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center p-4 text-gray-500"
                >
                  Data not found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-3 sm:mb-0">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) =>
                setRowsPerPage(Number(e.target.value))
              }
              className="border rounded-md px-2 py-1"
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>

            <span className="ml-2">
              {startIndex + 1} -{" "}
              {Math.min(startIndex + rowsPerPage, totalItems)} of{" "}
              {totalItems}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setCurrentPage((p) => Math.max(p - 1, 1))
              }
              disabled={validCurrentPage === 1}
              className="px-3 py-1 rounded-md border hover:bg-gray-100"
            >
              Prev
            </button>

            <span>
              {validCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(p + 1, totalPages)
                )
              }
              disabled={validCurrentPage === totalPages}
              className="px-3 py-1 rounded-md border hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTable;