import { useState, useEffect } from "react";

const titles = [
  "The Only Platform Your Business Needs",
  "One Platform. Total Control.",
  "Everything Your Business Needs, All in One Place.",
  "Run Your Entire Business From One Place",
  "Stop Juggling Apps. Start Running a Business.",
  "Built for Contractors. Built for Growth.",
  "The Business Platform the Trades Have Always Deserved.",
  "Enterprise Tools. Built for the Trades.",
  "More Money. More Time. One Platform.",
  "The Platform Built to Help Contractors Win.",
  "Work Less on Your Business. Build More of It.",
];

export function RotatingHeroTitle() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % titles.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="block transition-all duration-500 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(12px)",
        filter: isVisible ? "blur(0px)" : "blur(4px)",
      }}
    >
      {titles[currentIndex]}
    </span>
  );
}
