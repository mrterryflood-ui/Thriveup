import { useEffect } from "react";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data);
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = json;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [json]);
  return null;
}
