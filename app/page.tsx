"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function fetchTime() {
      const res = await fetch("/api/time");
      const data = await res.json();

      const serverNow = data.now;
      const target = data.target;
      const clientNow = Date.now();

      const offset = serverNow - clientNow;

      function updateCountdown() {
        const correctedNow = Date.now() + offset;
        setTimeLeft(Math.max(target - correctedNow, 0));
      }

      updateCountdown();
      intervalId = setInterval(updateCountdown, 1000);
    }

    fetchTime();

    return () => clearInterval(intervalId);
  }, []);

  function pad(n: number) {
    return n.toString().padStart(2, "0");
  }

  function format(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black gap-5 px-4 text-center">
      <h1 className="text-2xl sm:text-3xl text-[#f9ea38]">
        NÅGOT SPÄNNANDE...
      </h1>

      <div className="text-4xl sm:text-5xl md:text-6xl text-[#f9ea38] tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em]">
        {timeLeft > 0 ? format(timeLeft) : "00:00:00:00"}
      </div>

      <p className="text-xl sm:text-2xl md:text-3xl text-[#f9ea38]">
        Var: K4
      </p>
    </main>
  );
}