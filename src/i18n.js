import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Analytics": "Analytics",
      "Customers": "Customers",
      "Suppliers": "Suppliers",
      "Inventory": "Inventory",
      "Invoices": "Invoices",
      "Returns": "Returns",
      "Purchases": "Purchases",
      "Expenses": "Expenses",
      "Staff": "Staff",
      "Settings": "Settings",
      "Logout": "Logout",
      "Main Menu": "Main Menu",
      "Search": "Search",
      "Create Invoice": "Create Invoice",
      "Add Customer": "Add Customer",
      "Quick Scan": "Quick Scan (SKU/ID)...",
      "Total Amount": "Total Amount",
      "Apply Visual System": "Apply Visual System",
      "Kitchen Orders": "Kitchen Orders",
      "AI Insights": "AI Insights",
      "System Logs": "System Logs"
    }
  },
  hi: {
    translation: {
      "Dashboard": "मुख्य पृष्ठ",
      "Analytics": "विश्लेषण",
      "Customers": "ग्राहक",
      "Suppliers": "विक्रेता",
      "Inventory": "माल सूची",
      "Invoices": "बिल",
      "Returns": "वापसी",
      "Purchases": "खरीद",
      "Expenses": "खर्च",
      "Staff": "कर्मचारी",
      "Settings": "सेटिंग्स",
      "Logout": "लॉगआउट",
      "Main Menu": "मुख्य सूचि",
      "Search": "खोजें",
      "Create Invoice": "नया बिल बनाएँ",
      "Add Customer": "ग्राहक जोड़ें",
      "Quick Scan": "त्वरित स्कैन (SKU/ID)...",
      "Total Amount": "कुल राशि",
      "Apply Visual System": "सिस्टम अपडेट करें",
      "Kitchen Orders": "रसोई के आदेश",
      "AI Insights": "एआई अंतर्दृष्टि",
      "System Logs": "सिस्टम लॉग"
    }
  },
  hg: {
    translation: {
      "Dashboard": "Dashboard",
      "Analytics": "Analytics",
      "Customers": "Customers",
      "Suppliers": "Suppliers",
      "Inventory": "Inventory",
      "Invoices": "Bill aur Records",
      "Returns": "Wapsi",
      "Purchases": "Khareed-baari",
      "Expenses": "Kharcha Paani",
      "Staff": "Team Members",
      "Settings": "Settings",
      "Logout": "Logout karein",
      "Main Menu": "Main Menu",
      "Search": "Dhoondein",
      "Create Invoice": "Naya Bill banaiye",
      "Add Customer": "Customer add karein",
      "Quick Scan": "Quick Scan karein...",
      "Total Amount": "Total Paisa",
      "Apply Visual System": "Sab update karein",
      "Kitchen Orders": "Kitchen Orders",
      "AI Insights": "Smart AI Report",
      "System Logs": "System Logs"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
