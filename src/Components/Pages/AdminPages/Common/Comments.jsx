import React from "react";
import { Loader2 } from "lucide-react";

const Comments = ({
  adminInfo,
  comment,
  setComment,
  handleSubmitComment,
  loadingComment,
  currentComments,
  formatTimeAgo,
}) => {
  return (
    <div className="bg-white my-10 rounded-3xl p-5 space-y-4">
      <h2 className="text-[22px] font-semibold">Notes</h2>

      {/* Input section */}
      <div className="flex items-center gap-2">
        <img
          src={
            adminInfo?.profile
              ? adminInfo.profile
              : "/members/dummyuser.png"
          }
          alt="User"
          className="w-12 h-12 rounded-full object-cover"
        />

        <input
          type="text"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a Note"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-[14px] outline-none"
        />

        <button
          disabled={loadingComment}
          className="bg-[#237FEA] p-2 rounded-lg text-white hover:bg-blue-600"
          onClick={handleSubmitComment}
        >
          {loadingComment ? (
            <Loader2 className="animate-spin w-4 h-4 text-white" />
          ) : (
            <img src="/images/icons/sent.png" alt="send" className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Notes list */}
      {currentComments && currentComments.length > 0 ? (
        <div className="space-y-3">
          {currentComments.map((c, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
              
              {/* User Info */}
              <div className="flex justify-end items-center gap-2 mb-2">
                <img
                  src={
                    c?.bookedByAdmin?.profile
                      ? c.bookedByAdmin.profile
                      : "/members/dummyuser.png"
                  }
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/members/dummyuser.png";
                  }}
                  alt={c?.bookedByAdmin?.firstName}
                  className="w-9 h-9 rounded-full object-cover"
                />

                <div className="text-right">
                  <p className="font-semibold text-[#237FEA] text-[14px] leading-tight">
                    {c?.bookedByAdmin?.firstName}{" "}
                    {c?.bookedByAdmin?.lastName}
                  </p>

                  {/* Time just below name */}
                  <span className="text-gray-400 text-[12px]">
                    {formatTimeAgo(c.createdAt)}
                  </span>
                </div>
              </div>

              {/* Note */}
              <p className="text-gray-700 text-[14px] text-left">
                {c.comment}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[14px] text-gray-400">
          No Notes yet.
        </p>
      )}
    </div>
  );
};

export default Comments;