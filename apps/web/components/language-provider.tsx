"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "cs";
const storageKey = "lva-houses-language";

const messages = {
  en: {
    language: "Language", mainNavigation: "Main navigation", standings: "Standings", signIn: "Sign in", openPortal: "Open your portal", portal: "Portal",
    housePoints: "House points", atAGlance: "at a glance.", overview: "See how every house is progressing, celebrate individual effort, and sign in to explore your own point story.",
    signInPortal: "Sign in to your portal", viewAll: "View all houses", leadingHouse: "Leading house", leadingStudent: "Leading student",
    houseLeaders: "House leaders", bestInHouse: "Best student in every house", recognitionAcademy: "Recognition across the academy",
    noLeader: "No student leader yet", firstAchievement: "The first achievement will appear here", everyHouse: "Every house, at a glance",
    standingsEmpty: "Standings will appear once the school is set up.", achievementsEmpty: "Student achievements will appear here.",
    studentsTitle: "Students", studentsDescription: "see their points, achievements and category progress.", teachersTitle: "Teachers",
    teachersDescription: "recognise a contribution with a clear reason.", everyPointTitle: "Every point", everyPointDescription: "is recorded in a transparent ledger.",
    meetHouses: "Meet the houses", chooseHouse: "Choose a house to learn what it stands for", resultsEmpty: "Results will appear here once the school is set up.",
    sharedPlace: "A shared place to contribute and grow.", houseIdentity: "House identity", explore: "Explore",
    backToStandings: "Back to standings", back: "Back", houseHistory: "House history", progressWeekly: "Progress, one week at a time.",
    historyDescription: "Totals are calculated from the same points ledger shown to staff and students.", houseNotFound: "House not found.", noHouseActivity: "No house activity has been recorded yet.",
    welcomeBack: "Welcome back", portalSignIn: "Portal sign in", enterPortal: "Enter your portal", goodToSeeYou: "Good to see you.",
    loginDescription: "Sign in to recognise effort, see progress and keep every point meaningful.", emailOrUsername: "Email or username", password: "Password",
    forgotPassword: "Forgot your password?", noAccount: "If you do not have an account, ask a school administrator.", backToSignIn: "Back to sign in",
    simplePeople: "Simple for people.", reliableSchool: "Reliable for the school.", pleaseWait: "Please wait…", tryAgain: "Please try again.",
    accountRecovery: "Account recovery", saferBeginning: "A safer beginning", backSafely: "Back in safely.", setupTone: "Set the tone for a fairer house system.",
    firstSetup: "First-time setup", createSchoolAdmin: "Create the school administrator", createAdmin: "Create administrator",
    setupDescription: "Create the first administrator account. Keep the one-time setup token in your school password manager.", schoolName: "School name", yourName: "Your name",
    fullName: "Your full name", username: "Username", emailAddress: "Email address", setupToken: "One-time setup token",
    resetPassword: "Reset your password", choosePassword: "Choose a new password", sendResetLink: "Send reset link", savePassword: "Save new password",
    forgotDescription: "Enter the school email address linked to your account. If it is active, we will send a one-time reset link.", newPasswordDescription: "Use a new password that you do not use elsewhere.",
    schoolEmail: "School email address", newPassword: "New password", confirmPassword: "Confirm new password", atLeast14: "At least 14 characters", repeatPassword: "Repeat your new password",
    invalidReset: "This reset link is incomplete or invalid. Request a new link to continue.", spamHint: "If you do not receive a message, check your spam folder or ask the school administrator to confirm that your account email is correct.",
    localDemo: "Local demo mode — changes are saved in this browser.", resetDemo: "Reset demo", signOut: "Sign out", openingPortal: "Opening your portal…", sessionNeeded: "Session needed",
    hello: "Hello", studentHeadline: "Your contribution, made visible.", teacherHeadline: "Make recognition feel timely and specific.", adminHeadline: "A clear system needs thoughtful stewardship.",
    studentIntro: "Your points and the reasons behind them are all here.", staffIntro: "Your actions are recorded clearly, so the whole school can trust the system.",
    yourPoints: "Your points", pointsToDate: "points to date", strongestCategory: "Strongest category", nextOpportunity: "Next opportunity",
    progressHere: "Your progress will appear here", categoryToBuild: "A category to keep building", everyContribution: "Every contribution counts",
    awardsGiven: "Awards given", ledgerEntries: "Ledger entries", latestEntries: "in the latest 100 entries", noPointsYet: "No points yet",
    builtFor: "Built for", recognition: "Recognition", stewardship: "Stewardship", clearRecords: "Clear roles, clear records",
    noPointsRecorded: "No points have been recorded yet.", undo: "Undo", categoryOverview: "Your category overview", shineNext: "Where you shine — and what to build next.",
    defaultCategories: "Learning · Behaviour · Projects · Participation", noAchievements: "No achievements recorded yet", strongestLabel: "Your strongest category",
    roomToContribute: "There is room here for your next contribution.", readyWhenYouAre: "Ready when you are", firstAchievementNext: "Your first achievement is next.",
    progressExplanation: "As points are awarded, this page will show your strongest categories and where to focus.", awardPoints: "Award points",
    awardDescription: "Choose a student, name what they did, and keep the reason specific.", findStudent: "Find a student", searchStudent: "Search by student or house",
    studentLabel: "Student", chooseStudent: "Choose a student", categoryLabel: "Category", chooseCategory: "Choose a category", upTo: "up to",
    quickCategory: "Quick category selection", pointsLabel: "Points", reason: "Reason", reasonPlaceholder: "What should this student be recognised for?", saving: "Saving…",
    awardSuccess: "Points awarded. The ledger and standings are up to date.", schoolControls: "School controls", keepFair: "Keep the system fair",
    people: "People", houses: "Houses", categories: "Categories", administration: "Administration", findPerson: "Find a person", searchPeople: "Search people",
    noHouse: "No house", active: "active", inactive: "inactive", edit: "Edit", deactivate: "Deactivate", activate: "Activate", noMatchingPeople: "No matching people.",
    editAccount: "Edit account", addAccount: "Add an account", temporaryPassword: "Temporary password", optionalPassword: "New password (optional)",
    roleStudent: "Student", roleTeacher: "Teacher", roleAdmin: "Administrator", chooseStudentHouse: "No house / choose for student", cancel: "Cancel",
    saveAccount: "Save account", createAccount: "Create account", editHouse: "Edit house", addHouse: "Add a house", houseName: "House name",
    houseMeaning: "Meaning, e.g. Curiosity", houseSymbol: "Symbol, e.g. Set of keys", houseDescription: "What this house stands for", saveHouse: "Save house", createHouse: "Create house",
    fixedEmblems: "House emblems are fixed in this local demo.", houseImage: "House image", chooseAHouse: "Choose a house", uploadImage: "Upload image",
    imageHelp: "PNG, JPEG or WebP · up to 2 MB", editCategory: "Edit category", addCategory: "Add a category", maximum: "Maximum", pointsPerAward: "points per award",
    leadershipExample: "e.g. Leadership", maximumPoints: "Maximum points", activeForAwards: "Active and available for awards", saveCategory: "Save category", createCategory: "Create category",
    yourAchievements: "Your achievements", recentActivity: "Recent activity", pointsStory: "The story behind your points", pointsLedger: "Points ledger",
    period: "Period", allActivity: "All activity", thisMonth: "This month", previousMonth: "Previous month", light: "Light", dark: "Dark",
    switchLight: "Switch to light theme", switchDark: "Switch to dark theme"
  },
  cs: {
    language: "Jazyk", mainNavigation: "Hlavní navigace", standings: "Pořadí", signIn: "Přihlásit se", openPortal: "Otevřít portál", portal: "Portál",
    housePoints: "Body týmů", atAGlance: "na první pohled.", overview: "Sledujte, jak si jednotlivé školní týmy vedou, oceňujte úsilí studentů a po přihlášení si prohlédněte vlastní bodový přehled.",
    signInPortal: "Přihlásit se do portálu", viewAll: "Zobrazit všechny týmy", leadingHouse: "Vedoucí tým", leadingStudent: "Nejúspěšnější student",
    houseLeaders: "Lídři týmů", bestInHouse: "Nejlepší student každého týmu", recognitionAcademy: "Úspěchy napříč akademií",
    noLeader: "Zatím bez studentského lídra", firstAchievement: "První úspěch se zobrazí zde", everyHouse: "Přehled všech týmů",
    standingsEmpty: "Pořadí se zobrazí po dokončení nastavení školy.", achievementsEmpty: "Úspěchy studentů se zobrazí zde.",
    studentsTitle: "Studenti", studentsDescription: "vidí své body, úspěchy a postup v jednotlivých kategoriích.", teachersTitle: "Učitelé",
    teachersDescription: "oceňují konkrétní přínos a vždy uvádějí jasný důvod.", everyPointTitle: "Každý bod", everyPointDescription: "je zaznamenán v přehledné historii.",
    meetHouses: "Poznejte školní týmy", chooseHouse: "Vyberte tým a zjistěte, co představuje", resultsEmpty: "Výsledky se zobrazí po dokončení nastavení školy.",
    sharedPlace: "Společenství, ve kterém může každý přispět a růst.", houseIdentity: "Symbol týmu", explore: "Prohlédnout",
    backToStandings: "Zpět na pořadí", back: "Zpět", houseHistory: "Historie týmu", progressWeekly: "Vývoj po jednotlivých týdnech.",
    historyDescription: "Součty vycházejí ze stejné bodové historie, kterou vidí zaměstnanci i studenti.", houseNotFound: "Tým nebyl nalezen.", noHouseActivity: "U tohoto týmu zatím nebyla zaznamenána žádná aktivita.",
    welcomeBack: "Vítejte zpět", portalSignIn: "Přihlášení do portálu", enterPortal: "Vstupte do svého portálu", goodToSeeYou: "Rádi vás opět vidíme.",
    loginDescription: "Přihlaste se, oceňujte úsilí, sledujte pokrok a dejte každému bodu jasný význam.", emailOrUsername: "E-mail nebo uživatelské jméno", password: "Heslo",
    forgotPassword: "Zapomněli jste heslo?", noAccount: "Pokud nemáte účet, obraťte se na správce školy.", backToSignIn: "Zpět k přihlášení",
    simplePeople: "Jednoduché pro uživatele.", reliableSchool: "Spolehlivé pro školu.", pleaseWait: "Čekejte prosím…", tryAgain: "Zkuste to prosím znovu.",
    accountRecovery: "Obnovení účtu", saferBeginning: "Bezpečný začátek", backSafely: "Bezpečně zpět.", setupTone: "Nastavte spravedlivá pravidla systému školních týmů.",
    firstSetup: "První nastavení", createSchoolAdmin: "Vytvoření správce školy", createAdmin: "Vytvořit správce",
    setupDescription: "Vytvořte první účet správce. Jednorázový instalační token uložte do školního správce hesel.", schoolName: "Název školy", yourName: "Vaše jméno",
    fullName: "Jméno a příjmení", username: "Uživatelské jméno", emailAddress: "E-mailová adresa", setupToken: "Jednorázový instalační token",
    resetPassword: "Obnovení hesla", choosePassword: "Zvolte nové heslo", sendResetLink: "Odeslat odkaz pro obnovu", savePassword: "Uložit nové heslo",
    forgotDescription: "Zadejte školní e-mailovou adresu propojenou s účtem. Pokud je účet aktivní, zašleme jednorázový odkaz pro obnovu hesla.", newPasswordDescription: "Zvolte heslo, které nepoužíváte u žádné jiné služby.",
    schoolEmail: "Školní e-mailová adresa", newPassword: "Nové heslo", confirmPassword: "Potvrzení nového hesla", atLeast14: "Alespoň 14 znaků", repeatPassword: "Zopakujte nové heslo",
    invalidReset: "Odkaz pro obnovu hesla je neúplný nebo neplatný. Vyžádejte si nový.", spamHint: "Pokud zpráva nepřišla, zkontrolujte nevyžádanou poštu nebo požádejte správce školy o kontrolu e-mailové adresy u vašeho účtu.",
    localDemo: "Místní ukázkový režim — změny se ukládají v tomto prohlížeči.", resetDemo: "Obnovit ukázku", signOut: "Odhlásit se", openingPortal: "Otevírání portálu…", sessionNeeded: "Je nutné se přihlásit",
    hello: "Dobrý den", studentHeadline: "Váš přínos je konečně vidět.", teacherHeadline: "Oceňujte včas a konkrétně.", adminHeadline: "Přehledný systém potřebuje pečlivou správu.",
    studentIntro: "Zde najdete své body i důvody, za které jste je získali.", staffIntro: "Všechny vaše kroky jsou přehledně zaznamenány, aby škola mohla systému důvěřovat.",
    yourPoints: "Vaše body", pointsToDate: "bodů celkem", strongestCategory: "Nejsilnější kategorie", nextOpportunity: "Prostor ke zlepšení",
    progressHere: "Zde se zobrazí váš pokrok", categoryToBuild: "Kategorie, kterou můžete dále rozvíjet", everyContribution: "Každý přínos se počítá",
    awardsGiven: "Udělená ocenění", ledgerEntries: "Záznamy v historii", latestEntries: "z posledních 100 záznamů", noPointsYet: "Zatím žádné body",
    builtFor: "Hlavní účel", recognition: "Oceňování", stewardship: "Správa", clearRecords: "Jasné role a přehledné záznamy",
    noPointsRecorded: "Zatím nebyly zaznamenány žádné body.", undo: "Vrátit", categoryOverview: "Přehled vašich kategorií", shineNext: "V čem vynikáte a co můžete dále rozvíjet.",
    defaultCategories: "Studium · Chování · Projekty · Aktivita v hodinách", noAchievements: "Zatím bez zaznamenaných úspěchů", strongestLabel: "Vaše nejsilnější kategorie",
    roomToContribute: "Právě zde je prostor pro váš další přínos.", readyWhenYouAre: "Můžete začít", firstAchievementNext: "Váš první úspěch může přijít právě teď.",
    progressExplanation: "Jakmile získáte body, tato stránka ukáže vaše nejsilnější kategorie i oblasti, na které se zaměřit.", awardPoints: "Udělit body",
    awardDescription: "Vyberte studenta, popište jeho přínos a uveďte konkrétní důvod.", findStudent: "Najít studenta", searchStudent: "Hledat podle studenta nebo týmu",
    studentLabel: "Student", chooseStudent: "Vyberte studenta", categoryLabel: "Kategorie", chooseCategory: "Vyberte kategorii", upTo: "nejvýše",
    quickCategory: "Rychlý výběr kategorie", pointsLabel: "Body", reason: "Důvod", reasonPlaceholder: "Za co má student body získat?", saving: "Ukládání…",
    awardSuccess: "Body byly uděleny. Historie i pořadí jsou aktuální.", schoolControls: "Správa školy", keepFair: "Udržujte systém spravedlivý",
    people: "Uživatelé", houses: "Týmy", categories: "Kategorie", administration: "Administrace", findPerson: "Najít uživatele", searchPeople: "Hledat uživatele",
    noHouse: "Bez týmu", active: "aktivní", inactive: "neaktivní", edit: "Upravit", deactivate: "Deaktivovat", activate: "Aktivovat", noMatchingPeople: "Žádní odpovídající uživatelé.",
    editAccount: "Upravit účet", addAccount: "Přidat účet", temporaryPassword: "Dočasné heslo", optionalPassword: "Nové heslo (nepovinné)",
    roleStudent: "Student", roleTeacher: "Učitel", roleAdmin: "Správce", chooseStudentHouse: "Bez týmu / u studenta vyberte tým", cancel: "Zrušit",
    saveAccount: "Uložit účet", createAccount: "Vytvořit účet", editHouse: "Upravit tým", addHouse: "Přidat tým", houseName: "Název týmu",
    houseMeaning: "Hodnota, např. zvídavost", houseSymbol: "Symbol, např. svazek klíčů", houseDescription: "Co tento tým představuje", saveHouse: "Uložit tým", createHouse: "Vytvořit tým",
    fixedEmblems: "Emblémy týmů jsou v místní ukázce pevně nastavené.", houseImage: "Obrázek týmu", chooseAHouse: "Vyberte tým", uploadImage: "Nahrát obrázek",
    imageHelp: "PNG, JPEG nebo WebP · nejvýše 2 MB", editCategory: "Upravit kategorii", addCategory: "Přidat kategorii", maximum: "Nejvýše", pointsPerAward: "bodů za jedno ocenění",
    leadershipExample: "např. vedení ostatních", maximumPoints: "Maximální počet bodů", activeForAwards: "Aktivní a dostupná pro udělování bodů", saveCategory: "Uložit kategorii", createCategory: "Vytvořit kategorii",
    yourAchievements: "Vaše úspěchy", recentActivity: "Nedávná aktivita", pointsStory: "Za co jste získali body", pointsLedger: "Bodová historie",
    period: "Období", allActivity: "Veškerá aktivita", thisMonth: "Tento měsíc", previousMonth: "Předchozí měsíc", light: "Světlý", dark: "Tmavý",
    switchLight: "Přepnout na světlý motiv", switchDark: "Přepnout na tmavý motiv"
  }
} as const;

type Copy = { [Key in keyof typeof messages.en]: string };
const builtins: Record<Language, Record<string, string>> = {
  en: {},
  cs: {
    Curiosity: "Zvídavost", Empathy: "Empatie", Honesty: "Čestnost", Wisdom: "Moudrost",
    "Set of keys": "Svazek klíčů", Hand: "Ruce", Mirror: "Zrcadlo", Owl: "Sova",
    "Illumination begins with questions, discovery and the courage to unlock new knowledge.": "Poznání začíná otázkami, objevováním a odvahou otevírat nové vědomosti.",
    "Empathy brings people together through care, understanding and shared humanity.": "Empatie spojuje lidi prostřednictvím péče, porozumění a společné lidskosti.",
    "Honesty asks us to reflect clearly, speak truthfully and act with integrity.": "Čestnost nás vede k jasnému uvažování, pravdivému jednání a osobní integritě.",
    "Wisdom grows through thoughtful learning, perspective and purposeful choices.": "Moudrost roste díky promyšlenému učení, nadhledu a uvážlivým rozhodnutím.",
    Learning: "Studium", Behaviour: "Chování", Projects: "Projekty", Participation: "Aktivita v hodinách", "Lesson participation": "Aktivita v hodinách"
  }
};

const czechErrors: Record<string, string> = {
  "Please try again.": "Zkuste to prosím znovu.",
  "We could not complete that request.": "Požadavek se nepodařilo dokončit.",
  "Please sign in again.": "Přihlaste se prosím znovu.",
  "We could not undo that award.": "Ocenění se nepodařilo vrátit.",
  "Authentication required": "Je nutné se přihlásit.",
  "You do not have permission for this action": "K této akci nemáte oprávnění.",
  "A student must be assigned to a house": "Student musí být zařazen do týmu.",
  "Only students can be assigned to a house": "Do týmu lze zařadit pouze studenty.",
  "Category names must be unique": "Názvy kategorií se nesmějí opakovat.",
  "Category not found": "Kategorie nebyla nalezena.",
  "House names must be unique": "Názvy týmů se nesmějí opakovat.",
  "House not found": "Tým nebyl nalezen.",
  "School not found": "Škola nebyla nalezena.",
  "User not found": "Uživatel nebyl nalezen.",
  "Check the supplied information": "Zkontrolujte zadané údaje.",
  "That email or username already belongs to this school": "Tento e-mail nebo uživatelské jméno už škola používá.",
  "You cannot deactivate your own account": "Vlastní účet nelze deaktivovat.",
  "Email or password is not recognised": "E-mail, uživatelské jméno nebo heslo není správné.",
  "Enter a valid email or username and password": "Zadejte platný e-mail nebo uživatelské jméno a heslo.",
  "Enter a valid school email address": "Zadejte platnou školní e-mailovou adresu.",
  "Initial setup has already been completed": "První nastavení už bylo dokončeno.",
  "Invalid setup token": "Instalační token není platný.",
  "Password recovery is not configured yet. Please contact your school administrator.": "Obnovení hesla zatím není nastavené. Obraťte se na správce školy.",
  "Password recovery is temporarily unavailable. Please try again later.": "Obnovení hesla je dočasně nedostupné. Zkuste to později.",
  "Session expired": "Platnost přihlášení vypršela.",
  "The school has not been set up yet": "Škola zatím nebyla nastavena.",
  "This reset link is invalid or has expired. Request a new one.": "Odkaz pro obnovu hesla je neplatný nebo mu vypršela platnost. Vyžádejte si nový.",
  "Use a valid reset link and a stronger password": "Použijte platný odkaz pro obnovu a silnější heslo.",
  "Check the points, category and reason": "Zkontrolujte počet bodů, kategorii a důvod.",
  "Invalid award id": "Ocenění nebylo nalezeno.",
  "Provide one image file": "Vyberte jeden soubor s obrázkem.",
  "Use a PNG, JPEG or WebP image no larger than 2 MB": "Použijte obrázek PNG, JPEG nebo WebP o velikosti nejvýše 2 MB.",
  "This request did not come from the school application": "Požadavek nepochází ze školní aplikace.",
  "Your security token is missing or expired. Refresh the page and try again.": "Bezpečnostní token chybí nebo mu vypršela platnost. Obnovte stránku a zkuste to znovu."
};

export function localizeApiMessage(message: string) {
  if (typeof window === "undefined" || window.localStorage.getItem(storageKey) !== "cs") return message;
  return czechErrors[message] ?? message;
}

type LanguageContextValue = {
  language: Language; setLanguage: (language: Language) => void; text: Copy; locale: "en-US" | "cs-CZ";
  translateBuiltin: (value: string) => string;
  formatPoints: (count: number) => string; formatStudents: (count: number) => string;
  formatAchievements: (count: number) => string; formatPointEvents: (count: number) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

function czechPlural(count: number, one: string, few: string, many: string) {
  const absolute = Math.abs(count);
  if (absolute === 1) return one;
  if (absolute >= 2 && absolute <= 4) return few;
  return many;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => { if (window.localStorage.getItem(storageKey) === "cs") setLanguageState("cs"); }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo<LanguageContextValue>(() => {
    const locale = language === "cs" ? "cs-CZ" as const : "en-US" as const;
    const number = (count: number) => count.toLocaleString(locale);
    return {
      language, setLanguage: (next) => { window.localStorage.setItem(storageKey, next); setLanguageState(next); },
      text: messages[language], locale, translateBuiltin: (input) => builtins[language][input] ?? input,
      formatPoints: (count) => language === "cs" ? `${number(count)} ${czechPlural(count, "bod", "body", "bodů")}` : `${number(count)} ${count === 1 ? "point" : "points"}`,
      formatStudents: (count) => language === "cs" ? `${number(count)} ${czechPlural(count, "student", "studenti", "studentů")}` : `${number(count)} ${count === 1 ? "student" : "students"}`,
      formatAchievements: (count) => language === "cs" ? `${number(count)} ${czechPlural(count, "úspěch", "úspěchy", "úspěchů")}` : `${number(count)} ${count === 1 ? "achievement" : "achievements"}`,
      formatPointEvents: (count) => language === "cs" ? `${number(count)} ${czechPlural(count, "bodová událost", "bodové události", "bodových událostí")}` : `${number(count)} ${count === 1 ? "point event" : "point events"}`
    };
  }, [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
