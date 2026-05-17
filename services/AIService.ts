import { GoogleGenerativeAI } from "@google/generative-ai";
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Service ──────────────────────────────────────────────────────────────────
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

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      });
    } catch (error) {
      console.error("AIService Error (Insights):", error);
      return this.simulateInsights(movieTitle);
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
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
   * Processes audio recording (base64) and extracts semantic filters using Gemini
   */
  static async processVoiceSearch(audioBase64: string): Promise<Record<string, string>> {
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
      });
    } catch (error) {
      console.error("AIService Error (Voice Search):", error);
      return {};
    }
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
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
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
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
}
