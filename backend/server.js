const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Parser } = require('json2csv');
const { Groq } = require("groq-sdk");

dotenv.config();
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists =", !!process.env.EMAIL_PASS);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const app = express();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("ai_hrms");

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// MongoDB Connection
async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB Connected Successfully ✅");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌");
    console.error(error);
  }
}

connectDB();

// Home Route
app.get("/", (req, res) => {
  res.send("AI-HRMS Backend Running Successfully 🚀");
});

// Test Route
app.get("/api/test", (req, res) => {
  res.json({
    message: "MongoDB Connected Successfully",
    status: "success",
  });
});

// Register User
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const requestedRole = role ? role.trim() : "Employee";
    const forbiddenRoles = ["Management Admin", "Senior Manager", "HR Recruiter"];
    if (forbiddenRoles.includes(requestedRole)) {
      return res.status(403).json({
        message: "Forbidden: public registration may only create Employee accounts",
      });
    }

    const existingUser = await db.collection("users").findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const result = await db.collection("users").insertOne({
      name,
      email,
      password,
      role: "Employee",
      createdAt: new Date(),
    });

    res.json({
      message: "User Registered Successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Registration Failed",
    });
  }
});

// Login User
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({
      email,
      password,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Email or Password",
      });
    }

    res.json({
      message: "Login Successful",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login Failed",
    });
  }
});

// Add Candidate + Resume Upload
app.post(
  "/api/candidates",
  upload.single("resume"),
  async (req, res) => {
    try {
      console.log("FILE RECEIVED:");
      console.log(req.file);

      const { name, email, skill } = req.body;

      const result = await db.collection("candidates").insertOne({
        name,
        email,
        skill,
        resume: req.file ? req.file.filename : null,
        status: "Applied",
        performanceRating: 0,
        createdAt: new Date(),
      });

      res.json({
        message: "Candidate Added Successfully",
        id: result.insertedId,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to Add Candidate",
      });
    }
  }
);

// Get All Candidates
app.get("/api/candidates", async (req, res) => {
  try {
    const candidates = await db
      .collection("candidates")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log("FETCHED CANDIDATES:");
    console.log(candidates);

    res.json(candidates);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to Fetch Candidates",
    });
  }
});
// Backend Check Route
app.get("/api/check", (req, res) => {
  res.json({
    message: "Backend Updated",
  });
});

app.get("/api/stats", async (req, res) => {
  try {
    const totalCandidates = await db
      .collection("candidates")
      .countDocuments();

    const totalResumes = await db
      .collection("candidates")
      .countDocuments({
        resume: { $exists: true, $ne: null },
      });

    const shortlisted = await db
      .collection("candidates")
      .countDocuments({
        status: "Shortlisted",
      });

    const rejected = await db
      .collection("candidates")
      .countDocuments({
        status: "Rejected",
      });

    const interviewsScheduled = await db
      .collection("interviews")
      .countDocuments({
        status: "Scheduled",
      });

    const interviewsCompleted = await db
      .collection("interviews")
      .countDocuments({
        status: "Completed",
      });

    const employeeCount = await db.collection("candidates").countDocuments({ status: "Joined" });

    res.json({
      totalCandidates,
      totalEmployees: employeeCount,
      totalResumes,
      shortlisted,
      rejected,
      interviewsScheduled,
      interviewsCompleted,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to Fetch Stats",
    });
  }
});

app.get("/api/performance-stats", async (req, res) => {
  try {
    const agg = await db.collection("candidates").aggregate([
      { $addFields: { _perf: { $ifNull: ["$performanceRating", 0] } } },
      { $group: { _id: null, average: { $avg: "$_perf" } } },
    ]).toArray();

    const averageRating = agg && agg[0] && agg[0].average ? Number(Number(agg[0].average).toFixed(2)) : 0;
    const top = await db.collection("candidates").find({}).sort({ performanceRating: -1 }).limit(1).toArray();
    const topPerformer = top && top[0] ? { _id: top[0]._id, name: top[0].name, performanceRating: top[0].performanceRating || 0 } : null;

    res.json({ averageRating, topPerformer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch performance stats" });
  }
});

app.post("/api/hr-assistant", async (req, res) => {
  try {
    const { question } = req.body;
    const lowerQuestion = (question || "").toLowerCase();

    if (
      lowerQuestion.includes("shortlisted") ||
      lowerQuestion.includes("shortlist")
    ) {
      const candidates = await db
        .collection("candidates")
        .find({ status: "Shortlisted" })
        .toArray();

      const names = [...new Set(candidates.map((c) => c.name))];
      return res.json({
        answer:
          names.length > 0
            ? `Shortlisted Candidates: ${names.join(", ")}`
            : "No shortlisted candidates found.",
      });
    }

    if (
      lowerQuestion.includes("react") ||
      lowerQuestion.includes("reactjs")
    ) {
      const candidates = await db
        .collection("candidates")
        .find({
          skill: { $regex: "React", $options: "i" },
        })
        .toArray();

      const names = [...new Set(candidates.map((c) => c.name))];
      return res.json({
        answer:
          names.length > 0
            ? `React Candidates: ${names.join(", ")}`
            : "No React candidates found.",
      });
    }

    if (
      lowerQuestion.includes("tomorrow") ||
      lowerQuestion.includes("upcoming")
    ) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const start = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate()
      );
      const end = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate() + 1
      );

      const interviews = await db
        .collection("interviews")
        .find({
          datetime: {
            $gte: start,
            $lt: end,
          },
        })
        .toArray();

      return res.json({
        answer: `You have ${interviews.length} interview(s) tomorrow.`,
      });
    }

    if (
      lowerQuestion.includes("rejected") ||
      lowerQuestion.includes("reject")
    ) {
      const candidates = await db
        .collection("candidates")
        .find({ status: "Rejected" })
        .toArray();

      const names = [...new Set(candidates.map((c) => c.name))];
      return res.json({
        answer:
          names.length > 0
            ? `Rejected Candidates: ${names.join(", ")}`
            : "No rejected candidates found.",
      });
    }

    if (
      lowerQuestion.includes("top candidate") ||
      lowerQuestion.includes("best candidate")
    ) {
      const candidates = await db
        .collection("candidates")
        .find({ status: "Shortlisted" })
        .toArray();

      if (candidates.length === 0) {
        return res.json({
          answer: "No shortlisted candidates found.",
        });
      }

      return res.json({
        answer: `Top Candidate: ${candidates[0].name}`,
      });
    }

    if (lowerQuestion.includes("how many shortlisted")) {
      const count = await db
        .collection("candidates")
        .countDocuments({
          status: "Shortlisted",
        });

      return res.json({
        answer: `Total shortlisted candidates: ${count}`,
      });
    }

    if (lowerQuestion.includes("how many rejected")) {
      const count = await db
        .collection("candidates")
        .countDocuments({
          status: "Rejected",
        });

      return res.json({
        answer: `Total rejected candidates: ${count}`,
      });
    }

    if (
      lowerQuestion.includes("how many employees") ||
      lowerQuestion.includes("employees do we have") ||
      lowerQuestion.includes("total employees")
    ) {
      const count = await db
        .collection("candidates")
        .countDocuments({
          status: "Joined",
        });

      return res.json({
        answer: `Total employees: ${count}`,
      });
    }

    if (
      lowerQuestion.includes("list all employees") ||
      lowerQuestion.includes("list employees") ||
      lowerQuestion.includes("show joined candidates") ||
      lowerQuestion.includes("joined candidates")
    ) {
      const candidates = await db
        .collection("candidates")
        .find({ status: "Joined" })
        .toArray();

      const names = [...new Set(candidates.map((c) => c.name))];
      return res.json({
        answer:
          names.length > 0
            ? `Employees: ${names.join(", ")}`
            : "No joined candidates or employees found.",
      });
    }

    if (lowerQuestion.includes("applied")) {
      const candidates = await db
        .collection("candidates")
        .find({
          $or: [
            { status: "Applied" },
            { status: { $exists: false } },
          ],
        })
        .toArray();

      const names = [...new Set(candidates.map((c) => c.name))];
      return res.json({
        answer:
          names.length > 0
            ? `Applied Candidates: ${names.join(", ")}`
            : "No applied candidates found.",
      });
    }

    res.json({
      answer: "Sorry, I don't understand that question yet.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      answer: "Error processing request",
    });
  }
});

// AI-Powered HR Assistant using Groq
app.post("/api/ai-hr-assistant", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        answer: "Please provide a question",
      });
    }

    // Fetch candidates data for context
    const candidates = await db
      .collection("candidates")
      .find({})
      .toArray();

    // Fetch interviews data for context
    const interviews = await db
      .collection("interviews")
      .find({})
      .toArray();

    // Build context string
    const candidateSummary = candidates.map((c) => ({
      name: c.name,
      email: c.email,
      skill: c.skill,
      status: c.status || "Applied",
    }));

    const interviewSummary = interviews.map((i) => ({
      candidateName: i.candidateName,
      interviewer: i.interviewer,
      datetime: i.datetime,
      status: i.status,
    }));

    const context = `
You are an AI-powered HR Assistant for a recruitment management system. Use the following data to answer HR-related questions:

CANDIDATES (${candidates.length} total):
${JSON.stringify(candidateSummary, null, 2)}

INTERVIEWS (${interviews.length} total):
${JSON.stringify(interviewSummary, null, 2)}

STATISTICS:
- Total Candidates: ${candidates.length}
- Shortlisted: ${candidates.filter((c) => c.status === "Shortlisted").length}
- Rejected: ${candidates.filter((c) => c.status === "Rejected").length}
- Applied: ${candidates.filter((c) => !c.status || c.status === "Applied").length}
- Scheduled Interviews: ${interviews.length}
- Completed Interviews: ${interviews.filter((i) => i.status === "Completed").length}

Answer the following question based on this data:
`;

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: context + question,
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = message.choices[0].message.content;

    res.json({
      answer: answer || "No response generated",
    });
  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({
      answer: "Error processing AI request. Please try again.",
    });
  }
});

// Groq AI Interview Question Generator
app.post("/api/generate-ai-questions", async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || !skills.trim()) {
      return res.status(400).json({
        questions: "Please provide skills.",
      });
    }

    const prompt = `Generate 10 professional interview questions for a candidate with the following skills:

Skills: ${skills}

Requirements:
- Include a mix of beginner, intermediate, and advanced level questions
- Include practical coding questions where relevant
- Return ONLY the numbered questions (1-10)
- Do not include explanations or answers
- Keep each question concise and professional
- Format: 1. Question text?

Generate the questions now:`;

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      temperature: 0.7,
    });

    const questions = message.choices[0].message.content;

    res.json({
      questions: questions || "No questions generated.",
    });
  } catch (error) {
    console.error("Groq Questions Generation Error:", error);
    res.status(500).json({
      questions: "Error generating questions. Fallback to rule-based generation.",
    });
  }
});

// Groq AI Detailed Evaluation
app.post("/api/ai-evaluate-candidate", async (req, res) => {
  try {
    const { candidateSkills, requiredSkills } = req.body;

    if (!candidateSkills || !requiredSkills) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const prompt = `You are an experienced HR recruiter with deep hiring expertise.

Candidate Skills: ${candidateSkills}
Required Skills: ${requiredSkills}

Analyze this candidate thoroughly and respond with ONLY a valid JSON object (no markdown, no extra text):

{
  "matchScore": <0-100>,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "interviewReadiness": "High|Medium|Low",
  "recommendation": "Shortlist|Reject",
  "explanation": "Brief explanation of evaluation"
}

Criteria:
- Match Score: percentage of required skills match + experience level
- Strengths: 2-3 key strengths from their skills
- Weaknesses: 2-3 gaps or missing skills
- Interview Readiness: Can they handle interviews based on skills?
- Recommendation: Should we proceed?
- Explanation: 1-2 sentences about the decision

Return ONLY valid JSON.`;

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 800,
      temperature: 0.5,
    });

    const responseText = message.choices[0].message.content.trim();
    
    // Extract JSON from response
    let jsonText = responseText;
    if (responseText.includes("```json")) {
      jsonText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      jsonText = responseText.split("```")[1].split("```")[0];
    }

    const evaluation = JSON.parse(jsonText.trim());

    res.json({
      matchScore: evaluation.matchScore || 0,
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      interviewReadiness: evaluation.interviewReadiness || "Low",
      recommendation: evaluation.recommendation || "Reject",
      explanation: evaluation.explanation || "",
    });
  } catch (error) {
    console.error("Groq AI Evaluation Error:", error);
    res.status(500).json({
      error: "AI Evaluation unavailable",
    });
  }
});

// Groq AI Resume Screening Evaluation
app.post("/api/ai-score-candidate", async (req, res) => {
  try {
    const { candidateSkills, requiredSkills } = req.body;

    if (!candidateSkills || !requiredSkills) {
      return res.status(400).json({
        score: 0,
        strengths: [],
        missingSkills: [],
        recommendation: "Reject",
      });
    }

    const prompt = `You are an expert HR recruiter evaluating a candidate.

Candidate Skills: ${candidateSkills}
Required Skills: ${requiredSkills}

Please analyze the candidate's fit and respond with ONLY a valid JSON object (no markdown, no explanation) with these exact fields:

{
  "score": <0-100 number>,
  "strengths": [<list of candidate's strong points>],
  "missingSkills": [<list of missing required skills>],
  "recommendation": "<Shortlist or Reject>"
}

Guidelines:
- Score 80+: Excellent fit - Shortlist
- Score 60-79: Good fit - Consider
- Score below 60: Poor fit - Reject
- Be objective and data-driven
- Focus on skill matching and relevance
- Return valid JSON only`;

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 600,
      temperature: 0.5,
    });

    const responseText = message.choices[0].message.content.trim();
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = responseText;
    if (responseText.includes("```json")) {
      jsonText = responseText.split("```json")[1].split("```")[0];
    } else if (responseText.includes("```")) {
      jsonText = responseText.split("```")[1].split("```")[0];
    }

    const evaluation = JSON.parse(jsonText.trim());

    res.json({
      score: evaluation.score || 0,
      strengths: evaluation.strengths || [],
      missingSkills: evaluation.missingSkills || [],
      recommendation: evaluation.recommendation || "Reject",
      matched: evaluation.strengths || [],
      missing: evaluation.missingSkills || [],
      isAI: true,
    });
  } catch (error) {
    console.error("Groq AI Scoring Error:", error);
    res.status(500).json({
      error: "Groq AI scoring failed",
    });
  }
});

const questionPool = {
  react: [
    "Explain React Hooks and their lifecycle.",
    "What is Virtual DOM? How does React use it?",
    "Difference between state and props in React.",
    "What are controlled and uncontrolled components?",
    "Explain the concept of React Context API.",
    "How do you optimize React performance?",
    "What is JSX? Why do we use it?",
    "Explain React fragments and their use cases.",
    "What are React keys and why are they important?",
    "Explain the React reconciliation algorithm.",
  ],
  javascript: [
    "Difference between let, var, and const.",
    "Explain closures in JavaScript.",
    "What is event delegation?",
    "Explain async/await and Promises.",
    "What is hoisting in JavaScript?",
    "Difference between '==' and '===' operators.",
    "Explain the 'this' keyword in JavaScript.",
    "What are arrow functions? How are they different from regular functions?",
    "Explain callback functions and callback hell.",
    "What is the prototype chain in JavaScript?",
  ],
  mongodb: [
    "Explain MongoDB indexing and its types.",
    "What is aggregation in MongoDB?",
    "Difference between SQL and NoSQL databases.",
    "How does MongoDB handle transactions?",
    "Explain sharding in MongoDB.",
    "What are MongoDB query operators?",
    "Explain the concept of embedding vs referencing in MongoDB.",
    "What is the MongoDB connection string?",
    "How do you optimize MongoDB queries?",
    "Explain MongoDB replication.",
  ],
  nodejs: [
    "What is the event loop in Node.js?",
    "Explain middleware in Express.js.",
    "What is npm? Explain package.json.",
    "Difference between synchronous and asynchronous code.",
    "What are streams in Node.js?",
    "Explain clustering in Node.js.",
    "What is the difference between require() and import?",
    "Explain callback functions in Node.js.",
    "What are environment variables? How do you use them?",
    "Explain REST API principles.",
  ],
  html: [
    "What is semantic HTML? Give examples.",
    "Explain the difference between div and span.",
    "What are HTML5 new features?",
    "Explain data attributes in HTML.",
    "What is the purpose of the meta tag?",
    "Explain the difference between block and inline elements.",
    "What is canvas in HTML5?",
    "Explain form validation in HTML5.",
    "What are HTML5 APIs?",
    "Explain accessibility in HTML.",
  ],
  css: [
    "Explain CSS flexbox and its properties.",
    "What is CSS Grid? How is it different from flexbox?",
    "Explain CSS specificity.",
    "What are CSS pseudo-classes and pseudo-elements?",
    "Explain CSS media queries.",
    "What is CSS Box Model?",
    "Explain CSS positioning (static, relative, absolute, fixed).",
    "What are CSS preprocessors like SASS?",
    "Explain CSS transitions and animations.",
    "What is CSS cascade and inheritance?",
  ],
  java: [
    "Explain Object-Oriented Programming concepts.",
    "What is the difference between abstract class and interface?",
    "Explain exception handling in Java.",
    "What are Java streams?",
    "Explain Java collections framework.",
    "What is multithreading in Java?",
    "Explain the 'this' and 'super' keywords.",
    "What is Java reflection?",
    "Explain garbage collection in Java.",
    "What are design patterns? Give examples.",
  ],
  python: [
    "Explain list comprehensions in Python.",
    "What is the difference between list and tuple?",
    "Explain decorators in Python.",
    "What are lambda functions?",
    "Explain generators and yield keyword.",
    "What is the difference between == and 'is'?",
    "Explain Python virtual environments.",
    "What are Python packages and modules?",
    "Explain exception handling in Python.",
    "What is Python GIL (Global Interpreter Lock)?",
  ],
  oops: [
    "What are the four pillars of OOP?",
    "Difference between Abstraction and Encapsulation?",
    "What is Polymorphism? Explain with examples.",
    "Explain method overloading and method overriding.",
    "What is the difference between class and object?",
    "Explain inheritance and its types.",
    "What is a constructor? How is it different from a method?",
    "Explain the concept of super() and this().",
    "What are access modifiers? Explain public, private, protected.",
    "Explain the concept of static variables and methods.",
  ],
  sql: [
    "Difference between INNER JOIN and LEFT JOIN?",
    "How to find the second highest salary in a table?",
    "What is a subquery? Give an example.",
    "Difference between GROUP BY and HAVING?",
    "What is the difference between UNION and UNION ALL?",
    "Explain the difference between DELETE and TRUNCATE.",
    "What is a PRIMARY KEY and FOREIGN KEY?",
    "Explain the concept of indexing in SQL.",
    "What are aggregate functions in SQL?",
    "Write a query to find duplicate records in a table.",
  ],
  dbms: [
    "What is normalization? Explain different normal forms.",
    "Difference between Primary Key and Foreign Key?",
    "What are ACID properties in a database?",
    "Explain the concept of transactions.",
    "What is denormalization? When do we use it?",
    "Difference between RDBMS and NoSQL databases?",
    "What is a deadlock in DBMS?",
    "Explain the concept of locking and concurrency control.",
    "What are views in a database?",
    "Explain the difference between hot backup and cold backup.",
  ],
  machinelearning: [
    "Difference between Classification and Regression?",
    "What is Overfitting? How do you prevent it?",
    "Explain Logistic Regression and its use cases.",
    "What is the difference between supervised and unsupervised learning?",
    "Explain the concept of cross-validation.",
    "What is feature scaling? Why is it important?",
    "Explain the confusion matrix and its metrics.",
    "What is the difference between precision and recall?",
    "Explain K-Means clustering algorithm.",
    "What is a decision tree? Explain its advantages and disadvantages.",
  ],
  datastructures: [
    "Difference between Array and Linked List?",
    "What is the time complexity of Binary Search?",
    "Explain Stack and Queue with real-world examples.",
    "What is a Binary Search Tree? Explain its properties.",
    "Difference between DFS and BFS traversal?",
    "Explain the concept of hashing and hash tables.",
    "What is a priority queue?",
    "Explain the concept of recursion and give an example.",
    "What is the time complexity of different sorting algorithms?",
    "Explain the concept of dynamic programming.",
  ],
};

app.post("/api/generate-interview-questions", async (req, res) => {
  try {
    const { skills } = req.body;

    if (!skills || skills.trim().length === 0) {
      return res.json({
        questions: [],
        message: "Please enter skills to generate questions.",
      });
    }

    const skillArray = skills
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);

    const generatedQuestions = [];
    const questionsSet = new Set();

    skillArray.forEach((skill) => {
      const poolQuestions = questionPool[skill] || [];

      if (poolQuestions.length > 0) {
        const shuffled = poolQuestions.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 2);

        selectedQuestions.forEach((q) => {
          questionsSet.add(q);
        });
      }
    });

    let finalQuestions = Array.from(questionsSet);

    if (finalQuestions.length === 0) {
      finalQuestions = [
        "Tell me about your experience with the skills you mentioned.",
        "What projects have you worked on using these technologies?",
        "Explain your understanding of these technologies.",
      ];
    } else if (finalQuestions.length < 5) {
      const genericQuestions = [
        "How do you approach learning new technologies?",
        "Describe a challenging project you worked on.",
        "What are your strengths in software development?",
      ];

      const remaining = 5 - finalQuestions.length;
      finalQuestions = [
        ...finalQuestions,
        ...genericQuestions.slice(0, remaining),
      ];
    } else if (finalQuestions.length > 5) {
      finalQuestions = finalQuestions.slice(0, 5);
    }

    res.json({
      questions: finalQuestions,
      message: "Interview questions generated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      questions: [],
      message: "Failed to generate questions",
    });
  }
});

app.post("/api/score-candidate", async (req, res) => {
  try {
    const { candidateSkills, requiredSkills } = req.body;

    const candidateArray = candidateSkills
      .split(",")
      .map(skill => skill.trim().toLowerCase());

    const requiredArray = requiredSkills
      .split(",")
      .map(skill => skill.trim().toLowerCase());

    const matched = [];
    const missing = [];

    requiredArray.forEach((requiredSkill) => {
      const found = candidateArray.some((candidateSkill) =>
        candidateSkill.includes(requiredSkill) ||
        requiredSkill.includes(candidateSkill)
      );

      if (found) {
        matched.push(requiredSkill);
      } else {
        missing.push(requiredSkill);
      }
    });

    const score =
      requiredArray.length > 0
        ? Math.round((matched.length / requiredArray.length) * 100)
        : 0;

    res.json({
      score,
      matched,
      missing,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Scoring Failed",
    });
  }
});
app.put("/api/candidates/:id/status", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const { id } = req.params;
    const { status } = req.body;
    const userRole = (req.headers["x-user-role"] || "").trim();

    const allowedStatuses = [
      "Applied",
      "Shortlisted",
      "Rejected",
      "Interview Scheduled",
      "Interview Completed",
      "Selected",
      "Joined",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (userRole === "Management Admin") {
      // full access
    } else if (userRole === "HR Recruiter") {
      if (
        ![
          "Shortlisted",
          "Rejected",
          "Interview Scheduled",
          "Interview Completed",
          "Selected",
          "Joined",
        ].includes(status)
      ) {
        return res.status(403).json({ message: "Forbidden: insufficient role to update this status" });
      }
    } else {
      return res.status(403).json({ message: "Forbidden: insufficient role to update status" });
    }

    const result = await db.collection("candidates").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          status,
        },
      }
    );

    res.json({
      message: "Status Updated Successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Status Update Failed",
    });
  }
});
app.delete("/api/candidates/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    await db.collection("candidates").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.json({
      message: "Candidate Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete Failed",
    });
  }
});

// Interviews: create, list, delete
app.post("/api/interviews", async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      candidateEmail,
      interviewer,
      datetime,
      duration,
      notes,
    } = req.body;
    // If candidateEmail not provided, try to lookup candidate by candidateId
    let emailToSend = candidateEmail;
    let nameToUse = candidateName;

    if ((!emailToSend || emailToSend.trim() === "") && candidateId) {
      try {
        const { ObjectId } = require("mongodb");
        const candidate = await db.collection("candidates").findOne({ _id: new ObjectId(candidateId) });
        if (candidate) {
          emailToSend = candidate.email || emailToSend;
          nameToUse = nameToUse || candidate.name;
        }
      } catch (lookupErr) {
        console.error("Candidate lookup failed:", lookupErr);
      }
    }

    const result = await db.collection("interviews").insertOne({
      candidateId,
      candidateName: nameToUse || candidateName || null,
      candidateEmail: emailToSend || null,
      interviewer,
      datetime: new Date(datetime),
      duration: duration || 30,
      notes: notes || null,
      status: "Scheduled",
      createdAt: new Date(),
    });

    // Attempt to send interview email if we have an email address
    let emailSent = false;
    if (emailToSend) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: emailToSend,
          subject: "Interview Invitation - SmartRecruit AI",
          html: `
            <p>Dear ${nameToUse || "Candidate"},</p>
            <p>Congratulations!</p>
            <p>Your interview has been scheduled.</p>
            <p><strong>Interviewer:</strong> ${interviewer}</p>
            <p><strong>Date & Time:</strong> ${new Date(datetime).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${duration || 30} minutes</p>
            <p>Please join on time.</p>
            <p>Regards,<br/>SmartRecruit AI HR Team</p>
          `,
        });

        emailSent = true;
        console.log("Interview email sent");
      } catch (mailErr) {
        emailSent = false;
        console.error("Email error", mailErr);
        // Do not fail the interview creation if email fails
      }
    }

    const responseMessage = emailSent
      ? "Interview scheduled and email sent."
      : "Interview scheduled but email could not be sent.";

    res.json({
      message: responseMessage,
      id: result.insertedId,
      emailSent,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to Schedule Interview",
    });
  }
});

app.get("/api/interviews", async (req, res) => {
  try {
    const interviews = await db
      .collection("interviews")
      .find({})
      .sort({ datetime: 1 })
      .toArray();

    res.json(interviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
});

app.delete("/api/interviews/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    await db.collection("interviews").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.json({ message: "Interview deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete interview" });
  }
});

app.put("/api/interviews/:id/status", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const { status } = req.body;

    await db.collection("interviews").updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: {
          status,
        },
      }
    );

    res.json({
      message: "Interview Status Updated",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to Update Status",
    });
  }
});

app.post("/api/generate-questions", async (req, res) => {
  try {
    const { skills } = req.body;

    const prompt = `
Generate 10 technical interview questions for a candidate.

Skills:
${skills}

Rules:
- Return only interview questions
- Number them
- Focus on technical concepts
- Keep them suitable for software engineering interviews
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({
      questions: response,
    });
  } catch (error) {
    console.error(error);

    const { skills } = req.body;
    let fallbackQuestions = "";

    if (skills.toLowerCase().includes("sql")) {
      fallbackQuestions = `
1. What is a Primary Key?
2. What is a Foreign Key?
3. Explain SQL Joins (INNER, LEFT, RIGHT, FULL).
4. Difference between DELETE and TRUNCATE.
5. What is Normalization? Explain different normal forms.
6. What is an Index? Explain indexing types.
7. Explain ACID Properties.
8. What is a Subquery? Give an example.
9. Difference between WHERE and HAVING.
10. Explain Transactions and their properties.
`;
    } else if (skills.toLowerCase().includes("mongodb")) {
      fallbackQuestions = `
1. What is MongoDB?
2. Explain the difference between SQL and NoSQL.
3. What is a collection in MongoDB?
4. What is a document in MongoDB?
5. Explain MongoDB indexing.
6. What is aggregation in MongoDB?
7. Explain sharding in MongoDB.
8. What is replication in MongoDB?
9. Difference between embedding and referencing.
10. How do you perform transactions in MongoDB?
`;
    } else if (skills.toLowerCase().includes("react")) {
      fallbackQuestions = `
1. What is React?
2. Explain the Virtual DOM.
3. What are React Hooks?
4. Explain useState and useEffect.
5. What is JSX?
6. Difference between state and props.
7. What is a component in React?
8. Explain controlled and uncontrolled components.
9. What is the React Context API?
10. How do you optimize React performance?
`;
    } else {
      fallbackQuestions = `
1. Explain Object-Oriented Programming concepts.
2. What is Polymorphism?
3. What is Inheritance?
4. Difference between Array and Linked List.
5. Explain Time Complexity and Big O notation.
6. What is a Database Index?
7. What is REST API?
8. Difference between Authentication and Authorization.
9. Explain MVC Architecture.
10. What are Design Patterns? Give examples.
`;
    }

    res.json({
      questions: fallbackQuestions,
    });
  }
});

app.get("/api/export-candidates", async (req, res) => {
  try {
    const candidates = await db
      .collection("candidates")
      .find({})
      .toArray();

    const parser = new Parser();
    const csv = parser.parse(candidates);

    res.header("Content-Type", "text/csv");
    res.attachment("candidates.csv");
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export candidates" });
  }
});

// Start Server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Update candidate performance rating
app.put("/api/candidates/:id/rating", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const { id } = req.params;
    const { rating } = req.body;

    // Simple role-based access control via header 'x-user-role'
    const userRole = (req.headers["x-user-role"] || "").trim();
    if (!["Management Admin", "HR Recruiter"].includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient role to update rating" });
    }

    const numeric = Number(rating);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 5) {
      return res.status(400).json({ message: "Invalid rating. Must be a number between 0 and 5." });
    }

    await db.collection("candidates").updateOne(
      { _id: new ObjectId(id) },
      { $set: { performanceRating: numeric } }
    );

    res.json({ message: "Performance rating updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update rating" });
  }
});

// Performance statistics API
app.get("/api/performance-stats", async (req, res) => {
  try {
    // Compute average rating (treat missing as 0)
    const agg = await db.collection("candidates").aggregate([
      { $addFields: { _perf: { $ifNull: ["$performanceRating", 0] } } },
      { $group: { _id: null, average: { $avg: "$_perf" } } },
    ]).toArray();

    const averageRating = agg && agg[0] && agg[0].average ? Number(Number(agg[0].average).toFixed(2)) : 0;

    // Find top performer (highest performanceRating). If multiple, pick first.
    const top = await db.collection("candidates").find({}).sort({ performanceRating: -1 }).limit(1).toArray();
    const topPerformer = top && top[0] ? { _id: top[0]._id, name: top[0].name, performanceRating: top[0].performanceRating || 0 } : null;

    res.json({ averageRating, topPerformer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch performance stats" });
  }
});