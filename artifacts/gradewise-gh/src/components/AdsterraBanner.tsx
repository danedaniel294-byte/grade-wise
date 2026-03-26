import { useEffect, useRef } from "react";

export function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    (window as any).atOptions = {
      key: "9bf4381e0e12dd881b800f5216401a13",
      format: "iframe",
      height: 90,
      width: 728,
      params: {},
    };

    const script = document.createElement("script");
    script.src =
      "https://www.highperformanceformat.com/9bf4381e0e12dd881b800f5216401a13/invoke.js";
    script.async = true;
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, []);

  return (
    <div className="w-full flex justify-center overflow-hidden py-2">
      <div ref={containerRef} style={{ maxWidth: "100%", overflowX: "auto" }} />
    </div>
  );
}
