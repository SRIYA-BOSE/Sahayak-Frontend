export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-blue text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-primary-green text-white hover:green-700',
    outline: 'border-2 border-primary-blue text-primary-blue hover:bg-blue-50',
  }

  const sizes = {
    sm: 'min-h-[2.5rem] px-3 py-1.5 text-sm',
    md: 'min-h-[2.75rem] px-4 py-2 text-base',
    lg: 'min-h-[3rem] px-6 py-3 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

