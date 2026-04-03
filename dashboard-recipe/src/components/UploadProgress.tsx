// src/components/UploadProgress.tsx
const UploadProgress: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="mt-2">
      <div className="bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {progress < 100 ? `Uploading... ${progress}%` : 'Upload Complete'}
      </p>
    </div>
  )
}

export default UploadProgress