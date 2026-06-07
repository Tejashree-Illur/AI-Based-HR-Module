import { useState } from "react";

function InterviewQuestionGenerator() {
  const [skills, setSkills] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generateQuestions = async () => {
    if (!skills.trim()) {
      setMessage("Please enter at least one skill.");
      return;
    }

    setLoading(true);
    setMessage("");
    setQuestions([]);

    try {
      // Try Groq AI endpoint first
      const response = await fetch(
        "http://localhost:5000/api/generate-ai-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ skills }),
        }
      );

      if (!response.ok) {
        throw new Error("Groq API failed, using fallback");
      }

      const data = await response.json();
      const responseText = data.questions || "";
      const questionLines = responseText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      setQuestions(questionLines);
      setMessage(questionLines.length > 0 ? "✨ AI Questions generated using Groq!" : "No questions generated.");
    } catch (error) {
      console.error("Groq generation failed, falling back to rule-based:", error);
      
      // Fallback to existing rule-based generation
      try {
        const fallbackResponse = await fetch(
          "http://localhost:5000/api/generate-questions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ skills }),
          }
        );

        const fallbackData = await fallbackResponse.json();
        const responseText = fallbackData.questions || "";
        const questionLines = responseText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        setQuestions(questionLines);
        setMessage(questionLines.length > 0 ? "📋 Questions generated using rule-based system (Groq unavailable)" : "No questions generated.");
      } catch (fallbackError) {
        console.error(fallbackError);
        setMessage("Failed to generate questions. Please try again.");
        setQuestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSkills("");
    setQuestions([]);
    setMessage("");
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <h2>AI Interview Question Generator</h2>
      <div style={{ marginBottom: "16px" }}>
        <label>
          Enter Skills (comma-separated):
          <br />
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g., React, JavaScript, MongoDB"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "8px",
              boxSizing: "border-box",
            }}
          />
        </label>
        {/* <small style={{ display: "block", marginTop: "4px", color: "#666" }}>
          Supported: React, JavaScript, MongoDB, Node.js, HTML, CSS, Java, Python, OOPs, SQL, DBMS, Machine Learning, Data Structures
        </small> */}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <button
          onClick={generateQuestions}
          disabled={loading}
          style={{ padding: "10px 20px" }}
        >
          {loading ? "Generating..." : "Generate Questions"}
        </button>
        <button
          onClick={handleClear}
          style={{ padding: "10px 20px", background: "#666" }}
        >
          Clear
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "15px",
            marginBottom: "16px",
            background: "#1e293b",
            borderRadius: "10px",
            border: "1px solid #475569",
            color: "#e0e7ff",
          }}
        >
          {message}
        </div>
      )}

      {questions.length > 0 && (
        <div
          style={{
            background: "#1e293b",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #475569",
            color: "#ffffff",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#ffffff" }}>Interview Questions:</h3>
          <ol style={{ lineHeight: "1.7", paddingLeft: "20px" }}>
            {questions.map((question, index) => (
              <li key={index} style={{ marginBottom: "12px", color: "#ffffff" }}>
                {question}
              </li>
            ))}
          </ol>
          <button
            onClick={() => {
              const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
              navigator.clipboard.writeText(questionsText);
              alert("Questions copied to clipboard!");
            }}
            style={{ marginTop: "16px", padding: "10px 16px", backgroundColor: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
          >
            📋 Copy Questions
          </button>
        </div>
      )}
    </div>
  );
}

export default InterviewQuestionGenerator;
