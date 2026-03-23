import React, { useState, useEffect } from "react";

const PlanTabs = ({ selectedPlans = [] }) => {
  // Group by number of students
  const groupByStudents = selectedPlans.reduce((acc, plan) => {
    if (!acc[plan.students]) acc[plan.students] = [];
    acc[plan.students].push(plan);
    return acc;
  }, {});

  const studentKeys = Object.keys(groupByStudents).sort();
  console.log('selectedPlans', selectedPlans)
  const [activeTab, setActiveTab] = useState(null);

  // ✅ Update activeTab when selectedPlans changes
  useEffect(() => {
    if (studentKeys.length > 0 && !activeTab) {
      setActiveTab(studentKeys[0]);
    }
  }, [studentKeys, activeTab]);

  // Handle when there's no data yet
  if (!activeTab || !groupByStudents[activeTab]) {
    return (
      <p className="text-center text-gray-500 text-lg font-medium py-10">
        No plans found.
      </p>
    );
  }

  const sortedPlans = [...groupByStudents[activeTab]].sort((a, b) => {
    const intervalOrder = ["Day", "Week", "Month", "Year"];
    return intervalOrder.indexOf(a.interval) - intervalOrder.indexOf(b.interval);
  });

  return (
    <div className="w-full">
      <div className="flex justify-center my-6">
        <div className="md:inline-flex rounded-2xl border border-gray-300 bg-white p-1">
          {studentKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 md:w-auto w-full py-2 text-[16px] font-medium rounded-xl transition ${activeTab === key
                  ? "bg-[#237FEA] text-white"
                  : "bg-white text-[#237FEA]"
                }`}
            >
              {key} Student{key > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="flex sm:flex-row flex-col flex-wrap pt-2 mx-auto justify-center gap-3">
        {sortedPlans?.map((plan, idx) => (
          <div
            key={plan?.id}
            className="border md:w-[32%] border-[#E2E1E5]  rounded-[20px] p-4 sm:p-5 flex flex-col justify-between transition"
          >
            <h3 className="text-[18px] sm:text-[20px] font-semibold mb-2">
              {plan.title}
            </h3>
            <p className="text-[24px] sm:text-[32px] font-semibold mb-4">
              £{plan?.price?.toFixed(2)}/
              <span className="text-sm">{plan.interval?.toLowerCase()}</span>
            </p>
            <hr className="mb-4 text-[#E2E1E5]" />

            <ul className="space-y-2 text-[14px] text-[16px] font-semibold pb-10">
              {(
                plan.HolidayCampPackage || plan.holidayCampPackage
              ) &&
                new DOMParser()
                  .parseFromString(
                    plan.HolidayCampPackage || plan.holidayCampPackage,
                    "text/html"
                  )
                  .body.textContent.replace(/\r?\n|&nbsp;/gi, "###")
                  .split(/###|<\/?p>/gi)
                  .map((item, index) => {
                    const text = item.replace(/<\/?[^>]+(>|$)/g, "").trim();
                    return text ? (
                      <li key={index} className="flex items-center gap-2">
                        <img
                          src="/images/icons/tick-circle.png"
                          alt=""
                          className="w-5 h-5"
                        />
                        {text}
                      </li>
                    ) : null;
                  })}
            </ul>

            <button className="px-8 py-3 text-[16px] font-medium rounded-xl bg-[#237FEA] text-white shadow transition">
              {plan.joiningFee
                ? `£${plan.joiningFee} Joining Fee`
                : "Not Defined Joining Fee"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanTabs;
