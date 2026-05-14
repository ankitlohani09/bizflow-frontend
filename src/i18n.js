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
      "System Logs": "System Logs",
      "Smart Business Tips": "Smart Business Tips",
      "AI Powered Advice": "AI Powered Advice",
      "sales_insight": "Great! Your total sales this month are {{amount}}.",
      "profit_good_insight": "Your profit margin is very good ({{margin}}%). You are making good money!",
      "profit_low_insight": "Your profit margin is low ({{margin}}%). Try to reduce your expenses or purchase costs.",
      "stock_insight": "\"{{itemName}}\" is selling very fast. Make sure you have enough stock.",
      "expense_insight": "Your expenses are more than half of your sales. Try to control your costs."
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
      "System Logs": "सिस्टम लॉग",
      "Smart Business Tips": "स्मार्ट बिज़नेस टिप्स",
      "AI Powered Advice": "एआई संचालित सलाह",
      "sales_insight": "बहुत बढ़िया! इस महीने आपकी कुल बिक्री {{amount}} है।",
      "profit_good_insight": "आपका प्रॉफिट मार्जिन बहुत अच्छा है ({{margin}}%)। आप अच्छा पैसा कमा रहे हैं!",
      "profit_low_insight": "आपका प्रॉफिट मार्जिन कम है ({{margin}}%)। अपने खर्चों या खरीद लागत को कम करने का प्रयास करें।",
      "stock_insight": "\"{{itemName}}\" बहुत तेज़ी से बिक रहा है। सुनिश्चित करें कि आपके पास पर्याप्त स्टॉक है।",
      "expense_insight": "आपके खर्चे आपकी बिक्री के आधे से अधिक हैं। अपने खर्चों को नियंत्रित करने का प्रयास करें।"
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
      "System Logs": "System Logs",
      "Smart Business Tips": "Smart Business Tips",
      "AI Powered Advice": "AI Powered Advice",
      "sales_insight": "Great! Is mahine aapki total sales {{amount}} hai.",
      "profit_good_insight": "Aapka profit margin bahut accha hai ({{margin}}%). Aap accha paisa kama rahe hain!",
      "profit_low_insight": "Aapka profit margin kam hai ({{margin}}%). Apne kharche ya purchase cost kam karne ki koshish karein.",
      "stock_insight": "\"{{itemName}}\" bahut fast sell ho rha hai. Ensure karein ki aapke paas full stock ho.",
      "expense_insight": "Aapke kharche sales ke aadhe se zyada hain. Apne kharchon ko control karne ki koshish karein."
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
