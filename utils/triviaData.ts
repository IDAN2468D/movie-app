export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export const MOVIE_TRIVIA_DATABASE: Record<string, TriviaQuestion[]> = {
  "דדפול & וולברין": [
    {
      question: "מי מגלם את דמותו של דדפול (ווייד וילסון) בסדרת הסרטים?",
      options: ["יו ג'קמן", "רייאן ריינולדס", "כריס אוונס", "רוברט דאוני ג'וניור"],
      correctAnswerIndex: 1,
      explanation: "רייאן ריינולדס מגלם את דדפול ומפיק את הסרטים, והוא ידוע בהומור המטא המיוחד שלו.",
    },
    {
      question: "מהו סוג הנשק העיקרי והמזוהה ביותר של דדפול?",
      options: ["פטיש קרב", "מגן ויברניום", "זוג חרבות קטאנה", "קשת וחצים דיגיטליים"],
      correctAnswerIndex: 2,
      explanation: "דדפול משתמש בעיקר בזוג חרבות קטאנה כפולות אותן הוא נושא על גבו.",
    },
    {
      question: "מהו שם הסוכן מה-TVA שפוגש את דדפול בתחילת הסרט?",
      options: ["מר פרדוקס", "סוכן מוביוס", "השופטת רנסלייר", "קאנג הכובש"],
      correctAnswerIndex: 0,
      explanation: "מר פרדוקס (בגילומו של מת'יו מקפדיין) הוא הסוכן המושחת מה-TVA שמנסה להשמיד את ציר הזמן של דדפול.",
    },
  ],
  "הקול בראש 2": [
    {
      question: "איזה רגש חדש בצבע כתום מגיע למפקדת הרגשות של ריילי בבגרותה?",
      options: ["קנאה", "מבוכה", "חרדה", "שעמום"],
      correctAnswerIndex: 2,
      explanation: "חרדה (Anxiety) היא הדמות הכתומה החדשה שמשתלטת על מפקדת הרגשות בגיל ההתבגרות.",
    },
    {
      question: "לאיזה ענף ספורט ריילי מנסה להתקבל במחנה הקיץ?",
      options: ["הוקי קרח", "כדורגל בנות", "כדורסל תיכון", "שחייה צורנית"],
      correctAnswerIndex: 0,
      explanation: "ריילי היא שחקנית הוקי קרח מוכשרת ומנסה להתקבל לקבוצת ה'פייר הוקס'.",
    },
    {
      question: "מהו הצבע המזוהה עם הרגש 'שמחה' (Joy)?",
      options: ["כחול", "צהוב", "ירוק", "סגול"],
      correctAnswerIndex: 1,
      explanation: "שמחה מיוצגת על ידי צבע צהוב בוהק עם שיער כחול זוהר.",
    },
  ],
  "דיונה: חלק שני": [
    {
      question: "מי מגלם את הדמות הראשית, פול אטריידיס, בסרט?",
      options: ["טימותי שאלאמה", "אוסטין באטלר", "זנדאיה", "פלורנס פיו"],
      correctAnswerIndex: 0,
      explanation: "טימותי שאלאמה מגלם את פול אטריידיס (מועד'יב) המוביל את הדרור של כוכב אראקיס.",
    },
    {
      question: "איזה יצור ענק משמש לרכיבה עבור הדרורים (הפרמנים) במדבריות אראקיס?",
      options: ["לטאות חול", "עקבי ענק", "עקשני מדבר", "עקלתון החול (שלשול ענק)"],
      correctAnswerIndex: 3,
      explanation: "עקלתון החול (Shai-Hulud) הוא תולעת החול הענקית שדרורי המדבר לומדים לרכוב עליה.",
    },
    {
      question: "מהו המשאב היקר ביותר ביקום של דיונה שנמצא רק באראקיס?",
      options: ["ויברניום", "התבלין (מלאנז')", "קריפטונייט", "זהב נוזלי"],
      correctAnswerIndex: 1,
      explanation: "התבלין (Melange) מאפשר קיפול מרחב וניווט בין-כוכבי והוא המשאב היקר ביותר בגלקסיה.",
    },
  ],
};

export const GENERAL_CINEMA_TRIVIA: TriviaQuestion[] = [
  {
    question: "מי ביים את סרטי המופת 'טיטאניק' (1997) ו'אווטאר' (2009)?",
    options: ["סטיבן ספילברג", "כריסטופר נולאן", "ג'יימס קמרון", "קוונטין טרנטינו"],
    correctAnswerIndex: 2,
    explanation: "ג'יימס קמרון ביים את שני הסרטים ששברו את שיאי ההכנסות של כל הזמנים בקולנוע.",
  },
  {
    question: "איזה סרט עשה היסטוריה בשנת 2020 כסרט הזר הראשון שזכה באוסקר לסרט הטוב ביותר?",
    options: ["רומא", "פרזיטים", "חיים של אחרים", "אמילי"],
    correctAnswerIndex: 1,
    explanation: "הסרט הדרום-קוריאני 'פרזיטים' (Parasite) בבימויו של בונג ג'ון-הו זכה בפרס הסרט הטוב ביותר בטקס האוסקר ה-92.",
  },
  {
    question: "מי גילם את הג'וקר בסרט 'האביר האפל' (2008) וזכה על כך באוסקר לאחר מותו?",
    options: ["חואקין פיניקס", "ג'ק ניקולסון", "הית' לדג'ר", "ג'ארד לטו"],
    correctAnswerIndex: 2,
    explanation: "הית' לדג'ר נתן הופעה בלתי נשכחת כג'וקר וזכה בפרס האוסקר לשחקן המשנה הטוב ביותר לאחר מותו הטראגי.",
  },
  {
    question: "איזו חברת הפקה יצרה את סרט האנימציה הממוחשב הראשון באורך מלא, 'צעצוע של סיפור' (1995)?",
    options: ["פיקסאר", "דרימוורקס", "דיסני", "אילומיניישן"],
    correctAnswerIndex: 0,
    explanation: "פיקסאר (Pixar Animation Studios) יצרה את 'צעצוע של סיפור' שהיה פורץ דרך בהיסטוריית האנימציה.",
  },
  {
    question: "כמה סרטים בסך הכל הופקו בטרילוגיית 'שר הטבעות' המקורית בבימויו של פיטר ג'קסון?",
    options: ["2 סרטים", "3 סרטים", "4 סרטים", "5 סרטים"],
    correctAnswerIndex: 1,
    explanation: "טרילוגיית 'שר הטבעות' כוללת 3 סרטים: אחוות הטבעת, שני הצריחים, ושיבת המלך.",
  },
];

export function getTriviaForMovie(title: string): TriviaQuestion[] {
  // Normalize title search
  const keys = Object.keys(MOVIE_TRIVIA_DATABASE);
  const foundKey = keys.find(k => title.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(title.toLowerCase()));
  
  if (foundKey) {
    return MOVIE_TRIVIA_DATABASE[foundKey];
  }
  
  // Return a randomized subset of 3 general questions as fallback
  const shuffled = [...GENERAL_CINEMA_TRIVIA].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}
