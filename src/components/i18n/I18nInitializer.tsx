"use client";
import { useEffect } from 'react';
import { i18n } from '@/lib/i18n';

export default function I18nInitializer() {
  useEffect(() => {
    i18n.init({
      fallbackLang: 'en',
      storageKey: 'leafvn_language_preference',
      useDefaultLoadingScreen: true,
    });

    return () => {
      i18n.destroy();
    };
  }, []);

  return null;
}
