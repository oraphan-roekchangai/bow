// Google Material Icons Component
interface MaterialIconProps {
  name: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function MaterialIcon({ name, className = '', size = 'medium' }: MaterialIconProps) {
  const sizeClasses = {
    small: 'text-lg',    // 18px
    medium: 'text-2xl',  // 24px  
    large: 'text-4xl'    // 36px
  };

  return (
    <span className={`material-icons ${sizeClasses[size]} ${className}`}>
      {name}
    </span>
  );
}