import { GoogleGenerativeAI } from "@google/generative-ai";
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MovieVisualDNA {
  primary: string;
  secondary: string;
  accent: string;
  blurIntensity: number;
  glassOpacity: number;
  animationSpeed: number;
  moodNarrative: string;
}

interface AIInsight {
  pros: string[];
  cons: string[];
  verdict: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface MoodRecommendation {
  mood: string;
  genres: string;
  description: string;
}

interface MovieTrivia {
  facts: string[];
  behindTheScenes: string;
  funFact: string;
}

interface WatchlistAnalysis {
  favoriteGenres: string[];
  recommendation: string;
  stats: {
    totalMovies: number;
    avgRating: number;
    topGenre: string;
  };
}

export interface VoiceCommand {
  type: 'search' | 'navigate' | 'watchlist_analyze' | 'mood' | 'info' | 'chat' | 'booking_restaurant' | 'booking_uber' | 'booking_movie';
  params?: {
    query?: string;
    genre?: string;
    screen?: string;
    mood?: string;
    movieName?: string;
  };
  displayText: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────
export class AIService {
  private static API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  private static MODEL_NAME = "gemini-3.1-flash-lite";
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY_MS = 2000;

  private static SIMULATED_COMMANDS = [
    "חפש סרט אקשן",
    "מה מוקרן עכשיו?",
    "אני מרגיש עצוב",
    "קח אותי לפרופיל",
    "מה דעתך על אופנהיימר?",
    "נתח את רשימת הצפייה שלי"
  ];

  private static getModel(systemInstruction?: string, modelOverride?: string) {
    if (!this.API_KEY) return null;
    const genAI = new GoogleGenerativeAI(this.API_KEY);
    return genAI.getGenerativeModel({
      model: modelOverride || this.MODEL_NAME,
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
   * Robust JSON extractor that finds the first '{' and the last '}' 
   * (or '[' and ']') to parse a valid JSON block, ignoring conversational wraps.
   */
  private static parseJSON(text: string): any {
    const trimmed = text.trim();
    const cleanStr = trimmed.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanStr);
    } catch (e: any) {
      const firstCurly = cleanStr.indexOf('{');
      const lastCurly = cleanStr.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
        const sliced = cleanStr.slice(firstCurly, lastCurly + 1);
        try {
          return JSON.parse(sliced);
        } catch (e2: any) {
          try {
            // If AI returned multiple comma-separated JSON objects instead of one
            const asArray = JSON.parse(`[${sliced}]`);
            if (Array.isArray(asArray) && asArray.length > 0) {
              return asArray[0];
            }
          } catch {
            // ignore and proceed to sanitization
          }

          try {
            let sanitized = sliced
              .replace(/([a-zA-Z0-9א-ת])"([a-zA-Z0-9א-ת])/g, '$1\\"$2')
              .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
              .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
              .replace(/,\s*([\]}])/g, '$1');

            sanitized = sanitized.replace(/"([^"\\]|\\.)*"/g, (strMatch) => {
              return strMatch.replace(/[\u0000-\u001F]/g, (char) => {
                if (char === '\n') return '\\n';
                if (char === '\r') return '\\r';
                if (char === '\t') return '\\t';
                return '';
              });
            });

            return JSON.parse(sanitized);
          } catch {
            console.error("AIService: Failed parsing sliced JSON. Content was:", sliced, "Error:", e2.message);
            throw e2;
          }
        }
      }
      const firstBracket = cleanStr.indexOf('[');
      const lastBracket = cleanStr.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        const sliced = cleanStr.slice(firstBracket, lastBracket + 1);
        try {
          return JSON.parse(sliced);
        } catch (e2: any) {
          try {
            let sanitized = sliced
              .replace(/([a-zA-Z0-9א-ת])"([a-zA-Z0-9א-ת])/g, '$1\\"$2')
              .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
              .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
              .replace(/,\s*([\]}])/g, '$1');

            sanitized = sanitized.replace(/"([^"\\]|\\.)*"/g, (strMatch) => {
              return strMatch.replace(/[\u0000-\u001F]/g, (char) => {
                if (char === '\n') return '\\n';
                if (char === '\r') return '\\r';
                if (char === '\t') return '\\t';
                return '';
              });
            });

            return JSON.parse(sanitized);
          } catch {
            console.error("AIService: Failed parsing sliced Array. Content was:", sliced, "Error:", e2.message);
            throw e2;
          }
        }
      }
      throw e;
    }
  }

  // ─── FEATURE 1: Movie Insights ──────────────────────────────────────────────

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
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Insights):", error);
      return this.simulateInsights(movieTitle);
    }
  }

  // ─── FEATURE 3: Movie Visual DNA (VibeShift) ───────────────────────────────

  /**
   * Generates dynamic visual DNA for a movie based on its overview using AI
   */
  static async getMovieVisualDNA(movieTitle: string, overview: string): Promise<MovieVisualDNA> {
    const model = this.getModel();
    if (!model) {
      console.warn("AIService: API key missing, using visual DNA simulation.");
      return this.simulateVisualDNA(movieTitle);
    }

    try {
      return await this.withRetry(async () => {
        const prompt = `אתה מעצב ממשקים (UI/UX) מומחה המומחה בעיצוב קולנועי מתקדם בסגנון "Liquid Glass" (זכוכית מומסת).
עבור הסרט "${movieTitle}" עם התקציר הבא: "${overview}", התאם פרופיל עיצוב המבוסס על מצב הרוח והז'אנר של הסרט.
החזר אובייקט JSON בלבד, ללא הערות, ללא קוד MD, ללא הקדמות.
מבנה ה-JSON חייב להיות בדיוק כזה:
{
  "primary": "קוד צבע ניאון ראשי המתאים לאווירה בפורמט Hex, למשל #FF1464 לאקשן/אימה, #00FFFF למדב/פנטזיה",
  "secondary": "קוד צבע משני המשלים את הצבע הראשי בפורמט Hex ליצירת ניגודיות ומעבר צבעים יפה",
  "accent": "קוד צבע שלישי זוהר במיוחד להדגשות בפורמט Hex (למשל צהוב זוהר #E5FF00 או ירוק ניאון)",
  "blurIntensity": מספר בין 40 ל-80 המייצג את רמת הטשטוש של אלמנטי הזכוכית (טשטוש גבוה לסרטים איטיים/דרמטיים, נמוך לאקשן מהיר),
  "glassOpacity": מספר עשרוני בין 0.08 ל-0.25 המייצג את שקיפות הזכוכית,
  "animationSpeed": מספר במילישניות בין 1200 ל-2500 המייצג את מהירות מעברי הצבעים בהתאם לקצב הסרט,
  "moodNarrative": "משפט קצר וקולע בעברית המתאר את האווירה הדרמטית של הסרט, למשל 'מתח פסיכולוגי אפל ומסתורי' או 'מסע הרפתקאות קוסמי מרהיב' (עד 12 מילים)"
}
הקפד להחזיר JSON תקין ומלא בלבד.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const parsed = this.parseJSON(text);
        return {
          primary: parsed.primary || '#FF1464',
          secondary: parsed.secondary || '#9B1B30',
          accent: parsed.accent || '#E5FF00',
          blurIntensity: typeof parsed.blurIntensity === 'number' ? parsed.blurIntensity : 60,
          glassOpacity: typeof parsed.glassOpacity === 'number' ? parsed.glassOpacity : 0.15,
          animationSpeed: typeof parsed.animationSpeed === 'number' ? parsed.animationSpeed : 1500,
          moodNarrative: parsed.moodNarrative || 'חוויה קולנועית סוחפת',
        };
      });
    } catch (error) {
      console.error("AIService Error (Visual DNA):", error);
      return this.simulateVisualDNA(movieTitle);
    }
  }

  // ─── FEATURE 2: Contextual Concierge Chat ──────────────────────────────────

  /**
   * Smart AI Concierge Chat — now watchlist-aware
   */
  static async chatWithConcierge(
    history: ChatMessage[],
    watchlistContext?: { titles: string[]; genres: string[]; avgRating: number }
  ): Promise<string> {
    const watchlistInfo = watchlistContext && watchlistContext.titles.length > 0
      ? `\nהמשתמש שמר ברשימת הצפייה שלו ${watchlistContext.titles.length} סרטים: ${watchlistContext.titles.slice(0, 8).join(', ')}. הז'אנרים האהובים עליו: ${watchlistContext.genres.join(', ')}. ציון ממוצע ברשימה: ${watchlistContext.avgRating.toFixed(1)}.`
      : '\nלמשתמש אין סרטים ברשימת הצפייה עדיין.';

    const systemInstruction = `אתה הקונסיירז' האישי של CineBook — אפליקציה ישראלית מובילה להזמנת כרטיסי קולנוע ל-2026.
תפקידך:
1. לעזור למשתמשים למצוא סרטים מושלמים על פי מצב רוח, העדפות וטעם אישי.
2. לתת ביקורות קצרות, טריוויה מעניינת, ומידע על סרטים.
3. לעזור בהזמנת כרטיסים, חטיפים ובחירת מקומות.
4. להתייחס לרשימת הצפייה של המשתמש כדי לתת המלצות מדויקות.
${watchlistInfo}
כללים:
- דבר תמיד בעברית רהוטה ומקצועית.
- היה אדיב, נלהב מקולנוע, ותמציתי (עד 3 משפטים).
- השתמש באימוג'ים מתאימים 🎬🍿⭐
- אם המשתמש מבקש המלצה, שקלל את הרשימה שלו.`;

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

  // ─── FEATURE 3: Mood-Based Recommendations ─────────────────────────────────

  /**
   * Generates movie recommendations based on user's mood
   */
  static async getMoodRecommendations(mood: string): Promise<MoodRecommendation> {
    const model = this.getModel();
    if (!model) return this.simulateMoodRec(mood);

    try {
      return await this.withRetry(async () => {
        const prompt = `המשתמש מרגיש: "${mood}". 
        החזר JSON בלבד עם:
        - mood: תיאור קצר של מצב הרוח (עברית)
        - genres: מספרי ז'אנרים מופרדים בפסיקים מתאימים למצב הרוח (28=אקשן, 35=קומדיה, 18=דרמה, 27=אימה, 10749=רומנטיקה, 878=מד"ב, 16=אנימציה, 53=מתח)
        - description: הסבר קצר למה הז'אנרים האלה מתאימים (עברית, עד 20 מילים)`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Mood):", error);
      return this.simulateMoodRec(mood);
    }
  }

  // ─── FEATURE 4: Movie Trivia ────────────────────────────────────────────────

  /**
   * Generates interesting trivia about a movie
   */
  static async getMovieTrivia(movieTitle: string, movieYear: string): Promise<MovieTrivia> {
    const model = this.getModel();
    if (!model) return this.simulateTrivia(movieTitle);

    try {
      return await this.withRetry(async () => {
        const prompt = `צור טריוויה מעניינת על הסרט "${movieTitle}" (${movieYear}) בפורמט JSON בלבד:
        - facts: מערך של 3 עובדות מעניינות על הסרט (עברית)
        - behindTheScenes: עובדה אחת מעניינת מאחורי הקלעים (עברית)
        - funFact: עובדה מפתיעה ומשעשעת (עברית)`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Trivia):", error);
      return this.simulateTrivia(movieTitle);
    }
  }

  // ─── FEATURE 5: Similar Movies ──────────────────────────────────────────────

  /**
   * Generates TMDB filters to find movies similar to a given movie
   */
  static async findSimilarMovieFilters(movieTitle: string, genres: string, overview: string): Promise<Record<string, string>> {
    const model = this.getModel();
    if (!model) return { with_genres: genres };

    try {
      return await this.withRetry(async () => {
        const prompt = `הסרט "${movieTitle}" שייך לז'אנרים ${genres} ועוסק ב: "${overview}".
        מצא פרמטרי חיפוש ל-TMDB API שימצאו סרטים דומים. החזר JSON בלבד עם:
        - with_genres: קודי ז'אנרים מופרדים בפסיקים
        - sort_by: popularity.desc או vote_average.desc
        - vote_average.gte: ציון מינימלי (מספר)`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Similar):", error);
      return { with_genres: genres, sort_by: 'popularity.desc' };
    }
  }

  // ─── FEATURE 6: Watchlist Analysis ──────────────────────────────────────────

  /**
   * Analyzes the user's watchlist and provides insights
   */
  static async analyzeWatchlist(
    movies: { title: string; vote_average: number; genre_ids: number[] }[]
  ): Promise<WatchlistAnalysis> {
    if (movies.length === 0) {
      return {
        favoriteGenres: [],
        recommendation: 'הוסף סרטים לרשימת הצפייה שלך ואקבל תובנות מותאמות אישית! 🎬',
        stats: { totalMovies: 0, avgRating: 0, topGenre: 'אין' },
      };
    }

    const GENRE_MAP: Record<number, string> = {
      28: 'אקשן', 12: 'הרפתקאות', 16: 'אנימציה', 35: 'קומדיה', 80: 'פשע',
      99: 'דוקומנטרי', 18: 'דרמה', 10751: 'משפחה', 14: 'פנטזיה', 36: 'היסטוריה',
      27: 'אימה', 10402: 'מוזיקה', 9648: 'מסתורין', 10749: 'רומנטיקה',
      878: 'מדע בדיוני', 53: 'מתח', 10752: 'מלחמה', 37: 'מערבון',
    };

    // Count genre occurrences
    const genreCounts: Record<number, number> = {};
    let totalRating = 0;
    for (const movie of movies) {
      totalRating += movie.vote_average;
      for (const gid of movie.genre_ids) {
        genreCounts[gid] = (genreCounts[gid] || 0) + 1;
      }
    }

    const sortedGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topGenreId = sortedGenres.length > 0 ? Number(sortedGenres[0][0]) : 0;
    const favoriteGenres = sortedGenres.map(([gid]) => GENRE_MAP[Number(gid)] || 'כללי');
    const avgRating = totalRating / movies.length;

    const model = this.getModel();
    let recommendation = `נראה שאתה אוהב ${favoriteGenres.join(' ו')}! 🎬`;

    if (model) {
      try {
        const prompt = `המשתמש שמר ${movies.length} סרטים. הז'אנרים האהובים: ${favoriteGenres.join(', ')}. ציון ממוצע: ${avgRating.toFixed(1)}. 
        כתוב משפט המלצה אחד בעברית (עד 25 מילים) שמציע סרט או ז'אנר שאולי ירחיב את הטעם שלו.`;
        const result = await model.generateContent(prompt);
        recommendation = result.response.text().trim();
      } catch {
        console.warn("AIService: Watchlist analysis AI fallback");
      }
    }

    return {
      favoriteGenres,
      recommendation,
      stats: {
        totalMovies: movies.length,
        avgRating,
        topGenre: GENRE_MAP[topGenreId] || 'כללי',
      },
    };
  }

  // ─── FEATURE 7: Semantic Search ─────────────────────────────────────────────

  /**
   * Translates a natural language query into TMDB filters using AI
   */
  static async getSemanticFilters(query: string): Promise<Record<string, string>> {
    try {
      const response = await fetch(`https://movie-app-server-olet.onrender.com/api/voice/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("AIService Error (Semantic Search API):", error);
    }
    // Fallback if backend fails
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
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Semantic Search Fallback):", error);
      return this.translateQueryToFiltersLegacy(query);
    }
  }

  /**
   * Processes audio recording (base64) and extracts semantic filters using backend or Gemini
   */
  static async processVoiceSearch(audioBase64: string): Promise<Record<string, string>> {
    // Expo Go / Mock Mode Bypass: If the base64 string is dummy mock data, immediately return simulated filters
    if (audioBase64 === 'MOCK_BASE64_VOICE_DATA') {
      console.log(`[AIService] Mock voice base64 detected. Simulating semantic filters.`);
      return { with_genres: '28' }; // Fallback to Action genre
    }

    try {
      const response = await fetch(`https://movie-app-server-olet.onrender.com/api/voice/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64 })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("AIService Error (Voice Process API):", error);
    }

    const model = this.getModel("אתה סוכן חיפוש קולי חכם. המשימה שלך היא להקשיב לקובץ השמע, להבין מה המשתמש מחפש ולתרגם זאת לפילטרים של TMDB.");
    if (!model) return {};

    try {
      return await this.withRetry(async () => {
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "audio/mp4",
              data: audioBase64
            }
          },
          `נתח את השמע המצורף. החזר אובייקט JSON בלבד עם הפרמטרים הבאים:
          - with_genres: קודי ז'אנרים (28=אקשן, 35=קומדיה, 27=אימה, 10749=רומנטיקה, 878=מד"ב)
          - query: מילות מפתח לחיפוש (עברית)
          - primary_release_year: שנה (אם צוינה)
          דוגמה: {"with_genres": "28,878", "query": "מלחמת הכוכבים"}`
        ]);
        
        const text = result.response.text();
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Voice Search Fallback):", error);
      return {};
    }
  }

  /**
   * Transcribes conversational speech to Hebrew text
   */
  static async transcribeVoice(audioBase64: string): Promise<string> {
    // Expo Go / Mock Mode Bypass: If the base64 string is dummy mock data, immediately return a simulated command
    if (audioBase64 === 'MOCK_BASE64_VOICE_DATA') {
      const randomIndex = Math.floor(Math.random() * this.SIMULATED_COMMANDS.length);
      const simulatedQuery = this.SIMULATED_COMMANDS[randomIndex];
      console.log(`[AIService] Mock voice base64 detected. Simulating transcription: "${simulatedQuery}"`);
      return simulatedQuery;
    }

    const model = this.getModel("אתה מומחה לתמלול הודעות קוליות בעברית עבור אפליקציית קולנוע. תפקידך לתמלל את מה שהמשתמש אמר בדיוק מרבי.");
    if (!model) {
      const randomIndex = Math.floor(Math.random() * this.SIMULATED_COMMANDS.length);
      return this.SIMULATED_COMMANDS[randomIndex];
    }

    try {
      return await this.withRetry(async () => {
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "audio/mp4",
              data: audioBase64
            }
          },
          `תמלל את הודעת השמע המצורפת לעברית בלבד. החזר את התמלול המדויק כטקסט פשוט, ללא תוספות, ללא הקדמות וללא מרכאות.`
        ]);
        
        return result.response.text().trim();
      });
    } catch (error) {
      console.warn("AIService Error (Voice Transcription Fallback):", error);
      // Under high Gemini API demand (e.g. 503 errors), fall back to a random simulated command
      const randomIndex = Math.floor(Math.random() * this.SIMULATED_COMMANDS.length);
      const simulatedQuery = this.SIMULATED_COMMANDS[randomIndex];
      console.log(`[AIService] Returning fallback simulated transcription: "${simulatedQuery}"`);
      return simulatedQuery;
    }
  }

  // ─── FEATURE 9: Voice Command Detection ──────────────────────────────────────

  /**
   * Detects actionable voice commands from transcribed text using Gemini AI.
   * Returns a structured VoiceCommand with type, params, and display text.
   */
  static async detectVoiceCommand(transcribedText: string): Promise<VoiceCommand> {
    const model = this.getModel(`אתה מערכת זיהוי פקודות קוליות עבור אפליקציית הקולנוע סינבוק.
תפקידך לנתח טקסט שהמשתמש אמר ולזהות אם מדובר בפקודה פעילה או בשיחה רגילה.

סוגי הפקודות הנתמכות:
1. search - חיפוש סרט ("חפש סרט אקשן", "מצא לי קומדיה", "אני רוצה לראות סרט מתח")
2. navigate - ניווט למסך ("קח אותי לפרופיל", "פתח כרטיסים", "לך לחיפוש", "הראה לי את הרשימה")
   מסכים: profile, search, tickets, watchlist, home
3. watchlist_analyze - ניתוח רשימת צפייה ("נתח את הרשימה שלי", "מה ברשימה שלי?")
4. mood - המלצה לפי מצב רוח ("אני עצוב", "משהו מצחיק", "מצב רוח רומנטי")
5. info - מידע כללי ("מה מוקרן עכשיו?", "מה פופולרי?")
6. chat - שיחה רגילה שאינה פקודה
7. booking_movie - הזמנת כרטיס לסרט ספציפי ("הזמן לי כרטיס לדדפול", "אני רוצה לראות את ספיידרמן")

קודי ז'אנרים: 28=אקשן, 35=קומדיה, 27=אימה, 10749=רומנטיקה, 878=מד"ב, 18=דרמה, 53=מתח, 16=אנימציה, 10751=משפחה, 12=הרפתקאות`);

    if (!model) {
      return this.detectVoiceCommandLocal(transcribedText);
    }

    try {
      return await this.withRetry(async () => {
        const prompt = `נתח את הטקסט הבא שהמשתמש אמר: "${transcribedText}"

החזר JSON בלבד בפורמט הבא:
{
  "type": "search" | "navigate" | "watchlist_analyze" | "mood" | "info" | "chat",
  "params": {
    "query": "מילות חיפוש (רק עבור search)",
    "genre": "קודי ז'אנרים מופרדים בפסיק (רק עבור search)",
    "screen": "שם המסך (רק עבור navigate): profile / search / tickets / watchlist / home",
    "mood": "תיאור מצב הרוח (רק עבור mood)",
    "movieName": "שם הסרט (רק עבור booking_movie)"
  },
  "displayText": "הודעה קצרה ומלהיבה בעברית שתוצג למשתמש שמסבירה מה אתה הולך לעשות (עד 12 מילים, עם אימוג'י מתאים)"
}

דוגמאות:
- "חפש לי סרט אקשן" → {"type":"search","params":{"genre":"28"},"displayText":"🔍 מחפש סרטי אקשן מומלצים בשבילך..."}
- "לך לפרופיל" → {"type":"navigate","params":{"screen":"profile"},"displayText":"📍 מנווט אותך לפרופיל שלך..."}
- "הזמן לי כרטיס לסרט ספיידרמן" → {"type":"booking_movie","params":{"movieName":"ספיידרמן"},"displayText":"🎟️ מזמין לך כרטיסים לספיידרמן..."}
- "מה דעתך על הסרט הזה" → {"type":"chat","params":{},"displayText":"💬 בוא נדבר על זה!"}` ;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = this.parseJSON(text) as VoiceCommand;

        // Validate the returned type
        const validTypes = ['search', 'navigate', 'watchlist_analyze', 'mood', 'info', 'chat', 'booking_movie'];
        if (!validTypes.includes(parsed.type)) {
          parsed.type = 'chat';
        }

        return parsed;
      });
    } catch (error) {
      console.error('AIService Error (Voice Command Detection):', error);
      return this.detectVoiceCommandLocal(transcribedText);
    }
  }

  /**
   * Local keyword-based fallback for voice command detection (no API required)
   */
  private static detectVoiceCommandLocal(text: string): VoiceCommand {
    const lower = text.toLowerCase();

    // Search commands
    if (lower.includes('חפש') || lower.includes('מצא') || lower.includes('חיפוש')) {
      let genre = '';
      if (lower.includes('אקשן') || lower.includes('פעולה')) genre = '28';
      else if (lower.includes('קומדיה') || lower.includes('מצחיק')) genre = '35';
      else if (lower.includes('אימה') || lower.includes('מפחיד')) genre = '27';
      else if (lower.includes('רומנטי') || lower.includes('אהבה')) genre = '10749';
      else if (lower.includes('מתח') || lower.includes('ריגוש')) genre = '53';
      else if (lower.includes('דרמה')) genre = '18';
      else if (lower.includes('מד"ב') || lower.includes('חלל')) genre = '878';
      else if (lower.includes('אנימציה') || lower.includes('ילדים') || lower.includes('משפחה')) genre = '16,10751';

      return {
        type: 'search',
        params: { query: text, genre },
        displayText: genre ? '🔍 מחפש סרטים מתאימים בשבילך...' : `🔍 מחפש "${text}"...`,
      };
    }

    // Navigation and Booking
    if (lower.includes('הזמן לי') || lower.includes('רוצה לראות את')) {
      const match = text.match(/(?:הזמן לי כרטיס ל|רוצה לראות את|הזמן סרט)\s+(.+)/i);
      const movieName = match ? match[1].trim() : 'סרט חדש';
      return { type: 'booking_movie', params: { movieName }, displayText: `🎟️ מזמין לך כרטיסים ל${movieName}...` };
    }
    if (lower.includes('פרופיל') || lower.includes('הגדרות')) {
      return { type: 'navigate', params: { screen: 'profile' }, displayText: '📍 מנווט לפרופיל שלך...' };
    }
    if (lower.includes('הכרטיסים שלי') || lower.includes('מסך כרטיסים') || lower.includes('הראה לי כרטיס')) {
      return { type: 'navigate', params: { screen: 'tickets' }, displayText: '🎫 פותח את הכרטיסים שלך...' };
    }
    if (lower.includes('חיפוש') || lower.includes('גלה') || lower.includes('גילוי')) {
      return { type: 'navigate', params: { screen: 'search' }, displayText: '🔎 פותח את מסך החיפוש...' };
    }
    if (lower.includes('רשימ') && (lower.includes('פתח') || lower.includes('הראה') || lower.includes('לך'))) {
      return { type: 'navigate', params: { screen: 'watchlist' }, displayText: '📋 פותח את רשימת הצפייה...' };
    }

    // Watchlist analysis
    if (lower.includes('נתח') && lower.includes('רשימ')) {
      return { type: 'watchlist_analyze', params: {}, displayText: '📊 מנתח את רשימת הצפייה שלך...' };
    }
    if (lower.includes('מה ברשימה') || lower.includes('מה יש ברשימ')) {
      return { type: 'watchlist_analyze', params: {}, displayText: '📊 בודק מה ברשימת הצפייה שלך...' };
    }

    // Mood commands
    if (lower.includes('מצב רוח') || lower.includes('עצוב') || lower.includes('שמח') || lower.includes('לחוץ') || lower.includes('הרפתקני')) {
      return { type: 'mood', params: { mood: text }, displayText: '🎭 מחפש סרטים שמתאימים למצב הרוח שלך...' };
    }

    // Info commands
    if (lower.includes('מוקרן') || lower.includes('עכשיו') || lower.includes('חדש') || lower.includes('פופולרי')) {
      return { type: 'info', params: {}, displayText: '🍿 בודק מה חם בקולנוע עכשיו...' };
    }

    // VIP Booking Restaurant commands
    if (lower.includes('שולחן') || lower.includes('מסעדה') || lower.includes('לאכול') || lower.includes('מסעדות')) {
      return { type: 'booking_restaurant', params: {}, displayText: '🍽️ מאתר ומזמין שולחן במסעדה סמוכה...' };
    }

    // VIP Booking Uber commands
    if (lower.includes('מונית') || lower.includes('אובר') || lower.includes('נסיעה') || lower.includes('להגיע') || lower.includes('taxi')) {
      return { type: 'booking_uber', params: {}, displayText: '🚗 מזמין מונית Uber לקולנוע...' };
    }

    // Fallback to chat
    return { type: 'chat', params: {}, displayText: '' };
  }

  /**
   * Identifies a movie from a poster image (base64) using Gemini Vision
   */
  static async identifyMovieFromPoster(base64Image: string): Promise<string | null> {
    const model = this.getModel("אתה עוזר זיהוי פוסטרים מומחה עבור סינבוק. תפקידך לזהות את שם הסרט מהתמונה.");
    if (!model) return null;

    try {
      return await this.withRetry(async () => {
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          `נתח את התמונה הזו. זהו פוסטר של סרט שצולם על ידי המשתמש.
          זהה את שם הסרט המדויק באנגלית או בעברית והחזר אותו באובייקט JSON בלבד בפורמט:
          {"movieTitle": "שם הסרט"}
          אם אינך מזהה שום סרט, החזר {"error": "לא מזוהה"}`
        ]);
        
        const text = result.response.text();
        const parsed = this.parseJSON(text);
        return parsed.movieTitle || null;
      });
    } catch (error) {
      console.error("AIService Error (Poster Vision):", error);
      return null;
    }
  }


  // ─── TTS ────────────────────────────────────────────────────────────────────

  /**
   * Text-to-Speech support
   */
  static async speak(
    text: string,
    options?: {
      onStart?: () => void;
      onDone?: () => void;
      onStopped?: () => void;
      onError?: (error: any) => void;
    }
  ) {
    if (Platform.OS === 'web') return;
    try {
      // Strip emojis, markdown, and special characters for better TTS
      const cleanText = text
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
        .replace(/[*_#`~]/g, '')
        .trim();

      Speech.speak(cleanText, {
        language: 'he-IL',
        pitch: 1.0,
        rate: 1.0,
        onStart: options?.onStart,
        onDone: options?.onDone,
        onStopped: options?.onStopped,
        onError: options?.onError,
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

  // ─── FEATURE 8: 2026 Proactive Intelligence ────────────────────────────────
  
  /**
   * Generates a proactive suggestion based on current time and user context
   * Part of the 2026 "Proactive Agent" strategy.
   */
  static async getProactiveMoodSuggestion(watchlistContext?: { titles: string[] }): Promise<{ greeting: string; suggestion: string; action: string }> {
    const hour = new Date().getHours();
    let timeContext = "בוקר";
    if (hour >= 12 && hour < 17) timeContext = "צהריים";
    else if (hour >= 17 && hour < 21) timeContext = "ערב";
    else if (hour >= 21 || hour < 5) timeContext = "לילה";

    const watchlistCount = watchlistContext?.titles.length || 0;
    
    const model = this.getModel();
    if (!model) {
      return {
        greeting: `שלום! ${timeContext} טוב.`,
        suggestion: watchlistCount > 0 ? `יש לך ${watchlistCount} סרטים שמחכים לך ברשימה. אולי תראה אחד מהם?` : "רוצה לגלות סרטים חדשים להיום?",
        action: "לגלות"
      };
    }

    try {
      return await this.withRetry(async () => {
        const prompt = `אתה ה-Concierge של סינבוק בשנת 2026. השעה עכשיו ${hour}:00 (${timeContext}). למשתמש יש ${watchlistCount} סרטים ברשימת הצפייה.
        צור הצעה פרואקטיבית בפורמט JSON בלבד:
        - greeting: ברכת שלום חמה ומותאמת לזמן (עברית)
        - suggestion: הצעה קצרה ומפתה לצפייה או גילוי (עברית, עד 15 מילים)
        - action: מילת פעולה קצרה לכפתור (עברית, עד 2 מילים)
        דוגמה: {"greeting": "ערב קולנועי מרהיב!", "suggestion": "יום ארוך עבר עליך, מה דעתך על קומדיה קלילה להירגע?", "action": "בוא נבחר"}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return this.parseJSON(text);
      });
    } catch (_error) {
      console.error("AIService Error (Proactive):", _error);
      return {
        greeting: `היי! ${timeContext} טוב.`,
        suggestion: "מוכן למסע קולנועי חדש?",
        action: "יאללה"
      };
    }
  }

  /**
   * Generates a custom film script and storyboard pitch directly on the client using Gemini.
   */
  static async generatePitchClientSide(movieTitle: string, prompt: string, castList: string[]): Promise<any> {
    const model = this.getModel("אתה תסריטאי ובמאי קולנוע מומחה. תפקידך ליצור תסריט לסרט קצר ולוח התרחשויות (storyboard) המבוסס על רעיון של המשתמש.");
    if (!model) {
      throw new Error("Gemini API Key missing on client");
    }

    const actor1 = castList[0] || 'שחקן 1';
    const actor2 = castList[1] || 'שחקן 2';
    const actor3 = castList[2] || 'שחקן 3';

    const modelPrompt = `צור תסריט קצר וסצנות storyboard מפורטות לסרט המבוסס על הסרט "${movieTitle}".
הרעיון הכללי של המשתמש הוא: "${prompt}"
השחקנים הראשיים שלוהקו לתפקיד הם: ${castList.join(', ')}

אנא צור בדיוק 3 סצנות מפתח. החזר תוצאה במבנה JSON תקין בלבד, ללא קוד markdown, ללא הקדמות וללא הערות.
מבנה ה-JSON חייב להיות בדיוק כזה:
{
  "posterConcept": "תיאור קולנועי מרהיב בעברית של כרזת הסרט המתאימה לאווירה (עד 20 מילים)",
  "scenes": [
    {
      "sceneNumber": 1,
      "visualPrompt": "תיאור ויזואלי מפורט של הסצנה עבור הבמאי/צייר בעברית (עד 15 מילים)",
      "visualPromptEnglish": "Detailed English image generation prompt for this scene (up to 15 words, must be in English, e.g. 'cinematic sword fight in ancient city, dramatic lighting')",
      "dialogue": "שורת דיאלוג דרמטית בעברית המיוחסת לאחד מהשחקנים שלוהקו (למשל, ${actor1}: 'שלום עולם')"
    },
    {
      "sceneNumber": 2,
      "visualPrompt": "תיאור ויזואלי של הסצנה השנייה בעברית (עד 15 מילים)",
      "visualPromptEnglish": "Detailed English image generation prompt for this scene (up to 15 words, must be in English)",
      "dialogue": "שורת דיאלוג של שחקן אחר (למשל, ${actor2}: 'אני כאן')"
    },
    {
      "sceneNumber": 3,
      "visualPrompt": "תיאור ויזואלי של הסצנה השלישית בעברית (עד 15 מילים)",
      "visualPromptEnglish": "Detailed English image generation prompt for this scene (up to 15 words, must be in English)",
      "dialogue": "שורת דיאלוג נוספת (למשל, ${actor3}: 'הסוף הגיע')"
    }
  ]
}
הקפד לכתוב את כל הדיאלוגים והתיאורים בעברית רהוטה וקולנועית, פרט ל-visualPromptEnglish שחייב להיות באנגלית בלבד.`;

    return await this.withRetry(async () => {
      const result = await model.generateContent(modelPrompt);
      const text = result.response.text();
      return this.parseJSON(text);
    });
  }

  /**
   * Generates a rich, cinematic actor biography using Gemini 3.5 Flash.
   */
  static async generateActorBiography(actorName: string): Promise<any> {
    const model = this.getModel(
      "You are a professional film historian and cinematic expert for CineBook. Generate an engaging, visually organized biography in Hebrew for the given actor. Break your response down into the requested Markdown headers. Maintain a high-end, cinematic narrative tone. Format all movie names, awards, and historical data neatly.",
      "gemini-3.5-flash"
    );
    
    if (!model) {
      throw new Error("Gemini API Key missing on client");
    }

    const prompt = `צור ביוגרפיה קולנועית מרתקת בעברית עבור השחקן/ית: ${actorName}.
החזר אך ורק אובייקט JSON תקין (ללא בלוקי markdown או הערות) במבנה הבא:
{
  "תקציר_ביוגרפי": "Short poetic narrative overview in Hebrew (about 3-4 sentences)",
  "חותם_אמנותי": "Acting style signature details in Hebrew (about 3 sentences)",
  "טריוויה": ["Fact 1 in Hebrew", "Fact 2 in Hebrew", "Fact 3 in Hebrew"],
  "תכונות_משחק": {
    "דרמה": 95,
    "כריזמה": 88,
    "גיוון": 92,
    "קומדיה": 75
  },
  "שאלון_טריוויה": [
    {
      "שאלה": "Trivia question in Hebrew",
      "אפשרויות": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "תשובה_נכונה": 0
    }
  ],
  "תפקידים_אייקונים": [
    {
      "שם_הסרט": "Movie Name in Hebrew",
      "שם_הדמות": "Character Name in Hebrew",
      "שנת_יציאה": "Release Year"
    }
  ]
}
הקפד על 3 שאלות ב'שאלון_טריוויה' ו-3 עד 5 תפקידים ב'תפקידים_אייקונים'. הערכים ב'תכונות_משחק' צריכים להיות מספרים בין 1 ל-100.`;

    return await this.withRetry(async () => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.parseJSON(text);
    });
  }

  /**
   * Translates a list of actor names to Hebrew using Gemini.
   */
  static async translateActorNames(names: string[]): Promise<Record<string, string>> {
    const model = this.getModel("אתה מתרגם מומחה. תפקידך לתרגם שמות של שחקני קולנוע מאנגלית לעברית (תעתיק מדויק בעברית).");
    if (!model) return {};

    const prompt = `תרגם את רשימת השמות הבאה מאנגלית לעברית (החזר תעתיק מדויק בעברית, למשל "Cillian Murphy" -> "קיליאן מרפי").
רשימת השמות:
${names.join('\n')}

החזר אך ורק אובייקט JSON של התרגום במבנה הבא:
{
  "שם באנגלית": "שם בעברית"
}
אל תצרף שום הערה או טקסט נוסף מחוץ ל-JSON.`;

    try {
      return await this.withRetry(async () => {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return this.parseJSON(text);
      });
    } catch (error) {
      console.error("AIService Error (Translate Actor Names):", error);
      return {};
    }
  }

  /**
   * Performs deep "Search Intelligence" — simulating agentic research
   */
  static async performCineIntelligence(query: string): Promise<string> {
    const model = this.getModel(`אתה סוכן AI מחקרי של סינבוק. המשימה שלך היא לבצע "CineIntelligence" — ניתוח מעמיק ומקצועי של מגמות, סרטים או יוצרים.`);
    if (!model) return "מבצע מחקר... נראה שסרטי אקשן הם הטרנד החם כרגע!";

    try {
      return await this.withRetry(async () => {
        const prompt = `בצע מחקר מעמיק על השאילתה: "${query}". 
        ספק דוח קצר (עד 80 מילים) הכולל:
        1. ניתוח טרנדים נוכחיים.
        2. המלצה מבוססת איכות אמנותית.
        3. עובדה אחת "מבפנים" (Insider information) שמשתמשים לא יודעים.
        הכל בעברית רהוטה וקולנועית.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
      });
    } catch (_error) {
      console.error("AIService Error (Intelligence):", _error);
      return "המחקר נתקל במכשול, אך נראה שהקולנוע ממשיך להפתיע!";
    }
  }

  /**
   * Generates a 2-3 sentence highly cinematic atmosphere narrative script in Hebrew based on a genre or custom prompt
   */
  static async generateAtmosphereNarrative(genre: string, customPrompt?: string): Promise<string> {
    const model = this.getModel("אתה סופר ועורך קולנועי מומחה המדריך את המאזין לתוך אווירה קולנועית עוצרת נשימה. מטרתך היא לכתוב פתיח קריינות קצר, עמוק ומלא השראה.");
    
    const targetPrompt = customPrompt ? `טקסט חופשי של המשתמש: "${customPrompt}"` : `ז'אנר קולנועי: "${genre}"`;
    
    if (!model) {
      return this.simulateAtmosphereNarrative(genre, customPrompt);
    }

    try {
      return await this.withRetry(async () => {
        const prompt = `כתוב קטע קריינות דרמטי, קולנועי וסוחף בעברית המבוסס על: ${targetPrompt}.
        הקטע חייב:
        1. להיות קצר ותמציתי (בין 2 ל-3 משפטים בלבד).
        2. להכניס את המאזין לאווירה המדויקת של הסוגה (למשל פחד עמוק לאימה, פליאה קוסמית למד"ב, התרגשות ואפיות לאקשן).
        3. להישמע מדהים בהקראה קולית (רדיופוני, עמוק ומלא מסתורין).
        4. להיות בעברית תקינה ומרגשת. אל תצרף שום הערות או כותרות, החזר רק את טקסט הקריינות עצמו.`;

        const result = await model.generateContent(prompt);
        const resText = await result.response;
        return resText.text().trim();
      });
    } catch (error) {
      console.error("AIService Error (Atmosphere Narrative):", error);
      return this.simulateAtmosphereNarrative(genre, customPrompt);
    }
  }

  /**
   * Offline simulation fallback for atmosphere narratives
   */
  private static simulateAtmosphereNarrative(genre: string, customPrompt?: string): string {
    const promptText = (customPrompt || genre || '').toLowerCase();
    
    if (promptText.includes('חלל') || promptText.includes('מד״ב') || promptText.includes('sci-fi') || promptText.includes('space')) {
      return "הנכם מרחפים אל מעמקי החלל האינסופי. בין כוכבים רחוקים וערפיליות זוהרות, סודות עתיקים של היקום עומדים להתגלות. התכוננו למסע קוסמי יוצא דופן.";
    }
    if (promptText.includes('אימה') || promptText.includes('horror') || promptText.includes('מפחיד') || promptText.includes('מתח')) {
      return "הצללים בחדר מתארכים, והשקט הופך כבד ומאיים. משהו נסתר מביט בכם מתוך האפלה, ממתין לרגע הנכון. האם תעזו לפקוח את העיניים?";
    }
    if (promptText.includes('דרמה') || promptText.includes('drama') || promptText.includes('רגש')) {
      return "לכל לב יש סיפור שטרם סופר, מנגינה שקטה של זיכרונות ואהבות אבודות. ברגע זה, גורלות נפגשים ורגשות עמוקים נחשפים אל האור. זהו רגע של אמת קולנועית.";
    }
    if (promptText.includes('פנטזיה') || promptText.includes('fantasy') || promptText.includes('קסם')) {
      return "ארצות אבודות של קסם ויצורים אגדיים מתעוררות לחיים סביבכם. חרבות עתיקות מנצנצות לאור הירח, והרפתקה אפית שאיש לא ישכח מתחילה כעת.";
    }
    return `ברוכים הבאים לטרקלין הסאונד המרחבי של סינבוק. עצמו את העיניים, נשמו עמוק, ותנו לצלילים לקחת אתכם למסע קולנועי מופלא מעבר לדמיון.`;
  }

  // ─── PRIVATE FALLBACKS ──────────────────────────────────────────────────────


  private static translateQueryToFiltersLegacy(query: string): Record<string, string> {
    const lower = query.toLowerCase();
    if (lower.includes('חלל') || lower.includes('space')) return { with_genres: '878' };
    if (lower.includes('מפחיד') || lower.includes('scary') || lower.includes('אימה')) return { with_genres: '27' };
    if (lower.includes('מצחיק') || lower.includes('funny') || lower.includes('קומדיה')) return { with_genres: '35' };
    if (lower.includes('רומנטי') || lower.includes('אהבה')) return { with_genres: '10749' };
    if (lower.includes('אקשן') || lower.includes('פעולה')) return { with_genres: '28' };
    if (lower.includes('מתח') || lower.includes('ריגוש')) return { with_genres: '53' };
    if (lower.includes('ילדים') || lower.includes('משפחה') || lower.includes('אנימציה')) return { with_genres: '16,10751' };
    return {};
  }

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
    const inputLower = input.toLowerCase();
    if (inputLower.includes('המלצה') || inputLower.includes('recommend') || inputLower.includes('מצב רוח')) {
      return '🎬 אני ממליץ בחום על "אופנהיימר". זה סרט אפי עם ביצועים מדהימים. אם אתה מחפש משהו קליל יותר, "ברבי" הוא בחירה מצוינת וצבעונית!';
    }
    if (inputLower.includes('שלום') || inputLower.includes('hi') || inputLower.includes('hello')) {
      return '👋 שלום! אני סייען ה-AI של סינבוק. איך אני יכול לעזור לך למצוא את הסרט המושלם להיום?';
    }
    if (inputLower.includes('טריוויה') || inputLower.includes('עובד')) {
      return '🎭 הידעת? הסרט "אינספשן" צולם ב-6 מדינות שונות, וכריסטופר נולאן כתב את התסריט במשך 10 שנים!';
    }
    if (inputLower.includes('רשימ')) {
      return '📋 אני יכול לנתח את רשימת הצפייה שלך ולהמליץ על סרטים שיתאימו לטעם שלך! פשוט שאל אותי "מה מתאים לי?"';
    }
    return '🍿 שאלה מצוינת! כדאי לבדוק את רשימת שוברי הקופות שלנו. יש שם כמה פנינים אמיתיות החודש. תרצה שאפרט?';
  }

  private static simulateMoodRec(mood: string): MoodRecommendation {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('עצוב') || moodLower.includes('sad')) {
      return { mood: 'עצוב', genres: '35,10751', description: 'קומדיות ומשפחה ירימו לך את מצב הרוח!' };
    }
    if (moodLower.includes('מלחיץ') || moodLower.includes('stress')) {
      return { mood: 'לחוץ', genres: '16,35', description: 'אנימציה וקומדיות קלילות יעזרו להירגע' };
    }
    if (moodLower.includes('הרפתקני') || moodLower.includes('adventur')) {
      return { mood: 'הרפתקני', genres: '28,12,878', description: 'אקשן, הרפתקאות ומדע בדיוני — עולם חדש מחכה!' };
    }
    return { mood: 'כללי', genres: '28,35,878', description: 'מבחר ז\'אנרים פופולריים להנאה מקסימלית' };
  }

  private static simulateTrivia(movieTitle: string): MovieTrivia {
    return {
      facts: [
        `הסרט "${movieTitle}" עבר תהליך פיתוח ארוך לפני שהגיע למסך הגדול`,
        'הבמאי ביצע שינויים משמעותיים בתסריט המקורי',
        'חלק מהסצנות צולמו במיקומים אמיתיים ולא בסטודיו'
      ],
      behindTheScenes: 'צוות ההפקה עבד יותר מ-12 שעות ביום כדי ליצור את האפקטים המיוחדים',
      funFact: 'אחד השחקנים הראשיים כמעט ויתר על התפקיד לפני שקרא את התסריט הסופי! 😲',
    };
  }

  private static simulateVisualDNA(movieTitle: string): MovieVisualDNA {
    const lower = movieTitle.toLowerCase();
    if (lower.includes('gladiator') || lower.includes('מלחמה') || lower.includes('דם') || lower.includes('קרב')) {
      return {
        primary: '#FF3B30',
        secondary: '#5856D6',
        accent: '#FFCC00',
        blurIntensity: 50,
        glassOpacity: 0.12,
        animationSpeed: 1400,
        moodNarrative: 'דרמת מלחמה אפית ועוצרת נשימה',
      };
    }
    if (lower.includes('moana') || lower.includes('ים') || lower.includes('הרפתק') || lower.includes('רוח')) {
      return {
        primary: '#34C759',
        secondary: '#007AFF',
        accent: '#FFD60A',
        blurIntensity: 70,
        glassOpacity: 0.18,
        animationSpeed: 2000,
        moodNarrative: 'מסע הרפתקאות צבעוני ומרגש לכל המשפחה',
      };
    }
    return {
      primary: '#FF1464',
      secondary: '#9B1B30',
      accent: '#E5FF00',
      blurIntensity: 60,
      glassOpacity: 0.15,
      animationSpeed: 1500,
      moodNarrative: 'חוויה קולנועית סוחפת ומרגשת',
    };
  }

  // ─── FEATURE 5: AI Snack Recommendations (CineMeal) ─────────────────────────
  
  /**
   * Generates AI snack recommendations based on movie details and showtime.
   * Returns a list of snack IDs.
   */
  static async getSnackRecommendations(
    movieTitle: string,
    showtimeFormat?: string,
    timeOfDay?: string
  ): Promise<string[]> {
    const model = this.getModel();
    if (!model) {
      console.log("[AIService] Gemini API key not present. Using offline snack recommendation simulation...");
      return this.simulateSnackRecommendations(movieTitle, timeOfDay);
    }

    try {
      return await this.withRetry(async () => {
        const prompt = `אתה סייען קולנוע חכם הממליץ על שילובי נשנושים אידיאליים מהמזנון.
סרט יעד: "${movieTitle}"
סוג הקרנה: "${showtimeFormat || 'רגיל'}"
שעה: "${timeOfDay || '19:30'}"

הנשנושים הזמינים במזנון שלנו הם:
- "p1" (פופקורן XL)
- "p2" (פופקורן קרמל)
- "d1" (קולה קלאסי)
- "d2" (סודה תפוזים)
- "c1" (קומבו מגה)
- "c2" (קומבו דייט)
- "cn1" (סוכריות גומי)

בהתבסס על ז'אנר הסרט הצפוי משמו, שעת ההקרנה וסוג האולם, בחר 2-3 פריטים המשלימים זה את זה בצורה הטובה ביותר (למשל: סרט משפחתי בצהריים יקבל פופקורן קרמל וסודה תפוזים; סרט מתח/דרמה בלילה יקבל קומבו מגה או פופקורן מלוח וקולה קלאסי).

החזר אך ורק מערך JSON המכיל את מזהי הפריטים הנבחרים בלבד (למשל: ["p1", "d1"]). אל תוסיף שום הערה, הסבר או תווים נוספים מחוץ ל-JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = this.parseJSON(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return this.simulateSnackRecommendations(movieTitle, timeOfDay);
      });
    } catch (error) {
      console.error("AIService Error (Snacks Recommendation):", error);
      return this.simulateSnackRecommendations(movieTitle, timeOfDay);
    }
  }

  /**
   * Offline simulation fallback for snack recommendations
   */
  private static simulateSnackRecommendations(movieTitle: string, timeOfDay?: string): string[] {
    const titleLower = movieTitle.toLowerCase();
    const isLateNight = timeOfDay ? parseInt(timeOfDay.split(':')[0], 10) >= 21 : false;

    // Kids / Family movies
    if (
      titleLower.includes('moana') || 
      titleLower.includes('מואנה') || 
      titleLower.includes('משפחה') || 
      titleLower.includes('toy story') ||
      titleLower.includes('מלך האריות')
    ) {
      return ['p2', 'd2', 'cn1']; // פופקורן קרמל + סודה תפוזים + סוכריות גומי
    }

    // Romance / Date night
    if (titleLower.includes('אהבה') || titleLower.includes('רומנט') || titleLower.includes('date') || titleLower.includes('love')) {
      return ['c2']; // קומבו דייט
    }

    // Late night action/horror/thriller
    if (isLateNight || titleLower.includes('גלדיאטור') || titleLower.includes('gladiator') || titleLower.includes('אימה') || titleLower.includes('מתח')) {
      return ['p1', 'd1']; // פופקורן XL + קולה קלאסי
    }

    // Default recommendation
    return ['p1', 'd1', 'cn1']; // פופקורן XL + קולה קלאסי + סוכריות גומי
  }
}

