export const he = {
  app: {
    title: 'סימולטור מודלים חישוביים',
    home: 'דף הבית',
    dfa: 'אוטומט סופי',
    pda: 'אוטומט מחסנית ',
    tm: 'מכונת טיורינג',
  },
  home: {
    intro: 'בחרו מודל חישוב כדי להתחיל לבנות מכונה.',
    chooseDfa: 'אוטומט סופי',
    choosePda: 'אוטומט מחסנית',
    chooseTm: 'מכונת טיורינג',
    descDfa: 'בנו מכונה שקוראת מילה ומחליטה אם לקבל אותה.',
    descPda: 'הוסיפו מחסנית למכונה לזיהוי שפות מורכבות יותר.',
    descTm: 'מכונה עם סרט אינסופי שיכולה לקרוא ולכתוב.',
  },
  toolbar: {
    addState: 'הוסף מצב',
    deleteSelected: 'מחק נבחרים',
    clearAll: 'נקה הכל',
    runTest: 'הרצת בדיקה',
    helpHint: 'גרור מצב כדי להזיז · גרור מנקודה אחת לאחרת כדי ליצור מעבר · לחיצה כפולה למצב מקבל',
  },
  state: {
    accepting: 'מצב מקבל',
    notAccepting: 'מצב רגיל',
    start: 'מצב התחלתי',
    setStart: 'הגדר כמצב התחלתי',
    toggleAccepting: 'הפוך למקבל / לא מקבל',
    rename: 'שינוי שם',
    delete: 'מחיקה',
  },
  transition: {
    editTitle: 'עריכת מעבר',
    letterPlaceholder: 'אות',
    lettersHint: 'הקלידו אות אחת או כמה (מופרדות בפסיק) שעוברות על המעבר הזה.',
    deleteTransition: 'מחק מעבר',
    pdaRead: 'קוראים',
    pdaPop: 'בראש המחסנית',
    pdaPush: 'דוחפים למחסנית',
    tmRead: 'קוראים',
    tmWrite: 'כותבים',
    tmDirection: 'תנועה',
    tmLeft: 'שמאלה',
    tmRight: 'ימינה',
    tmStay: 'במקום',
    epsilon: 'ריק',
    epsilonHint: 'השאירו ריק כדי לציין מעבר ללא קריאה',
    addRule: 'הוסיפו כלל',
    removeRule: 'מחקו כלל',
    pdaStackOp: 'פעולה',
  },
  test: {
    inputLabel: 'הקלידו מילה לבדיקה',
    inputPlaceholder: 'למשל: aab',
    run: 'הרץ',
    reset: 'אתחל',
    pause: 'השהה',
    resume: 'המשך',
    speed: 'מהירות',
    accepted: 'המילה התקבלה ✔',
    rejected: 'המילה לא התקבלה ✖',
    running: 'רץ...',
    noStart: 'אי אפשר להריץ — אין מצב התחלתי',
    currentState: 'מצב נוכחי',
    tape: 'סרט',
    stack: 'מחסנית',
    head: 'ראש קריאה/כתיבה',
  },
  // Per-machine strings — edit title/stuck/alerts here to customize per machine type
  machines: {
    dfa: {
      test: {
        title: 'בדיקת האוטומט',
        stuck: 'האוטומט נתקע — אין מעבר מתאים',
      },
      alerts: {
        title: 'התראות על האוטומט',
        none: 'הכל בסדר! לא נמצאו בעיות.',
        noStart: 'אין מצב התחלתי. בחרו מצב והגדירו אותו כהתחלתי.',
        noAccepting: 'אין אף מצב מקבל. האוטומט לעולם לא יקבל מילה.',
        multipleStarts: 'יש יותר ממצב התחלתי אחד.',
        nonDeterministicSummary: 'האוטומט אינו דטרמיניסטי',
        nonDeterministicDetail: (state: string, letter: string) =>
          `מצב "${state}", אות "${letter}" — מעבר כפול`,
        incompleteSummary: 'האוטומט אינו שלם — חסרים מעברים',
        incompleteDetail: (state: string, letter: string) =>
          `מצב "${state}": חסר מעבר על "${letter}"`,
        unreachable: (state: string) =>
          `המצב "${state}" לא ניתן להגעה מהמצב ההתחלתי.`,
        emptyMachine: 'האוטומט ריק. הוסיפו מצב כדי להתחיל.',
        selfEpsilonLoop: (state: string) =>
          `מעבר ריק מ-"${state}" אל עצמו — עלול לגרום ללולאה אינסופית.`,
      },
    },
    pda: {
      test: {
        title: 'בדיקת האוטומט',
        stuck: 'האוטומט נתקע — אין מעבר מתאים',
      },
      alerts: {
        title: 'התראות על האוטומט',
        none: 'הכל בסדר! לא נמצאו בעיות.',
        noStart: 'אין מצב התחלתי. בחרו מצב והגדירו אותו כהתחלתי.',
        noAccepting: 'אין אף מצב מקבל. האוטומט לעולם לא יקבל מילה.',
        multipleStarts: 'יש יותר ממצב התחלתי אחד.',
        emptyMachine: 'האוטומט ריק. הוסיפו מצב כדי להתחיל.',
        selfEpsilonLoop: (state: string) =>
          `מעבר ריק מ-"${state}" אל עצמו — עלול לגרום ללולאה אינסופית.`,
        unreachable: (state: string) =>
          `המצב "${state}" לא ניתן להגעה מהמצב ההתחלתי.`,
      },
    },
    tm: {
      test: {
        title: 'בדיקת המכונה',
        stuck: 'המכונה נתקעה — אין מעבר מתאים',
      },
      alerts: {
        title: 'התראות על המכונה',
        none: 'הכל בסדר! לא נמצאו בעיות.',
        noStart: 'אין מצב התחלתי. בחרו מצב והגדירו אותו כהתחלתי.',
        noAccepting: 'אין אף מצב מקבל. המכונה לעולם לא תקבל מילה.',
        multipleStarts: 'יש יותר ממצב התחלתי אחד.',
        emptyMachine: 'המכונה ריקה. הוסיפו מצב כדי להתחיל.',
        selfEpsilonLoop: (state: string) =>
          `מעבר ריק מ-"${state}" אל עצמו — עלול לגרום ללולאה אינסופית.`,
        unreachable: (state: string) =>
          `המצב "${state}" לא ניתן להגעה מהמצב ההתחלתי.`,
      },
    },
  },
  errors: {
    duplicateTransition: 'מעבר כזה כבר קיים — לא ניתן ליצור מעבר כפול בין אותם מצבים.',
    emptyPush: 'חובה לדחוף אות למחסנית ',
  },
  editPanel: {
    title: 'עריכת מצב',
    stateName: 'שם המצב',
    isAccepting: 'מצב מקבל',
    deleteState: 'מחק מצב',
    addTransition: 'הוסף מעבר',
  },
  pendingTransition: {
    banner: 'לחץ על מצב יעד כדי להוסיף מעבר',
    cancel: 'ביטול',
  },
  buttons: {
    save: 'שמור',
    cancel: 'בטל',
    confirm: 'אשר',
    close: 'סגור',
    seeWhy: 'פרטים',
  },
} as const;

export type Strings = typeof he;
