const UserItemSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl select-none animate-pulse">
      {/* Left side info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#2A2A3E]" />
        
        {/* Texts */}
        <div className="space-y-2">
          {/* Name */}
          <div className="h-3.5 bg-[#2A2A3E] rounded w-24" />
          {/* Username */}
          <div className="h-3 bg-[#2A2A3E] rounded w-16" />
        </div>
      </div>

      {/* Button placeholder */}
      <div className="h-7 bg-[#2A2A3E] rounded-full w-20" />
    </div>
  );
};

export default UserItemSkeleton;
