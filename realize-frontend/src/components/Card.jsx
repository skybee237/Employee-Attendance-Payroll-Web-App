import { useState } from 'react';

const Card = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue', 
  onClick, 
  loading = false,
  trend,
  percentage,
  className = '',
  size = 'medium',
  actionLabel,
  onAction
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Color schemes
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      light: 'bg-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      light: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-500'
    },
    red: {
      bg: 'bg-red-500',
      hover: 'hover:bg-red-600',
      light: 'bg-red-100',
      text: 'text-red-800',
      icon: 'text-red-500'
    },
    yellow: {
      bg: 'bg-yellow-500',
      hover: 'hover:bg-yellow-600',
      light: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: 'text-yellow-500'
    },
    purple: {
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      light: 'bg-purple-100',
      text: 'text-purple-800',
      icon: 'text-purple-500'
    },
    gray: {
      bg: 'bg-gray-500',
      hover: 'hover:bg-gray-600',
      light: 'bg-gray-100',
      text: 'text-gray-800',
      icon: 'text-gray-500'
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      padding: 'p-4',
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-xs',
      iconSize: 'text-lg'
    },
    medium: {
      padding: 'p-6',
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-sm',
      iconSize: 'text-xl'
    },
    large: {
      padding: 'p-8',
      title: 'text-lg',
      value: 'text-4xl',
      subtitle: 'text-base',
      iconSize: 'text-2xl'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;
  const sizeStyle = sizeConfig[size] || sizeConfig.medium;

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    if (onAction && !loading) {
      onAction();
    }
  };

  const renderTrend = () => {
    if (!trend && !percentage) return null;

    const isPositive = trend === 'up';
    const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→';
    const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';

    return (
      <div className={`flex items-center mt-2 ${trendColor}`}>
        <span className="text-sm mr-1">{trendIcon}</span>
        {percentage && (
          <span className="text-sm font-medium">
            {percentage}% {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : ''}
          </span>
        )}
      </div>
    );
  };

  const renderContent = () => (
    <>
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`font-semibold ${sizeStyle.title} mb-1 ${scheme.text}`}>
            {title}
          </h3>
          {subtitle && (
            <p className={`${sizeStyle.subtitle} text-gray-600`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className={`${scheme.icon} ${sizeStyle.iconSize}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="flex items-end justify-between">
        <div>
          <p className={`font-bold ${sizeStyle.value} mb-2`}>
            {loading ? (
              <div className="flex items-center">
                <div className="animate-pulse bg-white bg-opacity-30 rounded h-6 w-16"></div>
              </div>
            ) : (
              value
            )}
          </p>
          {renderTrend()}
        </div>

        {/* Action button */}
        {actionLabel && onAction && (
          <button
            onClick={handleActionClick}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              scheme.light
            } ${scheme.text} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              scheme.bg.replace('bg-', 'focus:ring-')
            }`}
            disabled={loading}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && !value && (
        <div className="space-y-2">
          <div className="animate-pulse bg-white bg-opacity-30 rounded h-4 w-3/4"></div>
          <div className="animate-pulse bg-white bg-opacity-30 rounded h-6 w-1/2"></div>
        </div>
      )}
    </>
  );

  const cardClasses = `
    rounded-xl shadow-sm transition-all duration-200
    ${scheme.bg}
    ${onClick ? `${scheme.hover} cursor-pointer transform ${isHovered ? 'scale-[1.02]' : ''}` : ''}
    ${sizeStyle.padding}
    ${className}
  `.trim();

  if (onClick) {
    return (
      <div
        className={cardClasses}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && handleClick()}
      >
        {renderContent()}
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      {renderContent()}
    </div>
  );
};

export default Card;