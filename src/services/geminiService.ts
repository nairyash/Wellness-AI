import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface HealthData {
  name: string;
  age: number;
  weight: number;
  height: number;
  diet: string;
  meatPreferences?: string[];
  activityLevel: string;
  healthConditions?: string;
  language: "English" | "Hindi" | "Marathi";
}

export interface LabReportFile {
  data: string; // base64
  mimeType: string;
}

export async function analyzeWellness(data: HealthData, labReport?: LabReportFile) {
  const model = "gemini-3.1-flash-lite-preview";
  
  const prompt = `
    You are the "AI-Powered Wellness Analysis Tool (v2.0)."
    Analyze the following health data and the uploaded lab report PDF (if provided).
    
    User Identity: ${data.name}
    User Data:
    - Age: ${data.age}
    - Weight: ${data.weight} kg
    - Height: ${data.height} cm
    - Diet: ${data.diet} ${data.meatPreferences ? `(Meat preferences: ${data.meatPreferences.join(", ")})` : ""}
    - Activity Level: ${data.activityLevel}
    - Pre-existing Health Conditions/Issues: ${data.healthConditions || "None declared"}
    
    LANGUAGE REQUIREMENT: Generate the entire response ONLY in ${data.language}.
    TONE: Human, warm, helpful, and empathetic. Use emojis generously to make the plan feel encouraging.
    
    CORE OPERATING RULES:
    1. HEALTH METRICS ANALYSIS: Provide a VERY DETAILED analysis of the user's bio-metrics, declared health conditions, and lab findings. 
       CRITICAL: If a lab report is provided, analyze BOTH Blood and Urine test reports in extreme detail. Explain markers like Hemoglobin, Glucose (HbA1c), Cholesterol, Creatinine, and components of Urine Analysis (pH, Protein, Glucose, etc.) in a human way.
    2. 7-DAY MEAL PLAN: Present this in a clear, GRAPHICAL Markdown TABLE. Columns: Day, Breakfast, Lunch, Snack, Dinner.
    3. EXERCISE PLAN: Use adequate EMOJIS (e.g., 🏃‍♂️, 🧘‍♀️, 🧗‍♂️) to describe different activities and make the schedule visually engaging.
    4. MEAL PLAN BUDGET: Internally ensure the cost is roughly within ₹100/day based on 2026 Indian market rates. Do NOT explicitly mention the budget or costs.
    5. MEDICAL DISCLAIMER: Every response MUST start with the exact disclaimer in the requested language: "DISCLAIMER: This is an AI-powered analysis for educational purposes only. Please consult a healthcare professional before making medical decisions." (Translate this to ${data.language}).

    RESPONSE STRUCTURE (strictly in ${data.language}):
    Format your output using these 5 markdown sections (use "##" for headings):

    1. 📊 HEALTH METRICS & BIO-MARKER ANALYSIS
    (Deep dive into BMI, Hemoglobin, Glucose, Cholesterol, Creatinine. Explain the human impact of these levels.)

    2. 🎯 PERSONALIZED NUTRITION STRATEGY
    (TDEE, Macros, and hydration needs with supportive language.)

    3. 🥗 7-DAY NOURISHMENT TABLE
    (A graphical table showing a diverse 7-day budget-friendly plan.)

    4. 🏃‍♂️ VIBRANT MOVEMENT SCHEDULE
    (Emoji-rich weekly exercise plan tailored to lifestyle.)

    5. ⏳ WELLNESS JOURNEY TIMELINE
    (Testing suggestions and encouraging milestones.)
  `;

  const contents: any[] = [{ text: prompt }];

  if (labReport) {
    contents.push({
      inlineData: {
        data: labReport.data,
        mimeType: labReport.mimeType,
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: contents }],
  });

  return response.text;
}
