import { useState } from "react";

function HRAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState("rule"); // "rule" or "ai"

  const askAssistant = async () => {
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        assistantMode === "rule"
          ? "http://localhost:5000/api/hr-assistant"
          : "http://localhost:5000/api/ai-hr-assistant";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      setAnswer(data.answer || "No answer returned.");
    } catch (error) {
      console.error(error);
      alert("Assistant Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <h2>Ask HR Assistant</h2>

      {/* Mode Toggle */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
        <button
          onClick={() => setAssistantMode("rule")}
          style={{
            padding: "8px 16px",
            backgroundColor: assistantMode === "rule" ? "#3b82f6" : "#e5e7eb",
            color: assistantMode === "rule" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: assistantMode === "rule" ? "bold" : "normal",
            transition: "all 0.2s",
          }}
        >
          📋 Rule-Based Assistant
        </button>
        <button
          onClick={() => setAssistantMode("ai")}
          style={{
            padding: "8px 16px",
            backgroundColor: assistantMode === "ai" ? "#3b82f6" : "#e5e7eb",
            color: assistantMode === "ai" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: assistantMode === "ai" ? "bold" : "normal",
            transition: "all 0.2s",
          }}
        >
          🤖 AI Assistant (Groq)
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question, e.g. Show shortlisted candidates"
          style={{ width: "400px", padding: "10px" }}
        />
        <button onClick={askAssistant} disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>

      {assistantMode === "ai" && (
        <p style={{ marginTop: "12px", fontSize: "13px", color: "#666" }}>
          💡 Tip: AI Assistant uses Groq LLM to answer questions based on your recruitment data.
        </p>
      )}

      {answer && (
        <div style={{ marginTop: "16px", background: "#1e293b", border: "1px solid #475569", padding: "15px", borderRadius: "10px", color: "#ffffff", lineHeight: "1.7" }}>
          <strong>
            {assistantMode === "rule" ? "📋 Rule-Based Answer:" : "🤖 AI Answer:"}
          </strong>
          <p style={{ marginTop: "12px", whiteSpace: "pre-wrap" }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default HRAssistant;
