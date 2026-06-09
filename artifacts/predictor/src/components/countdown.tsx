import { useEffect, useState } from "react";

export function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-primary font-bold">KICKOFF</span>;

  return (
    <div className="flex items-center gap-1.5 font-mono text-sm">
      <div className="flex flex-col items-center">
        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">{timeLeft.d.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex flex-col items-center">
        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">{timeLeft.h.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex flex-col items-center">
        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">{timeLeft.m.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex flex-col items-center">
        <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded">{timeLeft.s.toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
}