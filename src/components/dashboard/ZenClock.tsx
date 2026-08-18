import { useState, useEffect } from "react";

interface Props {
  className?: string;
}

export default function ZenClock({ className = "" }: Props) {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  return (
    <div className={`flex items-center justify-center select-none pointer-events-none animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      <span className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black tracking-tighter text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.55)] tabular-nums leading-none">
        {hours}:{minutes}
      </span>
    </div>
  );
}
