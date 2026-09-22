"use client";

import { useLanguage } from "./language-provider";

export function LanguageToggle() {
  const { language, setLanguage, text } = useLanguage();
  return <div className="language-toggle" role="group" aria-label={text.language}>
    <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"}>EN</button>
    <button type="button" onClick={() => setLanguage("cs")} aria-pressed={language === "cs"}>CZ</button>
  </div>;
}
