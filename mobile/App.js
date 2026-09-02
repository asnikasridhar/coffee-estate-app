import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import FertilizerManagement from "./FertilizerManagement";
import AppIcon from "./src/components/AppIcon";
import { colors as themeColors } from "./src/theme/tokens";

const today = new Date().toISOString().slice(0, 10);
const GREEN = "#8a5527";
const DARK = "#3f2616";
const SOFT = "#f5eee3";
const LINE = "#dfcfba";
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || "";
const PRODUCTION_API_BASE = "https://coffee-estate-app.pages.dev/api";
const FAVORITES_KEY = "estate-app-favorite-modules";
const LANGUAGE_KEY = "javaterrain-language";
const LOGIN_MEMORY_KEY = "javaterrain-remembered-login";
const LANGUAGES = [
  ["en", "English"],
  ["kn", "ಕನ್ನಡ"],
  ["ta", "தமிழ்"],
  ["ml", "മലയാളം"],
  ["hi", "हिन्दी"],
  ["te", "తెలుగు"],
];
const I18N = {
  en: {
    today: "TODAY'S ESTATE",
    attention: "What needs your attention today?",
    currentProperty: "CURRENT PROPERTY",
    selectProperty: "Select Property",
    propertiesAvailable: "properties available",
    searchProperty: "Search name, village or property ID",
    home: "Home",
    add: "Add",
    modules: "Modules",
    reports: "Reports",
    more: "More",
    login: "Login",
    connecting: "Connecting…",
    username: "Username / Email",
    password: "Password",
    tagline: "Simple • Smart • For Estate Owners",
    back: "Back",
    language: "Language",
    weatherUnavailable: "Weather unavailable",
    updatingWeather: "Updating weather…",
    feelsLike: "Feels like",
    wind: "Wind",
    humidity: "Humidity",
    rain: "Rain",
    refresh: "Refresh",
    gpsRequired:
      "Location services are off. Turn on GPS for accurate local weather.",
    enableGps: "Turn on GPS",
    allowLocation: "Allow location",
    permissionDenied: "Location permission is disabled. Enable it in Settings.",
    settings: "Settings",
    quickAdd: "Quick Add",
    todaysTasks: "Today's Tasks",
    select: "Select",
  },
  kn: {
    today: "ಇಂದಿನ ಎಸ್ಟೇಟ್",
    attention: "ಇಂದು ನಿಮ್ಮ ಗಮನಕ್ಕೆ ಏನು ಬೇಕು?",
    currentProperty: "ಪ್ರಸ್ತುತ ಆಸ್ತಿ",
    selectProperty: "ಆಸ್ತಿ ಆಯ್ಕೆಮಾಡಿ",
    propertiesAvailable: "ಆಸ್ತಿಗಳು ಲಭ್ಯ",
    searchProperty: "ಹೆಸರು, ಊರು ಅಥವಾ ಆಸ್ತಿ ID ಹುಡುಕಿ",
    home: "ಮುಖಪುಟ",
    add: "ಸೇರಿಸಿ",
    modules: "ಮಾಡ್ಯೂಲ್‌ಗಳು",
    reports: "ವರದಿಗಳು",
    more: "ಇನ್ನಷ್ಟು",
    login: "ಲಾಗಿನ್",
    connecting: "ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ…",
    username: "ಬಳಕೆದಾರ ಹೆಸರು / ಇಮೇಲ್",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    tagline: "ಸರಳ • ಚತುರ • ಎಸ್ಟೇಟ್ ಮಾಲೀಕರಿಗಾಗಿ",
    back: "ಹಿಂದೆ",
    language: "ಭಾಷೆ",
    weatherUnavailable: "ಹವಾಮಾನ ಲಭ್ಯವಿಲ್ಲ",
    updatingWeather: "ಹವಾಮಾನ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ…",
    feelsLike: "ಅನುಭವ",
    wind: "ಗಾಳಿ",
    humidity: "ಆರ್ದ್ರತೆ",
    rain: "ಮಳೆ",
    refresh: "ನವೀಕರಿಸಿ",
    gpsRequired: "ಸ್ಥಳ ಸೇವೆ ಆಫ್ ಆಗಿದೆ. ಸ್ಥಳೀಯ ಹವಾಮಾನಕ್ಕಾಗಿ GPS ಆನ್ ಮಾಡಿ.",
    enableGps: "GPS ಆನ್ ಮಾಡಿ",
    allowLocation: "ಸ್ಥಳ ಅನುಮತಿಸಿ",
    permissionDenied: "ಸ್ಥಳ ಅನುಮತಿಯನ್ನು Settings ನಲ್ಲಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    quickAdd: "ತ್ವರಿತ ಸೇರಿಕೆ",
    todaysTasks: "ಇಂದಿನ ಕೆಲಸಗಳು",
    select: "ಆಯ್ಕೆ",
  },
  ta: {
    today: "இன்றைய எஸ்டேட்",
    attention: "இன்று உங்கள் கவனம் எதற்கு?",
    currentProperty: "தற்போதைய சொத்து",
    selectProperty: "சொத்தைத் தேர்ந்தெடுக்கவும்",
    propertiesAvailable: "சொத்துகள் உள்ளன",
    searchProperty: "பெயர், ஊர் அல்லது சொத்து ID தேடவும்",
    home: "முகப்பு",
    add: "சேர்",
    modules: "தொகுதிகள்",
    reports: "அறிக்கைகள்",
    more: "மேலும்",
    login: "உள்நுழை",
    connecting: "இணைக்கிறது…",
    username: "பயனர் பெயர் / மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    tagline: "எளிது • புத்திசாலி • எஸ்டேட் உரிமையாளர்களுக்கு",
    back: "பின்",
    language: "மொழி",
    weatherUnavailable: "வானிலை கிடைக்கவில்லை",
    updatingWeather: "வானிலை புதுப்பிக்கிறது…",
    feelsLike: "உணர்வு",
    wind: "காற்று",
    humidity: "ஈரப்பதம்",
    rain: "மழை",
    refresh: "புதுப்பி",
    gpsRequired:
      "இருப்பிட சேவை அணைக்கப்பட்டுள்ளது. உள்ளூர் வானிலைக்கு GPS ஐ இயக்கவும்.",
    enableGps: "GPS இயக்கு",
    allowLocation: "இருப்பிடத்தை அனுமதி",
    permissionDenied: "Settings இல் இருப்பிட அனுமதியை இயக்கவும்.",
    settings: "அமைப்புகள்",
    quickAdd: "விரைவு சேர்",
    todaysTasks: "இன்றைய பணிகள்",
    select: "தேர்வு",
  },
  ml: {
    today: "ഇന്നത്തെ എസ്റ്റേറ്റ്",
    attention: "ഇന്ന് നിങ്ങളുടെ ശ്രദ്ധ എന്തിന്?",
    currentProperty: "നിലവിലെ പ്രോപ്പർട്ടി",
    selectProperty: "പ്രോപ്പർട്ടി തിരഞ്ഞെടുക്കുക",
    propertiesAvailable: "പ്രോപ്പർട്ടികൾ ലഭ്യമാണ്",
    searchProperty: "പേര്, ഗ്രാമം അല്ലെങ്കിൽ പ്രോപ്പർട്ടി ID തിരയുക",
    home: "ഹോം",
    add: "ചേർക്കുക",
    modules: "മോഡ്യൂളുകൾ",
    reports: "റിപ്പോർട്ടുകൾ",
    more: "കൂടുതൽ",
    login: "ലോഗിൻ",
    connecting: "ബന്ധിപ്പിക്കുന്നു…",
    username: "ഉപയോക്തൃനാമം / ഇമെയിൽ",
    password: "പാസ്‌വേഡ്",
    tagline: "ലളിതം • സ്മാർട്ട് • എസ്റ്റേറ്റ് ഉടമകൾക്ക്",
    back: "പിന്നിലേക്ക്",
    language: "ഭാഷ",
    weatherUnavailable: "കാലാവസ്ഥ ലഭ്യമല്ല",
    updatingWeather: "കാലാവസ്ഥ പുതുക്കുന്നു…",
    feelsLike: "അനുഭവം",
    wind: "കാറ്റ്",
    humidity: "ഈർപ്പം",
    rain: "മഴ",
    refresh: "പുതുക്കുക",
    gpsRequired:
      "ലൊക്കേഷൻ സേവനം ഓഫ് ആണ്. പ്രാദേശിക കാലാവസ്ഥയ്ക്ക് GPS ഓൺ ചെയ്യുക.",
    enableGps: "GPS ഓൺ ചെയ്യുക",
    allowLocation: "ലൊക്കേഷൻ അനുവദിക്കുക",
    permissionDenied: "Settings ൽ ലൊക്കേഷൻ അനുമതി നൽകുക.",
    settings: "ക്രമീകരണങ്ങൾ",
    quickAdd: "വേഗത്തിൽ ചേർക്കുക",
    todaysTasks: "ഇന്നത്തെ ജോലികൾ",
    select: "തിരഞ്ഞെടുക്കുക",
  },
  hi: {
    today: "आज का एस्टेट",
    attention: "आज किस पर ध्यान देना है?",
    currentProperty: "वर्तमान संपत्ति",
    selectProperty: "संपत्ति चुनें",
    propertiesAvailable: "संपत्तियाँ उपलब्ध",
    searchProperty: "नाम, गाँव या संपत्ति ID खोजें",
    home: "होम",
    add: "जोड़ें",
    modules: "मॉड्यूल",
    reports: "रिपोर्ट",
    more: "अधिक",
    login: "लॉगिन",
    connecting: "कनेक्ट हो रहा है…",
    username: "यूज़र नाम / ईमेल",
    password: "पासवर्ड",
    tagline: "सरल • स्मार्ट • एस्टेट मालिकों के लिए",
    back: "पीछे",
    language: "भाषा",
    weatherUnavailable: "मौसम उपलब्ध नहीं",
    updatingWeather: "मौसम अपडेट हो रहा है…",
    feelsLike: "महसूस",
    wind: "हवा",
    humidity: "नमी",
    rain: "बारिश",
    refresh: "ताज़ा करें",
    gpsRequired: "स्थान सेवा बंद है। स्थानीय मौसम के लिए GPS चालू करें।",
    enableGps: "GPS चालू करें",
    allowLocation: "स्थान की अनुमति दें",
    permissionDenied: "Settings में स्थान अनुमति चालू करें।",
    settings: "सेटिंग्स",
    quickAdd: "त्वरित जोड़ें",
    todaysTasks: "आज के कार्य",
    select: "चुनें",
  },
  te: {
    today: "నేటి ఎస్టేట్",
    attention: "ఈ రోజు మీ దృష్టి దేనిపై?",
    currentProperty: "ప్రస్తుత ఆస్తి",
    selectProperty: "ఆస్తిని ఎంచుకోండి",
    propertiesAvailable: "ఆస్తులు అందుబాటులో ఉన్నాయి",
    searchProperty: "పేరు, గ్రామం లేదా ఆస్తి ID వెతకండి",
    home: "హోమ్",
    add: "జోడించు",
    modules: "మాడ్యూల్స్",
    reports: "నివేదికలు",
    more: "మరిన్ని",
    login: "లాగిన్",
    connecting: "కనెక్ట్ అవుతోంది…",
    username: "వినియోగదారు పేరు / ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    tagline: "సులభం • స్మార్ట్ • ఎస్టేట్ యజమానులకు",
    back: "వెనుకకు",
    language: "భాష",
    weatherUnavailable: "వాతావరణం అందుబాటులో లేదు",
    updatingWeather: "వాతావరణం నవీకరిస్తోంది…",
    feelsLike: "అనుభూతి",
    wind: "గాలి",
    humidity: "తేమ",
    rain: "వర్షం",
    refresh: "నవీకరించు",
    gpsRequired: "స్థాన సేవ ఆఫ్‌లో ఉంది. స్థానిక వాతావరణం కోసం GPS ఆన్ చేయండి.",
    enableGps: "GPS ఆన్ చేయండి",
    allowLocation: "స్థానాన్ని అనుమతించండి",
    permissionDenied: "Settings లో స్థాన అనుమతిని ఆన్ చేయండి.",
    settings: "సెట్టింగ్స్",
    quickAdd: "త్వరిత జోడింపు",
    todaysTasks: "నేటి పనులు",
    select: "ఎంచుకోండి",
  },
};
const COMMON_UI = {
  en: {
    save: "Save",
    update: "Update",
    cancelEdit: "Cancel edit",
    records: "Records",
    entries: "entries",
    optional: "optional",
    none: "None",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    historyPeriod: "History period",
    reset: "Reset",
    from: "FROM",
    to: "TO",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    selectPrefix: "Select",
    noRecords: "No records in this period.",
    account: "Account",
    logout: "Logout",
  },
  kn: {
    save: "ಉಳಿಸಿ",
    update: "ನವೀಕರಿಸಿ",
    cancelEdit: "ತಿದ್ದುಪಡಿ ರದ್ದು",
    records: "ದಾಖಲೆಗಳು",
    entries: "ದಾಖಲೆಗಳು",
    optional: "ಐಚ್ಛಿಕ",
    none: "ಯಾವುದೂ ಇಲ್ಲ",
    close: "ಮುಚ್ಚಿ",
    delete: "ಅಳಿಸಿ",
    edit: "ತಿದ್ದು",
    historyPeriod: "ಇತಿಹಾಸ ಅವಧಿ",
    reset: "ಮರುಹೊಂದಿಸಿ",
    from: "ಇಂದ",
    to: "ವರೆಗೆ",
    previous: "ಹಿಂದಿನ",
    next: "ಮುಂದಿನ",
    page: "ಪುಟ",
    of: "ರಲ್ಲಿ",
    selectPrefix: "ಆಯ್ಕೆಮಾಡಿ",
    noRecords: "ಈ ಅವಧಿಯಲ್ಲಿ ದಾಖಲೆಗಳಿಲ್ಲ.",
    account: "ಖಾತೆ",
    logout: "ಲಾಗ್ ಔಟ್",
  },
  ta: {
    save: "சேமி",
    update: "புதுப்பி",
    cancelEdit: "திருத்தத்தை ரத்து செய்",
    records: "பதிவுகள்",
    entries: "பதிவுகள்",
    optional: "விருப்பம்",
    none: "எதுவுமில்லை",
    close: "மூடு",
    delete: "நீக்கு",
    edit: "திருத்து",
    historyPeriod: "வரலாற்றுக் காலம்",
    reset: "மீட்டமை",
    from: "முதல்",
    to: "வரை",
    previous: "முந்தைய",
    next: "அடுத்து",
    page: "பக்கம்",
    of: "இல்",
    selectPrefix: "தேர்ந்தெடு",
    noRecords: "இந்த காலத்தில் பதிவுகள் இல்லை.",
    account: "கணக்கு",
    logout: "வெளியேறு",
  },
  ml: {
    save: "സേവ്",
    update: "പുതുക്കുക",
    cancelEdit: "തിരുത്തൽ റദ്ദാക്കുക",
    records: "രേഖകൾ",
    entries: "രേഖകൾ",
    optional: "ഐച്ഛികം",
    none: "ഒന്നുമില്ല",
    close: "അടയ്ക്കുക",
    delete: "ഇല്ലാതാക്കുക",
    edit: "തിരുത്തുക",
    historyPeriod: "ചരിത്ര കാലയളവ്",
    reset: "പുനഃസജ്ജമാക്കുക",
    from: "മുതൽ",
    to: "വരെ",
    previous: "മുമ്പത്തെ",
    next: "അടുത്തത്",
    page: "പേജ്",
    of: "ൽ",
    selectPrefix: "തിരഞ്ഞെടുക്കുക",
    noRecords: "ഈ കാലയളവിൽ രേഖകളില്ല.",
    account: "അക്കൗണ്ട്",
    logout: "ലോഗ് ഔട്ട്",
  },
  hi: {
    save: "सहेजें",
    update: "अपडेट करें",
    cancelEdit: "संपादन रद्द करें",
    records: "रिकॉर्ड",
    entries: "रिकॉर्ड",
    optional: "वैकल्पिक",
    none: "कोई नहीं",
    close: "बंद करें",
    delete: "हटाएँ",
    edit: "संपादित करें",
    historyPeriod: "इतिहास अवधि",
    reset: "रीसेट",
    from: "से",
    to: "तक",
    previous: "पिछला",
    next: "अगला",
    page: "पृष्ठ",
    of: "में से",
    selectPrefix: "चुनें",
    noRecords: "इस अवधि में कोई रिकॉर्ड नहीं।",
    account: "खाता",
    logout: "लॉग आउट",
  },
  te: {
    save: "సేవ్",
    update: "నవీకరించు",
    cancelEdit: "సవరణ రద్దు",
    records: "రికార్డులు",
    entries: "రికార్డులు",
    optional: "ఐచ్ఛికం",
    none: "ఏదీ లేదు",
    close: "మూసివేయి",
    delete: "తొలగించు",
    edit: "సవరించు",
    historyPeriod: "చరిత్ర కాలం",
    reset: "రీసెట్",
    from: "నుండి",
    to: "వరకు",
    previous: "మునుపటి",
    next: "తదుపరి",
    page: "పేజీ",
    of: "లో",
    selectPrefix: "ఎంచుకోండి",
    noRecords: "ఈ కాలంలో రికార్డులు లేవు.",
    account: "ఖాతా",
    logout: "లాగ్ అవుట్",
  },
};
const MODULE_TRANSLATIONS = {
  kn: {
    properties: "ಆಸ್ತಿ ನಿರ್ವಹಣೆ",
    blocks: "ಬ್ಲಾಕ್‌ಗಳು ಮತ್ತು ಉಪಬ್ಲಾಕ್‌ಗಳು",
    baseUnits: "ಮೂಲ ಘಟಕಗಳು",
    assets: "ಆಸ್ತಿಗಳು / ದಾಸ್ತಾನು",
    plants: "ಸಸ್ಯ ಮಾಸ್ಟರ್",
    plantInventory: "ಸಸ್ಯ ದಾಸ್ತಾನು",
    yieldTypes: "ಇಳುವರಿ ವಿಧಗಳು",
    yieldRates: "ಇಳುವರಿ ದರಗಳು",
    cropDetails: "ಬೆಳೆ ವಿವರಗಳು",
    cropIncome: "ಆದಾಯ",
    fertilizers: "ಗೊಬ್ಬರ ದಾಖಲೆ",
    labors: "ಕಾರ್ಮಿಕರು",
    vendors: "ಮಾರಾಟಗಾರರು",
    laborVendors: "ಮಾರಾಟಗಾರ ಕಾರ್ಮಿಕರು",
    wages: "ವೇತನ ಸಂರಚನೆ",
    wageSettlements: "ವೇತನ ಪಾವತಿ",
    vendorSettlements: "ಮಾರಾಟಗಾರ ಪಾವತಿ",
    attendanceQuick: "ಹಾಜರಾತಿ",
    rainfallQuick: "ಮಳೆ ದಾಖಲೆ",
    yieldQuick: "ಕೊಯ್ಲು / ಇಳುವರಿ",
    expenses: "ವೆಚ್ಚ ದಾಖಲೆ",
    workActivities: "ಕೆಲಸ ಚಟುವಟಿಕೆ",
    workAssignments: "ಕೆಲಸ ನಿಯೋಜನೆ",
    reports: "ವರದಿಗಳು",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
  },
  ta: {
    properties: "சொத்து நிர்வாகம்",
    blocks: "பிளாக்குகள் மற்றும் துணைப் பிளாக்குகள்",
    baseUnits: "அடிப்படை அலகுகள்",
    assets: "சொத்துகள் / இருப்பு",
    plants: "தாவர பட்டியல்",
    plantInventory: "தாவர இருப்பு",
    yieldTypes: "விளைச்சல் வகைகள்",
    yieldRates: "விளைச்சல் விலைகள்",
    cropDetails: "பயிர் விவரங்கள்",
    cropIncome: "வருமானம்",
    fertilizers: "உரப் பதிவு",
    labors: "தொழிலாளர்கள்",
    vendors: "விற்பனையாளர்கள்",
    laborVendors: "விற்பனையாளர் தொழிலாளர்கள்",
    wages: "ஊதிய அமைப்பு",
    wageSettlements: "ஊதிய தீர்வு",
    vendorSettlements: "விற்பனையாளர் தீர்வு",
    attendanceQuick: "வருகை",
    rainfallQuick: "மழைப் பதிவு",
    yieldQuick: "அறுவடை / விளைச்சல்",
    expenses: "செலவுப் பதிவு",
    workActivities: "வேலை செயல்பாடு",
    workAssignments: "வேலை ஒதுக்கீடு",
    reports: "அறிக்கைகள்",
    notifications: "அறிவிப்புகள்",
    settings: "அமைப்புகள்",
  },
  ml: {
    properties: "പ്രോപ്പർട്ടി മാനേജ്മെന്റ്",
    blocks: "ബ്ലോക്കുകളും ഉപബ്ലോക്കുകളും",
    baseUnits: "അടിസ്ഥാന യൂണിറ്റുകൾ",
    assets: "ആസ്തികൾ / ഇൻവെന്ററി",
    plants: "സസ്യ മാസ്റ്റർ",
    plantInventory: "സസ്യ ഇൻവെന്ററി",
    yieldTypes: "വിളവ് തരങ്ങൾ",
    yieldRates: "വിളവ് നിരക്കുകൾ",
    cropDetails: "വിള വിശദാംശങ്ങൾ",
    cropIncome: "വരുമാനം",
    fertilizers: "വളം രേഖ",
    labors: "തൊഴിലാളികൾ",
    vendors: "വിൽപ്പനക്കാർ",
    laborVendors: "വെൻഡർ തൊഴിലാളികൾ",
    wages: "വേതന ക്രമീകരണം",
    wageSettlements: "വേതന തീർപ്പാക്കൽ",
    vendorSettlements: "വെൻഡർ തീർപ്പാക്കൽ",
    attendanceQuick: "ഹാജർ",
    rainfallQuick: "മഴ രേഖ",
    yieldQuick: "വിളവെടുപ്പ് / വിളവ്",
    expenses: "ചെലവ് രേഖ",
    workActivities: "ജോലി പ്രവർത്തനം",
    workAssignments: "ജോലി നിയോഗം",
    reports: "റിപ്പോർട്ടുകൾ",
    notifications: "അറിയിപ്പുകൾ",
    settings: "ക്രമീകരണങ്ങൾ",
  },
  hi: {
    properties: "संपत्ति प्रबंधन",
    blocks: "ब्लॉक और उप-ब्लॉक",
    baseUnits: "मूल इकाइयाँ",
    assets: "संपत्ति / इन्वेंटरी",
    plants: "पौधा मास्टर",
    plantInventory: "पौधा इन्वेंटरी",
    yieldTypes: "उपज प्रकार",
    yieldRates: "उपज दरें",
    cropDetails: "फसल विवरण",
    cropIncome: "आय",
    fertilizers: "उर्वरक रिकॉर्ड",
    labors: "मजदूर",
    vendors: "विक्रेता",
    laborVendors: "विक्रेता मजदूर",
    wages: "मजदूरी व्यवस्था",
    wageSettlements: "मजदूरी निपटान",
    vendorSettlements: "विक्रेता निपटान",
    attendanceQuick: "उपस्थिति",
    rainfallQuick: "वर्षा रिकॉर्ड",
    yieldQuick: "कटाई / उपज",
    expenses: "खर्च रिकॉर्ड",
    workActivities: "कार्य गतिविधि",
    workAssignments: "कार्य आवंटन",
    reports: "रिपोर्ट",
    notifications: "सूचनाएँ",
    settings: "सेटिंग्स",
  },
  te: {
    properties: "ఆస్తి నిర్వహణ",
    blocks: "బ్లాక్‌లు మరియు ఉపబ్లాక్‌లు",
    baseUnits: "మూల యూనిట్లు",
    assets: "ఆస్తులు / ఇన్వెంటరీ",
    plants: "మొక్కల మాస్టర్",
    plantInventory: "మొక్కల ఇన్వెంటరీ",
    yieldTypes: "దిగుబడి రకాలు",
    yieldRates: "దిగుబడి ధరలు",
    cropDetails: "పంట వివరాలు",
    cropIncome: "ఆదాయం",
    fertilizers: "ఎరువు రికార్డు",
    labors: "కార్మికులు",
    vendors: "విక్రేతలు",
    laborVendors: "విక్రేత కార్మికులు",
    wages: "వేతన అమరిక",
    wageSettlements: "వేతన పరిష్కారం",
    vendorSettlements: "విక్రేత పరిష్కారం",
    attendanceQuick: "హాజరు",
    rainfallQuick: "వర్షపు నమోదు",
    yieldQuick: "కోత / దిగుబడి",
    expenses: "ఖర్చు నమోదు",
    workActivities: "పని కార్యకలాపం",
    workAssignments: "పని కేటాయింపు",
    reports: "నివేదికలు",
    notifications: "నోటిఫికేషన్లు",
    settings: "సెట్టింగ్స్",
  },
};
function translator(language) {
  return (key) => I18N[language]?.[key] || I18N.en[key] || key;
}
function uiTranslator(language) {
  const core = translator(language);
  return (key) =>
    key === "date"
      ? fieldName(language, "date", "Date")
      : COMMON_UI[language]?.[key] || core(key);
}
function moduleName(language, key) {
  return MODULE_TRANSLATIONS[language]?.[key] || labels[key] || key;
}
const FIELD_WORDS = {
  kn: {
    property: "ಆಸ್ತಿ",
    name: "ಹೆಸರು",
    total: "ಒಟ್ಟು",
    area: "ವಿಸ್ತೀರ್ಣ",
    address: "ವಿಳಾಸ",
    pincode: "ಪಿನ್ ಕೋಡ್",
    block: "ಬ್ಲಾಕ್",
    parent: "ಮೂಲ",
    date: "ದಿನಾಂಕ",
    quantity: "ಪ್ರಮಾಣ",
    price: "ಬೆಲೆ",
    year: "ವರ್ಷ",
    status: "ಸ್ಥಿತಿ",
    details: "ವಿವರಗಳು",
    notes: "ಟಿಪ್ಪಣಿಗಳು",
    plant: "ಸಸ್ಯ",
    type: "ವಿಧ",
    labour: "ಕಾರ್ಮಿಕ",
    vendor: "ಪೂರೈಕೆದಾರ",
    wage: "ವೇತನ",
    amount: "ಮೊತ್ತ",
    attendance: "ಹಾಜರಾತಿ",
    rain: "ಮಳೆ",
    expense: "ವೆಚ್ಚ",
    work: "ಕೆಲಸ",
    activity: "ಚಟುವಟಿಕೆ",
    income: "ಆದಾಯ",
    code: "ಕೋಡ್",
    unit: "ಘಟಕ",
    selling: "ಮಾರಾಟ",
    received: "ಸ್ವೀಕರಿಸಿದ",
  },
  ta: {
    property: "சொத்து",
    name: "பெயர்",
    total: "மொத்த",
    area: "பரப்பளவு",
    address: "முகவரி",
    pincode: "அஞ்சல் குறியீடு",
    block: "தொகுதி",
    parent: "முதன்மை",
    date: "தேதி",
    quantity: "அளவு",
    price: "விலை",
    year: "ஆண்டு",
    status: "நிலை",
    details: "விவரங்கள்",
    notes: "குறிப்புகள்",
    plant: "பயிர்",
    type: "வகை",
    labour: "தொழிலாளர்",
    vendor: "விற்பனையாளர்",
    wage: "ஊதியம்",
    amount: "தொகை",
    attendance: "வருகை",
    rain: "மழை",
    expense: "செலவு",
    work: "வேலை",
    activity: "செயல்பாடு",
    income: "வருமானம்",
    code: "குறியீடு",
    unit: "அலகு",
    selling: "விற்பனை",
    received: "பெற்ற",
  },
  ml: {
    property: "പ്രോപ്പർട്ടി",
    name: "പേര്",
    total: "ആകെ",
    area: "വിസ്തീർണം",
    address: "വിലാസം",
    pincode: "പിൻ കോഡ്",
    block: "ബ്ലോക്ക്",
    parent: "പാരന്റ്",
    date: "തീയതി",
    quantity: "അളവ്",
    price: "വില",
    year: "വർഷം",
    status: "നില",
    details: "വിശദാംശങ്ങൾ",
    notes: "കുറിപ്പുകൾ",
    plant: "ചെടി",
    type: "തരം",
    labour: "തൊഴിലാളി",
    vendor: "വെണ്ടർ",
    wage: "വേതനം",
    amount: "തുക",
    attendance: "ഹാജർ",
    rain: "മഴ",
    expense: "ചെലവ്",
    work: "ജോലി",
    activity: "പ്രവർത്തനം",
    income: "വരുമാനം",
    code: "കോഡ്",
    unit: "യൂണിറ്റ്",
    selling: "വിൽപ്പന",
    received: "ലഭിച്ച",
  },
  hi: {
    property: "संपत्ति",
    name: "नाम",
    total: "कुल",
    area: "क्षेत्रफल",
    address: "पता",
    pincode: "पिन कोड",
    block: "ब्लॉक",
    parent: "मूल",
    date: "तारीख",
    quantity: "मात्रा",
    price: "कीमत",
    year: "वर्ष",
    status: "स्थिति",
    details: "विवरण",
    notes: "टिप्पणियाँ",
    plant: "पौधा",
    type: "प्रकार",
    labour: "मज़दूर",
    vendor: "विक्रेता",
    wage: "मज़दूरी",
    amount: "राशि",
    attendance: "उपस्थिति",
    rain: "बारिश",
    expense: "खर्च",
    work: "कार्य",
    activity: "गतिविधि",
    income: "आय",
    code: "कोड",
    unit: "इकाई",
    selling: "बिक्री",
    received: "प्राप्त",
  },
  te: {
    property: "ఆస్తి",
    name: "పేరు",
    total: "మొత్తం",
    area: "విస్తీర్ణం",
    address: "చిరునామా",
    pincode: "పిన్ కోడ్",
    block: "బ్లాక్",
    parent: "మూల",
    date: "తేదీ",
    quantity: "పరిమాణం",
    price: "ధర",
    year: "సంవత్సరం",
    status: "స్థితి",
    details: "వివరాలు",
    notes: "గమనికలు",
    plant: "మొక్క",
    type: "రకం",
    labour: "కార్మికుడు",
    vendor: "విక్రేత",
    wage: "వేతనం",
    amount: "మొత్తం",
    attendance: "హాజరు",
    rain: "వర్షం",
    expense: "ఖర్చు",
    work: "పని",
    activity: "కార్యాచరణ",
    income: "ఆదాయం",
    code: "కోడ్",
    unit: "యూనిట్",
    selling: "అమ్మకం",
    received: "అందుకున్న",
  },
};
function fieldName(language, key, fallback) {
  if (language === "en") return fallback;
  const words = FIELD_WORDS[language] || {};
  return key
    .replace(/_id$/, "")
    .split("_")
    .map((word) => words[word] || word)
    .join(" ");
}
function localeFor(language) {
  return (
    {
      en: "en-IN",
      kn: "kn-IN",
      ta: "ta-IN",
      ml: "ml-IN",
      hi: "hi-IN",
      te: "te-IN",
    }[language] || "en-IN"
  );
}
const ATTENDANCE_TEXT = {
  en: {
    mark: "Mark attendance",
    labour: "Labour",
    full: "1 Day",
    half: "½ Day",
    absent: "Absent",
    save: "Save Attendance",
    saved: "Attendance summary",
    attendance: "Attendance",
    days: "Days attended",
    view: "View dates",
    edit: "Edit Attendance",
    clear: "Clear Day",
    present: "Attendance is already present for this property and date.",
    empty: "No labourers are registered for this property.",
  },
  kn: {
    mark: "ಹಾಜರಾತಿ ಗುರುತಿಸಿ",
    labour: "ಕಾರ್ಮಿಕ",
    full: "1 ದಿನ",
    half: "½ ದಿನ",
    absent: "ಗೈರು",
    save: "ಹಾಜರಾತಿ ಉಳಿಸಿ",
    saved: "ಹಾಜರಾತಿ ಸಾರಾಂಶ",
    attendance: "ಹಾಜರಾತಿ",
    days: "ಹಾಜರಾದ ದಿನಗಳು",
    view: "ದಿನಾಂಕಗಳನ್ನು ನೋಡಿ",
    edit: "ಹಾಜರಾತಿ ತಿದ್ದು",
    clear: "ದಿನವನ್ನು ತೆರವುಗೊಳಿಸಿ",
    present: "ಈ ಆಸ್ತಿ ಮತ್ತು ದಿನಾಂಕಕ್ಕೆ ಹಾಜರಾತಿ ಈಗಾಗಲೇ ಇದೆ.",
    empty: "ಈ ಆಸ್ತಿಗೆ ಕಾರ್ಮಿಕರು ನೋಂದಾಯಿಸಿಲ್ಲ.",
  },
  ta: {
    mark: "வருகையை குறிக்கவும்",
    labour: "தொழிலாளர்",
    full: "1 நாள்",
    half: "½ நாள்",
    absent: "வரவில்லை",
    save: "வருகையை சேமி",
    saved: "வருகை சுருக்கம்",
    attendance: "வருகை",
    days: "வருகை நாட்கள்",
    view: "தேதிகளை காண்க",
    edit: "வருகையை திருத்து",
    clear: "நாளை அழி",
    present: "இந்த சொத்து மற்றும் தேதிக்கு வருகை ஏற்கனவே உள்ளது.",
    empty: "இந்த சொத்தில் தொழிலாளர்கள் பதிவு செய்யப்படவில்லை.",
  },
  ml: {
    mark: "ഹാജർ രേഖപ്പെടുത്തുക",
    labour: "തൊഴിലാളി",
    full: "1 ദിവസം",
    half: "½ ദിവസം",
    absent: "ഹാജരല്ല",
    save: "ഹാജർ സേവ് ചെയ്യുക",
    saved: "ഹാജർ സംഗ്രഹം",
    attendance: "ഹാജർ",
    days: "ഹാജരായ ദിവസങ്ങൾ",
    view: "തീയതികൾ കാണുക",
    edit: "ഹാജർ തിരുത്തുക",
    clear: "ദിവസം മായ്ക്കുക",
    present: "ഈ പ്രോപ്പർട്ടിക്കും തീയതിക്കും ഹാജർ നിലവിലുണ്ട്.",
    empty: "ഈ പ്രോപ്പർട്ടിയിൽ തൊഴിലാളികൾ രജിസ്റ്റർ ചെയ്തിട്ടില്ല.",
  },
  hi: {
    mark: "उपस्थिति दर्ज करें",
    labour: "मज़दूर",
    full: "1 दिन",
    half: "½ दिन",
    absent: "अनुपस्थित",
    save: "उपस्थिति सहेजें",
    saved: "उपस्थिति सारांश",
    attendance: "उपस्थिति",
    days: "उपस्थित दिन",
    view: "तारीखें देखें",
    edit: "उपस्थिति संपादित करें",
    clear: "दिन की उपस्थिति मिटाएँ",
    present: "इस संपत्ति और तारीख की उपस्थिति पहले से मौजूद है।",
    empty: "इस संपत्ति के लिए कोई मज़दूर पंजीकृत नहीं है।",
  },
  te: {
    mark: "హాజరు నమోదు చేయండి",
    labour: "కార్మికుడు",
    full: "1 రోజు",
    half: "½ రోజు",
    absent: "గైర్హాజరు",
    save: "హాజరు సేవ్ చేయండి",
    saved: "హాజరు సారాంశం",
    attendance: "హాజరు",
    days: "హాజరైన రోజులు",
    view: "తేదీలు చూడండి",
    edit: "హాజరు సవరించు",
    clear: "రోజును తొలగించు",
    present: "ఈ ఆస్తి మరియు తేదీకి హాజరు ఇప్పటికే ఉంది.",
    empty: "ఈ ఆస్తికి కార్మికులు నమోదు కాలేదు.",
  },
};
const RAIN_TEXT = {
  en: {
    title: "Rainfall Entry",
    block: "Block",
    date: "Date",
    amount: "Rainfall",
    save: "Save Rainfall",
    cumulative: "Cumulative rainfall",
    range: "Selected range",
    logs: "View logged records",
    logged: "Logged rainfall",
    empty: "No rainfall recorded in this range.",
  },
  kn: {
    title: "ಮಳೆ ದಾಖಲೆ",
    block: "ಬ್ಲಾಕ್",
    date: "ದಿನಾಂಕ",
    amount: "ಮಳೆ",
    save: "ಮಳೆ ಉಳಿಸಿ",
    cumulative: "ಒಟ್ಟು ಮಳೆ",
    range: "ಆಯ್ದ ಅವಧಿ",
    logs: "ದಾಖಲೆಗಳನ್ನು ನೋಡಿ",
    logged: "ಮಳೆ ದಾಖಲೆಗಳು",
    empty: "ಈ ಅವಧಿಯಲ್ಲಿ ಮಳೆ ದಾಖಲಾಗಿಲ್ಲ.",
  },
  ta: {
    title: "மழைப்பதிவு",
    block: "தொகுதி",
    date: "தேதி",
    amount: "மழை",
    save: "மழையை சேமி",
    cumulative: "மொத்த மழை",
    range: "தேர்ந்தெடுத்த காலம்",
    logs: "பதிவுகளை காண்க",
    logged: "மழைப் பதிவுகள்",
    empty: "இந்த காலத்தில் மழை பதிவு இல்லை.",
  },
  ml: {
    title: "മഴ രേഖ",
    block: "ബ്ലോക്ക്",
    date: "തീയതി",
    amount: "മഴ",
    save: "മഴ സേവ് ചെയ്യുക",
    cumulative: "ആകെ മഴ",
    range: "തിരഞ്ഞെടുത്ത കാലയളവ്",
    logs: "രേഖകൾ കാണുക",
    logged: "മഴ രേഖകൾ",
    empty: "ഈ കാലയളവിൽ മഴ രേഖപ്പെടുത്തിയിട്ടില്ല.",
  },
  hi: {
    title: "वर्षा प्रविष्टि",
    block: "ब्लॉक",
    date: "तारीख",
    amount: "वर्षा",
    save: "वर्षा सहेजें",
    cumulative: "कुल वर्षा",
    range: "चुनी हुई अवधि",
    logs: "दर्ज रिकॉर्ड देखें",
    logged: "वर्षा रिकॉर्ड",
    empty: "इस अवधि में वर्षा दर्ज नहीं है।",
  },
  te: {
    title: "వర్షపాతం నమోదు",
    block: "బ్లాక్",
    date: "తేదీ",
    amount: "వర్షపాతం",
    save: "వర్షపాతం సేవ్ చేయండి",
    cumulative: "మొత్తం వర్షపాతం",
    range: "ఎంచుకున్న కాలం",
    logs: "నమోదులను చూడండి",
    logged: "వర్షపాతం నమోదులు",
    empty: "ఈ కాలంలో వర్షపాతం నమోదు కాలేదు.",
  },
};
const WORK_TEXT = {
  en: {
    title: "Work Assignment",
    assignDate: "Assignment date",
    attended: "Labour present",
    noAttendance: "No labour with attendance for this date.",
    addWork: "Add work",
    activity: "Work activity",
    block: "Block",
    notes: "Notes",
    add: "Add assignment",
    pending: "Pending",
    saved: "Saved",
    saveAll: "Save all assignments",
    summary: "Work summary",
    labourCount: "labourers",
    filterBlock: "Filter by block",
    filterLabour: "Filter by labour",
    all: "All",
    details: "Assigned labourers",
    edit: "Edit assignment",
  },
  kn: {
    title: "ಕೆಲಸ ನಿಯೋಜನೆ",
    assignDate: "ನಿಯೋಜನೆ ದಿನಾಂಕ",
    attended: "ಹಾಜರಾದ ಕಾರ್ಮಿಕರು",
    noAttendance: "ಈ ದಿನಾಂಕಕ್ಕೆ ಹಾಜರಾದ ಕಾರ್ಮಿಕರಿಲ್ಲ.",
    addWork: "ಕೆಲಸ ಸೇರಿಸಿ",
    activity: "ಕೆಲಸ ಚಟುವಟಿಕೆ",
    block: "ಬ್ಲಾಕ್",
    notes: "ಟಿಪ್ಪಣಿಗಳು",
    add: "ನಿಯೋಜನೆ ಸೇರಿಸಿ",
    pending: "ಬಾಕಿ",
    saved: "ಉಳಿಸಲಾಗಿದೆ",
    saveAll: "ಎಲ್ಲಾ ನಿಯೋಜನೆ ಉಳಿಸಿ",
    summary: "ಕೆಲಸ ಸಾರಾಂಶ",
    labourCount: "ಕಾರ್ಮಿಕರು",
    filterBlock: "ಬ್ಲಾಕ್ ಮೂಲಕ ಫಿಲ್ಟರ್",
    filterLabour: "ಕಾರ್ಮಿಕ ಮೂಲಕ ಫಿಲ್ಟರ್",
    all: "ಎಲ್ಲಾ",
    details: "ನಿಯೋಜಿತ ಕಾರ್ಮಿಕರು",
    edit: "ನಿಯೋಜನೆ ತಿದ್ದು",
  },
  ta: {
    title: "வேலை ஒதுக்கீடு",
    assignDate: "ஒதுக்கீட்டு தேதி",
    attended: "வருகை தொழிலாளர்கள்",
    noAttendance: "இந்த தேதிக்கு வருகை தொழிலாளர்கள் இல்லை.",
    addWork: "வேலை சேர்",
    activity: "வேலை செயல்பாடு",
    block: "தொகுதி",
    notes: "குறிப்புகள்",
    add: "ஒதுக்கீடு சேர்",
    pending: "நிலுவை",
    saved: "சேமிக்கப்பட்டது",
    saveAll: "அனைத்தையும் சேமி",
    summary: "வேலை சுருக்கம்",
    labourCount: "தொழிலாளர்கள்",
    filterBlock: "தொகுதி வடிகட்டி",
    filterLabour: "தொழிலாளர் வடிகட்டி",
    all: "அனைத்தும்",
    details: "ஒதுக்கப்பட்ட தொழிலாளர்கள்",
    edit: "ஒதுக்கீட்டை திருத்து",
  },
  ml: {
    title: "ജോലി നിയോഗം",
    assignDate: "നിയോഗ തീയതി",
    attended: "ഹാജരായ തൊഴിലാളികൾ",
    noAttendance: "ഈ തീയതിയിൽ ഹാജരായ തൊഴിലാളികളില്ല.",
    addWork: "ജോലി ചേർക്കുക",
    activity: "ജോലി പ്രവർത്തനം",
    block: "ബ്ലോക്ക്",
    notes: "കുറിപ്പുകൾ",
    add: "നിയോഗം ചേർക്കുക",
    pending: "ബാക്കി",
    saved: "സേവ് ചെയ്തു",
    saveAll: "എല്ലാ നിയോഗങ്ങളും സേവ് ചെയ്യുക",
    summary: "ജോലി സംഗ്രഹം",
    labourCount: "തൊഴിലാളികൾ",
    filterBlock: "ബ്ലോക്ക് ഫിൽട്ടർ",
    filterLabour: "തൊഴിലാളി ഫിൽട്ടർ",
    all: "എല്ലാം",
    details: "നിയോഗിച്ച തൊഴിലാളികൾ",
    edit: "നിയോഗം തിരുത്തുക",
  },
  hi: {
    title: "कार्य आवंटन",
    assignDate: "आवंटन तारीख",
    attended: "उपस्थित मज़दूर",
    noAttendance: "इस तारीख के लिए कोई उपस्थित मज़दूर नहीं है।",
    addWork: "कार्य जोड़ें",
    activity: "कार्य गतिविधि",
    block: "ब्लॉक",
    notes: "टिप्पणियाँ",
    add: "आवंटन जोड़ें",
    pending: "लंबित",
    saved: "सहेजा गया",
    saveAll: "सभी आवंटन सहेजें",
    summary: "कार्य सारांश",
    labourCount: "मज़दूर",
    filterBlock: "ब्लॉक फ़िल्टर",
    filterLabour: "मज़दूर फ़िल्टर",
    all: "सभी",
    details: "आवंटित मज़दूर",
    edit: "आवंटन संपादित करें",
  },
  te: {
    title: "పని కేటాయింపు",
    assignDate: "కేటాయింపు తేదీ",
    attended: "హాజరైన కార్మికులు",
    noAttendance: "ఈ తేదీకి హాజరైన కార్మికులు లేరు.",
    addWork: "పని జోడించు",
    activity: "పని కార్యకలాపం",
    block: "బ్లాక్",
    notes: "గమనికలు",
    add: "కేటాయింపు జోడించు",
    pending: "పెండింగ్",
    saved: "సేవ్ అయింది",
    saveAll: "అన్ని కేటాయింపులు సేవ్ చేయండి",
    summary: "పని సారాంశం",
    labourCount: "కార్మికులు",
    filterBlock: "బ్లాక్ ఫిల్టర్",
    filterLabour: "కార్మిక ఫిల్టర్",
    all: "అన్నీ",
    details: "కేటాయించిన కార్మికులు",
    edit: "కేటాయింపు సవరించు",
  },
};
const GROUP_NAMES = {
  kn: {
    estate: "ಎಸ್ಟೇಟ್ ಸಿದ್ಧತೆ",
    plants: "ಸಸ್ಯ ಮತ್ತು ಬೆಳೆ",
    workforce: "ಕಾರ್ಮಿಕರು",
    daily: "ದೈನಂದಿನ ದಾಖಲೆ",
    reports: "ವರದಿಗಳು",
  },
  ta: {
    estate: "எஸ்டேட் அமைப்பு",
    plants: "பயிர்கள்",
    workforce: "பணியாளர்கள்",
    daily: "தினசரி பதிவு",
    reports: "அறிக்கைகள்",
  },
  ml: {
    estate: "എസ്റ്റേറ്റ് സജ്ജീകരണം",
    plants: "ചെടിയും വിളയും",
    workforce: "തൊഴിലാളികൾ",
    daily: "ദൈനംദിന എൻട്രി",
    reports: "റിപ്പോർട്ടുകൾ",
  },
  hi: {
    estate: "एस्टेट सेटअप",
    plants: "पौधे और फसल",
    workforce: "कार्यबल",
    daily: "दैनिक प्रविष्टि",
    reports: "रिपोर्ट",
  },
  te: {
    estate: "ఎస్టేట్ సెటప్",
    plants: "మొక్కలు మరియు పంట",
    workforce: "కార్మికులు",
    daily: "రోజువారీ నమోదు",
    reports: "నివేదికలు",
  },
};
const QUICK_ACTIONS = [
  ["Attendance", "✅", "attendanceQuick"],
  ["Rain", "🌧️", "rainfallQuick"],
  ["Expense", "💵", "expenses"],
  ["Labour", "👷", "labors"],
  ["Plant / Crop", "🌱", "plantInventory"],
  ["Wage Sheet", "🧾", "wageSettlements"],
  ["Harvest", "🌾", "yieldQuick"],
  ["Blocks", "🗺️", "blocks"],
  ["Base Units", "📐", "baseUnits"],
  ["Property", "🏡", "properties"],
  ["Vendor", "🤝", "vendors"],
  ["Work Assignment", "🧑‍🌾", "workAssignments"],
  ["Work Activity", "📝", "workActivities"],
  ["Fertilizer", "🌿", "fertilizers"],
  ["Crop Income", "💰", "cropIncome"],
  ["Assets", "🚜", "assets"],
];
const DEFAULT_FAVORITES = [
  "attendanceQuick",
  "rainfallQuick",
  "expenses",
  "labors",
  "plantInventory",
  "wageSettlements",
  "yieldQuick",
];
const DATE_FIELDS = {
  attendanceQuick: "entry_date",
  rainfallQuick: "recorded_date",
  yieldQuick: "picking_date",
  expenses: "expense_occurence_date",
  fertilizers: "date_of_application",
  workAssignments: "work_date",
  wageSettlements: "running_wage_transaction_date",
  vendorSettlements: "running_wage_transaction_date",
  cropIncome: "received_date",
  plantInventory: "planting_date",
};

const moduleGroups = [
  {
    key: "estate",
    title: "Estate Setup",
    icon: "properties",
    items: ["properties", "blocks", "baseUnits", "assets"],
  },
  {
    key: "plants",
    title: "Crop & Plant",
    icon: "🌱",
    items: [
      "crops",
      "cropTypes",
      "varieties",
      "plantInventory",
      "yieldTypes",
      "yieldRates",
      "cropIncome",
      "fertilizers",
    ],
  },
  {
    key: "workforce",
    title: "Workforce",
    icon: "👥",
    items: [
      "labors",
      "vendors",
      "laborVendors",
      "wages",
      "wageSettlements",
      "vendorSettlements",
    ],
  },
  {
    key: "daily",
    title: "Daily Entry",
    icon: "📝",
    items: [
      "attendanceQuick",
      "rainfallQuick",
      "yieldQuick",
      "expenses",
      "workActivities",
      "workAssignments",
    ],
  },
  {
    key: "reports",
    title: "Reports",
    icon: "📊",
    items: ["reports", "dashboardReport", "notifications", "settings"],
  },
];

const labels = {
  properties: "Estate Properties",
  blocks: "Blocks & Sub-blocks",
  baseUnits: "Measurement Units",
  assets: "Assets / Inventory",
  plants: "Legacy Plant Details",
  crops: "Crop Master",
  cropTypes: "Crop Type Master",
  varieties: "Variety Master",
  plantInventory: "Property Plant Inventory",
  yieldTypes: "Yield Types",
  yieldRates: "Yield Rates / Price",
  cropDetails: "Legacy Crop Details",
  cropIncome: "Income / Revenue",
  fertilizers: "Fertilizer Applications",
  labors: "Labour Management",
  vendors: "Vendor Management",
  laborVendors: "Vendor Labour & Commission",
  wages: "Wage Configuration",
  wageSettlements: "Wage Sheet / Settlement",
  vendorSettlements: "Vendor Settlement",
  attendanceQuick: "Attendance",
  rainfallQuick: "Rain Entry",
  yieldQuick: "Harvest / Yield Entry",
  expenses: "Expense Entry",
  workActivities: "Work Activity Management",
  workAssignments: "Work Assignment",
  reports: "Manual Reports",
  dashboardReport: "Dashboard Reports",
  notifications: "Notifications",
  settings: "Settings",
};

const resourceOf = {
  attendanceQuick: "attendance",
  rainfallQuick: "rainfall",
  yieldQuick: "yield",
};
const requiredFields = {
  attendanceQuick: ["labor_id", "entry_date", "attendance_value"],
  workAssignments: ["work_date", "work_activity_id", "labor_id", "block_id"],
  rainfallQuick: ["block_id", "recorded_date", "rain_value"],
  yieldQuick: ["yieldrate_id", "picking_date", "quantity"],
};

const fieldConfig = {
  properties: [
    ["property_name", "text", "Property Name"],
    ["total_acre", "number", "Total Area / Acres"],
    ["address_1", "text", "Village / Address"],
    ["address_2", "text", "Taluk / District"],
    ["pincode", "text", "Pincode"],
  ],
  blocks: [
    ["block_name", "text", "Block / Sub Block Name"],
    ["block_area", "number", "Area"],
    [
      "property_id",
      "select",
      "Property",
      "properties",
      "property_id",
      "property_name",
    ],
    [
      "parent_block_id",
      "select",
      "Parent Block",
      "blocks",
      "block_id",
      "block_name",
      true,
    ],
  ],
  baseUnits: [["baseunit_name", "text", "Unit Name"]],
  assets: [
    ["asset_name", "text", "Asset Name"],
    ["asset_price", "number", "Price"],
    ["procured_year", "number", "Procured Year"],
    ["isactive", "number", "Active 1/0"],
    [
      "property_id",
      "select",
      "Property",
      "properties",
      "property_id",
      "property_name",
    ],
    ["asset_procured_source", "text", "Source"],
  ],
  plants: [
    ["plant_type", "text", "Plant Name"],
    ["plantdetailscol", "text", "Plant Type / Variety"],
    ["details", "text", "Details (Optional)"],
    ["block_id", "select", "Block", "blocks", "block_id", "block_name", true],
  ],
  crops: [["crop_name", "text", "Crop Name"]],
  cropTypes: [
    ["crop_id", "select", "Crop", "crops", "crop_id", "crop_name"],
    ["type_name", "text", "Crop Type Name"],
    [
      "block_id",
      "select",
      "Block (Optional)",
      "blocks",
      "block_id",
      "block_name",
      true,
    ],
  ],
  varieties: [
    [
      "crop_type_id",
      "select",
      "Crop Type",
      "cropTypes",
      "crop_type_id",
      "type_name",
    ],
    ["variety_name", "text", "Variety Name"],
  ],
  plantInventory: [
    ["crop_id", "select", "Crop", "crops", "crop_id", "crop_name"],
    [
      "crop_type_id",
      "select",
      "Crop Type",
      "cropTypes",
      "crop_type_id",
      "type_name",
    ],
    [
      "variety_master_id",
      "select",
      "Variety",
      "varieties",
      "variety_master_id",
      "variety_name",
    ],
    [
      "block_id",
      "select",
      "Block (Optional)",
      "blocks",
      "block_id",
      "block_name",
      true,
    ],
    ["sub_block_name", "text", "Sub Block / Section"],
    ["plant_count", "number", "Plant Count"],
    ["planting_date", "date", "Planting Date"],
    ["spacing", "text", "Spacing"],
    ["status", "select", "Status", "statusOptions", "id", "name"],
    ["notes", "text", "Notes"],
  ],
  yieldTypes: [
    ["yieldtype_name", "text", "Yield Type"],
    ["plant_id", "select", "Plant", "plants", "plant_id", "plant_type"],
  ],
  yieldRates: [
    ["plant_id", "select", "Plant", "plants", "plant_id", "plant_type"],
    [
      "yieldtype_id",
      "select",
      "Yield Type",
      "yieldTypes",
      "yieldtype_id",
      "yieldtype_name",
    ],
    ["yieldrate_code", "text", "Season / Code"],
    ["yieldrate_running_rate", "number", "Rate"],
    [
      "baseunit_id",
      "select",
      "Unit",
      "baseUnits",
      "baseunit_id",
      "baseunit_name",
    ],
  ],
  cropDetails: [
    ["yield_obtained", "number", "Yield Obtained"],
    ["selling_price", "number", "Selling Price"],
    [
      "property_id",
      "select",
      "Property",
      "properties",
      "property_id",
      "property_name",
    ],
    ["other_detail", "text", "Other Detail"],
  ],
  cropIncome: [
    ["crop_id", "select", "Crop", "cropDetails", "crop_id", "crop_label"],
    ["income_amount", "number", "Income Amount"],
    ["received_date", "date", "Received Date"],
  ],
  fertilizers: [
    ["fertilizer_name", "text", "Fertilizer Name"],
    ["date_of_application", "date", "Date"],
    [
      "property_id",
      "select",
      "Property",
      "properties",
      "property_id",
      "property_name",
    ],
    ["other_details", "text", "Details"],
  ],
  labors: [
    ["name", "text", "Labour Name"],
    ["age", "number", "Age"],
    ["adhar_card", "text", "Govt ID / Aadhaar"],
    ["bank_details", "text", "Bank Details"],
    ["health_history", "text", "Health Notes"],
    ["photo", "text", "Photo URL / Ref"],
    ["address", "text", "Address"],
    ["emergency_details", "text", "Emergency Contact"],
  ],
  vendors: [
    ["vendorname", "text", "Vendor Name"],
    ["description", "text", "Contact / Address / Notes"],
  ],
  laborVendors: [
    ["labor_id", "select", "Labour", "labors", "labor_id", "name"],
    ["vendor_id", "select", "Vendor", "vendors", "vendor_id", "vendorname"],
    ["vendor_labor_percentage", "number", "Commission / Amount"],
    ["laborvendorcode", "text", "Code"],
  ],
  wages: [
    ["labor_id", "select", "Labour", "labors", "labor_id", "name"],
    ["wage_fixed", "number", "Fixed Wage"],
    ["wage_variable", "number", "Variable Wage"],
    ["wage_ot_perhr_price", "number", "Hourly / OT Rate"],
    ["wage_fix_code", "text", "Wage Code"],
  ],
  wageSettlements: [
    ["wage_id", "select", "Wage", "wages", "wage_id", "wage_label"],
    ["settled_amount", "number", "Settled Amount"],
    ["advance_amount", "number", "Advance Amount"],
    ["running_wage_transaction_date", "date", "Date"],
  ],
  vendorSettlements: [
    [
      "laborvendor_id",
      "select",
      "Vendor Labour",
      "laborVendors",
      "laborvendor_id",
      "labor_vendor_label",
    ],
    ["settled_amount", "number", "Settled Amount"],
    ["advance_amount", "number", "Advance Amount"],
    ["running_wage_transaction_date", "date", "Date"],
  ],
  attendanceQuick: [
    ["labor_id", "select", "Labour", "labors", "labor_id", "name"],
    ["entry_date", "date", "Date"],
    [
      "attendance_value",
      "select",
      "Attendance",
      "attendanceOptions",
      "id",
      "name",
    ],
  ],
  rainfallQuick: [
    ["block_id", "select", "Block", "blocks", "block_id", "block_name"],
    ["recorded_date", "date", "Date"],
    ["rain_value", "number", "Rain mm"],
  ],
  yieldQuick: [
    [
      "yieldrate_id",
      "select",
      "Yield Rate / Crop",
      "yieldRates",
      "yieldrate_id",
      "yield_rate_label",
    ],
    ["picking_date", "date", "Picking Date"],
    ["quantity", "number", "Quantity"],
  ],
  expenses: [
    [
      "expensetype_id",
      "select",
      "Expense Type",
      "expenseTypes",
      "expensetype_id",
      "expense_name",
    ],
    [
      "property_id",
      "select",
      "Property",
      "properties",
      "property_id",
      "property_name",
    ],
    ["expense_code", "text", "Code / Notes"],
    ["expense_occurence_date", "date", "Date"],
    ["other_expense", "number", "Amount"],
  ],
  workActivities: [
    ["work_activity_name", "text", "Work Activity Name"],
    ["work_activity_type", "text", "Type"],
    ["notes", "text", "Notes"],
  ],
  workAssignments: [
    ["work_date", "date", "Work Date"],
    [
      "work_activity_id",
      "select",
      "Work Activity",
      "workActivities",
      "work_activity_id",
      "work_activity_name",
    ],
    ["labor_id", "select", "Labour", "labors", "labor_id", "name"],
    ["block_id", "select", "Block", "blocks", "block_id", "block_name"],
    ["notes", "text", "Notes"],
  ],
  reports: [
    ["total_expenditure", "number", "Total Expenditure"],
    ["total_revenue", "number", "Total Revenue"],
    ["profit_loss", "number", "Profit / Loss"],
    [
      "property_id",
      "select",
      "Property",
      "properties",
      "property_id",
      "property_name",
    ],
  ],
  settings: [],
};

const readResources = [
  "properties",
  "blocks",
  "baseUnits",
  "assets",
  "crops",
  "cropTypes",
  "varieties",
  "plantInventory",
  "yieldTypes",
  "yieldRates",
  "cropIncome",
  "fertilizers",
  "fertilizerMasters",
  "fertilizerPurchases",
  "fertilizerApplications",
  "fertilizerAdjustments",
  "fertilizerMovements",
  "fertilizerStock",
  "labors",
  "vendors",
  "laborVendors",
  "wages",
  "wageSettlements",
  "vendorSettlements",
  "expenseTypes",
  "expenses",
  "workActivities",
  "workAssignments",
  "reports",
];
const metaMirror = [
  "properties",
  "blocks",
  "crops",
  "cropTypes",
  "varieties",
  "yieldTypes",
  "yieldRates",
  "wages",
  "laborVendors",
  "cropDetails",
  "workActivities",
  "attendanceLabors",
];
const optionSets = {
  statusOptions: [
    { id: "active", name: "Active" },
    { id: "new", name: "New" },
    { id: "replaced", name: "Replaced" },
    { id: "dead", name: "Dead" },
  ],
  attendanceOptions: [
    { id: "1", name: "Full Day (1)" },
    { id: "0.5", name: "Half Day (0.5)" },
    { id: "0", name: "Absent (0)" },
    { id: "0.25", name: "Hourly / Quarter" },
    { id: "0.75", name: "3/4 Day" },
    { id: "1.5", name: "Full + OT (1.5)" },
  ],
};

function defaultForm(key, propertyId) {
  if (key === "settings") return {};
  const out = { created_by: "Mobile" };
  (fieldConfig[key] || []).forEach((f) => {
    out[f[0]] = f[1] === "date" ? today : f[1] === "number" ? "0" : "";
  });
  if ("property_id" in out && propertyId) out.property_id = String(propertyId);
  return out;
}

function isoDate(value = new Date()) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function yesterdayDate() {
  const value = new Date();
  value.setDate(value.getDate() - 1);
  return isoDate(value);
}

function recordDate(row, moduleKey) {
  const preferred = DATE_FIELDS[moduleKey];
  const key =
    preferred && row[preferred] != null
      ? preferred
      : [
          "entry_date",
          "recorded_date",
          "date_time",
          "picking_date",
          "yield_settlement_date",
          "expense_occurence_date",
          "work_date",
          "date_of_application",
          "running_wage_transaction_date",
          "received_date",
          "planting_date",
          "created_on",
        ].find((item) => row[item] != null);
  return key ? String(row[key]).slice(0, 10) : "";
}

function itemTitle(row) {
  if (!row) return "Record";
  return (
    row.property_name ||
    row.block_name ||
    row.crop_name ||
    row.type_name ||
    row.variety_name ||
    row.name ||
    row.vendorname ||
    row.plant_type ||
    row.work_activity_name ||
    row.expense_name ||
    row.baseunit_name ||
    row.asset_name ||
    row.yieldtype_name ||
    row.fertilizer_name ||
    row.labor_name ||
    row.crop_label ||
    `Record #${row.id || row[Object.keys(row).find((k) => k.endsWith("_id"))] || ""}`
  );
}

function rowId(row) {
  const key = Object.keys(row || {}).find((item) => item.endsWith("_id"));
  return key ? row[key] : null;
}

function optionLabel(option, preferredKey) {
  return (
    option?.[preferredKey] ||
    option?.assignment_label ||
    option?.yield_rate_label ||
    option?.labor_name ||
    option?.name ||
    option?.property_name ||
    option?.block_name ||
    option?.crop_name ||
    option?.type_name ||
    option?.variety_name ||
    option?.plant_type ||
    option?.work_activity_name ||
    option?.vendorname ||
    option?.expense_name ||
    option?.yieldtype_name ||
    option?.baseunit_name ||
    option?.crop_label ||
    ""
  );
}

function normalizedName(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function profitTotal(dashboard) {
  return Number(dashboard?.profit?.total ?? dashboard?.profit ?? 0);
}

function friendlyError(error) {
  const message = error?.message || String(error || "Something went wrong");
  if (/must have attendance/i.test(message))
    return "Attendance is required first. Record this labourer’s attendance for the selected property and work date, then create the work assignment.";
  if (/unique constraint.*work_assignment/i.test(message))
    return "This labourer already has the same work assignment for the selected block and date.";
  if (/foreign key constraint/i.test(message))
    return "One of the selected records is no longer available. Refresh and select it again.";
  return message;
}

export default function App() {
  const defaultApiBase = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_BASE;
  const apiBase = defaultApiBase;
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [meta, setMeta] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [data, setData] = useState({});
  const [screen, setScreen] = useState("home");
  const [activeModule, setActiveModule] = useState("attendanceQuick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITES);
  const [favoriteEditorOpen, setFavoriteEditorOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const navigationHistory = useRef([]);
  const t = uiTranslator(language);

  const property = (meta.properties || []).find(
    (p) => String(p.property_id) === String(propertyId),
  );

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
    "x-property-id": propertyId ? String(propertyId) : "",
  });

  async function request(path, options = {}) {
    const apiPath = path.replace(/^\/api(?=\/|$)/, "");
    const url = `${apiBase.replace(/\/$/, "")}${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) },
    });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok)
      throw new Error(
        body?.error || String(body || text || `HTTP ${res.status}`),
      );
    return body;
  }

  async function safe(task, quiet = false) {
    try {
      setLoading(true);
      setError("");
      return await task();
    } catch (e) {
      const message = friendlyError(e);
      setError(message);
      if (!quiet) Alert.alert("Unable to continue", message);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    await safe(async () => {
      const result = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setUser(result.user);
      setAccessToken(result.token || "");
      setMeta((prev) => ({ ...prev, properties: result.properties || [] }));
      if (result.properties?.[0])
        setPropertyId(String(result.properties[0].property_id));
      navigationHistory.current = [];
      setScreen("home");
    });
  }

  async function loadAll() {
    if (!user) return;
    await safe(async () => {
      const historyFrom = new Date();
      historyFrom.setFullYear(historyFrom.getFullYear() - 1);
      const historyQuery = `?from=${isoDate(historyFrom)}&to=${isoDate()}`;
      const [m, d, attendance, rainfall, yieldRows] = await Promise.all([
        request("/api/meta"),
        request("/api/dashboard"),
        request(`/api/attendance${historyQuery}`),
        request(`/api/rainfall${historyQuery}`),
        request(`/api/yield${historyQuery}`),
      ]);
      const nextMeta = { ...m };
      setMeta(nextMeta);
      setDashboard(d);
      setData((prev) => ({ ...prev, attendance, rainfall, yield: yieldRows }));
      const pairs = await Promise.all(
        readResources.map(async (r) => [
          r,
          await request(`/api/${r}`).catch(() => []),
        ]),
      );
      const next = { attendance, rainfall, yield: yieldRows };
      pairs.forEach(([k, v]) => {
        next[k] = v || [];
      });
      metaMirror.forEach((k) => {
        if (nextMeta[k] && !next[k]) next[k] = nextMeta[k];
      });
      setData(next);
    }, true);
  }

  useEffect(() => {
    if (user && propertyId) loadAll();
  }, [user, propertyId]);
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then((value) => {
        if (value) setFavorites(JSON.parse(value).slice(0, 8));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((value) => {
        if (value && I18N[value]) setLanguage(value);
      })
      .catch(() => {});
  }, []);

  async function updateFavorites(next) {
    const limited = next.slice(0, 8);
    setFavorites(limited);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(limited));
  }

  async function changeLanguage(next) {
    setLanguage(next);
    await AsyncStorage.setItem(LANGUAGE_KEY, next);
  }
  function navigate(next) {
    if (next === screen) return;
    navigationHistory.current.push(screen);
    setScreen(next);
  }
  function goBack() {
    const previous = navigationHistory.current.pop();
    if (previous) setScreen(previous);
    else if (screen !== "home") setScreen("home");
  }

  useEffect(() => {
    if (!user) return undefined;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (screen === "home" && !navigationHistory.current.length)
          return false;
        goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [user, screen]);

  if (!user)
    return (
      <Login
        onLogin={login}
        loading={loading}
        error={error}
        t={t}
        language={language}
        setLanguage={changeLanguage}
      />
    );

  const openModule = (key) => {
    setActiveModule(key);
    navigate(key === "dashboardReport" ? "reports" : "module");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f5eee3"
        translucent={false}
      />
      <Header
        property={property}
        user={user}
        dateLabel={new Intl.DateTimeFormat("en-IN", {
          day: "numeric",
          month: "short",
          weekday: "short",
        }).format(new Date())}
        screen={screen}
        onBack={goBack}
        t={t}
        language={language}
        setLanguage={changeLanguage}
      />
      <PropertyBar
        properties={meta.properties || []}
        propertyId={propertyId}
        setPropertyId={setPropertyId}
        t={t}
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAll} />
        }
        contentContainerStyle={styles.body}
      >
        {!!error && <Text style={styles.error}>{error}</Text>}
        {screen === "home" && (
          <Home
            dashboard={dashboard}
            data={data}
            openModule={openModule}
            favorites={favorites}
            editFavorites={() => setFavoriteEditorOpen(true)}
            property={property}
            t={t}
            language={language}
          />
        )}
        {screen === "add" && (
          <QuickAdd openModule={openModule} t={t} language={language} />
        )}
        {screen === "modules" && (
          <Modules openModule={openModule} t={t} language={language} />
        )}
        {screen === "reports" && (
          <Reports
            dashboard={dashboard}
            data={data}
            openModule={openModule}
            t={t}
          />
        )}
        {screen === "more" && (
          <More
            user={user}
            onLogout={async () => {
              try {
                await request("/api/auth/logout", { method: "POST" });
              } catch {}
              setAccessToken("");
              setUser(null);
            }}
            openModule={openModule}
            t={t}
          />
        )}
        {screen === "module" && (
          <ModuleScreen
            moduleKey={activeModule}
            user={user}
            propertyId={propertyId}
            data={data}
            setData={setData}
            meta={meta}
            request={request}
            reload={loadAll}
            language={language}
            t={t}
          />
        )}
      </ScrollView>
      <FavoriteEditor
        visible={favoriteEditorOpen}
        favorites={favorites}
        setFavorites={updateFavorites}
        close={() => setFavoriteEditorOpen(false)}
      />
      <BottomNav screen={screen} setScreen={navigate} t={t} />
    </SafeAreaView>
  );
}

function Login({ onLogin, loading, error, t, language, setLanguage }) {
  const [username, setUsername] = useState("estateuser1");
  const [password, setPassword] = useState("owner123");
  const [remember, setRemember] = useState(true);
  useEffect(() => {
    SecureStore.getItemAsync(LOGIN_MEMORY_KEY)
      .then((saved) => {
        if (!saved) return;
        const credentials = JSON.parse(saved);
        setUsername(credentials.username || "estateuser1");
        setPassword(credentials.password || "owner123");
        setRemember(true);
      })
      .catch(() => {});
  }, []);
  async function submit() {
    try {
      if (remember) {
        await SecureStore.setItemAsync(
          LOGIN_MEMORY_KEY,
          JSON.stringify({ username, password }),
        );
      } else {
        await SecureStore.deleteItemAsync(LOGIN_MEMORY_KEY);
      }
    } catch {}
    onLogin(username.trim(), password);
  }
  return (
    <SafeAreaView style={styles.loginPage}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f3efe4"
        translucent={false}
      />
      <KeyboardAvoidingView
        style={styles.loginKeyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.loginScroll}
        >
          <Image
            source={require("./logo.png")}
            style={styles.logoImage}
            accessibilityLabel="JavaTerrain coffee bean logo"
          />
          <Text style={styles.loginTitle}>JavaTerrain</Text>
          <Text style={styles.loginSub}>{t("tagline")}</Text>
          <LanguagePicker
            language={language}
            setLanguage={setLanguage}
            t={t}
            compact
            login
          />
          <View style={styles.loginCard}>
            <FieldText
              label={t("username")}
              value={username}
              onChangeText={setUsername}
              returnKeyType="next"
            />
            <FieldText
              label={t("password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember((current) => !current)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: remember }}
            >
              <View style={[styles.quickCheck, remember && styles.quickCheckActive]}>
                <Text style={styles.quickCheckText}>{remember ? "✓" : ""}</Text>
              </View>
              <Text style={styles.rememberText}>Remember password securely</Text>
            </TouchableOpacity>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity
              disabled={loading}
              style={styles.primary}
              onPress={submit}
            >
              <Text style={styles.primaryText}>
                {loading ? t("connecting") : t("login")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({
  property,
  user,
  dateLabel,
  screen,
  onBack,
  t,
  language,
  setLanguage,
}) {
  return (
    <View style={styles.header}>
      {screen !== "home" && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityLabel={t("back")}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
      )}
      <View style={styles.headerCopy}>
        <Text style={styles.smallCaps}>{t("today")}</Text>
      </View>
      <View style={styles.headerMeta}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text numberOfLines={1} style={styles.location}>
          📍 {property?.property_name || t("selectProperty")}
        </Text>
        <LanguagePicker
          language={language}
          setLanguage={setLanguage}
          t={t}
          compact
        />
      </View>
    </View>
  );
}
function monthStartDate(value = new Date()) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}
function monthEndDate(value = new Date()) {
  const date = new Date(value);
  return isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function LanguagePicker({ language, setLanguage, t, compact, login }) {
  const [open, setOpen] = useState(false);
  const selected =
    LANGUAGES.find(([code]) => code === language)?.[1] || "English";
  return (
    <>
      <TouchableOpacity
        style={
          compact
            ? [styles.languageCompact, login && styles.loginLanguage]
            : styles.secondary
        }
        onPress={() => setOpen(true)}
      >
        <Text style={styles.languageText}>🌐 {selected}</Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {t("language")}: {selected}
            </Text>
            {LANGUAGES.map(([code, name]) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.option,
                  code === language && styles.languageActive,
                ]}
                onPress={() => {
                  setLanguage(code);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>
                  {code === language ? "✓ " : ""}
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.secondaryText}>{t("back")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function PropertyBar({ properties, propertyId, setPropertyId, t }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = properties.find(
    (p) => String(p.property_id) === String(propertyId),
  );
  const filtered = properties.filter((p) =>
    `${p.property_name} ${p.address_1 || ""} ${p.property_id}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <View style={styles.propertySelectorWrap}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t("selectProperty")}
        style={styles.propertySelector}
        onPress={() => setOpen(true)}
      >
        <View style={styles.propertyBadge}>
          <Text style={styles.propertyBadgeText}>J</Text>
        </View>
        <View style={styles.propertySelectedCopy}>
          <Text style={styles.propertyEyebrow}>{t("currentProperty")}</Text>
          <Text numberOfLines={1} style={styles.propertySelectedName}>
            {selected?.property_name || t("selectProperty")}
          </Text>
          {!!selected?.address_1 && (
            <Text numberOfLines={1} style={styles.propertySelectedAddress}>
              {selected.address_1}
            </Text>
          )}
        </View>
        <View style={styles.propertyChange}>
          <Text style={styles.propertyChangeText}>{t("select")}</Text>
          <Text style={styles.propertyChevron}>⌄</Text>
        </View>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBack}>
          <View style={styles.propertyModal}>
            <View style={styles.propertyModalHead}>
              <View>
                <Text style={styles.modalTitle}>{t("selectProperty")}</Text>
                <Text style={styles.propertyCount}>
                  {properties.length} {t("propertiesAvailable")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder={t("searchProperty")}
              placeholderTextColor="#8a796b"
              style={styles.propertySearch}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.propertyList}
            >
              {filtered.map((p) => {
                const active = String(p.property_id) === String(propertyId);
                return (
                  <TouchableOpacity
                    key={p.property_id}
                    style={[
                      styles.propertyOption,
                      active && styles.propertyOptionActive,
                    ]}
                    onPress={() => {
                      setPropertyId(String(p.property_id));
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <View
                      style={[
                        styles.propertyOptionMark,
                        active && styles.propertyOptionMarkActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.propertyOptionMarkText,
                          active && styles.propertyOptionMarkTextActive,
                        ]}
                      >
                        {active
                          ? "✓"
                          : String(p.property_name || "E")
                              .charAt(0)
                              .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.propertyOptionName}>
                        {p.property_name}
                      </Text>
                      <Text numberOfLines={1} style={styles.propertyOptionMeta}>
                        {p.address_1 || "Estate property"} • ID {p.property_id}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {!filtered.length && (
                <Text style={styles.propertyEmpty}>
                  No matching properties found.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function weatherTheme(weather) {
  const code = weather?.current?.condition?.code || 1000;
  const text = (weather?.current?.condition?.text || "").toLowerCase();
  if (text.includes("thunder"))
    return {
      kind: "storm",
      icon: "⛈️",
      colors: ["#152b46", "#244c68"],
      accent: "#d9d36f",
    };
  if (
    text.includes("rain") ||
    text.includes("drizzle") ||
    [
      1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246,
    ].includes(code)
  )
    return {
      kind: "rain",
      icon: "🌧️",
      colors: ["#245468", "#39798a"],
      accent: "#bdeaff",
    };
  if (
    text.includes("cloud") ||
    text.includes("overcast") ||
    [1003, 1006, 1009].includes(code)
  )
    return {
      kind: "cloud",
      icon: "☁️",
      colors: ["#607683", "#8799a1"],
      accent: "#eef4f5",
    };
  if ((weather?.current?.temp_c || 0) >= 32)
    return {
      kind: "hot",
      icon: "☀️",
      colors: ["#c75d19", "#e99a26"],
      accent: "#fff2a8",
    };
  if ((weather?.current?.temp_c || 30) <= 16)
    return {
      kind: "cold",
      icon: "❄️",
      colors: ["#3e7194", "#6ba7c2"],
      accent: "#e8fbff",
    };
  return {
    kind: "sunny",
    icon: "☀️",
    colors: ["#8a5527", "#c18446"],
    accent: "#fff0a6",
  };
}

function WeatherHero({ property, t }) {
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [gpsState, setGpsState] = useState("checking");
  const [coordinates, setCoordinates] = useState(null);
  const motion = useRef(new Animated.Value(0)).current;
  const theme = weatherTheme(weather);

  async function requestLocation() {
    try {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled && Platform.OS === "android") {
        try {
          await Location.enableNetworkProviderAsync();
        } catch {}
        enabled = await Location.hasServicesEnabledAsync();
      }
      if (!enabled) {
        setGpsState("off");
        return null;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setGpsState("denied");
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoordinates(value);
      setGpsState("ready");
      return value;
    } catch {
      setGpsState("off");
      return null;
    }
  }

  async function loadWeather() {
    try {
      setWeatherError("");
      if (!WEATHER_API_KEY)
        throw new Error("Weather service is not configured");
      const propertyQuery =
        String(property?.pincode || "").trim() ||
        [property?.address_1, property?.address_2].filter(Boolean).join(", ");
      const gps = coordinates;
      const query =
        propertyQuery ||
        (gps ? `${gps.latitude},${gps.longitude}` : "bengaluru");
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?q=${encodeURIComponent(query)}&key=${WEATHER_API_KEY}`,
      );
      const body = await response.json();
      if (!response.ok || body.error)
        throw new Error(body.error?.message || "Weather unavailable");
      setWeather(body);
    } catch (error) {
      setWeatherError(error.message || "Weather unavailable");
    }
  }

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    loadWeather();
    const timer = setInterval(loadWeather, 10 * 60 * 1000);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      clearInterval(timer);
      animation.stop();
    };
  }, [
    property?.property_id,
    property?.pincode,
    property?.address_1,
    property?.address_2,
    coordinates?.latitude,
    coordinates?.longitude,
  ]);

  const drift = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 7],
  });
  const pulse = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  const current = weather?.current;
  return (
    <>
      {gpsState !== "ready" && (
        <View style={styles.gpsBanner}>
          <Text style={styles.gpsText}>
            {gpsState === "checking"
              ? t("allowLocation")
              : gpsState === "denied"
                ? t("permissionDenied")
                : t("gpsRequired")}
          </Text>
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={
              gpsState === "denied" ? Linking.openSettings : requestLocation
            }
          >
            <Text style={styles.gpsButtonText}>
              {gpsState === "denied"
                ? t("settings")
                : gpsState === "checking"
                  ? t("allowLocation")
                  : t("enableGps")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={[styles.weatherHero, { backgroundColor: theme.colors[0] }]}>
        <View
          style={[styles.weatherGlow, { backgroundColor: theme.colors[1] }]}
        />
        <View style={styles.weatherCopy}>
          <Text style={styles.weatherPlace}>
            {weather?.location?.name || "Bengaluru"} • LIVE
          </Text>
          <Text style={styles.weatherCondition}>
            {current?.condition?.text ||
              (weatherError ? t("weatherUnavailable") : t("updatingWeather"))}
          </Text>
          <Text style={styles.weatherTemperature}>
            {current ? `${Math.round(current.temp_c)}°C` : "--°"}
          </Text>
          <Text style={styles.weatherFeels}>
            {t("feelsLike")}{" "}
            {current ? `${Math.round(current.feelslike_c)}°C` : "--"} •{" "}
            {t("wind")} {current?.wind_kph ?? "--"} km/h
          </Text>
        </View>
        <Animated.View
          style={[
            styles.weatherArt,
            { transform: [{ translateX: drift }, { scale: pulse }] },
          ]}
        >
          {current?.condition?.icon ? (
            <Image
              source={{ uri: `https:${current.condition.icon}` }}
              style={styles.weatherIconImage}
            />
          ) : (
            <Text style={styles.weatherEmoji}>{theme.icon}</Text>
          )}
        </Animated.View>
        {(theme.kind === "rain" || theme.kind === "storm") && (
          <View style={styles.rainLayer}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.rainDrop,
                  {
                    left: 10 + i * 18,
                    transform: [
                      {
                        translateY: motion.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-8, 55],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>
        )}
        <View style={styles.weatherMetrics}>
          <View>
            <Text style={styles.metricLabel}>{t("humidity")}</Text>
            <Text style={styles.metricValue}>{current?.humidity ?? "--"}%</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>{t("rain")}</Text>
            <Text style={styles.metricValue}>
              {current?.precip_mm ?? "--"} mm
            </Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>UV</Text>
            <Text style={styles.metricValue}>{current?.uv ?? "--"}</Text>
          </View>
          <TouchableOpacity onPress={loadWeather}>
            <Text style={[styles.weatherRefresh, { color: theme.accent }]}>
              {t("refresh")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function Home({
  dashboard,
  data,
  openModule,
  favorites,
  editFavorites,
  property,
  t,
  language,
}) {
  const m = dashboard?.management || {};
  const summary = [
    ["Today’s Work", m.todayWork || 0, "workAssignments"],
    ["Active Labour", m.activeLabour || 0, "labors"],
    [
      "Monthly Expense",
      `₹${Number(m.monthlyExpense || 0).toLocaleString("en-IN")}`,
      "expenses",
    ],
    ["Low Stock", m.lowStock || 0, "warning"],
  ];
  const overview = [
    ["Active Blocks", m.activeBlocks || 0],
    ["Block Area", `${Number(m.blockArea || 0).toFixed(1)} ac`],
    ["Main Crops", (m.mainCrops || []).join(", ") || "—"],
    ["Rain This Month", `${Number(m.rainMonth || 0).toFixed(1)} mm`],
  ];
  return (
    <View>
      <View style={styles.managementGreeting}>
        <Text style={styles.managementHello}>
          Good{" "}
          {new Date().getHours() < 12
            ? "Morning"
            : new Date().getHours() < 17
              ? "Afternoon"
              : "Evening"}
        </Text>
        <Text style={styles.managementEstate}>
          {property?.property_name || "Estate overview"}
        </Text>
      </View>
      <WeatherHero property={property} t={t} />
      <Text style={styles.managementSection}>Today at a glance</Text>
      <View style={styles.managementGrid}>
        {summary.map((x) => (
          <TouchableOpacity
            key={x[0]}
            style={styles.managementKpi}
            onPress={() => x[2] !== "warning" && openModule(x[2])}
          >
            <AppIcon
              name={x[2]}
              size={18}
              color={
                x[2] === "warning" && Number(x[1])
                  ? themeColors.warning
                  : themeColors.secondary
              }
            />
            <Text style={styles.managementValue}>{x[1]}</Text>
            <Text style={styles.managementLabel}>{x[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.managementSection}>Quick actions</Text>
      <View style={styles.managementActions}>
        {[
          ["workAssignments", "Assign Work"],
          ["attendanceQuick", "Attendance"],
          ["expenses", "Add Expense"],
          ["fertilizers", "Apply Fertilizer"],
        ].map((x) => (
          <TouchableOpacity
            key={x[0]}
            style={styles.managementAction}
            onPress={() => openModule(x[0])}
          >
            <AppIcon name={x[0]} color={themeColors.secondary} />
            <Text style={styles.managementActionText}>{x[1]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.managementSection}>Estate overview</Text>
      <View style={styles.managementOverview}>
        {overview.map((x) => (
          <View key={x[0]} style={styles.managementOverviewItem}>
            <Text style={styles.managementOverviewLabel}>{x[0]}</Text>
            <Text numberOfLines={2} style={styles.managementOverviewValue}>
              {x[1]}
            </Text>
          </View>
        ))}
      </View>
      {(Number(m.lowStock) > 0 || (m.upcomingWork || []).length > 0) && (
        <Section title="Attention" right="View all">
          {Number(m.lowStock) > 0 && (
            <Suggestion
              warning
              text={`${m.lowStock} fertilizer item(s) at or below minimum stock.`}
            />
          )}{" "}
          {(m.upcomingWork || []).slice(0, 2).map((x) => (
            <Suggestion
              key={x.work_assignment_id}
              text={`${x.work_activity_name} · ${String(x.work_date).slice(0, 10)}`}
            />
          ))}
        </Section>
      )}
    </View>
  );
}

function FavoriteEditor({ visible, favorites, setFavorites, close }) {
  const toggle = (key) => {
    if (favorites.includes(key))
      return setFavorites(favorites.filter((item) => item !== key));
    if (favorites.length >= 8)
      return Alert.alert(
        "Shortcut limit",
        "You can select up to 8 favorite modules. Remove one before adding another.",
      );
    setFavorites([...favorites, key]);
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.modalBack}>
        <View style={styles.favoriteModal}>
          <View style={styles.favoriteHead}>
            <View>
              <Text style={styles.modalTitle}>Favorite shortcuts</Text>
              <Text style={styles.favoriteHint}>
                Choose up to 8 • saved on this device
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.favoriteList}>
            {QUICK_ACTIONS.map(([title, icon, key]) => {
              const active = favorites.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.favoriteRow,
                    active && styles.favoriteRowActive,
                  ]}
                  onPress={() => toggle(key)}
                >
                  <Text style={styles.favoriteIcon}>{icon}</Text>
                  <Text style={styles.favoriteName}>{title}</Text>
                  <View
                    style={[
                      styles.favoriteCheck,
                      active && styles.favoriteCheckActive,
                    ]}
                  >
                    <Text style={styles.favoriteCheckText}>
                      {active ? "✓" : "+"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.primary} onPress={close}>
            <Text style={styles.primaryText}>Done ({favorites.length}/8)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function QuickAdd({ openModule, t, language }) {
  return (
    <View>
      <Text style={styles.screenTitle}>{t("quickAdd")}</Text>
      <IconGrid
        items={QUICK_ACTIONS.map(([title, icon, key]) => [
          moduleName(language, key),
          icon,
          key,
        ])}
        openModule={openModule}
      />
    </View>
  );
}

function Modules({ openModule, t, language }) {
  return (
    <View>
      <Text style={styles.screenTitle}>{t("modules")}</Text>
      {moduleGroups.map((g) => (
        <View key={g.key} style={styles.card}>
          <Text style={styles.sectionTitle}>
            {g.icon} {GROUP_NAMES[language]?.[g.key] || g.title}
          </Text>
          {g.items.map((i) => (
            <TouchableOpacity
              key={i}
              style={styles.moduleRow}
              onPress={() => openModule(i)}
            >
              <Text style={styles.moduleName}>{moduleName(language, i)}</Text>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

function exportableRows(rows = []) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .filter(([, value]) => value == null || ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => [key, value == null ? "" : value]),
    ),
  );
}
function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
async function exportGrid(title, rows, format) {
  const clean = exportableRows(rows);
  if (!clean.length) return Alert.alert("Nothing to export", `No ${title.toLowerCase()} records are loaded.`);
  try {
    if (format === "pdf") {
      const columns = Object.keys(clean[0]);
      const html = `<html><head><style>body{font-family:Arial;padding:20px;color:#3f2616}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:9px}th,td{border:1px solid #d9c4aa;padding:5px;text-align:left}th{background:#ead9c4}</style></head><body><h1>${htmlEscape(title)}</h1><table><thead><tr>${columns.map((key) => `<th>${htmlEscape(key.replaceAll("_", " "))}</th>`).join("")}</tr></thead><tbody>${clean.map((row) => `<tr>${columns.map((key) => `<td>${htmlEscape(row[key])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
      const result = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: `Export ${title}` });
      return;
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(clean), "Report");
    const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
    const uri = `${FileSystem.cacheDirectory}${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await Sharing.shareAsync(uri, { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", dialogTitle: `Export ${title}` });
  } catch (error) {
    Alert.alert("Export failed", friendlyError(error));
  }
}
function ExportButtons({ title, rows, columns }) {
  const outputRows = columns
    ? rows.map((row) =>
        Object.fromEntries(
          columns.map(([label, accessor]) => [
            label,
            typeof accessor === "function" ? accessor(row) : row[accessor],
          ]),
        ),
      )
    : rows;
  return (
    <View style={styles.exportButtons}>
      <TouchableOpacity style={styles.exportButton} onPress={() => exportGrid(title, outputRows, "pdf")}>
        <AppIcon name="document" size={16} color={themeColors.secondary} />
        <Text style={styles.exportButtonText}>PDF</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.exportButton} onPress={() => exportGrid(title, outputRows, "xlsx")}>
        <AppIcon name="sheet" size={16} color={themeColors.secondary} />
        <Text style={styles.exportButtonText}>XLSX</Text>
      </TouchableOpacity>
    </View>
  );
}

function Reports({ dashboard, data, openModule, t = translator("en") }) {
  const reportCards = [
    [
      "Rainfall Report",
      `${dashboard?.rainfall?.total || 0} mm`,
      "🌧️",
      "rainfallQuick",
    ],
    ["Expense Report", `₹${dashboard?.expenses?.total || 0}`, "💵", "expenses"],
    [
      "Labour Report",
      `${dashboard?.attendance?.labor_days || 0} days`,
      "👥",
      "attendanceQuick",
    ],
    [
      "Plant Report",
      `${dashboard?.plantInventoryTotal?.total_plants || 0}`,
      "🌱",
      "plantInventory",
    ],
    [
      "Work Report",
      `${dashboard?.workAssignmentTotal?.entries || 0}`,
      "🧑‍🌾",
      "workAssignments",
    ],
    [
      "Profit Report",
      `₹${profitTotal(dashboard).toLocaleString("en-IN")}`,
      "📊",
      "reports",
    ],
  ];
  const downloadable = [
    ["Attendance", "attendanceQuick", data.attendance || [], "attendanceQuick"],
    ["Work Allocation", "workAssignments", data.workAssignments || [], "workAssignments"],
    ["Plant Allocation", "plantInventory", data.plantInventory || [], "plantInventory"],
    ["Fertilizer Purchases", "fertilizers", data.fertilizerPurchases || [], "fertilizers"],
    ["Fertilizer Applications", "fertilizers", data.fertilizerApplications || [], "fertilizers"],
    ["Expenses", "expenses", data.expenses || [], "expenses"],
  ];
  return (
    <View>
      <Text style={styles.screenTitle}>{t("reports")}</Text>
      <View style={styles.grid}>
        {reportCards.map((r) => (
          <TouchableOpacity
            key={r[0]}
            style={styles.reportCard}
            onPress={() => openModule(r[3])}
          >
            <AppIcon name={r[3]} size={23} color={themeColors.secondary} />
            <Text style={styles.reportValue}>{r[1]}</Text>
            <Text style={styles.statLabel}>{r[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Section title="Download reports" right={`${downloadable.length} reports`}>
        {downloadable.map(([title, icon, rows, module]) => (
          <View key={title} style={styles.downloadRow}>
            <TouchableOpacity style={styles.downloadTitle} onPress={() => openModule(module)}>
              <AppIcon name={icon} color={themeColors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.peopleListName}>{title}</Text>
                <Text style={styles.peopleListMeta}>{rows.length} loaded records</Text>
              </View>
            </TouchableOpacity>
            <ExportButtons title={title} rows={rows} />
          </View>
        ))}
      </Section>
    </View>
  );
}

function More({ user, onLogout, openModule, t = translator("en") }) {
  return (
    <View>
      <Text style={styles.screenTitle}>More</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.note}>Logged in as {user?.username}</Text>
        <TouchableOpacity style={styles.secondary} onPress={onLogout}>
          <Text style={styles.secondaryText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Section title="Secure & Reliable">
        <IconGrid
          items={[
            ["Offline First Ready", "📴", "settings"],
            ["Multi Language Ready", "🌐", "settings"],
            ["Backup / Restore", "💾", "settings"],
            ["Notifications", "🔔", "notifications"],
          ]}
          openModule={openModule}
        />
      </Section>
    </View>
  );
}

function ModuleScreen({
  moduleKey,
  user,
  propertyId,
  data,
  setData,
  meta,
  request,
  reload,
  language,
  t,
}) {
  const endpoint = resourceOf[moduleKey] || moduleKey;
  const [form, setForm] = useState(defaultForm(moduleKey, propertyId));
  const [editingId, setEditingId] = useState(null);
  const rows = data[endpoint] || data[moduleKey] || [];
  const [fromDate, setFromDate] = useState(yesterdayDate());
  const [toDate, setToDate] = useState(isoDate());
  const [page, setPage] = useState(1);
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  const pageSize = 10;
  const parentBlocks =
    moduleKey === "plantInventory"
      ? (data.blocks || []).filter((block) => !block.parent_block_id)
      : [];
  const subBlocks =
    moduleKey === "plantInventory" && form.block_id
      ? (data.blocks || []).filter(
          (block) => String(block.parent_block_id) === String(form.block_id),
        )
      : [];
  const laborOptions = data.labors?.length ? data.labors : meta.labors || [];
  const laborIdForAttendance = (item) => {
    if (item?.labor_id != null) return String(item.labor_id);
    const attendanceName = normalizedName(item?.labor_name || item?.name);
    const labor = laborOptions.find(
      (candidate) =>
        normalizedName(candidate.name || candidate.labor_name) ===
        attendanceName,
    );
    return labor?.labor_id != null ? String(labor.labor_id) : "";
  };
  const attendedLaborIds =
    moduleKey === "workAssignments"
      ? new Set(
          (data.attendance || [])
            .filter(
              (item) =>
                String(item.entry_date || "").slice(0, 10) ===
                String(form.work_date || "").slice(0, 10),
            )
            .map(laborIdForAttendance)
            .filter(Boolean),
        )
      : new Set();
  const availableAssignmentLabors =
    moduleKey === "workAssignments"
      ? laborOptions.map((item) => ({
          ...item,
          assignment_label: `${item.name || item.labor_name || `Labour #${item.labor_id}`} — ${attendedLaborIds.has(String(item.labor_id)) ? "attendance recorded" : "attendance missing"}`,
        }))
      : [];
  const fields = (fieldConfig[moduleKey] || [])
    .map((field) => {
      if (field[0] === "block_id" && parentBlocks.length)
        return [
          "block_id",
          "select",
          "Block",
          "availableParentBlocks",
          "block_id",
          "block_name",
        ];
      if (field[0] === "sub_block_name" && subBlocks.length)
        return [
          "sub_block_name",
          "select",
          "Sub-block / Section",
          "availableSubBlocks",
          "block_name",
          "block_name",
          true,
        ];
      if (field[0] === "labor_id" && moduleKey === "workAssignments")
        return [
          "labor_id",
          "select",
          "Labour",
          "availableAssignmentLabors",
          "labor_id",
          "assignment_label",
        ];
      return field;
    })
    .map((field) => [
      field[0],
      field[1],
      fieldName(language, field[0], field[2]),
      ...field.slice(3),
    ]);
  const fieldData = {
    ...data,
    availableParentBlocks: parentBlocks,
    availableSubBlocks: subBlocks,
    availableAssignmentLabors,
  };
  const hasDateFilter = Boolean(DATE_FIELDS[moduleKey]);
  const filteredRows = hasDateFilter
    ? rows.filter((row) => {
        const date = recordDate(row, moduleKey);
        return date && date >= fromDate && date <= toDate;
      })
    : rows;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setForm(defaultForm(moduleKey, propertyId));
    setEditingId(null);
    setFromDate(yesterdayDate());
    setToDate(isoDate());
    setPage(1);
  }, [moduleKey, propertyId]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [pageCount]);

  async function save() {
    if (moduleKey === "settings")
      return Alert.alert("Saved", "API settings updated.");
    const payload = {
      ...form,
      property_id: form.property_id || propertyId,
      user_id: user.user_id,
      created_by: user.username,
    };
    fields.forEach(([key, type, , , , , optional]) => {
      if (type === "select" && optional && payload[key] === "")
        payload[key] = null;
    });
    const missingField = fields.find(
      ([key]) =>
        (requiredFields[moduleKey] || []).includes(key) &&
        (form[key] == null || String(form[key]).trim() === ""),
    );
    if (missingField)
      return Alert.alert(
        "Required field",
        `Select or enter ${missingField[2]} before saving.`,
      );
    if (
      moduleKey === "attendanceQuick" &&
      !optionSets.attendanceOptions.some(
        (item) => String(item.id) === String(form.attendance_value),
      )
    )
      return Alert.alert(
        "Attendance required",
        "Select Full Day, Half Day, Absent, Hourly, or another attendance value before saving.",
      );
    if (
      moduleKey === "workAssignments" &&
      !attendedLaborIds.has(String(form.labor_id))
    )
      return Alert.alert(
        "Attendance required",
        "The selected labourer does not have attendance for this property and work date. Save attendance first, then return to Work Assignment.",
      );
    try {
      await request(`/api/${endpoint}${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setForm(defaultForm(moduleKey, propertyId));
      const wasEditing = Boolean(editingId);
      setEditingId(null);
      await reload();
      setRecordsExpanded(true);
      Alert.alert(
        wasEditing ? "Updated" : "Saved",
        `${labels[moduleKey]} ${wasEditing ? "updated" : "saved"}.`,
      );
    } catch (error) {
      Alert.alert("Could not save", friendlyError(error));
    }
  }
  async function remove(row) {
    const id = rowId(row);
    if (!id)
      return Alert.alert(
        "Info",
        "This record cannot be deleted because its identifier is missing.",
      );
    Alert.alert("Delete?", itemTitle(row), [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await request(`/api/${endpoint}/${id}`, { method: "DELETE" });
            await reload();
          } catch (error) {
            Alert.alert("Could not delete", friendlyError(error));
          }
        },
      },
    ]);
  }

  function edit(row) {
    const id = rowId(row);
    if (!id)
      return Alert.alert(
        "Info",
        "This record cannot be edited because its identifier is missing.",
      );
    const next = defaultForm(moduleKey, propertyId);
    fields.forEach(([key]) => {
      let value = row[key];
      if (value == null && key === "recorded_date") value = row.date_time;
      if (value == null && key === "picking_date")
        value = row.yield_settlement_date;
      if (value != null)
        next[key] = key.includes("date")
          ? String(value).slice(0, 10)
          : String(value);
    });
    setForm(next);
    setEditingId(id);
  }

  if (moduleKey === "notifications")
    return (
      <View>
        <Text style={styles.screenTitle}>Notifications</Text>
        <Section title="Today">
          <Suggestion danger text="Heavy rain expected tomorrow." />
          <Suggestion warning text="Wage sheet generated for today." />
          <Suggestion warning text="Expense limit crossed this month." />
          <Suggestion text="New labour added: Ramesh." />
        </Section>
      </View>
    );
  if (moduleKey === "dashboardReport")
    return (
      <Reports dashboard={data.dashboard} data={data} openModule={() => {}} />
    );
  if (moduleKey === "attendanceQuick")
    return (
      <AttendanceGrid
        user={user}
        propertyId={propertyId}
        data={data}
        request={request}
        reload={reload}
        language={language}
        t={t}
      />
    );
  if (moduleKey === "rainfallQuick")
    return (
      <RainfallScreen
        user={user}
        propertyId={propertyId}
        data={data}
        request={request}
        reload={reload}
        language={language}
        t={t}
      />
    );
  if (moduleKey === "workAssignments")
    return (
      <WorkAssignmentScreen
        user={user}
        propertyId={propertyId}
        data={data}
        request={request}
        reload={reload}
        language={language}
        t={t}
      />
    );
  if (moduleKey === "labors")
    return (
      <PeopleDirectoryScreen
        kind={moduleKey}
        user={user}
        data={data}
        request={request}
        reload={reload}
        t={t}
      />
    );
  if (moduleKey === "vendors")
    return (
      <VendorDirectoryScreen
        user={user}
        data={data}
        request={request}
        reload={reload}
        t={t}
      />
    );
  if (moduleKey === "plantInventory")
    return (
      <PlantInventoryHierarchyScreen
        user={user}
        propertyId={propertyId}
        data={data}
        request={request}
        reload={reload}
        t={t}
      />
    );
  if (moduleKey === "fertilizers")
    return (
      <FertilizerManagement
        user={user}
        propertyId={propertyId}
        data={data}
        request={request}
        reload={reload}
      />
    );
  if (
    [
      "properties",
      "blocks",
      "plants",
      "crops",
      "cropTypes",
      "varieties",
      "baseUnits",
      "workActivities",
    ].includes(moduleKey)
  )
    return (
      <CatalogDirectoryScreen
        kind={moduleKey}
        user={user}
        propertyId={propertyId}
        data={data}
        meta={meta}
        request={request}
        reload={reload}
        language={language}
        t={t}
      />
    );

  return (
    <View>
      <Text style={styles.screenTitle}>{moduleName(language, moduleKey)}</Text>
      <View style={styles.card}>
        {editingId && (
          <Text style={styles.editingBanner}>
            {t("edit")} #{editingId}
          </Text>
        )}
        {fields.map((f) => (
          <SmartField
            key={f[0]}
            field={f}
            value={form[f[0]]}
            setValue={(v) =>
              setForm(
                f[0] === "block_id" && moduleKey === "plantInventory"
                  ? { ...form, block_id: v, sub_block_name: "" }
                  : { ...form, [f[0]]: v },
              )
            }
            meta={meta}
            data={fieldData}
            t={t}
          />
        ))}
        {moduleKey === "workAssignments" &&
          form.work_date &&
          !attendedLaborIds.size && (
            <Text style={styles.inlineWarning}>
              No matching attendance is loaded for {form.work_date}. Labourers
              remain visible below; records without attendance cannot be
              assigned.
            </Text>
          )}
        <TouchableOpacity style={styles.primary} onPress={save}>
          <Text style={styles.primaryText}>
            {editingId ? t("update") : t("save")}
          </Text>
        </TouchableOpacity>
        {editingId && (
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => {
              setForm(defaultForm(moduleKey, propertyId));
              setEditingId(null);
            }}
          >
            <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={styles.recordsToggle}
        onPress={() => setRecordsExpanded((current) => !current)}
      >
        <Text style={styles.recordsToggleText}>
          {recordsExpanded ? "Hide" : "View"} {t("records")} ({filteredRows.length})
        </Text>
        <Text style={styles.recordsToggleText}>{recordsExpanded ? "⌃" : "⌄"}</Text>
      </TouchableOpacity>
      {recordsExpanded && <Section
        title={t("records")}
        right={`${filteredRows.length} ${t("entries")}`}
      >
        {hasDateFilter && (
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={(value) => {
              setFromDate(value);
              setPage(1);
            }}
            setToDate={(value) => {
              setToDate(value);
              setPage(1);
            }}
            t={t}
            language={language}
          />
        )}
        <ExportButtons title={labels[moduleKey] || moduleKey} rows={filteredRows} />
        <RecordList
          rows={visibleRows}
          moduleKey={moduleKey}
          data={data}
          meta={meta}
          onEdit={edit}
          onDelete={remove}
          empty={t("noRecords")}
          language={language}
        />
        <Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} />
      </Section>}
    </View>
  );
}

const CATALOG_UI = {
  properties: {
    singular: "Property",
    plural: "Estate Properties",
    icon: "🏡",
    subtitle: "Manage estate locations and acreage",
  },
  blocks: {
    singular: "Block / Sub-block",
    plural: "Blocks & Sub-blocks",
    icon: "blocks",
    subtitle: "Manage property areas and parent blocks",
  },
  plants: {
    singular: "Plant",
    plural: "Plant & Crop Master",
    icon: "plants",
    subtitle: "Manage crop varieties registered by block",
  },
  crops: {
    singular: "Crop",
    plural: "Crop Master",
    icon: "crops",
    subtitle: "Manage crops for the selected property",
  },
  cropTypes: {
    singular: "Crop Type",
    plural: "Crop Type Master",
    icon: "cropTypes",
    subtitle: "Manage types belonging to each crop",
  },
  varieties: {
    singular: "Variety",
    plural: "Variety Master",
    icon: "varieties",
    subtitle: "Map varieties to crop types",
  },
  baseUnits: {
    singular: "Measurement Unit",
    plural: "Measurement Units",
    icon: "baseUnits",
    subtitle: "Manage the units used across the estate",
  },
  fertilizers: {
    singular: "Fertilizer Application",
    plural: "Fertilizer Applications",
    icon: "fertilizer",
    subtitle: "Track fertilizer work for the selected property",
  },
  workActivities: {
    singular: "Work Activity",
    plural: "Work Activity Management",
    icon: "work",
    subtitle: "Manage assignable estate work",
  },
};

function CatalogDirectoryScreen({
  kind,
  user,
  propertyId,
  data,
  meta,
  request,
  reload,
  language,
  t,
}) {
  const ui = CATALOG_UI[kind],
    idKeys = {
      properties: "property_id",
      blocks: "block_id",
      plants: "plant_id",
      crops: "crop_id",
      cropTypes: "crop_type_id",
      varieties: "variety_master_id",
      baseUnits: "baseunit_id",
      fertilizers: "fertilizer_id",
      workActivities: "work_activity_id",
    },
    idKey = idKeys[kind];
  const nameKeys = {
      properties: "property_name",
      blocks: "block_name",
      plants: "plant_type",
      crops: "crop_name",
      cropTypes: "type_name",
      varieties: "variety_name",
      baseUnits: "baseunit_name",
      fertilizers: "fertilizer_name",
      workActivities: "work_activity_name",
    },
    nameKey = nameKeys[kind];
  const belongs = (row) => {
    if (
      kind === "properties" ||
      kind === "baseUnits" ||
      kind === "workActivities"
    )
      return true;
    if (kind === "plants") {
      const block = (data.blocks || []).find(
        (item) => String(item.block_id) === String(row.block_id),
      );
      return (
        !propertyId ||
        String(row.property_id || block?.property_id) === String(propertyId)
      );
    }
    if (kind === "cropTypes") {
      const crop = (data.crops || []).find(
        (item) => String(item.crop_id) === String(row.crop_id),
      );
      return !propertyId || String(crop?.property_id) === String(propertyId);
    }
    if (kind === "varieties") {
      const type = (data.cropTypes || []).find(
          (item) => String(item.crop_type_id) === String(row.crop_type_id),
        ),
        crop = (data.crops || []).find(
          (item) => String(item.crop_id) === String(type?.crop_id),
        );
      return !propertyId || String(crop?.property_id) === String(propertyId);
    }
    return (
      !propertyId ||
      row.property_id == null ||
      String(row.property_id) === String(propertyId)
    );
  };
  const rows = (data[kind] || []).filter(belongs),
    propertyBlocks = (data.blocks || []).filter(
      (row) => String(row.property_id) === String(propertyId),
    );
  const rawFields = (fieldConfig[kind] || [])
    .filter((field) => !(field[0] === "property_id" && kind !== "properties"))
    .map((field) =>
      field[0] === "parent_block_id"
        ? [
            "parent_block_id",
            "select",
            "Parent Block (Optional)",
            "catalogBlocks",
            "block_id",
            "block_name",
            true,
          ]
        : field[0] === "block_id"
          ? [
              "block_id",
              "select",
              "Block",
              "catalogBlocks",
              "block_id",
              "block_name",
              field[6] === true,
            ]
          : field,
    );
  const fields = rawFields.map((field) => [
      field[0],
      field[1],
      fieldName(language, field[0], field[2]),
      ...field.slice(3),
    ]),
    fieldData = { ...data, catalogBlocks: propertyBlocks };
  const blank = () => {
    const next = { created_by: "Mobile" };
    fields.forEach(
      (field) =>
        (next[field[0]] =
          field[1] === "date" ? isoDate() : field[1] === "number" ? "0" : ""),
    );
    return next;
  };
  const [view, setView] = useState("list"),
    [form, setForm] = useState(blank()),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null),
    [selectedVendorIds, setSelectedVendorIds] = useState([]),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [saving, setSaving] = useState(false);
  const filtered = rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase()),
    ),
    pageSize = 8,
    pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)),
    pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    setPage(1);
    setView("list");
    setSelected(null);
    setEditing(null);
    setForm(blank());
  }, [kind, propertyId]);
  function titleOf(row) {
    return row?.[nameKey] || `${ui.singular} #${row?.[idKey] || ""}`;
  }
  function startAdd() {
    setForm(blank());
    setEditing(null);
    setSelected(null);
    setView("form");
  }
  function startEdit(row) {
    const next = blank();
    fields.forEach(([key]) => {
      if (row[key] != null)
        next[key] = key.includes("date")
          ? String(row[key]).slice(0, 10)
          : String(row[key]);
    });
    setForm(next);
    setEditing(row);
    setSelected(null);
    setView("form");
  }
  async function save() {
    const first = fields[0];
    if (first && !String(form[first[0]] ?? "").trim())
      return Alert.alert("Required field", `Enter ${first[2]} before saving.`);
    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: user.user_id,
        created_by: user.username,
        modified_by: editing ? user.username : undefined,
      };
      if (kind !== "properties" && kind !== "baseUnits")
        payload.property_id = Number(propertyId);
      fields.forEach(([key, type, , , , , optional]) => {
        if (type === "select" && optional && payload[key] === "")
          payload[key] = null;
      });
      await request(`/api/${kind}${editing ? `/${editing[idKey]}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      await reload();
      setView("list");
      setEditing(null);
      setForm(blank());
      Alert.alert(
        editing ? "Updated" : "Saved",
        `${ui.singular} ${editing ? "updated" : "saved"} successfully.`,
      );
    } catch (error) {
      Alert.alert(
        `Could not save ${ui.singular.toLowerCase()}`,
        friendlyError(error),
      );
    } finally {
      setSaving(false);
    }
  }
  function remove(row) {
    Alert.alert(`Delete ${ui.singular}?`, titleOf(row), [
      { text: t("cancelEdit"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await request(`/api/${kind}/${row[idKey]}`, { method: "DELETE" });
            setSelected(null);
            await reload();
          } catch (error) {
            Alert.alert(
              `Could not delete ${ui.singular.toLowerCase()}`,
              friendlyError(error),
            );
          }
        },
      },
    ]);
  }
  function relationStats(row) {
    if (kind === "properties")
      return [
        `${(data.blocks || []).filter((item) => String(item.property_id) === String(row.property_id) && !item.parent_block_id).length} blocks`,
        `${(data.blocks || []).filter((item) => String(item.property_id) === String(row.property_id) && item.parent_block_id).length} sub-blocks`,
      ];
    if (kind === "blocks")
      return [
        `${(data.blocks || []).filter((item) => String(item.parent_block_id) === String(row.block_id)).length} sub-blocks`,
        `${(data.plantInventory || []).filter((item) => String(item.block_id) === String(row.block_id)).reduce((sum, item) => sum + Number(item.plant_count || 0), 0)} plants`,
      ];
    if (kind === "plants")
      return [
        `${(data.plantInventory || []).filter((item) => String(item.plant_id) === String(row.plant_id)).reduce((sum, item) => sum + Number(item.plant_count || 0), 0)} plants`,
      ];
    if (kind === "crops")
      return [
        `${(data.cropTypes || []).filter((item) => String(item.crop_id) === String(row.crop_id)).length} types`,
      ];
    if (kind === "cropTypes")
      return [
        `${(data.varieties || []).filter((item) => String(item.crop_type_id) === String(row.crop_type_id)).length} varieties`,
      ];
    if (kind === "varieties")
      return [
        `${(data.plantInventory || []).filter((item) => String(item.variety_master_id) === String(row.variety_master_id)).reduce((sum, item) => sum + Number(item.plant_count || 0), 0)} plants`,
      ];
    return [];
  }
  const details = (row) =>
    recordDetails(row, fieldData, meta, language).filter(
      ([label]) => !["Property"].includes(label),
    );
  if (view === "form")
    return (
      <View>
        <View style={styles.peopleTitleBar}>
          <TouchableOpacity onPress={() => setView("list")}>
            <Text style={styles.peopleBack}>‹</Text>
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.catalogTitle}>
            {editing ? `Edit ${ui.singular}` : `Add ${ui.singular}`}
          </Text>
          <View style={{ width: 28 }} />
        </View>
        <Section title={`${ui.singular} Information`}>
          {fields.map((field) => (
            <SmartField
              key={field[0]}
              field={field}
              value={form[field[0]]}
              setValue={(value) => setForm({ ...form, [field[0]]: value })}
              meta={meta}
              data={fieldData}
              t={t}
            />
          ))}
        </Section>
        <View style={styles.peopleFormActions}>
          <TouchableOpacity
            style={[styles.secondary, styles.peopleAction]}
            onPress={() => setView("list")}
          >
            <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            style={[
              styles.primary,
              styles.peopleAction,
              saving && styles.pageDisabled,
            ]}
            onPress={save}
          >
            <Text style={styles.primaryText}>
              {saving ? t("connecting") : `Save ${ui.singular}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  if (selected) {
    const stats = relationStats(selected);
    return (
      <View>
        <View style={styles.peopleTitleBar}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Text style={styles.peopleBack}>‹</Text>
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.catalogTitle}>
            {ui.singular} Details
          </Text>
          <TouchableOpacity onPress={() => startEdit(selected)}>
            <Text style={styles.peopleEditText}>{t("edit")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.catalogHero}>
          <AppIcon name={ui.icon} size={42} color="#8a5527" />
          <View style={{ flex: 1 }}>
            <Text style={styles.peopleProfileName}>{titleOf(selected)}</Text>
            <Text style={styles.peopleProfileMeta}>
              {kind === "blocks"
                ? selected.parent_block_id
                  ? `Sub-block of ${propertyBlocks.find((row) => String(row.block_id) === String(selected.parent_block_id))?.block_name || "parent block"}`
                  : "Main block"
                : ui.singular}
            </Text>
          </View>
        </View>
        {stats.length > 0 && (
          <View style={styles.catalogStats}>
            {stats.map((value) => (
              <View key={value} style={styles.catalogStat}>
                <Text style={styles.catalogStatValue}>
                  {value.split(" ")[0]}
                </Text>
                <Text style={styles.catalogStatLabel}>
                  {value.substring(value.indexOf(" ") + 1)}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Section title={`${ui.singular} Information`}>
          {details(selected).map(([label, value]) => (
            <View key={label} style={styles.peopleInfoRow}>
              <Text style={styles.peopleInfoLabel}>{label}</Text>
              <Text style={styles.peopleInfoValue}>{String(value)}</Text>
            </View>
          ))}
        </Section>
        <View style={styles.peopleFormActions}>
          <TouchableOpacity
            style={[styles.secondary, styles.peopleAction]}
            onPress={() => startEdit(selected)}
          >
            <Text style={styles.secondaryText}>{t("edit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.peopleDelete, styles.peopleAction]}
            onPress={() => remove(selected)}
          >
            <Text style={styles.peopleDeleteText}>{t("delete")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View>
      <View style={styles.peopleDirectoryHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>{ui.plural}</Text>
          <Text style={styles.peopleSubtitle}>{ui.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.peopleAdd} onPress={startAdd}>
          <Text style={styles.primaryText}>＋ Add</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.peopleSearch}
        value={search}
        onChangeText={setSearch}
        placeholder={`🔍 Search ${ui.plural.toLowerCase()}`}
        placeholderTextColor="#8d857c"
      />
      {pageRows.map((row) => {
        const stats = relationStats(row);
        return (
          <TouchableOpacity
            key={`${kind}-${row[idKey]}`}
            style={styles.catalogCard}
            onPress={() => setSelected(row)}
          >
            <View style={styles.catalogIcon}>
              <AppIcon name={ui.icon} size={25} color="#8a5527" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.peopleListName}>{titleOf(row)}</Text>
              <Text numberOfLines={2} style={styles.peopleListMeta}>
                {details(row)
                  .slice(0, 2)
                  .map(([, value]) => value)
                  .join(" · ") || ui.singular}
              </Text>
              {stats.length > 0 && (
                <Text style={styles.catalogCardStats}>
                  {stats.join("  •  ")}
                </Text>
              )}
            </View>
            <Text style={styles.summaryChevron}>›</Text>
          </TouchableOpacity>
        );
      })}
      {!pageRows.length && (
        <Text style={styles.muted}>No matching records.</Text>
      )}
      <Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} />
    </View>
  );
}

const EMPTY_VENDOR = {
  vendorname: "",
  contact_person: "",
  mobile_number: "",
  alternate_number: "",
  email: "",
  address: "",
  village: "",
  pincode: "",
  district: "",
  state: "",
  commission_type: "Per Day",
  commission_amount: "",
  status: "Active",
  gst_number: "",
  payment_mode: "",
  bank_details: "",
  notes: "",
};
function vendorProfile(row) {
  try {
    const parsed = JSON.parse(row?.description || "");
    if (parsed && parsed._mobileVendorProfile)
      return { ...EMPTY_VENDOR, ...parsed, vendorname: row.vendorname || "" };
  } catch {}
  return {
    ...EMPTY_VENDOR,
    vendorname: row?.vendorname || "",
    notes: row?.description || "",
  };
}
function VendorDirectoryScreen({ user, data, request, reload, t }) {
  const rows = data.vendors || [],
    links = data.laborVendors || [],
    labours = data.labors || [],
    wages = data.wages || [],
    assignments = data.workAssignments || [];
  const [view, setView] = useState("list"),
    [form, setForm] = useState({ ...EMPTY_VENDOR }),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [saving, setSaving] = useState(false);
  const linkedIds = (id) =>
      links
        .filter((link) => String(link.vendor_id) === String(id))
        .map((link) => String(link.labor_id)),
    linkedLabours = (id) =>
      linkedIds(id)
        .map((laborId) =>
          labours.find((row) => String(row.labor_id) === laborId),
        )
        .filter(Boolean);
  const commission = (id) => {
    const values = links
      .filter((link) => String(link.vendor_id) === String(id))
      .map((link) => Number(link.vendor_labor_percentage || 0))
      .filter(Boolean);
    return (
      values[0] ||
      Number(
        vendorProfile(rows.find((row) => String(row.vendor_id) === String(id)))
          .commission_amount || 0,
      )
    );
  };
  const lastWork = (id) =>
    assignments
      .filter((row) => linkedIds(id).includes(String(row.labor_id)))
      .map((row) => String(row.work_date || "").slice(0, 10))
      .sort()
      .reverse()[0] || "No work yet";
  const filtered = rows.filter((row) => {
      const profile = vendorProfile(row);
      return Object.values(profile)
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    }),
    pageSize = 6,
    pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)),
    pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = rows.filter(
    (row) => vendorProfile(row).status !== "Inactive",
  ).length;
  useEffect(() => setPage(1), [search]);
  function startAdd() {
    setForm({ ...EMPTY_VENDOR });
    setEditing(null);
    setSelected(null);
    setView("form");
  }
  function startEdit(row) {
    setForm(vendorProfile(row));
    setEditing(row);
    setSelected(null);
    setView("form");
  }
  async function save() {
    if (!form.vendorname.trim())
      return Alert.alert(
        "Vendor name required",
        "Enter the vendor or contractor name.",
      );
    if (!form.contact_person.trim())
      return Alert.alert(
        "Contact person required",
        "Enter the primary contact person.",
      );
    setSaving(true);
    try {
      const { vendorname, ...profile } = form;
      await request(`/api/vendors${editing ? `/${editing.vendor_id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          vendorname,
          description: JSON.stringify({ _mobileVendorProfile: 1, ...profile }),
          created_by: user.username,
          modified_by: editing ? user.username : undefined,
        }),
      });
      await reload();
      setView("list");
      setEditing(null);
      setForm({ ...EMPTY_VENDOR });
      Alert.alert(
        editing ? "Updated" : "Saved",
        `Vendor ${editing ? "updated" : "saved"} successfully.`,
      );
    } catch (error) {
      Alert.alert("Could not save vendor", friendlyError(error));
    } finally {
      setSaving(false);
    }
  }
  function remove(row) {
    Alert.alert("Delete Vendor?", row.vendorname, [
      { text: t("cancelEdit"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await request(`/api/vendors/${row.vendor_id}`, {
              method: "DELETE",
            });
            setSelected(null);
            await reload();
          } catch (error) {
            Alert.alert("Could not delete vendor", friendlyError(error));
          }
        },
      },
    ]);
  }
  const field = (key, label, props = {}) => (
    <FieldText
      key={key}
      label={label}
      value={String(form[key] || "")}
      onChangeText={(value) => setForm({ ...form, [key]: value })}
      {...props}
    />
  );
  if (view === "form")
    return (
      <View>
        <View style={styles.brownTitleBar}>
          <TouchableOpacity onPress={() => setView("list")}>
            <Text style={styles.peopleBack}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.peopleTitle}>
            {editing ? "Edit Vendor" : "Add Vendor"}
          </Text>
          <View style={{ width: 28 }} />
        </View>
        <Section title="🤝 Basic Information">
          {field("vendorname", "Vendor / Contractor Name *", {
            placeholder: "Enter vendor name",
          })}
          {field("contact_person", "Contact Person *", {
            placeholder: "Enter contact person",
          })}
          <View style={styles.vendorTwoCol}>
            <View style={styles.vendorCol}>
              {field("mobile_number", "Mobile Number", {
                keyboardType: "phone-pad",
                placeholder: "Mobile number",
              })}
            </View>
            <View style={styles.vendorCol}>
              {field("alternate_number", "Alternate Number", {
                keyboardType: "phone-pad",
                placeholder: "Alternate number",
              })}
            </View>
          </View>
          {field("email", "Email (Optional)", {
            keyboardType: "email-address",
            placeholder: "Email address",
          })}
        </Section>
        <Section title="📍 Address">
          {field("address", "Address", {
            placeholder: "Full address",
            multiline: true,
          })}
          <View style={styles.vendorTwoCol}>
            <View style={styles.vendorCol}>
              {field("village", "Village / Town", {
                placeholder: "Village or town",
              })}
            </View>
            <View style={styles.vendorCol}>
              {field("pincode", "Pincode", {
                keyboardType: "numeric",
                placeholder: "Pincode",
              })}
            </View>
          </View>
          <View style={styles.vendorTwoCol}>
            <View style={styles.vendorCol}>
              {field("district", "District", { placeholder: "District" })}
            </View>
            <View style={styles.vendorCol}>
              {field("state", "State", { placeholder: "State" })}
            </View>
          </View>
        </Section>
        <Section title="₹ Commission Configuration">
          <View style={styles.vendorTwoCol}>
            <View style={styles.vendorCol}>
              {field("commission_type", "Commission Type", {
                placeholder: "Per Day / Percentage",
              })}
            </View>
            <View style={styles.vendorCol}>
              {field("commission_amount", "Commission Amount", {
                keyboardType: "numeric",
                placeholder: "Amount",
              })}
            </View>
          </View>
          <Text style={styles.vendorHelp}>
            Used as the vendor default; individual labour links can still have
            their own commission.
          </Text>
        </Section>
        <Section title="🏦 Other Information">
          <View style={styles.vendorTwoCol}>
            <View style={styles.vendorCol}>
              {field("status", "Status", { placeholder: "Active / Inactive" })}
            </View>
            <View style={styles.vendorCol}>
              {field("payment_mode", "Payment Mode", {
                placeholder: "Cash / Bank",
              })}
            </View>
          </View>
          {field("gst_number", "GST Number (Optional)", {
            placeholder: "GST number",
          })}
          {field("bank_details", "Bank Details (Optional)", {
            placeholder: "Bank, account and IFSC",
          })}
          {field("notes", "Notes (Optional)", {
            placeholder: "Additional notes",
            multiline: true,
          })}
        </Section>
        <View style={styles.peopleFormActions}>
          <TouchableOpacity
            style={[styles.secondary, styles.peopleAction]}
            onPress={() => setView("list")}
          >
            <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            style={[
              styles.brownPrimary,
              styles.peopleAction,
              saving && styles.pageDisabled,
            ]}
            onPress={save}
          >
            <Text style={styles.primaryText}>
              {saving ? t("connecting") : "Save Vendor"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  if (selected) {
    const profile = vendorProfile(selected),
      people = linkedLabours(selected.vendor_id),
      assigned = assignments.filter((row) =>
        linkedIds(selected.vendor_id).includes(String(row.labor_id)),
      ).length;
    return (
      <View>
        <View style={styles.brownTitleBar}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Text style={styles.peopleBack}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.peopleTitle}>Vendor Details</Text>
          <TouchableOpacity onPress={() => startEdit(selected)}>
            <Text style={styles.peopleEditText}>{t("edit")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.vendorProfileHead}>
          <View style={styles.vendorAvatar}>
            <Text style={styles.vendorAvatarText}>
              {selected.vendorname.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.vendorNameRow}>
              <Text style={styles.peopleProfileName}>
                {selected.vendorname}
              </Text>
              <Text
                style={[
                  styles.vendorBadge,
                  profile.status === "Inactive" && styles.vendorBadgeInactive,
                ]}
              >
                {profile.status}
              </Text>
            </View>
            <Text style={styles.peopleProfileMeta}>
              {profile.contact_person || "Contact not provided"}
              {profile.mobile_number ? `  ·  ${profile.mobile_number}` : ""}
            </Text>
            <Text style={styles.peopleProfileMeta}>
              {[profile.village, profile.district, profile.pincode]
                .filter(Boolean)
                .join(", ") || "Address not provided"}
            </Text>
          </View>
        </View>
        <View style={styles.vendorStats}>
          <View style={styles.vendorStat}>
            <Text style={styles.vendorStatValue}>{people.length}</Text>
            <Text style={styles.vendorStatLabel}>Labourers</Text>
          </View>
          <View style={styles.vendorStat}>
            <Text style={styles.vendorStatValue}>
              ₹{commission(selected.vendor_id)}
            </Text>
            <Text style={styles.vendorStatLabel}>Commission</Text>
          </View>
          <View style={styles.vendorStat}>
            <Text style={styles.vendorStatValue}>{assigned}</Text>
            <Text style={styles.vendorStatLabel}>Assignments</Text>
          </View>
        </View>
        <Section title="Overview">
          {[
            ["Email", profile.email],
            ["GST Number", profile.gst_number],
            ["Payment Mode", profile.payment_mode],
            ["Bank Details", profile.bank_details],
            [
              "Address",
              [
                profile.address,
                profile.village,
                profile.district,
                profile.state,
                profile.pincode,
              ]
                .filter(Boolean)
                .join(", "),
            ],
            ["Notes", profile.notes],
          ].map(([label, value]) => (
            <View key={label} style={styles.peopleInfoRow}>
              <Text style={styles.peopleInfoLabel}>{label}</Text>
              <Text style={styles.peopleInfoValue}>{value || "—"}</Text>
            </View>
          ))}
        </Section>
        <Section title={`Vendor Labourers (${people.length})`}>
          {people.length ? (
            people.map((labour) => {
              const wage = wages.find(
                (row) => String(row.labor_id) === String(labour.labor_id),
              );
              return (
                <View
                  key={`vendor-person-${labour.labor_id}`}
                  style={styles.vendorLabourRow}
                >
                  <View>
                    <Text style={styles.peopleListName}>{labour.name}</Text>
                    <Text style={styles.peopleListMeta}>
                      {labour.emergency_details || "No mobile recorded"}
                    </Text>
                  </View>
                  <Text style={styles.vendorWage}>
                    {wage
                      ? `₹${Number(wage.wage_fixed || 0) + Number(wage.wage_variable || 0)} / day`
                      : "Wage not set"}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.muted}>
              No labourers linked to this vendor.
            </Text>
          )}
        </Section>
        <View style={styles.peopleFormActions}>
          <TouchableOpacity
            style={[styles.secondary, styles.peopleAction]}
            onPress={() => startEdit(selected)}
          >
            <Text style={styles.secondaryText}>{t("edit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.peopleDelete, styles.peopleAction]}
            onPress={() => remove(selected)}
          >
            <Text style={styles.peopleDeleteText}>{t("delete")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View>
      <View style={styles.vendorDirectoryHead}>
        <View>
          <Text style={styles.screenTitle}>Vendor Management</Text>
          <Text style={styles.peopleSubtitle}>
            Contractors, commissions and linked labourers
          </Text>
        </View>
        <TouchableOpacity style={styles.brownAdd} onPress={startAdd}>
          <Text style={styles.primaryText}>＋ Add Vendor</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.vendorStats}>
        <View style={styles.vendorStat}>
          <Text style={styles.vendorStatValue}>{rows.length}</Text>
          <Text style={styles.vendorStatLabel}>Total Vendors</Text>
        </View>
        <View style={styles.vendorStat}>
          <Text style={styles.vendorStatValue}>{activeCount}</Text>
          <Text style={styles.vendorStatLabel}>Active</Text>
        </View>
        <View style={styles.vendorStat}>
          <Text style={styles.vendorStatValue}>
            {rows.length - activeCount}
          </Text>
          <Text style={styles.vendorStatLabel}>Inactive</Text>
        </View>
      </View>
      <TextInput
        style={styles.peopleSearch}
        value={search}
        onChangeText={setSearch}
        placeholder="🔍 Search vendor by name or contact"
        placeholderTextColor="#8d857c"
      />
      {pageRows.map((row) => {
        const profile = vendorProfile(row),
          count = linkedLabours(row.vendor_id).length;
        return (
          <TouchableOpacity
            key={`vendor-${row.vendor_id}`}
            style={styles.vendorCard}
            onPress={() => setSelected(row)}
          >
            <View style={styles.vendorCardTop}>
              <View style={styles.vendorAvatarSmall}>
                <Text style={styles.vendorAvatarSmallText}>
                  {row.vendorname.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.vendorNameRow}>
                  <Text style={styles.peopleListName}>{row.vendorname}</Text>
                  <Text
                    style={[
                      styles.vendorBadge,
                      profile.status === "Inactive" &&
                        styles.vendorBadgeInactive,
                    ]}
                  >
                    {profile.status}
                  </Text>
                </View>
                <Text style={styles.peopleListMeta}>
                  Contact: {profile.contact_person || "Not provided"}
                  {profile.mobile_number ? `  ·  ${profile.mobile_number}` : ""}
                </Text>
              </View>
              <Text style={styles.summaryChevron}>›</Text>
            </View>
            <View style={styles.vendorCardMetrics}>
              <Text style={styles.vendorMetric}>👥 {count} Labourers</Text>
              <Text style={styles.vendorMetric}>
                ₹ {commission(row.vendor_id)} / day
              </Text>
              <Text style={styles.vendorMetric}>
                📅 {lastWork(row.vendor_id)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
      {!pageRows.length && (
        <Text style={styles.muted}>No matching vendors.</Text>
      )}
      <Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} />
    </View>
  );
}

function PlantInventoryHierarchyScreen({
  user,
  propertyId,
  data,
  request,
  reload,
  t,
}) {
  const crops = (data.crops || []).filter(
      (row) => String(row.property_id) === String(propertyId),
    ),
    types = data.cropTypes || [],
    varieties = data.varieties || [],
    blocks = (data.blocks || []).filter(
      (row) => String(row.property_id) === String(propertyId),
    ),
    rows = (data.plantInventory || []).filter(
      (row) => String(row.property_id) === String(propertyId),
    );
  const blank = () => ({
    crop_id: "",
    crop_type_id: "",
    variety_master_id: "",
    block_id: "",
    sub_block_name: "",
    plant_count: "0",
    planting_date: isoDate(),
    spacing: "",
    area_covered: "",
    area_unit_id: "",
    productive_count: "0",
    non_productive_count: "0",
    dead_count: "0",
    status: "active",
    notes: "",
  });
  const [form, setForm] = useState(blank()),
    [editing, setEditing] = useState(null),
    [saving, setSaving] = useState(false),
    [view, setView] = useState("list"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1);
  const filteredTypes = types.filter(
      (row) => String(row.crop_id) === String(form.crop_id),
    ),
    filteredVarieties = varieties.filter(
      (row) => String(row.crop_type_id) === String(form.crop_type_id),
    );
  const cropName = (id) =>
      crops.find((row) => String(row.crop_id) === String(id))?.crop_name ||
      "Unknown crop",
    typeForVariety = (id) => {
      const variety = varieties.find(
        (row) => String(row.variety_master_id) === String(id),
      );
      return types.find(
        (row) => String(row.crop_type_id) === String(variety?.crop_type_id),
      );
    },
    varietyName = (id) =>
      varieties.find((row) => String(row.variety_master_id) === String(id))
        ?.variety_name || "Unknown variety",
    blockName = (id) =>
      blocks.find((row) => String(row.block_id) === String(id))?.block_name ||
      "No block";
  useEffect(() => {
    if (!crops.some((row) => String(row.crop_id) === String(form.crop_id)))
      setForm((current) => ({
        ...current,
        crop_id: crops[0] ? String(crops[0].crop_id) : "",
        crop_type_id: "",
        variety_master_id: "",
      }));
  }, [propertyId, data.crops]);
  useEffect(() => {
    if (
      !filteredTypes.some(
        (row) => String(row.crop_type_id) === String(form.crop_type_id),
      )
    )
      setForm((current) => ({
        ...current,
        crop_type_id: filteredTypes[0]
          ? String(filteredTypes[0].crop_type_id)
          : "",
        variety_master_id: "",
      }));
  }, [form.crop_id, data.cropTypes]);
  useEffect(() => {
    if (
      !filteredVarieties.some(
        (row) =>
          String(row.variety_master_id) === String(form.variety_master_id),
      )
    )
      setForm((current) => ({
        ...current,
        variety_master_id: filteredVarieties[0]
          ? String(filteredVarieties[0].variety_master_id)
          : "",
      }));
  }, [form.crop_type_id, data.varieties]);
  async function save() {
    if (!form.crop_id || !form.crop_type_id || !form.variety_master_id)
      return Alert.alert(
        "Crop hierarchy required",
        "Select Crop, Crop Type and Variety.",
      );
    if (
      [
        "plant_count",
        "productive_count",
        "non_productive_count",
        "dead_count",
      ].some((key) => Number(form[key]) < 0)
    )
      return Alert.alert(
        "Invalid plant count",
        "Plant counts cannot be negative.",
      );
    setSaving(true);
    try {
      const payload = {
        property_id: Number(propertyId),
        variety_master_id: Number(form.variety_master_id),
        block_id: form.block_id ? Number(form.block_id) : null,
        sub_block_name: form.sub_block_name || null,
        plant_count: Number(form.plant_count || 0),
        planting_date: form.planting_date || null,
        spacing: form.spacing || null,
        area_covered:
          form.area_covered === "" ? null : Number(form.area_covered),
        area_unit_id: form.area_unit_id ? Number(form.area_unit_id) : null,
        productive_count: Number(form.productive_count || 0),
        non_productive_count: Number(form.non_productive_count || 0),
        dead_count: Number(form.dead_count || 0),
        status: form.status || "inactive",
        notes: form.notes || null,
        created_by: user.username,
        modified_by: editing ? user.username : undefined,
      };
      await request(
        `/api/plantInventory${editing ? `/${editing.plant_inventory_id}` : ""}`,
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      await reload();
      setEditing(null);
      setForm(blank());
      setView("list");
      Alert.alert(
        editing ? "Updated" : "Saved",
        `Plant inventory ${editing ? "updated" : "saved"} successfully.`,
      );
    } catch (error) {
      Alert.alert("Could not save plant inventory", friendlyError(error));
    } finally {
      setSaving(false);
    }
  }
  function edit(row) {
    const type = typeForVariety(row.variety_master_id),
      crop = types.find(
        (item) => String(item.crop_type_id) === String(type?.crop_type_id),
      );
    setEditing(row);
    setView("form");
    setForm({
      crop_id: String(crop?.crop_id || type?.crop_id || ""),
      crop_type_id: String(type?.crop_type_id || ""),
      variety_master_id: String(row.variety_master_id || ""),
      block_id: row.block_id ? String(row.block_id) : "",
      sub_block_name: row.sub_block_name || "",
      plant_count: String(row.plant_count || 0),
      planting_date: String(row.planting_date || isoDate()).slice(0, 10),
      spacing: row.spacing || "",
      area_covered: row.area_covered == null ? "" : String(row.area_covered),
      area_unit_id: row.area_unit_id ? String(row.area_unit_id) : "",
      productive_count: String(row.productive_count || 0),
      non_productive_count: String(row.non_productive_count || 0),
      dead_count: String(row.dead_count || 0),
      status: row.status || "active",
      notes: row.notes || "",
    });
  }
  function remove(row) {
    Alert.alert("Delete inventory entry?", varietyName(row.variety_master_id), [
      { text: t("cancelEdit"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await request(`/api/plantInventory/${row.plant_inventory_id}`, {
              method: "DELETE",
            });
            await reload();
          } catch (error) {
            Alert.alert("Could not delete inventory", friendlyError(error));
          }
        },
      },
    ]);
  }
  const filteredRows = rows.filter((row) => {
      const type = typeForVariety(row.variety_master_id);
      return `${cropName(type?.crop_id)} ${type?.type_name || ""} ${varietyName(row.variety_master_id)} ${blockName(row.block_id)}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    }),
    pageSize = 6,
    pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize)),
    pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize),
    selectData = {
      ...data,
      inventoryCrops: crops,
      inventoryTypes: filteredTypes,
      inventoryVarieties: filteredVarieties,
      inventoryBlocks: blocks,
    };
  if (view === "list")
    return (
      <View>
        <View style={styles.peopleDirectoryHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Property Plant Inventory</Text>
            <Text style={styles.peopleSubtitle}>
              Compact crop, type and variety register
            </Text>
          </View>
          <TouchableOpacity
            style={styles.brownAdd}
            onPress={() => {
              setEditing(null);
              setForm(blank());
              setView("form");
            }}
          >
            <Text style={styles.primaryText}>＋ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.peopleStats}>
          <View style={styles.peopleStat}>
            <Text style={styles.peopleStatValue}>{rows.length}</Text>
            <Text style={styles.peopleStatLabel}>Entries</Text>
          </View>
          <View style={styles.peopleStat}>
            <Text style={styles.peopleStatValue}>
              {rows.reduce((sum, row) => sum + Number(row.plant_count || 0), 0)}
            </Text>
            <Text style={styles.peopleStatLabel}>Plants</Text>
          </View>
          <View style={styles.peopleStat}>
            <Text style={styles.peopleStatValue}>
              {new Set(rows.map((row) => row.variety_master_id)).size}
            </Text>
            <Text style={styles.peopleStatLabel}>Varieties</Text>
          </View>
        </View>
        <FieldText
          label="Search inventory"
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Crop, type, variety or block"
        />
        <ExportButtons
          title="Plant Inventory"
          rows={filteredRows}
          columns={[
            ["Crop", (row) => cropName(typeForVariety(row.variety_master_id)?.crop_id)],
            ["Type", (row) => typeForVariety(row.variety_master_id)?.type_name || ""],
            ["Variety", (row) => varietyName(row.variety_master_id)],
            ["Block", (row) => blockName(row.block_id)],
            ["Plants", "plant_count"],
            ["Planting Date", "planting_date"],
            ["Status", "status"],
          ]}
        />
        <View style={styles.inventoryGrid}>
          {pageRows.map((row) => {
            const type = typeForVariety(row.variety_master_id);
            return (
              <View
                key={`inventory-grid-${row.plant_inventory_id}`}
                style={styles.inventoryGridCard}
              >
                <View style={styles.inventoryGridHead}>
                  <AppIcon name="plantInventory" size={23} color="#8a5527" />
                  <Text style={styles.inventoryGridCount}>
                    {row.plant_count || 0}
                  </Text>
                </View>
                <Text style={styles.inventoryGridTitle} numberOfLines={2}>
                  {varietyName(row.variety_master_id)}
                </Text>
                <Text style={styles.inventoryGridMeta} numberOfLines={2}>
                  {cropName(type?.crop_id)} · {type?.type_name || "Unknown type"}
                </Text>
                <Text style={styles.inventoryGridMeta} numberOfLines={1}>
                  {blockName(row.block_id)}
                  {row.sub_block_name ? ` / ${row.sub_block_name}` : ""}
                </Text>
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => edit(row)}>
                    <Text style={styles.edit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(row)}>
                    <Text style={styles.delete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
        {!pageRows.length && (
          <Text style={styles.muted}>No plant inventory recorded.</Text>
        )}
        <Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} />
      </View>
    );
  return (
    <View>
      <View style={styles.peopleDirectoryHead}>
        <View>
          <Text style={styles.screenTitle}>Property Plant Inventory</Text>
          <Text style={styles.peopleSubtitle}>
            Crop → Type → Variety for the selected property
          </Text>
        </View>
        <TouchableOpacity style={styles.secondary} onPress={() => setView("list")}>
          <Text style={styles.secondaryText}>Back to inventory</Text>
        </TouchableOpacity>
      </View>
      <Section title={editing ? "Edit Plant Details" : "Add Plant Details"}>
        <SmartField
          field={[
            "crop_id",
            "select",
            "Crop",
            "inventoryCrops",
            "crop_id",
            "crop_name",
          ]}
          value={form.crop_id}
          setValue={(value) =>
            setForm({
              ...form,
              crop_id: value,
              crop_type_id: "",
              variety_master_id: "",
            })
          }
          meta={{}}
          data={selectData}
          t={t}
        />
        <SmartField
          field={[
            "crop_type_id",
            "select",
            "Crop Type",
            "inventoryTypes",
            "crop_type_id",
            "type_name",
          ]}
          value={form.crop_type_id}
          setValue={(value) =>
            setForm({ ...form, crop_type_id: value, variety_master_id: "" })
          }
          meta={{}}
          data={selectData}
          t={t}
        />
        <SmartField
          field={[
            "variety_master_id",
            "select",
            "Variety",
            "inventoryVarieties",
            "variety_master_id",
            "variety_name",
          ]}
          value={form.variety_master_id}
          setValue={(value) => setForm({ ...form, variety_master_id: value })}
          meta={{}}
          data={selectData}
          t={t}
        />
        <SmartField
          field={[
            "block_id",
            "select",
            "Block",
            "inventoryBlocks",
            "block_id",
            "block_name",
            true,
          ]}
          value={form.block_id}
          setValue={(value) => setForm({ ...form, block_id: value })}
          meta={{}}
          data={selectData}
          t={t}
        />
        <FieldText
          label="Sub-block / Section (Optional)"
          value={form.sub_block_name}
          onChangeText={(value) => setForm({ ...form, sub_block_name: value })}
        />
        <View style={styles.vendorTwoCol}>
          <View style={styles.vendorCol}>
            <FieldText
              label="Number of Plants"
              value={form.plant_count}
              onChangeText={(value) => setForm({ ...form, plant_count: value })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.vendorCol}>
            <FieldText
              label="Planting Date"
              value={form.planting_date}
              onChangeText={(value) =>
                setForm({ ...form, planting_date: value })
              }
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
        <View style={styles.vendorTwoCol}>
          <View style={styles.vendorCol}>
            <FieldText
              label="Spacing"
              value={form.spacing}
              onChangeText={(value) => setForm({ ...form, spacing: value })}
            />
          </View>
          <View style={styles.vendorCol}>
            <FieldText
              label="Status"
              value={form.status}
              onChangeText={(value) => setForm({ ...form, status: value })}
            />
          </View>
        </View>
        <FieldText
          label="Notes (Optional)"
          value={form.notes}
          onChangeText={(value) => setForm({ ...form, notes: value })}
          multiline
        />
        <TouchableOpacity
          disabled={saving}
          style={[styles.primary, saving && styles.pageDisabled]}
          onPress={save}
        >
          <Text style={styles.primaryText}>
            {saving ? t("connecting") : editing ? t("update") : t("save")}
          </Text>
        </TouchableOpacity>
        {editing && (
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => {
              setEditing(null);
              setForm(blank());
            }}
          >
            <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
          </TouchableOpacity>
        )}
      </Section>
    </View>
  );
}

function PeopleDirectoryScreen({ kind, user, data, request, reload, t }) {
  const isLabour = kind === "labors",
    rows = data[kind] || [],
    links = data.laborVendors || [],
    wages = data.wages || [];
  const emptyForm = isLabour
    ? {
        name: "",
        age: "",
        adhar_card: "",
        bank_details: "",
        health_history: "",
        photo: "",
        address: "",
        emergency_details: "",
      }
    : { vendorname: "", description: "" };
  const [view, setView] = useState("list"),
    [form, setForm] = useState(emptyForm),
    [editing, setEditing] = useState(null),
    [selected, setSelected] = useState(null),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [saving, setSaving] = useState(false);
  const title = isLabour ? "Labour" : "Vendor",
    idKey = isLabour ? "labor_id" : "vendor_id",
    nameKey = isLabour ? "name" : "vendorname";
  const filtered = rows.filter((row) =>
    `${row[nameKey] || ""} ${row.address || ""} ${row.description || ""} ${row.emergency_details || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const pageSize = 8,
    pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)),
    pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [search, kind]);
  function vendorFor(laborId) {
    const link = links.find((row) => String(row.labor_id) === String(laborId));
    return link
      ? data.vendors?.find(
          (row) => String(row.vendor_id) === String(link.vendor_id),
        )
      : null;
  }
  function vendorsFor(laborId) {
    return links
      .filter((row) => String(row.labor_id) === String(laborId))
      .map((link) =>
        data.vendors?.find(
          (row) => String(row.vendor_id) === String(link.vendor_id),
        ),
      )
      .filter(Boolean);
  }
  function labourCount(vendorId) {
    return new Set(
      links
        .filter((row) => String(row.vendor_id) === String(vendorId))
        .map((row) => String(row.labor_id)),
    ).size;
  }
  function wageFor(laborId) {
    const wage = wages.find((row) => String(row.labor_id) === String(laborId));
    return wage
      ? Number(wage.wage_fixed || 0) + Number(wage.wage_variable || 0)
      : 0;
  }
  function startAdd() {
    setForm(emptyForm);
    setEditing(null);
    setSelected(null);
    setSelectedVendorIds([]);
    setView("form");
  }
  function startEdit(row) {
    const next = { ...emptyForm };
    Object.keys(next).forEach(
      (key) => (next[key] = row[key] == null ? "" : String(row[key])),
    );
    setForm(next);
    setEditing(row);
    setSelected(null);
    setSelectedVendorIds(
      isLabour
        ? links
            .filter((link) => String(link.labor_id) === String(row.labor_id))
            .map((link) => String(link.vendor_id))
        : [],
    );
    setView("form");
  }
  async function save() {
    const name = String(form[nameKey] || "").trim();
    if (!name)
      return Alert.alert(
        `${title} name required`,
        `Enter the ${title.toLowerCase()} name before saving.`,
      );
    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: user.user_id,
        created_by: user.username,
        modified_by: editing ? user.username : undefined,
      };
      if (isLabour)
        payload.age = payload.age === "" ? null : Number(payload.age);
      const saved = await request(
        `/api/${kind}${editing ? `/${editing[idKey]}` : ""}`,
        {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
        },
      );
      if (isLabour) {
        const laborId = editing?.labor_id || saved?.labor_id;
        const existingLinks = links.filter(
          (link) => String(link.labor_id) === String(laborId),
        );
        for (const link of existingLinks) {
          if (!selectedVendorIds.includes(String(link.vendor_id)))
            await request(`/api/laborVendors/${link.laborvendor_id}`, {
              method: "DELETE",
            });
        }
        for (const vendorId of selectedVendorIds) {
          if (
            !existingLinks.some(
              (link) => String(link.vendor_id) === String(vendorId),
            )
          )
            await request("/api/laborVendors", {
              method: "POST",
              body: JSON.stringify({
                labor_id: Number(laborId),
                vendor_id: Number(vendorId),
                vendor_labor_percentage: 0,
                laborvendorcode: `LV-${laborId}-${vendorId}`,
                created_by: user.username,
              }),
            });
        }
      }
      await reload();
      setView("list");
      setEditing(null);
      setForm(emptyForm);
      Alert.alert(
        editing ? "Updated" : "Saved",
        `${title} ${editing ? "updated" : "saved"} successfully.`,
      );
    } catch (error) {
      Alert.alert(
        `Could not save ${title.toLowerCase()}`,
        friendlyError(error),
      );
    } finally {
      setSaving(false);
    }
  }
  function remove(row) {
    Alert.alert(`Delete ${title}?`, row[nameKey], [
      { text: t("cancelEdit"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await request(`/api/${kind}/${row[idKey]}`, { method: "DELETE" });
            setSelected(null);
            await reload();
          } catch (error) {
            Alert.alert(
              `Could not delete ${title.toLowerCase()}`,
              friendlyError(error),
            );
          }
        },
      },
    ]);
  }
  const infoRow = (label, value) => (
    <View key={label} style={styles.peopleInfoRow}>
      <Text style={styles.peopleInfoLabel}>{label}</Text>
      <Text style={styles.peopleInfoValue}>{value || "—"}</Text>
    </View>
  );
  if (view === "form")
    return (
      <View>
        <View style={styles.peopleTitleBar}>
          <TouchableOpacity onPress={() => setView("list")}>
            <Text style={styles.peopleBack}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.peopleTitle}>
            {editing ? `Edit ${title}` : `Add ${title}`}
          </Text>
          <View style={{ width: 28 }} />
        </View>
        {isLabour ? (
          <>
            <Section title="👤 Basic Information">
              <View style={styles.peoplePhotoRow}>
                <View style={styles.peoplePhotoBox}>
                  <Text style={styles.peoplePhotoIcon}>📷</Text>
                  <Text style={styles.peoplePhotoText}>Photo reference</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <FieldText
                    label="Full Name *"
                    value={form.name}
                    onChangeText={(value) => setForm({ ...form, name: value })}
                    placeholder="Enter full name"
                  />
                  <FieldText
                    label="Age"
                    value={form.age}
                    onChangeText={(value) => setForm({ ...form, age: value })}
                    keyboardType="numeric"
                    placeholder="Enter age"
                  />
                </View>
              </View>
              <FieldText
                label="Photo URL / Reference (Optional)"
                value={form.photo}
                onChangeText={(value) => setForm({ ...form, photo: value })}
                placeholder="Photo URL or reference"
              />
              <FieldText
                label="Government ID / Aadhaar (Optional)"
                value={form.adhar_card}
                onChangeText={(value) =>
                  setForm({ ...form, adhar_card: value })
                }
                placeholder="Enter ID number"
              />
            </Section>
            <Section title="🧑‍🌾 Work Information">
              <Text style={styles.fieldLabel}>
                Vendors / Contractors (Optional, select multiple)
              </Text>
              <View style={styles.vendorChoiceGrid}>
                {(data.vendors || []).map((vendor) => {
                  const id = String(vendor.vendor_id),
                    active = selectedVendorIds.includes(id);
                  return (
                    <TouchableOpacity
                      key={`labor-vendor-choice-${id}`}
                      style={[
                        styles.vendorChoice,
                        active && styles.vendorChoiceActive,
                      ]}
                      onPress={() =>
                        setSelectedVendorIds((current) =>
                          active
                            ? current.filter((value) => value !== id)
                            : [...current, id],
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.vendorChoiceText,
                          active && styles.vendorChoiceTextActive,
                        ]}
                      >
                        {active ? "✓ " : ""}{vendor.vendorname}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {!data.vendors?.length && (
                <Text style={styles.peopleHint}>
                  No vendors are registered. This labourer will remain direct.
                </Text>
              )}
              <FieldText
                label="Health / Skill Notes"
                value={form.health_history}
                onChangeText={(value) =>
                  setForm({ ...form, health_history: value })
                }
                placeholder="Health, skill, or work notes"
              />
            </Section>
            <Section title="📍 Address & Contact">
              <FieldText
                label="Address"
                value={form.address}
                onChangeText={(value) => setForm({ ...form, address: value })}
                placeholder="Village, town, and address"
              />
              <FieldText
                label="Emergency Contact"
                value={form.emergency_details}
                onChangeText={(value) =>
                  setForm({ ...form, emergency_details: value })
                }
                keyboardType="phone-pad"
                placeholder="Name and mobile number"
              />
            </Section>
            <Section title="🏦 Bank Details (Optional)">
              <FieldText
                label="Bank / Account Details"
                value={form.bank_details}
                onChangeText={(value) =>
                  setForm({ ...form, bank_details: value })
                }
                placeholder="Bank, account, and IFSC details"
              />
            </Section>
          </>
        ) : (
          <>
            <Section title="🤝 Basic Information">
              <FieldText
                label="Vendor / Contractor Name *"
                value={form.vendorname}
                onChangeText={(value) =>
                  setForm({ ...form, vendorname: value })
                }
                placeholder="Enter vendor name"
              />
              <FieldText
                label="Contact, Address & Notes"
                value={form.description}
                onChangeText={(value) =>
                  setForm({ ...form, description: value })
                }
                placeholder="Contact person, mobile, address, commission notes"
                multiline
                numberOfLines={5}
              />
            </Section>
          </>
        )}
        <View style={styles.peopleFormActions}>
          <TouchableOpacity
            style={[styles.secondary, styles.peopleAction]}
            onPress={() => setView("list")}
          >
            <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={saving}
            style={[
              styles.primary,
              styles.peopleAction,
              saving && styles.pageDisabled,
            ]}
            onPress={save}
          >
            <Text style={styles.primaryText}>
              {saving ? t("connecting") : `Save ${title}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  if (selected) {
    const vendor = isLabour ? vendorFor(selected.labor_id) : null,
      linkedVendors = isLabour ? vendorsFor(selected.labor_id) : [],
      linkedLabours = isLabour
        ? []
        : links
            .filter(
              (link) => String(link.vendor_id) === String(selected.vendor_id),
            )
            .map((link) =>
              data.labors?.find(
                (row) => String(row.labor_id) === String(link.labor_id),
              ),
            )
            .filter(Boolean);
    return (
      <View>
        <View style={styles.peopleTitleBar}>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Text style={styles.peopleBack}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.peopleTitle}>{title} Details</Text>
          <TouchableOpacity onPress={() => startEdit(selected)}>
            <Text style={styles.peopleEditText}>{t("edit")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.peopleProfile}>
          <View style={styles.peopleAvatar}>
            <Text style={styles.peopleAvatarText}>
              {String(selected[nameKey] || "?")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.peopleProfileName}>{selected[nameKey]}</Text>
            <Text style={styles.peopleProfileMeta}>
              {isLabour
                ? linkedVendors.length
                  ? `Vendors: ${linkedVendors.map((item) => item.vendorname).join(", ")}`
                  : "Direct labour"
                : `${labourCount(selected.vendor_id)} linked labourers`}
            </Text>
          </View>
        </View>
        {isLabour ? (
          <>
            <Section title="Basic Information">
              {infoRow("Age", selected.age)}
              {infoRow("Government ID / Aadhaar", selected.adhar_card)}
            </Section>
            <Section title="Work Information">
              {infoRow(
                "Vendor / Contractor",
                linkedVendors.length
                  ? linkedVendors.map((item) => item.vendorname).join(", ")
                  : "Direct labour",
              )}
              {infoRow(
                "Daily Wage",
                wageFor(selected.labor_id)
                  ? `₹${wageFor(selected.labor_id)}`
                  : "Not configured",
              )}
              {infoRow("Health / Skill Notes", selected.health_history)}
            </Section>
            <Section title="Address & Contact">
              {infoRow("Address", selected.address)}
              {infoRow("Emergency Contact", selected.emergency_details)}
            </Section>
            <Section title="Bank Details">
              {infoRow("Bank / Account", selected.bank_details)}
            </Section>
          </>
        ) : (
          <>
            <Section title="Overview">
              {infoRow("Contact, Address & Notes", selected.description)}
              {infoRow("Linked Labourers", String(linkedLabours.length))}
            </Section>
            <Section title="Vendor Labourers">
              {linkedLabours.length ? (
                linkedLabours.map((labour) => (
                  <TouchableOpacity
                    key={`vendor-labour-${labour.labor_id}`}
                    style={styles.vendorLabourRow}
                  >
                    <Text style={styles.peopleListName}>{labour.name}</Text>
                    <Text style={styles.peopleListMeta}>
                      {wageFor(labour.labor_id)
                        ? `₹${wageFor(labour.labor_id)} / day`
                        : "Wage not set"}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.muted}>
                  No labourers linked to this vendor.
                </Text>
              )}
            </Section>
          </>
        )}
        <View style={styles.peopleFormActions}>
          <TouchableOpacity
            style={[styles.secondary, styles.peopleAction]}
            onPress={() => startEdit(selected)}
          >
            <Text style={styles.secondaryText}>{t("edit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.peopleDelete, styles.peopleAction]}
            onPress={() => remove(selected)}
          >
            <Text style={styles.peopleDeleteText}>{t("delete")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View>
      <View style={styles.peopleDirectoryHead}>
        <View>
          <Text style={styles.screenTitle}>{title} Directory</Text>
          <Text style={styles.peopleSubtitle}>
            Manage registered{" "}
            {isLabour ? "labourers" : "vendors and contractors"}
          </Text>
        </View>
        <TouchableOpacity style={styles.peopleAdd} onPress={startAdd}>
          <Text style={styles.primaryText}>＋ Add {title}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.peopleStats}>
        <View style={styles.peopleStat}>
          <Text style={styles.peopleStatValue}>{rows.length}</Text>
          <Text style={styles.peopleStatLabel}>Total</Text>
        </View>
        <View style={styles.peopleStat}>
          <Text style={styles.peopleStatValue}>
            {isLabour
              ? links.length
              : links.filter((link) =>
                  rows.some(
                    (row) => String(row.vendor_id) === String(link.vendor_id),
                  ),
                ).length}
          </Text>
          <Text style={styles.peopleStatLabel}>
            {isLabour ? "Vendor linked" : "Labour links"}
          </Text>
        </View>
        <View style={styles.peopleStat}>
          <Text style={styles.peopleStatValue}>
            {isLabour
              ? rows.filter((row) => !vendorFor(row.labor_id)).length
              : rows.filter((row) => !labourCount(row.vendor_id)).length}
          </Text>
          <Text style={styles.peopleStatLabel}>Unlinked</Text>
        </View>
      </View>
      <TextInput
        style={styles.peopleSearch}
        value={search}
        onChangeText={setSearch}
        placeholder={`🔍 Search ${title.toLowerCase()} by name or details`}
        placeholderTextColor="#8d857c"
      />
      {pageRows.map((row) => {
        const vendor = isLabour ? vendorFor(row.labor_id) : null,
          linkedVendors = isLabour ? vendorsFor(row.labor_id) : [];
        return (
          <TouchableOpacity
            key={`${kind}-${row[idKey]}`}
            style={styles.peopleListCard}
            onPress={() => setSelected(row)}
          >
            <View style={styles.peopleSmallAvatar}>
              <Text style={styles.peopleSmallAvatarText}>
                {String(row[nameKey] || "?")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.peopleListName}>{row[nameKey]}</Text>
              <Text numberOfLines={1} style={styles.peopleListMeta}>
                {isLabour
                  ? linkedVendors.length
                    ? `Vendors: ${linkedVendors.map((item) => item.vendorname).join(", ")}`
                    : "Direct labour"
                  : `${labourCount(row.vendor_id)} linked labourers`}
              </Text>
              {isLabour && (
                <Text style={styles.peopleListMeta}>
                  {wageFor(row.labor_id)
                    ? `₹${wageFor(row.labor_id)} / day`
                    : "Wage not configured"}
                </Text>
              )}
            </View>
            <Text style={styles.summaryChevron}>›</Text>
          </TouchableOpacity>
        );
      })}
      {!pageRows.length && (
        <Text style={styles.muted}>
          No matching {title.toLowerCase()} records.
        </Text>
      )}
      <Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} />
    </View>
  );
}

function AttendanceGrid({
  user,
  propertyId,
  data,
  request,
  reload,
  language,
  t,
}) {
  const copy = ATTENDANCE_TEXT[language] || ATTENDANCE_TEXT.en;
  const [entryDate, setEntryDate] = useState(isoDate());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selections, setSelections] = useState({});
  const [saving, setSaving] = useState(false);
  const [editingDay, setEditingDay] = useState(false);
  const [fromDate, setFromDate] = useState(monthStartDate());
  const [toDate, setToDate] = useState(monthEndDate());
  const belongsToProperty = (item) =>
    item?.property_id == null ||
    String(item.property_id) === String(propertyId);
  const labours = (data.labors || []).filter(belongsToProperty);
  const records = (data.attendance || []).filter(belongsToProperty);
  const datedRecords = records.filter(
    (row) => String(row.entry_date || "").slice(0, 10) === entryDate,
  );
  const nameOf = (id) =>
    labours.find((l) => String(l.labor_id) === String(id))?.name ||
    records.find((r) => String(r.labor_id) === String(id))?.labor_name ||
    `#${id}`;
  const valueLabel = (value) =>
    String(value) === "1"
      ? copy.full
      : String(value) === "0.5"
        ? copy.half
        : copy.absent;

  useEffect(() => {
    const next = {};
    datedRecords.forEach((row) => {
      next[String(row.labor_id)] = String(row.attendance_value);
    });
    setSelections(next);
    setEditingDay(false);
  }, [propertyId, entryDate, data.attendance]);

  async function saveAttendance() {
    const selected = labours.filter(
      (l) => selections[String(l.labor_id)] != null,
    );
    if (!selected.length) return Alert.alert(copy.attendance, copy.mark);
    setSaving(true);
    try {
      for (const labour of selected) {
        const existing = datedRecords.find(
          (row) => String(row.labor_id) === String(labour.labor_id),
        );
        const id = existing && rowId(existing);
        const payload = {
          labor_id: labour.labor_id,
          property_id: propertyId,
          entry_date: entryDate,
          attendance_value: Number(selections[String(labour.labor_id)]),
          user_id: user.user_id,
          created_by: user.username,
        };
        await request(`/api/attendance${id ? `/${id}` : ""}`, {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        });
      }
      await reload();
      setEditingDay(false);
      Alert.alert(t("save"), `${copy.save} (${selected.length})`);
    } catch (error) {
      Alert.alert("Could not save", friendlyError(error));
    } finally {
      setSaving(false);
    }
  }

  function clearAttendance() {
    if (!datedRecords.length) return;
    Alert.alert(copy.clear, `${copy.clear}: ${entryDate}?`, [
      { text: t("cancelEdit"), style: "cancel" },
      {
        text: copy.clear,
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            for (const record of datedRecords) {
              const id = rowId(record);
              if (id)
                await request(`/api/attendance/${id}`, { method: "DELETE" });
            }
            setSelections({});
            await reload();
            Alert.alert(copy.attendance, copy.clear);
          } catch (error) {
            Alert.alert("Could not clear attendance", friendlyError(error));
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  const choices = [
    [copy.full, "1"],
    [copy.half, "0.5"],
    [copy.absent, "0"],
  ];
  return (
    <View>
      <View style={styles.attendanceTitleRow}>
        <Text style={styles.screenTitle}>
          {moduleName(language, "attendanceQuick")}
        </Text>
        <TouchableOpacity
          style={styles.attendanceDate}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={styles.attendanceDateText}>📅 {entryDate}</Text>
        </TouchableOpacity>
      </View>
      {pickerOpen && (
        <DateTimePicker
          locale={localeFor(language)}
          value={new Date(`${entryDate}T12:00:00`)}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setPickerOpen(Platform.OS === "ios");
            if (event.type !== "dismissed" && date) setEntryDate(isoDate(date));
          }}
        />
      )}
      <Section title={copy.mark} right={`${labours.length}`}>
        {!labours.length ? (
          <Text style={styles.muted}>{copy.empty}</Text>
        ) : (
          <>
            {datedRecords.length > 0 && !editingDay && (
              <View style={styles.attendancePresent}>
                <Text style={styles.attendancePresentText}>{copy.present}</Text>
              </View>
            )}
            <View style={styles.attendanceGridHeader}>
              <Text
                style={[styles.attendanceHeadText, styles.attendanceNameCell]}
              >
                {copy.labour}
              </Text>
              {choices.map(([label, value]) => (
                <Text
                  key={value}
                  numberOfLines={2}
                  style={styles.attendanceChoiceHead}
                >
                  {label}
                </Text>
              ))}
            </View>
            {labours.map((labour) => {
              const id = String(labour.labor_id);
              const locked = datedRecords.length > 0 && !editingDay;
              return (
                <View
                  key={`attendance-${propertyId}-${id}`}
                  style={[
                    styles.attendanceGridRow,
                    locked && styles.attendanceLocked,
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    style={[styles.attendanceLabour, styles.attendanceNameCell]}
                  >
                    {labour.name || labour.labor_name || `#${id}`}
                  </Text>
                  {choices.map(([label, value]) => (
                    <TouchableOpacity
                      disabled={locked}
                      key={value}
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected: selections[id] === value,
                        disabled: locked,
                      }}
                      accessibilityLabel={`${labour.name}, ${label}`}
                      style={styles.attendanceChoiceCell}
                      onPress={() =>
                        setSelections((current) => ({
                          ...current,
                          [id]: value,
                        }))
                      }
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selections[id] === value && styles.radioSelected,
                        ]}
                      >
                        {selections[id] === value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
            {datedRecords.length > 0 && !editingDay ? (
              <View style={styles.attendanceActions}>
                <TouchableOpacity
                  style={[styles.primary, styles.attendanceAction]}
                  onPress={() => setEditingDay(true)}
                >
                  <Text style={styles.primaryText}>{copy.edit}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={saving}
                  style={[styles.clearAttendance, styles.attendanceAction]}
                  onPress={clearAttendance}
                >
                  <Text style={styles.clearAttendanceText}>{copy.clear}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                disabled={saving}
                style={[styles.primary, saving && styles.pageDisabled]}
                onPress={saveAttendance}
              >
                <Text style={styles.primaryText}>
                  {saving
                    ? t("connecting")
                    : `${copy.save} (${Object.keys(selections).length})`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </Section>
      <AttendanceSummary
        records={records}
        labours={labours}
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        copy={copy}
        language={language}
        t={t}
      />
    </View>
  );
}

function AttendanceSummary({
  records,
  labours,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  copy,
  language,
  t,
}) {
  const [page, setPage] = useState(1);
  const [selectedLabour, setSelectedLabour] = useState(null);
  const pageSize = 10;
  const ranged = records.filter((row) => {
    const date = String(row.entry_date || "").slice(0, 10);
    return date >= fromDate && date <= toDate;
  });
  const uniqueByDay = new Map();
  ranged.forEach((row) =>
    uniqueByDay.set(
      `${row.labor_id}-${String(row.entry_date || "").slice(0, 10)}`,
      row,
    ),
  );
  const uniqueRecords = [...uniqueByDay.values()];
  const summaries = labours
    .map((labour) => {
      const laborRecords = uniqueRecords.filter(
        (row) => String(row.labor_id) === String(labour.labor_id),
      );
      return {
        id: String(labour.labor_id),
        name: labour.name || labour.labor_name || `#${labour.labor_id}`,
        days: laborRecords.reduce(
          (sum, row) => sum + Math.max(0, Number(row.attendance_value) || 0),
          0,
        ),
        records: laborRecords
          .filter((row) => Number(row.attendance_value) > 0)
          .sort((a, b) =>
            String(b.entry_date).localeCompare(String(a.entry_date)),
          ),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const pageCount = Math.max(1, Math.ceil(summaries.length / pageSize));
  const pageRows = summaries.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    setPage(1);
    setSelectedLabour(null);
  }, [fromDate, toDate]);
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);
  const formatDays = (value) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);
  const valueLabel = (value) =>
    String(value) === "1"
      ? copy.full
      : String(value) === "0.5"
        ? copy.half
        : copy.absent;
  return (
    <Section title={copy.saved} right={`${summaries.length} ${t("entries")}`}>
      <DateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        resetFrom={monthStartDate()}
        resetTo={monthEndDate()}
        maximumDate={new Date(`${monthEndDate()}T12:00:00`)}
        t={t}
        language={language}
      />
      <View style={styles.summaryGridHeader}>
        <Text style={[styles.summaryHead, styles.summaryName]}>
          {copy.labour}
        </Text>
        <Text style={styles.summaryHead}>{copy.days}</Text>
        <Text style={styles.summaryViewHead}>{copy.view}</Text>
      </View>
      {pageRows.map((row) => (
        <TouchableOpacity
          key={`attendance-summary-${row.id}`}
          style={styles.summaryGridRow}
          onPress={() => setSelectedLabour(row)}
        >
          <Text
            numberOfLines={2}
            style={[styles.summaryCell, styles.summaryName]}
          >
            {row.name}
          </Text>
          <Text style={styles.summaryDays}>{formatDays(row.days)}</Text>
          <Text style={styles.summaryChevron}>›</Text>
        </TouchableOpacity>
      ))}
      <Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} />
      <Modal
        visible={Boolean(selectedLabour)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLabour(null)}
      >
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedLabour?.name}</Text>
            <Text style={styles.attendanceDetailRange}>
              {fromDate} → {toDate} · {copy.days}:{" "}
              {formatDays(selectedLabour?.days || 0)}
            </Text>
            <ScrollView>
              {selectedLabour?.records.length ? (
                selectedLabour.records.map((row, index) => (
                  <View
                    key={`attendance-date-${selectedLabour.id}-${String(row.entry_date).slice(0, 10)}-${index}`}
                    style={styles.attendanceDateRow}
                  >
                    <Text style={styles.attendanceDetailDate}>
                      {String(row.entry_date).slice(0, 10)}
                    </Text>
                    <Text style={styles.attendanceDetailValue}>
                      {valueLabel(row.attendance_value)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>{t("noRecords")}</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setSelectedLabour(null)}
            >
              <Text style={styles.secondaryText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Section>
  );
}

function rainfallToMm(value, unit) {
  const number = Number(value) || 0;
  return unit === "in" ? number * 25.4 : unit === "cm" ? number * 10 : number;
}
function rainfallFromMm(value, unit) {
  const number = Number(value) || 0;
  return unit === "in" ? number / 25.4 : unit === "cm" ? number / 10 : number;
}
function rainfallUnitFor(mm) {
  return mm < 100 ? "mm" : mm >= 1000 ? "cm" : "in";
}
function rainfallNumber(value) {
  if (value >= 100) return value.toFixed(1).replace(/\.0$/, "");
  if (value >= 10)
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function RainfallScreen({
  user,
  propertyId,
  data,
  request,
  reload,
  language,
  t,
}) {
  const copy = RAIN_TEXT[language] || RAIN_TEXT.en;
  const [blockId, setBlockId] = useState("");
  const [recordedDate, setRecordedDate] = useState(isoDate());
  const [amount, setAmount] = useState("");
  const [entryUnit, setEntryUnit] = useState("mm");
  const [displayUnit, setDisplayUnit] = useState(null);
  const [datePicker, setDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(monthStartDate());
  const [toDate, setToDate] = useState(monthEndDate());
  const [logsOpen, setLogsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const blocks = (data.blocks || []).filter(
    (block) =>
      block.property_id == null ||
      String(block.property_id) === String(propertyId),
  );
  const allRecords = data.rainfall || [];
  const records = allRecords.filter((row) => {
    const date = String(row.recorded_date || row.date_time || "").slice(0, 10);
    return date >= fromDate && date <= toDate;
  });
  const totalMm = records.reduce(
    (sum, row) => sum + (Number(row.rain_value) || 0),
    0,
  );
  const activeDisplayUnit = displayUnit || rainfallUnitFor(totalMm);
  const pageSize = 10;
  let runningMm = 0;
  const runningRows = [...records]
    .sort(
      (a, b) =>
        String(a.recorded_date || a.date_time).localeCompare(
          String(b.recorded_date || b.date_time),
        ) || Number(a.rain_id) - Number(b.rain_id),
    )
    .map((row) => ({
      ...row,
      running_mm: (runningMm += Number(row.rain_value) || 0),
    }));
  const pageCount = Math.max(1, Math.ceil(runningRows.length / pageSize));
  const pageRows = runningRows.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    setBlockId("");
    setAmount("");
    setEditingId(null);
    setPage(1);
    setLogsOpen(false);
  }, [propertyId]);
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate]);
  function changeEntryUnit(next) {
    const mm = rainfallToMm(amount, entryUnit);
    setEntryUnit(next);
    setAmount(amount === "" ? "" : rainfallNumber(rainfallFromMm(mm, next)));
  }
  async function persistRainfall() {
    const rainMm = rainfallToMm(amount, entryUnit);
    if (!amount || rainMm < 0) return Alert.alert(copy.amount, copy.amount);
    setSaving(true);
    try {
      await request(`/api/rainfall${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify({
          property_id: Number(propertyId),
          block_id: blockId ? Number(blockId) : null,
          recorded_date: recordedDate,
          rain_value: Number(rainMm.toFixed(4)),
          created_by: user.username,
          modified_by: user.username,
        }),
      });
      setAmount("");
      setBlockId("");
      setEntryUnit("mm");
      setEditingId(null);
      await reload();
      Alert.alert(t("save"), copy.save);
    } catch (error) {
      Alert.alert("Could not save rainfall", friendlyError(error));
    } finally {
      setSaving(false);
    }
  }
  function saveRainfall() {
    const sameDay = allRecords.filter(
      (row) =>
        String(row.recorded_date || row.date_time).slice(0, 10) ===
          recordedDate && String(row.rain_id) !== String(editingId),
    );
    if (sameDay.length && !editingId)
      return Alert.alert(
        copy.title,
        `Rainfall is already recorded for ${recordedDate}. Do you need to add another log for this day?`,
        [
          { text: t("cancelEdit"), style: "cancel" },
          { text: "Add another", onPress: persistRainfall },
        ],
      );
    persistRainfall();
  }
  function editRainfall(row) {
    setEditingId(row.rain_id);
    setBlockId(row.block_id ? String(row.block_id) : "");
    setRecordedDate(String(row.recorded_date || row.date_time).slice(0, 10));
    setAmount(rainfallNumber(Number(row.rain_value) || 0));
    setEntryUnit("mm");
    setLogsOpen(false);
  }
  function deleteRainfall(row) {
    Alert.alert(
      t("delete"),
      `${String(row.recorded_date || row.date_time).slice(0, 10)}?`,
      [
        { text: t("cancelEdit"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await request(`/api/rainfall/${row.rain_id}`, {
                method: "DELETE",
              });
              await reload();
            } catch (error) {
              Alert.alert("Could not delete rainfall", friendlyError(error));
            }
          },
        },
      ],
    );
  }
  const blockField = [
    "block_id",
    "select",
    copy.block,
    "rainBlocks",
    "block_id",
    "block_name",
    true,
  ];
  const fieldData = { ...data, rainBlocks: blocks };
  return (
    <View>
      <Text style={styles.screenTitle}>{copy.title}</Text>
      <Section title={editingId ? t("edit") : copy.save}>
        <SmartField
          field={blockField}
          value={blockId}
          setValue={setBlockId}
          meta={{}}
          data={fieldData}
          t={t}
        />
        <Text style={styles.label}>{copy.date}</Text>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => setDatePicker(true)}
        >
          <Text style={styles.inputText}>📅 {recordedDate}</Text>
        </TouchableOpacity>
        {datePicker && (
          <DateTimePicker
            locale={localeFor(language)}
            value={new Date(`${recordedDate}T12:00:00`)}
            mode="date"
            maximumDate={new Date()}
            onChange={(event, date) => {
              setDatePicker(Platform.OS === "ios");
              if (event.type !== "dismissed" && date)
                setRecordedDate(isoDate(date));
            }}
          />
        )}
        <Text style={[styles.label, styles.rainAmountLabel]}>
          {copy.amount}
        </Text>
        <View style={styles.rainInputRow}>
          <TextInput
            style={styles.rainAmountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#9c9a91"
          />
          <View style={styles.rainUnitButtons}>
            {["mm", "cm", "in"].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.rainUnitButton,
                  entryUnit === unit && styles.rainUnitActive,
                ]}
                onPress={() => changeEntryUnit(unit)}
              >
                <Text
                  style={[
                    styles.rainUnitText,
                    entryUnit === unit && styles.rainUnitTextActive,
                  ]}
                >
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={styles.rainStorageHint}>
          ≈ {rainfallNumber(rainfallToMm(amount, entryUnit))} mm
        </Text>
        <TouchableOpacity
          disabled={saving}
          style={[styles.primary, saving && styles.pageDisabled]}
          onPress={saveRainfall}
        >
          <Text style={styles.primaryText}>
            {saving ? t("connecting") : editingId ? t("update") : copy.save}
          </Text>
        </TouchableOpacity>
        {editingId && (
          <TouchableOpacity
            style={styles.secondary}
            onPress={() => {
              setEditingId(null);
              setBlockId("");
              setAmount("");
              setEntryUnit("mm");
            }}
          >
            <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
          </TouchableOpacity>
        )}
      </Section>
      <Section
        title={copy.cumulative}
        right={`${records.length} ${t("entries")}`}
      >
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          resetFrom={monthStartDate()}
          resetTo={monthEndDate()}
          maximumDate={new Date(`${monthEndDate()}T12:00:00`)}
          t={t}
          language={language}
        />
        <View style={styles.rainTotalCard}>
          <Text style={styles.rainTotalValue}>
            {rainfallNumber(rainfallFromMm(totalMm, activeDisplayUnit))}
          </Text>
          <Text style={styles.rainTotalUnit}>{activeDisplayUnit}</Text>
          <Text style={styles.rainTotalRange}>
            {fromDate} → {toDate}
          </Text>
        </View>
        <View style={styles.rainDisplayUnits}>
          {["mm", "cm", "in"].map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.rainDisplayUnit,
                activeDisplayUnit === unit && styles.rainDisplayUnitActive,
              ]}
              onPress={() => setDisplayUnit(unit)}
            >
              <Text
                style={[
                  styles.rainDisplayText,
                  activeDisplayUnit === unit && styles.rainDisplayTextActive,
                ]}
              >
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.secondary}
          onPress={() => setLogsOpen(true)}
        >
          <Text style={styles.secondaryText}>
            {copy.logs} ({records.length})
          </Text>
        </TouchableOpacity>
      </Section>
      <Modal
        visible={logsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setLogsOpen(false)}
      >
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{copy.logged}</Text>
            <Text style={styles.attendanceDetailRange}>
              {fromDate} → {toDate}
            </Text>
            <View style={styles.rainLogHeader}>
              <Text style={styles.rainLogHead}>Date</Text>
              <Text style={styles.rainLogHead}>Rain / Block</Text>
              <Text style={styles.rainLogHead}>Cumulative</Text>
            </View>
            <ScrollView>
              {pageRows.length ? (
                pageRows.map((row, index) => (
                  <View
                    key={`rain-log-${row.rain_id || "row"}-${String(row.recorded_date || row.date_time).slice(0, 10)}-${index}`}
                    style={styles.rainLogRow}
                  >
                    <View style={styles.rainLogCell}>
                      <Text style={styles.rainLogDate}>
                        {String(row.recorded_date || row.date_time).slice(
                          0,
                          10,
                        )}
                      </Text>
                      <View style={styles.rainLogActions}>
                        <TouchableOpacity onPress={() => editRainfall(row)}>
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteRainfall(row)}>
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.rainLogCell}>
                      <Text style={styles.rainLogValue}>
                        {rainfallNumber(
                          rainfallFromMm(
                            Number(row.rain_value) || 0,
                            activeDisplayUnit,
                          ),
                        )}{" "}
                        {activeDisplayUnit}
                      </Text>
                      <Text numberOfLines={2} style={styles.rainLogBlock}>
                        {row.block_name || "—"}
                      </Text>
                    </View>
                    <View style={styles.rainLogCell}>
                      <Text style={styles.rainLogCumulative}>
                        {rainfallNumber(
                          rainfallFromMm(row.running_mm, activeDisplayUnit),
                        )}{" "}
                        {activeDisplayUnit}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>{copy.empty}</Text>
              )}
            </ScrollView>
            <Pagination
              page={page}
              pageCount={pageCount}
              setPage={setPage}
              t={t}
            />
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setLogsOpen(false)}
            >
              <Text style={styles.secondaryText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function WorkAssignmentScreen({
  user,
  propertyId,
  data,
  request,
  reload,
  language,
  t,
}) {
  const copy = WORK_TEXT[language] || WORK_TEXT.en;
  const [workMode, setWorkMode] = useState("quick");
  const [workDate, setWorkDate] = useState(isoDate());
  const [datePicker, setDatePicker] = useState(false);
  const [selectedLabor, setSelectedLabor] = useState(null);
  const [activityId, setActivityId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fromDate, setFromDate] = useState(monthStartDate());
  const [toDate, setToDate] = useState(monthEndDate());
  const [blockFilter, setBlockFilter] = useState("");
  const [laborFilter, setLaborFilter] = useState("");
  const [summaryActivity, setSummaryActivity] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedLaborIds, setSelectedLaborIds] = useState([]);
  const [dailyGroup, setDailyGroup] = useState(null);
  const activities = data.workActivities || [];
  const blocks = (data.blocks || []).filter(
    (row) =>
      row.property_id == null || String(row.property_id) === String(propertyId),
  );
  const allLabors = data.labors || [];
  const assignments = data.workAssignments || [];
  const attendance = (data.attendance || []).filter(
    (row) =>
      String(row.entry_date || "").slice(0, 10) === workDate &&
      Number(row.attendance_value) > 0,
  );
  const attendedLabors = [
    ...new Map(
      attendance.map((row) => {
        const labor = allLabors.find(
          (item) => String(item.labor_id) === String(row.labor_id),
        );
        return [
          String(row.labor_id),
          labor || {
            labor_id: row.labor_id,
            name: row.labor_name || `#${row.labor_id}`,
          },
        ];
      }),
    ).values(),
  ];
  const dayAssignments = assignments.filter(
    (row) => String(row.work_date || "").slice(0, 10) === workDate,
  );
  const activityName = (id) =>
    activities.find((row) => String(row.work_activity_id) === String(id))
      ?.work_activity_name || `#${id}`;
  const blockName = (id) =>
    id
      ? blocks.find((row) => String(row.block_id) === String(id))?.block_name ||
        `#${id}`
      : "—";
  const laborName = (id) =>
    allLabors.find((row) => String(row.labor_id) === String(id))?.name ||
    attendance.find((row) => String(row.labor_id) === String(id))?.labor_name ||
    `#${id}`;
  const modalData = { ...data, workBlocks: blocks, workLabors: allLabors };
  useEffect(() => {
    setDrafts([]);
    if (pendingEdit) {
      const labor = allLabors.find(
        (item) => String(item.labor_id) === String(pendingEdit.labor_id),
      ) || {
        labor_id: pendingEdit.labor_id,
        name: laborName(pendingEdit.labor_id),
      };
      setSelectedLabor(labor);
      setActivityId(String(pendingEdit.work_activity_id));
      setBlockId(pendingEdit.block_id ? String(pendingEdit.block_id) : "");
      setNotes(pendingEdit.notes || "");
      setEditingAssignment(pendingEdit);
      setPendingEdit(null);
    } else {
      setSelectedLabor(null);
      setEditingAssignment(null);
    }
  }, [workDate, propertyId]);
  useEffect(() => setPage(1), [fromDate, toDate, blockFilter, laborFilter]);
  function clearEditor() {
    setActivityId("");
    setBlockId("");
    setNotes("");
    setEditingAssignment(null);
  }
  function openLabor(labor) {
    setSelectedLabor(labor);
    clearEditor();
  }
  function toggleQuickLabor(id) {
    setSelectedLaborIds((current) =>
      current.includes(String(id))
        ? current.filter((item) => item !== String(id))
        : [...current, String(id)],
    );
  }
  function addQuickAssignments() {
    if (!activityId)
      return Alert.alert(
        copy.activity,
        `${t("selectPrefix")} ${copy.activity}`,
      );
    if (!selectedLaborIds.length)
      return Alert.alert(copy.attended, copy.noAttendance);
    const additions = [];
    selectedLaborIds.forEach((laborId) => {
      const duplicate = [...drafts, ...dayAssignments].some(
        (row) =>
          String(row.labor_id) === laborId &&
          String(row.work_activity_id) === String(activityId) &&
          String(row.block_id || "") === String(blockId || ""),
      );
      if (!duplicate)
        additions.push({
          temp_id: `${Date.now()}-${laborId}-${Math.random()}`,
          property_id: Number(propertyId),
          work_date: workDate,
          work_activity_id: Number(activityId),
          labor_id: Number(laborId),
          block_id: blockId ? Number(blockId) : null,
          notes,
        });
    });
    if (!additions.length)
      return Alert.alert(
        copy.activity,
        "These labourers already have this work for the selected block and date.",
      );
    setDrafts((current) => [...current, ...additions]);
    setSelectedLaborIds([]);
    setActivityId("");
    setBlockId("");
    setNotes("");
  }
  async function addOrUpdate() {
    if (!activityId)
      return Alert.alert(
        copy.activity,
        `${t("selectPrefix")} ${copy.activity}`,
      );
    if (editingAssignment) {
      setSaving(true);
      try {
        await request(
          `/api/workAssignments/${editingAssignment.work_assignment_id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              property_id: Number(propertyId),
              work_date: workDate,
              work_activity_id: Number(activityId),
              labor_id: Number(selectedLabor.labor_id),
              block_id: blockId ? Number(blockId) : null,
              notes,
              modified_by: user.username,
            }),
          },
        );
        await reload();
        clearEditor();
      } catch (error) {
        Alert.alert("Could not update assignment", friendlyError(error));
      } finally {
        setSaving(false);
      }
      return;
    }
    const duplicate = [...drafts, ...dayAssignments].some(
      (row) =>
        String(row.labor_id) === String(selectedLabor.labor_id) &&
        String(row.work_activity_id) === String(activityId) &&
        String(row.block_id || "") === String(blockId || ""),
    );
    if (duplicate)
      return Alert.alert(
        copy.activity,
        "This work is already assigned to the labourer for the selected date and block.",
      );
    setDrafts((current) => [
      ...current,
      {
        temp_id: `${Date.now()}-${Math.random()}`,
        property_id: Number(propertyId),
        work_date: workDate,
        work_activity_id: Number(activityId),
        labor_id: Number(selectedLabor.labor_id),
        block_id: blockId ? Number(blockId) : null,
        notes,
      },
    ]);
    clearEditor();
  }
  async function saveAll() {
    if (!drafts.length) return;
    setSaving(true);
    const saved = [];
    try {
      for (const draft of drafts) {
        await request("/api/workAssignments", {
          method: "POST",
          body: JSON.stringify({
            ...draft,
            temp_id: undefined,
            created_by: user.username,
          }),
        });
        saved.push(draft.temp_id);
      }
      setDrafts([]);
      await reload();
      Alert.alert(t("save"), `${copy.saveAll} (${saved.length})`);
    } catch (error) {
      setDrafts((current) =>
        current.filter((row) => !saved.includes(row.temp_id)),
      );
      await reload();
      Alert.alert("Could not save all assignments", friendlyError(error));
    } finally {
      setSaving(false);
    }
  }
  function beginEdit(row) {
    const date = String(row.work_date).slice(0, 10);
    setSummaryActivity(null);
    if (date !== workDate) {
      setPendingEdit(row);
      setWorkDate(date);
      return;
    }
    const labor = allLabors.find(
      (item) => String(item.labor_id) === String(row.labor_id),
    ) || { labor_id: row.labor_id, name: laborName(row.labor_id) };
    setSelectedLabor(labor);
    setActivityId(String(row.work_activity_id));
    setBlockId(row.block_id ? String(row.block_id) : "");
    setNotes(row.notes || "");
    setEditingAssignment(row);
  }
  function removeAssignment(row) {
    Alert.alert(t("delete"), activityName(row.work_activity_id), [
      { text: t("cancelEdit"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await request(`/api/workAssignments/${row.work_assignment_id}`, {
              method: "DELETE",
            });
            setSummaryActivity(null);
            setDailyGroup(null);
            await reload();
          } catch (error) {
            Alert.alert("Could not delete assignment", friendlyError(error));
          }
        },
      },
    ]);
  }
  const ranged = assignments.filter((row) => {
    const date = String(row.work_date || "").slice(0, 10);
    return (
      date >= fromDate &&
      date <= toDate &&
      (!blockFilter || String(row.block_id || "") === blockFilter) &&
      (!laborFilter || String(row.labor_id) === laborFilter)
    );
  });
  const summaries = [
    ...new Set(ranged.map((row) => String(row.work_activity_id))),
  ]
    .map((id) => {
      const rows = ranged.filter((row) => String(row.work_activity_id) === id);
      return {
        id,
        name: activityName(id),
        count: new Set(rows.map((row) => String(row.labor_id))).size,
        rows,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const pageSize = 10,
    pageCount = Math.max(1, Math.ceil(summaries.length / pageSize)),
    pageRows = summaries.slice((page - 1) * pageSize, page * pageSize);
  const savedForLabor = selectedLabor
    ? dayAssignments.filter(
        (row) => String(row.labor_id) === String(selectedLabor.labor_id),
      )
    : [];
  const draftsForLabor = selectedLabor
    ? drafts.filter(
        (row) => String(row.labor_id) === String(selectedLabor.labor_id),
      )
    : [];
  const activityField = [
    "work_activity_id",
    "select",
    copy.activity,
    "workActivities",
    "work_activity_id",
    "work_activity_name",
  ];
  const blockField = [
    "block_id",
    "select",
    copy.block,
    "workBlocks",
    "block_id",
    "block_name",
    true,
  ];
  const filterBlockField = [
    "block_filter",
    "select",
    copy.filterBlock,
    "workBlocks",
    "block_id",
    "block_name",
    true,
  ];
  const filterLaborField = [
    "labor_filter",
    "select",
    copy.filterLabour,
    "workLabors",
    "labor_id",
    "name",
    true,
  ];
  const combinedDay = [...dayAssignments, ...drafts];
  const dayGroups = [
    ...new Set(
      combinedDay.map((row) => `${row.work_activity_id}:${row.block_id || ""}`),
    ),
  ].map((key) => {
    const rows = combinedDay.filter(
      (row) => `${row.work_activity_id}:${row.block_id || ""}` === key,
    );
    return {
      key,
      rows,
      name: activityName(rows[0]?.work_activity_id),
      block: blockName(rows[0]?.block_id),
      laborCount: new Set(rows.map((row) => String(row.labor_id))).size,
    };
  });
  const assignedToday = new Set(combinedDay.map((row) => String(row.labor_id)))
    .size;
  return (
    <View>
      <View style={styles.workTitleRow}>
        <Text style={styles.screenTitle}>{copy.title}</Text>
        <TouchableOpacity
          style={styles.attendanceDate}
          onPress={() => setDatePicker(true)}
        >
          <Text style={styles.attendanceDateText}>📅 {workDate}</Text>
        </TouchableOpacity>
      </View>
      {datePicker && (
        <DateTimePicker
          locale={localeFor(language)}
          value={new Date(`${workDate}T12:00:00`)}
          mode="date"
          maximumDate={new Date()}
          onChange={(event, date) => {
            setDatePicker(Platform.OS === "ios");
            if (event.type !== "dismissed" && date) setWorkDate(isoDate(date));
          }}
        />
      )}
      <View style={styles.workModes}>
        {[
          ["quick", "1 · Quick Assign"],
          ["labor", "2 · Labour First"],
          ["board", "3 · Daily Board"],
        ].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.workMode, workMode === key && styles.workModeActive]}
            onPress={() => setWorkMode(key)}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.workModeText,
                workMode === key && styles.workModeTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {workMode === "quick" && (
        <Section
          title={copy.addWork}
          right={`${selectedLaborIds.length}/${attendedLabors.length}`}
        >
          <Text style={styles.label}>{copy.activity}</Text>
          <View style={styles.quickActivities}>
            {activities.map((activity, index) => (
              <TouchableOpacity
                key={`quick-activity-${activity.work_activity_id}`}
                style={[
                  styles.quickActivity,
                  activityId === String(activity.work_activity_id) &&
                    styles.quickActivityActive,
                ]}
                onPress={() => setActivityId(String(activity.work_activity_id))}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.quickActivityText,
                    activityId === String(activity.work_activity_id) &&
                      styles.quickActivityTextActive,
                  ]}
                >
                  {["☕", "🌱", "🌿", "💧", "🪣", "🧑‍🌾"][index % 6]}{" "}
                  {activity.work_activity_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <SmartField
            field={blockField}
            value={blockId}
            setValue={setBlockId}
            meta={{}}
            data={modalData}
            t={t}
          />
          <FieldText
            label={`${copy.notes} (${t("optional")})`}
            value={notes}
            onChangeText={setNotes}
            placeholder={copy.notes}
          />
          <View style={styles.quickSelectHead}>
            <Text style={styles.label}>{copy.attended}</Text>
            <TouchableOpacity
              onPress={() =>
                setSelectedLaborIds(
                  selectedLaborIds.length === attendedLabors.length
                    ? []
                    : attendedLabors.map((row) => String(row.labor_id)),
                )
              }
            >
              <Text style={styles.dateReset}>
                {selectedLaborIds.length === attendedLabors.length
                  ? t("reset")
                  : "Select all"}
              </Text>
            </TouchableOpacity>
          </View>
          {!attendedLabors.length ? (
            <Text style={styles.muted}>{copy.noAttendance}</Text>
          ) : (
            attendedLabors.map((labor) => {
              const id = String(labor.labor_id),
                selected = selectedLaborIds.includes(id),
                attendanceRow = attendance.find(
                  (row) => String(row.labor_id) === id,
                );
              return (
                <TouchableOpacity
                  key={`quick-labor-${id}`}
                  style={[
                    styles.quickLaborRow,
                    selected && styles.quickLaborSelected,
                  ]}
                  onPress={() => toggleQuickLabor(id)}
                >
                  <View
                    style={[
                      styles.quickCheck,
                      selected && styles.quickCheckActive,
                    ]}
                  >
                    <Text style={styles.quickCheckText}>
                      {selected ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workLaborName}>
                      {labor.name || labor.labor_name}
                    </Text>
                    <Text style={styles.workLaborMeta}>
                      {Number(attendanceRow?.attendance_value) === 0.5
                        ? "½ Day"
                        : "Full Day"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <TouchableOpacity
            style={styles.primary}
            onPress={addQuickAssignments}
          >
            <Text style={styles.primaryText}>
              {copy.add} ({selectedLaborIds.length})
            </Text>
          </TouchableOpacity>
          {drafts.length > 0 && (
            <TouchableOpacity
              disabled={saving}
              style={[styles.saveWorkButton, saving && styles.pageDisabled]}
              onPress={saveAll}
            >
              <Text style={styles.primaryText}>
                {saving
                  ? t("connecting")
                  : `${copy.saveAll} (${drafts.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </Section>
      )}
      {workMode === "labor" && (
        <Section title={copy.attended} right={`${attendedLabors.length}`}>
          {!attendedLabors.length ? (
            <Text style={styles.muted}>{copy.noAttendance}</Text>
          ) : (
            attendedLabors.map((labor) => {
              const count = combinedDay.filter(
                (row) => String(row.labor_id) === String(labor.labor_id),
              ).length;
              return (
                <TouchableOpacity
                  key={`work-labor-${labor.labor_id}`}
                  style={styles.workLaborRow}
                  onPress={() => openLabor(labor)}
                >
                  <View>
                    <Text style={styles.workLaborName}>
                      {labor.name || labor.labor_name}
                    </Text>
                    <Text style={styles.workLaborMeta}>
                      {count} {copy.activity}
                    </Text>
                  </View>
                  <Text style={styles.summaryChevron}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
          {drafts.length > 0 && (
            <TouchableOpacity
              disabled={saving}
              style={[styles.primary, saving && styles.pageDisabled]}
              onPress={saveAll}
            >
              <Text style={styles.primaryText}>
                {saving
                  ? t("connecting")
                  : `${copy.saveAll} (${drafts.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </Section>
      )}
      {workMode === "board" && (
        <>
          <View style={styles.workStats}>
            <View style={styles.workStat}>
              <Text style={styles.workStatLabel}>Assigned</Text>
              <Text style={styles.workStatValue}>{assignedToday}</Text>
            </View>
            <View style={styles.workStat}>
              <Text style={styles.workStatLabel}>Unassigned</Text>
              <Text style={styles.workStatValue}>
                {Math.max(0, attendedLabors.length - assignedToday)}
              </Text>
            </View>
            <View style={styles.workStat}>
              <Text style={styles.workStatLabel}>Work groups</Text>
              <Text style={styles.workStatValue}>{dayGroups.length}</Text>
            </View>
          </View>
          {dayGroups.map((group) => (
            <TouchableOpacity
              key={`daily-${group.key}`}
              style={styles.dailyWorkCard}
              onPress={() => setDailyGroup(group)}
            >
              <View>
                <Text style={styles.dailyWorkTitle}>🌿 {group.name}</Text>
                <Text style={styles.dailyWorkBlock}>{group.block}</Text>
                <Text numberOfLines={2} style={styles.dailyWorkNames}>
                  {group.rows.map((row) => laborName(row.labor_id)).join(" · ")}
                </Text>
              </View>
              <Text style={styles.dailyWorkCount}>
                {group.laborCount} {copy.labourCount}
              </Text>
            </TouchableOpacity>
          ))}
          {!dayGroups.length && (
            <Text style={styles.muted}>{t("noRecords")}</Text>
          )}
          <Section title={copy.summary} right={`${summaries.length}`}>
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              resetFrom={monthStartDate()}
              resetTo={monthEndDate()}
              maximumDate={new Date(`${monthEndDate()}T12:00:00`)}
              t={t}
              language={language}
            />
            <View style={styles.workFilters}>
              <View style={styles.workFilter}>
                <SmartField
                  field={filterBlockField}
                  value={blockFilter}
                  setValue={setBlockFilter}
                  meta={{}}
                  data={modalData}
                  t={t}
                />
              </View>
              <View style={styles.workFilter}>
                <SmartField
                  field={filterLaborField}
                  value={laborFilter}
                  setValue={setLaborFilter}
                  meta={{}}
                  data={modalData}
                  t={t}
                />
              </View>
            </View>
            {pageRows.map((row) => (
              <TouchableOpacity
                key={`work-summary-${row.id}`}
                style={styles.summaryGridRow}
                onPress={() => setSummaryActivity(row)}
              >
                <Text style={[styles.summaryCell, styles.summaryName]}>
                  {row.name}
                </Text>
                <Text style={styles.summaryDays}>
                  {row.count} {copy.labourCount}
                </Text>
                <Text style={styles.summaryChevron}>›</Text>
              </TouchableOpacity>
            ))}
            {!pageRows.length && (
              <Text style={styles.muted}>{t("noRecords")}</Text>
            )}
            <Pagination
              page={page}
              pageCount={pageCount}
              setPage={setPage}
              t={t}
            />
          </Section>
        </>
      )}
      <Modal
        visible={Boolean(selectedLabor)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLabor(null)}
      >
        <View style={styles.modalBack}>
          <View style={styles.workModal}>
            <Text style={styles.modalTitle}>
              {selectedLabor?.name || selectedLabor?.labor_name}
            </Text>
            <Text style={styles.attendanceDetailRange}>{workDate}</Text>
            <ScrollView>
              <SmartField
                field={activityField}
                value={activityId}
                setValue={setActivityId}
                meta={{}}
                data={modalData}
                t={t}
              />
              <SmartField
                field={blockField}
                value={blockId}
                setValue={setBlockId}
                meta={{}}
                data={modalData}
                t={t}
              />
              <FieldText
                label={`${copy.notes} (${t("optional")})`}
                value={notes}
                onChangeText={setNotes}
                placeholder={copy.notes}
              />
              <TouchableOpacity
                disabled={saving}
                style={styles.primary}
                onPress={addOrUpdate}
              >
                <Text style={styles.primaryText}>
                  {editingAssignment ? t("update") : copy.add}
                </Text>
              </TouchableOpacity>
              {editingAssignment && (
                <TouchableOpacity
                  style={styles.secondary}
                  onPress={clearEditor}
                >
                  <Text style={styles.secondaryText}>{t("cancelEdit")}</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.workListTitle}>
                {copy.pending} ({draftsForLabor.length})
              </Text>
              {draftsForLabor.map((row) => (
                <View key={row.temp_id} style={styles.workAssignmentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workAssignmentActivity}>
                      {activityName(row.work_activity_id)}
                    </Text>
                    <Text style={styles.workAssignmentMeta}>
                      {blockName(row.block_id)}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setDrafts((current) =>
                        current.filter((item) => item.temp_id !== row.temp_id),
                      )
                    }
                  >
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.workListTitle}>
                {copy.saved} ({savedForLabor.length})
              </Text>
              {savedForLabor.map((row) => (
                <View
                  key={`saved-work-${row.work_assignment_id}`}
                  style={styles.workAssignmentRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workAssignmentActivity}>
                      {activityName(row.work_activity_id)}
                    </Text>
                    <Text style={styles.workAssignmentMeta}>
                      {blockName(row.block_id)}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </Text>
                  </View>
                  <View style={styles.rainLogActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setActivityId(String(row.work_activity_id));
                        setBlockId(row.block_id ? String(row.block_id) : "");
                        setNotes(row.notes || "");
                        setEditingAssignment(row);
                      }}
                    >
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeAssignment(row)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setSelectedLabor(null)}
            >
              <Text style={styles.secondaryText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(dailyGroup)}
        transparent
        animationType="slide"
        onRequestClose={() => setDailyGroup(null)}
      >
        <View style={styles.modalBack}>
          <View style={styles.workModal}>
            <Text style={styles.modalTitle}>{dailyGroup?.name}</Text>
            <Text style={styles.attendanceDetailRange}>
              {workDate} · {dailyGroup?.block}
            </Text>
            <ScrollView>
              {dailyGroup?.rows.map((row, index) => (
                <View
                  key={`daily-detail-${row.work_assignment_id || row.temp_id || index}`}
                  style={styles.workAssignmentRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workAssignmentActivity}>
                      {laborName(row.labor_id)}
                    </Text>
                    <Text style={styles.workAssignmentMeta}>
                      {row.notes || copy.notes}
                    </Text>
                  </View>
                  <View style={styles.rainLogActions}>
                    {row.temp_id ? (
                      <TouchableOpacity
                        onPress={() => {
                          setDrafts((current) =>
                            current.filter(
                              (item) => item.temp_id !== row.temp_id,
                            ),
                          );
                          setDailyGroup(null);
                        }}
                      >
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setDailyGroup(null);
                            beginEdit(row);
                          }}
                        >
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeAssignment(row)}>
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setDailyGroup(null)}
            >
              <Text style={styles.secondaryText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(summaryActivity)}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryActivity(null)}
      >
        <View style={styles.modalBack}>
          <View style={styles.workModal}>
            <Text style={styles.modalTitle}>{summaryActivity?.name}</Text>
            <Text style={styles.attendanceDetailRange}>
              {fromDate} → {toDate}
            </Text>
            <ScrollView>
              {summaryActivity?.rows.map((row, index) => (
                <View
                  key={`work-detail-${row.work_assignment_id || index}`}
                  style={styles.workAssignmentRow}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workAssignmentActivity}>
                      {laborName(row.labor_id)}
                    </Text>
                    <Text style={styles.workAssignmentMeta}>
                      {String(row.work_date).slice(0, 10)} ·{" "}
                      {blockName(row.block_id)}
                      {row.notes ? ` · ${row.notes}` : ""}
                    </Text>
                  </View>
                  <View style={styles.rainLogActions}>
                    <TouchableOpacity onPress={() => beginEdit(row)}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeAssignment(row)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setSummaryActivity(null)}
            >
              <Text style={styles.secondaryText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SmartField({ field, value, setValue, meta, data, t }) {
  const [open, setOpen] = useState(false);
  const [key, type, label, source, idKey, nameKey, optional] = field;
  if (type !== "select")
    return (
      <FieldText
        label={label}
        value={String(value ?? "")}
        onChangeText={setValue}
        keyboardType={type === "number" ? "numeric" : "default"}
        placeholder={type === "date" ? "YYYY-MM-DD" : label}
      />
    );
  const rawOpts =
    optionSets[source] ||
    (meta[source]?.length ? meta[source] : data[source]) ||
    [];
  const opts = rawOpts.filter(
    (option, index, list) =>
      list.findIndex(
        (candidate) => String(candidate?.[idKey]) === String(option?.[idKey]),
      ) === index,
  );
  const selected = opts.find((o) => String(o[idKey]) === String(value));
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>
        {label}
        {optional ? ` (${t("optional")})` : ""}
      </Text>
      <TouchableOpacity
        style={styles.inputButton}
        onPress={() => setOpen(true)}
      >
        <Text style={selected ? styles.inputText : styles.placeholder}>
          {selected
            ? optionLabel(selected, nameKey) || selected[idKey]
            : `${t("selectPrefix")} ${label}`}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView>
              {optional && (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setValue("");
                    setOpen(false);
                  }}
                >
                  <Text>{t("none")}</Text>
                </TouchableOpacity>
              )}
              {opts.map((o, index) => (
                <TouchableOpacity
                  key={`select-${source}-${String(o[idKey])}-${index}`}
                  style={styles.option}
                  onPress={() => {
                    setValue(String(o[idKey]));
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>
                    {optionLabel(o, nameKey) || o[idKey]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.secondary}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.secondaryText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DateRangeFilter({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  t,
  language,
  resetFrom = yesterdayDate(),
  resetTo = isoDate(),
  maximumDate,
}) {
  const [picker, setPicker] = useState(null);
  const todayValue = new Date(`${isoDate()}T12:00:00`);
  const apply = (type, date) => {
    const next = isoDate(date);
    if (type === "from") {
      const earliest = new Date(`${toDate}T12:00:00`);
      earliest.setFullYear(earliest.getFullYear() - 1);
      if (date > new Date(`${toDate}T12:00:00`))
        return Alert.alert(
          "Invalid date range",
          "From date cannot be after To date.",
        );
      if (date < earliest)
        return Alert.alert(
          "Range too large",
          "The maximum date range is one year.",
        );
      setFromDate(next);
    } else {
      const start = new Date(`${fromDate}T12:00:00`);
      if (date < start)
        return Alert.alert(
          "Invalid date range",
          "To date cannot be before From date.",
        );
      const latest = new Date(start);
      latest.setFullYear(latest.getFullYear() + 1);
      if (date > latest)
        return Alert.alert(
          "Range too large",
          "The maximum date range is one year.",
        );
      setToDate(next);
    }
  };
  return (
    <View style={styles.dateFilter}>
      <View style={styles.dateFilterHead}>
        <Text style={styles.dateFilterTitle}>{t("historyPeriod")}</Text>
        <TouchableOpacity
          onPress={() => {
            setFromDate(resetFrom);
            setToDate(resetTo);
          }}
        >
          <Text style={styles.dateReset}>{t("reset")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.dateButtons}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setPicker("from")}
        >
          <Text style={styles.dateButtonLabel}>{t("from")}</Text>
          <Text style={styles.dateButtonValue}>{fromDate}</Text>
        </TouchableOpacity>
        <Text style={styles.dateArrow}>→</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setPicker("to")}
        >
          <Text style={styles.dateButtonLabel}>{t("to")}</Text>
          <Text style={styles.dateButtonValue}>{toDate}</Text>
        </TouchableOpacity>
      </View>
      {!!picker && (
        <DateTimePicker
          locale={localeFor(language)}
          value={new Date(`${picker === "from" ? fromDate : toDate}T12:00:00`)}
          mode="date"
          maximumDate={
            picker === "to"
              ? maximumDate || todayValue
              : new Date(`${toDate}T12:00:00`)
          }
          minimumDate={
            picker === "to" ? new Date(`${fromDate}T12:00:00`) : undefined
          }
          onChange={(event, date) => {
            setPicker(Platform.OS === "ios" ? picker : null);
            if (event.type !== "dismissed" && date) apply(picker, date);
          }}
        />
      )}
    </View>
  );
}

function Pagination({ page, pageCount, setPage, t }) {
  if (pageCount <= 1) return null;
  return (
    <View style={styles.pagination}>
      <TouchableOpacity
        disabled={page === 1}
        style={[styles.pageButton, page === 1 && styles.pageDisabled]}
        onPress={() => setPage(page - 1)}
      >
        <Text style={styles.pageButtonText}>{t("previous")}</Text>
      </TouchableOpacity>
      <Text style={styles.pageStatus}>
        {t("page")} {page} {t("of")} {pageCount}
      </Text>
      <TouchableOpacity
        disabled={page === pageCount}
        style={[styles.pageButton, page === pageCount && styles.pageDisabled]}
        onPress={() => setPage(page + 1)}
      >
        <Text style={styles.pageButtonText}>{t("next")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const referenceFields = {
  labor_id: ["labors", "labor_id", "name", "Labour"],
  block_id: ["blocks", "block_id", "block_name", "Block"],
  property_id: ["properties", "property_id", "property_name", "Property"],
  work_activity_id: [
    "workActivities",
    "work_activity_id",
    "work_activity_name",
    "Activity",
  ],
  plant_id: ["plants", "plant_id", "plant_type", "Plant"],
  vendor_id: ["vendors", "vendor_id", "vendorname", "Vendor"],
  crop_id: ["crops", "crop_id", "crop_name", "Crop"],
  crop_type_id: ["cropTypes", "crop_type_id", "type_name", "Crop Type"],
  variety_master_id: [
    "varieties",
    "variety_master_id",
    "variety_name",
    "Variety",
  ],
  expensetype_id: [
    "expenseTypes",
    "expensetype_id",
    "expense_name",
    "Expense type",
  ],
  yieldtype_id: ["yieldTypes", "yieldtype_id", "yieldtype_name", "Yield type"],
  yieldrate_id: [
    "yieldRates",
    "yieldrate_id",
    "yield_rate_label",
    "Yield rate",
  ],
};

function recordDetails(row, data, meta, language = "en") {
  return Object.entries(row)
    .filter(
      ([key, value]) =>
        value != null &&
        value !== "" &&
        ![
          "created_by",
          "modified_by",
          "created_on",
          "modified_on",
          "user_id",
        ].includes(key),
    )
    .map(([key, value]) => {
      if (referenceFields[key]) {
        const [source, idKey, nameKey, label] = referenceFields[key];
        const match = (data[source] || meta[source] || []).find(
          (item) => String(item[idKey]) === String(value),
        );
        return [
          fieldName(language, key, label),
          optionLabel(match, nameKey) || `Unknown (${value})`,
        ];
      }
      if (key.endsWith("_id")) return null;
      const label = fieldName(
        language,
        key,
        key
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      );
      return [label, value];
    })
    .filter(Boolean)
    .slice(0, 6);
}

function FieldText({ label, value, onChangeText, ...props }) {
  const [dateOpen, setDateOpen] = useState(false);
  if (label === "Planting Date")
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.inputButton}
          onPress={() => setDateOpen(true)}
        >
          <Text style={styles.inputText}>📅 {value || isoDate()}</Text>
        </TouchableOpacity>
        {dateOpen && (
          <DateTimePicker
            value={new Date(`${value || isoDate()}T12:00:00`)}
            mode="date"
            maximumDate={new Date()}
            onChange={(event, date) => {
              setDateOpen(Platform.OS === "ios");
              if (event.type !== "dismissed" && date)
                onChangeText(isoDate(date));
            }}
          />
        )}
      </View>
    );
  if (
    label === "Status" &&
    ["active", "inactive"].includes(String(value).toLowerCase())
  )
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.inventoryCheckRow}
          onPress={() =>
            onChangeText(
              String(value).toLowerCase() === "active" ? "inactive" : "active",
            )
          }
        >
          <View
            style={[
              styles.quickCheck,
              String(value).toLowerCase() === "active" &&
                styles.quickCheckActive,
            ]}
          >
            <Text style={styles.quickCheckText}>
              {String(value).toLowerCase() === "active" ? "✓" : ""}
            </Text>
          </View>
          <Text style={styles.inventoryCheckText}>Active</Text>
        </TouchableOpacity>
      </View>
    );
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        placeholderTextColor="#9c9a91"
        {...props}
      />
    </View>
  );
}
function Section({ title, right, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {right !== undefined && right !== null && right !== "" && (
          <Text style={styles.sectionRight}>{String(right)}</Text>
        )}
      </View>
      {children}
    </View>
  );
}
function Suggestion({ text, danger, warning }) {
  return (
    <View style={styles.suggestion}>
      <Text>{danger ? "🔴" : warning ? "🟠" : "🟢"}</Text>
      <Text style={styles.suggestionText}>{text}</Text>
    </View>
  );
}
function IconGrid({ items, openModule, onMore }) {
  return (
    <View style={styles.iconGrid}>
      {items.map(([t, ic, key], index) => (
        <TouchableOpacity
          key={`${key}-${t}-${index}`}
          style={styles.iconTile}
          onPress={() => (key === "favorites" ? onMore?.() : openModule(key))}
        >
          <Text style={styles.icon}>{ic}</Text>
          <Text style={styles.iconLabel}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
function RecordList({
  rows = [],
  empty = "No records in this period.",
  moduleKey,
  data = {},
  meta = {},
  onEdit,
  onDelete,
  language = "en",
}) {
  if (!rows?.length) return <Text style={styles.muted}>{empty}</Text>;
  return (
    <View>
      {rows.map((r, i) => {
        const details = recordDetails(r, data, meta, language);
        const preferredTitle =
          r.labor_name ||
          r.work_activity_name ||
          r.block_name ||
          r.property_name ||
          r.name ||
          details[0]?.[1] ||
          itemTitle(r);
        return (
          <View key={`${rowId(r) || "row"}-${i}`} style={styles.record}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recordTitle}>{preferredTitle}</Text>
              {details.map(([label, value], detailIndex) => (
                <View
                  key={`detail-${label}-${detailIndex}`}
                  style={styles.recordDetail}
                >
                  <Text style={styles.recordLabel}>{label}</Text>
                  <Text style={styles.recordValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.recordActions}>
              {onEdit && (
                <TouchableOpacity
                  accessibilityLabel="Edit record"
                  onPress={() => onEdit(r)}
                >
                  <Text style={styles.edit}>✏️</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  accessibilityLabel="Delete record"
                  onPress={() => onDelete(r)}
                >
                  <Text style={styles.delete}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
function BottomNav({ screen, setScreen, t }) {
  const nav = [
    ["home", t("home"), "home"],
    ["add", t("add"), "add"],
    ["modules", t("modules"), "blocks"],
    ["reports", t("reports"), "reports"],
    ["more", t("more"), "more"],
  ];
  return (
    <View style={styles.bottom}>
      {nav.map((n) => (
        <TouchableOpacity
          key={n[0]}
          style={styles.navItem}
          onPress={() => setScreen(n[0])}
        >
          <AppIcon
            name={n[2]}
            size={20}
            color={screen === n[0] ? themeColors.secondary : "#777"}
          />
          <Text
            numberOfLines={1}
            style={[styles.navText, screen === n[0] && styles.navActive]}
          >
            {n[1]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SOFT,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  },
  content: { flex: 1 },
  body: { padding: 12, paddingBottom: Platform.OS === "android" ? 132 : 108 },
  header: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 9,
    backgroundColor: "#fbf5eb",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#ead9c4",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 30,
    lineHeight: 31,
    color: GREEN,
    fontWeight: "700",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  headerMeta: { width: 132, alignItems: "flex-end" },
  smallCaps: { fontWeight: "900", fontSize: 15, color: DARK },
  headerTitle: { fontSize: 12, color: "#644b38", marginTop: 3 },
  date: { fontSize: 11, color: "#6d5847" },
  location: {
    fontSize: 11,
    color: DARK,
    fontWeight: "700",
    marginTop: 3,
    maxWidth: 132,
  },
  user: { fontSize: 10, color: "#777", marginTop: 2, maxWidth: 124 },
  languageCompact: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 6,
  },
  loginLanguage: {
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  languageText: { fontSize: 10, color: DARK, fontWeight: "900" },
  languageActive: { backgroundColor: "#f1dfc9" },
  propertySelectorWrap: {
    backgroundColor: "#fbf5eb",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  propertySelector: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderWidth: 1.5,
    borderColor: "#c9ad8d",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
    elevation: 2,
    shadowColor: "#4a2b18",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  propertyBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ead9c4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  propertyBadgeText: { color: GREEN, fontWeight: "900", fontSize: 18 },
  propertySelectedCopy: { flex: 1, minWidth: 0 },
  propertyEyebrow: {
    fontSize: 9,
    color: "#846b57",
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  propertySelectedName: {
    fontSize: 15,
    color: DARK,
    fontWeight: "900",
    marginTop: 1,
  },
  propertySelectedAddress: { fontSize: 10, color: "#776252", marginTop: 1 },
  propertyChange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0dfca",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    marginLeft: 8,
  },
  propertyChangeText: { fontSize: 11, color: GREEN, fontWeight: "900" },
  propertyChevron: {
    fontSize: 17,
    color: GREEN,
    fontWeight: "900",
    marginLeft: 4,
    marginTop: -3,
  },
  propertyModal: {
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "82%",
  },
  propertyModalHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  propertyCount: {
    fontSize: 11,
    color: "#727b74",
    marginTop: -5,
    marginBottom: 12,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#eef0eb",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { fontSize: 25, color: DARK, lineHeight: 27 },
  propertySearch: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#c5cec6",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#17291d",
    fontSize: 14,
    marginBottom: 10,
  },
  propertyList: { paddingBottom: 24 },
  propertyOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ece9e0",
    borderRadius: 12,
  },
  propertyOptionActive: {
    backgroundColor: "#edf7ee",
    borderBottomColor: "#d5ead8",
  },
  propertyOptionMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f0f0ec",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  propertyOptionMarkActive: { backgroundColor: GREEN },
  propertyOptionMarkText: { fontWeight: "900", color: "#59645c" },
  propertyOptionMarkTextActive: { color: "#fff" },
  propertyOptionName: { fontSize: 14, fontWeight: "900", color: DARK },
  propertyOptionMeta: { fontSize: 10, color: "#6e786f", marginTop: 3 },
  propertyEmpty: { textAlign: "center", color: "#737b75", paddingVertical: 30 },
  loginPage: {
    flex: 1,
    backgroundColor: "#f3efe4",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  },
  loginKeyboard: { flex: 1 },
  loginScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 36,
  },
  logoImage: {
    alignSelf: "center",
    width: 92,
    height: 92,
    borderRadius: 22,
    marginBottom: 10,
  },
  loginTitle: {
    fontSize: 31,
    fontWeight: "900",
    color: GREEN,
    textAlign: "center",
  },
  loginSub: {
    backgroundColor: GREEN,
    color: "#fff",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 7,
    marginBottom: 16,
    fontWeight: "800",
  },
  loginCard: {
    backgroundColor: "#fffdf8",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: LINE,
  },
  note: { fontSize: 12, color: "#675", marginBottom: 10 },
  error: { color: "#b00020", fontWeight: "700", marginVertical: 8 },
  card: {
    backgroundColor: "#fffdf8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LINE,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: DARK },
  sectionRight: { fontSize: 11, color: "#777" },
  managementGreeting: { marginBottom: 10 },
  managementHello: { fontSize: 11, color: "#725f50", fontWeight: "700" },
  managementEstate: {
    fontSize: 22,
    color: DARK,
    fontWeight: "900",
    marginTop: 2,
  },
  managementSection: {
    fontSize: 14,
    color: DARK,
    fontWeight: "900",
    marginTop: 5,
    marginBottom: 8,
  },
  managementGrid: { flexDirection: "row", gap: 7, marginBottom: 12 },
  managementKpi: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  managementValue: {
    fontSize: 14,
    color: DARK,
    fontWeight: "900",
    marginTop: 7,
  },
  managementLabel: {
    fontSize: 8,
    color: "#725f50",
    fontWeight: "700",
    marginTop: 3,
  },
  managementActions: { flexDirection: "row", gap: 7, marginBottom: 12 },
  managementAction: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 11,
  },
  managementActionText: {
    fontSize: 8.5,
    color: DARK,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
  },
  managementOverview: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    marginBottom: 12,
  },
  managementOverviewItem: {
    width: "50%",
    minHeight: 65,
    padding: 11,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#eee1d1",
  },
  managementOverviewLabel: { fontSize: 9, color: "#725f50" },
  managementOverviewValue: {
    fontSize: 13,
    color: DARK,
    fontWeight: "900",
    marginTop: 6,
  },
  gpsBanner: {
    backgroundColor: "#fff2d8",
    borderWidth: 1,
    borderColor: "#d9ad67",
    borderRadius: 14,
    padding: 11,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gpsText: { flex: 1, color: "#66431e", fontSize: 11, fontWeight: "700" },
  gpsButton: {
    backgroundColor: GREEN,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  gpsButtonText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  weatherHero: {
    minHeight: 220,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#3d2416",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  weatherGlow: {
    position: "absolute",
    right: -55,
    top: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    opacity: 0.72,
  },
  weatherCopy: { zIndex: 2, maxWidth: "67%" },
  weatherPlace: {
    color: "rgba(255,255,255,.78)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  weatherCondition: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },
  weatherTemperature: {
    color: "#fff",
    fontSize: 46,
    fontWeight: "900",
    lineHeight: 54,
  },
  weatherFeels: {
    color: "rgba(255,255,255,.9)",
    fontSize: 11,
    fontWeight: "600",
  },
  weatherArt: { position: "absolute", right: 18, top: 28, zIndex: 2 },
  weatherIconImage: { width: 96, height: 96 },
  weatherEmoji: { fontSize: 70 },
  rainLayer: {
    position: "absolute",
    right: 8,
    top: 78,
    width: 145,
    height: 74,
    overflow: "hidden",
  },
  rainDrop: {
    position: "absolute",
    top: 0,
    width: 2,
    height: 16,
    borderRadius: 2,
    backgroundColor: "rgba(190,235,255,.75)",
    transform: [{ rotate: "14deg" }],
  },
  weatherMetrics: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 15,
    zIndex: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,.16)",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  metricLabel: {
    color: "rgba(255,255,255,.72)",
    fontSize: 9,
    textTransform: "uppercase",
  },
  metricValue: { color: "#fff", fontSize: 13, fontWeight: "900", marginTop: 2 },
  weatherRefresh: { fontSize: 11, fontWeight: "900", paddingVertical: 5 },
  weather: {
    width: 168,
    backgroundColor: "#c88315",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  weatherRain: { backgroundColor: "#126247" },
  weatherTop: { color: "#fff", fontWeight: "900" },
  temp: { color: "#fff", fontWeight: "900", fontSize: 28, marginVertical: 10 },
  weatherSub: { color: "#fff", fontSize: 12 },
  weatherFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  weatherMoney: { color: "#fff", fontWeight: "800", fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  stat: {
    width: "47.8%",
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 14,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: "900", color: GREEN, marginTop: 6 },
  statLabel: { fontSize: 12, color: "#5d675f", fontWeight: "700" },
  reportCard: {
    width: "47.8%",
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 16,
    padding: 14,
  },
  reportValue: {
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
    marginVertical: 4,
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconTile: {
    width: "30.6%",
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    backgroundColor: "#fff",
  },
  icon: { fontSize: 23 },
  iconLabel: {
    fontSize: 11,
    textAlign: "center",
    color: DARK,
    fontWeight: "700",
    marginTop: 5,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
  },
  suggestionText: { fontSize: 13, color: "#37433b" },
  moduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee8da",
  },
  moduleName: { fontSize: 14, fontWeight: "800", color: DARK },
  chev: { fontSize: 28, color: GREEN },
  favoriteModal: {
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "88%",
  },
  favoriteHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  favoriteHint: {
    fontSize: 11,
    color: "#6f786f",
    marginTop: -5,
    marginBottom: 10,
  },
  favoriteList: { paddingBottom: 10 },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderWidth: 1,
    borderColor: "#ebe7dc",
    borderRadius: 13,
    marginBottom: 7,
    backgroundColor: "#fff",
  },
  favoriteRowActive: { backgroundColor: "#edf7ee", borderColor: "#b8d9bd" },
  favoriteIcon: { fontSize: 20, width: 34 },
  favoriteName: { flex: 1, fontSize: 13, fontWeight: "800", color: DARK },
  favoriteCheck: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#ecece7",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteCheckActive: { backgroundColor: GREEN },
  favoriteCheckText: { fontSize: 16, color: "#fff", fontWeight: "900" },
  label: { fontSize: 12, fontWeight: "800", color: DARK, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#222",
  },
  inputButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  inputText: { color: "#222" },
  placeholder: { color: "#9c9a91" },
  primary: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryText: { color: "#fff", fontWeight: "900" },
  secondary: {
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryText: { color: GREEN, fontWeight: "900" },
  editingBanner: {
    backgroundColor: "#e7f3e8",
    color: GREEN,
    fontWeight: "900",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  inlineWarning: {
    backgroundColor: "#fff2d8",
    color: "#765010",
    fontWeight: "700",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateFilter: {
    backgroundColor: "#f4f7f2",
    borderRadius: 13,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#dce5da",
  },
  dateFilterHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateFilterTitle: { fontSize: 11, fontWeight: "900", color: DARK },
  dateReset: { fontSize: 11, fontWeight: "900", color: GREEN },
  dateButtons: { flexDirection: "row", alignItems: "center" },
  dateButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd4ca",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dateButtonLabel: { fontSize: 8, fontWeight: "900", color: "#758078" },
  dateButtonValue: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK,
    marginTop: 2,
  },
  dateArrow: { paddingHorizontal: 8, color: GREEN, fontWeight: "900" },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  pageButton: {
    backgroundColor: "#e7f3e8",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  pageDisabled: { opacity: 0.35 },
  pageButtonText: { fontSize: 11, color: GREEN, fontWeight: "900" },
  pageStatus: { fontSize: 11, color: "#687268", fontWeight: "700" },
  attendanceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  attendanceDate: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  attendanceDateText: { fontSize: 11, fontWeight: "800", color: DARK },
  attendancePresent: {
    backgroundColor: "#fff2d8",
    borderWidth: 1,
    borderColor: "#d9ad67",
    borderRadius: 10,
    padding: 10,
    marginBottom: 9,
  },
  attendancePresentText: { fontSize: 11, fontWeight: "800", color: "#684618" },
  attendanceGridHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4eadc",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
  },
  attendanceGridRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eadfce",
  },
  attendanceLocked: { opacity: 0.72 },
  attendanceNameCell: { width: "40%" },
  attendanceHeadText: {
    fontSize: 11,
    fontWeight: "900",
    color: DARK,
    paddingHorizontal: 8,
  },
  attendanceChoiceHead: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
    color: DARK,
    paddingHorizontal: 2,
  },
  attendanceLabour: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK,
    paddingHorizontal: 8,
    alignSelf: "center",
  },
  attendanceChoiceCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 52,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#9b8069",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: GREEN, borderWidth: 2 },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  attendanceActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  attendanceAction: { flex: 1 },
  clearAttendance: {
    borderWidth: 1.5,
    borderColor: "#b42318",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  clearAttendanceText: { color: "#b42318", fontWeight: "900" },
  savedGridHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4eadc",
    borderWidth: 1,
    borderColor: LINE,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  savedGridRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eadfce",
  },
  savedHead: {
    flex: 1,
    fontSize: 9,
    fontWeight: "900",
    color: DARK,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  savedName: { flex: 1.25, textAlign: "left" },
  savedEditHead: {
    width: 42,
    fontSize: 9,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },
  savedCell: {
    flex: 1,
    fontSize: 9.5,
    color: "#44372d",
    paddingHorizontal: 4,
    textAlign: "center",
  },
  savedEditButton: {
    width: 42,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  attendanceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  attendanceDate: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 12,
  },
  attendanceDateText: { fontSize: 11, fontWeight: "800", color: DARK },
  attendancePresent: {
    backgroundColor: "#fff2d8",
    borderWidth: 1,
    borderColor: "#d9ad67",
    borderRadius: 10,
    padding: 10,
    marginBottom: 9,
  },
  attendancePresentText: { fontSize: 11, fontWeight: "800", color: "#684618" },
  attendanceGridHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4eadc",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
  },
  attendanceGridRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eadfce",
  },
  attendanceLocked: { opacity: 0.72 },
  attendanceNameCell: { width: "40%" },
  attendanceHeadText: {
    fontSize: 11,
    fontWeight: "900",
    color: DARK,
    paddingHorizontal: 8,
  },
  attendanceChoiceHead: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "900",
    color: DARK,
    paddingHorizontal: 2,
  },
  attendanceLabour: {
    fontSize: 12,
    fontWeight: "800",
    color: DARK,
    paddingHorizontal: 8,
    alignSelf: "center",
  },
  attendanceChoiceCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 52,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#9b8069",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: GREEN, borderWidth: 2 },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  attendanceActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  attendanceAction: { flex: 1 },
  clearAttendance: {
    borderWidth: 1.5,
    borderColor: "#b42318",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  clearAttendanceText: { color: "#b42318", fontWeight: "900" },
  summaryGridHeader: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4eadc",
    borderWidth: 1,
    borderColor: LINE,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  summaryGridRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eadfce",
  },
  summaryHead: {
    flex: 1,
    fontSize: 10,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
    paddingHorizontal: 5,
  },
  summaryName: { flex: 1.7, textAlign: "left" },
  summaryViewHead: {
    width: 62,
    fontSize: 9,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },
  summaryCell: {
    fontSize: 11,
    color: DARK,
    fontWeight: "800",
    paddingHorizontal: 8,
  },
  summaryDays: {
    flex: 1,
    fontSize: 14,
    color: GREEN,
    fontWeight: "900",
    textAlign: "center",
  },
  summaryChevron: {
    width: 62,
    fontSize: 26,
    color: GREEN,
    fontWeight: "800",
    textAlign: "center",
  },
  attendanceDetailRange: {
    fontSize: 11,
    color: "#765f4c",
    fontWeight: "700",
    marginTop: -4,
    marginBottom: 10,
  },
  attendanceDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee4d6",
  },
  attendanceDetailDate: { fontSize: 13, color: DARK, fontWeight: "800" },
  attendanceDetailValue: { fontSize: 12, color: GREEN, fontWeight: "900" },
  rainAmountLabel: { marginTop: 12 },
  rainInputRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  rainAmountInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#222",
    fontSize: 16,
    fontWeight: "800",
  },
  rainUnitButtons: {
    flexDirection: "row",
    backgroundColor: "#f4eadc",
    borderRadius: 12,
    padding: 3,
  },
  rainUnitButton: {
    minWidth: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  rainUnitActive: { backgroundColor: GREEN },
  rainUnitText: { fontSize: 11, color: DARK, fontWeight: "900" },
  rainUnitTextActive: { color: "#fff" },
  rainStorageHint: {
    fontSize: 10,
    color: "#786451",
    fontWeight: "700",
    textAlign: "right",
    marginTop: 5,
    marginBottom: 5,
  },
  rainTotalCard: {
    alignItems: "center",
    backgroundColor: "#f4eadc",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  rainTotalValue: {
    fontSize: 38,
    lineHeight: 44,
    color: GREEN,
    fontWeight: "900",
  },
  rainTotalUnit: { fontSize: 14, color: DARK, fontWeight: "900" },
  rainTotalRange: {
    fontSize: 10,
    color: "#765f4c",
    fontWeight: "700",
    marginTop: 5,
  },
  rainDisplayUnits: { flexDirection: "row", gap: 8, marginTop: 10 },
  rainDisplayUnit: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  rainDisplayUnitActive: { backgroundColor: GREEN, borderColor: GREEN },
  rainDisplayText: { fontSize: 11, color: DARK, fontWeight: "900" },
  rainDisplayTextActive: { color: "#fff" },
  rainLogHeader: {
    flexDirection: "row",
    backgroundColor: "#f4eadc",
    borderWidth: 1,
    borderColor: LINE,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 9,
  },
  rainLogHead: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "900",
    color: DARK,
  },
  rainLogRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 64,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee4d6",
    backgroundColor: "#fff",
  },
  rainLogCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  rainLogDate: { fontSize: 10, color: DARK, fontWeight: "900" },
  rainLogBlock: {
    fontSize: 9,
    color: "#776453",
    marginTop: 3,
    textAlign: "center",
  },
  rainLogValue: { fontSize: 11, color: GREEN, fontWeight: "900" },
  rainLogCumulative: {
    fontSize: 11,
    color: DARK,
    fontWeight: "900",
    textAlign: "center",
  },
  rainLogActions: { flexDirection: "row", gap: 12, marginTop: 6 },
  workTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  workModes: { flexDirection: "row", gap: 6, marginBottom: 12 },
  workMode: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 10,
    alignItems: "center",
  },
  workModeActive: { backgroundColor: "#e8eefc", borderColor: "#8aaaf2" },
  workModeText: { fontSize: 9, color: DARK, fontWeight: "800" },
  workModeTextActive: { color: "#245dc7" },
  quickActivities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 12,
  },
  quickActivity: {
    width: "31.7%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  quickActivityActive: {
    backgroundColor: "#e8eefc",
    borderColor: "#3f7ee8",
    borderWidth: 1.5,
  },
  quickActivityText: {
    fontSize: 10,
    color: DARK,
    fontWeight: "800",
    textAlign: "center",
  },
  quickActivityTextActive: { color: "#245dc7" },
  quickSelectHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickLaborRow: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfce",
    borderRadius: 11,
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  quickLaborSelected: { backgroundColor: "#f0f5ff", borderColor: "#8aaaf2" },
  quickCheck: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#a89b8e",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCheckActive: { backgroundColor: "#3f7ee8", borderColor: "#3f7ee8" },
  quickCheckText: { color: "#fff", fontWeight: "900" },
  saveWorkButton: {
    backgroundColor: "#3277e5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 9,
  },
  workLaborRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfce",
    borderRadius: 11,
    paddingLeft: 12,
    paddingRight: 4,
    marginBottom: 7,
  },
  workLaborName: { fontSize: 13, fontWeight: "900", color: DARK },
  workLaborMeta: { fontSize: 10, color: "#776453", marginTop: 3 },
  workStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  workStat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fffdf8",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    padding: 11,
  },
  workStatLabel: { fontSize: 9, color: "#806b59" },
  workStatValue: { fontSize: 22, fontWeight: "900", color: DARK, marginTop: 5 },
  dailyWorkCard: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 13,
    padding: 12,
    marginBottom: 9,
  },
  dailyWorkTitle: { fontSize: 13, color: DARK, fontWeight: "900" },
  dailyWorkBlock: { fontSize: 10, color: "#776453", marginTop: 3 },
  dailyWorkNames: { fontSize: 10, color: DARK, marginTop: 10, maxWidth: 230 },
  dailyWorkCount: { fontSize: 11, color: DARK, fontWeight: "900" },
  workFilters: { flexDirection: "row", gap: 8 },
  workFilter: { flex: 1, minWidth: 0 },
  workModal: {
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: "90%",
  },
  workListTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: DARK,
    marginTop: 17,
    marginBottom: 5,
  },
  workAssignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfce",
    borderRadius: 11,
    padding: 10,
    marginBottom: 7,
  },
  workAssignmentActivity: { fontSize: 12, fontWeight: "900", color: DARK },
  workAssignmentMeta: { fontSize: 10, color: "#776453", marginTop: 3 },
  peopleTitleBar: {
    minHeight: 55,
    backgroundColor: "#075d3d",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  peopleBack: {
    fontSize: 36,
    lineHeight: 38,
    color: "#fff",
    fontWeight: "400",
  },
  peopleTitle: { fontSize: 18, color: "#fff", fontWeight: "900" },
  peopleEditText: { fontSize: 13, color: "#fff", fontWeight: "900" },
  peopleDirectoryHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  peopleSubtitle: { fontSize: 10, color: "#766454", marginTop: -7 },
  peopleAdd: {
    backgroundColor: "#087847",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  peopleStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  peopleStat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  peopleStatValue: { fontSize: 21, color: "#087847", fontWeight: "900" },
  peopleStatLabel: {
    fontSize: 9,
    color: "#75685c",
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  peopleSearch: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 12,
    color: DARK,
    marginBottom: 10,
  },
  peopleListCard: {
    minHeight: 75,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  peopleSmallAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#e7f3e8",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleSmallAvatarText: { fontSize: 16, color: "#087847", fontWeight: "900" },
  peopleListName: { fontSize: 13, color: DARK, fontWeight: "900" },
  peopleListMeta: { fontSize: 10, color: "#6f6258", marginTop: 4 },
  peoplePhotoRow: { flexDirection: "row", alignItems: "stretch", gap: 10 },
  peoplePhotoBox: {
    width: 105,
    minHeight: 105,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cfc4b7",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  peoplePhotoIcon: { fontSize: 25 },
  peoplePhotoText: {
    fontSize: 10,
    color: "#087847",
    fontWeight: "800",
    marginTop: 6,
  },
  peopleHint: {
    fontSize: 10,
    color: "#6f6258",
    backgroundColor: "#eef7eb",
    borderRadius: 9,
    padding: 10,
    marginBottom: 12,
  },
  peopleFormActions: { flexDirection: "row", gap: 9, marginBottom: 12 },
  peopleAction: { flex: 1, minWidth: 0 },
  peopleDelete: {
    borderWidth: 1.5,
    borderColor: "#b42318",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  peopleDeleteText: { color: "#b42318", fontWeight: "900" },
  peopleProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  peopleAvatar: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#e7f3e8",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleAvatarText: { fontSize: 25, color: "#087847", fontWeight: "900" },
  peopleProfileName: { fontSize: 19, color: DARK, fontWeight: "900" },
  peopleProfileMeta: { fontSize: 11, color: "#6f6258", marginTop: 6 },
  peopleInfoRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee5da",
  },
  peopleInfoLabel: { flex: 1, fontSize: 10, color: "#76695d" },
  peopleInfoValue: { flex: 1.6, fontSize: 11, color: DARK, fontWeight: "700" },
  vendorLabourRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#eee5da",
  },
  catalogTitle: {
    flex: 1,
    fontSize: 17,
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
  },
  catalogCard: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 13,
    padding: 11,
    marginBottom: 8,
  },
  catalogIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#eaf5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogCardIcon: { fontSize: 25 },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 14,
    paddingVertical: 6,
  },
  rememberText: { color: "#5f4632", fontSize: 12, fontWeight: "700" },
  exportButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#b98b5f",
    backgroundColor: "#fffaf3",
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  exportButtonText: { color: "#6a3e20", fontWeight: "900", fontSize: 10 },
  downloadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee1d1",
    paddingVertical: 10,
  },
  downloadTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  recordsToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#f5eadc",
    borderRadius: 12,
    padding: 13,
    marginBottom: 12,
  },
  recordsToggleText: { color: "#6a3e20", fontWeight: "900", fontSize: 11 },
  inventoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  inventoryGridCard: {
    width: "48.5%",
    minHeight: 168,
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 11,
  },
  inventoryGridHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inventoryGridCount: { color: "#8a5527", fontSize: 16, fontWeight: "900" },
  inventoryGridTitle: { color: DARK, fontSize: 13, fontWeight: "900" },
  inventoryGridMeta: { color: "#756253", fontSize: 9.5, marginTop: 5 },
  vendorChoiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  vendorChoice: {
    borderWidth: 1,
    borderColor: "#d8c3aa",
    backgroundColor: "#fffaf3",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  vendorChoiceActive: { backgroundColor: "#8a5527", borderColor: "#8a5527" },
  vendorChoiceText: { color: "#6a4b34", fontSize: 10, fontWeight: "800" },
  vendorChoiceTextActive: { color: "#fff" },
  catalogCardStats: {
    fontSize: 9.5,
    color: "#087847",
    fontWeight: "800",
    marginTop: 6,
  },
  catalogHero: {
    minHeight: 108,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#eef7eb",
    borderWidth: 1,
    borderColor: "#d3e7d2",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
  catalogHeroIcon: { fontSize: 45 },
  catalogStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  catalogStat: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  catalogStatValue: { fontSize: 20, color: "#087847", fontWeight: "900" },
  catalogStatLabel: {
    fontSize: 9,
    color: "#75685c",
    fontWeight: "700",
    marginTop: 3,
  },
  brownTitleBar: {
    minHeight: 55,
    backgroundColor: "#5b321c",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  brownPrimary: {
    backgroundColor: "#8a5527",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  brownAdd: {
    backgroundColor: "#8a5527",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  vendorDirectoryHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  vendorTwoCol: { flexDirection: "row", gap: 9 },
  vendorCol: { flex: 1, minWidth: 0 },
  vendorHelp: {
    fontSize: 10,
    color: "#72543d",
    backgroundColor: "#f5eadc",
    borderRadius: 9,
    padding: 9,
  },
  vendorStats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  vendorStat: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  vendorStatValue: { fontSize: 19, color: "#8a5527", fontWeight: "900" },
  vendorStatLabel: {
    fontSize: 9,
    color: "#725b49",
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  vendorCard: {
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 11,
    marginBottom: 9,
  },
  vendorCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  vendorAvatarSmall: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: "#ead7c2",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorAvatarSmallText: { fontSize: 15, color: "#63391e", fontWeight: "900" },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  vendorBadge: {
    fontSize: 8.5,
    color: "#5d3b22",
    fontWeight: "800",
    backgroundColor: "#ead8c5",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  vendorBadgeInactive: { color: "#8d2d24", backgroundColor: "#f7d9d4" },
  vendorCardMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#eadcca",
    marginTop: 10,
    paddingTop: 9,
  },
  vendorMetric: { flex: 1, fontSize: 8.5, color: "#624c3a", fontWeight: "700" },
  vendorProfileHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#fffaf3",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  vendorAvatar: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#ead7c2",
    alignItems: "center",
    justifyContent: "center",
  },
  vendorAvatarText: { fontSize: 24, color: "#63391e", fontWeight: "900" },
  vendorWage: { fontSize: 10, color: "#8a5527", fontWeight: "900" },
  inventoryCheckRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inventoryCheckText: { fontSize: 12, color: DARK, fontWeight: "800" },
  workModeActive: { backgroundColor: "#f0e1d1", borderColor: "#b48255" },
  workModeTextActive: { color: "#70401f" },
  quickActivityActive: {
    backgroundColor: "#f0e1d1",
    borderColor: "#9a6132",
    borderWidth: 1.5,
  },
  quickActivityTextActive: { color: "#70401f" },
  quickLaborSelected: { backgroundColor: "#f8eee3", borderColor: "#b48255" },
  quickCheckActive: { backgroundColor: "#8a5527", borderColor: "#8a5527" },
  saveWorkButton: {
    backgroundColor: "#8a5527",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 9,
  },
  peopleTitleBar: {
    minHeight: 55,
    backgroundColor: "#5b321c",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  peopleAdd: {
    backgroundColor: "#8a5527",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  peopleStatValue: { fontSize: 21, color: "#8a5527", fontWeight: "900" },
  peopleSmallAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ead7c2",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleSmallAvatarText: { fontSize: 16, color: "#63391e", fontWeight: "900" },
  peoplePhotoText: {
    fontSize: 10,
    color: "#8a5527",
    fontWeight: "800",
    marginTop: 6,
  },
  peopleHint: {
    fontSize: 10,
    color: "#6f5140",
    backgroundColor: "#f5eadc",
    borderRadius: 9,
    padding: 10,
    marginBottom: 12,
  },
  peopleAvatar: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#ead7c2",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleAvatarText: { fontSize: 25, color: "#63391e", fontWeight: "900" },
  catalogIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#ead7c2",
    alignItems: "center",
    justifyContent: "center",
  },
  catalogCardStats: {
    fontSize: 9.5,
    color: "#8a5527",
    fontWeight: "800",
    marginTop: 6,
  },
  catalogHero: {
    minHeight: 108,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#f5eadc",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
  catalogStatValue: { fontSize: 20, color: "#8a5527", fontWeight: "900" },
  record: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee8da",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  recordTitle: {
    fontWeight: "900",
    color: DARK,
    marginBottom: 7,
    fontSize: 14,
  },
  recordDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 2,
  },
  recordLabel: { fontSize: 10, color: "#7a827b", flex: 1 },
  recordValue: {
    fontSize: 11,
    color: "#344039",
    fontWeight: "700",
    flex: 1.4,
    textAlign: "right",
  },
  recordLine: { fontSize: 11, color: "#616b63" },
  recordActions: { gap: 12, alignItems: "center" },
  edit: { fontSize: 18, marginLeft: 6 },
  delete: { fontSize: 19, marginLeft: 6 },
  muted: {
    color: "#777",
    fontSize: 13,
    paddingVertical: 14,
    textAlign: "center",
  },
  modalBack: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fffdf8",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: DARK,
    marginBottom: 10,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: { fontWeight: "800", color: DARK },
  optionSub: { fontSize: 11, color: "#777" },
  bottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: Platform.OS === "android" ? 36 : 12,
    backgroundColor: "#fffdf8",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LINE,
    flexDirection: "row",
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: { flex: 1, alignItems: "center", minWidth: 0 },
  navIcon: { fontSize: 20, color: "#777" },
  navText: {
    fontSize: 9,
    color: "#777",
    fontWeight: "800",
    maxWidth: "96%",
    textAlign: "center",
  },
  navActive: { color: GREEN },
});
