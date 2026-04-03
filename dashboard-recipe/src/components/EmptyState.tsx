// src/components/EmptyState.tsx
const EmptyState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{message}</p>
    </div>
  )
}

export default EmptyState