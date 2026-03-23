import { useState } from 'react';
import { useTermContext } from '../../../contexts/TermDatesSessionContext';
import { showConfirm, showSuccess, showError } from '../../../../../../utils/swalHelper';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../../Common/permission';

const TermCard = ({ item, sessionData }) => {
  const navigate = useNavigate();

  const [showSessions, setShowSessions] = useState(false);
  const { fetchTermGroup, deleteTermGroup, termGroup, termData, loading } = useTermContext();
  const handleDelete = (id) => {
    showConfirm(
      'Are you sure?',
      'This action will delete the Term Group.',
      'Yes, delete it!'
    ).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteTermGroup(id);
          showSuccess('Deleted!', 'Term Group has been deleted.');
        } catch (error) {
          showError('Error!', 'Failed to delete Term Group.');
        }
      }
    });
  };
  const handleEdit = (id) => {
    navigate(`/weekly-classes/term-dates/Create?id=${id}`)
  };
  console.log('sessionData', sessionData);
  console.log('item', item)
  const { checkPermission } = usePermission();

  const canEdit =
    checkPermission({ module: 'term-group', action: 'update' }) &&
    checkPermission({ module: 'term', action: 'update' }) &&
    checkPermission({ module: 'session-plan-group', action: 'view-listing' })

  const canDelete = checkPermission({ module: 'term-group', action: 'delete' }) && checkPermission({ module: 'term', action: 'delete' });;

  return (
    <div className="bg-white border border-[#E2E1E5] rounded-[16px] overflow-hidden  hover:shadow-md transition">
      <div className="flex gap-4 p-4 text-sm">
        {/* Left block */}
        <div className="flex-shrink-0 md:w-[14%]">
          <p className="font-bold text-[#282829] capitalize inter text-[18px] ">{item.name}</p>
          <p className="text-[#282829] text-[16px] mt-1 font-semibold">{item.Date}</p>
        </div>

        <div className="grid md:w-[80%] 2xl:ps-4 lg:grid-cols-3 items-start md:grid-cols-2 gap-6">
          {sessionData.map(({ id, term, icon, date, sessions }) => (
            <div key={term} className="flex-shrink-0 justify-center w-full flex flex-col gap-2">
              <div className="flex items-center gap-3 ">
                <img src={icon} alt={term} className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[#717073] text-[14px] mb-1 font-bold">{term}</p>
                  <p className="text-[14px] inter font-semibold text-[#717073]">
                    {date?.split("\n").map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>

                </div>
              </div>

              {/* Sessions inside each column */}
              <div className={`transition-all duration-500 overflow-hidden ${showSessions ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <ul className="space-y-[7px] text-xs mt-[30px]">
                  {sessions.map((session, i) => (
                    <li key={i}>
                      <div
                        className={`flex justify-between gap-6 items-start ${i >= 6 ? 'font-semibold' : ''
                          }`}
                      >
                        <span className="md:w-7/12 font-bold text-[14px] gilory text-[#282829]">
                          {`Session ${i + 1}: ${session.groupName || 'No Session Found'}`}
                        </span>
                        <span className="text-[#282829] md:w-5/12 font-semibold text-[14px] gilory text-left">{session.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>

              </div>
            </div>
          ))}

        </div>


        {/* Action buttons */}
        <div className={`flex md:w-[6%] justify-end gap-3 mt-2 md:mt-0 ${showSessions ? 'items-start' : 'items-center'} ml-auto`}>
          {canEdit && (
            <button onClick={() => handleEdit(item.id)} className="text-gray-500 hover:text-blue-500">
              <img className="w-5 h-5" src="/images/icons/edit.png" alt="Edit" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-500">
              <img className="w-5 h-5" src="/images/icons/deleteIcon.png" alt="Delete" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle sessions */}
      <div className="bg-[#F6F6F9] px-4 py-2 cursor-pointer" onClick={() => setShowSessions(!showSessions)}>
        <div className="text-center text-[#237FEA] text-[12px] font-semibold flex justify-center items-center gap-2">
          {showSessions ? 'Hide all session dates' : 'Show all session dates'}
          <img className={`w-3 transition-transform ${showSessions ? 'rotate-180' : ''}`} src="/images/icons/bluearrowup.png" alt="Toggle" />
        </div>
      </div>
    </div>

  );
};

export default TermCard;
