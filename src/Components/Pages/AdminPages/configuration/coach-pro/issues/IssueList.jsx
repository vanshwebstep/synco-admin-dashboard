import React, { useState } from "react";
import { EllipsisVerticalIcon, CalendarDays } from "lucide-react";

const IssueListData = [
    { title: "Parents not happy with access", createdBy: "Ellis Marsh", date: 'Sat 13th May', category: "Equipment", venue: 'Marylebone', region: '1', status: 'pending' },
    { title: "Parents not happy with access", createdBy: "Ellis Marsh", date: 'Sat 13th May', category: "Equipment", venue: 'Marylebone', region: '1', status: 'pending' },
    { title: "Parents not happy with access", createdBy: "Ellis Marsh", date: 'Sat 13th May', category: "Equipment", venue: 'Marylebone', region: '1', status: 'pending' },
    { title: "Parents not happy with access", createdBy: "Ellis Marsh", date: 'Sat 13th May', category: "Equipment", venue: 'Marylebone', region: '1', status: 'pending' },
];

const IssueList = () => {
    const [openRowIndex, setOpenRowIndex] = useState(null);
    const getStatusClasses = (status) => {
        if (!status) return "";

        const s = status.toLowerCase();

        if (s === "confirmed")
            return "bg-[#E6F9EC] text-[#1F9254]"; // green

        if (s === "pending")
            return "bg-[#FFF7E6] text-[#DFA100]"; // yellow

        if (s === "failed" || s === "failed")
            return "bg-[#FDEDED] text-[#D60000]"; // red

        return "bg-gray-100 text-gray-600";
    };

    const [showFilter, setShowFilter] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filters, setFilters] = useState({
        category: true,
        regional: false,
        coach: false,
        status: false,
    });

    return (
        <>
            <div className="flex justify-between items-center py-4 pb-5">
                <h3 className="font-semibold text-xl">Issues Dashboard</h3>
                <div className="px-6 flex gap-2 items-center">


                    <button className=" flex items-center gap-2 p-1.5 px-3 text-[#717073] rounded-xl text-center border border-[#E2E1E5]">
                        <CalendarDays className="w-4 text-black" />  Time Period
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="p-1.5 px-3 text-[#717073] rounded-xl flex gap-2 items-center border border-[#E2E1E5]"
                        >
                            <img
                                src="/reportsIcons/filter.png"
                                className="w-3 invert"
                                alt=""
                            />
                            Filter
                        </button>

                        {showFilter && (
                            <div className="absolute right-0 mt-3 w-76 bg-white rounded-3xl shadow-lg p-5 z-50">

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search venue/zone"
                                        className="w-full border border-gray-300 rounded-xl p-3 pl-10 text-sm"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                    />
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </div>

                                <div className="mt-4 space-y-3 text-sm">
                                    {[
                                        { key: "category", label: "Category" },
                                        { key: "regional", label: "Regional Manager" },
                                        { key: "coach", label: "Coach" },
                                        { key: "status", label: "Status" },
                                    ].map((item) => (
                                        <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters[item.key]}
                                                onChange={() =>
                                                    setFilters({ ...filters, [item.key]: !filters[item.key] })
                                                }
                                                className="w-4 h-4 rounded border-gray-400"
                                            />
                                            {item.label}
                                        </label>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3 justify-between mt-5">
                                    <button
                                        onClick={() => setFilters({
                                            category: false,
                                            regional: false,
                                            coach: false,
                                            status: false
                                        })}
                                        className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600"
                                    >
                                        Clear
                                    </button>

                                    <button
                                        onClick={() => setShowFilter(false)}
                                        className="px-5 py-2 rounded-xl bg-[#237FEA] text-white font-medium"
                                    >
                                        Apply Filter
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>



                </div>
            </div>
            <div className="border border-[#E2E1E5] h-screen bg-white rounded-2xl overflow-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#F5F5F5] border-b border-[#DBDBDB]">
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Issue Title</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Created by</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Date</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Category</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Venue</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Region</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Status</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left">Assigned to</th>
                            <th className="text-[#717073] font-semibold p-3 px-4 text-left"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {IssueListData.map((v, index) => (
                            <React.Fragment key={index}>
                                {/* MAIN ROW */}
                                <tr
                                    className={`border-b ${openRowIndex === index ? "bg-[#F7FBFF] border-[#237FEA]" : "bg-white border-[#EFEEF2] "
                                        }`}
                                >
                                    <td className="p-3 px-4 ">{v.title}</td>
                                    <td className="p-3 px-4">{v.createdBy}</td>
                                    <td className="p-3 px-4 ">{v.date}</td>
                                    <td className="p-3 px-4 ">{v.category}</td>
                                    <td className="p-3 px-4 ">{v.venue}</td>
                                    <td className="p-3 px-4 ">{v.region}</td>
                                    <td className="p-3 px-4 "><span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusClasses(v.status)}`}>
                                        {v.status}</span></td>
                                    <td className="p-3 px-4 ">
                                        <img src="/members/user2.png" className="w-12" alt="" />
                                    </td>

                                    <td className="p-3 px-4 text-right">
                                        <button
                                            onClick={() =>
                                                setOpenRowIndex(openRowIndex === index ? null : index)
                                            }
                                            className="p-1.5 px-3 rounded-xl text-center "
                                        >
                                            <EllipsisVerticalIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>

                                {/* DROPDOWN ROW */}
                                {openRowIndex === index && (
                                    <tr className="bg-white border-b border-[#efefef]">
                                        <td colSpan={9} className="p-6">
                                            <h4 className="font-semibold text-lg">Details</h4>
                                            <p className="text-[#717073] text-[16px] mt-2">
                                                Lorem Ipsum is simply dummy text of the printing and
                                                typesetting industry. Lorem Ipsum has been the industry's
                                                standard dummy text ever since the 1500s, when an unknown
                                                printer took a galley of type and scrambled it to make a
                                                type specimen book.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>


       
        </>
    );
};

export default IssueList;
