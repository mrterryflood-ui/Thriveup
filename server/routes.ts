import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertCurriculumDocumentSchema,
  careerFields, careerMilestones, pathwayPlans, planRevisions,
  mentorProfiles, mentorRequests, alumniProfiles,
  insertPathwayPlanSchema,
  studentSelfAssessments, thriveScores, thriveHistory, earlyWarningFlags,
  interventionPlaybooks as interventionPlaybooksTable,
  gisContextData, gisResourceOverlays, thriveConfig,
  insertStudentSelfAssessmentSchema,
  studentReflections, announcements as announcementsTable, academyEvents as academyEventsTable, attendanceLogs,
  insertStudentReflectionSchema, insertAnnouncementSchema, insertAcademyEventSchema, insertAttendanceLogSchema,
  aiToolCatalog, aiToolUnlocks, aiToolProjects, aiToolAttachments,
  insertAcademyCourseSchema, insertCourseModuleSchema, insertCourseLessonSchema, insertCourseEnrollmentSchema,
  staarStudyGuides, staarPracticeQuestions, staarStudentAssessments, staarTopicMastery,
  insertStaarStudentAssessmentSchema,
} from "@shared/schema";
import { eq, and, desc, sql, count, gte } from "drizzle-orm";
import { computeFullThriveScore, computeAllStudentScores, getThriveHistory } from "./thrive-engine";
import { evaluateFlags, getActiveFlags, resolveFlag, runEarlyWarningCheck } from "./early-warning";
import { runFullIngestion, getContextForGeography } from "./gis-engine";
import { db } from "./storage";
import { streamAIResponse, getProviderInfo } from "./ai-provider";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { registerCrossPlatformRoutes } from "./cross-platform-api";

const AI_TOOLS = [
  { toolKey: "presentation-builder", name: "Presentation Builder", description: "Create slide-by-slide presentations with AI-generated content, talking points, and visual suggestions", category: "create", iconName: "presentation", gradeBand: "all", requiredModuleKey: "ai-presentations", promptTemplate: "PRESENTATION_BUILDER", outputFormat: "slides", sortOrder: 1 },
  { toolKey: "video-creator", name: "Video Script Creator", description: "Write video scripts with scene descriptions, dialogue, camera angles, and storyboard outlines", category: "create", iconName: "video", gradeBand: "all", requiredModuleKey: "ai-video", promptTemplate: "VIDEO_CREATOR", outputFormat: "storyboard", sortOrder: 2 },
  { toolKey: "sales-pitch", name: "Sales Pitch Builder", description: "Craft compelling sales pitches with hooks, value propositions, objection handling, and closing statements", category: "write", iconName: "megaphone", gradeBand: "6-8", requiredModuleKey: "ai-sales", promptTemplate: "SALES_PITCH", outputFormat: "structured", sortOrder: 3 },
  { toolKey: "business-plan", name: "Business Plan Generator", description: "Build comprehensive business plans with market analysis, financial projections, and growth strategy", category: "plan", iconName: "briefcase", gradeBand: "6-8", requiredModuleKey: "ai-business", promptTemplate: "BUSINESS_PLAN", outputFormat: "structured", sortOrder: 4 },
  { toolKey: "research-assistant", name: "Research Assistant", description: "Get help organizing research topics, finding key points, creating outlines, and writing citations", category: "research", iconName: "search", gradeBand: "all", requiredModuleKey: "ai-research", promptTemplate: "RESEARCH", outputFormat: "markdown", sortOrder: 5 },
  { toolKey: "life-planner", name: "Life Planner", description: "Map out your goals, create action plans, set milestones, and track your personal development journey", category: "plan", iconName: "compass", gradeBand: "all", requiredModuleKey: "ai-life-planning", promptTemplate: "LIFE_PLANNER", outputFormat: "structured", sortOrder: 6 },
  { toolKey: "project-planner", name: "Project Planner", description: "Break down projects into tasks, set timelines, assign resources, and create Gantt-style plans", category: "plan", iconName: "clipboard-list", gradeBand: "all", requiredModuleKey: "ai-project-planning", promptTemplate: "PROJECT_PLANNER", outputFormat: "structured", sortOrder: 7 },
  { toolKey: "document-writer", name: "Document Writer", description: "Write essays, reports, letters, and other documents with AI assistance for structure and content", category: "write", iconName: "file-text", gradeBand: "all", requiredModuleKey: "ai-documents", promptTemplate: "DOCUMENT_WRITER", outputFormat: "markdown", sortOrder: 8 },
  { toolKey: "resume-builder", name: "Resume & Portfolio Builder", description: "Create professional resumes, cover letters, and portfolio pages showcasing your best work", category: "write", iconName: "user-check", gradeBand: "9-12", requiredModuleKey: "ai-resume", promptTemplate: "RESUME_BUILDER", outputFormat: "structured", sortOrder: 9 },
  { toolKey: "brainstorm", name: "Brainstorm Studio", description: "Generate ideas, mind maps, and creative concepts for any project or challenge", category: "research", iconName: "lightbulb", gradeBand: "all", requiredModuleKey: "ai-brainstorm", promptTemplate: "BRAINSTORM", outputFormat: "markdown", sortOrder: 10 },
];

async function seedAiToolCatalog() {
  const existing = await db.select().from(aiToolCatalog);
  if (existing.length === 0) {
    for (const tool of AI_TOOLS) {
      await db.insert(aiToolCatalog).values(tool);
    }
  }
}

async function seedStaarContent() {
  const existing = await db.select().from(staarStudyGuides).limit(1);
  if (existing.length > 0) return;

  const guides = [
    { grade: 3, subject: "Math", topicName: "Addition & Subtraction", tekCode: "3.4A", tekDescription: "Solve with fluency one-step and two-step problems involving addition and subtraction within 1,000", content: "Master addition and subtraction strategies including regrouping, number lines, and mental math. Practice solving word problems that require one or two steps to find the answer.", keyVocabulary: ["sum", "difference", "regroup", "estimate", "operation"], studyTips: ["Practice mental math daily", "Draw number lines for tricky problems", "Check your work by using the opposite operation"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 3, subject: "Math", topicName: "Multiplication Facts", tekCode: "3.4F", tekDescription: "Recall facts to multiply up to 10 by 10 with automaticity", content: "Learn and memorize multiplication facts from 1x1 through 10x10. Use strategies like skip counting, arrays, and fact families to build fluency.", keyVocabulary: ["factor", "product", "array", "multiply", "times"], studyTips: ["Practice times tables for 5 minutes daily", "Use flashcards", "Look for patterns in the multiplication table"], difficultyLevel: "medium", sortOrder: 2 },
    { grade: 3, subject: "Math", topicName: "Fractions", tekCode: "3.3A", tekDescription: "Represent fractions greater than zero and less than or equal to one", content: "Understand fractions as equal parts of a whole. Learn to identify, compare, and represent fractions using models, number lines, and symbols.", keyVocabulary: ["numerator", "denominator", "equal parts", "fraction", "whole"], studyTips: ["Draw fraction models to visualize", "Use real objects like pizza slices", "Always check if parts are equal"], difficultyLevel: "medium", sortOrder: 3 },
    { grade: 3, subject: "RLA", topicName: "Reading Comprehension", tekCode: "3.6F", tekDescription: "Make inferences and use evidence to support understanding", content: "Practice reading passages and answering questions about main idea, details, and inferences. Learn to find evidence in the text to support your answers.", keyVocabulary: ["inference", "evidence", "main idea", "detail", "conclusion"], studyTips: ["Read the questions before the passage", "Underline key details", "Use 'I think... because...' to support answers"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 3, subject: "RLA", topicName: "Author's Purpose", tekCode: "3.10A", tekDescription: "Discuss the author's purpose for writing text", content: "Identify why an author wrote a text: to inform, persuade, entertain, or express feelings. Look for clues in word choice, text features, and content.", keyVocabulary: ["author's purpose", "inform", "persuade", "entertain", "express"], studyTips: ["Ask 'Why did the author write this?'", "Look at the type of text for clues", "Notice emotional vs. factual language"], difficultyLevel: "easy", sortOrder: 2 },
    { grade: 4, subject: "Math", topicName: "Multi-digit Multiplication", tekCode: "4.4D", tekDescription: "Use strategies and algorithms to multiply up to a four-digit number by a one-digit number", content: "Master multi-digit multiplication using the standard algorithm, area models, and partial products. Practice with real-world word problems.", keyVocabulary: ["partial products", "algorithm", "area model", "factor", "product"], studyTips: ["Line up place values carefully", "Estimate first to check reasonableness", "Practice the standard algorithm daily"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 4, subject: "Math", topicName: "Fractions & Decimals", tekCode: "4.3C", tekDescription: "Determine the corresponding fraction with denominators of 10 and 100", content: "Connect fractions and decimals. Understand that decimals are fractions with denominators of 10 or 100. Compare and order fractions and decimals.", keyVocabulary: ["decimal", "tenth", "hundredth", "equivalent", "compare"], studyTips: ["Use a place value chart", "Think of money: dime = 0.1, penny = 0.01", "Draw models to compare"], difficultyLevel: "medium", sortOrder: 2 },
    { grade: 4, subject: "RLA", topicName: "Summarizing Texts", tekCode: "4.6E", tekDescription: "Summarize and paraphrase texts in ways that maintain meaning and logical order", content: "Learn to identify the most important ideas in a text and retell them in your own words while keeping the correct order of events.", keyVocabulary: ["summarize", "paraphrase", "main idea", "sequential order", "key details"], studyTips: ["Use the 'Somebody Wanted But So Then' framework", "Include only the most important details", "Keep it in your own words"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 5, subject: "Math", topicName: "Dividing Decimals", tekCode: "5.3G", tekDescription: "Solve for quotients of decimals to the hundredths", content: "Master decimal division using the standard algorithm. Understand place value when placing the decimal point in quotients.", keyVocabulary: ["dividend", "divisor", "quotient", "decimal point", "remainder"], studyTips: ["Move the decimal point before dividing", "Estimate to check your answer", "Practice with money problems"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 5, subject: "Math", topicName: "Volume", tekCode: "5.6A", tekDescription: "Recognize a cube with side length of one unit as a unit cube", content: "Learn to calculate volume by counting unit cubes and using the formula V = l x w x h. Solve real-world volume problems.", keyVocabulary: ["volume", "unit cube", "length", "width", "height", "cubic units"], studyTips: ["Build with blocks to visualize volume", "Remember V = l x w x h", "Label your answer with cubic units"], difficultyLevel: "medium", sortOrder: 2 },
    { grade: 5, subject: "RLA", topicName: "Analyzing Literary Elements", tekCode: "5.8B", tekDescription: "Analyze the relationships of and conflicts among the characters", content: "Study how characters interact, change, and face conflicts. Identify protagonist and antagonist. Analyze character motivations and how conflicts drive the story.", keyVocabulary: ["protagonist", "antagonist", "conflict", "motivation", "resolution"], studyTips: ["Track character changes throughout the story", "Identify the type of conflict", "Use a character comparison chart"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 5, subject: "Science", topicName: "Matter & Energy", tekCode: "5.5A", tekDescription: "Classify matter based on measurable, testable, and observable physical properties", content: "Understand physical properties of matter including mass, magnetism, physical state, relative density, solubility, and ability to conduct heat or electricity.", keyVocabulary: ["matter", "mass", "physical property", "solubility", "conductivity", "density"], studyTips: ["Create property charts for different materials", "Do hands-on experiments at home", "Compare and contrast states of matter"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 6, subject: "Math", topicName: "Ratios & Rates", tekCode: "6.4B", tekDescription: "Apply qualitative and quantitative reasoning to solve prediction and comparison of real-world problems involving ratios and rates", content: "Understand ratios as comparisons of two quantities. Calculate unit rates. Use ratios and rates to solve real-world problems including pricing, speed, and recipes.", keyVocabulary: ["ratio", "rate", "unit rate", "proportion", "equivalent ratios"], studyTips: ["Set up ratio tables", "Always simplify ratios", "Use unit rates to compare prices"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 6, subject: "Math", topicName: "Expressions & Equations", tekCode: "6.7A", tekDescription: "Generate equivalent numerical expressions using order of operations", content: "Master order of operations (PEMDAS). Write and evaluate expressions with variables. Solve one-step equations.", keyVocabulary: ["expression", "equation", "variable", "coefficient", "exponent", "PEMDAS"], studyTips: ["Always follow PEMDAS order", "Show every step of your work", "Check solutions by substituting back"], difficultyLevel: "medium", sortOrder: 2 },
    { grade: 6, subject: "Math", topicName: "Data Analysis", tekCode: "6.12A", tekDescription: "Represent numeric data graphically including dot plots, stem-and-leaf plots, histograms, and box plots", content: "Learn to create and interpret different types of data displays. Calculate mean, median, mode, and range. Use data to make predictions and draw conclusions.", keyVocabulary: ["mean", "median", "mode", "range", "dot plot", "histogram", "box plot"], studyTips: ["Practice creating each type of graph", "Remember: mean = average, median = middle", "Always label your graphs"], difficultyLevel: "medium", sortOrder: 3 },
    { grade: 6, subject: "RLA", topicName: "Analyzing Informational Texts", tekCode: "6.9D", tekDescription: "Analyze characteristics and structural elements of informational text", content: "Study how informational texts are organized using text structures like cause/effect, compare/contrast, problem/solution, and chronological order.", keyVocabulary: ["text structure", "cause and effect", "compare/contrast", "chronological", "problem/solution"], studyTips: ["Look for signal words that reveal structure", "Create graphic organizers for each structure", "Summarize each section in your own words"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 6, subject: "RLA", topicName: "Writing Argumentative Essays", tekCode: "6.11B", tekDescription: "Develop drafts into a focused, structured, and coherent piece of writing", content: "Learn to write argumentative essays with a clear claim, supporting evidence, counterarguments, and a strong conclusion.", keyVocabulary: ["claim", "evidence", "counterargument", "thesis", "transition", "rebuttal"], studyTips: ["Start with a strong thesis statement", "Use at least 3 pieces of evidence", "Address the other side's argument"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 7, subject: "Math", topicName: "Proportional Relationships", tekCode: "7.4A", tekDescription: "Represent constant rates of change in mathematical and real-world problems", content: "Understand proportional relationships and constant rates of change. Use tables, graphs, and equations to represent proportions.", keyVocabulary: ["proportional", "constant of proportionality", "unit rate", "linear", "slope"], studyTips: ["Check if y/x is always the same", "Graph points to see if they form a straight line through origin", "Use cross-multiplication to solve"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 7, subject: "Math", topicName: "Geometry: Area & Circumference", tekCode: "7.9B", tekDescription: "Determine the circumference and area of circles", content: "Master circle formulas: C = 2πr and A = πr². Apply these to real-world problems involving circles and composite figures.", keyVocabulary: ["radius", "diameter", "circumference", "pi", "area", "composite figure"], studyTips: ["Memorize: C = 2πr, A = πr²", "Remember diameter = 2 × radius", "Use 3.14 for π unless told otherwise"], difficultyLevel: "medium", sortOrder: 2 },
    { grade: 7, subject: "RLA", topicName: "Theme & Central Idea", tekCode: "7.8A", tekDescription: "Analyze how themes are developed through the interaction of characters and events", content: "Identify and analyze themes in literary texts. Understand how authors develop themes through character actions, dialogue, setting, and plot events.", keyVocabulary: ["theme", "central idea", "universal theme", "motif", "symbolism"], studyTips: ["Theme is a message, not a topic", "Look for repeated ideas or symbols", "Ask: What lesson does the character learn?"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 8, subject: "Math", topicName: "Linear Equations", tekCode: "8.8A", tekDescription: "Write one-variable equations or inequalities with variables on both sides", content: "Solve multi-step equations with variables on both sides. Graph linear equations. Understand slope and y-intercept.", keyVocabulary: ["slope", "y-intercept", "slope-intercept form", "linear equation", "coefficient"], studyTips: ["y = mx + b: m is slope, b is y-intercept", "Graph using slope and y-intercept", "Check solutions in the original equation"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 8, subject: "Math", topicName: "Pythagorean Theorem", tekCode: "8.7C", tekDescription: "Use the Pythagorean Theorem and its converse to solve problems", content: "Apply a² + b² = c² to find missing sides of right triangles. Use the Pythagorean Theorem in real-world distance and measurement problems.", keyVocabulary: ["hypotenuse", "leg", "right triangle", "Pythagorean Theorem", "distance"], studyTips: ["The hypotenuse is always the longest side", "Remember: a² + b² = c²", "Draw a picture for word problems"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 8, subject: "RLA", topicName: "Analyzing Arguments", tekCode: "8.10A", tekDescription: "Analyze how the author's purpose and perspective shape the content", content: "Evaluate arguments in texts for logic, evidence quality, and rhetorical strategies. Identify bias, propaganda techniques, and logical fallacies.", keyVocabulary: ["rhetoric", "bias", "logical fallacy", "ethos", "pathos", "logos"], studyTips: ["Identify the author's claim first", "Evaluate the quality of evidence", "Look for emotional vs. logical appeals"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 8, subject: "Science", topicName: "Force & Motion", tekCode: "8.6A", tekDescription: "Demonstrate and calculate how unbalanced forces change the speed or direction of an object's motion", content: "Study Newton's Laws of Motion. Calculate force, mass, and acceleration using F = ma. Understand balanced and unbalanced forces.", keyVocabulary: ["force", "mass", "acceleration", "Newton's Laws", "friction", "gravity", "inertia"], studyTips: ["F = ma is key", "Draw force diagrams", "Think about everyday examples of Newton's Laws"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 8, subject: "Social Studies", topicName: "U.S. Constitution & Government", tekCode: "8.15A", tekDescription: "Identify the influence of ideas from historic documents on the U.S. system of government", content: "Study the U.S. Constitution, Bill of Rights, and principles of American government including federalism, checks and balances, and separation of powers.", keyVocabulary: ["Constitution", "Bill of Rights", "federalism", "checks and balances", "amendment", "democracy"], studyTips: ["Know the first 10 amendments", "Understand three branches of government", "Connect constitutional principles to current events"], difficultyLevel: "medium", sortOrder: 1 },
    { grade: 9, subject: "Algebra I", topicName: "Quadratic Functions", tekCode: "A.7A", tekDescription: "Graph quadratic functions on the coordinate plane and identify key attributes", content: "Graph parabolas. Find vertex, axis of symmetry, zeros/roots, and y-intercept. Solve quadratic equations by factoring, completing the square, and the quadratic formula.", keyVocabulary: ["parabola", "vertex", "axis of symmetry", "quadratic formula", "discriminant", "zeros"], studyTips: ["Learn the quadratic formula by heart", "Vertex form: y = a(x-h)² + k", "Practice factoring daily"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 9, subject: "Algebra I", topicName: "Systems of Equations", tekCode: "A.5C", tekDescription: "Solve systems of two linear equations with two variables", content: "Solve systems by graphing, substitution, and elimination. Interpret solutions as intersection points. Identify systems with no solution or infinitely many solutions.", keyVocabulary: ["system", "substitution", "elimination", "intersection", "consistent", "independent"], studyTips: ["Choose the method that fits the problem", "Check your solution in BOTH equations", "No solution = parallel lines"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 9, subject: "English I", topicName: "Rhetorical Analysis", tekCode: "E1.8A", tekDescription: "Analyze the author's purpose, audience, and message within a text", content: "Analyze how authors use rhetorical strategies (ethos, pathos, logos) to achieve their purpose. Evaluate effectiveness of arguments and identify persuasive techniques.", keyVocabulary: ["rhetoric", "ethos", "pathos", "logos", "audience", "purpose", "tone"], studyTips: ["Identify the SOAPSTone elements", "Look for the author's tone through word choice", "Practice writing rhetorical analysis paragraphs"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 10, subject: "English II", topicName: "Literary Analysis & Critique", tekCode: "E2.5A", tekDescription: "Analyze the effects of literary devices and techniques on meaning", content: "Analyze how authors use literary devices (symbolism, irony, metaphor, allusion) to create meaning. Write literary analysis essays with textual evidence.", keyVocabulary: ["symbolism", "irony", "metaphor", "allusion", "motif", "foreshadowing", "juxtaposition"], studyTips: ["Keep a literary devices reference sheet", "Always explain HOW the device creates meaning", "Use direct quotes as evidence"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 10, subject: "Biology", topicName: "Cell Processes", tekCode: "B.4B", tekDescription: "Investigate and explain cellular processes including mitosis and meiosis", content: "Study cell division (mitosis and meiosis), DNA replication, and protein synthesis. Understand the cell cycle and its regulation.", keyVocabulary: ["mitosis", "meiosis", "DNA replication", "chromosome", "cell cycle", "interphase"], studyTips: ["Draw diagrams of each phase", "Compare mitosis vs. meiosis in a chart", "Remember: mitosis = 2 identical cells, meiosis = 4 unique cells"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 10, subject: "Biology", topicName: "Genetics & Heredity", tekCode: "B.6F", tekDescription: "Predict possible outcomes of various genetic combinations", content: "Master Punnett squares, genotype vs. phenotype, dominant/recessive traits, and probability in genetics. Study non-Mendelian patterns.", keyVocabulary: ["genotype", "phenotype", "dominant", "recessive", "Punnett square", "allele", "heterozygous"], studyTips: ["Practice Punnett squares until automatic", "Remember: uppercase = dominant, lowercase = recessive", "Learn common genetic disorders"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 11, subject: "U.S. History", topicName: "Civil Rights Movement", tekCode: "US.9A", tekDescription: "Trace the historical development of the civil rights movement", content: "Study the Civil Rights Movement from Reconstruction through modern times. Key events, leaders, legislation, and their lasting impact on American society.", keyVocabulary: ["segregation", "integration", "civil disobedience", "Jim Crow", "Brown v. Board", "Civil Rights Act"], studyTips: ["Create a timeline of key events", "Know the major Supreme Court cases", "Connect past events to current issues"], difficultyLevel: "hard", sortOrder: 1 },
    { grade: 11, subject: "U.S. History", topicName: "World War II & Cold War", tekCode: "US.7C", tekDescription: "Analyze the effects of WWII and the Cold War on the United States", content: "Study causes and effects of WWII, the home front, key battles, and the transition to the Cold War era including containment, McCarthyism, and the arms race.", keyVocabulary: ["containment", "Marshall Plan", "NATO", "McCarthyism", "arms race", "deterrence"], studyTips: ["Know the causes and effects, not just dates", "Understand the concept of containment", "Connect WWII outcomes to Cold War tensions"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 9, subject: "Algebra I", topicName: "Linear Functions & Slope", tekCode: "A.3C", tekDescription: "Determine the slope of a line given a table of values, a graph, two points on the line, and an equation written in various forms", content: "Understand slope as rate of change. Calculate slope from two points using (y2-y1)/(x2-x1). Write equations in slope-intercept form y = mx + b. Graph linear equations and identify parallel and perpendicular lines by their slopes.", keyVocabulary: ["slope", "rate of change", "slope-intercept form", "y-intercept", "parallel", "perpendicular", "rise over run"], studyTips: ["Remember slope = rise/run", "Parallel lines have equal slopes", "Perpendicular lines have negative reciprocal slopes"], difficultyLevel: "hard", sortOrder: 3 },
    { grade: 9, subject: "Algebra I", topicName: "Exponential Functions", tekCode: "A.9C", tekDescription: "Write exponential functions in the form f(x) = ab^x to describe problems arising from mathematical and real-world situations", content: "Understand exponential growth and decay. Distinguish between linear and exponential functions. Write exponential models for real-world situations such as population growth, compound interest, and radioactive decay. Interpret the base and initial value.", keyVocabulary: ["exponential growth", "exponential decay", "base", "initial value", "compound interest", "half-life", "asymptote"], studyTips: ["If multiplying by same factor, it's exponential", "Growth: b > 1, Decay: 0 < b < 1", "Compare tables: linear has constant difference, exponential has constant ratio"], difficultyLevel: "hard", sortOrder: 4 },
    { grade: 9, subject: "Algebra I", topicName: "Writing & Solving Inequalities", tekCode: "A.5B", tekDescription: "Solve linear inequalities in one variable, including those for which the application of the distributive property is necessary", content: "Write and solve one-variable inequalities. Graph solutions on a number line. Solve and graph two-variable inequalities on a coordinate plane. Remember to flip the inequality sign when multiplying or dividing by a negative number.", keyVocabulary: ["inequality", "solution set", "boundary line", "half-plane", "compound inequality", "number line", "shading"], studyTips: ["Flip the sign when multiplying/dividing by a negative", "Open circle for < or >, closed circle for ≤ or ≥", "Test a point to check which side to shade"], difficultyLevel: "hard", sortOrder: 5 },
    { grade: 9, subject: "English I", topicName: "Analyzing Poetry & Drama", tekCode: "E1.5B", tekDescription: "Analyze the use of literary devices and text structures in poetry and drama", content: "Analyze poetic elements including meter, rhyme scheme, imagery, and figurative language (simile, metaphor, personification). Study dramatic elements such as soliloquy, aside, stage directions, and dramatic irony. Understand how these devices contribute to meaning and tone.", keyVocabulary: ["meter", "rhyme scheme", "imagery", "soliloquy", "aside", "stage directions", "dramatic irony", "figurative language"], studyTips: ["Read poems aloud to hear the meter and rhythm", "Mark the rhyme scheme using letters (ABAB, etc.)", "Identify at least one literary device per stanza"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 9, subject: "English I", topicName: "Argumentative Writing", tekCode: "E1.10B", tekDescription: "Develop drafts into a focused, structured, and coherent piece of writing by developing an engaging idea with relevant details", content: "Develop a clear thesis statement. Support arguments with credible evidence and logical reasoning. Address counterarguments with rebuttals. Use formal academic tone, transitions, and proper essay structure (introduction, body, conclusion).", keyVocabulary: ["thesis", "claim", "counterargument", "rebuttal", "evidence", "logical reasoning", "formal tone", "transition"], studyTips: ["Start with a debatable thesis, not a fact", "Use at least two types of evidence per body paragraph", "Always address the strongest counterargument"], difficultyLevel: "hard", sortOrder: 3 },
    { grade: 9, subject: "English I", topicName: "Vocabulary in Context", tekCode: "E1.2B", tekDescription: "Use context such as contrast or cause and effect to clarify the meaning of words", content: "Use context clues (definition, contrast, example, inference) to determine word meaning. Analyze word roots, prefixes, and suffixes to decode unfamiliar vocabulary. Understand connotation vs. denotation and how word choice affects meaning.", keyVocabulary: ["context clues", "root word", "prefix", "suffix", "connotation", "denotation", "inference", "etymology"], studyTips: ["Look for signal words: however, because, for example", "Break unfamiliar words into prefix + root + suffix", "Replace the unknown word with your guess to check if it makes sense"], difficultyLevel: "medium", sortOrder: 4 },
    { grade: 10, subject: "English II", topicName: "Analyzing Informational Texts", tekCode: "E2.9C", tekDescription: "Evaluate the credibility of sources and the validity of evidence in informational texts", content: "Evaluate credibility of informational sources by examining author qualifications, publication date, and bias. Identify text structures (cause/effect, problem/solution, compare/contrast) and analyze author's craft including diction, syntax, and rhetorical strategies in nonfiction.", keyVocabulary: ["credibility", "bias", "text structure", "author's craft", "diction", "syntax", "rhetorical strategy", "validity"], studyTips: ["Check the source: Who wrote it? When? Why?", "Identify the text structure to understand organization", "Look for loaded language that reveals bias"], difficultyLevel: "hard", sortOrder: 2 },
    { grade: 10, subject: "English II", topicName: "Narrative Writing Techniques", tekCode: "E2.10A", tekDescription: "Plan a piece of writing appropriate for various purposes and audiences", content: "Master narrative writing techniques including point of view selection (first person, third person limited/omniscient), character development through dialogue and action, pacing for tension and suspense, and descriptive language using sensory details.", keyVocabulary: ["point of view", "character development", "pacing", "dialogue", "sensory details", "narrative arc", "conflict", "resolution"], studyTips: ["Show, don't tell: use actions and dialogue to reveal character", "Vary sentence length to control pacing", "Include sensory details for at least three senses"], difficultyLevel: "hard", sortOrder: 3 },
    { grade: 10, subject: "English II", topicName: "Research & Source Evaluation", tekCode: "E2.11B", tekDescription: "Evaluate the relevance, reliability, and validity of sources for a research project", content: "Distinguish between primary and secondary sources. Evaluate source credibility using the CRAAP test (Currency, Relevance, Authority, Accuracy, Purpose). Format citations using MLA style. Synthesize information from multiple sources to support a research thesis.", keyVocabulary: ["primary source", "secondary source", "MLA citation", "synthesis", "credibility", "CRAAP test", "plagiarism", "paraphrase"], studyTips: ["Use the CRAAP test for every source", "Primary sources are firsthand accounts; secondary sources analyze them", "When synthesizing, connect ideas across sources, don't just summarize each one"], difficultyLevel: "hard", sortOrder: 4 },
    { grade: 10, subject: "Biology", topicName: "Ecology & Ecosystems", tekCode: "B.12A", tekDescription: "Interpret relationships including predation, parasitism, commensalism, mutualism, and competition among organisms", content: "Study food webs and energy flow through trophic levels. Understand biogeochemical cycles (carbon, nitrogen, water). Analyze population dynamics including carrying capacity and limiting factors. Learn ecological succession from pioneer species to climax community.", keyVocabulary: ["food web", "trophic level", "biogeochemical cycle", "carrying capacity", "limiting factor", "ecological succession", "pioneer species", "climax community"], studyTips: ["Energy decreases by ~90% at each trophic level", "Producers are always at the base of energy pyramids", "Know the difference between primary and secondary succession"], difficultyLevel: "hard", sortOrder: 3 },
    { grade: 10, subject: "Biology", topicName: "Evolution & Classification", tekCode: "B.7A", tekDescription: "Analyze and evaluate how evidence of common ancestry among groups is provided by the fossil record, biogeography, and homologies", content: "Understand natural selection as the mechanism of evolution. Analyze evidence for evolution including fossils, homologous structures, embryology, and DNA comparisons. Study taxonomic classification from domain to species. Read and interpret phylogenetic trees.", keyVocabulary: ["natural selection", "adaptation", "homologous structures", "fossil record", "phylogenetic tree", "taxonomy", "speciation", "common ancestor"], studyTips: ["Natural selection requires variation, competition, and reproduction", "Homologous structures share ancestry; analogous structures share function", "Remember taxonomy order: Dear King Philip Came Over For Good Spaghetti"], difficultyLevel: "hard", sortOrder: 4 },
    { grade: 11, subject: "U.S. History", topicName: "Progressive Era & Industrialization", tekCode: "US.4A", tekDescription: "Analyze the effects of industrialization and the Gilded Age on politics, economics, and society", content: "Study the Industrial Revolution's impact on American life: factory system, urbanization, immigration waves. Examine labor movements, muckrakers, and progressive reforms. Understand key figures like Carnegie, Rockefeller, Teddy Roosevelt, and Jane Addams.", keyVocabulary: ["industrialization", "urbanization", "muckraker", "labor union", "trust", "monopoly", "progressive reform", "immigration"], studyTips: ["Connect industrialization causes to progressive reform effects", "Know key muckrakers and what they exposed", "Understand push/pull factors of immigration"], difficultyLevel: "hard", sortOrder: 3 },
    { grade: 11, subject: "U.S. History", topicName: "Constitution & Founding Principles", tekCode: "US.15A", tekDescription: "Identify the origins of judicial review and analyze how it has been an important judicial principle", content: "Study constitutional principles including popular sovereignty, federalism, separation of powers, and checks and balances. Understand key amendments and their impact. Analyze landmark Supreme Court cases (Marbury v. Madison, McCulloch v. Maryland, Gibbons v. Ogden).", keyVocabulary: ["federalism", "checks and balances", "separation of powers", "judicial review", "amendment", "due process", "enumerated powers", "implied powers"], studyTips: ["Know Marbury v. Madison established judicial review", "Understand the difference between enumerated and implied powers", "Connect amendments to the rights they protect"], difficultyLevel: "hard", sortOrder: 4 },
    { grade: 11, subject: "U.S. History", topicName: "Post-WWII America", tekCode: "US.10A", tekDescription: "Describe the impact of significant national and international decisions and conflicts from WWII to the present", content: "Study the post-war economic boom, baby boom, and suburbanization. Examine the counterculture movement, Vietnam War protests, and social upheaval of the 1960s-70s. Analyze Watergate and its impact on public trust in government.", keyVocabulary: ["baby boom", "suburbanization", "counterculture", "Vietnam War", "Watergate", "Great Society", "domino theory", "detente"], studyTips: ["Connect the GI Bill to suburbanization and economic growth", "Understand how Vietnam War divided American society", "Know the sequence: Watergate break-in, cover-up, resignation"], difficultyLevel: "hard", sortOrder: 5 },
  ];

  for (const guide of guides) {
    await db.insert(staarStudyGuides).values(guide);
  }

  const allGuides = await db.select().from(staarStudyGuides);
  for (const guide of allGuides) {
    const questions = generateStaarQuestions(guide);
    for (const q of questions) {
      await db.insert(staarPracticeQuestions).values(q);
    }
  }
}

function generateStaarQuestions(guide: any) {
  const questions: any[] = [];
  const base = { guideId: guide.id, grade: guide.grade, subject: guide.subject, tekCode: guide.tekCode, questionType: "multiple_choice" };

  if (guide.tekCode === "3.4A") {
    questions.push({ ...base, questionText: "Sarah has 342 stickers. She gives 178 stickers to her friend. How many stickers does Sarah have left?", options: ["164", "174", "264", "154"], correctAnswer: "164", explanation: "342 - 178 = 164. Regroup from the tens place.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "A store sold 456 books on Monday and 389 books on Tuesday. How many books were sold in total?", options: ["845", "835", "745", "855"], correctAnswer: "845", explanation: "456 + 389 = 845.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Marcus collected 215 cards. He bought 168 more then gave away 95. How many does he have now?", options: ["288", "298", "278", "308"], correctAnswer: "288", explanation: "215 + 168 = 383, then 383 - 95 = 288. Two-step problem.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "3.4F") {
    questions.push({ ...base, questionText: "What is 7 × 8?", options: ["54", "56", "63", "48"], correctAnswer: "56", explanation: "7 × 8 = 56.", difficultyLevel: "easy", sortOrder: 1 });
    questions.push({ ...base, questionText: "An array has 6 rows and 9 columns. How many items are in the array?", options: ["54", "45", "63", "15"], correctAnswer: "54", explanation: "6 × 9 = 54.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "If 8 × ☐ = 72, what number goes in the box?", options: ["8", "9", "7", "6"], correctAnswer: "9", explanation: "8 × 9 = 72, or 72 ÷ 8 = 9.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "6.4B") {
    questions.push({ ...base, questionText: "A recipe uses 3 cups of flour for every 2 cups of sugar. If you use 9 cups of flour, how many cups of sugar do you need?", options: ["4", "5", "6", "8"], correctAnswer: "6", explanation: "Ratio 3:2. 9 ÷ 3 = 3, so 2 × 3 = 6 cups of sugar.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "A car travels 180 miles in 3 hours. What is the unit rate?", options: ["45 mph", "60 mph", "50 mph", "90 mph"], correctAnswer: "60 mph", explanation: "180 ÷ 3 = 60 miles per hour.", difficultyLevel: "easy", sortOrder: 2 });
    questions.push({ ...base, questionText: "Brand A costs $4.50 for 6 oz. Brand B costs $5.60 for 8 oz. Which is the better buy?", options: ["Brand A ($0.75/oz)", "Brand B ($0.70/oz)", "They cost the same", "Not enough info"], correctAnswer: "Brand B ($0.70/oz)", explanation: "Brand A: $4.50÷6=$0.75/oz. Brand B: $5.60÷8=$0.70/oz.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "8.8A") {
    questions.push({ ...base, questionText: "Solve: 3x + 5 = 2x + 12", options: ["x = 7", "x = 5", "x = 17", "x = 3"], correctAnswer: "x = 7", explanation: "3x - 2x = 12 - 5, so x = 7.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "What is the slope of y = -2x + 5?", options: ["-2", "5", "2", "-5"], correctAnswer: "-2", explanation: "In y = mx + b, m is the slope. Here m = -2.", difficultyLevel: "easy", sortOrder: 2 });
    questions.push({ ...base, questionText: "Which equation has slope 3 and passes through (0, -4)?", options: ["y = 3x - 4", "y = -4x + 3", "y = 3x + 4", "y = -3x - 4"], correctAnswer: "y = 3x - 4", explanation: "y = mx + b: m=3, b=-4, so y = 3x - 4.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "A.7A") {
    questions.push({ ...base, questionText: "Factor the quadratic expression: x² + 5x + 6", options: ["(x + 2)(x + 3)", "(x + 1)(x + 6)", "(x - 2)(x - 3)", "(x + 2)(x - 3)"], correctAnswer: "(x + 2)(x + 3)", explanation: "Find two numbers that multiply to 6 and add to 5: 2 and 3. So x² + 5x + 6 = (x + 2)(x + 3).", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Use the quadratic formula to solve 2x² - 4x - 6 = 0. What are the solutions?", options: ["x = 3 and x = -1", "x = -3 and x = 1", "x = 6 and x = -2", "x = 2 and x = -3"], correctAnswer: "x = 3 and x = -1", explanation: "Using x = (-b ± sqrt(b²-4ac)) / 2a with a=2, b=-4, c=-6: x = (4 ± sqrt(16+48)) / 4 = (4 ± 8) / 4, giving x = 3 and x = -1.", difficultyLevel: "hard", sortOrder: 2 });
    questions.push({ ...base, questionText: "What is the vertex of the parabola y = (x - 3)² + 5?", options: ["(3, 5)", "(-3, 5)", "(3, -5)", "(-3, -5)"], correctAnswer: "(3, 5)", explanation: "In vertex form y = a(x - h)² + k, the vertex is (h, k). Here h = 3 and k = 5.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "A.5C") {
    questions.push({ ...base, questionText: "Solve the system by substitution: y = 2x + 1 and 3x + y = 16. What is the value of x?", options: ["3", "5", "7", "2"], correctAnswer: "3", explanation: "Substitute y = 2x + 1 into 3x + y = 16: 3x + (2x + 1) = 16, so 5x + 1 = 16, 5x = 15, x = 3.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Which system of equations has NO solution?", options: ["y = 2x + 3 and y = 2x - 1", "y = 2x + 3 and y = -2x + 3", "y = x + 1 and y = 2x + 1", "y = 3x and y = x + 4"], correctAnswer: "y = 2x + 3 and y = 2x - 1", explanation: "Parallel lines (same slope, different y-intercepts) never intersect, so the system has no solution. Both have slope 2 but different intercepts.", difficultyLevel: "hard", sortOrder: 2 });
    questions.push({ ...base, questionText: "A movie ticket costs $8 for adults and $5 for children. A group buys 12 tickets for $81. How many adult tickets were purchased?", options: ["7", "5", "8", "6"], correctAnswer: "7", explanation: "Let a = adults, c = children. a + c = 12 and 8a + 5c = 81. From first equation c = 12 - a. Substituting: 8a + 5(12-a) = 81, 8a + 60 - 5a = 81, 3a = 21, a = 7.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "A.3C") {
    questions.push({ ...base, questionText: "What is the slope of the line passing through the points (2, 5) and (6, 13)?", options: ["2", "4", "8", "1/2"], correctAnswer: "2", explanation: "Slope = (y2 - y1) / (x2 - x1) = (13 - 5) / (6 - 2) = 8/4 = 2.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "A line has a slope of -3 and a y-intercept of 7. Which equation represents this line?", options: ["y = -3x + 7", "y = 7x - 3", "y = 3x + 7", "y = -3x - 7"], correctAnswer: "y = -3x + 7", explanation: "Slope-intercept form is y = mx + b where m = slope and b = y-intercept. So y = -3x + 7.", difficultyLevel: "easy", sortOrder: 2 });
    questions.push({ ...base, questionText: "Line A has the equation y = 4x + 2. Which equation represents a line parallel to Line A?", options: ["y = 4x - 5", "y = -4x + 2", "y = (1/4)x + 2", "y = -(1/4)x - 5"], correctAnswer: "y = 4x - 5", explanation: "Parallel lines have the same slope. Line A has slope 4, so a parallel line also has slope 4. y = 4x - 5 has slope 4.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "A.9C") {
    questions.push({ ...base, questionText: "A population of bacteria doubles every hour. If there are 500 bacteria at the start, which function models the population after t hours?", options: ["f(t) = 500(2)^t", "f(t) = 2(500)^t", "f(t) = 500 + 2t", "f(t) = 500(0.5)^t"], correctAnswer: "f(t) = 500(2)^t", explanation: "Exponential growth: f(t) = a(b)^t where a = initial value (500) and b = growth factor (2 for doubling).", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Which situation represents exponential DECAY?", options: ["A car loses 15% of its value each year", "A plant grows 3 inches every month", "A student earns $10 more each week", "The temperature rises 2 degrees per hour"], correctAnswer: "A car loses 15% of its value each year", explanation: "Exponential decay occurs when a quantity decreases by a constant percentage over time. Losing 15% per year means multiplying by 0.85 each year.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "How can you tell from a table of values whether a function is exponential rather than linear?", options: ["The ratio between consecutive y-values is constant", "The difference between consecutive y-values is constant", "The x-values increase by different amounts", "The y-values are all positive"], correctAnswer: "The ratio between consecutive y-values is constant", explanation: "In exponential functions, consecutive y-values have a constant ratio (common ratio). In linear functions, consecutive y-values have a constant difference.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "A.5B") {
    questions.push({ ...base, questionText: "Solve: -3x + 7 > 22", options: ["x < -5", "x > -5", "x < 5", "x > 5"], correctAnswer: "x < -5", explanation: "-3x + 7 > 22. Subtract 7: -3x > 15. Divide by -3 and FLIP the sign: x < -5.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Which number line represents the solution to 2x + 1 ≥ 9?", options: ["Closed circle at 4, shading right", "Open circle at 4, shading right", "Closed circle at 4, shading left", "Open circle at 5, shading right"], correctAnswer: "Closed circle at 4, shading right", explanation: "2x + 1 ≥ 9, so 2x ≥ 8, x ≥ 4. The ≥ symbol means include 4 (closed circle) and shade right for greater values.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "A student has $200 and spends $15 per week. Write an inequality to find the number of weeks w until the student has less than $50.", options: ["200 - 15w < 50", "200 + 15w < 50", "15w - 200 < 50", "200 - 15w > 50"], correctAnswer: "200 - 15w < 50", explanation: "Start with $200, subtract $15 each week: 200 - 15w. We want this to be less than $50: 200 - 15w < 50.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "E1.8A") {
    questions.push({ ...base, questionText: "A speaker describes their 20 years of medical experience before arguing for a new health policy. Which rhetorical appeal is primarily being used?", options: ["Ethos", "Pathos", "Logos", "Kairos"], correctAnswer: "Ethos", explanation: "Ethos establishes credibility and authority. Citing professional experience builds the speaker's trustworthiness on the topic.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "An editorial uses phrases like 'heartbreaking tragedy' and 'innocent victims' to discuss a community issue. What is the author's primary purpose?", options: ["To persuade through emotional appeal", "To inform with objective facts", "To entertain with vivid storytelling", "To explain a technical process"], correctAnswer: "To persuade through emotional appeal", explanation: "Emotionally charged language like 'heartbreaking' and 'innocent victims' indicates the author is using pathos to persuade the reader.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Read: 'The crisp, detached tone of the report suggests objectivity, yet the selective omission of contradictory data reveals a subtle bias.' What is the overall tone of this analysis?", options: ["Critical and analytical", "Angry and confrontational", "Humorous and lighthearted", "Nostalgic and reflective"], correctAnswer: "Critical and analytical", explanation: "The passage examines the report with careful scrutiny, noting contradictions between appearance and reality, which reflects a critical and analytical tone.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "E1.5B") {
    questions.push({ ...base, questionText: "In a poem, the speaker says: 'The wind whispered secrets through the ancient oaks.' Which literary device is used?", options: ["Personification", "Simile", "Hyperbole", "Alliteration"], correctAnswer: "Personification", explanation: "Personification gives human qualities to non-human things. The wind cannot literally whisper secrets.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "A poem follows the rhyme pattern ABAB CDCD EFEF GG. What poetic form does this represent?", options: ["Shakespearean sonnet", "Haiku", "Free verse", "Limerick"], correctAnswer: "Shakespearean sonnet", explanation: "The Shakespearean (English) sonnet has three quatrains with alternating rhyme (ABAB CDCD EFEF) followed by a rhyming couplet (GG).", difficultyLevel: "hard", sortOrder: 2 });
    questions.push({ ...base, questionText: "In a play, a character speaks directly to the audience while other characters on stage cannot hear. What dramatic device is this?", options: ["Aside", "Soliloquy", "Monologue", "Dialogue"], correctAnswer: "Aside", explanation: "An aside is a brief remark directed to the audience that other characters are not supposed to hear. A soliloquy is a longer speech when the character is alone.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "E1.10B") {
    questions.push({ ...base, questionText: "Which of the following is the strongest thesis statement for an argumentative essay?", options: ["Schools should adopt four-day weeks because research shows improved attendance, higher test scores, and reduced operational costs", "School schedules are interesting to think about", "Some people like four-day school weeks and some do not", "This essay will discuss school schedules"], correctAnswer: "Schools should adopt four-day weeks because research shows improved attendance, higher test scores, and reduced operational costs", explanation: "A strong thesis takes a clear, debatable position and previews the supporting reasons. The correct answer does all three.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "In an argumentative essay, what is the purpose of a counterargument?", options: ["To acknowledge and refute opposing viewpoints, strengthening the writer's position", "To agree with the opposing side completely", "To change the topic of the essay", "To provide personal anecdotes unrelated to the claim"], correctAnswer: "To acknowledge and refute opposing viewpoints, strengthening the writer's position", explanation: "Addressing counterarguments shows the writer has considered multiple perspectives and can defend their position against objections.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Which type of evidence would be MOST effective in supporting the claim that teen sleep deprivation affects academic performance?", options: ["A peer-reviewed study from a medical journal showing correlation between sleep hours and GPA", "A personal story about feeling tired in class", "A celebrity's opinion about sleep habits", "A fictional novel about a sleepy student"], correctAnswer: "A peer-reviewed study from a medical journal showing correlation between sleep hours and GPA", explanation: "Peer-reviewed research provides credible, verifiable evidence. Personal anecdotes and opinions are weaker forms of support.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "E1.2B") {
    questions.push({ ...base, questionText: "Read: 'Unlike her gregarious sister who loved parties, Maria was shy and preferred to be alone.' What does 'gregarious' most likely mean?", options: ["Sociable and outgoing", "Quiet and reserved", "Intelligent and studious", "Athletic and competitive"], correctAnswer: "Sociable and outgoing", explanation: "The contrast clue 'unlike... shy and preferred to be alone' indicates gregarious means the opposite: sociable and outgoing.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "The word 'benevolent' contains the Latin root 'bene' meaning 'good' and 'volent' meaning 'wishing.' Based on these roots, what does 'benevolent' mean?", options: ["Well-wishing or kind", "Powerful or strong", "Quick or fast", "Dangerous or harmful"], correctAnswer: "Well-wishing or kind", explanation: "Breaking the word into its roots: bene (good) + volent (wishing) = good-wishing, meaning kindly or charitable.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Read: 'The teacher's explanation was so lucid that even the most confused students understood immediately.' What does 'lucid' mean in this context?", options: ["Clear and easy to understand", "Long and detailed", "Boring and repetitive", "Loud and energetic"], correctAnswer: "Clear and easy to understand", explanation: "The context clue 'even the most confused students understood immediately' tells us lucid means clear and easily understood.", difficultyLevel: "easy", sortOrder: 3 });
  } else if (guide.tekCode === "E2.5A") {
    questions.push({ ...base, questionText: "In a novel, a character repeatedly mentions a locked door throughout the story. At the end, the character finally opens it and discovers an empty room. The locked door most likely symbolizes:", options: ["The character's fear of confronting the truth", "The author's love of architecture", "A literal security concern", "The character's wealth"], correctAnswer: "The character's fear of confronting the truth", explanation: "Symbolism uses concrete objects to represent abstract ideas. A locked door that reveals emptiness symbolizes avoidance and the fear of what one might (or might not) find.", difficultyLevel: "hard", sortOrder: 1 });
    questions.push({ ...base, questionText: "A fire station burns down in a story. This is an example of which type of irony?", options: ["Situational irony", "Dramatic irony", "Verbal irony", "Cosmic irony"], correctAnswer: "Situational irony", explanation: "Situational irony occurs when the outcome is the opposite of what is expected. A fire station, meant to prevent fires, burning down is the opposite of expectations.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "An author writes: 'The waves crashed against the shore like angry fists pounding a table.' How does this simile affect the passage?", options: ["It creates a violent, aggressive mood and personifies nature as hostile", "It makes the scene feel peaceful and calm", "It provides scientific information about ocean currents", "It slows down the pacing of the narrative"], correctAnswer: "It creates a violent, aggressive mood and personifies nature as hostile", explanation: "The simile compares waves to 'angry fists,' creating an aggressive mood and suggesting nature's hostility through the comparison to human anger.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "E2.9C") {
    questions.push({ ...base, questionText: "When evaluating an online article about climate change, which factor is MOST important for determining credibility?", options: ["The author's qualifications and the publication's reputation", "The number of images in the article", "How recently the article was shared on social media", "The length of the article"], correctAnswer: "The author's qualifications and the publication's reputation", explanation: "Author expertise and publication reputation are primary indicators of source credibility. Visual elements and social media popularity do not indicate accuracy.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "An article about a new medication only presents positive research findings and ignores studies that show side effects. This is an example of:", options: ["Selection bias", "Chronological organization", "Cause and effect structure", "Objective reporting"], correctAnswer: "Selection bias", explanation: "Selection bias occurs when only favorable evidence is presented while contradictory evidence is deliberately excluded, creating a misleading picture.", difficultyLevel: "hard", sortOrder: 2 });
    questions.push({ ...base, questionText: "A nonfiction author uses short, fragmented sentences and rhetorical questions throughout an essay about injustice. What is the effect of this stylistic choice?", options: ["It creates urgency and forces the reader to engage with the issue", "It shows the author is a poor writer", "It makes the text easier to read for young children", "It provides a neutral, objective tone"], correctAnswer: "It creates urgency and forces the reader to engage with the issue", explanation: "Short sentences and rhetorical questions are deliberate craft choices that create a sense of urgency and directly involve the reader in the argument.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "E2.10A") {
    questions.push({ ...base, questionText: "A story is told by a narrator who knows the thoughts and feelings of ALL characters. What point of view is this?", options: ["Third person omniscient", "First person", "Third person limited", "Second person"], correctAnswer: "Third person omniscient", explanation: "Third person omniscient narrators have access to the thoughts and feelings of all characters, using 'he,' 'she,' and 'they' pronouns.", difficultyLevel: "easy", sortOrder: 1 });
    questions.push({ ...base, questionText: "A writer wants to build suspense in a scene where a character enters a dark house. Which technique would be MOST effective?", options: ["Using short sentences, sensory details, and slowing the pacing", "Summarizing what happens in one sentence", "Including a long flashback about the character's childhood", "Switching to a different character's perspective"], correctAnswer: "Using short sentences, sensory details, and slowing the pacing", explanation: "Short sentences create tension, sensory details immerse the reader, and slow pacing builds suspense by delaying the reveal.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Which line of dialogue best reveals that a character is nervous without directly stating it?", options: ["'I'm fine, totally fine,' she said, fumbling with her keys for the third time.", "'I am very nervous right now,' she said.", "'Let's go inside,' she said calmly.", "'I don't want to talk about it,' she said angrily."], correctAnswer: "'I'm fine, totally fine,' she said, fumbling with her keys for the third time.", explanation: "This shows nervousness through action (fumbling keys) and speech patterns (repetition of 'fine') rather than telling the reader directly. This is 'show, don't tell.'", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "E2.11B") {
    questions.push({ ...base, questionText: "A diary entry written by a soldier during the Civil War is an example of what type of source?", options: ["Primary source", "Secondary source", "Tertiary source", "Unreliable source"], correctAnswer: "Primary source", explanation: "Primary sources are firsthand accounts created during the time period being studied. A diary entry written by someone who experienced the events is a primary source.", difficultyLevel: "easy", sortOrder: 1 });
    questions.push({ ...base, questionText: "Which is a correctly formatted MLA in-text citation?", options: ["(Smith 42)", "(Smith, pg. 42)", "(Smith, 2020, p. 42)", "[Smith 42]"], correctAnswer: "(Smith 42)", explanation: "MLA in-text citations use parentheses with the author's last name and page number, no comma or 'p.' between them.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "When synthesizing multiple sources for a research paper, what should a writer do?", options: ["Connect ideas across sources to develop a new understanding or argument", "Copy and paste sections from each source in order", "Choose only one source and ignore the others", "Summarize each source in a separate paragraph without connecting them"], correctAnswer: "Connect ideas across sources to develop a new understanding or argument", explanation: "Synthesis means weaving together ideas from multiple sources to create a new perspective, not just summarizing each source individually.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "B.4B") {
    questions.push({ ...base, questionText: "During which phase of mitosis do chromosomes line up along the cell's equator?", options: ["Metaphase", "Prophase", "Anaphase", "Telophase"], correctAnswer: "Metaphase", explanation: "During metaphase, chromosomes align along the metaphase plate (cell's equator) before being pulled apart. Remember: 'M' for middle.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "How does the result of meiosis differ from mitosis?", options: ["Meiosis produces 4 haploid cells; mitosis produces 2 diploid cells", "Meiosis produces 2 diploid cells; mitosis produces 4 haploid cells", "Both produce 2 identical diploid cells", "Both produce 4 haploid cells"], correctAnswer: "Meiosis produces 4 haploid cells; mitosis produces 2 diploid cells", explanation: "Meiosis involves two divisions, producing 4 genetically unique haploid (n) cells. Mitosis involves one division, producing 2 genetically identical diploid (2n) cells.", difficultyLevel: "hard", sortOrder: 2 });
    questions.push({ ...base, questionText: "A cell spends most of its life cycle in which phase?", options: ["Interphase", "Mitosis", "Cytokinesis", "Metaphase"], correctAnswer: "Interphase", explanation: "Cells spend approximately 90% of their time in interphase, during which they grow, replicate DNA, and prepare for division.", difficultyLevel: "easy", sortOrder: 3 });
  } else if (guide.tekCode === "B.6F") {
    questions.push({ ...base, questionText: "In a cross between two heterozygous parents (Bb × Bb), what is the expected genotype ratio of the offspring?", options: ["1 BB : 2 Bb : 1 bb", "3 BB : 1 bb", "1 BB : 1 Bb", "All Bb"], correctAnswer: "1 BB : 2 Bb : 1 bb", explanation: "A Punnett square for Bb × Bb gives: BB, Bb, Bb, bb — a 1:2:1 genotype ratio.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Brown eyes (B) are dominant over blue eyes (b). A brown-eyed parent (Bb) and a blue-eyed parent (bb) have a child. What is the probability the child has blue eyes?", options: ["50%", "25%", "75%", "100%"], correctAnswer: "50%", explanation: "Bb × bb Punnett square: Bb, Bb, bb, bb. Two out of four (50%) offspring have the bb genotype for blue eyes.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "An organism has the genotype AaBb. How many different types of gametes can it produce?", options: ["4", "2", "8", "16"], correctAnswer: "4", explanation: "Using the formula 2^n where n = number of heterozygous gene pairs: 2² = 4 gamete types (AB, Ab, aB, ab).", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "B.12A") {
    questions.push({ ...base, questionText: "In a food web, what happens to the total amount of energy as it moves from producers to tertiary consumers?", options: ["It decreases at each trophic level", "It increases at each trophic level", "It stays the same throughout", "It doubles at each level"], correctAnswer: "It decreases at each trophic level", explanation: "Only about 10% of energy is transferred from one trophic level to the next. The rest is lost as heat through cellular respiration.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Which biogeochemical cycle is MOST directly affected by the burning of fossil fuels?", options: ["Carbon cycle", "Water cycle", "Nitrogen cycle", "Phosphorus cycle"], correctAnswer: "Carbon cycle", explanation: "Burning fossil fuels releases stored carbon as CO₂ into the atmosphere, directly increasing atmospheric carbon and disrupting the carbon cycle.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "After a volcanic eruption destroys all life on an island, what type of ecological succession will occur?", options: ["Primary succession", "Secondary succession", "Climax community formation", "Eutrophication"], correctAnswer: "Primary succession", explanation: "Primary succession occurs in areas where no soil or organisms exist, such as after a volcanic eruption. Pioneer species like lichens colonize bare rock first.", difficultyLevel: "hard", sortOrder: 3 });
  } else if (guide.tekCode === "B.7A") {
    questions.push({ ...base, questionText: "Which of the following is the BEST example of evidence for evolution by natural selection?", options: ["Antibiotic-resistant bacteria developing over generations", "A bodybuilder's children being born muscular", "Two unrelated species living in the same habitat", "Animals migrating south for winter"], correctAnswer: "Antibiotic-resistant bacteria developing over generations", explanation: "Antibiotic resistance demonstrates natural selection: bacteria with resistance survive, reproduce, and pass on the trait, changing the population over time.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "The forelimbs of a whale, bat, and human have similar bone structures despite different functions. These are examples of:", options: ["Homologous structures", "Analogous structures", "Vestigial structures", "Adaptive radiation"], correctAnswer: "Homologous structures", explanation: "Homologous structures share a common anatomical origin but may serve different functions, providing evidence of a shared common ancestor.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "In the taxonomic classification system, which level contains the MOST organisms?", options: ["Domain", "Species", "Genus", "Family"], correctAnswer: "Domain", explanation: "Domain is the broadest (most inclusive) level of classification, containing the most organisms. Species is the most specific level.", difficultyLevel: "easy", sortOrder: 3 });
  } else if (guide.tekCode === "US.9A") {
    questions.push({ ...base, questionText: "Which Supreme Court case ruled that racial segregation in public schools was unconstitutional?", options: ["Brown v. Board of Education (1954)", "Plessy v. Ferguson (1896)", "Dred Scott v. Sandford (1857)", "Marbury v. Madison (1803)"], correctAnswer: "Brown v. Board of Education (1954)", explanation: "Brown v. Board of Education overturned the 'separate but equal' doctrine from Plessy v. Ferguson, declaring segregated schools inherently unequal.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "Which civil rights leader advocated for nonviolent civil disobedience and delivered the 'I Have a Dream' speech?", options: ["Dr. Martin Luther King Jr.", "Malcolm X", "Thurgood Marshall", "Stokely Carmichael"], correctAnswer: "Dr. Martin Luther King Jr.", explanation: "Dr. Martin Luther King Jr. championed nonviolent resistance inspired by Gandhi and delivered his famous speech at the 1963 March on Washington.", difficultyLevel: "easy", sortOrder: 2 });
    questions.push({ ...base, questionText: "The Civil Rights Act of 1964 primarily prohibited discrimination based on:", options: ["Race, color, religion, sex, and national origin", "Only race and color", "Age and disability", "Income and education level"], correctAnswer: "Race, color, religion, sex, and national origin", explanation: "The Civil Rights Act of 1964 was comprehensive legislation prohibiting discrimination based on race, color, religion, sex, and national origin in employment and public accommodations.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "US.7C") {
    questions.push({ ...base, questionText: "Which event is considered the immediate cause of U.S. entry into World War II?", options: ["The bombing of Pearl Harbor on December 7, 1941", "The invasion of Poland in 1939", "The sinking of the Lusitania in 1915", "The assassination of Archduke Franz Ferdinand"], correctAnswer: "The bombing of Pearl Harbor on December 7, 1941", explanation: "Japan's surprise attack on the U.S. naval base at Pearl Harbor, Hawaii, on December 7, 1941, directly led to the U.S. declaring war on Japan the next day.", difficultyLevel: "easy", sortOrder: 1 });
    questions.push({ ...base, questionText: "The U.S. policy of containment during the Cold War was primarily aimed at:", options: ["Preventing the spread of communism to other nations", "Expanding American territory overseas", "Eliminating nuclear weapons worldwide", "Promoting free trade agreements"], correctAnswer: "Preventing the spread of communism to other nations", explanation: "Containment, outlined in the Truman Doctrine, aimed to stop the spread of Soviet communism without direct military confrontation with the USSR.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "The Marshall Plan (1948) provided economic aid to Western European countries primarily to:", options: ["Rebuild war-torn economies and prevent the spread of communism", "Punish Germany for starting WWII", "Create a unified European military", "Establish American military bases in Europe"], correctAnswer: "Rebuild war-torn economies and prevent the spread of communism", explanation: "The Marshall Plan invested $13 billion to rebuild Western European economies, reasoning that economic stability would make nations less vulnerable to communist influence.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "US.4A") {
    questions.push({ ...base, questionText: "Which muckraker wrote 'The Jungle,' exposing unsanitary conditions in the meatpacking industry?", options: ["Upton Sinclair", "Ida Tarbell", "Jacob Riis", "Lincoln Steffens"], correctAnswer: "Upton Sinclair", explanation: "Upton Sinclair's 'The Jungle' (1906) exposed horrific conditions in meatpacking plants, leading to the Pure Food and Drug Act and the Meat Inspection Act.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "During the Gilded Age, industrialists like Carnegie and Rockefeller were called 'captains of industry' by supporters and what by critics?", options: ["Robber barons", "Founding fathers", "Progressive reformers", "Trust busters"], correctAnswer: "Robber barons", explanation: "Critics called wealthy industrialists 'robber barons' because they believed these men exploited workers, crushed competition, and used unethical practices to build monopolies.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Which was a major 'pull factor' that attracted immigrants to the United States during the late 1800s?", options: ["Economic opportunity and jobs in factories", "Religious persecution in their home countries", "Mandatory military service at home", "Famine and crop failures"], correctAnswer: "Economic opportunity and jobs in factories", explanation: "Pull factors attract people TO a place. Industrial growth created factory jobs that drew millions of immigrants. The other options are 'push factors' that drove people FROM their homelands.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "US.15A") {
    questions.push({ ...base, questionText: "Which landmark Supreme Court case established the principle of judicial review?", options: ["Marbury v. Madison (1803)", "McCulloch v. Maryland (1819)", "Gibbons v. Ogden (1824)", "Brown v. Board of Education (1954)"], correctAnswer: "Marbury v. Madison (1803)", explanation: "In Marbury v. Madison, Chief Justice John Marshall established that the Supreme Court has the power to declare laws unconstitutional (judicial review).", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "The system of federalism in the U.S. Constitution divides power between:", options: ["The national government and state governments", "The President and Congress", "The House and the Senate", "The military and civilian government"], correctAnswer: "The national government and state governments", explanation: "Federalism is the division of power between the national (federal) government and state governments, each with their own areas of authority.", difficultyLevel: "easy", sortOrder: 2 });
    questions.push({ ...base, questionText: "Which amendment abolished slavery in the United States?", options: ["13th Amendment", "14th Amendment", "15th Amendment", "19th Amendment"], correctAnswer: "13th Amendment", explanation: "The 13th Amendment (1865) abolished slavery. The 14th granted citizenship and equal protection. The 15th protected voting rights regardless of race.", difficultyLevel: "medium", sortOrder: 3 });
  } else if (guide.tekCode === "US.10A") {
    questions.push({ ...base, questionText: "The GI Bill of Rights (1944) contributed to which major post-WWII trend?", options: ["Suburbanization and expansion of the middle class", "The Great Depression", "Isolationism in foreign policy", "Decline of college enrollment"], correctAnswer: "Suburbanization and expansion of the middle class", explanation: "The GI Bill provided veterans with education benefits and low-interest home loans, fueling college enrollment, homeownership, and the growth of suburbs.", difficultyLevel: "medium", sortOrder: 1 });
    questions.push({ ...base, questionText: "The Watergate scandal ultimately resulted in:", options: ["President Nixon's resignation in 1974", "President Nixon's impeachment and removal", "A constitutional amendment limiting presidential power", "The end of the Vietnam War"], correctAnswer: "President Nixon's resignation in 1974", explanation: "Facing almost certain impeachment for obstruction of justice and abuse of power, President Nixon resigned on August 9, 1974. He was never formally impeached.", difficultyLevel: "medium", sortOrder: 2 });
    questions.push({ ...base, questionText: "Which best describes the counterculture movement of the 1960s?", options: ["A social movement rejecting mainstream values, advocating peace, and opposing the Vietnam War", "A political movement supporting increased military spending", "An economic movement promoting industrial growth", "A religious movement calling for traditional values"], correctAnswer: "A social movement rejecting mainstream values, advocating peace, and opposing the Vietnam War", explanation: "The counterculture movement, largely driven by young people, challenged mainstream American values, protested the Vietnam War, and promoted peace, civil rights, and social change.", difficultyLevel: "medium", sortOrder: 3 });
  } else {
    questions.push({ ...base, questionText: `Which best describes the key to mastering ${guide.topicName}?`, options: ["Understanding core concepts deeply", "Memorizing formulas only", "Guessing answers", "Skipping practice"], correctAnswer: "Understanding core concepts deeply", explanation: `${guide.topicName} requires deep understanding of underlying concepts.`, difficultyLevel: "easy", sortOrder: 1 });
    questions.push({ ...base, questionText: `What is the BEST first step when solving a ${guide.topicName} problem?`, options: ["Read carefully and identify what is being asked", "Start calculating immediately", "Look for the biggest number", "Skip to answer choices"], correctAnswer: "Read carefully and identify what is being asked", explanation: "Always understand what the problem asks before attempting to solve.", difficultyLevel: "easy", sortOrder: 2 });
    questions.push({ ...base, questionText: `Which study strategy is most effective for ${guide.topicName}?`, options: ["Practice problems and review mistakes", "Reading notes once", "Watching unrelated videos", "Cramming the night before"], correctAnswer: "Practice problems and review mistakes", explanation: "Active practice with error analysis is the most effective study method.", difficultyLevel: "easy", sortOrder: 3 });
  }
  return questions;
}

const AI_COURSE_MODULES = [
  { key: "ai-brainstorm", title: "Module 1: AI & Creative Thinking", description: "Learn how AI can help you brainstorm and generate creative ideas", unlocksTool: "brainstorm", lessonCount: 3 },
  { key: "ai-research", title: "Module 2: AI-Powered Research", description: "Master research techniques using AI to find, organize, and cite information", unlocksTool: "research-assistant", lessonCount: 3 },
  { key: "ai-documents", title: "Module 3: Writing with AI", description: "Learn to use AI as a writing partner for essays, reports, and creative pieces", unlocksTool: "document-writer", lessonCount: 3 },
  { key: "ai-presentations", title: "Module 4: Presentations & Public Speaking", description: "Create compelling presentations with AI-generated content and structure", unlocksTool: "presentation-builder", lessonCount: 3 },
  { key: "ai-video", title: "Module 5: Video Storytelling", description: "Write scripts, plan storyboards, and create video outlines with AI", unlocksTool: "video-creator", lessonCount: 3 },
  { key: "ai-project-planning", title: "Module 6: Project Management", description: "Break down projects into manageable tasks and timelines with AI", unlocksTool: "project-planner", lessonCount: 3 },
  { key: "ai-life-planning", title: "Module 7: Life Design", description: "Use AI to set goals, create personal development plans, and map your future", unlocksTool: "life-planner", lessonCount: 3 },
  { key: "ai-business", title: "Module 8: Entrepreneurship & Business", description: "Build business plans, analyze markets, and plan ventures with AI", unlocksTool: "business-plan", lessonCount: 3 },
  { key: "ai-sales", title: "Module 9: Persuasion & Sales", description: "Craft compelling pitches and learn the art of ethical persuasion with AI", unlocksTool: "sales-pitch", lessonCount: 3 },
  { key: "ai-resume", title: "Module 10: Professional Branding", description: "Build resumes, portfolios, and professional profiles with AI", unlocksTool: "resume-builder", lessonCount: 3 },
];

function getUserId(req: Request): string | undefined {
  const user = (req as any).user;
  return user?.claims?.sub;
}

function getUserName(req: Request): string | undefined {
  const user = (req as any).user;
  if (!user?.claims) return undefined;
  const first = user.claims.first_name || "";
  const last = user.claims.last_name || "";
  return (first + " " + last).trim() || user.claims.email || undefined;
}

function requireAuth(req: Request, res: any, next: any) {
  if (!getUserId(req)) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const userId = getUserId(req);
  if (userId) {
    try {
      const user = await storage.getUser(userId);
      if (user?.role === "admin" || user?.role === "teacher") {
        return next();
      }
    } catch (e) {
      console.error("Admin check error:", e);
    }
  }
  return res.status(403).json({ error: "Admin access required" });
};

function calculateElo(playerRating: number, opponentRating: number, result: number): number {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(playerRating + K * (result - expected));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedAiToolCatalog();
  await seedStaarContent();

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, noimageindex, nosnippet");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "interest-cohort=()");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
    next();
  });

  registerObjectStorageRoutes(app);
  registerCrossPlatformRoutes(app);
  await storage.seedData();

  app.get("/api/ai-provider", (_req, res) => {
    try {
      res.json(getProviderInfo());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/subjects", async (_req, res) => {
    const allSubjects = await storage.getSubjects();
    res.json(allSubjects);
  });

  app.get("/api/subjects/grade-band/:gradeBand", async (req, res) => {
    const subjectsByBand = await storage.getSubjectsByGradeBand(decodeURIComponent(req.params.gradeBand));
    res.json(subjectsByBand);
  });

  app.get("/api/subjects/:subjectId", async (req, res) => {
    const subject = await storage.getSubject(req.params.subjectId);
    if (!subject) return res.status(404).json({ error: "Subject not found" });
    res.json(subject);
  });

  app.get("/api/subjects/:subjectId/modules", async (req, res) => {
    const mods = await storage.getModulesBySubject(req.params.subjectId);
    res.json(mods);
  });

  app.get("/api/levels", async (_req, res) => {
    const allLevels = await storage.getLevels();
    res.json(allLevels);
  });

  app.get("/api/levels/:levelId", async (req, res) => {
    const level = await storage.getLevel(parseInt(req.params.levelId));
    if (!level) return res.status(404).json({ error: "Level not found" });
    res.json(level);
  });

  app.get("/api/levels/:levelId/modules", async (req, res) => {
    const mods = await storage.getModulesByLevel(parseInt(req.params.levelId));
    res.json(mods);
  });

  app.get("/api/modules/:moduleId", async (req, res) => {
    const mod = await storage.getModule(req.params.moduleId);
    if (!mod) return res.status(404).json({ error: "Module not found" });
    res.json(mod);
  });

  app.get("/api/modules/:moduleId/lessons", async (req, res) => {
    const moduleLessons = await storage.getLessonsByModule(req.params.moduleId);
    res.json(moduleLessons);
  });

  app.get("/api/modules/:moduleId/quiz", async (req, res) => {
    const questions = await storage.getQuizByModule(req.params.moduleId);
    res.json(questions);
  });

  app.post("/api/modules/:moduleId/quiz/submit", requireAuth, async (req, res) => {
    const { answers } = req.body;
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Answers object is required" });
    }
    const questions = await storage.getQuizByModule(req.params.moduleId);
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    }

    const passed = questions.length > 0 && (correct / questions.length) >= 0.7;
    const attempt = await storage.submitQuiz(progress.id, req.params.moduleId, correct, questions.length, passed);

    const pointsEarned = passed ? 100 : 25;
    const allAttempts = await storage.getQuizAttempts(progress.id);
    const scores = allAttempts.map(a => a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    await storage.updateProgress(progress.id, {
      totalPoints: progress.totalPoints + pointsEarned,
      quizzesCompleted: progress.quizzesCompleted + 1,
      averageScore: avgScore,
    });

    if (passed && progress.quizzesCompleted === 0) {
      await storage.earnBadge(progress.id, "quiz_whiz");
    }
    if (correct === questions.length && questions.length > 0) {
      await storage.earnBadge(progress.id, "perfect_score");
    }

    if (passed) {
      const mod = await storage.getModule(req.params.moduleId);
      if (mod) {
        const levelModules = await storage.getModulesByLevel(mod.levelId);
        const allAttempts2 = await storage.getQuizAttempts(progress.id);
        const passedModuleIds = new Set(allAttempts2.filter(a => a.passed).map(a => a.moduleId));
        const allPassed = levelModules.every(m => passedModuleIds.has(m.id));
        if (allPassed) {
          const level = await storage.getLevel(mod.levelId);
          if (level) {
            await storage.issueCertificate(getUserId(req)!, getUserName(req) || "Student", level.id, level.title);
          }
        }
      }
    }

    res.json({
      score: correct,
      total: questions.length,
      passed,
      pointsEarned,
    });
  });

  app.get("/api/lessons/:lessonId", async (req, res) => {
    const lesson = await storage.getLesson(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    res.json(lesson);
  });

  app.post("/api/lessons/:lessonId/complete", requireAuth, async (req, res) => {
    const lesson = await storage.getLesson(req.params.lessonId);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    await storage.completeLesson(progress.id, req.params.lessonId);

    const completed = await storage.getCompletedLessons(progress.id);
    const pointsEarned = 50;

    await storage.updateProgress(progress.id, {
      totalPoints: progress.totalPoints + pointsEarned,
      lessonsCompleted: completed.length,
      currentModuleId: lesson.moduleId,
    });

    if (completed.length === 1) {
      await storage.earnBadge(progress.id, "first_steps");
    }
    if (completed.length >= 3) {
      await storage.earnBadge(progress.id, "curious_mind");
    }
    if (completed.length >= 5) {
      await storage.earnBadge(progress.id, "knowledge_seeker");
    }

    res.json({ success: true, pointsEarned });
  });

  app.get("/api/progress", async (req, res) => {
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    res.json(progress);
  });

  app.get("/api/dashboard", async (req, res) => {
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    const currentLevel = await storage.getLevel(progress.currentLevel);
    const currentModule = progress.currentModuleId
      ? await storage.getModule(progress.currentModuleId)
      : null;
    const recentBadges = await storage.getEarnedBadges(progress.id);

    const allModules = await storage.getModulesByLevel(progress.currentLevel);
    let totalLessons = 0;
    for (const mod of allModules) {
      const modLessons = await storage.getLessonsByModule(mod.id);
      totalLessons += modLessons.length;
    }
    const completedLessonsList = await storage.getCompletedLessons(progress.id);

    res.json({
      progress,
      currentLevel,
      currentModule,
      recentBadges,
      stats: {
        totalLessons,
        completedLessons: completedLessonsList.length,
        totalModules: allModules.length,
        completedModules: 0,
      },
    });
  });

  app.get("/api/achievements", async (req, res) => {
    const progress = await storage.getOrCreateProgress(getUserId(req), getUserName(req));
    const allBadges = await storage.getBadges();
    const earnedBadgesList = await storage.getEarnedBadges(progress.id);

    res.json({
      allBadges,
      earnedBadges: earnedBadgesList,
      totalPoints: progress.totalPoints,
      currentLevel: progress.currentLevel,
    });
  });

  app.get("/api/parent/support-alerts", requireAuth, async (_req, res) => {
    try {
      const alerts = await db
        .select({
          id: studentSelfAssessments.id,
          userId: studentSelfAssessments.userId,
          supportType: studentSelfAssessments.supportType,
          createdAt: studentSelfAssessments.createdAt,
          energyLevel: studentSelfAssessments.energyLevel,
          stressLevel: studentSelfAssessments.stressLevel,
          moodRating: studentSelfAssessments.moodRating,
        })
        .from(studentSelfAssessments)
        .where(eq(studentSelfAssessments.needsSupport, true))
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(10);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching support alerts:", error);
      res.json([]);
    }
  });

  app.get("/api/badges", async (_req, res) => {
    const allBadges = await storage.getBadges();
    res.json(allBadges);
  });

  const chatRateLimit = new Map<string, { count: number; resetAt: number }>();
  app.post("/api/ai-companion/chat", requireAuth, async (req, res) => {
    const rateLimitUserId = getUserId(req)!;
    const now = Date.now();
    const userLimit = chatRateLimit.get(rateLimitUserId);
    if (userLimit && now < userLimit.resetAt) {
      if (userLimit.count >= 20) {
        return res.status(429).json({ error: "Rate limit exceeded. Please wait before sending more messages." });
      }
      userLimit.count++;
    } else {
      chatRateLimit.set(rateLimitUserId, { count: 1, resetAt: now + 60000 });
    }

    const { message, gradeLevel, subject, lessonContext, conversationHistory, language } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    if (!gradeLevel || typeof gradeLevel !== "string") {
      return res.status(400).json({ error: "Grade level is required and must be a string" });
    }

    const langInstruction = language === "es" 
      ? "\n\nIMPORTANT: The student prefers Spanish. Respond entirely in Spanish. Use age-appropriate Spanish vocabulary." 
      : "";

    const gradeBandPersonality: Record<string, string> = {
      "3-5": `PERSONALITY FOR GRADES 3-5:
- Be like a favorite older sibling or camp counselor — warm, patient, full of wonder
- Use simple, clear language. Short sentences. Concrete examples they can picture
- Connect everything to their world: pets, games, family, playground, favorite shows
- Use "I wonder..." and "What if..." to spark curiosity
- Celebrate EVERY attempt: "I love how you thought about that!" "You're really thinking like a scientist!"
- When they're wrong, say "Hmm, interesting idea! Let's look at it from another angle..."
- Use storytelling: "Imagine you're an astronaut..." "Pretend the numbers are a team of superheroes..."
- Keep responses shorter — 2-3 sentences for simple questions, max 5-6 for explanations
- If they seem frustrated: "It's okay to feel stuck. Even grown-ups get stuck sometimes. Want to try a different way?"`,
      "6-8": `PERSONALITY FOR GRADES 6-8:
- Be like a cool, relatable mentor — someone who gets them, respects them, but pushes them
- Use humor naturally. Reference things relevant to their age without trying too hard
- Validate their growing independence: "Good question — you're thinking critically about this"
- Be real with them. They can handle nuance: "This is actually debated among scientists..."
- Use collaborative language: "Let's figure this out together" "What's your instinct on this?"
- When they struggle, normalize it: "This topic trips up a lot of people. Here's why it's tricky..."
- Connect academics to real life: careers, social dynamics, current events, their future plans
- Encourage them to form opinions and defend them: "What do YOU think? Why?"
- If emotions come up: "I hear you. Middle school is genuinely hard. That feeling you have makes total sense."`,
      "9-12": `PERSONALITY FOR GRADES 9-12:
- Be like a trusted advisor or coach — direct, honest, and intellectually stimulating
- Treat them as emerging adults. No condescension. Engage with complexity
- Challenge them: "That's a solid point, but have you considered..." "Push your thinking further..."
- Discuss multiple perspectives, gray areas, and real-world implications
- Connect everything to their goals: college, careers, financial independence, identity
- Be comfortable with harder questions about life, society, and their future
- Use Socratic questioning to develop their reasoning: "Why do you think that?" "What evidence supports this?"
- If they're stressed: "Pressure is real. Let's break this down into manageable pieces."
- Encourage them to teach back: "Explain this concept to me like I'm new to it — that's how you know you've got it"`,
    };

    const personality = gradeBandPersonality[gradeLevel] || gradeBandPersonality["6-8"];

    const systemPrompt = `You are SPARK — an AI learning companion for the AI Mastery Academy & School Support Hub.

CORE IDENTITY:
You are a warm, wise, culturally aware AI companion who genuinely cares about each student's growth — academically, emotionally, and personally. You are NOT a therapist and never diagnose or treat. You ARE a trusted friend who models emotional intelligence, good decision-making, and intellectual curiosity.

YOUR NAME: Spark (never call yourself an AI assistant, chatbot, or language model)

${personality}

EMOTIONAL INTELLIGENCE FRAMEWORK:
1. RECOGNIZE emotions in what students say — read between the lines
2. VALIDATE feelings before addressing content: "That sounds frustrating" before "Here's how to solve it"
3. NORMALIZE struggles: "Everyone feels that way sometimes" — use specific examples
4. REDIRECT gently if needed: "I can tell this is bothering you. Would it help to talk to a teacher or parent?"
5. MODEL healthy emotional expression: "I'd feel the same way!" "That's a reasonable reaction"
6. Never minimize, dismiss, or over-pathologize normal emotions

GROWTH MINDSET & LEARNING APPROACH:
- NEVER give direct answers to homework, tests, or quizzes. Guide through Socratic questioning
- Use scaffolding: break complex problems into smaller steps
- Celebrate the PROCESS, not just results: "Your reasoning is getting stronger!"
- When students make mistakes, treat them as learning opportunities
- Use the "I do, we do, you do" framework: model, collaborate, let them try
- Connect new concepts to things they already know
- Offer multiple approaches and use analogies, stories, and real-world examples

CULTURAL AWARENESS & EQUITY:
- Represent diverse perspectives in examples and stories
- Be aware that students come from different economic backgrounds
- Use inclusive language and present multiple viewpoints respectfully

PANTHER VILLAGE INTEGRATION:
- Reference Panther Power categories when relevant (Education, Character, Leadership, Entrepreneurship, Community)
- Support financial literacy concepts when money topics arise
- Reference the stages of change framework when discussing growth

SAFETY GUARDRAILS:
1. If a student mentions self-harm, abuse, or danger: Express care, recommend they tell a trusted adult immediately
2. Never discuss explicit, violent, illegal, or age-inappropriate content
3. If asked about topics outside education scope, redirect warmly
4. Never share personal opinions on politics or religion — present multiple perspectives
5. Never pretend to be human
6. If unsure about accuracy, say so: "I think that's right, but double-check with your teacher"

REASONING & PROBLEM-SOLVING TOOLS:
- Step-by-step breakdown for math/science
- Compare and contrast for analysis
- Timeline sequencing for history
- Mind mapping for brainstorming
- Pro/con lists for decision-making
- "What would happen if..." for critical thinking

${subject ? `CURRENT SUBJECT: ${subject}` : ""}
${lessonContext ? `LESSON CONTEXT: ${lessonContext}` : ""}
${langInstruction}

Remember: You're not just answering questions — you're building a relationship. Every interaction should leave the student feeling more confident, more curious, and more capable.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const msgs: Array<{role: "system" | "user" | "assistant"; content: string}> = [
        { role: "system", content: systemPrompt },
      ];

      if (conversationHistory && Array.isArray(conversationHistory)) {
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            msgs.push({ role: msg.role, content: msg.content });
          }
        }
      }

      msgs.push({ role: "user", content: message });

      await streamAIResponse({
        messages: msgs,
        maxTokens: 1000,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in AI chat endpoint:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/sparky/chat", requireAuth, async (req, res) => {
    const { message, conversationHistory, context, language } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const langInstruction = language === "es"
      ? "\n\nIMPORTANT: The user prefers Spanish. Respond entirely in Spanish."
      : "";

    const systemPrompt = `You are SPARKY — an AI companion for parents, teachers, and staff at the AI Mastery Academy & School Support Hub.

CORE IDENTITY:
You are a warm, knowledgeable, and practical AI partner for the adults who support our students. You bring together expertise in education, child development, family dynamics, and community building. You are empathetic but also direct — adults appreciate honesty delivered with compassion.

YOUR NAME: Sparky (you're Spark's "grown-up sibling")

PERSONALITY:
- Professional but warm — like a trusted colleague over coffee
- Direct and practical — adults want actionable advice, not fluff
- Culturally aware and equity-minded
- Comfortable with complexity and nuance
- Honest about limitations: "I'm not a licensed therapist, but here's what research suggests..."
- Collaborative: "Let's think through this together"

FOR PARENTS & GUARDIANS:
- Help them understand their child's academic progress and what it means
- Explain educational concepts in plain language — not educator jargon
- Provide practical strategies for supporting learning at home
- Address common parenting challenges with empathy: homework battles, screen time, motivation
- Help them understand the Academy's features and how to use them
- If they're worried about their child: validate the concern, suggest concrete next steps
- Navigate cultural and socioeconomic contexts with sensitivity
- Help with Thrive score interpretation — what the domains mean, what to watch for
- If a child is flagged in the Early Warning System: explain what the flag means, what the school is doing, and how they can help at home

FOR TEACHERS & STAFF:
- Help with lesson planning, differentiation strategies, and classroom management
- Provide evidence-based teaching strategies
- Help interpret student data (Thrive scores, Panther Power, progress reports)
- Support IEP/504 accommodations and inclusive practices
- Discuss challenging student situations with nuance
- Help with parent communication strategies
- Provide social-emotional learning integration ideas
- Support trauma-informed teaching practices

EMOTIONAL SUPPORT (NON-THERAPEUTIC):
- Acknowledge that teaching and parenting are hard. Really hard.
- Validate burnout, frustration, and compassion fatigue without judgment
- Provide practical self-care strategies rooted in evidence
- Know when to recommend professional support
- Normalize seeking help

BOUNDARIES:
- Never diagnose learning disabilities, mental health conditions, or behavioral disorders
- Never provide medical or legal advice — recommend professionals
- Never share student data or break confidentiality expectations
- Present multiple approaches when evidence is mixed
- If asked about something outside your expertise: "That's beyond what I can speak to confidently. I'd recommend..."

${context ? `CONTEXT: ${context}` : ""}
${langInstruction}

Remember: The adults you support are the most important people in students' lives. By helping them, you're helping every student they touch.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const msgs: Array<{role: "system" | "user" | "assistant"; content: string}> = [
        { role: "system", content: systemPrompt },
      ];

      if (conversationHistory && Array.isArray(conversationHistory)) {
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
          if (msg.role === "user" || msg.role === "assistant") {
            msgs.push({ role: msg.role, content: msg.content });
          }
        }
      }

      msgs.push({ role: "user", content: message });

      await streamAIResponse({
        messages: msgs,
        maxTokens: 1500,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in Sparky chat:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.end();
    }
  });

  app.post("/api/classroom-wizard/suggest", requireAuth, async (req, res) => {
    const { name, gradeBand, subjectFocus } = req.body;
    if (!name || !gradeBand) return res.status(400).json({ error: "Name and grade band are required" });

    const subjectContext = subjectFocus && subjectFocus !== "all" ? `with a focus on ${subjectFocus}` : "covering all subjects (ELA, Math, Science, Social Studies, Social-Emotional Learning, Wellness)";

    const systemPrompt = `You are an expert K-12 curriculum designer creating classroom setup suggestions. Generate content for a classroom called "${name}" for grades ${gradeBand} ${subjectContext}.

Your response MUST use exactly these section headers with ## prefix:

## Description
Write a 2-3 sentence classroom description that is warm, inviting, and age-appropriate for grades ${gradeBand}.

## Learning Objectives
List 4-5 specific, measurable learning objectives appropriate for grades ${gradeBand}. One per line, starting with a dash.

## Activities
List 4-5 engaging classroom activities appropriate for grades ${gradeBand}. One per line, starting with a dash. Include a mix of individual and collaborative activities.

## Welcome Message
Write a warm, encouraging welcome message for students joining this classroom. Make it age-appropriate for grades ${gradeBand}. 2-3 sentences.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      await streamAIResponse({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate classroom setup suggestions for "${name}" (Grades ${gradeBand})${subjectFocus && subjectFocus !== "all" ? ` focusing on ${subjectFocus}` : ""}.` },
        ],
        maxTokens: 2000,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate suggestions" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in classroom wizard:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate suggestions" })}\n\n`);
      res.end();
    }
  });

  app.get("/api/curriculum-documents", async (_req, res) => {
    const docs = await storage.getCurriculumDocuments();
    res.json(docs);
  });

  app.get("/api/curriculum-documents/module/:moduleId", async (req, res) => {
    const docs = await storage.getCurriculumDocumentsByModule(req.params.moduleId);
    res.json(docs);
  });

  app.get("/api/curriculum-documents/level/:levelId", async (req, res) => {
    const levelId = parseInt(req.params.levelId);
    if (isNaN(levelId)) return res.status(400).json({ error: "Invalid level ID" });
    const docs = await storage.getCurriculumDocumentsByLevel(levelId);
    res.json(docs);
  });

  app.get("/api/curriculum-documents/:id", async (req, res) => {
    const doc = await storage.getCurriculumDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(doc);
  });

  app.post("/api/curriculum-documents", requireAuth, async (req, res) => {
    const parsed = insertCurriculumDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid document data", details: parsed.error.flatten() });
    }
    try {
      const doc = await storage.createCurriculumDocument(parsed.data);
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.patch("/api/curriculum-documents/:id", requireAuth, async (req, res) => {
    const existing = await storage.getCurriculumDocument(req.params.id);
    if (!existing) return res.status(404).json({ error: "Document not found" });
    const partial = insertCurriculumDocumentSchema.partial().safeParse(req.body);
    if (!partial.success) {
      return res.status(400).json({ error: "Invalid update data", details: partial.error.flatten() });
    }
    try {
      const doc = await storage.updateCurriculumDocument(req.params.id, partial.data);
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/curriculum-documents/:id", requireAuth, async (req, res) => {
    const existing = await storage.getCurriculumDocument(req.params.id);
    if (!existing) return res.status(404).json({ error: "Document not found" });
    await storage.deleteCurriculumDocument(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/curriculum-documents/:docId/attachments", async (req, res) => {
    const attachments = await storage.getAttachmentsByDocument(req.params.docId as string);
    res.json(attachments);
  });

  app.post("/api/curriculum-documents/:docId/attachments", requireAuth, async (req, res) => {
    const { fileName, fileSize, contentType, objectPath } = req.body;
    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      return res.status(400).json({ error: "fileName is required" });
    }
    if (!objectPath || typeof objectPath !== 'string') {
      return res.status(400).json({ error: "objectPath is required" });
    }
    if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize < 0)) {
      return res.status(400).json({ error: "fileSize must be a non-negative number" });
    }
    const allowedMimeTypes = [
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png", "image/jpeg", "image/gif", "image/webp", "text/plain", "text/csv",
      "application/octet-stream", "video/mp4", "audio/mpeg",
    ];
    const resolvedContentType = contentType || "application/octet-stream";
    if (!allowedMimeTypes.includes(resolvedContentType)) {
      return res.status(400).json({ error: "Unsupported content type" });
    }
    const attachment = await storage.addAttachment({
      documentId: req.params.docId as string,
      fileName: fileName.trim(),
      fileSize: fileSize || 0,
      contentType: resolvedContentType,
      objectPath,
      uploadedBy: getUserId(req) || null,
    });
    res.status(201).json(attachment);
  });

  app.delete("/api/curriculum-documents/:docId/attachments/:attachmentId", requireAuth, async (req, res) => {
    await storage.deleteAttachment(req.params.attachmentId as string);
    res.json({ success: true });
  });

  app.get("/api/lessons/:lessonId/comments", async (req, res) => {
    const comments = await storage.getCommentsByLesson(req.params.lessonId);
    res.json(comments);
  });

  app.post("/api/lessons/:lessonId/comments", requireAuth, async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }
    const userId = getUserId(req);
    const userName = getUserName(req) || "Anonymous";
    const comment = await storage.addComment(req.params.lessonId, userId, userName, content.trim());
    res.status(201).json(comment);
  });

  app.get("/api/lessons/:lessonId/reactions", async (req, res) => {
    const reactions = await storage.getReactionsByLesson(req.params.lessonId);
    res.json(reactions);
  });

  app.post("/api/lessons/:lessonId/reactions", requireAuth, async (req, res) => {
    const { reactionType } = req.body;
    const validTypes = ["helpful", "inspiring", "challenging", "fun"];
    if (!reactionType || !validTypes.includes(reactionType)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }
    const userId = getUserId(req);
    await storage.addReaction(req.params.lessonId, userId, reactionType);
    const reactions = await storage.getReactionsByLesson(req.params.lessonId);
    res.json(reactions);
  });

  app.get("/api/modules/:moduleId/tips", async (req, res) => {
    const tips = await storage.getStudyTipsByModule(req.params.moduleId);
    res.json(tips);
  });

  app.post("/api/modules/:moduleId/tips", requireAuth, async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }
    const userId = getUserId(req);
    const userName = getUserName(req) || "Anonymous";
    const tip = await storage.addStudyTip(req.params.moduleId, userId, userName, content.trim());
    res.status(201).json(tip);
  });

  app.post("/api/tips/:tipId/upvote", requireAuth, async (req, res) => {
    try {
      const tip = await storage.upvoteStudyTip(req.params.tipId);
      res.json(tip);
    } catch {
      res.status(404).json({ error: "Tip not found" });
    }
  });

  app.post("/api/classrooms", requireAuth, async (req, res) => {
    const { name, gradeBand } = req.body;
    if (!name || !gradeBand) return res.status(400).json({ error: "Name and grade band are required" });
    const classroom = await storage.createClassroom(getUserId(req)!, getUserName(req) || "Teacher", name, gradeBand);
    res.status(201).json(classroom);
  });

  app.get("/api/classrooms", requireAuth, async (req, res) => {
    const teacherClassrooms = await storage.getClassroomsByTeacher(getUserId(req)!);
    const studentClassrooms = await storage.getStudentClassrooms(getUserId(req)!);
    const teacherWithCounts = [];
    for (const c of teacherClassrooms) {
      const members = await storage.getClassroomMembers(c.id);
      teacherWithCounts.push({ ...c, studentCount: members.length });
    }
    res.json({ teacherClassrooms: teacherWithCounts, studentClassrooms });
  });

  app.post("/api/classrooms/join", requireAuth, async (req, res) => {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ error: "Invite code is required" });
    const classroom = await storage.getClassroomByInviteCode(inviteCode.toUpperCase());
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });
    if (classroom.teacherUserId === getUserId(req)) return res.status(400).json({ error: "You cannot join your own classroom" });
    const member = await storage.joinClassroom(classroom.id, getUserId(req)!, getUserName(req) || "Student");
    res.json({ classroom, member });
  });

  app.get("/api/classrooms/:classroomId", requireAuth, async (req, res) => {
    const classroom = await storage.getClassroom(req.params.classroomId);
    if (!classroom) return res.status(404).json({ error: "Classroom not found" });
    if (classroom.teacherUserId !== getUserId(req)) return res.status(403).json({ error: "Not authorized" });
    const members = await storage.getClassroomMembers(req.params.classroomId);

    const memberDetails = [];
    for (const member of members) {
      const progress = await storage.getProgressByUserId(member.userId);
      const earnedBadgesList = progress ? await storage.getEarnedBadges(progress.id) : [];
      memberDetails.push({
        id: member.id,
        classroomId: member.classroomId,
        userId: member.userId,
        studentName: member.studentName,
        joinedAt: member.joinedAt,
        lessonsCompleted: progress?.lessonsCompleted || 0,
        quizzesCompleted: progress?.quizzesCompleted || 0,
        averageScore: progress?.averageScore || 0,
        totalPoints: progress?.totalPoints || 0,
        badgesEarned: earnedBadgesList.length,
      });
    }

    const withProgress = memberDetails.filter(m => m.lessonsCompleted > 0 || m.quizzesCompleted > 0);
    const avgScore = withProgress.length > 0
      ? Math.round(memberDetails.reduce((sum, m) => sum + m.averageScore, 0) / memberDetails.length)
      : 0;
    const avgLessons = memberDetails.length > 0
      ? Math.round(memberDetails.reduce((sum, m) => sum + m.lessonsCompleted, 0) / memberDetails.length)
      : 0;

    res.json({
      classroom,
      members: memberDetails,
      stats: {
        studentCount: members.length,
        averageScore: avgScore,
        averageLessonsCompleted: avgLessons,
      },
    });
  });

  app.get("/api/teacher/dashboard", requireAuth, async (req, res) => {
    const teacherClassrooms = await storage.getClassroomsByTeacher(getUserId(req)!);

    const classroomSummaries = [];
    for (const classroom of teacherClassrooms) {
      const members = await storage.getClassroomMembers(classroom.id);
      let totalScore = 0;
      let totalLessons = 0;
      let totalQuizzes = 0;
      let totalPoints = 0;
      let progressCount = 0;

      for (const member of members) {
        const progress = await storage.getProgressByUserId(member.userId);
        if (progress) {
          totalScore += progress.averageScore;
          totalLessons += progress.lessonsCompleted;
          totalQuizzes += progress.quizzesCompleted;
          totalPoints += progress.totalPoints;
          progressCount++;
        }
      }

      classroomSummaries.push({
        ...classroom,
        studentCount: members.length,
        averageScore: progressCount > 0 ? Math.round(totalScore / progressCount) : 0,
        totalLessonsCompleted: totalLessons,
        totalQuizzesCompleted: totalQuizzes,
        averagePoints: progressCount > 0 ? Math.round(totalPoints / progressCount) : 0,
      });
    }

    res.json({ classrooms: classroomSummaries });
  });

  app.get("/api/certificates", requireAuth, async (req, res) => {
    const certs = await storage.getCertificatesByUser(getUserId(req)!);
    res.json(certs);
  });

  app.get("/api/certificates/:id", async (req, res) => {
    const cert = await storage.getCertificate(req.params.id);
    if (!cert) return res.status(404).json({ error: "Certificate not found" });
    res.json(cert);
  });

  // ==================== ACADEMY ROUTES ====================

  app.get("/api/academy/dashboard", async (req, res) => {
    try {
      const houses = await storage.getAcademyHouses();
      const competitions = await storage.getAllCompetitions();
      const recentMerit = await storage.getAllMeritEvents();
      const userId = getUserId(req);
      let wallet = null;
      let pantherPower = null;
      let dailyQuests: any[] = [];
      if (userId) {
        wallet = await storage.getOrCreateWallet(userId);
        pantherPower = await storage.getOrCreatePantherPower(userId);
        const today = new Date().toISOString().split("T")[0];
        dailyQuests = await storage.getDailyQuests(userId, today);
      }
      res.json({ houses, wallet, recentMeritEvents: recentMerit.slice(0, 10), competitions, pantherPower, dailyQuests });
    } catch (error) {
      res.status(500).json({ error: "Failed to load academy dashboard" });
    }
  });

  app.get("/api/academy/avatars", async (_req, res) => {
    const avatars = await storage.getAllAcademyAvatars();
    res.json(avatars);
  });

  app.get("/api/academy/avatar", requireAuth, async (req, res) => {
    const avatar = await storage.getAcademyAvatar(getUserId(req)!);
    if (!avatar) return res.status(404).json({ error: "Avatar not found" });
    res.json(avatar);
  });

  app.post("/api/academy/avatar", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const existing = await storage.getAcademyAvatar(userId);
      if (existing) {
        const { displayName, role, skinTone, hairStyle, hairColor, outfit, outfitColor, accessory, background, bio } = req.body;
        const updated = await storage.updateAcademyAvatar(existing.id, { displayName, role, skinTone, hairStyle, hairColor, outfit, outfitColor, accessory, background, bio });
        return res.json(updated);
      }
      const { displayName, role, skinTone, hairStyle, hairColor, outfit, outfitColor, accessory, background, bio } = req.body;
      const avatar = await storage.createAcademyAvatar({ displayName, role, skinTone, hairStyle, hairColor, outfit, outfitColor, accessory, background, bio, userId });
      res.status(201).json(avatar);
    } catch (error) {
      res.status(500).json({ error: "Failed to save avatar" });
    }
  });

  app.get("/api/academy/houses", async (_req, res) => {
    const houses = await storage.getAcademyHouses();
    res.json(houses);
  });

  app.post("/api/academy/merit", requireAuth, async (req, res) => {
    try {
      const { userId, houseId, points, reason, category } = req.body;
      if (!userId || !points || !reason) {
        return res.status(400).json({ error: "userId, points, and reason are required" });
      }
      const event = await storage.createMeritEvent({
        userId,
        houseId: houseId || null,
        points,
        reason,
        category: category || "academic",
        awardedBy: getUserId(req) || null,
        awardedByName: getUserName(req) || null,
      });
      if (houseId) {
        await storage.updateHousePoints(houseId, points);
      }
      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          leadershipScore: power.leadershipScore + 3,
        });
      } catch (e) { /* ignore */ }
      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to award merit points" });
    }
  });

  app.get("/api/academy/merit/user/:userId", requireAuth, async (req, res) => {
    const events = await storage.getMeritEventsByUser(req.params.userId);
    res.json(events);
  });

  app.get("/api/academy/merit/house/:houseId", async (req, res) => {
    const events = await storage.getMeritEventsByHouse(req.params.houseId);
    res.json(events);
  });

  app.get("/api/academy/wallet", requireAuth, async (req, res) => {
    const wallet = await storage.getOrCreateWallet(getUserId(req)!);
    res.json(wallet);
  });

  app.get("/api/academy/transactions", requireAuth, async (req, res) => {
    const wallet = await storage.getOrCreateWallet(getUserId(req)!);
    const transactions = await storage.getTransactionsByWallet(wallet.id);
    res.json(transactions);
  });

  app.post("/api/academy/transactions", requireAuth, async (req, res) => {
    try {
      const wallet = await storage.getOrCreateWallet(getUserId(req)!);
      const { type, amount, description, category } = req.body;
      if (!type || !amount || !description) {
        return res.status(400).json({ error: "type, amount, and description are required" });
      }
      const transaction = await storage.createTransaction({
        walletId: wallet.id,
        type,
        amount,
        description,
        category: category || "general",
      });
      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/academy/stocks", async (_req, res) => {
    const stocks = await storage.getAllStocks();
    res.json(stocks);
  });

  app.post("/api/academy/stocks/trade", requireAuth, async (req, res) => {
    try {
      const { stockId, action, shares } = req.body;
      if (!stockId || !action || !shares || shares <= 0) {
        return res.status(400).json({ error: "stockId, action (buy/sell), and shares (> 0) are required" });
      }
      const stock = await storage.getStock(stockId);
      if (!stock) return res.status(404).json({ error: "Stock not found" });

      const userId = getUserId(req)!;
      const wallet = await storage.getOrCreateWallet(userId);
      const price = parseFloat(stock.currentPrice);
      const totalCost = price * shares;

      if (action === "buy") {
        if (parseFloat(wallet.balance) < totalCost) {
          return res.status(400).json({ error: "Insufficient funds" });
        }
        const newBalance = (parseFloat(wallet.balance) - totalCost).toFixed(2);
        const newInvested = (parseFloat(wallet.totalInvested) + totalCost).toFixed(2);
        await storage.updateWalletBalance(wallet.id, { balance: newBalance, totalInvested: newInvested });

        const existingPortfolio = (await storage.getPortfolioByUser(userId)).find(p => p.stockId === stockId);
        const existingShares = existingPortfolio ? existingPortfolio.shares : 0;
        const existingAvg = existingPortfolio ? parseFloat(existingPortfolio.avgBuyPrice) : 0;
        const newTotalShares = existingShares + shares;
        const newAvgPrice = ((existingAvg * existingShares + price * shares) / newTotalShares).toFixed(2);
        await storage.createOrUpdatePortfolio(userId, stockId, newTotalShares, newAvgPrice);

        await storage.createTransaction({
          walletId: wallet.id,
          type: "stock_buy",
          amount: (-totalCost).toFixed(2),
          description: `Bought ${shares} shares of ${stock.symbol} at $${price}`,
          category: "investment",
        });

        try {
          const power = await storage.getOrCreatePantherPower(getUserId(req)!);
          await storage.updatePantherPower(getUserId(req)!, {
            entrepreneurshipScore: power.entrepreneurshipScore + 5,
          });
        } catch (e) { /* ignore power update errors */ }

        res.json({ success: true, action: "buy", shares, totalCost, newBalance });
      } else if (action === "sell") {
        const portfolio = (await storage.getPortfolioByUser(userId)).find(p => p.stockId === stockId);
        if (!portfolio || portfolio.shares < shares) {
          return res.status(400).json({ error: "Insufficient shares" });
        }
        const newBalance = (parseFloat(wallet.balance) + totalCost).toFixed(2);
        await storage.updateWalletBalance(wallet.id, { balance: newBalance });

        const remainingShares = portfolio.shares - shares;
        await storage.createOrUpdatePortfolio(userId, stockId, remainingShares, portfolio.avgBuyPrice);

        await storage.createTransaction({
          walletId: wallet.id,
          type: "stock_sell",
          amount: totalCost.toFixed(2),
          description: `Sold ${shares} shares of ${stock.symbol} at $${price}`,
          category: "investment",
        });

        try {
          const power = await storage.getOrCreatePantherPower(getUserId(req)!);
          await storage.updatePantherPower(getUserId(req)!, {
            entrepreneurshipScore: power.entrepreneurshipScore + 5,
          });
        } catch (e) { /* ignore power update errors */ }

        res.json({ success: true, action: "sell", shares, totalRevenue: totalCost, newBalance });
      } else {
        res.status(400).json({ error: "Action must be 'buy' or 'sell'" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  app.get("/api/academy/portfolio", requireAuth, async (req, res) => {
    const portfolio = await storage.getPortfolioByUser(getUserId(req)!);
    res.json(portfolio);
  });

  app.get("/api/academy/community-portfolio", async (_req, res) => {
    const portfolio = await storage.getCommunityPortfolio();
    res.json(portfolio);
  });

  app.post("/api/academy/stocks/simulate", requireAdmin, async (_req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      const updated = [];
      for (const stock of stocks) {
        const changePercent = (Math.random() * 10 - 5);
        const prevPrice = parseFloat(stock.currentPrice);
        const newPrice = Math.max(1, prevPrice * (1 + changePercent / 100));
        const history = Array.isArray(stock.priceHistory) ? [...(stock.priceHistory as number[])] : [];
        history.push(prevPrice);
        if (history.length > 30) history.splice(0, history.length - 30);
        const updatedStock = await storage.updateStock(stock.id, {
          previousPrice: stock.currentPrice,
          currentPrice: newPrice.toFixed(2),
          changePercent: changePercent.toFixed(2),
          priceHistory: history,
        });
        updated.push(updatedStock);
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate stock prices" });
    }
  });

  app.get("/api/academy/campus", requireAuth, async (req, res) => {
    const project = await storage.getCampusProject(getUserId(req)!);
    if (!project) return res.status(404).json({ error: "No campus project found" });
    res.json(project);
  });

  app.post("/api/academy/campus", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const existing = await storage.getCampusProject(userId);
      if (existing) {
        const { projectName, buildings, totalFunded, totalCost, theme } = req.body;
        const updated = await storage.updateCampusProject(existing.id, { projectName, buildings, totalFunded, totalCost, theme });
        return res.json(updated);
      }
      const { projectName, buildings, totalFunded, totalCost, theme } = req.body;
      const project = await storage.createCampusProject({ projectName, buildings, totalFunded, totalCost, theme, userId });
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to save campus project" });
    }
  });

  app.post("/api/academy/campus/fund", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }
      const userId = getUserId(req)!;
      const wallet = await storage.getOrCreateWallet(userId);
      const fundAmount = parseFloat(amount);
      if (parseFloat(wallet.balance) < fundAmount) {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      const project = await storage.getCampusProject(userId);
      if (!project) return res.status(404).json({ error: "No campus project found" });

      const newBalance = (parseFloat(wallet.balance) - fundAmount).toFixed(2);
      const newCampusContributed = (parseFloat(wallet.campusContributed) + fundAmount).toFixed(2);
      await storage.updateWalletBalance(wallet.id, { balance: newBalance, campusContributed: newCampusContributed });

      const newAmountFunded = (parseFloat(project.amountFunded) + fundAmount).toFixed(2);
      const updated = await storage.updateCampusProject(project.id, { amountFunded: newAmountFunded });

      await storage.createTransaction({
        walletId: wallet.id,
        type: "campus_fund",
        amount: (-fundAmount).toFixed(2),
        description: `Funded campus project: ${project.projectName}`,
        category: "campus",
      });

      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          communityScore: power.communityScore + 10,
        });
      } catch (e) { /* ignore */ }

      res.json({ success: true, project: updated, newBalance });
    } catch (error) {
      res.status(500).json({ error: "Failed to fund campus project" });
    }
  });

  app.get("/api/academy/competitions", async (_req, res) => {
    const competitions = await storage.getAllCompetitions();
    res.json(competitions);
  });

  app.post("/api/academy/competitions", requireAuth, async (req, res) => {
    try {
      const comp = await storage.createCompetition(req.body);
      res.status(201).json(comp);
    } catch (error) {
      res.status(500).json({ error: "Failed to create competition" });
    }
  });

  app.get("/api/academy/competitions/:id/entries", async (req, res) => {
    const entries = await storage.getCompetitionEntries(req.params.id);
    res.json(entries);
  });

  app.post("/api/academy/competitions/:id/enter", requireAuth, async (req, res) => {
    try {
      const comp = await storage.getCompetition(req.params.id);
      if (!comp) return res.status(404).json({ error: "Competition not found" });
      const { score } = req.body;
      const entry = await storage.createCompetitionEntry({
        competitionId: req.params.id,
        userId: getUserId(req)!,
        userName: getUserName(req) || "Student",
        score,
      });
      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          educationScore: power.educationScore + 5,
        });
      } catch (e) { /* ignore */ }
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to enter competition" });
    }
  });

  app.post("/api/academy/competitions/:id/score", requireAuth, async (req, res) => {
    try {
      const { entryId, score, placement } = req.body;
      if (!entryId) return res.status(400).json({ error: "entryId is required" });
      const updated = await storage.updateCompetitionEntry(entryId, {
        score,
        placement,
        completedAt: new Date(),
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  app.get("/api/academy/dream-profile", requireAuth, async (req, res) => {
    const profile = await storage.getDreamProfile(getUserId(req)!);
    if (!profile) return res.status(404).json({ error: "Dream profile not found" });
    res.json(profile);
  });

  app.post("/api/academy/dream-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.createOrUpdateDreamProfile(getUserId(req)!, req.body);
      try {
        const power = await storage.getOrCreatePantherPower(getUserId(req)!);
        await storage.updatePantherPower(getUserId(req)!, {
          characterScore: power.characterScore + 5,
        });
      } catch (e) { /* ignore */ }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to save dream profile" });
    }
  });

  app.get("/api/academy/merch", async (_req, res) => {
    const items = await storage.getAllMerchItems();
    res.json(items);
  });

  app.post("/api/academy/merch", requireAuth, async (req, res) => {
    try {
      const item = await storage.createMerchItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create merch item" });
    }
  });

  app.get("/api/academy/merch/orders", requireAuth, async (req, res) => {
    const orders = await storage.getMerchOrders(getUserId(req)!);
    res.json(orders);
  });

  app.post("/api/academy/merch/orders", requireAuth, async (req, res) => {
    try {
      const { itemId, quantity, totalPrice } = req.body;
      const order = await storage.createMerchOrder({
        itemId, quantity, totalPrice,
        userId: getUserId(req)!,
        userName: getUserName(req) || "Student",
      });
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ==================== PANTHER POWER ====================
  app.get("/api/academy/panther-power", requireAuth, async (req, res) => {
    try {
      const power = await storage.getOrCreatePantherPower(getUserId(req)!);
      res.json(power);
    } catch (error) {
      res.status(500).json({ error: "Failed to get panther power" });
    }
  });

  app.post("/api/academy/panther-power", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updatePantherPower(getUserId(req)!, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update panther power" });
    }
  });

  // ==================== DAILY QUESTS ====================
  app.get("/api/academy/quests", requireAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      let quests = await storage.getDailyQuests(getUserId(req)!, today);
      if (quests.length === 0) {
        const questTemplates = [
          { title: "Market Watch", description: "Check the stock market and review at least 3 stock prices", category: "entrepreneurship", featureLink: "/academy/stocks", rewardPoints: 15 },
          { title: "Community Builder", description: "Award merit points to a fellow Panther for something great they did", category: "character", featureLink: "/academy/houses", rewardPoints: 10 },
          { title: "Dream Architect", description: "Update your Dream Design with a new goal or reflection", category: "leadership", featureLink: "/academy/dreams", rewardPoints: 20 },
          { title: "Campus Investor", description: "Fund your campus project with earnings from your wallet", category: "community", featureLink: "/academy/campus", rewardPoints: 25 },
          { title: "Style Statement", description: "Update your avatar to express your personality today", category: "education", featureLink: "/academy/avatar", rewardPoints: 10 },
        ];
        const todayQuests = questTemplates.sort(() => Math.random() - 0.5).slice(0, 3);
        for (const q of todayQuests) {
          await storage.createDailyQuest({ userId: getUserId(req)!, questDate: today, title: q.title, description: q.description, category: q.category, featureLink: q.featureLink, rewardPoints: q.rewardPoints, rewardType: "power", completed: false });
        }
        quests = await storage.getDailyQuests(getUserId(req)!, today);
      }
      res.json(quests);
    } catch (error) {
      res.status(500).json({ error: "Failed to get daily quests" });
    }
  });

  app.post("/api/academy/quests/:id/complete", requireAuth, async (req, res) => {
    try {
      const quest = await storage.completeDailyQuest(req.params.id);
      const power = await storage.getOrCreatePantherPower(getUserId(req)!);
      const categoryMap: Record<string, string> = {
        education: "educationScore",
        character: "characterScore",
        leadership: "leadershipScore",
        entrepreneurship: "entrepreneurshipScore",
        community: "communityScore",
      };
      const field = categoryMap[quest.category] || "educationScore";
      const updateData: Record<string, number> = {};
      updateData[field] = (power as any)[field] + quest.rewardPoints;
      await storage.updatePantherPower(getUserId(req)!, updateData as any);
      res.json(quest);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete quest" });
    }
  });

  // ==================== LIFE LESSONS ====================
  app.get("/api/academy/life-lessons", async (_req, res) => {
    try {
      const lessons = await storage.getAllLifeLessons();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to get life lessons" });
    }
  });

  app.get("/api/academy/life-lessons/:feature", async (req, res) => {
    try {
      const lessons = await storage.getLifeLessonsByFeature(req.params.feature);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to get life lessons" });
    }
  });

  // ==================== WIZARD PROGRESS ====================
  app.get("/api/academy/wizard/:type", requireAuth, async (req, res) => {
    try {
      const progress = await storage.getWizardProgress(getUserId(req)!, req.params.type);
      res.json(progress || { currentStep: 0, totalSteps: 0, completed: false });
    } catch (error) {
      res.status(500).json({ error: "Failed to get wizard progress" });
    }
  });

  app.post("/api/academy/wizard/:type", requireAuth, async (req, res) => {
    try {
      const { currentStep, totalSteps } = req.body;
      const progress = await storage.createOrUpdateWizardProgress(getUserId(req)!, req.params.type, currentStep, totalSteps);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update wizard progress" });
    }
  });

  app.post("/api/academy/wizard/:type/complete", requireAuth, async (req, res) => {
    try {
      const progress = await storage.completeWizard(getUserId(req)!, req.params.type);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete wizard" });
    }
  });

  // ==================== CYOA SCENARIOS ====================

  app.get("/api/academy/scenarios", async (_req, res) => {
    try {
      const scenarios = await storage.getAllScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ error: "Failed to load scenarios" });
    }
  });

  app.get("/api/academy/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      const nodes = await storage.getScenarioNodes(req.params.id);
      res.json({ ...scenario, nodes });
    } catch (error) {
      res.status(500).json({ error: "Failed to load scenario" });
    }
  });

  app.post("/api/academy/scenarios/:id/start", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) return res.status(404).json({ error: "Scenario not found" });
      const run = await storage.createScenarioRun({
        userId,
        scenarioId: req.params.id,
        currentNodeKey: "start",
        status: "in_progress",
        totalChoicesMade: 0,
      });
      await storage.createActivityFeedItem({
        userId,
        userName: getUserName(req) || "Student",
        activityType: "scenario_start",
        title: `Started: ${scenario.title}`,
        description: `Began the "${scenario.title}" adventure`,
        metadata: { scenarioId: scenario.id, theme: scenario.theme },
        powerCategory: scenario.rewardCategory,
        pointsEarned: 0,
      });
      res.status(201).json(run);
    } catch (error) {
      res.status(500).json({ error: "Failed to start scenario" });
    }
  });

  app.post("/api/academy/scenarios/runs/:runId/choose", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const { choiceKey, choiceLabel, nodeKey } = req.body;
      const run = await storage.getScenarioRun(req.params.runId);
      if (!run || run.userId !== userId) return res.status(404).json({ error: "Run not found" });
      
      const currentNode = await storage.getScenarioNode(run.scenarioId, nodeKey);
      if (!currentNode) return res.status(404).json({ error: "Node not found" });
      
      const choices = (currentNode.choices as any[]) || [];
      const selectedChoice = choices.find((c: any) => c.key === choiceKey);
      if (!selectedChoice) return res.status(400).json({ error: "Invalid choice" });
      
      const nextNodeKey = selectedChoice.nextNodeKey;
      const nextNode = await storage.getScenarioNode(run.scenarioId, nextNodeKey);
      
      await storage.createChoiceLog({
        runId: run.id,
        userId,
        nodeKey,
        choiceKey,
        choiceLabel,
        consequence: selectedChoice.consequence || {},
      });
      
      const walletImpact = nextNode ? parseFloat(String(nextNode.walletImpact || "0")) : 0;
      const powerImpact = nextNode ? (nextNode.powerImpact || 0) : 0;
      
      if (walletImpact !== 0) {
        try {
          const wallet = await storage.getOrCreateWallet(userId);
          const newBalance = parseFloat(String(wallet.balance)) + walletImpact;
          await storage.updateWalletBalance(wallet.id, { balance: String(Math.max(0, newBalance)) });
        } catch (e) {
          console.error("Failed to update wallet from adventure:", e);
        }
      }
      
      const meritImpact = nextNode ? (nextNode.meritImpact || 0) : 0;
      if (meritImpact > 0) {
        try {
          const avatar = await storage.getAcademyAvatar(userId);
          if (avatar?.houseId) {
            await storage.createMeritEvent({
              userId,
              houseId: avatar.houseId,
              points: meritImpact,
              reason: "Adventure choice reward",
              category: "adventure",
              awardedBy: "system",
              awardedByName: "Adventure System",
            });
            await storage.updateHousePoints(avatar.houseId, meritImpact);
          }
        } catch (e) {
          console.error("Failed to award merit from adventure:", e);
        }
      }
      
      const isEnd = nextNode?.isEnd ?? false;
      const updatedRun = await storage.updateScenarioRun(run.id, {
        currentNodeKey: nextNodeKey,
        totalChoicesMade: (run.totalChoicesMade || 0) + 1,
        totalWalletImpact: String(parseFloat(String(run.totalWalletImpact || "0")) + walletImpact),
        totalPowerEarned: (run.totalPowerEarned || 0) + powerImpact,
        status: isEnd ? "completed" : "in_progress",
        completedAt: isEnd ? new Date() : undefined,
      });
      
      if (isEnd && powerImpact > 0) {
        try {
          const scenario = await storage.getScenario(run.scenarioId);
          const category = scenario?.rewardCategory || "education";
          const power = await storage.getOrCreatePantherPower(userId);
          const categoryKey = `${category}Score` as any;
          await storage.updatePantherPower(userId, { [categoryKey]: (power as any)[categoryKey] + powerImpact });
        } catch (e) {
          console.error("Failed to update panther power from adventure:", e);
        }
      }
      
      if (isEnd) {
        await storage.createActivityFeedItem({
          userId,
          userName: getUserName(req) || "Student",
          activityType: "scenario_complete",
          title: "Completed an Adventure",
          description: `Finished with ${(run.totalChoicesMade || 0) + 1} choices made`,
          metadata: { scenarioId: run.scenarioId, runId: run.id },
          powerCategory: null,
          pointsEarned: powerImpact,
        });
      }
      
      res.json({ run: updatedRun, nextNode, isEnd });
    } catch (error) {
      res.status(500).json({ error: "Failed to process choice" });
    }
  });

  app.get("/api/academy/scenarios/runs/mine", requireAuth, async (req, res) => {
    try {
      const runs = await storage.getScenarioRunsByUser(getUserId(req)!);
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to load runs" });
    }
  });

  app.get("/api/academy/scenarios/runs/:runId", requireAuth, async (req, res) => {
    try {
      const run = await storage.getScenarioRun(req.params.runId);
      if (!run) return res.status(404).json({ error: "Run not found" });
      const logs = await storage.getChoiceLogsByRun(run.id);
      res.json({ ...run, choiceLogs: logs });
    } catch (error) {
      res.status(500).json({ error: "Failed to load run" });
    }
  });

  function moderateContent(text: string): { safe: boolean; reason?: string } {
    const normalized = text.toLowerCase().trim();
    
    const blockedPatterns = [
      /\b(damn|hell|crap|stupid|idiot|dumb|shut\s*up|hate\s+you|loser|suck|butt|fart)\b/i,
      /\b(kill|die|dead|murder|fight|punch|hit|hurt|attack|destroy|weapon|gun|knife|blood)\b/i,
      /\b(drugs?|alcohol|beer|wine|smoke|vape|cigarette|weed|marijuana)\b/i,
      /\b(sexy|nude|naked|kiss|dating|boyfriend|girlfriend|crush)\b/i,
      /[!@#$%]{3,}/,
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(normalized)) {
        return { safe: false, reason: "Your listing contains language that isn't appropriate for our learning community. Please use respectful, school-appropriate language and try again." };
      }
    }
    
    if (normalized.length < 3) {
      return { safe: false, reason: "Please provide a more descriptive name or description." };
    }
    
    return { safe: true };
  }

  // ==================== MARKETPLACE ====================

  app.get("/api/academy/marketplace", async (_req, res) => {
    try {
      const listings = await storage.getActiveListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to load marketplace" });
    }
  });

  app.get("/api/academy/marketplace/my-listings", requireAuth, async (req, res) => {
    try {
      const listings = await storage.getListingsByUser(getUserId(req)!);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Failed to load your listings" });
    }
  });

  app.post("/api/academy/marketplace", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const { itemName, description, price, category, quantity } = req.body;
      const nameCheck = moderateContent(itemName || "");
      if (!nameCheck.safe) return res.status(400).json({ error: nameCheck.reason });
      const descCheck = moderateContent(description || "");
      if (!descCheck.safe) return res.status(400).json({ error: descCheck.reason });
      const listing = await storage.createListing({
        itemName, description, price, category, quantity,
        sellerId: userId,
        sellerName: userName,
        status: "active",
      });
      await storage.createActivityFeedItem({
        userId,
        userName,
        activityType: "marketplace_list",
        title: `Listed: ${listing.itemName}`,
        description: `Listed "${listing.itemName}" for $${listing.price}`,
        metadata: { listingId: listing.id, price: listing.price },
        powerCategory: "entrepreneurship",
        pointsEarned: 5,
      });
      try {
        const power = await storage.getOrCreatePantherPower(userId);
        await storage.updatePantherPower(userId, { entrepreneurshipScore: power.entrepreneurshipScore + 5 });
      } catch (e) {
        console.error("Failed to update power score for listing:", e);
      }
      res.status(201).json(listing);
    } catch (error) {
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.post("/api/academy/marketplace/:id/buy", requireAuth, async (req, res) => {
    try {
      const buyerId = getUserId(req)!;
      const buyerName = getUserName(req) || "Student";
      const listing = await storage.getActiveListings().then(ls => ls.find(l => l.id === req.params.id));
      if (!listing) return res.status(404).json({ error: "Listing not found or no longer active" });
      if (listing.sellerId === buyerId) return res.status(400).json({ error: "Cannot buy your own listing" });
      
      const buyerWallet = await storage.getOrCreateWallet(buyerId);
      const price = parseFloat(String(listing.price));
      const buyerBalance = parseFloat(String(buyerWallet.balance));
      if (buyerBalance < price) return res.status(400).json({ error: "Insufficient funds" });
      
      await storage.updateWalletBalance(buyerWallet.id, { balance: String(buyerBalance - price) });
      const buyerTx = await storage.createTransaction({ walletId: buyerWallet.id, type: "purchase", amount: String(-price), description: `Bought "${listing.itemName}" from ${listing.sellerName}`, category: "marketplace" });
      
      const sellerWallet = await storage.getOrCreateWallet(listing.sellerId);
      const sellerBalance = parseFloat(String(sellerWallet.balance));
      await storage.updateWalletBalance(sellerWallet.id, { balance: String(sellerBalance + price) });
      await storage.createTransaction({ walletId: sellerWallet.id, type: "sale", amount: String(price), description: `Sold "${listing.itemName}" to ${buyerName}`, category: "marketplace" });
      
      const newQty = listing.quantity - (req.body.quantity || 1);
      await storage.updateListing(listing.id, { quantity: Math.max(0, newQty), status: newQty <= 0 ? "sold" : "active" });
      
      const trade = await storage.createPeerTrade({
        listingId: listing.id,
        buyerId,
        buyerName,
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        quantity: req.body.quantity || 1,
        totalPrice: String(price),
        status: "completed",
      });
      
      await storage.createActivityFeedItem({
        userId: buyerId,
        userName: buyerName,
        activityType: "marketplace_buy",
        title: `Purchased: ${listing.itemName}`,
        description: `Bought "${listing.itemName}" for $${price}`,
        metadata: { listingId: listing.id, tradeId: trade.id },
        powerCategory: "entrepreneurship",
        pointsEarned: 3,
      });
      
      try {
        const buyerPower = await storage.getOrCreatePantherPower(buyerId);
        await storage.updatePantherPower(buyerId, { entrepreneurshipScore: buyerPower.entrepreneurshipScore + 3 });
        const sellerPower = await storage.getOrCreatePantherPower(listing.sellerId);
        await storage.updatePantherPower(listing.sellerId, { entrepreneurshipScore: sellerPower.entrepreneurshipScore + 5 });
      } catch (e) {
        console.error("Failed to update power scores for marketplace trade:", e);
      }
      
      res.json({ trade, message: "Purchase successful!" });
    } catch (error) {
      res.status(500).json({ error: "Failed to process purchase" });
    }
  });

  app.get("/api/academy/marketplace/trades", requireAuth, async (req, res) => {
    try {
      const trades = await storage.getTradesByUser(getUserId(req)!);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to load trades" });
    }
  });

  // ==================== ACTIVITY FEED ====================

  app.get("/api/academy/activity", async (_req, res) => {
    try {
      const feed = await storage.getActivityFeed(100);
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to load activity feed" });
    }
  });

  app.get("/api/academy/activity/:userId", async (req, res) => {
    try {
      const feed = await storage.getActivityFeedByUser(req.params.userId);
      res.json(feed);
    } catch (error) {
      res.status(500).json({ error: "Failed to load user activity" });
    }
  });

  // ==================== ADMIN DASHBOARD ====================

  app.get("/api/academy/admin/metrics", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [wallets, pantherPowers, scenarioRuns, allListings, trades, allActivity, allMerit, allNotes] = await Promise.all([
        storage.getAllWallets(),
        storage.getAllPantherPower(),
        storage.getAllScenarioRuns(),
        storage.getActiveListings(),
        storage.getAllPeerTrades(),
        storage.getActivityFeed(100),
        storage.getAllMeritEvents(),
        storage.getAllAdminNotes(),
      ]);
      
      const totalStudents = wallets.length;
      const totalWalletValue = wallets.reduce((sum, w) => sum + parseFloat(String(w.balance)), 0);
      const avgWalletBalance = totalStudents > 0 ? totalWalletValue / totalStudents : 0;
      const avgPantherScore = pantherPowers.length > 0 ? pantherPowers.reduce((sum, p) => sum + p.totalScore, 0) / pantherPowers.length : 0;
      const scenarioCompletions = scenarioRuns.filter(r => r.status === "completed").length;
      const tradeCount = trades.length;
      const activeListings = allListings.length;
      const totalMeritEvents = allMerit.length;
      const unresolvedNotes = allNotes.filter(n => !n.isResolved).length;
      
      const topStudents = pantherPowers.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10).map(p => ({
        userId: p.userId,
        totalScore: p.totalScore,
        level: p.level,
        title: p.title,
        education: p.educationScore,
        character: p.characterScore,
        leadership: p.leadershipScore,
        entrepreneurship: p.entrepreneurshipScore,
        community: p.communityScore,
      }));
      
      res.json({
        totalStudents,
        totalWalletValue: totalWalletValue.toFixed(2),
        avgWalletBalance: avgWalletBalance.toFixed(2),
        avgPantherScore: Math.round(avgPantherScore),
        scenarioCompletions,
        tradeCount,
        activeListings,
        totalMeritEvents,
        unresolvedNotes,
        topStudents,
        recentActivity: allActivity.slice(0, 20),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load admin metrics" });
    }
  });

  app.get("/api/academy/admin/students", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [avatars, wallets, powers] = await Promise.all([
        storage.getAllAcademyAvatars(),
        storage.getAllWallets(),
        storage.getAllPantherPower(),
      ]);
      
      const walletMap = new Map(wallets.map(w => [w.userId, w]));
      const powerMap = new Map(powers.map(p => [p.userId, p]));
      
      const students = avatars.map(a => ({
        userId: a.userId,
        displayName: a.displayName,
        role: a.role,
        houseId: a.houseId,
        wallet: walletMap.get(a.userId) || null,
        power: powerMap.get(a.userId) || null,
      }));
      
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to load students" });
    }
  });

  app.get("/api/academy/admin/student/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [avatar, wallet, power, activity, notes, meritEvents] = await Promise.all([
        storage.getAcademyAvatar(userId),
        storage.getOrCreateWallet(userId),
        storage.getOrCreatePantherPower(userId),
        storage.getActivityFeedByUser(userId),
        storage.getAdminNotesByUser(userId),
        storage.getMeritEventsByUser(userId),
      ]);
      
      res.json({ avatar, wallet, power, activity, notes, meritEvents });
    } catch (error) {
      res.status(500).json({ error: "Failed to load student details" });
    }
  });

  app.get("/api/academy/admin/notes", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const notes = await storage.getAllAdminNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to load admin notes" });
    }
  });

  app.post("/api/academy/admin/notes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId: targetUserId, note: noteText, category } = req.body;
      const note = await storage.createAdminNote({
        userId: targetUserId, note: noteText, category,
        adminId: getUserId(req)!,
        adminName: getUserName(req) || "Admin",
      });
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/academy/admin/notes/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const note = await storage.updateAdminNote(req.params.id, req.body);
      res.json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.post("/api/academy/marketplace/:id/report", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const report = await storage.createContentReport({
        reporterId: userId,
        reporterName: userName,
        contentType: "marketplace_listing",
        contentId: req.params.id,
        reason: req.body.reason || "inappropriate",
        details: req.body.details || "",
        status: "pending",
      });
      res.status(201).json({ message: "Thank you for helping keep our community safe. Your report has been sent to a teacher for review.", report });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  app.get("/api/academy/admin/reports", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const reports = await storage.getContentReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to load reports" });
    }
  });

  app.patch("/api/academy/admin/reports/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const report = await storage.updateContentReport(req.params.id, req.body);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  app.post("/api/admin/student-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { studentId, learningStyle, learningPace, careerInterests, pantherPowerFocus, featureAccess, mentorPreferences, supportNotes } = req.body;
      if (!studentId) return res.status(400).json({ error: "Student ID required" });
      res.json({ success: true, message: "Student configuration saved", studentId });
    } catch (error) {
      console.error("Error saving student config:", error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // ==================== CAREER EXPLORER (public) ====================

  app.get("/api/careers", async (_req, res) => {
    try {
      const fields = await db.select().from(careerFields);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching careers:", error);
      res.status(500).json({ error: "Failed to fetch careers" });
    }
  });

  app.get("/api/career-milestones", async (_req, res) => {
    try {
      const milestones = await db.select().from(careerMilestones);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching career milestones:", error);
      res.status(500).json({ error: "Failed to fetch career milestones" });
    }
  });

  // ==================== MY PATHWAY (requireAuth) ====================

  app.get("/api/pathway-plan", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const plans = await db.select().from(pathwayPlans).where(eq(pathwayPlans.userId, userId));
      res.json(plans[0] || null);
    } catch (error) {
      console.error("Error fetching pathway plan:", error);
      res.status(500).json({ error: "Failed to fetch pathway plan" });
    }
  });

  app.post("/api/pathway-plan", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const parsed = insertPathwayPlanSchema.safeParse({ ...req.body, userId, userName });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid pathway plan data", details: parsed.error.flatten() });
      }
      const [plan] = await db.insert(pathwayPlans).values(parsed.data).returning();
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating pathway plan:", error);
      res.status(500).json({ error: "Failed to create pathway plan" });
    }
  });

  app.patch("/api/pathway-plan/:id", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [existing] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, req.params.id));
      if (!existing) return res.status(404).json({ error: "Plan not found" });
      if (existing.userId !== userId) return res.status(403).json({ error: "Not authorized" });
      const { goals, status, primaryCareerInterest, secondaryCareerInterest, educationPathType, completedMilestones } = req.body;
      const [updated] = await db.update(pathwayPlans).set({ goals, status, primaryCareerInterest, secondaryCareerInterest, educationPathType, completedMilestones, updatedAt: new Date() }).where(eq(pathwayPlans.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating pathway plan:", error);
      res.status(500).json({ error: "Failed to update pathway plan" });
    }
  });

  app.post("/api/pathway-plan/:id/request-revision", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const [plan] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, req.params.id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if (plan.userId !== userId) return res.status(403).json({ error: "Not authorized" });
      if (plan.revisionsThisYear >= 3) {
        return res.status(400).json({ error: "Maximum 3 revisions per year exceeded" });
      }
      const { requestReason, newSnapshot } = req.body;
      if (!requestReason) return res.status(400).json({ error: "Request reason is required" });
      const [revision] = await db.insert(planRevisions).values({
        planId: plan.id,
        userId,
        requestedBy: userName,
        requestReason,
        previousSnapshot: plan,
        newSnapshot: newSnapshot || null,
        status: "pending",
      }).returning();
      await db.update(pathwayPlans).set({
        revisionsThisYear: plan.revisionsThisYear + 1,
        lastRevisionDate: new Date(),
        lockedForRevision: true,
        updatedAt: new Date(),
      }).where(eq(pathwayPlans.id, plan.id));
      res.status(201).json(revision);
    } catch (error) {
      console.error("Error requesting revision:", error);
      res.status(500).json({ error: "Failed to request revision" });
    }
  });

  app.get("/api/pathway-plan/:id/revisions", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [plan] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, req.params.id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if (plan.userId !== userId) return res.status(403).json({ error: "Not authorized" });
      const revisions = await db.select().from(planRevisions).where(eq(planRevisions.planId, req.params.id)).orderBy(desc(planRevisions.createdAt));
      res.json(revisions);
    } catch (error) {
      console.error("Error fetching revisions:", error);
      res.status(500).json({ error: "Failed to fetch revisions" });
    }
  });

  // ==================== MENTOR NETWORK ====================

  app.get("/api/mentors", async (_req, res) => {
    try {
      const mentors = await db.select().from(mentorProfiles).where(eq(mentorProfiles.isActive, true));
      res.json(mentors);
    } catch (error) {
      console.error("Error fetching mentors:", error);
      res.status(500).json({ error: "Failed to fetch mentors" });
    }
  });

  app.post("/api/mentors/request", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Student";
      const { mentorId, message } = req.body;
      if (!mentorId) return res.status(400).json({ error: "Mentor ID is required" });
      const [mentor] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.id, mentorId));
      if (!mentor) return res.status(404).json({ error: "Mentor not found" });
      const [request] = await db.insert(mentorRequests).values({
        studentId: userId,
        studentName: userName,
        mentorId,
        mentorName: mentor.name,
        careerField: mentor.careerField,
        message: message || null,
        status: "pending",
      }).returning();
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating mentor request:", error);
      res.status(500).json({ error: "Failed to create mentor request" });
    }
  });

  app.get("/api/mentors/my-requests", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const requests = await db.select().from(mentorRequests).where(eq(mentorRequests.studentId, userId)).orderBy(desc(mentorRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching mentor requests:", error);
      res.status(500).json({ error: "Failed to fetch mentor requests" });
    }
  });

  // ==================== ADMIN LONGITUDINAL DASHBOARD ====================

  app.get("/api/admin/pathway-plans", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const plans = await db.select().from(pathwayPlans).orderBy(desc(pathwayPlans.createdAt));
      res.json(plans);
    } catch (error) {
      console.error("Error fetching all pathway plans:", error);
      res.status(500).json({ error: "Failed to fetch pathway plans" });
    }
  });

  app.get("/api/admin/pending-revisions", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const revisions = await db.select().from(planRevisions).where(eq(planRevisions.status, "pending")).orderBy(desc(planRevisions.createdAt));
      res.json(revisions);
    } catch (error) {
      console.error("Error fetching pending revisions:", error);
      res.status(500).json({ error: "Failed to fetch pending revisions" });
    }
  });

  app.patch("/api/admin/revisions/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = getUserName(req) || "Admin";
      const { notes } = req.body;
      const [updated] = await db.update(planRevisions).set({
        status: "approved",
        facultyApproved: true,
        approvedBy: userId,
        approvedByName: userName,
        reviewNotes: notes || null,
      }).where(eq(planRevisions.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Revision not found" });
      await db.update(pathwayPlans).set({ lockedForRevision: false, updatedAt: new Date() }).where(eq(pathwayPlans.id, updated.planId));
      res.json(updated);
    } catch (error) {
      console.error("Error approving revision:", error);
      res.status(500).json({ error: "Failed to approve revision" });
    }
  });

  app.patch("/api/admin/revisions/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { notes } = req.body;
      const [updated] = await db.update(planRevisions).set({
        status: "rejected",
        reviewNotes: notes || null,
      }).where(eq(planRevisions.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Revision not found" });
      await db.update(pathwayPlans).set({ lockedForRevision: false, updatedAt: new Date() }).where(eq(pathwayPlans.id, updated.planId));
      res.json(updated);
    } catch (error) {
      console.error("Error rejecting revision:", error);
      res.status(500).json({ error: "Failed to reject revision" });
    }
  });

  app.get("/api/admin/mentor-requests", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const requests = await db.select().from(mentorRequests).orderBy(desc(mentorRequests.createdAt));
      res.json(requests);
    } catch (error) {
      console.error("Error fetching all mentor requests:", error);
      res.status(500).json({ error: "Failed to fetch mentor requests" });
    }
  });

  app.patch("/api/admin/mentor-requests/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });
      const [updated] = await db.update(mentorRequests).set({ status }).where(eq(mentorRequests.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Mentor request not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating mentor request:", error);
      res.status(500).json({ error: "Failed to update mentor request" });
    }
  });

  app.get("/api/alumni", async (_req, res) => {
    try {
      const alumni = await db.select().from(alumniProfiles).orderBy(desc(alumniProfiles.createdAt));
      res.json(alumni);
    } catch (error) {
      console.error("Error fetching alumni:", error);
      res.status(500).json({ error: "Failed to fetch alumni" });
    }
  });

  app.patch("/api/admin/alumni/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(alumniProfiles).set(req.body).where(eq(alumniProfiles.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "Alumni profile not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating alumni profile:", error);
      res.status(500).json({ error: "Failed to update alumni profile" });
    }
  });

  app.get("/api/admin/longitudinal-metrics", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const [studentsResult] = await db.select({ value: count() }).from(pathwayPlans);
      const [activeResult] = await db.select({ value: count() }).from(pathwayPlans).where(eq(pathwayPlans.status, "active"));
      const [milestonesResult] = await db.select({ value: count() }).from(careerMilestones);
      const [pendingResult] = await db.select({ value: count() }).from(planRevisions).where(eq(planRevisions.status, "pending"));
      const [mentorshipsResult] = await db.select({ value: count() }).from(mentorRequests).where(eq(mentorRequests.status, "approved"));
      const [alumniResult] = await db.select({ value: count() }).from(alumniProfiles);
      res.json({
        totalStudents: studentsResult?.value || 0,
        activePathways: activeResult?.value || 0,
        completedMilestones: milestonesResult?.value || 0,
        pendingRevisions: pendingResult?.value || 0,
        activeMentorships: mentorshipsResult?.value || 0,
        alumniCount: alumniResult?.value || 0,
      });
    } catch (error) {
      console.error("Error fetching longitudinal metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // ==================== STUDENT SELF-ASSESSMENT ROUTES ====================

  app.post("/api/self-assessment", requireAuth, async (req, res) => {
    try {
      const parsed = insertStudentSelfAssessmentSchema.safeParse({
        ...req.body,
        userId: getUserId(req),
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid assessment data", details: parsed.error.flatten() });
      }
      const [created] = await db.insert(studentSelfAssessments).values(parsed.data).returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating self-assessment:", error);
      res.status(500).json({ error: "Failed to create self-assessment" });
    }
  });

  app.get("/api/self-assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const assessments = await db.select().from(studentSelfAssessments)
        .where(eq(studentSelfAssessments.userId, userId))
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(30);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching self-assessments:", error);
      res.status(500).json({ error: "Failed to fetch self-assessments" });
    }
  });

  app.get("/api/self-assessments/latest", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const [latest] = await db.select().from(studentSelfAssessments)
        .where(eq(studentSelfAssessments.userId, userId))
        .orderBy(desc(studentSelfAssessments.createdAt))
        .limit(1);
      res.json(latest || null);
    } catch (error) {
      console.error("Error fetching latest self-assessment:", error);
      res.status(500).json({ error: "Failed to fetch latest self-assessment" });
    }
  });

  // ==================== THRIVE SCORE ROUTES ====================

  app.get("/api/thrive/score", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      let [score] = await db.select().from(thriveScores)
        .where(eq(thriveScores.userId, userId))
        .limit(1);
      if (!score) {
        const result = await computeFullThriveScore(db, userId);
        [score] = await db.select().from(thriveScores)
          .where(eq(thriveScores.userId, userId))
          .limit(1);
        if (!score) return res.json(result);
      }
      res.json(score);
    } catch (error) {
      console.error("Error fetching Thrive score:", error);
      res.status(500).json({ error: "Failed to fetch Thrive score" });
    }
  });

  app.get("/api/thrive/history", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const days = parseInt(req.query.days as string) || 90;
      const history = await getThriveHistory(db, userId, days);
      res.json(history);
    } catch (error) {
      console.error("Error fetching Thrive history:", error);
      res.status(500).json({ error: "Failed to fetch Thrive history" });
    }
  });

  app.post("/api/thrive/compute", requireAuth, async (req, res) => {
    try {
      const result = await computeFullThriveScore(db, getUserId(req)!);
      res.json(result);
    } catch (error) {
      console.error("Error computing Thrive score:", error);
      res.status(500).json({ error: "Failed to compute Thrive score" });
    }
  });

  // ==================== ADMIN THRIVE ROUTES ====================

  app.get("/api/admin/thrive/scores", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const scores = await db.select().from(thriveScores).orderBy(thriveScores.compositeScore);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching all Thrive scores:", error);
      res.status(500).json({ error: "Failed to fetch Thrive scores" });
    }
  });

  app.post("/api/admin/thrive/compute-all", requireAuth, requireAdmin, async (_req, res) => {
    try {
      await computeAllStudentScores(db);
      res.json({ success: true });
    } catch (error) {
      console.error("Error computing all Thrive scores:", error);
      res.status(500).json({ error: "Failed to compute all Thrive scores" });
    }
  });

  app.get("/api/admin/thrive/student/:userId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const [score] = await db.select().from(thriveScores)
        .where(eq(thriveScores.userId, userId))
        .limit(1);
      const history = await getThriveHistory(db, userId);
      res.json({ score: score || null, history });
    } catch (error) {
      console.error("Error fetching student Thrive data:", error);
      res.status(500).json({ error: "Failed to fetch student Thrive data" });
    }
  });

  // ==================== EARLY WARNING ROUTES ====================

  app.get("/api/thrive/flags", requireAuth, async (req, res) => {
    try {
      const flags = await getActiveFlags(db, getUserId(req)!);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching early warning flags:", error);
      res.status(500).json({ error: "Failed to fetch early warning flags" });
    }
  });

  app.get("/api/admin/thrive/flags", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const flags = await getActiveFlags(db);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching all early warning flags:", error);
      res.status(500).json({ error: "Failed to fetch early warning flags" });
    }
  });

  app.post("/api/admin/thrive/run-check", requireAuth, requireAdmin, async (_req, res) => {
    try {
      await runEarlyWarningCheck(db);
      res.json({ success: true });
    } catch (error) {
      console.error("Error running early warning check:", error);
      res.status(500).json({ error: "Failed to run early warning check" });
    }
  });

  app.patch("/api/admin/thrive/flags/:id/resolve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { notes } = req.body;
      await resolveFlag(db, req.params.id, getUserId(req)!, notes);
      res.json({ success: true });
    } catch (error) {
      console.error("Error resolving flag:", error);
      res.status(500).json({ error: "Failed to resolve flag" });
    }
  });

  // ==================== INTERVENTION PLAYBOOK ROUTES ====================

  app.get("/api/thrive/playbooks", requireAuth, async (_req, res) => {
    try {
      const playbooks = await db.select().from(interventionPlaybooksTable)
        .where(eq(interventionPlaybooksTable.isActive, true));
      res.json(playbooks);
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      res.status(500).json({ error: "Failed to fetch playbooks" });
    }
  });

  app.get("/api/thrive/playbooks/:id", requireAuth, async (req, res) => {
    try {
      const [playbook] = await db.select().from(interventionPlaybooksTable)
        .where(eq(interventionPlaybooksTable.id, req.params.id))
        .limit(1);
      if (!playbook) return res.status(404).json({ error: "Playbook not found" });
      res.json(playbook);
    } catch (error) {
      console.error("Error fetching playbook:", error);
      res.status(500).json({ error: "Failed to fetch playbook" });
    }
  });

  // ==================== GIS ROUTES (ADMIN) ====================

  app.post("/api/admin/gis/ingest", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stateAbbr = req.body.stateAbbr || "TX";
      await runFullIngestion(db, stateAbbr);
      res.json({ success: true });
    } catch (error) {
      console.error("Error running GIS ingestion:", error);
      res.status(500).json({ error: "Failed to run GIS ingestion" });
    }
  });

  app.get("/api/admin/gis/context/:geographyKey", requireAuth, requireAdmin, async (req, res) => {
    try {
      const context = await getContextForGeography(db, req.params.geographyKey);
      if (!context) return res.status(404).json({ error: "Geography not found" });
      res.json(context);
    } catch (error) {
      console.error("Error fetching GIS context:", error);
      res.status(500).json({ error: "Failed to fetch GIS context" });
    }
  });

  app.get("/api/admin/gis/heatmap", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const data = await db.select().from(gisContextData).orderBy(desc(gisContextData.contextLoadIndex));
      res.json(data);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  });

  app.get("/api/admin/gis/resources", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const resources = await db.select().from(gisResourceOverlays)
        .where(eq(gisResourceOverlays.isActive, true));
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resource overlays:", error);
      res.status(500).json({ error: "Failed to fetch resource overlays" });
    }
  });

  // ==================== THRIVE CONFIG ROUTES (ADMIN) ====================

  app.get("/api/admin/thrive/config", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const config = await db.select().from(thriveConfig);
      res.json(config);
    } catch (error) {
      console.error("Error fetching Thrive config:", error);
      res.status(500).json({ error: "Failed to fetch Thrive config" });
    }
  });

  app.put("/api/admin/thrive/config/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { value, description } = req.body;
      const configKey = req.params.key;
      const existing = await db.select().from(thriveConfig)
        .where(eq(thriveConfig.key, configKey))
        .limit(1);
      if (existing.length > 0) {
        const [updated] = await db.update(thriveConfig)
          .set({ value, description, updatedAt: new Date() })
          .where(eq(thriveConfig.key, configKey))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db.insert(thriveConfig)
          .values({ key: configKey, value, description })
          .returning();
        res.status(201).json(created);
      }
    } catch (error) {
      console.error("Error updating Thrive config:", error);
      res.status(500).json({ error: "Failed to update Thrive config" });
    }
  });

  // ==================== GAME PLATFORM API ====================

  app.post("/api/games", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { gameType, mode, difficulty } = req.body;
    if (!gameType || typeof gameType !== 'string') {
      return res.status(400).json({ error: "gameType is required" });
    }
    const session = await storage.createGameSession({
      gameType,
      mode: mode || 'single_vs_cpu',
      createdBy: userId,
      status: "waiting",
      startedAt: new Date(),
    });
    await storage.addGamePlayer({
      sessionId: session.id,
      userId,
      seat: 0,
      isCpu: false,
    });
    if (req.body.mode === 'single_vs_cpu') {
      await storage.addGamePlayer({
        sessionId: session.id,
        userId: null,
        seat: 1,
        isCpu: true,
        cpuDifficulty: req.body.difficulty || 'intermediate',
      });
      await storage.updateGameSession(session.id, { status: 'in_progress' });
    }
    const playSession = await storage.startPlaySession(userId, req.body.gameType);
    res.json({ session: await storage.getGameSession(session.id), playSessionId: playSession.id });
  });

  app.get("/api/games", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const sessions = await storage.getGameSessionsByUser(userId);
    res.json(sessions);
  });

  app.get("/api/games/active", async (req, res) => {
    const sessions = await storage.getActiveGameSessions();
    res.json(sessions);
  });

  app.get("/api/games/online-count", async (_req, res) => {
    const count = await storage.getActivePlayerCount();
    res.json({ count });
  });

  app.get("/api/games/:id", async (req, res) => {
    const session = await storage.getGameSession(req.params.id);
    if (!session) return res.status(404).json({ error: "Game not found" });
    const players = await storage.getGamePlayers(req.params.id);
    res.json({ session, players });
  });

  app.patch("/api/games/:id", requireAuth, async (req, res) => {
    const { status, currentTurn, gameState, scores } = req.body;
    const allowedFields: Record<string, any> = {};
    if (status) allowedFields.status = status;
    if (currentTurn !== undefined) allowedFields.currentTurn = currentTurn;
    if (gameState !== undefined) allowedFields.gameState = gameState;
    if (scores !== undefined) allowedFields.scores = scores;
    const session = await storage.updateGameSession(req.params.id, allowedFields);
    res.json(session);
  });

  app.post("/api/games/:id/finish", requireAuth, async (req, res) => {
    const { winnerId, scores, playSessionId } = req.body;
    const session = await storage.updateGameSession(req.params.id, {
      status: 'completed',
      winnerId,
      scores,
      completedAt: new Date(),
    });

    if (playSessionId) {
      await storage.endPlaySession(playSessionId);
    }

    const players = await storage.getGamePlayers(req.params.id);
    for (const player of players) {
      if (!player.isCpu && player.userId) {
        const rating = await storage.getOrCreateRating(player.userId, session.gameType);
        const isWinner = player.userId === winnerId;
        const isDraw = !winnerId;
        const newRating = calculateElo(rating.rating, 1200, isWinner ? 1 : isDraw ? 0.5 : 0);
        await storage.updateRating(rating.id, {
          rating: newRating,
          gamesPlayed: rating.gamesPlayed + 1,
          wins: rating.wins + (isWinner ? 1 : 0),
          losses: rating.losses + (!isWinner && !isDraw ? 1 : 0),
          draws: rating.draws + (isDraw ? 1 : 0),
        });
        await storage.updateGamePlayer(player.id, {
          ratingBefore: rating.rating,
          ratingAfter: newRating,
        });
      }
    }

    res.json(session);
  });

  app.get("/api/ratings", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const ratings = await storage.getRatingsByUser(userId);
    res.json(ratings);
  });

  app.get("/api/leaderboard/:gameType", async (req, res) => {
    const leaderboard = await storage.getLeaderboard(req.params.gameType, 20);
    res.json(leaderboard);
  });

  app.post("/api/play-sessions/end", requireAuth, async (req, res) => {
    const { playSessionId } = req.body;
    if (playSessionId) {
      const session = await storage.endPlaySession(playSessionId);
      res.json(session);
    } else {
      res.status(400).json({ error: "playSessionId required" });
    }
  });

  app.get("/api/play-sessions/flagged", requireAdmin, async (req, res) => {
    const flagged = await storage.getFlaggedPlaySessions();
    res.json(flagged);
  });

  // ==================== STUDENT REFLECTIONS ====================
  app.get("/api/reflections", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const reflections = await storage.getReflectionsByUser(userId);
      res.json(reflections);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reflections" });
    }
  });

  app.post("/api/reflections", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Student";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const parsed = insertStudentReflectionSchema.safeParse({ ...req.body, userId, studentName: userName });
      if (!parsed.success) return res.status(400).json({ error: "Invalid reflection data", details: parsed.error.errors });
      const reflection = await storage.createReflection(parsed.data);
      res.json(reflection);
    } catch (error) {
      res.status(500).json({ error: "Failed to create reflection" });
    }
  });

  // ==================== ANNOUNCEMENTS ====================
  app.get("/api/announcements", async (_req, res) => {
    try {
      const items = await storage.getAnnouncements();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to get announcements" });
    }
  });

  app.post("/api/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Admin";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const parsed = insertAnnouncementSchema.safeParse({ ...req.body, createdByUserId: userId, createdByName: userName });
      if (!parsed.success) return res.status(400).json({ error: "Invalid announcement data", details: parsed.error.errors });
      const announcement = await storage.createAnnouncement(parsed.data);
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.delete("/api/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAnnouncement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // ==================== ACADEMY EVENTS ====================
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getAcademyEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to get events" });
    }
  });

  app.post("/api/events", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Admin";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const parsed = insertAcademyEventSchema.safeParse({ ...req.body, createdByUserId: userId, createdByName: userName });
      if (!parsed.success) return res.status(400).json({ error: "Invalid event data", details: parsed.error.errors });
      const event = await storage.createAcademyEvent(parsed.data);
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAcademyEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ==================== ATTENDANCE ====================
  app.post("/api/attendance/log", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      const userName = getUserName(req) || "Student";
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const today = new Date().toISOString().split("T")[0];
      const data = { userId, studentName: userName, loginDate: today };
      const log = await storage.logAttendance(data);
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to log attendance" });
    }
  });

  app.get("/api/attendance", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const logs = await storage.getAttendanceLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to get attendance logs" });
    }
  });

  // Risk Decision Tracking
  app.post("/api/risk-decisions", async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const { featureArea, actionType, riskLevel, warningMessage, overrideChosen, metadata, financialLiteracyModule } = req.body;
      const decision = await storage.createRiskDecision({
        featureArea, actionType, riskLevel, warningMessage, overrideChosen, metadata, financialLiteracyModule,
        userId: user.id,
        studentName: user.name || user.username || "Unknown",
      });

      const settings = await storage.getRiskNotificationSettings();
      if (settings && decision.overrideChosen) {
        const userDecisions = await storage.getRiskDecisionsByUser(user.id);
        const overrideCount = userDecisions.filter(d => d.overrideChosen).length;

        const shouldNotify =
          (settings.notifyOnEveryOverride) ||
          (settings.notifyOnHighRisk && decision.riskLevel === "high") ||
          (overrideCount >= settings.overrideCountThreshold);

        if (shouldNotify) {
          await storage.createAdminNote({
            userId: user.id,
            adminId: "system",
            adminName: "Risk Monitor",
            category: "concern",
            note: `Risk override #${overrideCount}: ${decision.actionType} in ${decision.featureArea}. Risk level: ${decision.riskLevel}. Warning: ${decision.warningMessage}`,
          });
        }
      }

      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: "Failed to create risk decision" });
    }
  });

  app.get("/api/risk-decisions", requireAuth, async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    try {
      const decisions = await storage.getRiskDecisionsByUser(user.id);
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk decisions" });
    }
  });

  app.get("/api/admin/risk-decisions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const decisions = await storage.getAllRiskDecisions();
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all risk decisions" });
    }
  });

  app.get("/api/admin/risk-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getRiskNotificationSettings();
      res.json(settings || {
        overrideCountThreshold: 3,
        tradeAmountThreshold: 500,
        notifyOnHighRisk: true,
        notifyOnEveryOverride: false,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk settings" });
    }
  });

  app.patch("/api/admin/risk-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings = await storage.updateRiskNotificationSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk settings" });
    }
  });

  app.patch("/api/admin/risk-decisions/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const decision = await storage.updateRiskDecision(req.params.id, req.body);
      res.json(decision);
    } catch (error) {
      res.status(500).json({ error: "Failed to update risk decision" });
    }
  });

  // ==================== AI TOOLS ROUTES ====================

  app.get("/api/ai-tools", async (req, res) => {
    const userId = getUserId(req);
    const isAdult = req.query.mode === "adult";

    const tools = await db.select().from(aiToolCatalog).where(eq(aiToolCatalog.isActive, true)).orderBy(aiToolCatalog.sortOrder);

    let unlocks: any[] = [];
    if (userId && !isAdult) {
      unlocks = await db.select().from(aiToolUnlocks).where(eq(aiToolUnlocks.userId, userId));
    }

    const unlockedToolIds = new Set(unlocks.map((u: any) => u.toolId));

    const toolsWithStatus = tools.map(tool => ({
      ...tool,
      isUnlocked: isAdult || unlockedToolIds.has(tool.id),
      moduleInfo: AI_COURSE_MODULES.find(m => m.key === tool.requiredModuleKey),
    }));

    res.json(toolsWithStatus);
  });

  app.get("/api/ai-tools/modules", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const unlocks = await db.select().from(aiToolUnlocks).where(eq(aiToolUnlocks.userId, userId));
    const unlockedModuleKeys = new Set<string>();

    const tools = await db.select().from(aiToolCatalog);
    for (const unlock of unlocks) {
      const tool = tools.find(t => t.id === unlock.toolId);
      if (tool) unlockedModuleKeys.add(tool.requiredModuleKey!);
    }

    const modulesWithStatus = AI_COURSE_MODULES.map(mod => ({
      ...mod,
      completed: unlockedModuleKeys.has(mod.key),
      unlocksTool: mod.unlocksTool,
    }));

    res.json(modulesWithStatus);
  });

  app.post("/api/ai-tools/modules/:moduleKey/complete", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { moduleKey } = req.params;

    const mod = AI_COURSE_MODULES.find(m => m.key === moduleKey);
    if (!mod) return res.status(404).json({ error: "Module not found" });

    const tool = await db.select().from(aiToolCatalog).where(eq(aiToolCatalog.requiredModuleKey, moduleKey));
    if (!tool.length) return res.status(404).json({ error: "Tool not found for module" });

    const existing = await db.select().from(aiToolUnlocks).where(and(eq(aiToolUnlocks.userId, userId), eq(aiToolUnlocks.toolId, tool[0].id)));
    if (existing.length > 0) return res.json({ message: "Already unlocked", toolId: tool[0].id });

    await db.insert(aiToolUnlocks).values({ userId, toolId: tool[0].id, unlockedVia: "module_completion" });

    res.json({ message: "Module completed! Tool unlocked.", toolId: tool[0].id, toolName: tool[0].name });
  });

  app.post("/api/ai-tools/:toolId/run", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { toolId } = req.params;
    const { prompt, context, existingContent, language, isAdult } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const tool = await db.select().from(aiToolCatalog).where(eq(aiToolCatalog.id, toolId));
    if (!tool.length) return res.status(404).json({ error: "Tool not found" });

    if (!isAdult) {
      const unlock = await db.select().from(aiToolUnlocks).where(and(eq(aiToolUnlocks.userId, userId), eq(aiToolUnlocks.toolId, toolId)));
      if (!unlock.length) return res.status(403).json({ error: "Tool is locked. Complete the required module first." });
    }

    const toolData = tool[0];
    const langInstruction = language === "es" ? "\n\nRespond entirely in Spanish." : "";

    const toolPrompts: Record<string, string> = {
      "PRESENTATION_BUILDER": `You are an expert presentation designer. Create a complete slide-by-slide presentation based on the user's request.

For each slide, provide:
- **Slide [number]: [Title]**
- **Content:** Key bullet points or text
- **Speaker Notes:** What to say when presenting this slide
- **Visual Suggestion:** What image, chart, or graphic would work well

Structure the presentation with: Title Slide, Agenda, Main Content (3-7 slides), Key Takeaways, Call to Action/Conclusion.
Keep language age-appropriate for students. Make it engaging and visual.`,

      "VIDEO_CREATOR": `You are a professional video scriptwriter. Create a complete video script/storyboard based on the user's request.

For each scene, provide:
- **Scene [number]: [Title]** (with estimated duration)
- **Visual:** What the viewer sees (camera angle, setting, actions)
- **Audio/Narration:** What is said or heard
- **Text on Screen:** Any titles, captions, or graphics
- **Transition:** How to move to the next scene

Include: Hook/Intro, Main Content, B-Roll suggestions, Outro/Call to Action.
Keep it age-appropriate and engaging for student creators.`,

      "SALES_PITCH": `You are a business coach teaching ethical sales. Create a compelling sales pitch based on the user's request.

Structure the pitch with:
- **The Hook:** Opening line that grabs attention (10 seconds)
- **The Problem:** What pain point does the product/service solve?
- **The Solution:** How does it solve the problem?
- **Social Proof:** Evidence it works (testimonials, data, examples)
- **Value Proposition:** Why this is worth it
- **Objection Handling:** Common concerns and responses
- **The Close:** Call to action
- **Follow-up Plan:** Next steps after the pitch

Emphasize ethical persuasion — never manipulate, always create genuine value.`,

      "BUSINESS_PLAN": `You are a business strategist helping create a comprehensive business plan.

Structure the plan with:
- **Executive Summary:** One-paragraph overview
- **Business Description:** What the business does, mission, vision
- **Market Analysis:** Target audience, market size, competition
- **Products/Services:** What you're selling, pricing strategy
- **Marketing Strategy:** How to reach customers
- **Operations Plan:** How the business runs day-to-day
- **Financial Projections:** Revenue estimates, costs, break-even
- **Team:** Who's involved and their roles
- **Timeline:** Key milestones for the first year
- **Risk Assessment:** Potential challenges and mitigation strategies

Make it practical and educational. Use realistic numbers and examples.`,

      "RESEARCH": `You are a research librarian and academic coach. Help organize and structure research.

Provide:
- **Research Question:** Refined version of the user's question
- **Key Topics to Investigate:** 5-7 subtopics to explore
- **Outline:** Structured outline for a research paper/project
- **Key Points:** Important facts and information to include
- **Sources to Find:** Types of sources to look for (books, articles, data)
- **Citation Format:** How to cite sources properly (MLA/APA simplified)
- **Research Tips:** How to evaluate sources for reliability

Teach good research habits. Encourage critical thinking about sources.`,

      "LIFE_PLANNER": `You are a life coach helping create a personal development plan.

Structure the plan with:
- **Vision Statement:** Where do you want to be in 5-10 years?
- **Core Values:** What matters most to you?
- **Goal Categories:** Academic, Career, Personal, Health, Relationships, Financial
- **SMART Goals:** Specific, Measurable, Achievable, Relevant, Time-bound goals for each category
- **Action Steps:** Weekly/monthly actions for each goal
- **Milestones:** Checkpoints to celebrate progress
- **Potential Obstacles:** Challenges you might face and how to overcome them
- **Support System:** Who can help you on this journey?
- **Daily Habits:** Small habits that build toward big goals

Be encouraging and realistic. Help students dream big while planning practically.`,

      "PROJECT_PLANNER": `You are a project management expert. Help break down a project into manageable pieces.

Structure the plan with:
- **Project Overview:** What are we building/creating?
- **Goals & Success Criteria:** How will we know it's done well?
- **Task Breakdown:** All tasks organized by phase (Planning, Execution, Review)
- **Timeline:** When each task should be completed (use a week-by-week format)
- **Resources Needed:** Materials, tools, people, budget
- **Task Dependencies:** What must be done before other things can start
- **Risk Assessment:** What could go wrong and backup plans
- **Team Roles:** Who does what (if group project)
- **Check-in Points:** When to review progress
- **Deliverables:** What the final output looks like

Make it practical and student-friendly. Include templates they can fill in.`,

      "DOCUMENT_WRITER": `You are a skilled writing coach. Help create well-structured documents.

Based on the document type requested, provide:
- **Title & Header**
- **Introduction:** Hook, thesis/purpose, roadmap
- **Body Sections:** Well-organized paragraphs with topic sentences, evidence, analysis
- **Transitions:** Smooth connections between sections
- **Conclusion:** Summary, significance, call to action
- **Writing Tips:** Specific suggestions for improvement

Adapt style to the document type (essay, report, letter, article, speech).
Teach good writing habits along the way. Never write the entire thing for them — provide structure, examples, and guidance.`,

      "RESUME_BUILDER": `You are a career counselor. Help create professional documents.

For resumes, provide:
- **Contact Information** section format
- **Professional Summary:** 2-3 sentence overview
- **Education:** How to format school, GPA, relevant coursework
- **Experience:** How to write bullet points with action verbs and results
- **Skills:** Technical and soft skills relevant to the field
- **Activities & Leadership:** Clubs, volunteer work, sports
- **Portfolio Section:** How to showcase projects and achievements

For cover letters, provide structure and examples.
Teach professional communication. Help students present their best selves authentically.`,

      "BRAINSTORM": `You are a creative thinking facilitator. Help generate and organize ideas.

Provide:
- **Brain Dump:** List every idea related to the topic (aim for 20+)
- **Categories:** Group ideas into themes
- **Top 5 Ideas:** Most promising ideas with brief explanations of why
- **Mind Map:** Central topic with branching ideas and sub-ideas (in text format)
- **SCAMPER Analysis:** Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
- **"What If" Questions:** 5 creative "what if" scenarios to push thinking further
- **Next Steps:** How to develop the best ideas further

Be wildly creative. No bad ideas in brainstorming! Encourage unusual connections.`,
    };

    const toolSystemPrompt = toolPrompts[toolData.promptTemplate] || toolPrompts["BRAINSTORM"];

    const systemMsg = `${toolSystemPrompt}

TOOL: ${toolData.name}
${context ? `ADDITIONAL CONTEXT: ${context}` : ""}
${existingContent ? `EXISTING CONTENT TO IMPROVE/CONTINUE:\n${existingContent}` : ""}
${langInstruction}

Be thorough, practical, and age-appropriate. Format your response with clear headings and structure using Markdown.`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      await streamAIResponse({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt },
        ],
        maxTokens: 3000,
        onChunk: (content) => {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        },
        onError: (error) => {
          console.error("AI error:", error);
          res.write(`data: ${JSON.stringify({ error: "Failed to generate content" })}\n\n`);
          res.end();
        },
      });
    } catch (error) {
      console.error("Error in AI tool run:", error);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate content" })}\n\n`);
      res.end();
    }
  });

  app.get("/api/ai-tools/projects", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const projects = await db.select().from(aiToolProjects).where(eq(aiToolProjects.userId, userId)).orderBy(desc(aiToolProjects.createdAt));
    res.json(projects);
  });

  app.post("/api/ai-tools/projects", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { toolId, title, prompt, content, outputType, status } = req.body;

    if (!toolId || !title || !prompt) return res.status(400).json({ error: "toolId, title, and prompt are required" });

    const [project] = await db.insert(aiToolProjects).values({
      userId,
      toolId,
      title,
      prompt,
      content: content || "",
      outputType: outputType || "markdown",
      status: status || "draft",
    }).returning();

    res.json(project);
  });

  app.patch("/api/ai-tools/projects/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    const { id } = req.params;
    const { title, content, status } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status) updateData.status = status;

    const [project] = await db.update(aiToolProjects).set(updateData).where(and(eq(aiToolProjects.id, id), eq(aiToolProjects.userId, userId))).returning();

    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  app.delete("/api/ai-tools/projects/:id", requireAuth, async (req, res) => {
    const userId = getUserId(req)!;
    await db.delete(aiToolProjects).where(and(eq(aiToolProjects.id, req.params.id), eq(aiToolProjects.userId, userId)));
    res.json({ success: true });
  });

  // ==================== ADMIN COURSE CREATOR (LMS) ROUTES ====================

  app.get("/api/admin/courses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const courses = await storage.getAdminCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/admin/courses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const course = await storage.getAdminCourse(req.params.id);
      if (!course) return res.status(404).json({ error: "Course not found" });
      const modules = await storage.getCourseModules(req.params.id);
      const modulesWithLessons = await Promise.all(
        modules.map(async (mod) => {
          const lessons = await storage.getCourseLessons(mod.id);
          return { ...mod, lessons };
        })
      );
      const enrollments = await storage.getCourseEnrollments(req.params.id);
      res.json({ ...course, modules: modulesWithLessons, enrollments });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/admin/courses", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertAcademyCourseSchema.parse(req.body);
      const course = await storage.createAdminCourse(parsed);
      res.json(course);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create course" });
    }
  });

  app.patch("/api/admin/courses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const existing = await storage.getAdminCourse(req.params.id);
      if (!existing) return res.status(404).json({ error: "Course not found" });
      const course = await storage.updateAdminCourse(req.params.id, req.body);
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to update course" });
    }
  });

  app.delete("/api/admin/courses/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteAdminCourse(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete course" });
    }
  });

  app.post("/api/admin/courses/:courseId/modules", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCourseModuleSchema.parse({ ...req.body, courseId: req.params.courseId });
      const mod = await storage.createCourseModule(parsed);
      res.json(mod);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create module" });
    }
  });

  app.patch("/api/admin/courses/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const mod = await storage.updateCourseModule(req.params.id, req.body);
      res.json(mod);
    } catch (error) {
      res.status(500).json({ error: "Failed to update module" });
    }
  });

  app.delete("/api/admin/courses/modules/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCourseModule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete module" });
    }
  });

  app.post("/api/admin/courses/modules/:moduleId/lessons", requireAuth, requireAdmin, async (req, res) => {
    try {
      const parsed = insertCourseLessonSchema.parse({ ...req.body, moduleId: req.params.moduleId });
      const lesson = await storage.createCourseLesson(parsed);
      res.json(lesson);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create lesson" });
    }
  });

  app.patch("/api/admin/courses/lessons/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const lesson = await storage.updateCourseLesson(req.params.id, req.body);
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/admin/courses/lessons/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCourseLesson(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.post("/api/admin/courses/:courseId/enroll", requireAdmin, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const userName = req.headers["x-replit-user-name"] as string || "Student";
      const enrollment = await storage.createCourseEnrollment({
        courseId: req.params.courseId,
        userId,
        userName,
        status: "active",
        progressPercent: 0,
      });
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  app.get("/api/courses/my-enrollments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const enrollments = await storage.getEnrollmentsByUser(userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // ==================== STAAR TEST PREP ROUTES ====================

  app.get("/api/staar/guides", async (req, res) => {
    try {
      const grade = parseInt(req.query.grade as string);
      const subject = req.query.subject as string;
      if (!grade || !subject) return res.status(400).json({ error: "Grade and subject required" });
      const guides = await db.select().from(staarStudyGuides)
        .where(and(eq(staarStudyGuides.grade, grade), eq(staarStudyGuides.subject, subject)))
        .orderBy(staarStudyGuides.sortOrder);
      res.json(guides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch study guides" });
    }
  });

  app.get("/api/staar/subjects", async (_req, res) => {
    try {
      const result = await db.select({ grade: staarStudyGuides.grade, subject: staarStudyGuides.subject })
        .from(staarStudyGuides)
        .groupBy(staarStudyGuides.grade, staarStudyGuides.subject)
        .orderBy(staarStudyGuides.grade, staarStudyGuides.subject);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  app.get("/api/staar/questions", async (req, res) => {
    try {
      const grade = parseInt(req.query.grade as string);
      const subject = req.query.subject as string;
      const tekCode = req.query.tekCode as string;
      if (!grade || !subject) return res.status(400).json({ error: "Grade and subject required" });
      const conditions = [eq(staarPracticeQuestions.grade, grade), eq(staarPracticeQuestions.subject, subject)];
      if (tekCode) conditions.push(eq(staarPracticeQuestions.tekCode, tekCode));
      const questions = await db.select().from(staarPracticeQuestions)
        .where(and(...conditions))
        .orderBy(staarPracticeQuestions.sortOrder);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/staar/assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req)!;
      const parsed = insertStaarStudentAssessmentSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const [assessment] = await db.insert(staarStudentAssessments).values(parsed.data).returning();
      const answers = parsed.data.answers as Array<{ tekCode: string; topicName: string; correct: boolean }>;
      for (const answer of answers) {
        const existing = await db.select().from(staarTopicMastery)
          .where(and(eq(staarTopicMastery.userId, userId), eq(staarTopicMastery.tekCode, answer.tekCode)));
        if (existing.length > 0) {
          const m = existing[0];
          const newTotal = m.totalAttempts + 1;
          const newCorrect = m.correctAttempts + (answer.correct ? 1 : 0);
          const pct = Math.round((newCorrect / newTotal) * 100);
          const level = pct >= 80 ? "mastered" : pct >= 60 ? "proficient" : pct >= 40 ? "developing" : "needs_practice";
          await db.update(staarTopicMastery).set({ totalAttempts: newTotal, correctAttempts: newCorrect, masteryLevel: level, lastAttemptAt: new Date() }).where(eq(staarTopicMastery.id, m.id));
        } else {
          await db.insert(staarTopicMastery).values({
            userId, grade: parsed.data.grade, subject: parsed.data.subject,
            tekCode: answer.tekCode, topicName: answer.topicName,
            totalAttempts: 1, correctAttempts: answer.correct ? 1 : 0,
            masteryLevel: answer.correct ? "developing" : "needs_practice",
            lastAttemptAt: new Date(),
          });
        }
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit assessment" });
    }
  });

  app.get("/api/staar/assessments", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.json([]);
      const grade = req.query.grade ? parseInt(req.query.grade as string) : undefined;
      const subject = req.query.subject as string | undefined;
      const conditions: any[] = [eq(staarStudentAssessments.userId, userId)];
      if (grade) conditions.push(eq(staarStudentAssessments.grade, grade));
      if (subject) conditions.push(eq(staarStudentAssessments.subject, subject));
      const assessments = await db.select().from(staarStudentAssessments)
        .where(and(...conditions))
        .orderBy(desc(staarStudentAssessments.completedAt));
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessments" });
    }
  });

  app.get("/api/staar/mastery", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.json([]);
      const grade = req.query.grade ? parseInt(req.query.grade as string) : undefined;
      const subject = req.query.subject as string | undefined;
      const conditions: any[] = [eq(staarTopicMastery.userId, userId)];
      if (grade) conditions.push(eq(staarTopicMastery.grade, grade));
      if (subject) conditions.push(eq(staarTopicMastery.subject, subject));
      const mastery = await db.select().from(staarTopicMastery).where(and(...conditions));
      res.json(mastery);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mastery data" });
    }
  });

  return httpServer;
}
