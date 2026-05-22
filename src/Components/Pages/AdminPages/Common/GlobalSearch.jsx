import { useState, useRef, useEffect } from "react";
import { X, Search, User, Phone, ChevronRight } from "lucide-react";
import { useGlobalSearch } from "../contexts/GlobalSearchContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const GlobalSearch = ({ onResultClick }) => {
  const { searchQuery, setSearchQuery } = useGlobalSearch();

  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const navigate = useNavigate();

  // ─────────────────────────────────────────────────────────────
  // Close on outside click
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Debounced Search
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery?.trim();

    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchResults(q);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // API Call
  // ─────────────────────────────────────────────────────────────
  const fetchResults = async (query) => {
    const token = localStorage.getItem("adminToken");

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/global-search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            search: query,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const result = await response.json();

      const data = result?.data?.accountInformation || [];

      const normalized = normalizeRows(data);

      setResults(normalized);
      setOpen(true);

    } catch (error) {
      console.error("Global search error:", error);
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Normalize API Data
  // ─────────────────────────────────────────────────────────────
  const normalizeRows = (data = []) => {
    const seen = new Set();
    const rows = [];

    data.forEach((item) => {
      const parentsList =
        item?.parents?.length
          ? item.parents
          : item?.parent?.parents?.length
            ? item.parent.parents
            : [];

      const studentsList =
        item?.students?.length
          ? item.students
          : item?.parent?.students?.length
            ? item.parent.students
            : item?.student
              ? [item.student]
              : [];

      const navigateId =
        item?.parent?.id ||
        item?.id ||
        item?.bookingId ||
        item?.parent?.bookingId ||
        null;

      const parentPhone = parentsList?.[0]?.parentPhoneNumber || "";

      if (studentsList.length === 0) {
        const key = `parent-${parentPhone}`;

        if (seen.has(key)) return;

        seen.add(key);

        rows.push({
          _sourceRow: item,
          _parents: parentsList,
          _student: null,
          _navigateId: navigateId,
          _rowId: key,
        });
      } else {
        studentsList.forEach((student) => {
          const key = `${student?.studentFirstName || ""}-${student?.studentLastName || ""
            }-${parentPhone}`;

          if (seen.has(key)) return;

          seen.add(key);

          rows.push({
            _sourceRow: item,
            _parents: parentsList,
            _student: student,
            _navigateId: navigateId,
            _rowId: key,
          });
        });
      }
    });

    return rows.slice(0, 10);
  };

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  const getParentName = (row) => {
    const parent = row?._parents?.[0];

    if (!parent) return "—";

    return `${parent?.parentFirstName || ""} ${parent?.parentLastName || ""
      }`.trim();
  };

  const getStudentName = (row) => {
    if (!row?._student) return null;

    return `${row._student?.studentFirstName || ""} ${row._student?.studentLastName || ""
      }`.trim();
  };

  const getPhone = (row) => {
    return row?._parents?.[0]?.parentPhoneNumber || "—";
  };

  const initials = (name) => {
    return (name || "?")
      .split(" ")
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // ─────────────────────────────────────────────────────────────
  // Handle Select
  // ─────────────────────────────────────────────────────────────
  const handleSelect = (row) => {
    console.log('row', row)
    const serviceType =
      row?._sourceRow?.serviceType?.toLowerCase() || "";

    let id = null;

    // Different IDs according to module
    if (
      serviceType.includes("one-to-one") ||
      serviceType.includes("one to one")
    ) {
      id =
        row?._sourceRow?.lead?.id ||
        row?._sourceRow?.id;

    } else if (serviceType.includes("birthday party")) {
      id =
        row?._sourceRow?.lead?.id ||
        row?._sourceRow?.id;

    } else {
      id = row?._navigateId;
    }

    if (!id) return;

    const studentName = getStudentName(row);
    const parentName = getParentName(row);

    setSearchQuery(studentName || parentName);

    setOpen(false);

    if (onResultClick) {
      onResultClick(row._sourceRow, row._student);
      return;
    }

    let targetRoute =
      "/weekly-classes/all-members/account-info";

    if (
      serviceType.includes("one-to-one") ||
      serviceType.includes("one to one")
    ) {
      targetRoute =
        "/one-to-one/sales/account-information";

    } else if (serviceType.includes("birthday party")) {
      targetRoute =
        "/birthday-party/sales/account-information";

    } else if (serviceType.includes("holiday camp")) {
      targetRoute =
        "/holiday-camp/members/account-information";

    } else if (serviceType.includes("weekly class trial")) {
      targetRoute =
        "/weekly-classes/trial/find-a-class/book-a-free-trial/account-info/list";
    }

    navigate(`${targetRoute}?id=${id}`, {
      state: { itemId: id },
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Clear Search
  // ─────────────────────────────────────────────────────────────
  const clear = () => {
    setSearchQuery("");
    setResults([]);
    setOpen(false);

    inputRef.current?.focus();
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      className="relative w-full sm:w-[280px] lg:w-[200px] xl:w-[250px] 2xl:w-[400px]"
    >
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search parent, student, phone..."
          className="w-full px-4 py-2.5 pl-9 pr-8 border border-[#E2E1E5] rounded-xl bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {searchQuery && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E2E1E5] rounded-2xl shadow-xl z-50 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No results found
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto">
              {results.map((row, index) => {
                const parentName = getParentName(row);
                const studentName = getStudentName(row);
                const phone = getPhone(row);

                return (
                  <button
                    key={row._rowId || index}
                    onClick={() => handleSelect(row)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-sm font-bold">
                      {initials(parentName)}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {parentName}
                      </p>

                      {studentName && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3 text-gray-400" />

                          <span className="text-xs text-gray-500 truncate">
                            {studentName}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-gray-400" />

                        <span className="text-xs text-gray-400">
                          {phone}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;