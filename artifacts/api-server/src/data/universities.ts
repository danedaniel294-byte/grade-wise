export interface GradePoint {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
  interpretation: string;
}

export interface University {
  id: number;
  name: string;
  shortName: string;
  gradingSystem: string;
  gradingScale: GradePoint[];
  firstClass: number;
  secondClassUpper: number;
  secondClassLower: number;
  thirdClass: number;
  pass: number;
}

const KNUST_SCALE: GradePoint[] = [
  { grade: "A+", minScore: 90, maxScore: 100, points: 4.0, interpretation: "Excellent" },
  { grade: "A", minScore: 80, maxScore: 89, points: 4.0, interpretation: "Excellent" },
  { grade: "B+", minScore: 75, maxScore: 79, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 70, maxScore: 74, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 65, maxScore: 69, points: 2.5, interpretation: "Fairly Good" },
  { grade: "C", minScore: 60, maxScore: 64, points: 2.0, interpretation: "Fair" },
  { grade: "D+", minScore: 55, maxScore: 59, points: 1.5, interpretation: "Pass" },
  { grade: "D", minScore: 50, maxScore: 54, points: 1.0, interpretation: "Pass" },
  { grade: "F", minScore: 0, maxScore: 49, points: 0.0, interpretation: "Fail" },
];

const UG_SCALE: GradePoint[] = [
  { grade: "A", minScore: 70, maxScore: 100, points: 4.0, interpretation: "Excellent" },
  { grade: "B+", minScore: 65, maxScore: 69, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 60, maxScore: 64, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 55, maxScore: 59, points: 2.5, interpretation: "Above Average" },
  { grade: "C", minScore: 50, maxScore: 54, points: 2.0, interpretation: "Average" },
  { grade: "D+", minScore: 45, maxScore: 49, points: 1.5, interpretation: "Below Average" },
  { grade: "D", minScore: 40, maxScore: 44, points: 1.0, interpretation: "Below Average" },
  { grade: "F", minScore: 0, maxScore: 39, points: 0.0, interpretation: "Fail" },
];

const UCC_SCALE: GradePoint[] = [
  { grade: "A", minScore: 70, maxScore: 100, points: 4.0, interpretation: "Distinction" },
  { grade: "B+", minScore: 65, maxScore: 69, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 60, maxScore: 64, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 55, maxScore: 59, points: 2.5, interpretation: "Credit" },
  { grade: "C", minScore: 50, maxScore: 54, points: 2.0, interpretation: "Credit" },
  { grade: "D", minScore: 45, maxScore: 49, points: 1.0, interpretation: "Pass" },
  { grade: "E", minScore: 40, maxScore: 44, points: 0.5, interpretation: "Pass" },
  { grade: "F", minScore: 0, maxScore: 39, points: 0.0, interpretation: "Fail" },
];

const UDS_SCALE: GradePoint[] = [
  { grade: "A", minScore: 80, maxScore: 100, points: 4.0, interpretation: "Excellent" },
  { grade: "B+", minScore: 75, maxScore: 79, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 65, maxScore: 74, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 60, maxScore: 64, points: 2.5, interpretation: "Fairly Good" },
  { grade: "C", minScore: 55, maxScore: 59, points: 2.0, interpretation: "Fair" },
  { grade: "D", minScore: 45, maxScore: 54, points: 1.0, interpretation: "Pass" },
  { grade: "F", minScore: 0, maxScore: 44, points: 0.0, interpretation: "Fail" },
];

const GIMPA_SCALE: GradePoint[] = [
  { grade: "A", minScore: 80, maxScore: 100, points: 4.0, interpretation: "Excellent" },
  { grade: "B+", minScore: 75, maxScore: 79, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 70, maxScore: 74, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 65, maxScore: 69, points: 2.5, interpretation: "Above Average" },
  { grade: "C", minScore: 60, maxScore: 64, points: 2.0, interpretation: "Average" },
  { grade: "D", minScore: 50, maxScore: 59, points: 1.0, interpretation: "Pass" },
  { grade: "F", minScore: 0, maxScore: 49, points: 0.0, interpretation: "Fail" },
];

const STANDARD_SCALE: GradePoint[] = [
  { grade: "A+", minScore: 90, maxScore: 100, points: 4.0, interpretation: "Excellent" },
  { grade: "A", minScore: 80, maxScore: 89, points: 4.0, interpretation: "Excellent" },
  { grade: "B+", minScore: 75, maxScore: 79, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 70, maxScore: 74, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 65, maxScore: 69, points: 2.5, interpretation: "Fairly Good" },
  { grade: "C", minScore: 60, maxScore: 64, points: 2.0, interpretation: "Fair" },
  { grade: "D", minScore: 50, maxScore: 59, points: 1.0, interpretation: "Pass" },
  { grade: "F", minScore: 0, maxScore: 49, points: 0.0, interpretation: "Fail" },
];

const UMAT_SCALE: GradePoint[] = [
  { grade: "A", minScore: 70, maxScore: 100, points: 4.0, interpretation: "Excellent" },
  { grade: "B+", minScore: 65, maxScore: 69, points: 3.5, interpretation: "Very Good" },
  { grade: "B", minScore: 60, maxScore: 64, points: 3.0, interpretation: "Good" },
  { grade: "C+", minScore: 55, maxScore: 59, points: 2.5, interpretation: "Fairly Good" },
  { grade: "C", minScore: 50, maxScore: 54, points: 2.0, interpretation: "Average" },
  { grade: "D", minScore: 45, maxScore: 49, points: 1.0, interpretation: "Pass" },
  { grade: "F", minScore: 0, maxScore: 44, points: 0.0, interpretation: "Fail" },
];

export const UNIVERSITIES: University[] = [
  // Major Public Universities
  { id: 1, name: "Kwame Nkrumah University of Science and Technology", shortName: "KNUST", gradingSystem: "KNUST", gradingScale: KNUST_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 2, name: "University of Ghana", shortName: "UG", gradingSystem: "UG", gradingScale: UG_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 3, name: "University of Cape Coast", shortName: "UCC", gradingSystem: "UCC", gradingScale: UCC_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 4, name: "University for Development Studies", shortName: "UDS", gradingSystem: "UDS", gradingScale: UDS_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 5, name: "University of Mines and Technology", shortName: "UMaT", gradingSystem: "UMAT", gradingScale: UMAT_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 6, name: "University of Education, Winneba", shortName: "UEW", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 7, name: "University of Health and Allied Sciences", shortName: "UHAS", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 8, name: "University of Environment and Sustainable Development", shortName: "UESD", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 9, name: "C. K. Tedam University of Technology and Applied Sciences", shortName: "CKT-UTAS", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 10, name: "SD Dombo University of Business and Integrated Development Studies", shortName: "SDD-UBIDS", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  // Specialized Public Universities
  { id: 11, name: "Ghana Institute of Management and Public Administration", shortName: "GIMPA", gradingSystem: "GIMPA", gradingScale: GIMPA_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 12, name: "Accra Technical University", shortName: "ATU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 13, name: "Cape Coast Technical University", shortName: "CCTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 14, name: "Koforidua Technical University", shortName: "KTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 15, name: "Kumasi Technical University", shortName: "KsTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 16, name: "Ho Technical University", shortName: "HTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 17, name: "Sunyani Technical University", shortName: "STU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 18, name: "Bolgatanga Technical University", shortName: "BTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 19, name: "Takoradi Technical University", shortName: "TTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 20, name: "Wa Technical University", shortName: "WaTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  // Private Universities
  { id: 21, name: "Ashesi University", shortName: "Ashesi", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 22, name: "Ghana Communication Technology University", shortName: "GCTU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 23, name: "Academic City University College", shortName: "ACity", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 24, name: "Ghana Baptist University College", shortName: "GBUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 25, name: "Regent University College of Science and Technology", shortName: "Regent", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 26, name: "Central University", shortName: "CU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 27, name: "Pentecost University", shortName: "PU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 28, name: "Valley View University", shortName: "VVU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 29, name: "Methodist University", shortName: "MU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 30, name: "Accra Institute of Technology", shortName: "AIT", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 31, name: "Ghana Institute of Journalism", shortName: "GIJ", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 32, name: "University of Professional Studies, Accra", shortName: "UPSA", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 33, name: "Ghana Technology University College", shortName: "GTUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 34, name: "Catholic University College of Ghana", shortName: "CUCG", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 35, name: "Lancaster University Ghana", shortName: "LUG", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 36, name: "Wisconsin International University College", shortName: "WIUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 37, name: "Heritage Christian University College", shortName: "HCUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 38, name: "Spiritan University College", shortName: "SUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 39, name: "Garden City University College", shortName: "GCUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 40, name: "Premier University College", shortName: "PUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 41, name: "Kings University College", shortName: "KUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 42, name: "All Nations University", shortName: "ANU", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 43, name: "Zenith University College", shortName: "ZUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 44, name: "African University College of Communications", shortName: "AUCC", gradingSystem: "AUCC", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
  { id: 45, name: "Kessben University College", shortName: "KUC", gradingSystem: "STANDARD", gradingScale: STANDARD_SCALE, firstClass: 3.60, secondClassUpper: 3.00, secondClassLower: 2.00, thirdClass: 1.50, pass: 1.00 },
];
