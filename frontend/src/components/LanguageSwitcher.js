import React, { useState, useContext } from 'react';
import LanguageContext from '../context/LanguageContext';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'ru', labelKey: 'language.ru' },
  { code: 'en', labelKey: 'language.en' },
  { code: 'kz', labelKey: 'language.kz' },
];

const LanguageSwitcher = () => {
  const { lang, setLang, t } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="language-switcher">
      <button
        type="button"
        className="language-switcher-trigger"
        onClick={() => setOpen(!open)}
        title={t('language.ru')}
        aria-expanded={open}
      >
        <i className="bi bi-globe2" aria-hidden />
        <span className="language-switcher-label">{t(current.labelKey)}</span>
        <span className="language-switcher-arrow"><i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden /></span>
      </button>
      {open && (
        <>
          <div className="language-switcher-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul className="language-switcher-dropdown">
            {LANGUAGES.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  className={`language-switcher-option ${lang === l.code ? 'active' : ''}`}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                >
                  {t(l.labelKey)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
