import { useState, useRef, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useGlobalSearch } from "../contexts/GlobalSearchContext";

const GlobalSearch = () => {
    const { searchQuery, setSearchQuery, registeredData } = useGlobalSearch();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (!wrapRef.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const results = (() => {
        const q = searchQuery?.trim();

        if (!q || q.length < 2) return [];

        const queryWords = q.toLowerCase().split(/\s+/).filter(Boolean);

        const seenKeys = new Set();

        return registeredData
            .filter((row) => {
                // ── parents list ─────────────────────────────────────
                const parentsList =
                    row?.parents?.length
                        ? row.parents
                        : row?.parent?.parents?.length
                            ? row.parent.parents
                            : [];

                // ── dedup ────────────────────────────────────────────
                const dedupKey =
                    parentsList[0]?.parentPhoneNumber ||
                    parentsList[0]?.parentEmail ||
                    row?.id ||
                    row?.bookingId;

                if (dedupKey && seenKeys.has(dedupKey)) return false;

                if (dedupKey) {
                    seenKeys.add(dedupKey);
                }

                // ── phones ───────────────────────────────────────────
                const normalizedPhones = parentsList
                    .map((p) =>
                        (p?.parentPhoneNumber || "").replace(/[^\d]/g, "")
                    )
                    .join(" ");

                // ── parent info ──────────────────────────────────────
                const parentInfo = parentsList
                    .map((p) =>
                        [
                            p?.parentFirstName,
                            p?.parentLastName,
                            p?.parentEmail,
                        ]
                            .filter(Boolean)
                            .join(" ")
                    )
                    .join(" ")
                    .toLowerCase();

                // ── all students ─────────────────────────────────────
                const studentsList = row?.students?.length
                    ? row.students
                    : row?.parent?.students?.length
                        ? row.parent.students
                        : row?.student
                            ? [row.student]
                            : [];

                // ── student names ────────────────────────────────────
                const studentInfo = studentsList
                    .map((s) =>
                        [
                            s?.studentFirstName,
                            s?.studentLastName,
                        ]
                            .filter(Boolean)
                            .join(" ")
                    )
                    .join(" ")
                    .toLowerCase();

                // ── all student ages ─────────────────────────────────
                const allStudentAges = studentsList
                    .map((s) => s?.age)
                    .filter(
                        (age) =>
                            age !== null &&
                            age !== undefined &&
                            age !== ""
                    )
                    .map((age) => String(age));

                // ── searchable string ────────────────────────────────
                const searchString = [studentInfo, parentInfo]
                    .join(" ")
                    .toLowerCase();

                const tokens = searchString
                    .split(/[\s@.,_\-+]+/)
                    .filter(Boolean);

                // ── query matching ───────────────────────────────────
                return queryWords.every((word) => {
                    const clean = word.trim().toLowerCase();

                    if (!clean) return true;

                    // Phone search
                    if (/^[\d+\s\-()]{2,}$/.test(clean)) {
                        const cleanDigits = clean.replace(/[^\d]/g, "");

                        if (cleanDigits.length >= 2) {
                            return normalizedPhones.includes(cleanDigits);
                        }
                    }

                    // Age search
                    if (allStudentAges.includes(clean)) {
                        return true;
                    }

                    // Token matching
                    return tokens.some((token) => {
                        // Exact numeric match
                        if (
                            /^\d+$/.test(clean) &&
                            /^\d+$/.test(token)
                        ) {
                            return token === clean;
                        }

                        // Prefix match
                        return token.startsWith(clean);
                    });
                });
            })
            .slice(0, 8);
    })();

    const getParentName = (row) => {
        const parentsList =
            row?.parents?.length
                ? row.parents
                : row?.parent?.parents?.length
                    ? row.parent.parents
                    : [];
        const p = parentsList[0];
        if (!p) return "—";
        return `${p.parentFirstName || ""} ${p.parentLastName || ""}`.trim();
    };

    const getPhone = (row) => {
        const parentsList =
            row?.parents?.length
                ? row.parents
                : row?.parent?.parents?.length
                    ? row.parent.parents
                    : [];
        return parentsList[0]?.parentPhoneNumber || "—";
    };

    const getChildName = (row) => {
        // Students array
        if (row?.students?.length) {
            return row.students
                .map((s) => `${s.studentFirstName || ""} ${s.studentLastName || ""}`.trim())
                .filter(Boolean)
                .join(", ");
        }
        // Nested
        if (row?.parent?.students?.length) {
            return row.parent.students
                .map((s) => `${s.studentFirstName || ""} ${s.studentLastName || ""}`.trim())
                .filter(Boolean)
                .join(", ");
        }
        // Single student
        if (row?.student) {
            return `${row.student.studentFirstName || ""} ${row.student.studentLastName || ""}`.trim();
        }
        return "—";
    };

    const initials = (name) =>
        name
            .split(" ")
            .map((w) => w[0] || "")
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const highlight = (text, query) => {
        if (!text || !query) return text;
        if (/^\d/.test(query.trim())) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx < 0) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="text-blue-600 font-semibold">
                    {text.slice(idx, idx + query.length)}
                </span>
                {text.slice(idx + query.length)}
            </>
        );
    };
    const handleSelect = (row) => {
        const q = searchQuery.trim();

        // Phone number se search kiya tha
        if (/^[+\d]/.test(q)) {
            const phone = getPhone(row);
            setSearchQuery(phone);
            setOpen(false);
            return;
        }

        // Student name se search kiya tha
        const childName = getChildName(row);
        const parentName = getParentName(row);
        const qLower = q.toLowerCase();

        if (
            childName.toLowerCase().includes(qLower) &&
            !parentName.toLowerCase().includes(qLower)
        ) {
            setSearchQuery(childName);
            setOpen(false);
            return;
        }

        // Default — parent name
        setSearchQuery(parentName);
        setOpen(false);
    };

    const handleChange = (e) => {
        setSearchQuery(e.target.value);
        setOpen(e.target.value.trim().length >= 2);
    };

    const clear = () => {
        setSearchQuery("");
        setOpen(false);
    };

    return (
        <div
            ref={wrapRef}
            className="relative w-full sm:w-[280px] lg:w-[200px] xl:w-[250px] 2xl:w-[400px]"
        >
            {/* Input */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleChange}
                    onFocus={() => searchQuery.trim().length >= 2 && setOpen(true)}
                    placeholder="Search"
                    className="w-full px-4 py-3 pl-10 pr-8 border border-[#E2E1E5] rounded-lg bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                {searchQuery && (
                    <button
                        onClick={clear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E2E1E5] rounded-2xl shadow-lg z-50 max-h-[380px] overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">
                            No results found
                        </div>
                    ) : (
                        <>
                            <div className="px-4 pt-3 pb-1 text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                                {results.length} result{results.length > 1 ? "s" : ""} found
                            </div>
                            {results.map((row, i) => {
                                const parentName = getParentName(row);
                                const childName = getChildName(row);
                                const phone = getPhone(row);

                                return (
                                    <div
                                        key={row?.id || row?.bookingId || i}
                                        onClick={() => handleSelect(row)}
                                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-t border-[#f0f0f0] first:border-t-0"
                                    >
                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                                            {initials(parentName)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#282829] truncate">
                                                {highlight(parentName, searchQuery)}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                {highlight(childName, searchQuery)}
                                            </p>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex-shrink-0">
                                            <span className="text-xs text-gray-400 tabular-nums">
                                                {phone}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
