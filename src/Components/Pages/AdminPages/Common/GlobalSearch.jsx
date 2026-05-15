import { useState, useRef, useEffect, useMemo } from "react";
import { X, Search, User, Phone, ChevronRight } from "lucide-react";
import { useGlobalSearch } from "../contexts/GlobalSearchContext";
import { useNavigate } from "react-router-dom";

const GlobalSearch = ({ onResultClick }) => {
  const { searchQuery, setSearchQuery, registeredData } = useGlobalSearch();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // ── Close on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Expand registeredData into one row per UNIQUE student ──────────
  // Dedup key = studentFirstName+studentLastName+parentPhone
  // This ensures same student appearing in multiple bookings shows only ONCE
  const expandedRows = useMemo(() => {
    const seenStudentKeys = new Set();
    const rows = [];

    registeredData.forEach((item) => {
      const parentsList =
        item?.parents?.length
          ? item.parents
          : item?.parent?.parents?.length
          ? item.parent.parents
          : [];

      // Best id to navigate to: prefer parent-level id over booking id
      // because account-info page expects parent/member id
      const navigateId =
        item?.parent?.id ||
        item?.id ||
        item?.parent?.bookingId ||
        item?.bookingId ||
        null;

      const studentsList = item?.students?.length
        ? item.students
        : item?.parent?.students?.length
        ? item.parent.students
        : item?.student
        ? [item.student]
        : [];

      const parentPhone = parentsList[0]?.parentPhoneNumber || "";
      const parentEmail = parentsList[0]?.parentEmail || "";
      // Unique parent identity (for parent-only rows dedup)
      const parentKey = parentPhone || parentEmail;

      if (studentsList.length === 0) {
        if (parentKey && seenStudentKeys.has(`parent-${parentKey}`)) return;
        if (parentKey) seenStudentKeys.add(`parent-${parentKey}`);
        rows.push({
          _sourceRow: item,
          _parents: parentsList,
          _student: null,
          _navigateId: navigateId,
          _rowId: navigateId || Math.random(),
        });
      } else {
        studentsList.forEach((student) => {
          const studentKey = [
            (student?.studentFirstName || "").toLowerCase(),
            (student?.studentLastName || "").toLowerCase(),
            parentPhone,
          ].join("|");

          // Skip duplicate student entries (same student in multiple bookings)
          if (seenStudentKeys.has(studentKey)) return;
          seenStudentKeys.add(studentKey);

          rows.push({
            _sourceRow: item,
            _parents: parentsList,
            _student: student,
            _navigateId: navigateId,
            _rowId: studentKey,
          });
        });
      }
    });

    return rows;
  }, [registeredData]);

  // ── Filter results ──────────────────────────────────────────────
  const results = useMemo(() => {
    const q = searchQuery?.trim();
    if (!q || q.length < 2) return [];

    const queryWords = q.toLowerCase().split(/\s+/).filter(Boolean);

    return expandedRows
      .filter((row) => {
        const { _parents, _student } = row;

        // ── phones ──────────────────────────────────────────────
        const normalizedPhones = _parents
          .map((p) => (p?.parentPhoneNumber || "").replace(/[^\d]/g, ""))
          .join(" ");

        // ── parent info ─────────────────────────────────────────
        const parentInfo = _parents
          .map((p) =>
            [p?.parentFirstName, p?.parentLastName, p?.parentEmail]
              .filter(Boolean)
              .join(" ")
          )
          .join(" ")
          .toLowerCase();

        // ── student info ────────────────────────────────────────
        const studentInfo = _student
          ? [_student?.studentFirstName, _student?.studentLastName]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
          : "";

        const studentAge = _student?.age != null ? String(_student.age) : "";

        // ── combined tokens ─────────────────────────────────────
        const searchString = [studentInfo, parentInfo].join(" ").toLowerCase();
        const tokens = searchString.split(/[\s@.,_\-+]+/).filter(Boolean);

        return queryWords.every((word) => {
          const clean = word.trim().toLowerCase();
          if (!clean) return true;

          // Phone search
          if (/^[\d+\s\-()]{2,}$/.test(clean)) {
            const digits = clean.replace(/[^\d]/g, "");
            if (digits.length >= 2) return normalizedPhones.includes(digits);
          }

          // Age search
          if (studentAge && studentAge === clean) return true;

          // Token matching
          return tokens.some((token) => {
            if (/^\d+$/.test(clean) && /^\d+$/.test(token)) return token === clean;
            return token.startsWith(clean);
          });
        });
      })
      .slice(0, 10);
  }, [expandedRows, searchQuery]);

  // ── Helpers ─────────────────────────────────────────────────────
  const getParentName = (row) => {
    const p = row._parents?.[0];
    if (!p) return "—";
    return `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim() || "—";
  };

  const getStudentName = (row) => {
    if (!row._student) return null;
    const s = row._student;
    return `${s.studentFirstName || ""} ${s.studentLastName || ""}`.trim() || null;
  };

  const getPhone = (row) => row._parents?.[0]?.parentPhoneNumber || "—";

  const getStudentAge = (row) => {
    const age = row._student?.age;
    return age != null ? `Age ${age}` : null;
  };

  const getRowId = (row) => row._navigateId || null;

  // ── Determine what was matched (for smarter highlight & select) ──
  const getMatchType = (row, query) => {
    const q = query.toLowerCase().trim();
    const studentName = getStudentName(row)?.toLowerCase() || "";
    const parentName = getParentName(row)?.toLowerCase() || "";
    if (studentName && studentName.includes(q)) return "student";
    if (parentName.includes(q)) return "parent";
    return "other";
  };

  const highlight = (text, query) => {
    if (!text || !query) return text;
    if (/^\d/.test(query.trim())) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase().split(/\s+/)[0]);
    if (idx < 0) return text;
    const word = query.split(/\s+/)[0];
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-blue-100 text-blue-700 font-bold rounded px-[1px]">
          {text.slice(idx, idx + word.length)}
        </mark>
        {text.slice(idx + word.length)}
      </>
    );
  };

  // ── Select handler ───────────────────────────────────────────────
  const handleSelect = (row) => {
    const id = getRowId(row);
    const studentName = getStudentName(row);
    const parentName = getParentName(row);
    const q = searchQuery.trim();
    const matchType = getMatchType(row, q);

    // Update search box text based on what was matched
    if (matchType === "student" && studentName) {
      setSearchQuery(studentName);
    } else if (/^[+\d]/.test(q)) {
      setSearchQuery(getPhone(row));
    } else {
      setSearchQuery(parentName);
    }

    setOpen(false);

    // ── Navigation logic ────────────────────────────────────────
    if (!id) return;

    if (onResultClick) {
      // Custom handler passed from parent (Header)
      onResultClick(row._sourceRow, row._student);
      return;
    }

    // Default navigation — go to account info page
    navigate(`/weekly-classes/all-members/account-info?id=${id}`);
  };

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
    setOpen(e.target.value.trim().length >= 2);
  };

  const clear = () => {
    setSearchQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const initials = (name) =>
    (name || "?")
      .split(" ")
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // ── Avatar color based on name hash ─────────────────────────────
  const avatarColor = (name) => {
    const colors = [
      ["bg-blue-50 text-blue-600", "border-blue-100"],
      ["bg-violet-50 text-violet-600", "border-violet-100"],
      ["bg-emerald-50 text-emerald-600", "border-emerald-100"],
      ["bg-amber-50 text-amber-600", "border-amber-100"],
      ["bg-rose-50 text-rose-600", "border-rose-100"],
    ];
    const idx = (name || "").charCodeAt(0) % colors.length;
    return colors[idx];
  };
console.log('results',results)
  return (
    <div
      ref={wrapRef}
      className="relative w-full sm:w-[280px] lg:w-[200px] xl:w-[250px] 2xl:w-[400px]"
    >
      {/* ── Input ─────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onFocus={() => searchQuery.trim().length >= 2 && setOpen(true)}
          placeholder="Search parent, student, phone…"
          className="w-full px-4 py-2.5 pl-9 pr-8 border border-[#E2E1E5] rounded-xl bg-white text-[13.5px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
        />
        {searchQuery && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Dropdown ──────────────────────────────────────────────── */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E2E1E5] rounded-2xl shadow-xl z-50 overflow-hidden">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No results found</p>
              <p className="text-xs text-gray-300">Try a different name or phone number</p>
            </div>
          ) : (
            <>
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Results
                </span>
                <span className="text-[11px] font-semibold text-blue-500 bg-blue-50 rounded-full px-2 py-0.5">
                  {results.length}
                </span>
              </div>

              {/* Result rows */}
              <div className="max-h-[340px] overflow-y-auto">
                {results.map((row, i) => {
                  const parentName = getParentName(row);
                  const studentName = getStudentName(row);
                  const phone = getPhone(row);
                  const age = getStudentAge(row);
                  const matchType = getMatchType(row, searchQuery);
                  const [avatarBg, avatarBorder] = avatarColor(parentName);

                  return (
                    <button
                      key={row._rowId || i}
                      onClick={() => handleSelect(row)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-0 text-left group"
                    >
                      {/* Avatar */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold border ${avatarBg} ${avatarBorder}`}
                      >
                        {initials(parentName)}
                      </div>

                      {/* Content — full width, no phone competing for space */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        {/* Parent name — full width */}
                        <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight w-full">
                          {highlight(parentName, searchQuery)}
                        </p>

                        {/* Student name + age on second line */}
                        {studentName && (
                          <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                            <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <p
                              className={`text-[12px] truncate leading-tight font-medium ${
                                matchType === "student"
                                  ? "text-blue-600"
                                  : "text-gray-500"
                              }`}
                            >
                              {highlight(studentName, searchQuery)}
                              {age && (
                                <span className="ml-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                  {age}
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Phone on third line — no truncation risk */}
                        {phone !== "—" && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                            <span className="text-[11px] text-gray-400 tabular-nums">{phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow only */}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;