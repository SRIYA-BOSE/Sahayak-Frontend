export const Card = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl border border-white/50 bg-white/80 shadow-[0_16px_45px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl
        ${onClick ? 'cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-white/80 hover:shadow-[0_22px_50px_-24px_rgba(15,23,42,0.45)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

