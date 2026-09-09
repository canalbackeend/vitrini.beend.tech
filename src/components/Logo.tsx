import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  size?: string;
  light?: boolean;
  showTagline?: boolean;
  showRegistered?: boolean;
  className?: string;
  taglineColor?: string;
}

export function Logo({ size = 'h-7', light = false, showTagline = false, showRegistered = false, className = '', taglineColor = '' }: LogoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const useWhite = light || isDark;
  const src = useWhite ? '/logo-white.png' : '/logo-dark.png';

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-start">
        <img src={src} alt="beend.tech" className={`${size} w-auto object-contain`} />
        {showRegistered && (
          <span className={`text-[10px] md:text-[12px] mt-0.5 ml-0.5 font-sans uppercase ${useWhite ? 'text-white' : 'text-black'}`}>®</span>
        )}
      </div>
      {showTagline && (
        <div className="flex justify-between w-full mt-1 px-[1px]">
          {"SMART SOLUTION".split("").map((char, i) => (
            <span key={i} className={`text-[6px] md:text-[8px] font-thin uppercase leading-none ${taglineColor || (useWhite ? 'text-zinc-500' : 'text-slate-500')}`}>
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}