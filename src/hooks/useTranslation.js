import useAppStore from '../store/useAppStore';
import { translations } from '../constants/translations';

const useTranslation = () => {
  const language = useAppStore((state) => state.language);
  
  const t = (key) => {
    const langSet = translations[language] || translations.English;
    const result = langSet[key] || translations.English[key] || key;
    return result;
  };

  return { t, language };
};

export default useTranslation;
