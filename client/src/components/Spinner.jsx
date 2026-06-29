const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const Spinner = ({ size = "md", color = "#6C63FF", fullScreen = false }) => {
  const spinner = (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-2 border-[#2A2A3E] animate-spin`}
      style={{ borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;
