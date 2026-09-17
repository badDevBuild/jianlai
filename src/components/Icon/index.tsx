import { Image } from '@tarojs/components';
import { getSvgDataUri } from './icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 24, color = '#333333', className = '', style = {} }: IconProps) {
  const src = getSvgDataUri(name, color);
  if (!src) return null;

  return (
    <Image
      className={className}
      src={src}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
      mode="aspectFit"
    />
  );
}
