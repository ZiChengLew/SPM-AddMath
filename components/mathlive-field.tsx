"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type MathLiveFieldProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
};

export function MathLiveField({
  value,
  onChange,
  readOnly,
  id,
  className: extraClassName,
  ...rest
}: MathLiveFieldProps) {
  const fieldRef = useRef<MathFieldElement | null>(null);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el || !onChange) {
      return;
    }

    const handler = (event: Event) => {
      const target = event.target as MathFieldElement;
      onChange(target?.value ?? "");
    };

    el.addEventListener("input", handler);
    return () => el.removeEventListener("input", handler);
  }, [onChange]);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) {
      return;
    }

    const applyValue = () => {
      if (typeof value === "string" && el.value !== value) {
        el.value = value;
      }
    };

    if (typeof window === "undefined" || !("customElements" in window)) {
      return;
    }

    if (customElements.get("math-field")) {
      applyValue();
    } else {
      customElements.whenDefined("math-field").then(applyValue);
    }
  }, [value]);

  return (
    <>
      <Script
        id="mathlive-script"
        src="https://unpkg.com/mathlive/dist/mathlive.min.js"
        strategy="afterInteractive"
      />
      <math-field
        ref={(node) => {
          fieldRef.current = node;
        }}
        id={id}
        {...rest}
        className={`rounded-md border border-gray-300 bg-white p-3 shadow-inner focus:border-blue-500 focus:outline-none ${
          extraClassName ?? ""
        }`}
        read-only={readOnly ? "" : undefined}
        virtual-keyboard-mode={readOnly ? "off" : "manual"}
        virtual-keyboard-theme="material"
      />
    </>
  );
}
