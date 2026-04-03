// src/components/LoadingSkeleton.tsx
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-soft animate-pulse">
      <div className="w-full h-48 bg-gray-200"></div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 w-1/4"></div>
        <div className="h-6 bg-gray-200 w-3/4"></div>
        <div className="h-4 bg-gray-200 w-full"></div>
        <div className="h-4 bg-gray-200 w-1/2"></div>
      </div>
    </div>
  )
}

export default LoadingSkeleton