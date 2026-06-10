import { useEffect, useState } from "react";

export function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number } | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const update = () => {
      const distance = target - Date.now();
      if (distance < 0) { setTimeLeft(null); return; }
      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      });
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-primary font-bold">KICKOFF</span>;

  const units = [
    { value: timeLeft.d, label: timeLeft.d === 1 ? "Día" : "Días" },
    { value: timeLeft.h, label: timeLeft.h === 1 ? "Hora" : "Horas" },
    { value: timeLeft.m, label: timeLeft.m === 1 ? "Min" : "Mins" },
  ];

  return (
    <div className="flex items-end gap-3 font-mono">
      {units.map(({ value, label }, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-lg font-black text-foreground leading-none">
            {value.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
