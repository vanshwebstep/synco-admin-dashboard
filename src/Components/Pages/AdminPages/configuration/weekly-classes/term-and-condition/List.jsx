// List.js
import React, { useEffect, useState } from 'react';
import Loader from '../../../contexts/Loader';
import TermCard from './TermCard';
import { useNavigate } from 'react-router-dom';
import { useTermContext } from '../../../contexts/TermDatesSessionContext';
import { usePermission } from '../../../Common/permission';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatShortDate = (iso) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', {
    weekday: 'short',
  })} ${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
};

const List = () => {
  const navigate = useNavigate();
  const { fetchTermGroup, fetchTerm, termGroup, termData, loading } = useTermContext();
  const [sessionDataList, setSessionDataList] = useState([]);
  const [classList, setClassList] = useState([]);

  useEffect(() => {
    fetchTerm();
    fetchTermGroup();
  }, [fetchTerm, fetchTermGroup]);
  useEffect(() => {
    // console.log("🚀 useEffect triggered");

    // Step 1: Check data presence
    if (!termGroup.length || !termData.length) {
      // console.log("⛔ Missing termGroup or termData");
      return;
    }

    // console.log("✅ termGroup:", termGroup);
    // console.log("✅ termData:", termData);

    // Helper to detect season
    const detectSeason = (termName) => {
      const name = termName?.toLowerCase();
      if (name?.includes('autumn')) return 'autumn';
      if (name?.includes('spring')) return 'spring';
      return 'summer';
    };

    const grouped = termGroup.map((group, groupIdx) => {
      // console.log(`\n📦 Processing Group #${groupIdx + 1}:`, group);

      // Use termGroup?.id to match correctly
      const terms = termData.filter((t) => t.termGroup?.id === group.id);
      if (!terms.length) {
        // console.log(`⚠️ No terms found for group ID ${group.id}`);
        return null;
      }

      // console.log(`🔍 Matched ${terms.length} terms for group '${group.name}'`);

      // Step 2: Map each term to sessionData
      const sessionData = terms.map((term, termIdx) => {
        const start = formatDate(term.startDate);
        const end = formatDate(term.endDate);
        const dateRange = `${start} - ${end}`;
        // console.log('terms', terms)
        // Parse exclusionDates
        let exclusionArr = [];
        try {

          if (Array.isArray(term.exclusionDates)) {
            exclusionArr = term.exclusionDates;
          } else if (typeof term.exclusionDates === 'string') {
            try {
              exclusionArr = JSON.parse(term.exclusionDates || '[]');
            } catch (e) {
              exclusionArr = [];
            }
          }
        } catch (err) {
          console.error(`❌ Failed to parse exclusions for term ${term.id}:`, err);
        }

        const exclusion = exclusionArr.length
          ? exclusionArr.map((ex) => formatDate(ex)).join(', ')
          : 'None';
        const sessions = term.sessionsMap.map((session, idx) => ({
          groupName: session?.sessionPlan?.groupName,
          date: formatDate(session.sessionDate), // assuming you have a formatDate function
        }));




        const season = detectSeason(term.termName);

        const sessionObj = {

          term: term.termName,
          icon: `/images/icons/${season}.png`,
          date: `${dateRange}\nHalf-Term Exclusion: ${exclusion}`,
          exclusion,
          sessions,

        };

        // console.log(`📘 Term #${termIdx + 1} (${term.termName}):`, sessionObj);
        return sessionObj;
      });

      // console.log('📊 SessionData for this group:', sessionData);

      // Step 3: Build the class card
      const classCard = {
        id: group.id,
        name: group.name,
        Date: formatShortDate(group.createdAt),
        endTime: '3:00 pm',
        freeTrial: 'Yes',
        facility: 'Indoor',
      };

      sessionData.forEach((termData) => {
        const key = detectSeason(termData.term);
        classCard[key] = `${termData.date}`;
      });

      // console.log(`🧾 Built classCard for group '${group.name}':`, classCard);

      return { sessionData, classCard };
    });

    const filtered = grouped.filter(Boolean);
    const allSessions = filtered.map((g) => g.sessionData);
    const allClasses = filtered.map((g) => g.classCard);

    // console.log("✅ Final SessionDataList:", allSessions);
    // console.log("✅ Final ClassList:", allClasses);

    setSessionDataList(allSessions);
    setClassList(allClasses);
  }, [termGroup, termData]);



  const { checkPermission } = usePermission();
  const canCreate =
    checkPermission({ module: 'term-group', action: 'create' }) &&
    checkPermission({ module: 'term', action: 'create' }) &&
    checkPermission({ module: 'session-plan-group', action: 'view-listing' });

  if (loading) {
    return <Loader />;
  }
  // console.log('classList',classList)
  // Then check for missing data
  if (!termGroup.length && !termData.length) {
    return (
      <>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 w-full">
          <h2 className="text-[22px] md:text-[28px] font-semibold">
            Term Dates & Session Plan Mapping
          </h2>


          {canCreate &&
            <button
              onClick={() => navigate('/weekly-classes/term-dates/create')}
              className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px] font-semibold"
            >
              <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
              Add New Term Group
            </button>
          }
        </div>
        <div className="text-center p-4 border-dotted text-red-500 rounded-md text-sm md:text-base">
          No Term Groups or Term Data Available
        </div>
      </>
    );
  }

  if (!termGroup.length) {
    return (
      <>  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 w-full">
        <h2 className="text-[22px] md:text-[28px] font-semibold">
          Term Dates & Session Plan Mapping
        </h2>


        {canCreate &&
          <button
            onClick={() => navigate('/weekly-classes/term-dates/create')}
            className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px] font-semibold"
          >
            <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
            Add New Term Group
          </button>
        }
      </div>
        <div className="text-center p-4 border-dotted text-red-500 rounded-md text-sm md:text-base">
          No Term Groups Available
        </div>
      </>
    );
  }


  return (
    <div className="pt-1 bg-gray-50 min-h-screen md:px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 w-full">
        <h2 className="text-[22px] md:text-[28px] font-bold">
          Term Dates & Session Plan Mapping
        </h2>


        {canCreate &&
          <button
            onClick={() => navigate('/weekly-classes/term-dates/create')}
            className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-2 md:py-[10px] rounded-xl hover:bg-blue-700 text-[15px] font-semibold"
          >
            <img src="/members/add.png" className="w-4 md:w-5" alt="Add" />
            Add a Term Group
          </button>
        }
      </div>

      {/* Term Cards */}
      <div className="transition-all duration-300 h-full w-full">
        {classList.length > 0 ? (
          <div className="rounded-[30px] shadow bg-white p-[10px] flex flex-col gap-6">
            {classList.map((item, index) => (
              <TermCard
                key={index}
                item={item}
                sessionData={sessionDataList[index]}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-[#717073] font-medium">
            No data available
          </div>
        )}
      </div>

    </div>
  );
};

export default List;
