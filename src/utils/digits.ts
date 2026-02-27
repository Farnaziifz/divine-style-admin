export const toEnglishDigits = (str: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  return str
    .replace(/[۰-۹]/g, (w) => persianDigits.indexOf(w).toString())
    .replace(/[٠-٩]/g, (w) => arabicDigits.indexOf(w).toString());
};
