import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Image, KeyboardAvoidingView, Linking, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

const today = new Date().toISOString().slice(0, 10);
const GREEN = '#8a5527';
const DARK = '#3f2616';
const SOFT = '#f5eee3';
const LINE = '#dfcfba';
const WEATHER_API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '0a3c56cb73b74ef5802121513261008';
const PRODUCTION_API_BASE = 'https://coffee-estate-app.pages.dev/api';
const FAVORITES_KEY = 'estate-app-favorite-modules';
const LANGUAGE_KEY = 'javaterrain-language';
const LANGUAGES = [
  ['en','English'],['kn','ಕನ್ನಡ'],['ta','தமிழ்'],['ml','മലയാളം'],['hi','हिन्दी'],['te','తెలుగు']
];
const I18N = {
  en:{today:"TODAY'S ESTATE",attention:'What needs your attention today?',currentProperty:'CURRENT PROPERTY',selectProperty:'Select Property',propertiesAvailable:'properties available',searchProperty:'Search name, village or property ID',home:'Home',add:'Add',modules:'Modules',reports:'Reports',more:'More',login:'Login',connecting:'Connecting…',username:'Username / Email',password:'Password',tagline:'Simple • Smart • For Estate Owners',back:'Back',language:'Language',weatherUnavailable:'Weather unavailable',updatingWeather:'Updating weather…',feelsLike:'Feels like',wind:'Wind',humidity:'Humidity',rain:'Rain',refresh:'Refresh',gpsRequired:'Location services are off. Turn on GPS for accurate local weather.',enableGps:'Turn on GPS',allowLocation:'Allow location',permissionDenied:'Location permission is disabled. Enable it in Settings.',settings:'Settings',quickAdd:'Quick Add',todaysTasks:"Today's Tasks",select:'Select'},
  kn:{today:'ಇಂದಿನ ಎಸ್ಟೇಟ್',attention:'ಇಂದು ನಿಮ್ಮ ಗಮನಕ್ಕೆ ಏನು ಬೇಕು?',currentProperty:'ಪ್ರಸ್ತುತ ಆಸ್ತಿ',selectProperty:'ಆಸ್ತಿ ಆಯ್ಕೆಮಾಡಿ',propertiesAvailable:'ಆಸ್ತಿಗಳು ಲಭ್ಯ',searchProperty:'ಹೆಸರು, ಊರು ಅಥವಾ ಆಸ್ತಿ ID ಹುಡುಕಿ',home:'ಮುಖಪುಟ',add:'ಸೇರಿಸಿ',modules:'ಮಾಡ್ಯೂಲ್‌ಗಳು',reports:'ವರದಿಗಳು',more:'ಇನ್ನಷ್ಟು',login:'ಲಾಗಿನ್',connecting:'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ…',username:'ಬಳಕೆದಾರ ಹೆಸರು / ಇಮೇಲ್',password:'ಪಾಸ್‌ವರ್ಡ್',tagline:'ಸರಳ • ಚತುರ • ಎಸ್ಟೇಟ್ ಮಾಲೀಕರಿಗಾಗಿ',back:'ಹಿಂದೆ',language:'ಭಾಷೆ',weatherUnavailable:'ಹವಾಮಾನ ಲಭ್ಯವಿಲ್ಲ',updatingWeather:'ಹವಾಮಾನ ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ…',feelsLike:'ಅನುಭವ',wind:'ಗಾಳಿ',humidity:'ಆರ್ದ್ರತೆ',rain:'ಮಳೆ',refresh:'ನವೀಕರಿಸಿ',gpsRequired:'ಸ್ಥಳ ಸೇವೆ ಆಫ್ ಆಗಿದೆ. ಸ್ಥಳೀಯ ಹವಾಮಾನಕ್ಕಾಗಿ GPS ಆನ್ ಮಾಡಿ.',enableGps:'GPS ಆನ್ ಮಾಡಿ',allowLocation:'ಸ್ಥಳ ಅನುಮತಿಸಿ',permissionDenied:'ಸ್ಥಳ ಅನುಮತಿಯನ್ನು Settings ನಲ್ಲಿ ಸಕ್ರಿಯಗೊಳಿಸಿ.',settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',quickAdd:'ತ್ವರಿತ ಸೇರಿಕೆ',todaysTasks:'ಇಂದಿನ ಕೆಲಸಗಳು',select:'ಆಯ್ಕೆ'},
  ta:{today:'இன்றைய எஸ்டேட்',attention:'இன்று உங்கள் கவனம் எதற்கு?',currentProperty:'தற்போதைய சொத்து',selectProperty:'சொத்தைத் தேர்ந்தெடுக்கவும்',propertiesAvailable:'சொத்துகள் உள்ளன',searchProperty:'பெயர், ஊர் அல்லது சொத்து ID தேடவும்',home:'முகப்பு',add:'சேர்',modules:'தொகுதிகள்',reports:'அறிக்கைகள்',more:'மேலும்',login:'உள்நுழை',connecting:'இணைக்கிறது…',username:'பயனர் பெயர் / மின்னஞ்சல்',password:'கடவுச்சொல்',tagline:'எளிது • புத்திசாலி • எஸ்டேட் உரிமையாளர்களுக்கு',back:'பின்',language:'மொழி',weatherUnavailable:'வானிலை கிடைக்கவில்லை',updatingWeather:'வானிலை புதுப்பிக்கிறது…',feelsLike:'உணர்வு',wind:'காற்று',humidity:'ஈரப்பதம்',rain:'மழை',refresh:'புதுப்பி',gpsRequired:'இருப்பிட சேவை அணைக்கப்பட்டுள்ளது. உள்ளூர் வானிலைக்கு GPS ஐ இயக்கவும்.',enableGps:'GPS இயக்கு',allowLocation:'இருப்பிடத்தை அனுமதி',permissionDenied:'Settings இல் இருப்பிட அனுமதியை இயக்கவும்.',settings:'அமைப்புகள்',quickAdd:'விரைவு சேர்',todaysTasks:'இன்றைய பணிகள்',select:'தேர்வு'},
  ml:{today:'ഇന്നത്തെ എസ്റ്റേറ്റ്',attention:'ഇന്ന് നിങ്ങളുടെ ശ്രദ്ധ എന്തിന്?',currentProperty:'നിലവിലെ പ്രോപ്പർട്ടി',selectProperty:'പ്രോപ്പർട്ടി തിരഞ്ഞെടുക്കുക',propertiesAvailable:'പ്രോപ്പർട്ടികൾ ലഭ്യമാണ്',searchProperty:'പേര്, ഗ്രാമം അല്ലെങ്കിൽ പ്രോപ്പർട്ടി ID തിരയുക',home:'ഹോം',add:'ചേർക്കുക',modules:'മോഡ്യൂളുകൾ',reports:'റിപ്പോർട്ടുകൾ',more:'കൂടുതൽ',login:'ലോഗിൻ',connecting:'ബന്ധിപ്പിക്കുന്നു…',username:'ഉപയോക്തൃനാമം / ഇമെയിൽ',password:'പാസ്‌വേഡ്',tagline:'ലളിതം • സ്മാർട്ട് • എസ്റ്റേറ്റ് ഉടമകൾക്ക്',back:'പിന്നിലേക്ക്',language:'ഭാഷ',weatherUnavailable:'കാലാവസ്ഥ ലഭ്യമല്ല',updatingWeather:'കാലാവസ്ഥ പുതുക്കുന്നു…',feelsLike:'അനുഭവം',wind:'കാറ്റ്',humidity:'ഈർപ്പം',rain:'മഴ',refresh:'പുതുക്കുക',gpsRequired:'ലൊക്കേഷൻ സേവനം ഓഫ് ആണ്. പ്രാദേശിക കാലാവസ്ഥയ്ക്ക് GPS ഓൺ ചെയ്യുക.',enableGps:'GPS ഓൺ ചെയ്യുക',allowLocation:'ലൊക്കേഷൻ അനുവദിക്കുക',permissionDenied:'Settings ൽ ലൊക്കേഷൻ അനുമതി നൽകുക.',settings:'ക്രമീകരണങ്ങൾ',quickAdd:'വേഗത്തിൽ ചേർക്കുക',todaysTasks:'ഇന്നത്തെ ജോലികൾ',select:'തിരഞ്ഞെടുക്കുക'},
  hi:{today:'आज का एस्टेट',attention:'आज किस पर ध्यान देना है?',currentProperty:'वर्तमान संपत्ति',selectProperty:'संपत्ति चुनें',propertiesAvailable:'संपत्तियाँ उपलब्ध',searchProperty:'नाम, गाँव या संपत्ति ID खोजें',home:'होम',add:'जोड़ें',modules:'मॉड्यूल',reports:'रिपोर्ट',more:'अधिक',login:'लॉगिन',connecting:'कनेक्ट हो रहा है…',username:'यूज़र नाम / ईमेल',password:'पासवर्ड',tagline:'सरल • स्मार्ट • एस्टेट मालिकों के लिए',back:'पीछे',language:'भाषा',weatherUnavailable:'मौसम उपलब्ध नहीं',updatingWeather:'मौसम अपडेट हो रहा है…',feelsLike:'महसूस',wind:'हवा',humidity:'नमी',rain:'बारिश',refresh:'ताज़ा करें',gpsRequired:'स्थान सेवा बंद है। स्थानीय मौसम के लिए GPS चालू करें।',enableGps:'GPS चालू करें',allowLocation:'स्थान की अनुमति दें',permissionDenied:'Settings में स्थान अनुमति चालू करें।',settings:'सेटिंग्स',quickAdd:'त्वरित जोड़ें',todaysTasks:'आज के कार्य',select:'चुनें'},
  te:{today:'నేటి ఎస్టేట్',attention:'ఈ రోజు మీ దృష్టి దేనిపై?',currentProperty:'ప్రస్తుత ఆస్తి',selectProperty:'ఆస్తిని ఎంచుకోండి',propertiesAvailable:'ఆస్తులు అందుబాటులో ఉన్నాయి',searchProperty:'పేరు, గ్రామం లేదా ఆస్తి ID వెతకండి',home:'హోమ్',add:'జోడించు',modules:'మాడ్యూల్స్',reports:'నివేదికలు',more:'మరిన్ని',login:'లాగిన్',connecting:'కనెక్ట్ అవుతోంది…',username:'వినియోగదారు పేరు / ఇమెయిల్',password:'పాస్‌వర్డ్',tagline:'సులభం • స్మార్ట్ • ఎస్టేట్ యజమానులకు',back:'వెనుకకు',language:'భాష',weatherUnavailable:'వాతావరణం అందుబాటులో లేదు',updatingWeather:'వాతావరణం నవీకరిస్తోంది…',feelsLike:'అనుభూతి',wind:'గాలి',humidity:'తేమ',rain:'వర్షం',refresh:'నవీకరించు',gpsRequired:'స్థాన సేవ ఆఫ్‌లో ఉంది. స్థానిక వాతావరణం కోసం GPS ఆన్ చేయండి.',enableGps:'GPS ఆన్ చేయండి',allowLocation:'స్థానాన్ని అనుమతించండి',permissionDenied:'Settings లో స్థాన అనుమతిని ఆన్ చేయండి.',settings:'సెట్టింగ్స్',quickAdd:'త్వరిత జోడింపు',todaysTasks:'నేటి పనులు',select:'ఎంచుకోండి'}
};
const COMMON_UI = {
  en:{save:'Save',update:'Update',cancelEdit:'Cancel edit',records:'Records',entries:'entries',optional:'optional',none:'None',close:'Close',delete:'Delete',edit:'Edit',historyPeriod:'History period',reset:'Reset',from:'FROM',to:'TO',previous:'Previous',next:'Next',page:'Page',of:'of',selectPrefix:'Select',noRecords:'No records in this period.',account:'Account',logout:'Logout'},
  kn:{save:'ಉಳಿಸಿ',update:'ನವೀಕರಿಸಿ',cancelEdit:'ತಿದ್ದುಪಡಿ ರದ್ದು',records:'ದಾಖಲೆಗಳು',entries:'ದಾಖಲೆಗಳು',optional:'ಐಚ್ಛಿಕ',none:'ಯಾವುದೂ ಇಲ್ಲ',close:'ಮುಚ್ಚಿ',delete:'ಅಳಿಸಿ',edit:'ತಿದ್ದು',historyPeriod:'ಇತಿಹಾಸ ಅವಧಿ',reset:'ಮರುಹೊಂದಿಸಿ',from:'ಇಂದ',to:'ವರೆಗೆ',previous:'ಹಿಂದಿನ',next:'ಮುಂದಿನ',page:'ಪುಟ',of:'ರಲ್ಲಿ',selectPrefix:'ಆಯ್ಕೆಮಾಡಿ',noRecords:'ಈ ಅವಧಿಯಲ್ಲಿ ದಾಖಲೆಗಳಿಲ್ಲ.',account:'ಖಾತೆ',logout:'ಲಾಗ್ ಔಟ್'},
  ta:{save:'சேமி',update:'புதுப்பி',cancelEdit:'திருத்தத்தை ரத்து செய்',records:'பதிவுகள்',entries:'பதிவுகள்',optional:'விருப்பம்',none:'எதுவுமில்லை',close:'மூடு',delete:'நீக்கு',edit:'திருத்து',historyPeriod:'வரலாற்றுக் காலம்',reset:'மீட்டமை',from:'முதல்',to:'வரை',previous:'முந்தைய',next:'அடுத்து',page:'பக்கம்',of:'இல்',selectPrefix:'தேர்ந்தெடு',noRecords:'இந்த காலத்தில் பதிவுகள் இல்லை.',account:'கணக்கு',logout:'வெளியேறு'},
  ml:{save:'സേവ്',update:'പുതുക്കുക',cancelEdit:'തിരുത്തൽ റദ്ദാക്കുക',records:'രേഖകൾ',entries:'രേഖകൾ',optional:'ഐച്ഛികം',none:'ഒന്നുമില്ല',close:'അടയ്ക്കുക',delete:'ഇല്ലാതാക്കുക',edit:'തിരുത്തുക',historyPeriod:'ചരിത്ര കാലയളവ്',reset:'പുനഃസജ്ജമാക്കുക',from:'മുതൽ',to:'വരെ',previous:'മുമ്പത്തെ',next:'അടുത്തത്',page:'പേജ്',of:'ൽ',selectPrefix:'തിരഞ്ഞെടുക്കുക',noRecords:'ഈ കാലയളവിൽ രേഖകളില്ല.',account:'അക്കൗണ്ട്',logout:'ലോഗ് ഔട്ട്'},
  hi:{save:'सहेजें',update:'अपडेट करें',cancelEdit:'संपादन रद्द करें',records:'रिकॉर्ड',entries:'रिकॉर्ड',optional:'वैकल्पिक',none:'कोई नहीं',close:'बंद करें',delete:'हटाएँ',edit:'संपादित करें',historyPeriod:'इतिहास अवधि',reset:'रीसेट',from:'से',to:'तक',previous:'पिछला',next:'अगला',page:'पृष्ठ',of:'में से',selectPrefix:'चुनें',noRecords:'इस अवधि में कोई रिकॉर्ड नहीं।',account:'खाता',logout:'लॉग आउट'},
  te:{save:'సేవ్',update:'నవీకరించు',cancelEdit:'సవరణ రద్దు',records:'రికార్డులు',entries:'రికార్డులు',optional:'ఐచ్ఛికం',none:'ఏదీ లేదు',close:'మూసివేయి',delete:'తొలగించు',edit:'సవరించు',historyPeriod:'చరిత్ర కాలం',reset:'రీసెట్',from:'నుండి',to:'వరకు',previous:'మునుపటి',next:'తదుపరి',page:'పేజీ',of:'లో',selectPrefix:'ఎంచుకోండి',noRecords:'ఈ కాలంలో రికార్డులు లేవు.',account:'ఖాతా',logout:'లాగ్ అవుట్'}
};
const MODULE_TRANSLATIONS = {
  kn:{properties:'ಆಸ್ತಿ ನಿರ್ವಹಣೆ',blocks:'ಬ್ಲಾಕ್‌ಗಳು ಮತ್ತು ಉಪಬ್ಲಾಕ್‌ಗಳು',baseUnits:'ಮೂಲ ಘಟಕಗಳು',assets:'ಆಸ್ತಿಗಳು / ದಾಸ್ತಾನು',plants:'ಸಸ್ಯ ಮಾಸ್ಟರ್',plantInventory:'ಸಸ್ಯ ದಾಸ್ತಾನು',yieldTypes:'ಇಳುವರಿ ವಿಧಗಳು',yieldRates:'ಇಳುವರಿ ದರಗಳು',cropDetails:'ಬೆಳೆ ವಿವರಗಳು',cropIncome:'ಆದಾಯ',fertilizers:'ಗೊಬ್ಬರ ದಾಖಲೆ',labors:'ಕಾರ್ಮಿಕರು',vendors:'ಮಾರಾಟಗಾರರು',laborVendors:'ಮಾರಾಟಗಾರ ಕಾರ್ಮಿಕರು',wages:'ವೇತನ ಸಂರಚನೆ',wageSettlements:'ವೇತನ ಪಾವತಿ',vendorSettlements:'ಮಾರಾಟಗಾರ ಪಾವತಿ',attendanceQuick:'ಹಾಜರಾತಿ',rainfallQuick:'ಮಳೆ ದಾಖಲೆ',yieldQuick:'ಕೊಯ್ಲು / ಇಳುವರಿ',expenses:'ವೆಚ್ಚ ದಾಖಲೆ',workActivities:'ಕೆಲಸ ಚಟುವಟಿಕೆ',workAssignments:'ಕೆಲಸ ನಿಯೋಜನೆ',reports:'ವರದಿಗಳು',notifications:'ಅಧಿಸೂಚನೆಗಳು',settings:'ಸೆಟ್ಟಿಂಗ್‌ಗಳು'},
  ta:{properties:'சொத்து நிர்வாகம்',blocks:'பிளாக்குகள் மற்றும் துணைப் பிளாக்குகள்',baseUnits:'அடிப்படை அலகுகள்',assets:'சொத்துகள் / இருப்பு',plants:'தாவர பட்டியல்',plantInventory:'தாவர இருப்பு',yieldTypes:'விளைச்சல் வகைகள்',yieldRates:'விளைச்சல் விலைகள்',cropDetails:'பயிர் விவரங்கள்',cropIncome:'வருமானம்',fertilizers:'உரப் பதிவு',labors:'தொழிலாளர்கள்',vendors:'விற்பனையாளர்கள்',laborVendors:'விற்பனையாளர் தொழிலாளர்கள்',wages:'ஊதிய அமைப்பு',wageSettlements:'ஊதிய தீர்வு',vendorSettlements:'விற்பனையாளர் தீர்வு',attendanceQuick:'வருகை',rainfallQuick:'மழைப் பதிவு',yieldQuick:'அறுவடை / விளைச்சல்',expenses:'செலவுப் பதிவு',workActivities:'வேலை செயல்பாடு',workAssignments:'வேலை ஒதுக்கீடு',reports:'அறிக்கைகள்',notifications:'அறிவிப்புகள்',settings:'அமைப்புகள்'},
  ml:{properties:'പ്രോപ്പർട്ടി മാനേജ്മെന്റ്',blocks:'ബ്ലോക്കുകളും ഉപബ്ലോക്കുകളും',baseUnits:'അടിസ്ഥാന യൂണിറ്റുകൾ',assets:'ആസ്തികൾ / ഇൻവെന്ററി',plants:'സസ്യ മാസ്റ്റർ',plantInventory:'സസ്യ ഇൻവെന്ററി',yieldTypes:'വിളവ് തരങ്ങൾ',yieldRates:'വിളവ് നിരക്കുകൾ',cropDetails:'വിള വിശദാംശങ്ങൾ',cropIncome:'വരുമാനം',fertilizers:'വളം രേഖ',labors:'തൊഴിലാളികൾ',vendors:'വിൽപ്പനക്കാർ',laborVendors:'വെൻഡർ തൊഴിലാളികൾ',wages:'വേതന ക്രമീകരണം',wageSettlements:'വേതന തീർപ്പാക്കൽ',vendorSettlements:'വെൻഡർ തീർപ്പാക്കൽ',attendanceQuick:'ഹാജർ',rainfallQuick:'മഴ രേഖ',yieldQuick:'വിളവെടുപ്പ് / വിളവ്',expenses:'ചെലവ് രേഖ',workActivities:'ജോലി പ്രവർത്തനം',workAssignments:'ജോലി നിയോഗം',reports:'റിപ്പോർട്ടുകൾ',notifications:'അറിയിപ്പുകൾ',settings:'ക്രമീകരണങ്ങൾ'},
  hi:{properties:'संपत्ति प्रबंधन',blocks:'ब्लॉक और उप-ब्लॉक',baseUnits:'मूल इकाइयाँ',assets:'संपत्ति / इन्वेंटरी',plants:'पौधा मास्टर',plantInventory:'पौधा इन्वेंटरी',yieldTypes:'उपज प्रकार',yieldRates:'उपज दरें',cropDetails:'फसल विवरण',cropIncome:'आय',fertilizers:'उर्वरक रिकॉर्ड',labors:'मजदूर',vendors:'विक्रेता',laborVendors:'विक्रेता मजदूर',wages:'मजदूरी व्यवस्था',wageSettlements:'मजदूरी निपटान',vendorSettlements:'विक्रेता निपटान',attendanceQuick:'उपस्थिति',rainfallQuick:'वर्षा रिकॉर्ड',yieldQuick:'कटाई / उपज',expenses:'खर्च रिकॉर्ड',workActivities:'कार्य गतिविधि',workAssignments:'कार्य आवंटन',reports:'रिपोर्ट',notifications:'सूचनाएँ',settings:'सेटिंग्स'},
  te:{properties:'ఆస్తి నిర్వహణ',blocks:'బ్లాక్‌లు మరియు ఉపబ్లాక్‌లు',baseUnits:'మూల యూనిట్లు',assets:'ఆస్తులు / ఇన్వెంటరీ',plants:'మొక్కల మాస్టర్',plantInventory:'మొక్కల ఇన్వెంటరీ',yieldTypes:'దిగుబడి రకాలు',yieldRates:'దిగుబడి ధరలు',cropDetails:'పంట వివరాలు',cropIncome:'ఆదాయం',fertilizers:'ఎరువు రికార్డు',labors:'కార్మికులు',vendors:'విక్రేతలు',laborVendors:'విక్రేత కార్మికులు',wages:'వేతన అమరిక',wageSettlements:'వేతన పరిష్కారం',vendorSettlements:'విక్రేత పరిష్కారం',attendanceQuick:'హాజరు',rainfallQuick:'వర్షపు నమోదు',yieldQuick:'కోత / దిగుబడి',expenses:'ఖర్చు నమోదు',workActivities:'పని కార్యకలాపం',workAssignments:'పని కేటాయింపు',reports:'నివేదికలు',notifications:'నోటిఫికేషన్లు',settings:'సెట్టింగ్స్'}
};
function translator(language){ return key => I18N[language]?.[key] || I18N.en[key] || key; }
function uiTranslator(language){ const core=translator(language); return key => key==='date' ? fieldName(language,'date','Date') : COMMON_UI[language]?.[key] || core(key); }
function moduleName(language,key){ return MODULE_TRANSLATIONS[language]?.[key] || labels[key] || key; }
const FIELD_WORDS = {
  kn:{property:'ಆಸ್ತಿ',name:'ಹೆಸರು',total:'ಒಟ್ಟು',area:'ವಿಸ್ತೀರ್ಣ',address:'ವಿಳಾಸ',pincode:'ಪಿನ್ ಕೋಡ್',block:'ಬ್ಲಾಕ್',parent:'ಮೂಲ',date:'ದಿನಾಂಕ',quantity:'ಪ್ರಮಾಣ',price:'ಬೆಲೆ',year:'ವರ್ಷ',status:'ಸ್ಥಿತಿ',details:'ವಿವರಗಳು',notes:'ಟಿಪ್ಪಣಿಗಳು',plant:'ಸಸ್ಯ',type:'ವಿಧ',labour:'ಕಾರ್ಮಿಕ',vendor:'ಪೂರೈಕೆದಾರ',wage:'ವೇತನ',amount:'ಮೊತ್ತ',attendance:'ಹಾಜರಾತಿ',rain:'ಮಳೆ',expense:'ವೆಚ್ಚ',work:'ಕೆಲಸ',activity:'ಚಟುವಟಿಕೆ',income:'ಆದಾಯ',code:'ಕೋಡ್',unit:'ಘಟಕ',selling:'ಮಾರಾಟ',received:'ಸ್ವೀಕರಿಸಿದ'},
  ta:{property:'சொத்து',name:'பெயர்',total:'மொத்த',area:'பரப்பளவு',address:'முகவரி',pincode:'அஞ்சல் குறியீடு',block:'தொகுதி',parent:'முதன்மை',date:'தேதி',quantity:'அளவு',price:'விலை',year:'ஆண்டு',status:'நிலை',details:'விவரங்கள்',notes:'குறிப்புகள்',plant:'பயிர்',type:'வகை',labour:'தொழிலாளர்',vendor:'விற்பனையாளர்',wage:'ஊதியம்',amount:'தொகை',attendance:'வருகை',rain:'மழை',expense:'செலவு',work:'வேலை',activity:'செயல்பாடு',income:'வருமானம்',code:'குறியீடு',unit:'அலகு',selling:'விற்பனை',received:'பெற்ற'},
  ml:{property:'പ്രോപ്പർട്ടി',name:'പേര്',total:'ആകെ',area:'വിസ്തീർണം',address:'വിലാസം',pincode:'പിൻ കോഡ്',block:'ബ്ലോക്ക്',parent:'പാരന്റ്',date:'തീയതി',quantity:'അളവ്',price:'വില',year:'വർഷം',status:'നില',details:'വിശദാംശങ്ങൾ',notes:'കുറിപ്പുകൾ',plant:'ചെടി',type:'തരം',labour:'തൊഴിലാളി',vendor:'വെണ്ടർ',wage:'വേതനം',amount:'തുക',attendance:'ഹാജർ',rain:'മഴ',expense:'ചെലവ്',work:'ജോലി',activity:'പ്രവർത്തനം',income:'വരുമാനം',code:'കോഡ്',unit:'യൂണിറ്റ്',selling:'വിൽപ്പന',received:'ലഭിച്ച'},
  hi:{property:'संपत्ति',name:'नाम',total:'कुल',area:'क्षेत्रफल',address:'पता',pincode:'पिन कोड',block:'ब्लॉक',parent:'मूल',date:'तारीख',quantity:'मात्रा',price:'कीमत',year:'वर्ष',status:'स्थिति',details:'विवरण',notes:'टिप्पणियाँ',plant:'पौधा',type:'प्रकार',labour:'मज़दूर',vendor:'विक्रेता',wage:'मज़दूरी',amount:'राशि',attendance:'उपस्थिति',rain:'बारिश',expense:'खर्च',work:'कार्य',activity:'गतिविधि',income:'आय',code:'कोड',unit:'इकाई',selling:'बिक्री',received:'प्राप्त'},
  te:{property:'ఆస్తి',name:'పేరు',total:'మొత్తం',area:'విస్తీర్ణం',address:'చిరునామా',pincode:'పిన్ కోడ్',block:'బ్లాక్',parent:'మూల',date:'తేదీ',quantity:'పరిమాణం',price:'ధర',year:'సంవత్సరం',status:'స్థితి',details:'వివరాలు',notes:'గమనికలు',plant:'మొక్క',type:'రకం',labour:'కార్మికుడు',vendor:'విక్రేత',wage:'వేతనం',amount:'మొత్తం',attendance:'హాజరు',rain:'వర్షం',expense:'ఖర్చు',work:'పని',activity:'కార్యాచరణ',income:'ఆదాయం',code:'కోడ్',unit:'యూనిట్',selling:'అమ్మకం',received:'అందుకున్న'}
};
function fieldName(language,key,fallback){
  if(language==='en') return fallback;
  const words=FIELD_WORDS[language]||{};
  return key.replace(/_id$/,'').split('_').map(word=>words[word]||word).join(' ');
}
function localeFor(language){ return ({en:'en-IN',kn:'kn-IN',ta:'ta-IN',ml:'ml-IN',hi:'hi-IN',te:'te-IN'})[language] || 'en-IN'; }
const ATTENDANCE_TEXT={
  en:{mark:'Mark attendance',labour:'Labour',full:'1 Day',half:'½ Day',absent:'Absent',save:'Save Attendance',saved:'Attendance summary',attendance:'Attendance',days:'Days attended',view:'View dates',edit:'Edit Attendance',clear:'Clear Day',present:'Attendance is already present for this property and date.',empty:'No labourers are registered for this property.'},
  kn:{mark:'ಹಾಜರಾತಿ ಗುರುತಿಸಿ',labour:'ಕಾರ್ಮಿಕ',full:'1 ದಿನ',half:'½ ದಿನ',absent:'ಗೈರು',save:'ಹಾಜರಾತಿ ಉಳಿಸಿ',saved:'ಹಾಜರಾತಿ ಸಾರಾಂಶ',attendance:'ಹಾಜರಾತಿ',days:'ಹಾಜರಾದ ದಿನಗಳು',view:'ದಿನಾಂಕಗಳನ್ನು ನೋಡಿ',edit:'ಹಾಜರಾತಿ ತಿದ್ದು',clear:'ದಿನವನ್ನು ತೆರವುಗೊಳಿಸಿ',present:'ಈ ಆಸ್ತಿ ಮತ್ತು ದಿನಾಂಕಕ್ಕೆ ಹಾಜರಾತಿ ಈಗಾಗಲೇ ಇದೆ.',empty:'ಈ ಆಸ್ತಿಗೆ ಕಾರ್ಮಿಕರು ನೋಂದಾಯಿಸಿಲ್ಲ.'},
  ta:{mark:'வருகையை குறிக்கவும்',labour:'தொழிலாளர்',full:'1 நாள்',half:'½ நாள்',absent:'வரவில்லை',save:'வருகையை சேமி',saved:'வருகை சுருக்கம்',attendance:'வருகை',days:'வருகை நாட்கள்',view:'தேதிகளை காண்க',edit:'வருகையை திருத்து',clear:'நாளை அழி',present:'இந்த சொத்து மற்றும் தேதிக்கு வருகை ஏற்கனவே உள்ளது.',empty:'இந்த சொத்தில் தொழிலாளர்கள் பதிவு செய்யப்படவில்லை.'},
  ml:{mark:'ഹാജർ രേഖപ്പെടുത്തുക',labour:'തൊഴിലാളി',full:'1 ദിവസം',half:'½ ദിവസം',absent:'ഹാജരല്ല',save:'ഹാജർ സേവ് ചെയ്യുക',saved:'ഹാജർ സംഗ്രഹം',attendance:'ഹാജർ',days:'ഹാജരായ ദിവസങ്ങൾ',view:'തീയതികൾ കാണുക',edit:'ഹാജർ തിരുത്തുക',clear:'ദിവസം മായ്ക്കുക',present:'ഈ പ്രോപ്പർട്ടിക്കും തീയതിക്കും ഹാജർ നിലവിലുണ്ട്.',empty:'ഈ പ്രോപ്പർട്ടിയിൽ തൊഴിലാളികൾ രജിസ്റ്റർ ചെയ്തിട്ടില്ല.'},
  hi:{mark:'उपस्थिति दर्ज करें',labour:'मज़दूर',full:'1 दिन',half:'½ दिन',absent:'अनुपस्थित',save:'उपस्थिति सहेजें',saved:'उपस्थिति सारांश',attendance:'उपस्थिति',days:'उपस्थित दिन',view:'तारीखें देखें',edit:'उपस्थिति संपादित करें',clear:'दिन की उपस्थिति मिटाएँ',present:'इस संपत्ति और तारीख की उपस्थिति पहले से मौजूद है।',empty:'इस संपत्ति के लिए कोई मज़दूर पंजीकृत नहीं है।'},
  te:{mark:'హాజరు నమోదు చేయండి',labour:'కార్మికుడు',full:'1 రోజు',half:'½ రోజు',absent:'గైర్హాజరు',save:'హాజరు సేవ్ చేయండి',saved:'హాజరు సారాంశం',attendance:'హాజరు',days:'హాజరైన రోజులు',view:'తేదీలు చూడండి',edit:'హాజరు సవరించు',clear:'రోజును తొలగించు',present:'ఈ ఆస్తి మరియు తేదీకి హాజరు ఇప్పటికే ఉంది.',empty:'ఈ ఆస్తికి కార్మికులు నమోదు కాలేదు.'}
};
const GROUP_NAMES={kn:{estate:'ಎಸ್ಟೇಟ್ ಸಿದ್ಧತೆ',plants:'ಸಸ್ಯ ಮತ್ತು ಬೆಳೆ',workforce:'ಕಾರ್ಮಿಕರು',daily:'ದೈನಂದಿನ ದಾಖಲೆ',reports:'ವರದಿಗಳು'},ta:{estate:'எஸ்டேட் அமைப்பு',plants:'பயிர்கள்',workforce:'பணியாளர்கள்',daily:'தினசரி பதிவு',reports:'அறிக்கைகள்'},ml:{estate:'എസ്റ്റേറ്റ് സജ്ജീകരണം',plants:'ചെടിയും വിളയും',workforce:'തൊഴിലാളികൾ',daily:'ദൈനംദിന എൻട്രി',reports:'റിപ്പോർട്ടുകൾ'},hi:{estate:'एस्टेट सेटअप',plants:'पौधे और फसल',workforce:'कार्यबल',daily:'दैनिक प्रविष्टि',reports:'रिपोर्ट'},te:{estate:'ఎస్టేట్ సెటప్',plants:'మొక్కలు మరియు పంట',workforce:'కార్మికులు',daily:'రోజువారీ నమోదు',reports:'నివేదికలు'}};
const QUICK_ACTIONS = [
  ['Attendance','✅','attendanceQuick'],['Rain','🌧️','rainfallQuick'],['Expense','💵','expenses'],['Labour','👷','labors'],
  ['Plant / Crop','🌱','plantInventory'],['Wage Sheet','🧾','wageSettlements'],['Harvest','🌾','yieldQuick'],['Blocks','🗺️','blocks'],
  ['Base Units','📐','baseUnits'],['Property','🏡','properties'],['Vendor','🤝','vendors'],['Work Assignment','🧑‍🌾','workAssignments'],
  ['Work Activity','📝','workActivities'],['Fertilizer','🌿','fertilizers'],['Crop Income','💰','cropIncome'],['Assets','🚜','assets']
];
const DEFAULT_FAVORITES = ['attendanceQuick','rainfallQuick','expenses','labors','plantInventory','wageSettlements','yieldQuick'];
const DATE_FIELDS = { attendanceQuick:'entry_date', rainfallQuick:'recorded_date', yieldQuick:'picking_date', expenses:'expense_occurence_date', fertilizers:'date_of_application', workAssignments:'work_date', wageSettlements:'running_wage_transaction_date', vendorSettlements:'running_wage_transaction_date', cropIncome:'received_date', plantInventory:'planting_date' };

const moduleGroups = [
  { key: 'estate', title: 'Estate Setup', icon: '🏡', items: ['properties','blocks','baseUnits','assets'] },
  { key: 'plants', title: 'Plant & Crop', icon: '🌱', items: ['plants','plantInventory','yieldTypes','yieldRates','cropDetails','cropIncome','fertilizers'] },
  { key: 'workforce', title: 'Workforce', icon: '👥', items: ['labors','vendors','laborVendors','wages','wageSettlements','vendorSettlements'] },
  { key: 'daily', title: 'Daily Entry', icon: '📝', items: ['attendanceQuick','rainfallQuick','yieldQuick','expenses','workActivities','workAssignments'] },
  { key: 'reports', title: 'Reports', icon: '📊', items: ['reports','dashboardReport','notifications','settings'] }
];

const labels = {
  properties:'Property Management', blocks:'Blocks & Sub Blocks', baseUnits:'Base Units Configuration', assets:'Assets / Inventory',
  plants:'Plant Master', plantInventory:'Plant Inventory', yieldTypes:'Yield Types', yieldRates:'Yield Rates / Price', cropDetails:'Crop Details', cropIncome:'Income / Revenue', fertilizers:'Fertilizer Log',
  labors:'Labour Master', vendors:'Vendor Registration', laborVendors:'Vendor Labour & Commission', wages:'Wage Configuration', wageSettlements:'Wage Sheet / Settlement', vendorSettlements:'Vendor Settlement',
  attendanceQuick:'Attendance', rainfallQuick:'Rain Entry', yieldQuick:'Harvest / Yield Entry', expenses:'Expense Entry', workActivities:'Work Activity Master', workAssignments:'Work Assignment',
  reports:'Manual Reports', dashboardReport:'Dashboard Reports', notifications:'Notifications', settings:'Settings'
};

const resourceOf = { attendanceQuick: 'attendance', rainfallQuick: 'rainfall', yieldQuick: 'yield' };
const requiredFields = {
  attendanceQuick: ['labor_id','entry_date','attendance_value'],
  workAssignments: ['work_date','work_activity_id','labor_id','block_id'],
  rainfallQuick: ['block_id','recorded_date','rain_value'],
  yieldQuick: ['yieldrate_id','picking_date','quantity']
};

const fieldConfig = {
  properties:[['property_name','text','Property Name'],['total_acre','number','Total Area / Acres'],['address_1','text','Village / Address'],['address_2','text','Taluk / District'],['pincode','text','Pincode']],
  blocks:[['block_name','text','Block / Sub Block Name'],['block_area','number','Area'],['property_id','select','Property','properties','property_id','property_name'],['parent_block_id','select','Parent Block','blocks','block_id','block_name',true]],
  baseUnits:[['baseunit_name','text','Unit Name']],
  assets:[['asset_name','text','Asset Name'],['asset_price','number','Price'],['procured_year','number','Procured Year'],['isactive','number','Active 1/0'],['property_id','select','Property','properties','property_id','property_name'],['asset_procured_source','text','Source']],
  plants:[['plant_type','text','Plant Type'],['details','text','Details'],['block_id','select','Block','blocks','block_id','block_name']],
  plantInventory:[['block_id','select','Block','blocks','block_id','block_name'],['sub_block_name','text','Sub Block / Section'],['plant_id','select','Plant','plants','plant_id','plant_type'],['plant_count','number','Plant Count'],['planting_date','date','Planting Date'],['spacing','text','Spacing'],['status','select','Status','statusOptions','id','name'],['notes','text','Notes']],
  yieldTypes:[['yieldtype_name','text','Yield Type'],['plant_id','select','Plant','plants','plant_id','plant_type']],
  yieldRates:[['plant_id','select','Plant','plants','plant_id','plant_type'],['yieldtype_id','select','Yield Type','yieldTypes','yieldtype_id','yieldtype_name'],['yieldrate_code','text','Season / Code'],['yieldrate_running_rate','number','Rate'],['baseunit_id','select','Unit','baseUnits','baseunit_id','baseunit_name']],
  cropDetails:[['yield_obtained','number','Yield Obtained'],['selling_price','number','Selling Price'],['property_id','select','Property','properties','property_id','property_name'],['other_detail','text','Other Detail']],
  cropIncome:[['crop_id','select','Crop','cropDetails','crop_id','crop_label'],['income_amount','number','Income Amount'],['received_date','date','Received Date']],
  fertilizers:[['fertilizer_name','text','Fertilizer Name'],['date_of_application','date','Date'],['property_id','select','Property','properties','property_id','property_name'],['other_details','text','Details']],
  labors:[['name','text','Labour Name'],['age','number','Age'],['adhar_card','text','Govt ID / Aadhaar'],['bank_details','text','Bank Details'],['health_history','text','Health Notes'],['photo','text','Photo URL / Ref'],['address','text','Address'],['emergency_details','text','Emergency Contact']],
  vendors:[['vendorname','text','Vendor Name'],['description','text','Contact / Address / Notes']],
  laborVendors:[['labor_id','select','Labour','labors','labor_id','name'],['vendor_id','select','Vendor','vendors','vendor_id','vendorname'],['vendor_labor_percentage','number','Commission / Amount'],['laborvendorcode','text','Code']],
  wages:[['labor_id','select','Labour','labors','labor_id','name'],['wage_fixed','number','Fixed Wage'],['wage_variable','number','Variable Wage'],['wage_ot_perhr_price','number','Hourly / OT Rate'],['wage_fix_code','text','Wage Code']],
  wageSettlements:[['wage_id','select','Wage','wages','wage_id','wage_label'],['settled_amount','number','Settled Amount'],['advance_amount','number','Advance Amount'],['running_wage_transaction_date','date','Date']],
  vendorSettlements:[['laborvendor_id','select','Vendor Labour','laborVendors','laborvendor_id','labor_vendor_label'],['settled_amount','number','Settled Amount'],['advance_amount','number','Advance Amount'],['running_wage_transaction_date','date','Date']],
  attendanceQuick:[['labor_id','select','Labour','labors','labor_id','name'],['entry_date','date','Date'],['attendance_value','select','Attendance','attendanceOptions','id','name']],
  rainfallQuick:[['block_id','select','Block','blocks','block_id','block_name'],['recorded_date','date','Date'],['rain_value','number','Rain mm']],
  yieldQuick:[['yieldrate_id','select','Yield Rate / Crop','yieldRates','yieldrate_id','yield_rate_label'],['picking_date','date','Picking Date'],['quantity','number','Quantity']],
  expenses:[['expensetype_id','select','Expense Type','expenseTypes','expensetype_id','expense_name'],['property_id','select','Property','properties','property_id','property_name'],['expense_code','text','Code / Notes'],['expense_occurence_date','date','Date'],['other_expense','number','Amount']],
  workActivities:[['work_activity_name','text','Work Activity Name'],['work_activity_type','text','Type'],['notes','text','Notes']],
  workAssignments:[['work_date','date','Work Date'],['work_activity_id','select','Work Activity','workActivities','work_activity_id','work_activity_name'],['labor_id','select','Labour','labors','labor_id','name'],['block_id','select','Block','blocks','block_id','block_name'],['notes','text','Notes']],
  reports:[['total_expenditure','number','Total Expenditure'],['total_revenue','number','Total Revenue'],['profit_loss','number','Profit / Loss'],['property_id','select','Property','properties','property_id','property_name']],
  settings:[]
};

const readResources = ['properties','blocks','baseUnits','assets','plants','plantInventory','yieldTypes','yieldRates','cropDetails','cropIncome','fertilizers','labors','vendors','laborVendors','wages','wageSettlements','vendorSettlements','expenseTypes','expenses','workActivities','workAssignments','reports'];
const metaMirror = ['properties','blocks','plants','yieldTypes','yieldRates','wages','laborVendors','cropDetails','workActivities','attendanceLabors'];
const optionSets = {
  statusOptions: [{id:'active',name:'Active'}, {id:'new',name:'New'}, {id:'replaced',name:'Replaced'}, {id:'dead',name:'Dead'}],
  attendanceOptions: [{id:'1',name:'Full Day (1)'}, {id:'0.5',name:'Half Day (0.5)'}, {id:'0',name:'Absent (0)'}, {id:'0.25',name:'Hourly / Quarter'}, {id:'0.75',name:'3/4 Day'}, {id:'1.5',name:'Full + OT (1.5)'}]
};

function defaultForm(key, propertyId) {
  if (key === 'settings') return {};
  const out = { created_by: 'Mobile' };
  (fieldConfig[key] || []).forEach(f => { out[f[0]] = f[1] === 'date' ? today : f[1] === 'number' ? '0' : ''; });
  if ('property_id' in out && propertyId) out.property_id = String(propertyId);
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
  const key = preferred && row[preferred] != null ? preferred : ['entry_date','recorded_date','date_time','picking_date','yield_settlement_date','expense_occurence_date','work_date','date_of_application','running_wage_transaction_date','received_date','planting_date','created_on'].find(item => row[item] != null);
  return key ? String(row[key]).slice(0, 10) : '';
}

function itemTitle(row) {
  if (!row) return 'Record';
  return row.property_name || row.block_name || row.name || row.vendorname || row.plant_type || row.work_activity_name || row.expense_name || row.baseunit_name || row.asset_name || row.yieldtype_name || row.fertilizer_name || row.labor_name || row.crop_label || `Record #${row.id || row[Object.keys(row).find(k => k.endsWith('_id'))] || ''}`;
}

function rowId(row) {
  const key = Object.keys(row || {}).find(item => item.endsWith('_id'));
  return key ? row[key] : null;
}

function optionLabel(option, preferredKey) {
  return option?.[preferredKey] || option?.assignment_label || option?.yield_rate_label || option?.labor_name || option?.name || option?.property_name || option?.block_name || option?.plant_type || option?.work_activity_name || option?.vendorname || option?.expense_name || option?.yieldtype_name || option?.baseunit_name || option?.crop_label || '';
}

function normalizedName(value) {
  return String(value || '').trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function profitTotal(dashboard) {
  return Number(dashboard?.profit?.total ?? dashboard?.profit ?? 0);
}

function friendlyError(error) {
  const message = error?.message || String(error || 'Something went wrong');
  if (/must have attendance/i.test(message)) return 'Attendance is required first. Record this labourer’s attendance for the selected property and work date, then create the work assignment.';
  if (/unique constraint.*work_assignment/i.test(message)) return 'This labourer already has the same work assignment for the selected block and date.';
  if (/foreign key constraint/i.test(message)) return 'One of the selected records is no longer available. Refresh and select it again.';
  return message;
}

export default function App() {
  const defaultApiBase = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_BASE;
  const apiBase = defaultApiBase;
  const [user, setUser] = useState(null);
  const [propertyId, setPropertyId] = useState('');
  const [meta, setMeta] = useState({});
  const [dashboard, setDashboard] = useState(null);
  const [data, setData] = useState({});
  const [screen, setScreen] = useState('home');
  const [activeModule, setActiveModule] = useState('attendanceQuick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITES);
  const [favoriteEditorOpen, setFavoriteEditorOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const navigationHistory = useRef([]);
  const t = uiTranslator(language);

  const property = (meta.properties || []).find(p => String(p.property_id) === String(propertyId));

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.user_id ? String(user.user_id) : '',
    'x-property-id': propertyId ? String(propertyId) : ''
  });

  async function request(path, options = {}) {
    const apiPath = path.replace(/^\/api(?=\/|$)/, '');
    const url = `${apiBase.replace(/\/$/, '')}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
    const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new Error(body?.error || String(body || text || `HTTP ${res.status}`));
    return body;
  }

  async function safe(task, quiet = false) {
    try { setLoading(true); setError(''); return await task(); }
    catch (e) { const message = friendlyError(e); setError(message); if (!quiet) Alert.alert('Unable to continue', message); }
    finally { setLoading(false); }
  }

  async function login(username, password) {
    await safe(async () => {
      const result = await request('/api/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
      setUser(result.user);
      setMeta(prev => ({ ...prev, properties: result.properties || [] }));
      if (result.properties?.[0]) setPropertyId(String(result.properties[0].property_id));
      navigationHistory.current = [];
      setScreen('home');
    });
  }

  async function loadAll() {
    if (!user) return;
    await safe(async () => {
      const historyFrom = new Date(); historyFrom.setFullYear(historyFrom.getFullYear() - 1);
      const historyQuery = `?from=${isoDate(historyFrom)}&to=${isoDate()}`;
      const [m, d, attendance, rainfall, yieldRows] = await Promise.all([
        request('/api/meta'), request('/api/dashboard'), request(`/api/attendance${historyQuery}`), request(`/api/rainfall${historyQuery}`), request(`/api/yield${historyQuery}`)
      ]);
      const nextMeta = { ...m };
      setMeta(nextMeta); setDashboard(d); setData(prev => ({...prev, attendance, rainfall, yield: yieldRows}));
      const pairs = await Promise.all(readResources.map(async r => [r, await request(`/api/${r}`).catch(() => [])]));
      const next = { attendance, rainfall, yield: yieldRows };
      pairs.forEach(([k,v]) => { next[k] = v || []; });
      metaMirror.forEach(k => { if (nextMeta[k] && !next[k]) next[k] = nextMeta[k]; });
      setData(next);
    }, true);
  }

  useEffect(() => { if (user && propertyId) loadAll(); }, [user, propertyId]);
  useEffect(() => { AsyncStorage.getItem(FAVORITES_KEY).then(value => { if (value) setFavorites(JSON.parse(value).slice(0, 8)); }).catch(() => {}); }, []);
  useEffect(() => { AsyncStorage.getItem(LANGUAGE_KEY).then(value => { if (value && I18N[value]) setLanguage(value); }).catch(() => {}); }, []);

  async function updateFavorites(next) {
    const limited = next.slice(0, 8);
    setFavorites(limited);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(limited));
  }

  async function changeLanguage(next) { setLanguage(next); await AsyncStorage.setItem(LANGUAGE_KEY,next); }
  function navigate(next) { if (next === screen) return; navigationHistory.current.push(screen); setScreen(next); }
  function goBack() { const previous = navigationHistory.current.pop(); if (previous) setScreen(previous); else if (screen !== 'home') setScreen('home'); }

  useEffect(() => {
    if (!user) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home' && !navigationHistory.current.length) return false;
      goBack(); return true;
    });
    return () => subscription.remove();
  }, [user,screen]);

  if (!user) return <Login onLogin={login} loading={loading} error={error} t={t} language={language} setLanguage={changeLanguage} />;

  const openModule = (key) => { setActiveModule(key); navigate(key === 'dashboardReport' ? 'reports' : 'module'); };

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor="#f5eee3" translucent={false} />
    <Header property={property} user={user} dateLabel={new Intl.DateTimeFormat('en-IN', { day:'numeric', month:'short', weekday:'short' }).format(new Date())} screen={screen} onBack={goBack} t={t} language={language} setLanguage={changeLanguage} />
    <PropertyBar properties={meta.properties || []} propertyId={propertyId} setPropertyId={setPropertyId} t={t} />
    <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAll} />} contentContainerStyle={styles.body}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {screen === 'home' && <Home dashboard={dashboard} data={data} openModule={openModule} favorites={favorites} editFavorites={() => setFavoriteEditorOpen(true)} property={property} t={t} language={language} />}
      {screen === 'add' && <QuickAdd openModule={openModule} t={t} language={language} />}
      {screen === 'modules' && <Modules openModule={openModule} t={t} language={language} />}
      {screen === 'reports' && <Reports dashboard={dashboard} data={data} openModule={openModule} t={t} />}
      {screen === 'more' && <More user={user} onLogout={() => setUser(null)} openModule={openModule} t={t} />}
      {screen === 'module' && <ModuleScreen moduleKey={activeModule} user={user} propertyId={propertyId} data={data} setData={setData} meta={meta} request={request} reload={loadAll} language={language} t={t} />}
    </ScrollView>
    <FavoriteEditor visible={favoriteEditorOpen} favorites={favorites} setFavorites={updateFavorites} close={() => setFavoriteEditorOpen(false)} />
    <BottomNav screen={screen} setScreen={navigate} t={t} />
  </SafeAreaView>;
}

function Login({ onLogin, loading, error, t, language, setLanguage }) {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('owner123');
  return <SafeAreaView style={styles.loginPage}>
    <StatusBar barStyle="dark-content" backgroundColor="#f3efe4" translucent={false} />
    <KeyboardAvoidingView style={styles.loginKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.loginScroll}>
        <Image source={require('./logo.png')} style={styles.logoImage} accessibilityLabel="JavaTerrain coffee bean logo" />
        <Text style={styles.loginTitle}>JavaTerrain</Text>
        <Text style={styles.loginSub}>{t('tagline')}</Text>
        <LanguagePicker language={language} setLanguage={setLanguage} t={t} compact login />
        <View style={styles.loginCard}>
          <FieldText label={t('username')} value={username} onChangeText={setUsername} returnKeyType="next" />
          <FieldText label={t('password')} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="done" onSubmitEditing={() => onLogin(username, password)} />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity disabled={loading} style={styles.primary} onPress={() => onLogin(username, password)}><Text style={styles.primaryText}>{loading ? t('connecting') : t('login')}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Header({ property, user, dateLabel, screen, onBack, t, language, setLanguage }) {
  return <View style={styles.header}>
    {screen !== 'home' && <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel={t('back')}><Text style={styles.backButtonText}>‹</Text></TouchableOpacity>}
    <View style={styles.headerCopy}><Text style={styles.smallCaps}>{t('today')}</Text></View>
    <View style={styles.headerMeta}><Text style={styles.date}>{dateLabel}</Text><Text numberOfLines={1} style={styles.location}>📍 {property?.property_name || t('selectProperty')}</Text><LanguagePicker language={language} setLanguage={setLanguage} t={t} compact /></View>
  </View>;
}
function monthStartDate(value=new Date()){const date=new Date(value);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`;}
function monthEndDate(value=new Date()){const date=new Date(value);return isoDate(new Date(date.getFullYear(),date.getMonth()+1,0));}

function LanguagePicker({ language, setLanguage, t, compact, login }) {
  const [open,setOpen] = useState(false);
  const selected = LANGUAGES.find(([code]) => code === language)?.[1] || 'English';
  return <><TouchableOpacity style={compact ? [styles.languageCompact,login && styles.loginLanguage] : styles.secondary} onPress={() => setOpen(true)}><Text style={styles.languageText}>🌐 {selected}</Text></TouchableOpacity><Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.modalBack}><View style={styles.modalCard}><Text style={styles.modalTitle}>{t('language')}: {selected}</Text>{LANGUAGES.map(([code,name]) => <TouchableOpacity key={code} style={[styles.option,code===language && styles.languageActive]} onPress={() => { setLanguage(code); setOpen(false); }}><Text style={styles.optionText}>{code===language?'✓ ':''}{name}</Text></TouchableOpacity>)}<TouchableOpacity style={styles.secondary} onPress={() => setOpen(false)}><Text style={styles.secondaryText}>{t('back')}</Text></TouchableOpacity></View></View></Modal></>;
}

function PropertyBar({ properties, propertyId, setPropertyId, t }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = properties.find(p => String(p.property_id) === String(propertyId));
  const filtered = properties.filter(p => `${p.property_name} ${p.address_1 || ''} ${p.property_id}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={styles.propertySelectorWrap}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('selectProperty')} style={styles.propertySelector} onPress={() => setOpen(true)}>
      <View style={styles.propertyBadge}><Text style={styles.propertyBadgeText}>J</Text></View>
      <View style={styles.propertySelectedCopy}>
        <Text style={styles.propertyEyebrow}>{t('currentProperty')}</Text>
        <Text numberOfLines={1} style={styles.propertySelectedName}>{selected?.property_name || t('selectProperty')}</Text>
        {!!selected?.address_1 && <Text numberOfLines={1} style={styles.propertySelectedAddress}>{selected.address_1}</Text>}
      </View>
      <View style={styles.propertyChange}><Text style={styles.propertyChangeText}>{t('select')}</Text><Text style={styles.propertyChevron}>⌄</Text></View>
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={styles.modalBack}>
        <View style={styles.propertyModal}>
          <View style={styles.propertyModalHead}><View><Text style={styles.modalTitle}>{t('selectProperty')}</Text><Text style={styles.propertyCount}>{properties.length} {t('propertiesAvailable')}</Text></View><TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}><Text style={styles.closeButtonText}>×</Text></TouchableOpacity></View>
          <TextInput value={query} onChangeText={setQuery} autoFocus placeholder={t('searchProperty')} placeholderTextColor="#8a796b" style={styles.propertySearch} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.propertyList}>
            {filtered.map(p => {
              const active = String(p.property_id) === String(propertyId);
              return <TouchableOpacity key={p.property_id} style={[styles.propertyOption,active && styles.propertyOptionActive]} onPress={() => { setPropertyId(String(p.property_id)); setOpen(false); setQuery(''); }}>
                <View style={[styles.propertyOptionMark,active && styles.propertyOptionMarkActive]}><Text style={[styles.propertyOptionMarkText,active && styles.propertyOptionMarkTextActive]}>{active ? '✓' : String(p.property_name || 'E').charAt(0).toUpperCase()}</Text></View>
                <View style={{flex:1}}><Text style={styles.propertyOptionName}>{p.property_name}</Text><Text numberOfLines={1} style={styles.propertyOptionMeta}>{p.address_1 || 'Estate property'} • ID {p.property_id}</Text></View>
              </TouchableOpacity>;
            })}
            {!filtered.length && <Text style={styles.propertyEmpty}>No matching properties found.</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </View>;
}

function weatherTheme(weather) {
  const code = weather?.current?.condition?.code || 1000;
  const text = (weather?.current?.condition?.text || '').toLowerCase();
  if (text.includes('thunder')) return { kind:'storm', icon:'⛈️', colors:['#152b46','#244c68'], accent:'#d9d36f' };
  if (text.includes('rain') || text.includes('drizzle') || [1063,1150,1153,1180,1183,1186,1189,1192,1195,1240,1243,1246].includes(code)) return { kind:'rain', icon:'🌧️', colors:['#245468','#39798a'], accent:'#bdeaff' };
  if (text.includes('cloud') || text.includes('overcast') || [1003,1006,1009].includes(code)) return { kind:'cloud', icon:'☁️', colors:['#607683','#8799a1'], accent:'#eef4f5' };
  if ((weather?.current?.temp_c || 0) >= 32) return { kind:'hot', icon:'☀️', colors:['#c75d19','#e99a26'], accent:'#fff2a8' };
  if ((weather?.current?.temp_c || 30) <= 16) return { kind:'cold', icon:'❄️', colors:['#3e7194','#6ba7c2'], accent:'#e8fbff' };
  return { kind:'sunny', icon:'☀️', colors:['#8a5527','#c18446'], accent:'#fff0a6' };
}

function WeatherHero({ property, t }) {
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState('');
  const [gpsState,setGpsState] = useState('checking');
  const [coordinates,setCoordinates] = useState(null);
  const motion = useRef(new Animated.Value(0)).current;
  const theme = weatherTheme(weather);

  async function requestLocation() {
    try {
      let enabled = await Location.hasServicesEnabledAsync();
      if (!enabled && Platform.OS === 'android') { try { await Location.enableNetworkProviderAsync(); } catch {} enabled = await Location.hasServicesEnabledAsync(); }
      if (!enabled) { setGpsState('off'); return null; }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setGpsState('denied'); return null; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const value = { latitude:position.coords.latitude, longitude:position.coords.longitude };
      setCoordinates(value); setGpsState('ready'); return value;
    } catch { setGpsState('off'); return null; }
  }

  async function loadWeather() {
    try {
      setWeatherError('');
      const propertyQuery = String(property?.pincode || '').trim() || [property?.address_1,property?.address_2].filter(Boolean).join(', ');
      const gps = coordinates;
      const query = propertyQuery || (gps ? `${gps.latitude},${gps.longitude}` : 'bengaluru');
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?q=${encodeURIComponent(query)}&key=${WEATHER_API_KEY}`);
      const body = await response.json();
      if (!response.ok || body.error) throw new Error(body.error?.message || 'Weather unavailable');
      setWeather(body);
    } catch (error) { setWeatherError(error.message || 'Weather unavailable'); }
  }

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    loadWeather();
    const timer = setInterval(loadWeather, 10 * 60 * 1000);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue:1, duration:1800, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      Animated.timing(motion, { toValue:0, duration:1800, easing:Easing.inOut(Easing.sin), useNativeDriver:true })
    ]));
    animation.start();
    return () => { clearInterval(timer); animation.stop(); };
  }, [property?.property_id,property?.pincode,property?.address_1,property?.address_2,coordinates?.latitude,coordinates?.longitude]);

  const drift = motion.interpolate({ inputRange:[0,1], outputRange:[-5,7] });
  const pulse = motion.interpolate({ inputRange:[0,1], outputRange:[0.92,1.08] });
  const current = weather?.current;
  return <>{gpsState !== 'ready' && <View style={styles.gpsBanner}><Text style={styles.gpsText}>{gpsState === 'checking' ? t('allowLocation') : gpsState === 'denied' ? t('permissionDenied') : t('gpsRequired')}</Text><TouchableOpacity style={styles.gpsButton} onPress={gpsState === 'denied' ? Linking.openSettings : requestLocation}><Text style={styles.gpsButtonText}>{gpsState === 'denied' ? t('settings') : gpsState === 'checking' ? t('allowLocation') : t('enableGps')}</Text></TouchableOpacity></View>}<View style={[styles.weatherHero, {backgroundColor:theme.colors[0]}]}>
    <View style={[styles.weatherGlow, {backgroundColor:theme.colors[1]}]} />
    <View style={styles.weatherCopy}>
      <Text style={styles.weatherPlace}>{weather?.location?.name || 'Bengaluru'} • LIVE</Text>
      <Text style={styles.weatherCondition}>{current?.condition?.text || (weatherError ? t('weatherUnavailable') : t('updatingWeather'))}</Text>
      <Text style={styles.weatherTemperature}>{current ? `${Math.round(current.temp_c)}°C` : '--°'}</Text>
      <Text style={styles.weatherFeels}>{t('feelsLike')} {current ? `${Math.round(current.feelslike_c)}°C` : '--'}  •  {t('wind')} {current?.wind_kph ?? '--'} km/h</Text>
    </View>
    <Animated.View style={[styles.weatherArt, {transform:[{translateX:drift},{scale:pulse}]}]}>
      {current?.condition?.icon ? <Image source={{uri:`https:${current.condition.icon}`}} style={styles.weatherIconImage} /> : <Text style={styles.weatherEmoji}>{theme.icon}</Text>}
    </Animated.View>
    {(theme.kind === 'rain' || theme.kind === 'storm') && <View style={styles.rainLayer}>{[0,1,2,3,4,5,6].map(i => <Animated.View key={i} style={[styles.rainDrop,{left:10+i*18,transform:[{translateY:motion.interpolate({inputRange:[0,1],outputRange:[-8,55]})}]}]} />)}</View>}
    <View style={styles.weatherMetrics}>
      <View><Text style={styles.metricLabel}>{t('humidity')}</Text><Text style={styles.metricValue}>{current?.humidity ?? '--'}%</Text></View>
      <View><Text style={styles.metricLabel}>{t('rain')}</Text><Text style={styles.metricValue}>{current?.precip_mm ?? '--'} mm</Text></View>
      <View><Text style={styles.metricLabel}>UV</Text><Text style={styles.metricValue}>{current?.uv ?? '--'}</Text></View>
      <TouchableOpacity onPress={loadWeather}><Text style={[styles.weatherRefresh,{color:theme.accent}]}>{t('refresh')}</Text></TouchableOpacity>
    </View>
  </View></>;
}

function Home({ dashboard, data, openModule, favorites, editFavorites, property, t, language }) {
  const summary = [
    [moduleName(language,'labors'), dashboard?.attendance?.entries || data.labors?.length || 0, '👥'], [t('rain'), `${dashboard?.rainfall?.total || 0} mm`, '🌧️'], [moduleName(language,'plants'), dashboard?.plantInventoryTotal?.total_plants || 0, '🌱']
  ];
  return <View>
    <WeatherHero property={property} t={t} />
    <View style={styles.grid}>{summary.map(s => <View key={s[0]} style={styles.stat}><Text style={styles.statIcon}>{s[2]}</Text><Text style={styles.statValue}>{s[1]}</Text><Text style={styles.statLabel}>{s[0]}</Text></View>)}</View>
    <Section title={t('quickAdd')} right={`${favorites.length}/8`}><IconGrid items={[...favorites.map(key => QUICK_ACTIONS.find(a => a[2] === key)).filter(Boolean).map(([title,icon,key])=>[moduleName(language,key),icon,key]),[t('more'),'•••','favorites']]} openModule={openModule} onMore={editFavorites} /></Section>
  </View>;
}

function FavoriteEditor({ visible, favorites, setFavorites, close }) {
  const toggle = key => {
    if (favorites.includes(key)) return setFavorites(favorites.filter(item => item !== key));
    if (favorites.length >= 8) return Alert.alert('Shortcut limit', 'You can select up to 8 favorite modules. Remove one before adding another.');
    setFavorites([...favorites, key]);
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
    <View style={styles.modalBack}><View style={styles.favoriteModal}>
      <View style={styles.favoriteHead}><View><Text style={styles.modalTitle}>Favorite shortcuts</Text><Text style={styles.favoriteHint}>Choose up to 8 • saved on this device</Text></View><TouchableOpacity style={styles.closeButton} onPress={close}><Text style={styles.closeButtonText}>×</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.favoriteList}>{QUICK_ACTIONS.map(([title,icon,key]) => {
        const active = favorites.includes(key);
        return <TouchableOpacity key={key} style={[styles.favoriteRow,active && styles.favoriteRowActive]} onPress={() => toggle(key)}><Text style={styles.favoriteIcon}>{icon}</Text><Text style={styles.favoriteName}>{title}</Text><View style={[styles.favoriteCheck,active && styles.favoriteCheckActive]}><Text style={styles.favoriteCheckText}>{active ? '✓' : '+'}</Text></View></TouchableOpacity>;
      })}</ScrollView>
      <TouchableOpacity style={styles.primary} onPress={close}><Text style={styles.primaryText}>Done ({favorites.length}/8)</Text></TouchableOpacity>
    </View></View>
  </Modal>;
}

function QuickAdd({ openModule, t, language }) {
  return <View><Text style={styles.screenTitle}>{t('quickAdd')}</Text><IconGrid items={QUICK_ACTIONS.map(([title,icon,key])=>[moduleName(language,key),icon,key])} openModule={openModule} /></View>;
}

function Modules({ openModule, t, language }) {
  return <View><Text style={styles.screenTitle}>{t('modules')}</Text>{moduleGroups.map(g => <View key={g.key} style={styles.card}><Text style={styles.sectionTitle}>{g.icon} {GROUP_NAMES[language]?.[g.key] || g.title}</Text>{g.items.map(i => <TouchableOpacity key={i} style={styles.moduleRow} onPress={() => openModule(i)}><Text style={styles.moduleName}>{moduleName(language,i)}</Text><Text style={styles.chev}>›</Text></TouchableOpacity>)}</View>)}</View>;
}

function Reports({ dashboard, data, openModule, t = translator('en') }) {
  const reportCards = [
    ['Rainfall Report', `${dashboard?.rainfall?.total || 0} mm`, '🌧️', 'rainfallQuick'], ['Expense Report', `₹${dashboard?.expenses?.total || 0}`, '💵', 'expenses'], ['Labour Report', `${dashboard?.attendance?.labor_days || 0} days`, '👥', 'attendanceQuick'], ['Plant Report', `${dashboard?.plantInventoryTotal?.total_plants || 0}`, '🌱', 'plantInventory'], ['Work Report', `${dashboard?.workAssignmentTotal?.entries || 0}`, '🧑‍🌾', 'workAssignments'], ['Profit Report', `₹${profitTotal(dashboard).toLocaleString('en-IN')}`, '📊', 'reports']
  ];
  return <View><Text style={styles.screenTitle}>{t('reports')}</Text><View style={styles.grid}>{reportCards.map(r => <TouchableOpacity key={r[0]} style={styles.reportCard} onPress={() => openModule(r[3])}><Text style={styles.statIcon}>{r[2]}</Text><Text style={styles.reportValue}>{r[1]}</Text><Text style={styles.statLabel}>{r[0]}</Text></TouchableOpacity>)}</View><Section title="Recent Attendance"><RecordList rows={data.attendance || []} /></Section><Section title="Plant Distribution"><RecordList rows={dashboard?.plantByType || data.plantInventory || []} /></Section></View>;
}

function More({ user, onLogout, openModule, t = translator('en') }) {
  return <View><Text style={styles.screenTitle}>More</Text><View style={styles.card}><Text style={styles.sectionTitle}>Account</Text><Text style={styles.note}>Logged in as {user?.username}</Text><TouchableOpacity style={styles.secondary} onPress={onLogout}><Text style={styles.secondaryText}>Logout</Text></TouchableOpacity></View><Section title="Secure & Reliable"><IconGrid items={[['Offline First Ready','📴','settings'],['Multi Language Ready','🌐','settings'],['Backup / Restore','💾','settings'],['Notifications','🔔','notifications']]} openModule={openModule} /></Section></View>;
}

function ModuleScreen({ moduleKey, user, propertyId, data, setData, meta, request, reload, language, t }) {
  const endpoint = resourceOf[moduleKey] || moduleKey;
  const [form, setForm] = useState(defaultForm(moduleKey, propertyId));
  const [editingId, setEditingId] = useState(null);
  const rows = data[endpoint] || data[moduleKey] || [];
  const [fromDate, setFromDate] = useState(yesterdayDate());
  const [toDate, setToDate] = useState(isoDate());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const parentBlocks = moduleKey === 'plantInventory' ? (data.blocks || []).filter(block => !block.parent_block_id) : [];
  const subBlocks = moduleKey === 'plantInventory' && form.block_id ? (data.blocks || []).filter(block => String(block.parent_block_id) === String(form.block_id)) : [];
  const laborOptions = data.labors?.length ? data.labors : (meta.labors || []);
  const laborIdForAttendance = item => {
    if (item?.labor_id != null) return String(item.labor_id);
    const attendanceName = normalizedName(item?.labor_name || item?.name);
    const labor = laborOptions.find(candidate => normalizedName(candidate.name || candidate.labor_name) === attendanceName);
    return labor?.labor_id != null ? String(labor.labor_id) : '';
  };
  const attendedLaborIds = moduleKey === 'workAssignments' ? new Set((data.attendance || []).filter(item => String(item.entry_date || '').slice(0,10) === String(form.work_date || '').slice(0,10)).map(laborIdForAttendance).filter(Boolean)) : new Set();
  const availableAssignmentLabors = moduleKey === 'workAssignments' ? laborOptions.map(item => ({ ...item, assignment_label: `${item.name || item.labor_name || `Labour #${item.labor_id}`} — ${attendedLaborIds.has(String(item.labor_id)) ? 'attendance recorded' : 'attendance missing'}` })) : [];
  const fields = (fieldConfig[moduleKey] || []).map(field => {
    if (field[0] === 'block_id' && parentBlocks.length) return ['block_id','select','Block','availableParentBlocks','block_id','block_name'];
    if (field[0] === 'sub_block_name' && subBlocks.length) return ['sub_block_name','select','Sub-block / Section','availableSubBlocks','block_name','block_name',true];
    if (field[0] === 'labor_id' && moduleKey === 'workAssignments') return ['labor_id','select','Labour','availableAssignmentLabors','labor_id','assignment_label'];
    return field;
  }).map(field => [field[0],field[1],fieldName(language,field[0],field[2]),...field.slice(3)]);
  const fieldData = { ...data, availableParentBlocks: parentBlocks, availableSubBlocks: subBlocks, availableAssignmentLabors };
  const hasDateFilter = Boolean(DATE_FIELDS[moduleKey]);
  const filteredRows = hasDateFilter ? rows.filter(row => { const date = recordDate(row,moduleKey); return date && date >= fromDate && date <= toDate; }) : rows;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setForm(defaultForm(moduleKey, propertyId)); setEditingId(null); setFromDate(yesterdayDate()); setToDate(isoDate()); setPage(1); }, [moduleKey, propertyId]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount]);

  async function save() {
    if (moduleKey === 'settings') return Alert.alert('Saved', 'API settings updated.');
    const payload = { ...form, property_id: form.property_id || propertyId, user_id: user.user_id, created_by: user.username };
    fields.forEach(([key,type,,,,,optional]) => { if (type === 'select' && optional && payload[key] === '') payload[key] = null; });
    const missingField = fields.find(([key]) => (requiredFields[moduleKey] || []).includes(key) && (form[key] == null || String(form[key]).trim() === ''));
    if (missingField) return Alert.alert('Required field', `Select or enter ${missingField[2]} before saving.`);
    if (moduleKey === 'attendanceQuick' && !optionSets.attendanceOptions.some(item => String(item.id) === String(form.attendance_value))) return Alert.alert('Attendance required', 'Select Full Day, Half Day, Absent, Hourly, or another attendance value before saving.');
    if (moduleKey === 'workAssignments' && !attendedLaborIds.has(String(form.labor_id))) return Alert.alert('Attendance required', 'The selected labourer does not have attendance for this property and work date. Save attendance first, then return to Work Assignment.');
    try {
      await request(`/api/${endpoint}${editingId ? `/${editingId}` : ''}`, { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setForm(defaultForm(moduleKey, propertyId));
      const wasEditing = Boolean(editingId);
      setEditingId(null);
      await reload();
      Alert.alert(wasEditing ? 'Updated' : 'Saved', `${labels[moduleKey]} ${wasEditing ? 'updated' : 'saved'}.`);
    } catch (error) { Alert.alert('Could not save', friendlyError(error)); }
  }
  async function remove(row) {
    const id = rowId(row);
    if (!id) return Alert.alert('Info', 'This record cannot be deleted because its identifier is missing.');
    Alert.alert('Delete?', itemTitle(row), [{text:'Cancel'}, {text:'Delete', style:'destructive', onPress: async () => { try { await request(`/api/${endpoint}/${id}`, { method:'DELETE' }); await reload(); } catch (error) { Alert.alert('Could not delete', friendlyError(error)); } }}]);
  }

  function edit(row) {
    const id = rowId(row);
    if (!id) return Alert.alert('Info', 'This record cannot be edited because its identifier is missing.');
    const next = defaultForm(moduleKey, propertyId);
    fields.forEach(([key]) => {
      let value = row[key];
      if (value == null && key === 'recorded_date') value = row.date_time;
      if (value == null && key === 'picking_date') value = row.yield_settlement_date;
      if (value != null) next[key] = key.includes('date') ? String(value).slice(0,10) : String(value);
    });
    setForm(next);
    setEditingId(id);
  }

  if (moduleKey === 'notifications') return <View><Text style={styles.screenTitle}>Notifications</Text><Section title="Today"><Suggestion danger text="Heavy rain expected tomorrow." /><Suggestion warning text="Wage sheet generated for today." /><Suggestion warning text="Expense limit crossed this month." /><Suggestion text="New labour added: Ramesh." /></Section></View>;
  if (moduleKey === 'dashboardReport') return <Reports dashboard={data.dashboard} data={data} openModule={()=>{}} />;
  if (moduleKey === 'attendanceQuick') return <AttendanceGrid user={user} propertyId={propertyId} data={data} request={request} reload={reload} language={language} t={t} />;

  return <View><Text style={styles.screenTitle}>{moduleName(language,moduleKey)}</Text><View style={styles.card}>{editingId && <Text style={styles.editingBanner}>{t('edit')} #{editingId}</Text>}{fields.map(f => <SmartField key={f[0]} field={f} value={form[f[0]]} setValue={(v) => setForm(f[0] === 'block_id' && moduleKey === 'plantInventory' ? {...form,block_id:v,sub_block_name:''} : {...form,[f[0]]:v})} meta={meta} data={fieldData} t={t} />)}{moduleKey === 'workAssignments' && form.work_date && !attendedLaborIds.size && <Text style={styles.inlineWarning}>No matching attendance is loaded for {form.work_date}. Labourers remain visible below; records without attendance cannot be assigned.</Text>}<TouchableOpacity style={styles.primary} onPress={save}><Text style={styles.primaryText}>{editingId ? t('update') : t('save')}</Text></TouchableOpacity>{editingId && <TouchableOpacity style={styles.secondary} onPress={() => { setForm(defaultForm(moduleKey, propertyId)); setEditingId(null); }}><Text style={styles.secondaryText}>{t('cancelEdit')}</Text></TouchableOpacity>}</View><Section title={t('records')} right={`${filteredRows.length} ${t('entries')}`}>{hasDateFilter && <DateRangeFilter fromDate={fromDate} toDate={toDate} setFromDate={value => { setFromDate(value); setPage(1); }} setToDate={value => { setToDate(value); setPage(1); }} t={t} language={language} />}<RecordList rows={visibleRows} moduleKey={moduleKey} data={data} meta={meta} onEdit={edit} onDelete={remove} empty={t('noRecords')} language={language} /><Pagination page={page} pageCount={pageCount} setPage={setPage} t={t} /></Section></View>;
}

function AttendanceGrid({ user, propertyId, data, request, reload, language, t }) {
  const copy=ATTENDANCE_TEXT[language] || ATTENDANCE_TEXT.en;
  const [entryDate,setEntryDate]=useState(isoDate());
  const [pickerOpen,setPickerOpen]=useState(false);
  const [selections,setSelections]=useState({});
  const [saving,setSaving]=useState(false);
  const [editingDay,setEditingDay]=useState(false);
  const [fromDate,setFromDate]=useState(monthStartDate());
  const [toDate,setToDate]=useState(monthEndDate());
  const belongsToProperty=item => item?.property_id == null || String(item.property_id)===String(propertyId);
  const labours=(data.labors || []).filter(belongsToProperty);
  const records=(data.attendance || []).filter(belongsToProperty);
  const datedRecords=records.filter(row=>String(row.entry_date || '').slice(0,10)===entryDate);
  const nameOf=id => labours.find(l=>String(l.labor_id)===String(id))?.name || records.find(r=>String(r.labor_id)===String(id))?.labor_name || `#${id}`;
  const valueLabel=value => String(value)==='1' ? copy.full : String(value)==='0.5' ? copy.half : copy.absent;

  useEffect(()=>{
    const next={}; datedRecords.forEach(row=>{next[String(row.labor_id)]=String(row.attendance_value);});
    setSelections(next); setEditingDay(false);
  },[propertyId,entryDate,data.attendance]);

  async function saveAttendance(){
    const selected=labours.filter(l=>selections[String(l.labor_id)]!=null);
    if(!selected.length) return Alert.alert(copy.attendance, copy.mark);
    setSaving(true);
    try {
      for(const labour of selected){
        const existing=datedRecords.find(row=>String(row.labor_id)===String(labour.labor_id));
        const id=existing && rowId(existing);
        const payload={labor_id:labour.labor_id,property_id:propertyId,entry_date:entryDate,attendance_value:Number(selections[String(labour.labor_id)]),user_id:user.user_id,created_by:user.username};
        await request(`/api/attendance${id ? `/${id}` : ''}`,{method:id?'PATCH':'POST',body:JSON.stringify(payload)});
      }
      await reload(); setEditingDay(false); Alert.alert(t('save'),`${copy.save} (${selected.length})`);
    } catch(error){ Alert.alert('Could not save',friendlyError(error)); }
    finally{setSaving(false);}
  }

  function clearAttendance(){
    if(!datedRecords.length) return;
    Alert.alert(copy.clear,`${copy.clear}: ${entryDate}?`,[{text:t('cancelEdit'),style:'cancel'},{text:copy.clear,style:'destructive',onPress:async()=>{
      setSaving(true);
      try{
        for(const record of datedRecords){const id=rowId(record);if(id)await request(`/api/attendance/${id}`,{method:'DELETE'});}
        setSelections({}); await reload(); Alert.alert(copy.attendance,copy.clear);
      }catch(error){Alert.alert('Could not clear attendance',friendlyError(error));}
      finally{setSaving(false);}
    }}]);
  }

  const choices=[[copy.full,'1'],[copy.half,'0.5'],[copy.absent,'0']];
  return <View><View style={styles.attendanceTitleRow}><Text style={styles.screenTitle}>{moduleName(language,'attendanceQuick')}</Text><TouchableOpacity style={styles.attendanceDate} onPress={()=>setPickerOpen(true)}><Text style={styles.attendanceDateText}>📅 {entryDate}</Text></TouchableOpacity></View>
    {pickerOpen && <DateTimePicker locale={localeFor(language)} value={new Date(`${entryDate}T12:00:00`)} mode="date" maximumDate={new Date()} onChange={(event,date)=>{setPickerOpen(Platform.OS==='ios'); if(event.type!=='dismissed'&&date)setEntryDate(isoDate(date));}} />}
    <Section title={copy.mark} right={`${labours.length}`}>
      {!labours.length ? <Text style={styles.muted}>{copy.empty}</Text> : <>{datedRecords.length>0&&!editingDay&&<View style={styles.attendancePresent}><Text style={styles.attendancePresentText}>{copy.present}</Text></View>}<View style={styles.attendanceGridHeader}><Text style={[styles.attendanceHeadText,styles.attendanceNameCell]}>{copy.labour}</Text>{choices.map(([label,value])=><Text key={value} numberOfLines={2} style={styles.attendanceChoiceHead}>{label}</Text>)}</View>{labours.map(labour=>{const id=String(labour.labor_id);const locked=datedRecords.length>0&&!editingDay;return <View key={`attendance-${propertyId}-${id}`} style={[styles.attendanceGridRow,locked&&styles.attendanceLocked]}><Text numberOfLines={2} style={[styles.attendanceLabour,styles.attendanceNameCell]}>{labour.name || labour.labor_name || `#${id}`}</Text>{choices.map(([label,value])=><TouchableOpacity disabled={locked} key={value} accessibilityRole="radio" accessibilityState={{selected:selections[id]===value,disabled:locked}} accessibilityLabel={`${labour.name}, ${label}`} style={styles.attendanceChoiceCell} onPress={()=>setSelections(current=>({...current,[id]:value}))}><View style={[styles.radioOuter,selections[id]===value&&styles.radioSelected]}>{selections[id]===value&&<View style={styles.radioInner}/>}</View></TouchableOpacity>)}</View>;})}{datedRecords.length>0&&!editingDay?<View style={styles.attendanceActions}><TouchableOpacity style={[styles.primary,styles.attendanceAction]} onPress={()=>setEditingDay(true)}><Text style={styles.primaryText}>{copy.edit}</Text></TouchableOpacity><TouchableOpacity disabled={saving} style={[styles.clearAttendance,styles.attendanceAction]} onPress={clearAttendance}><Text style={styles.clearAttendanceText}>{copy.clear}</Text></TouchableOpacity></View>:<TouchableOpacity disabled={saving} style={[styles.primary,saving&&styles.pageDisabled]} onPress={saveAttendance}><Text style={styles.primaryText}>{saving?t('connecting'):`${copy.save} (${Object.keys(selections).length})`}</Text></TouchableOpacity>}</>}
    </Section>
    <AttendanceSummary records={records} labours={labours} fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} copy={copy} language={language} t={t}/>
  </View>;
}

function AttendanceSummary({records,labours,fromDate,toDate,setFromDate,setToDate,copy,language,t}){
  const [page,setPage]=useState(1);
  const [selectedLabour,setSelectedLabour]=useState(null);
  const pageSize=10;
  const ranged=records.filter(row=>{const date=String(row.entry_date||'').slice(0,10);return date>=fromDate&&date<=toDate;});
  const uniqueByDay=new Map();
  ranged.forEach(row=>uniqueByDay.set(`${row.labor_id}-${String(row.entry_date||'').slice(0,10)}`,row));
  const uniqueRecords=[...uniqueByDay.values()];
  const summaries=labours.map(labour=>{
    const laborRecords=uniqueRecords.filter(row=>String(row.labor_id)===String(labour.labor_id));
    return {id:String(labour.labor_id),name:labour.name||labour.labor_name||`#${labour.labor_id}`,days:laborRecords.reduce((sum,row)=>sum+Math.max(0,Number(row.attendance_value)||0),0),records:laborRecords.filter(row=>Number(row.attendance_value)>0).sort((a,b)=>String(b.entry_date).localeCompare(String(a.entry_date)))};
  }).sort((a,b)=>a.name.localeCompare(b.name));
  const pageCount=Math.max(1,Math.ceil(summaries.length/pageSize));
  const pageRows=summaries.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>{setPage(1);setSelectedLabour(null);},[fromDate,toDate]);
  useEffect(()=>{if(page>pageCount)setPage(pageCount);},[page,pageCount]);
  const formatDays=value=>Number.isInteger(value)?String(value):value.toFixed(1);
  const valueLabel=value=>String(value)==='1'?copy.full:String(value)==='0.5'?copy.half:copy.absent;
  return <Section title={copy.saved} right={`${summaries.length} ${t('entries')}`}><DateRangeFilter fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} resetFrom={monthStartDate()} resetTo={monthEndDate()} maximumDate={new Date(`${monthEndDate()}T12:00:00`)} t={t} language={language}/><View style={styles.summaryGridHeader}><Text style={[styles.summaryHead,styles.summaryName]}>{copy.labour}</Text><Text style={styles.summaryHead}>{copy.days}</Text><Text style={styles.summaryViewHead}>{copy.view}</Text></View>{pageRows.map(row=><TouchableOpacity key={`attendance-summary-${row.id}`} style={styles.summaryGridRow} onPress={()=>setSelectedLabour(row)}><Text numberOfLines={2} style={[styles.summaryCell,styles.summaryName]}>{row.name}</Text><Text style={styles.summaryDays}>{formatDays(row.days)}</Text><Text style={styles.summaryChevron}>›</Text></TouchableOpacity>)}<Pagination page={page} pageCount={pageCount} setPage={setPage} t={t}/><Modal visible={Boolean(selectedLabour)} transparent animationType="slide" onRequestClose={()=>setSelectedLabour(null)}><View style={styles.modalBack}><View style={styles.modalCard}><Text style={styles.modalTitle}>{selectedLabour?.name}</Text><Text style={styles.attendanceDetailRange}>{fromDate} → {toDate} · {copy.days}: {formatDays(selectedLabour?.days||0)}</Text><ScrollView>{selectedLabour?.records.length?selectedLabour.records.map((row,index)=><View key={`attendance-date-${selectedLabour.id}-${String(row.entry_date).slice(0,10)}-${index}`} style={styles.attendanceDateRow}><Text style={styles.attendanceDetailDate}>{String(row.entry_date).slice(0,10)}</Text><Text style={styles.attendanceDetailValue}>{valueLabel(row.attendance_value)}</Text></View>):<Text style={styles.muted}>{t('noRecords')}</Text>}</ScrollView><TouchableOpacity style={styles.secondary} onPress={()=>setSelectedLabour(null)}><Text style={styles.secondaryText}>{t('close')}</Text></TouchableOpacity></View></View></Modal></Section>;
}

function SmartField({ field, value, setValue, meta, data, t }) {
  const [open, setOpen] = useState(false);
  const [key, type, label, source, idKey, nameKey, optional] = field;
  if (type !== 'select') return <FieldText label={label} value={String(value ?? '')} onChangeText={setValue} keyboardType={type === 'number' ? 'numeric' : 'default'} placeholder={type === 'date' ? 'YYYY-MM-DD' : label} />;
  const rawOpts = optionSets[source] || (meta[source]?.length ? meta[source] : data[source]) || [];
  const opts = rawOpts.filter((option,index,list) => list.findIndex(candidate => String(candidate?.[idKey]) === String(option?.[idKey])) === index);
  const selected = opts.find(o => String(o[idKey]) === String(value));
  return <View style={{marginBottom:12}}><Text style={styles.label}>{label}{optional ? ` (${t('optional')})` : ''}</Text><TouchableOpacity style={styles.inputButton} onPress={() => setOpen(true)}><Text style={selected ? styles.inputText : styles.placeholder}>{selected ? (optionLabel(selected,nameKey) || selected[idKey]) : `${t('selectPrefix')} ${label}`}</Text></TouchableOpacity><Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><View style={styles.modalBack}><View style={styles.modalCard}><Text style={styles.modalTitle}>{label}</Text><ScrollView>{optional && <TouchableOpacity style={styles.option} onPress={() => { setValue(''); setOpen(false); }}><Text>{t('none')}</Text></TouchableOpacity>}{opts.map((o,index) => <TouchableOpacity key={`select-${source}-${String(o[idKey])}-${index}`} style={styles.option} onPress={() => { setValue(String(o[idKey])); setOpen(false); }}><Text style={styles.optionText}>{optionLabel(o,nameKey) || o[idKey]}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.secondary} onPress={() => setOpen(false)}><Text style={styles.secondaryText}>{t('close')}</Text></TouchableOpacity></View></View></Modal></View>;
}

function DateRangeFilter({ fromDate, toDate, setFromDate, setToDate, t, language, resetFrom=yesterdayDate(), resetTo=isoDate(), maximumDate }) {
  const [picker, setPicker] = useState(null);
  const todayValue = new Date(`${isoDate()}T12:00:00`);
  const apply = (type, date) => {
    const next = isoDate(date);
    if (type === 'from') {
      const earliest = new Date(`${toDate}T12:00:00`); earliest.setFullYear(earliest.getFullYear() - 1);
      if (date > new Date(`${toDate}T12:00:00`)) return Alert.alert('Invalid date range', 'From date cannot be after To date.');
      if (date < earliest) return Alert.alert('Range too large', 'The maximum date range is one year.');
      setFromDate(next);
    } else {
      const start = new Date(`${fromDate}T12:00:00`);
      if (date < start) return Alert.alert('Invalid date range', 'To date cannot be before From date.');
      const latest = new Date(start); latest.setFullYear(latest.getFullYear() + 1);
      if (date > latest) return Alert.alert('Range too large', 'The maximum date range is one year.');
      setToDate(next);
    }
  };
  return <View style={styles.dateFilter}>
    <View style={styles.dateFilterHead}><Text style={styles.dateFilterTitle}>{t('historyPeriod')}</Text><TouchableOpacity onPress={() => { setFromDate(resetFrom); setToDate(resetTo); }}><Text style={styles.dateReset}>{t('reset')}</Text></TouchableOpacity></View>
    <View style={styles.dateButtons}>
      <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('from')}><Text style={styles.dateButtonLabel}>{t('from')}</Text><Text style={styles.dateButtonValue}>{fromDate}</Text></TouchableOpacity>
      <Text style={styles.dateArrow}>→</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('to')}><Text style={styles.dateButtonLabel}>{t('to')}</Text><Text style={styles.dateButtonValue}>{toDate}</Text></TouchableOpacity>
    </View>
    {!!picker && <DateTimePicker locale={localeFor(language)} value={new Date(`${picker === 'from' ? fromDate : toDate}T12:00:00`)} mode="date" maximumDate={picker === 'to' ? (maximumDate||todayValue) : new Date(`${toDate}T12:00:00`)} minimumDate={picker === 'to' ? new Date(`${fromDate}T12:00:00`) : undefined} onChange={(event,date) => { setPicker(Platform.OS === 'ios' ? picker : null); if (event.type !== 'dismissed' && date) apply(picker,date); }} />}
  </View>;
}

function Pagination({ page, pageCount, setPage, t }) {
  if (pageCount <= 1) return null;
  return <View style={styles.pagination}><TouchableOpacity disabled={page === 1} style={[styles.pageButton,page === 1 && styles.pageDisabled]} onPress={() => setPage(page - 1)}><Text style={styles.pageButtonText}>{t('previous')}</Text></TouchableOpacity><Text style={styles.pageStatus}>{t('page')} {page} {t('of')} {pageCount}</Text><TouchableOpacity disabled={page === pageCount} style={[styles.pageButton,page === pageCount && styles.pageDisabled]} onPress={() => setPage(page + 1)}><Text style={styles.pageButtonText}>{t('next')}</Text></TouchableOpacity></View>;
}

const referenceFields = {
  labor_id:['labors','labor_id','name','Labour'], block_id:['blocks','block_id','block_name','Block'], property_id:['properties','property_id','property_name','Property'],
  work_activity_id:['workActivities','work_activity_id','work_activity_name','Activity'], plant_id:['plants','plant_id','plant_type','Plant'], vendor_id:['vendors','vendor_id','vendorname','Vendor'],
  expensetype_id:['expenseTypes','expensetype_id','expense_name','Expense type'], yieldtype_id:['yieldTypes','yieldtype_id','yieldtype_name','Yield type'], yieldrate_id:['yieldRates','yieldrate_id','yield_rate_label','Yield rate']
};

function recordDetails(row, data, meta, language='en') {
  return Object.entries(row).filter(([key,value]) => value != null && value !== '' && !['created_by','modified_by','created_on','modified_on','user_id'].includes(key)).map(([key,value]) => {
    if (referenceFields[key]) {
      const [source,idKey,nameKey,label] = referenceFields[key];
      const match = (data[source] || meta[source] || []).find(item => String(item[idKey]) === String(value));
      return [fieldName(language,key,label), optionLabel(match,nameKey) || `Unknown (${value})`];
    }
    if (key.endsWith('_id')) return null;
    const label = fieldName(language,key,key.replaceAll('_',' ').replace(/\b\w/g, letter => letter.toUpperCase()));
    return [label,value];
  }).filter(Boolean).slice(0, 6);
}

function FieldText({ label, value, onChangeText, ...props }) { return <View style={{marginBottom:12}}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} autoCapitalize="none" placeholderTextColor="#9c9a91" {...props} /></View>; }
function Section({ title, right, children }) { return <View style={styles.card}><View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{right && <Text style={styles.sectionRight}>{right}</Text>}</View>{children}</View>; }
function Suggestion({ text, danger, warning }) { return <View style={styles.suggestion}><Text>{danger ? '🔴' : warning ? '🟠' : '🟢'}</Text><Text style={styles.suggestionText}>{text}</Text></View>; }
function IconGrid({ items, openModule, onMore }) { return <View style={styles.iconGrid}>{items.map(([t,ic,key],index) => <TouchableOpacity key={`${key}-${t}-${index}`} style={styles.iconTile} onPress={() => key === 'favorites' ? onMore?.() : openModule(key)}><Text style={styles.icon}>{ic}</Text><Text style={styles.iconLabel}>{t}</Text></TouchableOpacity>)}</View>; }
function RecordList({ rows = [], empty = 'No records in this period.', moduleKey, data = {}, meta = {}, onEdit, onDelete, language='en' }) { if (!rows?.length) return <Text style={styles.muted}>{empty}</Text>; return <View>{rows.map((r,i) => { const details = recordDetails(r,data,meta,language); const preferredTitle = r.labor_name || r.work_activity_name || r.block_name || r.property_name || r.name || details[0]?.[1] || itemTitle(r); return <View key={`${rowId(r) || 'row'}-${i}`} style={styles.record}><View style={{flex:1}}><Text style={styles.recordTitle}>{preferredTitle}</Text>{details.map(([label,value],detailIndex) => <View key={`detail-${label}-${detailIndex}`} style={styles.recordDetail}><Text style={styles.recordLabel}>{label}</Text><Text style={styles.recordValue}>{String(value)}</Text></View>)}</View><View style={styles.recordActions}>{onEdit && <TouchableOpacity accessibilityLabel="Edit record" onPress={() => onEdit(r)}><Text style={styles.edit}>✏️</Text></TouchableOpacity>}{onDelete && <TouchableOpacity accessibilityLabel="Delete record" onPress={() => onDelete(r)}><Text style={styles.delete}>🗑️</Text></TouchableOpacity>}</View></View>; })}</View>; }
function BottomNav({ screen, setScreen, t }) { const nav = [['home',t('home'),'🏠'],['add',t('add'),'＋'],['modules',t('modules'),'📋'],['reports',t('reports'),'📊'],['more',t('more'),'☰']]; return <View style={styles.bottom}>{nav.map(n => <TouchableOpacity key={n[0]} style={styles.navItem} onPress={() => setScreen(n[0])}><Text style={[styles.navIcon, screen===n[0] && styles.navActive]}>{n[2]}</Text><Text numberOfLines={1} style={[styles.navText, screen===n[0] && styles.navActive]}>{n[1]}</Text></TouchableOpacity>)}</View>; }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:SOFT,paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0},content:{flex:1}, body:{padding:12,paddingBottom:Platform.OS==='android'?132:108}, header:{minHeight:72,paddingHorizontal:12,paddingTop:10,paddingBottom:9,backgroundColor:'#fbf5eb',borderBottomWidth:1,borderBottomColor:LINE,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:9},backButton:{width:34,height:34,borderRadius:12,backgroundColor:'#ead9c4',alignItems:'center',justifyContent:'center'},backButtonText:{fontSize:30,lineHeight:31,color:GREEN,fontWeight:'700'},headerCopy:{flex:1,minWidth:0},headerMeta:{width:132,alignItems:'flex-end'},smallCaps:{fontWeight:'900',fontSize:15,color:DARK}, headerTitle:{fontSize:12,color:'#644b38',marginTop:3}, date:{fontSize:11,color:'#6d5847'}, location:{fontSize:11,color:DARK,fontWeight:'700',marginTop:3,maxWidth:132}, user:{fontSize:10,color:'#777',marginTop:2,maxWidth:124},languageCompact:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:10,paddingHorizontal:9,paddingVertical:5,marginTop:6},loginLanguage:{alignSelf:'center',marginTop:10,marginBottom:18,paddingHorizontal:14,paddingVertical:8},languageText:{fontSize:10,color:DARK,fontWeight:'900'},languageActive:{backgroundColor:'#f1dfc9'},
  propertySelectorWrap:{backgroundColor:'#fbf5eb',paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:LINE},propertySelector:{minHeight:62,flexDirection:'row',alignItems:'center',backgroundColor:'#fffaf2',borderWidth:1.5,borderColor:'#c9ad8d',borderRadius:15,paddingHorizontal:12,paddingVertical:9,elevation:2,shadowColor:'#4a2b18',shadowOpacity:.1,shadowRadius:5},propertyBadge:{width:38,height:38,borderRadius:12,backgroundColor:'#ead9c4',alignItems:'center',justifyContent:'center',marginRight:10},propertyBadgeText:{color:GREEN,fontWeight:'900',fontSize:18},propertySelectedCopy:{flex:1,minWidth:0},propertyEyebrow:{fontSize:9,color:'#846b57',fontWeight:'900',letterSpacing:.7},propertySelectedName:{fontSize:15,color:DARK,fontWeight:'900',marginTop:1},propertySelectedAddress:{fontSize:10,color:'#776252',marginTop:1},propertyChange:{flexDirection:'row',alignItems:'center',backgroundColor:'#f0dfca',paddingHorizontal:10,paddingVertical:7,borderRadius:12,marginLeft:8},propertyChangeText:{fontSize:11,color:GREEN,fontWeight:'900'},propertyChevron:{fontSize:17,color:GREEN,fontWeight:'900',marginLeft:4,marginTop:-3},
  propertyModal:{backgroundColor:'#fffdf8',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,maxHeight:'82%'},propertyModalHead:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},propertyCount:{fontSize:11,color:'#727b74',marginTop:-5,marginBottom:12},closeButton:{width:34,height:34,borderRadius:17,backgroundColor:'#eef0eb',alignItems:'center',justifyContent:'center'},closeButtonText:{fontSize:25,color:DARK,lineHeight:27},propertySearch:{backgroundColor:'#fff',borderWidth:1.5,borderColor:'#c5cec6',borderRadius:13,paddingHorizontal:14,paddingVertical:12,color:'#17291d',fontSize:14,marginBottom:10},propertyList:{paddingBottom:24},propertyOption:{flexDirection:'row',alignItems:'center',padding:12,borderBottomWidth:1,borderBottomColor:'#ece9e0',borderRadius:12},propertyOptionActive:{backgroundColor:'#edf7ee',borderBottomColor:'#d5ead8'},propertyOptionMark:{width:38,height:38,borderRadius:12,backgroundColor:'#f0f0ec',alignItems:'center',justifyContent:'center',marginRight:11},propertyOptionMarkActive:{backgroundColor:GREEN},propertyOptionMarkText:{fontWeight:'900',color:'#59645c'},propertyOptionMarkTextActive:{color:'#fff'},propertyOptionName:{fontSize:14,fontWeight:'900',color:DARK},propertyOptionMeta:{fontSize:10,color:'#6e786f',marginTop:3},propertyEmpty:{textAlign:'center',color:'#737b75',paddingVertical:30},
  loginPage:{flex:1,backgroundColor:'#f3efe4',paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0},loginKeyboard:{flex:1},loginScroll:{flexGrow:1,justifyContent:'center',paddingHorizontal:22,paddingTop:24,paddingBottom:36},logoImage:{alignSelf:'center',width:92,height:92,borderRadius:22,marginBottom:10},loginTitle:{fontSize:31,fontWeight:'900',color:GREEN,textAlign:'center'},loginSub:{backgroundColor:GREEN,color:'#fff',alignSelf:'center',paddingHorizontal:16,paddingVertical:7,borderRadius:18,overflow:'hidden',marginTop:7,marginBottom:16,fontWeight:'800'},loginCard:{backgroundColor:'#fffdf8',borderRadius:18,padding:16,borderWidth:1,borderColor:LINE},note:{fontSize:12,color:'#675',marginBottom:10},error:{color:'#b00020',fontWeight:'700',marginVertical:8},
  card:{backgroundColor:'#fffdf8',borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:LINE,shadowColor:'#000',shadowOpacity:.05,shadowRadius:8,elevation:1}, screenTitle:{fontSize:22,fontWeight:'900',color:DARK,marginBottom:12}, sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}, sectionTitle:{fontSize:15,fontWeight:'900',color:DARK}, sectionRight:{fontSize:11,color:'#777'},
  gpsBanner:{backgroundColor:'#fff2d8',borderWidth:1,borderColor:'#d9ad67',borderRadius:14,padding:11,marginBottom:10,flexDirection:'row',alignItems:'center',gap:8},gpsText:{flex:1,color:'#66431e',fontSize:11,fontWeight:'700'},gpsButton:{backgroundColor:GREEN,borderRadius:9,paddingHorizontal:10,paddingVertical:8},gpsButtonText:{color:'#fff',fontSize:10,fontWeight:'900'},weatherHero:{minHeight:220,borderRadius:22,padding:18,marginBottom:12,overflow:'hidden',shadowColor:'#3d2416',shadowOpacity:.2,shadowRadius:12,elevation:5}, weatherGlow:{position:'absolute',right:-55,top:-60,width:210,height:210,borderRadius:105,opacity:.72}, weatherCopy:{zIndex:2,maxWidth:'67%'}, weatherPlace:{color:'rgba(255,255,255,.78)',fontSize:11,fontWeight:'900',letterSpacing:1}, weatherCondition:{color:'#fff',fontSize:18,fontWeight:'900',marginTop:8}, weatherTemperature:{color:'#fff',fontSize:46,fontWeight:'900',lineHeight:54}, weatherFeels:{color:'rgba(255,255,255,.9)',fontSize:11,fontWeight:'600'}, weatherArt:{position:'absolute',right:18,top:28,zIndex:2}, weatherIconImage:{width:96,height:96}, weatherEmoji:{fontSize:70}, rainLayer:{position:'absolute',right:8,top:78,width:145,height:74,overflow:'hidden'}, rainDrop:{position:'absolute',top:0,width:2,height:16,borderRadius:2,backgroundColor:'rgba(190,235,255,.75)',transform:[{rotate:'14deg'}]}, weatherMetrics:{position:'absolute',left:18,right:18,bottom:15,zIndex:3,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',backgroundColor:'rgba(0,0,0,.16)',borderRadius:13,paddingHorizontal:12,paddingVertical:9}, metricLabel:{color:'rgba(255,255,255,.72)',fontSize:9,textTransform:'uppercase'}, metricValue:{color:'#fff',fontSize:13,fontWeight:'900',marginTop:2}, weatherRefresh:{fontSize:11,fontWeight:'900',paddingVertical:5},
  weather:{width:168,backgroundColor:'#c88315',borderRadius:18,padding:14,marginBottom:12}, weatherRain:{backgroundColor:'#126247'}, weatherTop:{color:'#fff',fontWeight:'900'}, temp:{color:'#fff',fontWeight:'900',fontSize:28,marginVertical:10}, weatherSub:{color:'#fff',fontSize:12}, weatherFoot:{flexDirection:'row',justifyContent:'space-between',marginTop:14}, weatherMoney:{color:'#fff',fontWeight:'800',fontSize:11}, grid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:12}, stat:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, statIcon:{fontSize:22}, statValue:{fontSize:20,fontWeight:'900',color:GREEN,marginTop:6}, statLabel:{fontSize:12,color:'#5d675f',fontWeight:'700'}, reportCard:{width:'47.8%',backgroundColor:'#fffdf8',borderWidth:1,borderColor:LINE,borderRadius:16,padding:14}, reportValue:{fontSize:17,fontWeight:'900',color:DARK,marginVertical:4},
  iconGrid:{flexDirection:'row',flexWrap:'wrap',gap:10}, iconTile:{width:'30.6%',alignItems:'center',paddingVertical:12,borderWidth:1,borderColor:LINE,borderRadius:14,backgroundColor:'#fff'}, icon:{fontSize:23}, iconLabel:{fontSize:11,textAlign:'center',color:DARK,fontWeight:'700',marginTop:5}, suggestion:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:7}, suggestionText:{fontSize:13,color:'#37433b'}, moduleRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee8da'}, moduleName:{fontSize:14,fontWeight:'800',color:DARK}, chev:{fontSize:28,color:GREEN},
  favoriteModal:{backgroundColor:'#fffdf8',borderTopLeftRadius:24,borderTopRightRadius:24,padding:18,maxHeight:'88%'},favoriteHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},favoriteHint:{fontSize:11,color:'#6f786f',marginTop:-5,marginBottom:10},favoriteList:{paddingBottom:10},favoriteRow:{flexDirection:'row',alignItems:'center',padding:11,borderWidth:1,borderColor:'#ebe7dc',borderRadius:13,marginBottom:7,backgroundColor:'#fff'},favoriteRowActive:{backgroundColor:'#edf7ee',borderColor:'#b8d9bd'},favoriteIcon:{fontSize:20,width:34},favoriteName:{flex:1,fontSize:13,fontWeight:'800',color:DARK},favoriteCheck:{width:28,height:28,borderRadius:9,backgroundColor:'#ecece7',alignItems:'center',justifyContent:'center'},favoriteCheckActive:{backgroundColor:GREEN},favoriteCheckText:{fontSize:16,color:'#fff',fontWeight:'900'},
  label:{fontSize:12,fontWeight:'800',color:DARK,marginBottom:6}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:11,color:'#222'}, inputButton:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:12,paddingHorizontal:12,paddingVertical:13}, inputText:{color:'#222'}, placeholder:{color:'#9c9a91'}, primary:{backgroundColor:GREEN,borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:4}, primaryText:{color:'#fff',fontWeight:'900'}, secondary:{borderWidth:1,borderColor:GREEN,borderRadius:12,paddingVertical:12,alignItems:'center',marginTop:8}, secondaryText:{color:GREEN,fontWeight:'900'},editingBanner:{backgroundColor:'#e7f3e8',color:GREEN,fontWeight:'900',padding:10,borderRadius:10,marginBottom:12},inlineWarning:{backgroundColor:'#fff2d8',color:'#765010',fontWeight:'700',padding:10,borderRadius:10,marginBottom:10},
  dateFilter:{backgroundColor:'#f4f7f2',borderRadius:13,padding:10,marginBottom:6,borderWidth:1,borderColor:'#dce5da'},dateFilterHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},dateFilterTitle:{fontSize:11,fontWeight:'900',color:DARK},dateReset:{fontSize:11,fontWeight:'900',color:GREEN},dateButtons:{flexDirection:'row',alignItems:'center'},dateButton:{flex:1,backgroundColor:'#fff',borderWidth:1,borderColor:'#cbd4ca',borderRadius:10,paddingHorizontal:10,paddingVertical:8},dateButtonLabel:{fontSize:8,fontWeight:'900',color:'#758078'},dateButtonValue:{fontSize:12,fontWeight:'800',color:DARK,marginTop:2},dateArrow:{paddingHorizontal:8,color:GREEN,fontWeight:'900'},pagination:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},pageButton:{backgroundColor:'#e7f3e8',borderRadius:10,paddingHorizontal:13,paddingVertical:9},pageDisabled:{opacity:.35},pageButtonText:{fontSize:11,color:GREEN,fontWeight:'900'},pageStatus:{fontSize:11,color:'#687268',fontWeight:'700'},
  attendanceTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},attendanceDate:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:11,paddingHorizontal:10,paddingVertical:9,marginBottom:12},attendanceDateText:{fontSize:11,fontWeight:'800',color:DARK},attendancePresent:{backgroundColor:'#fff2d8',borderWidth:1,borderColor:'#d9ad67',borderRadius:10,padding:10,marginBottom:9},attendancePresentText:{fontSize:11,fontWeight:'800',color:'#684618'},attendanceGridHeader:{minHeight:44,flexDirection:'row',alignItems:'center',backgroundColor:'#f4eadc',borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:1,borderColor:LINE},attendanceGridRow:{minHeight:54,flexDirection:'row',alignItems:'stretch',backgroundColor:'#fff',borderLeftWidth:1,borderRightWidth:1,borderBottomWidth:1,borderColor:'#eadfce'},attendanceLocked:{opacity:.72},attendanceNameCell:{width:'40%'},attendanceHeadText:{fontSize:11,fontWeight:'900',color:DARK,paddingHorizontal:8},attendanceChoiceHead:{flex:1,textAlign:'center',fontSize:10,fontWeight:'900',color:DARK,paddingHorizontal:2},attendanceLabour:{fontSize:12,fontWeight:'800',color:DARK,paddingHorizontal:8,alignSelf:'center'},attendanceChoiceCell:{flex:1,alignItems:'center',justifyContent:'center',minWidth:44,minHeight:52},radioOuter:{width:24,height:24,borderRadius:12,borderWidth:1.5,borderColor:'#9b8069',alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:GREEN,borderWidth:2},radioInner:{width:12,height:12,borderRadius:6,backgroundColor:GREEN},attendanceActions:{flexDirection:'row',gap:8,marginTop:4},attendanceAction:{flex:1},clearAttendance:{borderWidth:1.5,borderColor:'#b42318',borderRadius:12,paddingVertical:13,alignItems:'center',marginTop:4},clearAttendanceText:{color:'#b42318',fontWeight:'900'},savedGridHeader:{minHeight:40,flexDirection:'row',alignItems:'center',backgroundColor:'#f4eadc',borderWidth:1,borderColor:LINE,borderTopLeftRadius:10,borderTopRightRadius:10},savedGridRow:{minHeight:48,flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderLeftWidth:1,borderRightWidth:1,borderBottomWidth:1,borderColor:'#eadfce'},savedHead:{flex:1,fontSize:9,fontWeight:'900',color:DARK,paddingHorizontal:4,textAlign:'center'},savedName:{flex:1.25,textAlign:'left'},savedEditHead:{width:42,fontSize:9,fontWeight:'900',color:DARK,textAlign:'center'},savedCell:{flex:1,fontSize:9.5,color:'#44372d',paddingHorizontal:4,textAlign:'center'},savedEditButton:{width:42,minHeight:44,alignItems:'center',justifyContent:'center'},
  attendanceTitleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},attendanceDate:{backgroundColor:'#fff',borderWidth:1,borderColor:LINE,borderRadius:11,paddingHorizontal:10,paddingVertical:9,marginBottom:12},attendanceDateText:{fontSize:11,fontWeight:'800',color:DARK},attendancePresent:{backgroundColor:'#fff2d8',borderWidth:1,borderColor:'#d9ad67',borderRadius:10,padding:10,marginBottom:9},attendancePresentText:{fontSize:11,fontWeight:'800',color:'#684618'},attendanceGridHeader:{minHeight:44,flexDirection:'row',alignItems:'center',backgroundColor:'#f4eadc',borderTopLeftRadius:10,borderTopRightRadius:10,borderWidth:1,borderColor:LINE},attendanceGridRow:{minHeight:54,flexDirection:'row',alignItems:'stretch',backgroundColor:'#fff',borderLeftWidth:1,borderRightWidth:1,borderBottomWidth:1,borderColor:'#eadfce'},attendanceLocked:{opacity:.72},attendanceNameCell:{width:'40%'},attendanceHeadText:{fontSize:11,fontWeight:'900',color:DARK,paddingHorizontal:8},attendanceChoiceHead:{flex:1,textAlign:'center',fontSize:10,fontWeight:'900',color:DARK,paddingHorizontal:2},attendanceLabour:{fontSize:12,fontWeight:'800',color:DARK,paddingHorizontal:8,alignSelf:'center'},attendanceChoiceCell:{flex:1,alignItems:'center',justifyContent:'center',minWidth:44,minHeight:52},radioOuter:{width:24,height:24,borderRadius:12,borderWidth:1.5,borderColor:'#9b8069',alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:GREEN,borderWidth:2},radioInner:{width:12,height:12,borderRadius:6,backgroundColor:GREEN},attendanceActions:{flexDirection:'row',gap:8,marginTop:4},attendanceAction:{flex:1},clearAttendance:{borderWidth:1.5,borderColor:'#b42318',borderRadius:12,paddingVertical:13,alignItems:'center',marginTop:4},clearAttendanceText:{color:'#b42318',fontWeight:'900'},summaryGridHeader:{minHeight:42,flexDirection:'row',alignItems:'center',backgroundColor:'#f4eadc',borderWidth:1,borderColor:LINE,borderTopLeftRadius:10,borderTopRightRadius:10},summaryGridRow:{minHeight:50,flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderLeftWidth:1,borderRightWidth:1,borderBottomWidth:1,borderColor:'#eadfce'},summaryHead:{flex:1,fontSize:10,fontWeight:'900',color:DARK,textAlign:'center',paddingHorizontal:5},summaryName:{flex:1.7,textAlign:'left'},summaryViewHead:{width:62,fontSize:9,fontWeight:'900',color:DARK,textAlign:'center'},summaryCell:{fontSize:11,color:DARK,fontWeight:'800',paddingHorizontal:8},summaryDays:{flex:1,fontSize:14,color:GREEN,fontWeight:'900',textAlign:'center'},summaryChevron:{width:62,fontSize:26,color:GREEN,fontWeight:'800',textAlign:'center'},attendanceDetailRange:{fontSize:11,color:'#765f4c',fontWeight:'700',marginTop:-4,marginBottom:10},attendanceDateRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee4d6'},attendanceDetailDate:{fontSize:13,color:DARK,fontWeight:'800'},attendanceDetailValue:{fontSize:12,color:GREEN,fontWeight:'900'},
  record:{flexDirection:'row',gap:8,backgroundColor:'#fff',borderWidth:1,borderColor:'#eee8da',borderRadius:12,padding:12,marginTop:8},recordTitle:{fontWeight:'900',color:DARK,marginBottom:7,fontSize:14},recordDetail:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:2},recordLabel:{fontSize:10,color:'#7a827b',flex:1},recordValue:{fontSize:11,color:'#344039',fontWeight:'700',flex:1.4,textAlign:'right'},recordLine:{fontSize:11,color:'#616b63'},recordActions:{gap:12,alignItems:'center'},edit:{fontSize:18,marginLeft:6},delete:{fontSize:19,marginLeft:6},muted:{color:'#777',fontSize:13,paddingVertical:14,textAlign:'center'},
  modalBack:{flex:1,backgroundColor:'rgba(0,0,0,.35)',justifyContent:'flex-end'}, modalCard:{backgroundColor:'#fffdf8',borderTopLeftRadius:22,borderTopRightRadius:22,padding:18,maxHeight:'80%'}, modalTitle:{fontSize:18,fontWeight:'900',color:DARK,marginBottom:10}, option:{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#eee'}, optionText:{fontWeight:'800',color:DARK}, optionSub:{fontSize:11,color:'#777'},
  bottom:{position:'absolute',left:12,right:12,bottom:Platform.OS==='android'?36:12,backgroundColor:'#fffdf8',borderRadius:22,borderWidth:1,borderColor:LINE,flexDirection:'row',paddingVertical:8,shadowColor:'#000',shadowOpacity:.12,shadowRadius:10,elevation:8}, navItem:{flex:1,alignItems:'center',minWidth:0}, navIcon:{fontSize:20,color:'#777'}, navText:{fontSize:9,color:'#777',fontWeight:'800',maxWidth:'96%',textAlign:'center'}, navActive:{color:GREEN}
});
