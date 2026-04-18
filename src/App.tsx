import { useState, useRef, useEffect } from "react";
import { 
  Activity, 
  Upload, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  Loader2,
  Check,
  ChevronLeft,
  User,
  Heart,
  Globe,
  Zap,
  Dna,
  Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { analyzeWellness, HealthData, LabReportFile } from "./services/geminiService";
import { cn } from "./lib/utils";

type Language = "English" | "Hindi" | "Marathi";

const translations = {
  English: {
    title: "WellnessAI",
    subtitle: "Your Human-Centered Health Companion",
    disclaimer: "⚠️ IMPORTANT: This is an AI-powered analysis for educational purposes. Consult a pro before medical changes!",
    next: "Next Step ✨",
    back: "Go Back",
    analyze: "Create My Plan 🚀",
    steps: {
      step1: "About You 👋",
      step2: "Your Diet 🥗",
      step3: "Health Data 🧪",
      step4: "Final Review 🌈",
    },
    fields: {
      name: "How should we call you? 😊",
      age: "Age 🎂",
      weight: "Weight (kg) ⚖️",
      height: "Height (cm) 📏",
      lifestyle: "Your Daily Rhythm 🏃‍♂️",
      healthConditions: "Health Conditions & Concerns 🏥",
      healthConditionsPlaceholder: "Example: I have mild acidity and lower back pain...",
      diet: "Eating Preference 🍽️",
      meatPref: "Which proteins do you enjoy? 🍗",
      upload: "Upload your Medical Report PDF 📄",
      disclaimerCheck: "I understand this is a guide to help me learn, not medical advice. ❤️",
    },
    lifestyleOptions: ["Quiet & Calm (Sedentary)", "A Little Movement (Lightly Active)", "Active & On-the-go (Moderately Active)", "Super Energetic (Very Active)"],
    dietOptions: ["Pure Veg 🥦", "Vegan Life 🌱", "Everything (Non-Veg) 🍗"],
    meatOptions: ["Eggs 🥚", "Chicken 🍗", "Fish 🐟", "Lamb 🥩", "Beef 🥩", "Pork 🥓"],
    status: "Companion Active ✨",
    pending: "Waiting for your story...",
    processing: ["Reading your biology... 🧬", "Decoding lab markers... 🧪", "Crafting nourishment... 🥗", "Personalizing your journey... 🕊️"],
  },
  Hindi: {
    title: "कल्याणAI",
    subtitle: "आपका स्वास्थ्य साथी",
    disclaimer: "⚠️ महत्वपूर्ण: यह शैक्षिक उद्देश्यों के लिए एक AI विश्लेषण है। चिकित्सा सलाह के लिए डॉक्टर से मिलें!",
    next: "अगला कदम ✨",
    back: "पीछे हटें",
    analyze: "योजना बनाएं 🚀",
    steps: {
      step1: "आपके बारे में 👋",
      step2: "आहार पसंद 🥗",
      step3: "स्वास्थ्य रिपोर्ट 🧪",
      step4: "अंतिम समीक्षा 🌈",
    },
    fields: {
      name: "हम आपको क्या कह कर बुलाएं? 😊",
      age: "आयु 🎂",
      weight: "वजन (किलो) ⚖️",
      height: "ऊंचाई (सेमी) 📏",
      lifestyle: "दैनिक दिनचर्या 🏃‍♂️",
      healthConditions: "स्वास्थ्य स्थितियाँ और चिंताएँ 🏥",
      healthConditionsPlaceholder: "उदाहरण: मुझे हल्की एसिडिटी और पीठ के निचले हिस्से में दर्द है...",
      diet: "भोजन प्राथमिकता 🍽️",
      meatPref: "कौन सा प्रोटीन पसंद है? 🍗",
      upload: "मेडिकल रिपोर्ट PDF अपलोड करें 📄",
      disclaimerCheck: "मैं समझता हूं कि यह सीखने के लिए है, चिकित्सा सलाह नहीं। ❤️",
    },
    lifestyleOptions: ["शांत (Sedentary)", "हल्का सक्रिय", "सक्रिय", "अत्यधिक सक्रिय"],
    dietOptions: ["शाकाहारी 🥦", "वेगन 🌱", "मांसाहारी 🍗"],
    meatOptions: ["अंडा 🥚", "चिकन 🍗", "मछली 🐟", "मटन 🥩", "बीफ 🥩", "पोर्क 🥓"],
    status: "साथी सक्रिय ✨",
    pending: "आपकी जानकारी का इंतज़ार...",
    processing: ["जीव विज्ञान पढ़ रहे हैं... 🧬", "मार्कर्स की जांच... 🧪", "पोषण तैयार कर रहे हैं... 🥗", "आपकी यात्रा सजा रहे हैं... 🕊️"],
  },
  Marathi: {
    title: "कल्याणAI",
    subtitle: "तुमचा आरोग्य सोबती",
    disclaimer: "⚠️ महत्वाची सूचना: हे केवळ शैक्षणिक उद्देशांसाठी आहे. वैद्यकीय बदलांसाठी डॉक्टरांशी बोला!",
    next: "पुढील पाऊल ✨",
    back: "मागे जा",
    analyze: "योजना तयार करा 🚀",
    steps: {
      step1: "तुमच्याबद्दल 👋",
      step2: "आहार निवडी 🥗",
      step3: "आरोग्य अहवाल 🧪",
      step4: "अंतिम आढावा 🌈",
    },
    fields: {
      name: "आम्ही तुम्हाला काय नावाने हाक मारू? 😊",
      age: "वय 🎂",
      weight: "वजन (किलो) ⚖️",
      height: "ऊंची (सेमी) 📏",
      lifestyle: "दैनंदिन हालचाल 🏃‍♂️",
      healthConditions: "आरोग्य स्थिती आणि चिंता 🏥",
      healthConditionsPlaceholder: "उदाहरण: मला थोडी ॲसिडिटी आणि कंबरदुखी आहे...",
      diet: "आहार निवड 🍽️",
      meatPref: "तुम्हाला कोणते प्रोटीन आवडते? 🍗",
      upload: "वैद्यकीय अहवाल PDF अपलोड करा 📄",
      disclaimerCheck: "मला समजले आहे की हा फक्त मार्गदर्शक आहे, वैद्यकीय सल्ला नाही. ❤️",
    },
    lifestyleOptions: ["शांत", "थोडी हालचाल", "सक्रिय", "खूप सक्रिय"],
    dietOptions: ["शाकाहारी 🥦", "वेगन 🌱", "मांसाहारी 🍗"],
    meatOptions: ["अंडी 🥚", "चिकन 🍗", "मासे 🐟", "मटण 🥩", "बीफ 🥩", "पोर्क 🥓"],
    status: "सोबती कार्यरत ✨",
    pending: "तुमच्या माहितीची वाट पाहत आहोत...",
    processing: ["आरोग्य वाचत आहोत... 🧬", "अहवाल तपासत आहोत... 🧪", "पोषण ठरवत आहोत... 🥗", "तुमचा प्रवास आखत आहोत... 🕊️"],
  }
};

export default function App() {
  const [language, setLanguage] = useState<Language>("English");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logStatus, setLogStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const [labData, setLabData] = useState<HealthData>({
    name: "",
    age: 30,
    weight: 70,
    height: 170,
    diet: "Veg",
    meatPreferences: [],
    activityLevel: "Sedentary",
    healthConditions: "",
    language: "English"
  });

  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % t.processing.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading, t.processing.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => {
    if (!disclaimerAccepted) {
      setError("Please accept the disclaimer to proceed.");
      return;
    }
    setLoading(true);
    setLoadingTextIndex(0);
    setError(null);
    setLogStatus(null);
    setResult(null);
    setStep(5); // Show results view (which will show loader since loading=true and result=null)

    try {
      let labReport: LabReportFile | undefined;
      if (file) {
        const base64 = await fileToBase64(file);
        labReport = {
          data: base64,
          mimeType: file.type
        };
      }

      const analysis = await analyzeWellness({ ...labData, language }, labReport);
      if (analysis) {
        setResult(analysis);
        
        // Log to Google Sheets
        try {
          const logResp = await fetch("/api/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...labData, language })
          });
          const logData = await logResp.json();
          if (!logData.success) {
            setLogStatus({ success: false, message: logData.error || "Sync failed" });
          } else {
            setLogStatus({ success: true, message: "Synced to sheets! ✅" });
          }
        } catch (logErr) {
          console.warn("Failed to log to Sheet:", logErr);
          setLogStatus({ success: false, message: "Connection to logging server failed" });
        }
      } else {
        throw new Error("Failed to generate analysis.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
      setStep(4); // Reset if failed
    } finally {
      setLoading(false);
    }
  };

  const toggleMeat = (meat: string) => {
    const current = labData.meatPreferences || [];
    if (current.includes(meat)) {
      setLabData({ ...labData, meatPreferences: current.filter(m => m !== meat) });
    } else {
      setLabData({ ...labData, meatPreferences: [...current, meat] });
    }
  };

  const sections = result ? result.split("##").filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-bento-bg text-bento-text font-sans selection:bg-green-100 selection:text-green-900 overflow-x-hidden pb-24">
      {/* Top Disclaimer Header */}
      <div className="bg-bento-disclaimer-bg border-b border-bento-disclaimer-border text-bento-disclaimer-text px-6 py-2 text-[10px] font-bold text-center uppercase tracking-wider">
        {t.disclaimer}
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-bento-border px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-bento-accent p-2 rounded-2xl text-white shadow-lg shadow-green-100 transition-transform hover:scale-110">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight text-gray-900 leading-none">
              {t.title}
            </h1>
            <p className="text-[10px] text-bento-label font-bold uppercase tracking-widest mt-1">
              {t.subtitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-bento-border shadow-inner">
            {(["English", "Hindi", "Marathi"] as const).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setLabData(prev => ({ ...prev, language: lang }));
                }}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all",
                  language === lang ? "bg-bento-accent text-white shadow-md shadow-green-100" : "text-bento-label hover:bg-gray-100 hover:text-bento-text"
                )}
              >
                {lang === "English" ? "EN" : lang === "Hindi" ? "HI" : "MR"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {step < 5 ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 md:space-y-12"
            >
              {/* Progress Indicator */}
              <div className="flex justify-between items-center max-w-2xl mx-auto relative px-4 md:px-10">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className="flex flex-col items-center gap-2 md:gap-3 flex-1 relative">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-sm font-bold transition-all z-10 border-2",
                      step >= s ? "bg-bento-accent border-bento-accent text-white shadow-xl shadow-green-100" : "bg-white border-bento-border text-bento-label"
                    )}>
                      {step > s ? <Check size={16} /> : s}
                    </div>
                    <span className={cn(
                      "text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-center",
                      step >= s ? "text-bento-accent" : "text-bento-label"
                    )}>
                      {t.steps[`step${s}` as keyof typeof t.steps]}
                    </span>
                    {s < 4 && (
                      <div className={cn(
                        "absolute top-5 md:top-6 left-1/2 w-full h-[1px] md:h-[2px] -z-0",
                        step > s ? "bg-bento-accent" : "bg-bento-border"
                      )} />
                    )}
                  </div>
                ))}
              </div>

              <div className="bento-card overflow-hidden !rounded-2xl md:!rounded-[2rem]">
                <div className="p-6 md:p-12">
                  {/* Step 1: Basic Details */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-bento-border pb-6">
                        <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                          <User size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-heading font-bold text-gray-900">{t.steps.step1}</h2>
                          <p className="text-sm text-bento-label font-medium italic">Let's get specialized for you...</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.name}</label>
                          <input 
                            type="text"
                            placeholder="Type your name..."
                            value={labData.name}
                            onChange={(e) => setLabData({...labData, name: e.target.value})}
                            className="w-full bg-gray-50/50 border-2 border-transparent border-b-bento-border focus:border-b-bento-accent px-4 py-4 focus:outline-none font-semibold text-lg transition-all rounded-t-xl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.age}</label>
                            <input 
                              type="number"
                              value={labData.age}
                              onChange={(e) => setLabData({...labData, age: Number(e.target.value)})}
                              className="w-full bg-gray-50 border-2 border-bento-border rounded-2xl px-4 py-4 focus:outline-none focus:border-bento-accent font-bold transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.weight}</label>
                            <input 
                              type="number"
                              value={labData.weight}
                              onChange={(e) => setLabData({...labData, weight: Number(e.target.value)})}
                              className="w-full bg-gray-50 border-2 border-bento-border rounded-2xl px-4 py-4 focus:outline-none focus:border-bento-accent font-bold transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.height}</label>
                          <input 
                            type="number"
                            value={labData.height}
                            onChange={(e) => setLabData({...labData, height: Number(e.target.value)})}
                            className="w-full bg-gray-50 border-2 border-bento-border rounded-2xl px-4 py-4 focus:outline-none focus:border-bento-accent font-bold transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.lifestyle}</label>
                          <div className="relative">
                            <select 
                              value={labData.activityLevel}
                              onChange={(e) => setLabData({...labData, activityLevel: e.target.value})}
                              className="w-full bg-gray-50 border-2 border-bento-border rounded-2xl px-4 py-4 focus:outline-none focus:border-bento-accent font-bold appearance-none cursor-pointer transition-all"
                            >
                              {t.lifestyleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-bento-label rotate-90 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.healthConditions}</label>
                          <textarea 
                            value={labData.healthConditions}
                            onChange={(e) => setLabData({...labData, healthConditions: e.target.value})}
                            placeholder={t.fields.healthConditionsPlaceholder}
                            className="w-full bg-gray-50 border-2 border-bento-border rounded-2xl px-4 py-4 focus:outline-none focus:border-bento-accent font-bold min-h-[120px] transition-all resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Diet Preferences */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      <div className="flex items-center gap-4 border-b border-bento-border pb-6">
                        <div className="bg-green-100 p-3 rounded-2xl text-green-600">
                          <Heart size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-heading font-bold text-gray-900">{t.steps.step2}</h2>
                          <p className="text-sm text-bento-label font-medium italic">What fuels your soul? 🥙</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.diet}</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {t.dietOptions.map((d, i) => {
                              const vals = ["Veg", "Vegan", "Non-Veg"];
                              const val = vals[i];
                              return (
                                <button
                                  key={val}
                                  onClick={() => setLabData({...labData, diet: val})}
                                  className={cn(
                                    "relative py-5 px-6 rounded-[1.5rem] border-2 text-sm font-bold transition-all group overflow-hidden",
                                    labData.diet === val ? "bg-bento-accent border-bento-accent text-white shadow-xl shadow-green-100" : "bg-white border-bento-border text-bento-label hover:border-bento-accent/30"
                                  )}
                                >
                                  <span className="relative z-10">{d}</span>
                                  {labData.diet === val && <motion.div layoutId="diet-bg" className="absolute inset-0 bg-bento-accent" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {labData.diet === "Non-Veg" && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-6 pt-4 border-t border-bento-border/50"
                          >
                            <label className="text-xs font-bold uppercase tracking-wider text-bento-label ml-1">{t.fields.meatPref}</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {t.meatOptions.map((m, i) => {
                                const vals = ["Egg", "Chicken", "Fish", "Lamb", "Beef", "Pork"];
                                const val = vals[i];
                                const selected = labData.meatPreferences?.includes(val);
                                return (
                                  <button
                                    key={val}
                                    onClick={() => toggleMeat(val)}
                                    className={cn(
                                      "py-4 px-5 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-between group",
                                      selected ? "bg-green-50 text-bento-accent border-bento-accent shadow-sm" : "bg-white border-bento-border text-bento-label hover:bg-gray-50"
                                    )}
                                  >
                                    {m}
                                    <div className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                      selected ? "bg-bento-accent text-white scale-110" : "border-2 border-bento-border group-hover:border-bento-accent/30"
                                    )}>
                                      {selected && <Check size={12} />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Medical Report */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      <div className="flex items-center gap-4 border-b border-bento-border pb-6">
                        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-heading font-bold text-gray-900">{t.steps.step3}</h2>
                          <p className="text-sm text-bento-label font-medium italic">Unlocking your bio-markers... 🧬</p>
                        </div>
                      </div>

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-4 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all min-h-[350px] relative group",
                          file ? "border-bento-accent bg-green-50/50" : "border-bento-border hover:border-bento-accent/50 hover:bg-gray-50"
                        )}
                      >
                        <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                        
                        {file ? (
                          <div className="flex flex-col items-center gap-5 text-bento-accent">
                            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-bento-accent text-white p-6 rounded-3xl shadow-2xl shadow-green-100">
                              <FileText size={48} />
                            </motion.div>
                            <div className="text-center">
                              <span className="block font-bold text-xl">{file.name}</span>
                              <span className="text-xs uppercase font-extrabold tracking-widest opacity-60">Ready for analysis! ✨</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-gray-100 p-8 rounded-full text-gray-400 group-hover:scale-110 group-hover:bg-bento-accent/10 group-hover:text-bento-accent transition-all duration-500">
                              <Upload size={40} />
                            </div>
                            <div className="text-center space-y-2">
                              <p className="text-lg font-bold text-gray-700 uppercase tracking-tight">{t.fields.upload}</p>
                              <p className="text-xs text-bento-label uppercase font-bold tracking-widest leading-relaxed max-w-xs mx-auto">We'll scan Hemoglobin, Vitamin D, Cholesterol, and more for a deeper plan.</p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Final Review */}
                  {step === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      <div className="flex items-center gap-4 border-b border-bento-border pb-6">
                        <div className="bg-purple-100 p-3 rounded-2xl text-purple-600">
                          <Zap size={28} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-heading font-bold text-gray-900">{t.steps.step4}</h2>
                          <p className="text-sm text-bento-label font-medium italic">Almost there, {labData.name || "friend"}! ☁️</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-bento-bg p-8 rounded-[2rem] border border-bento-border space-y-5 shadow-inner">
                          <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-bento-label mb-6">Manifest Summary</h3>
                          <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-bento-border/50">
                            <span className="text-[10px] font-bold uppercase text-bento-label">Explorer</span>
                            <span className="font-bold text-gray-900">{labData.name || "Guest"}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-bento-border/50">
                            <span className="text-[10px] font-bold uppercase text-bento-label">Energy Mode</span>
                            <span className="font-bold text-gray-900">{labData.diet}</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-bento-border/50">
                            <span className="text-[10px] font-bold uppercase text-bento-label">Intelligence</span>
                            <span className="font-bold text-gray-900">{language}</span>
                          </div>
                          {file && (
                            <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-green-200">
                              <Check size={14} className="text-bento-accent" />
                              <span className="text-[10px] font-bold uppercase text-bento-accent">Biometric File Attached</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-amber-50/50 border-2 border-amber-200 p-8 rounded-[2rem] space-y-6 flex flex-col justify-between">
                          <div className="space-y-3">
                            <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase italic">
                              {t.disclaimer}
                            </p>
                          </div>
                          <button
                            onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                            className={cn(
                              "w-full flex items-center gap-4 p-5 rounded-2xl transition-all border-2",
                              disclaimerAccepted ? "bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-200" : "bg-white border-amber-200 text-amber-900 hover:border-amber-400"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                              disclaimerAccepted ? "bg-white border-white text-amber-600" : "border-amber-300"
                            )}>
                              {disclaimerAccepted && <Check size={16} />}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-tight text-left">
                              {t.fields.disclaimerCheck}
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-4 text-red-700 text-xs font-bold uppercase my-6">
                      <div className="bg-red-600 text-white p-2 rounded-lg">
                        <AlertCircle size={20} />
                      </div>
                      {error}
                    </motion.div>
                  )}

                  <div className="flex gap-6 pt-10 mt-10 border-t border-bento-border/50">
                    {step > 1 && (
                      <button
                        onClick={() => setStep(step - 1)}
                        className="px-8 py-4 border-2 border-bento-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-bento-label hover:bg-gray-50 hover:text-bento-text transition-all flex items-center gap-2"
                      >
                        <ChevronLeft size={16} />
                        {t.back}
                      </button>
                    )}
                    <button
                      disabled={step === 4 && !disclaimerAccepted}
                      onClick={() => {
                        if (step < 4) setStep(step + 1);
                        else handleAnalyze();
                      }}
                      className={cn(
                        "flex-1 py-5 bg-bento-accent text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-2xl shadow-green-200/50 group active:scale-95",
                        step === 4 && !disclaimerAccepted && "opacity-50 cursor-not-allowed saturate-0"
                      )}
                    >
                      {step === 4 ? t.analyze : t.next}
                      {step < 4 && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-bento-accent text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-green-100 border-4 border-white">
                    <Sun size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-bento-accent uppercase tracking-[0.3em] mb-1">Your Blueprint</p>
                    <h2 className="text-4xl font-heading font-bold text-gray-900 tracking-tight leading-none italic">Welcome, {labData.name || "Friend"} ✨</h2>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStep(1);
                    setResult(null);
                    setDisclaimerAccepted(false);
                  }}
                  className="px-8 py-3 bg-white border-2 border-bento-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-bento-label hover:text-bento-accent hover:border-bento-accent transition-all shadow-sm"
                >
                  Start New Session 🔄
                </button>
              </div>

              {logStatus && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border flex items-center gap-3",
                    logStatus.success ? "bg-green-50 border-green-100 text-bento-accent" : "bg-amber-50 border-amber-100 text-amber-700"
                  )}
                >
                  {logStatus.success ? <Check size={14} /> : <AlertCircle size={14} />}
                  {logStatus.message}
                </motion.div>
              )}

              {loading ? (
                <div className="bento-card bg-white p-24 flex flex-col items-center justify-center gap-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-green-50/20 backdrop-blur-[2px]" />
                  <div className="relative z-10 space-y-8">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-24 h-24 border-4 border-bento-accent border-t-transparent rounded-full shadow-2xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Dna size={32} className="text-bento-accent animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <AnimatePresence mode="wait">
                        <motion.h3 
                          key={loadingTextIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-2xl font-heading font-bold text-gray-900 uppercase tracking-widest h-8"
                        >
                          {t.processing[loadingTextIndex]}
                        </motion.h3>
                      </AnimatePresence>
                      <p className="text-[11px] text-bento-label uppercase font-extrabold tracking-[0.3em] mt-8 animate-pulse italic">Brewing your strategy... ☕</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {sections.map((section, idx) => {
                    const lines = section.trim().split("\n");
                    const title = lines[0].trim();
                    const contentMd = lines.slice(1).join("\n");
                    
                    return (
                      <motion.section 
                        key={idx} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, type: "spring", damping: 15 }}
                        className="bento-card flex flex-col group !p-6 md:!p-10 !rounded-[2rem]"
                      >
                        <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b-2 border-bento-bg">
                           <h3 className="text-[10px] md:text-sm font-extrabold uppercase tracking-[0.25em] text-gray-400 group-hover:text-bento-accent transition-colors">
                            {title}
                          </h3>
                          {(title.includes("📊") && file) && <span className="bento-pill bg-blue-100 text-blue-700 font-black">LAB ANALYZED</span>}
                        </div>
                        <div className="flex-1 prose prose-sm max-w-none text-bento-text prose-p:leading-relaxed prose-li:my-2 prose-headings:text-bento-text prose-strong:text-gray-900 prose-table:rounded-3xl prose-table:overflow-hidden">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({children}) => (
                                <div className="overflow-x-auto my-4 md:my-6 border-2 border-bento-bg rounded-xl md:rounded-[2rem] shadow-inner bg-gray-50/30">
                                  <table className="w-full border-collapse">{children}</table>
                                </div>
                              ),
                              th: ({children}) => (
                                <th className="text-left text-[9px] md:text-[10px] uppercase text-white p-3 md:p-5 bg-bento-accent font-black tracking-widest">{children}</th>
                              ),
                              td: ({children}) => {
                                  const text = String(children).toUpperCase();
                                  let styleClass = "p-3 md:p-5 border-b border-bento-bg text-[11px] md:text-sm font-semibold whitespace-normal";
                                  if (text.includes("HIGH")) styleClass += " text-red-600 font-black";
                                  else if (text.includes("NORMAL")) styleClass += " text-green-600 font-black";
                                  else if (text.includes("LOW") || text.includes("ELEVATED")) styleClass += " text-orange-600 font-black";
                                  
                                  return (<td className={styleClass}>{children}</td>);
                              },
                              h1: () => null,
                              h2: ({children}) => (
                                <div className="flex items-center gap-3 mt-8 mb-4">
                                  <div className="w-2 h-6 bg-bento-accent rounded-full" />
                                  <h4 className="text-xs font-black text-bento-accent uppercase tracking-[0.2em]">{children}</h4>
                                </div>
                              ),
                              blockquote: ({children}) => (
                                <div className="bg-orange-50/50 p-6 rounded-[1.5rem] border-2 border-orange-100 text-orange-900 text-[11px] font-bold uppercase tracking-tight mb-8 shadow-sm">
                                  {children}
                                </div>
                              ),
                              p: ({children}) => <p className="leading-relaxed mb-4 text-justify whitespace-pre-wrap">{children}</p>,
                              li: ({children}) => <li className="mb-2 pl-2 list-none before:content-['•'] before:text-bento-accent before:font-bold before:mr-3">{children}</li>
                            }}
                          >
                            {contentMd}
                          </ReactMarkdown>
                        </div>
                      </motion.section>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-bento-border px-8 py-5 flex items-center justify-between text-bento-label text-[11px] font-black uppercase tracking-[0.3em] z-40">
        <div className="flex items-center gap-3 group cursor-pointer transition-all hover:text-bento-accent">
          <Activity size={16} className="text-bento-accent transition-transform group-hover:rotate-12" />
          <span>WellnessAI Lab</span>
        </div>
        <p className="hidden sm:block opacity-40">Predictive Heart 2026</p>
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5 border-x border-bento-border px-4 px-b">
            <Globe size={12} />
            <span>{language}</span>
          </div>
          <span className="text-bento-accent font-black">v2.1 Human-Grade</span>
        </div>
      </footer>
    </div>
  );
}
