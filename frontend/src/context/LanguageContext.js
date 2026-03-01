import React, { createContext, useState, useEffect } from 'react';
import { getTranslation } from '../translations';

const LanguageContext = createContext();

const STORAGE_KEY = 'carpro-lang';

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'kz' || saved === 'en' || saved === 'ru') return saved;
    return 'ru';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'kz' ? 'kk' : lang === 'en' ? 'en' : 'ru';
  }, [lang]);

  const t = (key) => getTranslation(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
