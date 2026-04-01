import { useState, useEffect, createContext, useContext } from "react";

const BandwidthContext = createContext<{
  isLowBandwidth: boolean;
  setLowBandwidth: (value: boolean) => void;
  toggleBandwidth: () => void;
}>({
  isLowBandwidth: false,
  setLowBandwidth: () => {},
  toggleBandwidth: () => {},
});

export function BandwidthProvider({ children }: { children: React.ReactNode }) {
  const [isLowBandwidth, setIsLowBandwidth] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("learning-academy-low-bandwidth");
        if (stored) return JSON.parse(stored) === true;
      } catch {
      }
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLowBandwidth) {
      root.classList.add("low-bandwidth");
    } else {
      root.classList.remove("low-bandwidth");
    }
    try {
      localStorage.setItem("learning-academy-low-bandwidth", JSON.stringify(isLowBandwidth));
    } catch {
    }
  }, [isLowBandwidth]);

  const setLowBandwidth = (value: boolean) => setIsLowBandwidth(value);
  const toggleBandwidth = () => setIsLowBandwidth((prev) => !prev);

  return (
    <BandwidthContext.Provider value={{ isLowBandwidth, setLowBandwidth, toggleBandwidth }}>
      {children}
    </BandwidthContext.Provider>
  );
}

export function useBandwidth() {
  return useContext(BandwidthContext);
}
