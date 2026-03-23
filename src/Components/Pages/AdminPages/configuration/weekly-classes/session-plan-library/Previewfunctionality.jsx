import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionPlan } from '../../../contexts/SessionPlanContext';
import Loader from '../../../contexts/Loader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Preview = () => {
  const [activeTab, setActiveTab] = useState('');
  const [tabs, setTabs] = useState([]);
  const [page, setPage] = useState(1);
  const [id, setId] = useState(null);

  const navigate = useNavigate();
  const { selectedGroup, loading, fetchGroupById } = useSessionPlan();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');
    setId(idFromUrl);
  }, []);

  useEffect(() => {
    if (id) fetchGroupById(id);
  }, [id]);

  useEffect(() => {
    if (!selectedGroup?.levels) return;
    const levelKeys = Object.keys(selectedGroup.levels);
    setTabs(levelKeys);
    setActiveTab((prev) => prev || levelKeys[0]);
  }, [selectedGroup]);

  if (loading || !selectedGroup) return <Loader />;

  const current = selectedGroup.levels?.[activeTab]?.[page - 1];

  const getVideoUrl = () => {
    const videoField = `${activeTab.toLowerCase()}_video`;
    return selectedGroup?.[videoField]
      ? `${API_BASE_URL}${selectedGroup[videoField]}`
      : '/demo/videoFallback.mp4';
  };

  const getBanner = () => {
    const bannerField = `${activeTab.toLowerCase()}_banner`;
    return selectedGroup?.[bannerField]
      ? `${API_BASE_URL}${selectedGroup[bannerField]}`
      : '/demo/default_banner.jpg';
  };

  return (
    <div className="md:p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-3xl shadow p-6 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-10/12 space-y-6">
          {/* Dynamic Tabs */}
          <div className="flex gap-4 border max-w-fit border-gray-300 p-1 rounded-xl flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${activeTab === tab
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-500 hover:text-blue-500'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {current && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/2 space-y-2">
                <img
                  src={getBanner()}
                  alt="Level Banner"
                  className="rounded-xl mb-2"
                />

                <h2 className="font-semibold text-[28px] mb-0">
                  {current.skillOfTheDay || 'Skill of the Day'}
                </h2>

                <p className="text-[20px] flex items-center gap-2 font-semibold">
                  {current.player || 'Player Name'}
                  <img src="/images/icons/Volumeblue.png" alt="" />
                </p>

                <p className="text-sm text-gray-500 border-b border-gray-300 pb-3">
                  {current.description || 'No description available.'}
                </p>

                <video
                  src={getVideoUrl()}
                  controls
                  className="w-full pt-3 rounded-4xl"
                />

                <div className="flex items-center mb-0 justify-between">
                  <h2 className="font-semibold text-[24px] mb-0">Session Plan</h2>
                  <img src="/images/icons/downloadicon.png" alt="" />
                </div>

                <p className="text-sm flex items-center gap-2 text-gray-500 border-b border-gray-300 pb-3">
                  <img src="/members/Time-Circle.png" className="w-4 h-4" alt="" />
                  4 hours ago
                </p>

                {/* Render session exercises */}
                {current.sessionExercises?.length > 0 ? (
                  current.sessionExercises.map((exercise) => (
                    <div key={exercise.id} className="flex items-center mb-5 gap-4">
                      <img
                        className="min-h-[116px] min-w-[181px] rounded-xl object-cover"
                        src={`${API_BASE_URL}${exercise.imageUrl}`}
                        alt={exercise.title}
                      />
                      <div>
                        <h6 className="text-[18px] font-semibold">{exercise.title}</h6>
                        {/* <p className="text-[16px]">{exercise.description}</p> */}
                        <span className="text-[14px]">{exercise.duration}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No session exercises available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preview;
