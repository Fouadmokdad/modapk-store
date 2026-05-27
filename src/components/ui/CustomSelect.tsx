"use client";

// =============================================================================
// CustomSelect Component — Premium Dark Glassmorphism Dropdown Selector
// =============================================================================
import React, { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string | React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  className = "",
  menuClassName = "",
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold
          bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 focus:border-emerald-500/30
          rounded-xl text-white transition-all outline-none cursor-pointer select-none
          active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
          ${isOpen ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : ""}
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-neutral-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`
            absolute z-50 left-0 right-0 mt-2 p-1.5 rounded-2xl border border-white/10 shadow-2xl
            bg-neutral-950/90 backdrop-blur-xl max-h-60 overflow-y-auto animate-scale-up select-none
            ${menuClassName}
          `}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-500 italic">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold
                    transition-all text-left truncate cursor-pointer hover:bg-white/[0.04] text-neutral-300 hover:text-white
                    ${
                      isActive
                        ? "text-emerald-400! bg-emerald-500/10! border border-emerald-500/20"
                        : "border border-transparent"
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-400 shrink-0 ml-2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
