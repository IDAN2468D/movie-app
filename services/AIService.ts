import { GoogleGenerativeAI } from "@google/generative-ai";
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

interface AIInsight {
  pros: string[];
  cons: string[];
  verdict: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export class AIService {
  private static API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  private static MODEL_NAME = "gemini-3.1-flash-lite";
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY_MS = 2000;

  private static getModel(systemInstruction?: string) {
    if (!this.API_KEY) return null;
    const genAI = new GoogleGenerativeAI(this.API_KEY);
    return genAI.getGenerativeModel({
      model: this.MODEL_NAME,
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined
    });
  }

  /**
   * Helper to execute API calls with retry logic
   */
  private static async withRetry<T>(operation: () => Promise<T>, retries = this.MAX_RETRIES): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const isTransient = error?.message?.includes('503') || error?.message?.includes('429');
      if (isTransient && retries > 0) {
        console.warn(`AIService: Model busy (${this.MODEL_NAME}), retrying in ${this.RETRY_DELAY_MS}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
        return this.withRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Generates smart insights for a movie (Pros, Cons, Verdict)
   */
  static async getMovieInsights(movieTitle: string, overview: string): Promise<AIInsight> {
    const model = this.getModel();
    if (!model) {
      console.warn("AIService: API key missing, using simulation.");
      return this.simulateInsights(movieTitle);
    }

    try {
      return await this.withRetry(async () => {
        const prompt = `אתה מבקר קולנוע מומחה. עבור הסרט "${movieTitle}" עם התקציר הבא: "${overview}", צור ניתוח בפורמט JSON בלבד.
        ה-JSON חייב להכיל:
        - pros: מערך של 3 נקודות חיוביות על הסרט.
        - cons: מערך של 2 נקודות פחות טובות על הסרט.
        - verdict: משפט סיכום קצר וקולע (עד 15 מילים).
        הכל חייב להיות בעברית.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      });
    } catch (error) {
      console.error("AIService Error (Insights):", error);
      return this.simulateInsights(movieTitle);
    }
  }

  /**
   * Smart AI Concierge Chat
   */
  static async chatWithConcierge(history: ChatMessage[]): Promise<string> {
    const systemInstruction = "אתה הקונסיירז' של CineBook, אפליקציה להזמנת כרטיסי קולנוע. אתה עוזר למשתמשים למצוא סרטים, עונה על שאלות בנושאי קולנוע, ותמיד אדיב, מקצועי ומשתמש בשפה עברית רהוטה.";
    const model = this.getModel(systemInstruction);

    if (!model) {
      return this.simulateConciergeResponse(history[history.length - 1].content);
    }

    try {
      return await this.withRetry(async () => {
        const firstUserIndex = history.findIndex(m => m.role === 'user');

        let validHistory: ChatMessage[] = [];
        if (firstUserIndex !== -1) {
          const potentialHistory = history.slice(firstUserIndex, -1);

          let currentRole: 'user' | 'model' = 'user';
          for (const msg of potentialHistory) {
            if (msg.role === currentRole) {
              validHistory.push(msg);
              currentRole = currentRole === 'user' ? 'model' : 'user';
            }
          }

          if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
            validHistory.pop();
          }
        }

        const chat = model.startChat({
          history: validHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            maxOutputTokens: 500,
          },
        });

        const userMessage = history[history.length - 1].content;
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
      });
    } catch (error) {
      console.error("AIService Error (Chat):", error);
      return this.simulateConciergeResponse(history[history.length - 1].content);
    }
  }

  /**
   * Translates a natural language query into TMDB filters using AI
   */
  static async getSemanticFilters(query: string): Promise<any> {
    const model = this.getModel("אתה עוזר למשתמשים למצוא סרטים. המשימה שלך היא לתרגם שאילתת חיפוש חופשית לאובייקט פילטרים עבור TMDB API.");
    if (!model) return this.translateQueryToFiltersLegacy(query);

    try {
      return await this.withRetry(async () => {
        const prompt = `תרגם את השאילתה הבאה: "${query}" לאובייקט JSON המכיל את הפרמטרים המתאימים ל-TMDB discover API.
        התמקד ב-with_genres (קודים של ז'אנרים: 28=אקשן, 12=הרפתקאות, 16=אנימציה, 35=קומדיה, 80=פשע, 99=דוקו, 18=דרמה, 10751=משפחה, 14=פנטזיה, 36=היסטוריה, 27=אימה, 10402=מוזיקה, 9648=מסתורין, 10749=רומנטיקה, 878=מד"ב, 10770=טלוויזיה, 53=מתח, 10752=מלחמה, 37=מערבון).
        החזר JSON בלבד. דוגמה: {"with_genres": "28,12"}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      });
    } catch (error) {
      console.error("AIService Error (Semantic Search):", error);
      return this.translateQueryToFiltersLegacy(query);
    }
  }

  /**
   * Text-to-Speech support
   */
  static async speak(text: string) {
    if (Platform.OS === 'web') return;
    try {
      Speech.speak(text, {
        language: 'he',
        pitch: 1.0,
        rate: 1.0,
      });
    } catch (error) {
      console.error("AIService TTS Error:", error);
    }
  }

  /**
   * Stop speaking
   */
  static async stopSpeaking() {
    if (Platform.OS === 'web') return;
    try {
      Speech.stop();
    } catch (error) {
      console.error("AIService TTS Stop Error:", error);
    }
  }

  /**
   * Basic fallback mapping for demo purposes
   */
  private static translateQueryToFiltersLegacy(query: string) {
    const lower = query.toLowerCase();
    if (lower.includes('חלל') || lower.includes('space')) return { with_genres: '878' };
    if (lower.includes('מפחיד') || lower.includes('scary')) return { with_genres: '27' };
    if (lower.includes('מצחיק') || lower.includes('funny')) return { with_genres: '35' };
    return {};
  }

  // --- PRIVATE SIMULATION LOGIC ---

  private static async simulateInsights(movieTitle: string): Promise<AIInsight> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      pros: [
        `וויזואליה מרהיבה שמתאימה בדיוק לרוח של ${movieTitle}`,
        "משחק משכנע של צוות השחקנים המרכזי",
        "פסקול סוחף שמעצים את החוויה"
      ],
      cons: [
        "קצב מעט איטי במערכה השנייה",
        "עלילה שעלולה להרגיש מוכרת מדי לחובבי הז'אנר"
      ],
      verdict: "חוויה קולנועית מרשימה ששווה צפייה על המסך הגדול, למרות כמה רגעים איטיים."
    };
  }

  private static simulateConciergeResponse(input: string): string {
    const input_lower = input.toLowerCase();
    if (input_lower.includes('המלצה') || input_lower.includes('recommend')) {
      return 'אני ממליץ בחום על "אופנהיימר". זה סרט אפי עם ביצועים מדהימים. אם אתה מחפש משהו קליל יותר, "ברבי" הוא בחירה מצוינת וצבעונית!';
    }
    if (input_lower.includes('שלום') || input_lower.includes('hi') || input_lower.includes('hello')) {
      return 'שלום! אני סייען ה-AI של סינבוק. איך אני יכול לעזור לך למצוא את הסרט המושלם להיום?';
    }
    return 'שאלה מצוינת! כדאי לבדוק את רשימת שוברי הקופות שלנו. יש שם כמה פנינים אמיתיות החודש. תרצה שאפרט על אחד מהם?';
  }
}

