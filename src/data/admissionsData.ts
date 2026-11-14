// Guidance dataset for the Course & School Finder. Requirements vary by
// institution and year — always confirm on the JAMB brochure / school site.
export type Faculty =
  | "Medicine & Health" | "Engineering & Tech" | "Sciences" | "Social Sciences"
  | "Management" | "Arts & Humanities" | "Law" | "Education" | "Agriculture" | "Environmental";

export interface Course {
  id: string;
  name: string;
  faculty: Faculty;
  /** Subjects that must be among the 3 non-English JAMB subjects. */
  required: string[];
  /** Remaining slots may be filled from this list (empty = any subject). */
  optional: string[];
  olevel: string;
  cutoff: [number, number];
  careers: string[];
}

export const JAMB_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science", "Geography",
  "Economics", "Government", "Literature in English", "CRS", "IRS", "History",
  "Commerce", "Principles of Accounts", "Further Mathematics", "Yoruba", "Igbo", "Hausa",
  "French", "Fine Arts", "Music", "Home Economics", "Computer Studies", "Civic Education",
];

const SCI = ["Physics", "Chemistry", "Biology", "Mathematics"];
const SOC = ["Economics", "Government", "Geography", "Mathematics", "Commerce", "Principles of Accounts", "Literature in English", "CRS", "IRS", "History"];
const ART = ["Literature in English", "Government", "History", "CRS", "IRS", "Economics", "Yoruba", "Igbo", "Hausa", "French", "Fine Arts", "Music"];

export const COURSES: Course[] = [
  { id: "medicine", name: "Medicine & Surgery", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology — one sitting", cutoff: [250, 320], careers: ["Medical doctor", "Surgeon", "Public health officer", "Medical researcher"] },
  { id: "nursing", name: "Nursing Science", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology", cutoff: [230, 290], careers: ["Registered nurse", "Midwife", "Clinical educator"] },
  { id: "pharmacy", name: "Pharmacy", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology", cutoff: [240, 300], careers: ["Pharmacist", "Drug regulator (NAFDAC)", "Pharma sales"] },
  { id: "mls", name: "Medical Laboratory Science", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology", cutoff: [220, 280], careers: ["Lab scientist", "Blood bank officer", "Researcher"] },
  { id: "anatomy", name: "Anatomy", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology", cutoff: [210, 260], careers: ["Anatomist", "Lecturer", "Forensic assistant"] },
  { id: "physiology", name: "Physiology", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology", cutoff: [210, 260], careers: ["Physiologist", "Sports scientist", "Researcher"] },
  { id: "physio", name: "Physiotherapy", faculty: "Medicine & Health", required: ["Physics", "Chemistry", "Biology"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry, Biology", cutoff: [230, 280], careers: ["Physiotherapist", "Sports rehab specialist"] },
  { id: "pubhealth", name: "Public Health", faculty: "Medicine & Health", required: ["Chemistry", "Biology"], optional: ["Physics", "Mathematics"], olevel: "5 credits incl. English, Maths, Chemistry, Biology", cutoff: [200, 250], careers: ["Health officer", "NGO programme officer", "Epidemiologist"] },

  { id: "civil", name: "Civil Engineering", faculty: "Engineering & Tech", required: ["Mathematics", "Physics", "Chemistry"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [220, 280], careers: ["Civil engineer", "Structural engineer", "Project manager"] },
  { id: "mech", name: "Mechanical Engineering", faculty: "Engineering & Tech", required: ["Mathematics", "Physics", "Chemistry"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [220, 280], careers: ["Mechanical engineer", "Oil & gas engineer", "Automotive engineer"] },
  { id: "eee", name: "Electrical/Electronics Engineering", faculty: "Engineering & Tech", required: ["Mathematics", "Physics", "Chemistry"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [220, 285], careers: ["Electrical engineer", "Power systems engineer", "Telecoms engineer"] },
  { id: "chemeng", name: "Chemical Engineering", faculty: "Engineering & Tech", required: ["Mathematics", "Physics", "Chemistry"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [220, 280], careers: ["Process engineer", "Refinery engineer"] },
  { id: "petroleum", name: "Petroleum Engineering", faculty: "Engineering & Tech", required: ["Mathematics", "Physics", "Chemistry"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [230, 285], careers: ["Petroleum engineer", "Drilling engineer"] },
  { id: "cs", name: "Computer Science", faculty: "Sciences", required: ["Mathematics", "Physics"], optional: ["Chemistry", "Biology", "Economics", "Geography", "Further Mathematics", "Agricultural Science"], olevel: "5 credits incl. English, Maths, Physics", cutoff: [220, 280], careers: ["Software developer", "Data analyst", "Cybersecurity analyst", "AI engineer"] },
  { id: "compeng", name: "Computer Engineering", faculty: "Engineering & Tech", required: ["Mathematics", "Physics", "Chemistry"], optional: [], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [220, 280], careers: ["Hardware engineer", "Embedded systems developer"] },

  { id: "biochem", name: "Biochemistry", faculty: "Sciences", required: ["Chemistry", "Biology"], optional: ["Physics", "Mathematics"], olevel: "5 credits incl. English, Maths, Chemistry, Biology, Physics", cutoff: [200, 250], careers: ["Biochemist", "Food scientist", "Quality control analyst"] },
  { id: "microbio", name: "Microbiology", faculty: "Sciences", required: ["Chemistry", "Biology"], optional: ["Physics", "Mathematics"], olevel: "5 credits incl. English, Maths, Chemistry, Biology", cutoff: [200, 250], careers: ["Microbiologist", "Food safety officer", "Researcher"] },
  { id: "physics", name: "Physics", faculty: "Sciences", required: ["Mathematics", "Physics"], optional: ["Chemistry", "Biology", "Further Mathematics"], olevel: "5 credits incl. English, Maths, Physics, Chemistry", cutoff: [180, 220], careers: ["Physicist", "Teacher", "Energy analyst"] },
  { id: "maths", name: "Mathematics", faculty: "Sciences", required: ["Mathematics"], optional: ["Physics", "Chemistry", "Further Mathematics", "Economics", "Biology", "Geography"], olevel: "5 credits incl. English, Maths", cutoff: [180, 230], careers: ["Statistician", "Actuary", "Data scientist"] },
  { id: "industrialchem", name: "Industrial Chemistry", faculty: "Sciences", required: ["Chemistry", "Mathematics"], optional: ["Physics", "Biology"], olevel: "5 credits incl. English, Maths, Chemistry, Physics", cutoff: [180, 230], careers: ["Industrial chemist", "Paint/plastics technologist"] },

  { id: "economics", name: "Economics", faculty: "Social Sciences", required: ["Mathematics", "Economics"], optional: SOC, olevel: "5 credits incl. English, Maths, Economics", cutoff: [200, 260], careers: ["Economist", "Banker", "Policy analyst"] },
  { id: "polsci", name: "Political Science", faculty: "Social Sciences", required: ["Government"], optional: SOC, olevel: "5 credits incl. English, Maths, Government", cutoff: [200, 250], careers: ["Diplomat", "Policy analyst", "Civil servant"] },
  { id: "masscom", name: "Mass Communication", faculty: "Social Sciences", required: ["Literature in English"], optional: ART.concat(["Economics", "Geography"]), olevel: "5 credits incl. English, Maths, Literature", cutoff: [210, 260], careers: ["Journalist", "PR officer", "Broadcaster", "Content strategist"] },
  { id: "sociology", name: "Sociology", faculty: "Social Sciences", required: [], optional: SOC, olevel: "5 credits incl. English, Maths", cutoff: [190, 240], careers: ["Social worker", "HR officer", "Researcher"] },
  { id: "psychology", name: "Psychology", faculty: "Social Sciences", required: ["Biology"], optional: SOC.concat(["Chemistry"]), olevel: "5 credits incl. English, Maths, Biology", cutoff: [200, 250], careers: ["Psychologist", "Counsellor", "HR specialist"] },

  { id: "accounting", name: "Accounting", faculty: "Management", required: ["Mathematics", "Economics"], optional: SOC, olevel: "5 credits incl. English, Maths, Economics", cutoff: [210, 260], careers: ["Chartered accountant", "Auditor", "Tax consultant"] },
  { id: "busadmin", name: "Business Administration", faculty: "Management", required: ["Mathematics", "Economics"], optional: SOC, olevel: "5 credits incl. English, Maths, Economics", cutoff: [200, 250], careers: ["Manager", "Entrepreneur", "Consultant"] },
  { id: "banking", name: "Banking & Finance", faculty: "Management", required: ["Mathematics", "Economics"], optional: SOC, olevel: "5 credits incl. English, Maths, Economics", cutoff: [200, 250], careers: ["Banker", "Financial analyst", "Investment officer"] },
  { id: "marketing", name: "Marketing", faculty: "Management", required: ["Mathematics", "Economics"], optional: SOC, olevel: "5 credits incl. English, Maths, Economics", cutoff: [190, 240], careers: ["Brand manager", "Digital marketer", "Sales lead"] },

  { id: "law", name: "Law", faculty: "Law", required: ["Literature in English"], optional: ART.concat(["Economics"]), olevel: "5 credits incl. English, Maths, Literature — one sitting at many schools", cutoff: [240, 300], careers: ["Lawyer", "Corporate counsel", "Judge", "Legal adviser"] },
  { id: "english", name: "English & Literary Studies", faculty: "Arts & Humanities", required: ["Literature in English"], optional: ART, olevel: "5 credits incl. English, Literature", cutoff: [180, 230], careers: ["Writer", "Editor", "Teacher"] },
  { id: "history", name: "History & International Studies", faculty: "Arts & Humanities", required: ["History"], optional: ART, olevel: "5 credits incl. English, History or Government", cutoff: [180, 220], careers: ["Diplomat", "Archivist", "Researcher"] },
  { id: "theatre", name: "Theatre Arts", faculty: "Arts & Humanities", required: ["Literature in English"], optional: ART, olevel: "5 credits incl. English, Literature", cutoff: [180, 220], careers: ["Actor", "Film producer", "Scriptwriter"] },

  { id: "edubio", name: "Education & Biology", faculty: "Education", required: ["Biology"], optional: SCI, olevel: "5 credits incl. English, Maths, Biology", cutoff: [160, 200], careers: ["Biology teacher", "Curriculum developer"] },
  { id: "eduenglish", name: "Education & English", faculty: "Education", required: ["Literature in English"], optional: ART, olevel: "5 credits incl. English, Literature", cutoff: [160, 200], careers: ["English teacher", "Education officer"] },

  { id: "agric", name: "Agriculture", faculty: "Agriculture", required: ["Chemistry", "Biology"], optional: ["Physics", "Mathematics", "Agricultural Science"], olevel: "5 credits incl. English, Maths, Chemistry, Biology/Agric", cutoff: [160, 200], careers: ["Agronomist", "Agribusiness founder", "Extension officer"] },
  { id: "foodsci", name: "Food Science & Technology", faculty: "Agriculture", required: ["Chemistry", "Biology"], optional: ["Physics", "Mathematics"], olevel: "5 credits incl. English, Maths, Chemistry, Biology, Physics", cutoff: [170, 210], careers: ["Food technologist", "Quality assurance officer"] },

  { id: "architecture", name: "Architecture", faculty: "Environmental", required: ["Mathematics", "Physics"], optional: ["Chemistry", "Geography", "Fine Arts", "Technical Drawing"], olevel: "5 credits incl. English, Maths, Physics", cutoff: [210, 260], careers: ["Architect", "Urban designer"] },
  { id: "estate", name: "Estate Management", faculty: "Environmental", required: ["Mathematics", "Economics"], optional: ["Geography", "Physics", "Chemistry", "Government"], olevel: "5 credits incl. English, Maths, Economics", cutoff: [180, 230], careers: ["Estate surveyor", "Property manager"] },
  { id: "quantity", name: "Quantity Surveying", faculty: "Environmental", required: ["Mathematics", "Physics"], optional: ["Chemistry", "Economics", "Geography"], olevel: "5 credits incl. English, Maths, Physics", cutoff: [180, 230], careers: ["Quantity surveyor", "Cost engineer"] },
];

export type SchoolType = "Federal" | "State" | "Private" | "Polytechnic";
export interface School { name: string; short: string; state: string; type: SchoolType; minCutoff: number; strengths: string[] }

export const SCHOOLS: School[] = [
  { name: "University of Lagos", short: "UNILAG", state: "Lagos", type: "Federal", minCutoff: 200, strengths: ["Medicine", "Law", "Engineering", "Mass Communication"] },
  { name: "University of Ibadan", short: "UI", state: "Oyo", type: "Federal", minCutoff: 200, strengths: ["Medicine", "Sciences", "Arts"] },
  { name: "Obafemi Awolowo University", short: "OAU", state: "Osun", type: "Federal", minCutoff: 200, strengths: ["Law", "Pharmacy", "Engineering"] },
  { name: "University of Nigeria, Nsukka", short: "UNN", state: "Enugu", type: "Federal", minCutoff: 200, strengths: ["Medicine", "Engineering", "Arts"] },
  { name: "Ahmadu Bello University", short: "ABU", state: "Kaduna", type: "Federal", minCutoff: 180, strengths: ["Engineering", "Agriculture", "Medicine"] },
  { name: "University of Benin", short: "UNIBEN", state: "Edo", type: "Federal", minCutoff: 200, strengths: ["Medicine", "Pharmacy", "Engineering"] },
  { name: "University of Ilorin", short: "UNILORIN", state: "Kwara", type: "Federal", minCutoff: 180, strengths: ["Medicine", "Law", "Education"] },
  { name: "University of Port Harcourt", short: "UNIPORT", state: "Rivers", type: "Federal", minCutoff: 180, strengths: ["Petroleum Engineering", "Medicine"] },
  { name: "Federal University of Technology, Akure", short: "FUTA", state: "Ondo", type: "Federal", minCutoff: 180, strengths: ["Engineering", "Architecture", "Sciences"] },
  { name: "Federal University of Technology, Minna", short: "FUTMINNA", state: "Niger", type: "Federal", minCutoff: 160, strengths: ["Engineering", "Environmental"] },
  { name: "Nnamdi Azikiwe University", short: "UNIZIK", state: "Anambra", type: "Federal", minCutoff: 180, strengths: ["Medicine", "Law", "Management"] },
  { name: "University of Abuja", short: "UNIABUJA", state: "FCT", type: "Federal", minCutoff: 180, strengths: ["Law", "Medicine", "Social Sciences"] },
  { name: "Lagos State University", short: "LASU", state: "Lagos", type: "State", minCutoff: 190, strengths: ["Law", "Medicine", "Management"] },
  { name: "Olabisi Onabanjo University", short: "OOU", state: "Ogun", type: "State", minCutoff: 170, strengths: ["Medicine", "Law"] },
  { name: "Ladoke Akintola University of Technology", short: "LAUTECH", state: "Oyo", type: "State", minCutoff: 170, strengths: ["Medicine", "Engineering"] },
  { name: "Rivers State University", short: "RSU", state: "Rivers", type: "State", minCutoff: 170, strengths: ["Engineering", "Sciences"] },
  { name: "Ekiti State University", short: "EKSU", state: "Ekiti", type: "State", minCutoff: 160, strengths: ["Education", "Sciences"] },
  { name: "Covenant University", short: "CU", state: "Ogun", type: "Private", minCutoff: 180, strengths: ["Engineering", "Computer Science", "Management"] },
  { name: "Babcock University", short: "BABCOCK", state: "Ogun", type: "Private", minCutoff: 160, strengths: ["Medicine", "Nursing", "Law"] },
  { name: "Afe Babalola University", short: "ABUAD", state: "Ekiti", type: "Private", minCutoff: 160, strengths: ["Medicine", "Law", "Engineering"] },
  { name: "Pan-Atlantic University", short: "PAU", state: "Lagos", type: "Private", minCutoff: 160, strengths: ["Management", "Media"] },
  { name: "Yaba College of Technology", short: "YABATECH", state: "Lagos", type: "Polytechnic", minCutoff: 150, strengths: ["Engineering", "Art & Design", "Food Tech"] },
  { name: "Federal Polytechnic, Ilaro", short: "FPI", state: "Ogun", type: "Polytechnic", minCutoff: 120, strengths: ["Accounting", "Computer Science"] },
  { name: "Kaduna Polytechnic", short: "KADPOLY", state: "Kaduna", type: "Polytechnic", minCutoff: 120, strengths: ["Engineering", "Mass Communication"] },
  { name: "Auchi Polytechnic", short: "AUCHIPOLY", state: "Edo", type: "Polytechnic", minCutoff: 120, strengths: ["Art & Design", "Engineering"] },
];
