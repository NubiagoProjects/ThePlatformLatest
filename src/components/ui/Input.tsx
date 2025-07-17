import React from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  
  const baseClasses = 'w-full px-4 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const stateClasses = error
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
    : isFocused
    ? 'border-primary-300 focus:border-primary-500 focus:ring-primary-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
  
  const disabledClasses = props.disabled ? 'bg-neutral-50 text-neutral-500 cursor-not-allowed' : 'bg-white text-neutral-900';
  
  const classes = `${baseClasses} ${stateClasses} ${disabledClasses} ${className}`;
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const renderRightIcon = () => {
    if (type === 'password') {
      return (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      );
    }
    
    if (variant === 'search') {
      return (
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-primary-600"
        >
          <Search size={18} />
        </button>
      );
    }
    
    return rightIcon;
  };
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={`${classes} ${leftIcon ? 'pl-10' : ''} ${renderRightIcon() ? 'pr-10' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {renderRightIcon() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {renderRightIcon()}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-error-600' : 'text-neutral-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}; 