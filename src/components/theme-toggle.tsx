"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";

function currentTheme(): "light" | "dark" {
  if (
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
  ) {
    return "dark";
  }
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setTheme(currentTheme());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function handleClick() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="สลับโหมดมืด / สว่าง"
      title="สลับธีม"
      className="icon-btn"
    >
      {theme === "dark" ? (
        <Icon name="sun" className="h-[18px] w-[18px]" />
      ) : (
        <Icon name="moon" className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}