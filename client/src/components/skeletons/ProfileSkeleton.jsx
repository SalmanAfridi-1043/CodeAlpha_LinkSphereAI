const ProfileSkeleton = () => {
  return (
    <div className="w-full animate-pulse select-none pb-12">
      {/* Profile Card Shell */}
      <div className="bg-[#1E1E2E] rounded-2xl border border-[#3A3A5E] overflow-hidden mb-6 shadow-xl relative">
        {/* Cover Image Placeholder */}
        <div className="h-48 md:h-56 bg-[#2A2A3E]/60 relative" />

        {/* User Details Placeholder */}
        <div className="pt-16 pb-6 px-6 relative">
          {/* Overlapping Avatar Placeholder */}
          <div className="absolute -top-16 left-6 w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#2A2A3E] ring-4 ring-[#1E1E2E]" />

          <div className="flex justify-between items-start">
            <div className="space-y-2.5">
              {/* Name */}
              <div className="h-6 bg-[#2A2A3E] rounded w-44" />
              {/* Username */}
              <div className="h-4 bg-[#2A2A3E] rounded w-28" />
            </div>

            {/* Button */}
            <div className="h-9 bg-[#2A2A3E] rounded-xl w-28" />
          </div>

          {/* Bio Description */}
          <div className="h-4 bg-[#2A2A3E] rounded w-full mt-6" />
          <div className="h-4 bg-[#2A2A3E] rounded w-2/3 mt-2" />

          {/* Stats Row */}
          <div className="flex gap-6 mt-6 border-t border-[#3A3A5E]/40 pt-4">
            <div className="h-5 bg-[#2A2A3E] rounded w-16" />
            <div className="h-5 bg-[#2A2A3E] rounded w-20" />
            <div className="h-5 bg-[#2A2A3E] rounded w-20" />
          </div>
        </div>
      </div>

      {/* Tabs Placeholder */}
      <div className="flex border-b border-[#3A3A5E] mb-6 gap-2">
        <div className="h-10 bg-[#2A2A3E]/40 rounded-t w-20" />
        <div className="h-10 bg-[#2A2A3E]/40 rounded-t w-24" />
        <div className="h-10 bg-[#2A2A3E]/40 rounded-t w-24" />
      </div>

      {/* Content Feed Skeletons */}
      <div className="space-y-4">
        <div className="bg-[#1E1E2E] rounded-2xl p-5 border border-[#3A3A5E] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2A2A3E]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#2A2A3E] rounded w-1/4" />
              <div className="h-3 bg-[#2A2A3E] rounded w-1/6" />
            </div>
          </div>
          <div className="h-4 bg-[#2A2A3E] rounded w-full mt-4" />
          <div className="h-4 bg-[#2A2A3E] rounded w-4/5 mt-2" />
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
