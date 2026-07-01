const PostCardSkeleton = () => {
  return (
    <div className="bg-[#1E1E2E] rounded-2xl p-4 mb-4 border border-[#3A3A5E] shadow-xl relative select-none animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Avatar Circle */}
        <div className="w-10 h-10 rounded-full bg-[#2A2A3E]" />
        
        {/* User metadata */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#2A2A3E] rounded w-1/4" />
          <div className="h-3 bg-[#2A2A3E] rounded w-1/6" />
        </div>
      </div>

      {/* Body Content Text */}
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-[#2A2A3E] rounded w-full" />
        <div className="h-4 bg-[#2A2A3E] rounded w-11/12" />
        <div className="h-4 bg-[#2A2A3E] rounded w-3/4" />
      </div>

      {/* Image Block */}
      <div className="h-52 bg-[#2A2A3E] rounded-xl mt-4" />

      {/* Actions Row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#3A3A5E]/40">
        <div className="flex items-center gap-6">
          <div className="h-6 bg-[#2A2A3E] rounded-full w-12" />
          <div className="h-6 bg-[#2A2A3E] rounded-full w-12" />
        </div>
        <div className="h-6 bg-[#2A2A3E] rounded-full w-8" />
      </div>
    </div>
  );
};

export default PostCardSkeleton;
