// src/components/ProgressBar.tsx
interface ProgressBarProps {
  isLoading: boolean;
}

const ProgressBar = ({ isLoading }: ProgressBarProps) => {
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-transparent">
      <div
        className={`h-full bg-orange-500 transition-all duration-500 ease-out ${
          isLoading ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
        style={{
          boxShadow: isLoading ? '0 0 10px #f97316, 0 0 5px #f97316' : 'none'
        }}
      />
    </div>
  );
};

export default ProgressBar;