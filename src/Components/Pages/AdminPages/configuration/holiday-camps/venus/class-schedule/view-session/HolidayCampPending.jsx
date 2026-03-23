import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
const HolidayCampPending = ({ item, sessionData }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [activeTab, setActiveTab] = useState('Beginner');
  const [myData, setMyData] = useState({});
  const [page, setPage] = useState(1);
  const [recording, setRecording] = useState(null);
  const audioRef = useRef(null);

  const location = useLocation();
  const sessionMap = location.state?.sessionMap;
  const venueId = location.state?.venueId;
  const sessionId = location.state?.sessionId;
  const singleClassSchedules = location.state?.singleClassSchedules;
  const sessionDate = location.state?.sessionDate;
  const className = location.state?.classname;
  const statusIs = location.state?.statusIs;
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [currentRecording, setCurrentRecording] = useState(null); // url of playing recording


  const selectedGroup = sessionMap;
  const levelKeyToLabel = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    pro: "Pro",
  };

  // Demo page content for each tab

  const navigate = useNavigate();
  useEffect(() => {
    if (selectedGroup?.levels) {
      const buildContentMap = () => {
        const content = {};
        Object.entries(selectedGroup.levels).forEach(([levelKey, items]) => {
          const label = levelKeyToLabel[levelKey];
          const banner = selectedGroup.banner || null;
          const video = selectedGroup.video || null;
          const videoUploadedAgo = selectedGroup.videoUploadedAgo || null;
          const id = selectedGroup.id || null;
          content[label] = items.map((entry, index) => ({

            title: `${label} – Page ${index + 1}`,
            heading: entry.skillOfTheDay || 'No Skill',
            player: entry.player || 'player',
            videoUrl: video ? `${video}` : '',
            videoUploadedAgo: videoUploadedAgo,
            id: id,

            bannerUrl: banner ? `${banner}` : '',
            description: entry.description || '',
            sessionExercises: entry.sessionExercises || [],
          }));
        });
        return content;
      };

      const dynamicContent = buildContentMap();
      setMyData(dynamicContent);

      // Set first tab by default
      const firstTab = Object.keys(dynamicContent)[0];
      setActiveTab(firstTab);
      setPage(1);
    }
  }, [selectedGroup]);
    const [isDownloading, setIsDownloading] = useState(false);


  const dynamicTabs = Object.keys(myData);
  const currentContent = myData[activeTab]?.[page - 1] || {};
  const totalPages = myData[activeTab]?.length || 0;
  const [selectedExercise, setSelectedExercise] = useState(
    currentContent.sessionExercises?.[0] || null
  );
  useEffect(() => {
    if (currentContent.sessionExercises?.length > 0) {
      setSelectedExercise(currentContent.sessionExercises[0]);
    }
  }, [currentContent]);
  useEffect(() => {
    if (selectedGroup && activeTab) {

      const tabKey = activeTab.toLowerCase().replace(/s$/, "");
      const fieldName = `${tabKey}_upload`;
      const fieldVideoName = `${tabKey}_video`;
      const videoDuration = `${tabKey}_video_duration`;


      // check if that recording field exists in selectedGroup
      if (selectedGroup[fieldName]) {
        setRecording(selectedGroup[fieldName]);
      } else {
        setRecording(null); // no match found
      }
      if (selectedGroup[fieldVideoName]) {
        setVideoUrl(selectedGroup[fieldVideoName]);
      } else {
        setVideoUrl(null); // no match found
      }
      if (selectedGroup[videoDuration]) {
        setVideoDuration(selectedGroup[videoDuration]);
      } else {
        setVideoDuration(null); // no match found
      }
    }
  }, [selectedGroup, activeTab]);
  const ageGroups = {
    "Beginner": "4–5 Years",
    "Intermediate": "6–7 Years",
    "Advanced": "8–9 Years",
    "Pro": "10–12 Years"
  };
  function formatDateWithSuffix(dateStr) {
    const date = new Date(dateStr);

    // Day of week
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });

    // Day with suffix
    const day = date.getDate();
    const suffix = (d => {
      if (d > 3 && d < 21) return 'th'; // 4-20 -> th
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    })(day);

    // Month and Year
    const month = date.toLocaleDateString('en-GB', { month: 'long' });
    const year = date.getFullYear();

    return `${weekday} ${day}${suffix} ${month} ${year}`;
  }

  // Output: Sunday 23rd April 2023


  return (
    <div className="md:p-6 bg-gray-50 min-h-screen preview-sec">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3 w-full md:w-1/2">
        <h2
          onClick={() => {
            navigate(`/configuration/holiday-camp/venues/class-schedule?id=${venueId}`);
          }}

          className="text-xl md:text-[28px] font-semibold flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 duration-200">
          <img
            src="/images/icons/arrow-left.png"
            alt="Back"
            className="w-5 h-5 md:w-6 md:h-6"
          />
          <span className="truncate">View Session Plans</span>
        </h2>
      </div>
      <div className="bg-white  rounded-3xl shadow p-6 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar */}
        <div
          className={`
    w-full md:w-2/12 
    py-6 
    rounded-2xl 
    text-center
    ${statusIs === "cancelled" ? "bg-[#f8f8f8]" : ""}
    ${statusIs === "complete" ? "bg-[#f8f8f8]" : ""}
    ${statusIs !== "cancelled" && statusIs !== "complete" ? "bg-[#f8f8f8] " : ""}
  `}
        >          <div className="w-18 h-18 bg-yellow-400 rounded-full flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
            {statusIs === "cancelled" ? (
              <img src="/images/icons/cancelBig.png" alt="Cancelled" />
            ) : statusIs === "complete" ? (
              <img src="/images/icons/completeBig.png" alt="Complete" />
            ) : (
              <img src="/images/icons/pendingBig.png" alt="Pending" />
            )}
          </div>

          <p className="text-base border-b border-gray-300 pb-5 font-semibold mb-4 capitalize">
            {statusIs || 'Pending'}
          </p>

          <div className="text-sm  p-6 text-gray-700 space-y-3 text-left">
            <p><b className="">Venue</b><br /> {singleClassSchedules?.name}</p>
            <p><b className="">Class</b><br />   {className?.className}</p>
            <p><b className="">Date:</b> <br />{formatDateWithSuffix(sessionDate)} </p>
            <p><b className="">Time:</b> <br />{className?.startTime} – {className?.endTime}</p>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full md:w-10/12 space-y-6">
          {/* Tabs */}
          <div className="flex w-full flex-col lg:flex-row gap-6">
            <div className="w-full bg-white  lg:w-1/2 flex gap-4 border border-gray-300 p-2 rounded-2xl   flex-wrap ">
              {dynamicTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  className={`px-6 py-2 rounded-xl text-[18px] font-semibold transition ${activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'text-[#717073] hover:text-blue-500'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="w-full pl-6  lg:w-1/2 "></div>
          </div>
          {/* Main Page Content */}
          {currentContent && (
            <div className="flex w-full flex-col border-t border-[#E2E1E5] pt-6 lg:flex-row gap-6">
              {/* Left - Video and Info */}
              <div className="w-full lg:w-1/2 space-y-2">
                {currentContent.bannerUrl && (
                  <img
                    src={currentContent.bannerUrl}
                    alt="Play like Pele "
                    className="rounded-xl w-full object-cover max-h-[130px]  mb-2"

                  />
                )}
                <h2 className="font-semibold text-[28px] mb-0 mt-5">
                  Skill of the Day
                </h2>
                <p className="text-[20px] flex items-center gap-2 font-semibold my-3">
                  {/* {currentContent?.player} */}
                  {currentContent.heading} <img
                    src="/images/icons/Volumeblue.png"
                    alt="Play Recording"
                    className={`w-6 h-6 cursor-pointer ${currentRecording === recording ? "opacity-100" : "opacity-40"
                      }`}
                    onClick={() => handlePlayRecording(recording)}
                  />
                  <audio ref={audioRef} onEnded={() => setCurrentRecording(null)} />
                </p>
                <p className="text-[16px] text-[#717073] font-semibold border-b border-gray-300 pb-4 ">
                  {currentContent.description}
                </p>
                {videoUrl && (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full  pt-3 rounded-4xl"
                  />
                )}
                <div className='flex items-center  mb-0 mt-4 justify-between' >
                  <h2 className="font-semibold text-[24px] mb-0">
                    Session Plan
                  </h2>
                  {videoUrl && (
                    <div className="relative">
                      <img
                        src="/images/icons/downloadicon.png"
                        alt="Download"
                        className={`cursor-pointer ${isDownloading ? "opacity-50 pointer-events-none" : ""}`}
                        onClick={async () => {
                          try {
                            setIsDownloading(true);
                            const token = localStorage.getItem("adminToken");
                            const response = await fetch(
                              `${API_BASE_URL}/api/admin/session-plan-group/${currentContent.id}/download-video?level=${activeTab.toLowerCase()}`,
                              {
                                method: "GET",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              }
                            );

                            if (!response.ok) {
                              throw new Error("Failed to download video");
                            }

                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);

                            // Generate a professional-looking filename
                            const safeGroup = currentContent?.groupName
                              ?.toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9\-]/g, "");
                            const safeLevel = currentContent?.level
                              ?.toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9\-]/g, "");

                            const filename = `${safeGroup || "session"}-${safeLevel || "video"}.mp4`;

                            const link = document.createElement("a");
                            link.href = url;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();

                            window.URL.revokeObjectURL(url);
                          } catch (err) {
                            console.error("Download failed:", err);
                          } finally {
                            setIsDownloading(false);
                          }
                        }}
                      /> {isDownloading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>)}
                    </div>
                  )}





                </div>
                {videoDuration && (
                  <div>
                    <p className="text-sm flex items-center gap-2 text-gray-500 pb-3">
                      <img src="/members/Time-Circle.png" className="w-4 h-4" alt="" />
                      {videoDuration || 'N/A'}
                    </p>
                  </div>
                )}

                {currentContent.sessionExercises?.length > 0 && (
                  <div className="mt-1 space-y-6">
                    {currentContent.sessionExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className={`flex items-center gap-6 cursor-pointer py-2 rounded ${selectedExercise?.id === exercise.id ? '' : ''
                          }`}
                        onClick={() => setSelectedExercise(exercise)}
                      >
                        <div className="w-4/12">
                          {exercise.imageUrl ? (
                            JSON.parse(exercise.imageUrl).map((imgUrl, index) => (
                              <img
                                key={index}
                                className="rounded-3xl w-full max-h-[114px] object-cover mr-2 mb-2"
                                src={`${imgUrl}`}
                                alt={`${exercise.title} ${index + 1}`}
                              />
                            ))
                          ) : (
                            <p>No images available</p>
                          )}
                        </div>
                        <div className="w-8/12">
                          <h6 className="text-[18px]  font-semibold">{exercise.title}</h6>
                          {/* <div
                            className="text-[16px] text-gray-700"
                            dangerouslySetInnerHTML={{
                              __html: exercise.description || '<p>No description available.</p>',
                            }}
                          /> */}
                          <span className="text-[14px] text-gray-500">
                            {exercise.duration || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}


              </div>

              {/* Right - Placeholder Drill Info */}
              {selectedExercise && (
                <div className="w-full  pl-6  lg:w-1/2 ">
                  <h2 className="font-semibold text-[24px] mb-4">{selectedExercise.title}</h2>
                  <div className=" ">
                    {selectedExercise.imageUrl ? (
                      JSON.parse(selectedExercise.imageUrl).map((imgUrl, index) => (
                        <img
                          key={index}
                          className="rounded-2xl object-cover lg:w-[400px] mr-2 min-h-50 max-h-[220px] mb-2"
                          src={`${imgUrl}`}
                          alt={`${selectedExercise.title} ${index + 1}`}
                        />
                      ))
                    ) : (
                      <p>No images available</p>
                    )}
                  </div>
                  <p className="text-blue-500 text-[18px] mt-7 font-semibold mb-5">
                    Time Duration: {selectedExercise.duration || '—'}
                  </p>

                  <div className="text-sm space-y-6">
                    <div>

                      <div
                        className="prose prose-sm space-y-6 max-w-none text-gray-700
    prose-p:mb-3 prose-li:mb-2
    prose-strong:block prose-strong:text-[16px] prose-strong:text-gray-900 prose-strong:mt-4
    prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5
    marker:text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedExercise.description ||
                            "<p class='text-gray-400 italic'>No description available.</p>",
                        }}
                      />
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* Pagination Buttons
            <div className="flex justify-between items-center pt-4 border-t mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 text-sm rounded-xl border ${
                  page === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white transition'
                }`}
              >
                ← Previous
              </button>
    
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
    
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-4 py-2 text-sm rounded-xl border ${
                  page === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white transition'
                }`}
              >
                Next →
              </button>
            </div> */}
        </div>
      </div>



    </div>
  );
};

export default HolidayCampPending;
