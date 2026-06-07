import { useState } from "react";

function CandidateCard({
  candidate,
  scoreResult,
  userRole,
  onScoreCandidate,
  onUpdateStatus,
  onDeleteCandidate,
  onUpdateRating,
}) {
  const [selectedRating, setSelectedRating] = useState(candidate.performanceRating ?? 0);
  const isEmployee = candidate.status === "Joined";
  const statusColor =
    candidate.status === "Shortlisted"
      ? "green"
      : candidate.status === "Rejected"
      ? "red"
      : candidate.status === "Interview Scheduled"
      ? "#1d4ed8"
      : candidate.status === "Interview Completed"
      ? "#0ea5e9"
      : candidate.status === "Selected"
      ? "#8b5cf6"
      : candidate.status === "Joined"
      ? "#14b8a6"
      : "orange";

  return (
    <div
      style={{
        border: "1px solid #253242",
        padding: "15px",
        marginBottom: "8px",
        borderRadius: "10px",
        background: "transparent",
      }}
    >
      <h3 style={{ margin: "0 0 6px 0" }}>{candidate.name}</h3>
      <p style={{ margin: "0 0 6px 0", fontSize: "13px" }}>{candidate.email}</p>
      <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#444" }}>{candidate.skill}</p>
      <p style={{ margin: 0 }}>
        <strong>Status:</strong>{" "}
        <span style={{ color: statusColor, fontWeight: "bold" }}>
          {candidate.status || "Applied"}
        </span>
      </p>
      {isEmployee && (
        <div
          style={{
            marginTop: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 8px",
            borderRadius: "999px",
            backgroundColor: "#0f766e",
            color: "#ecfccb",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          <span>👨‍💼</span>
          <span>Employee</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px", flexWrap: "wrap" }}>
        {(userRole === "Management Admin" || userRole === "HR Recruiter") && (
          <button
            onClick={() => onScoreCandidate(candidate._id, candidate.skill)}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              padding: "6px 10px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            🔵 Score
          </button>
        )}

        {(userRole === "Management Admin" || userRole === "HR Recruiter") && (
          <>
            <button
              onClick={() => onUpdateStatus(candidate._id, "Shortlisted")}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              🟢 Shortlist
            </button>

            <button
              onClick={() => onUpdateStatus(candidate._id, "Rejected")}
              style={{
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              🔴 Reject
            </button>

            <button
              onClick={() => onUpdateStatus(candidate._id, "Interview Scheduled")}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              📅 Interview Scheduled
            </button>

            <button
              onClick={() => onUpdateStatus(candidate._id, "Interview Completed")}
              style={{
                backgroundColor: "#0ea5e9",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ✅ Interview Completed
            </button>

            <button
              onClick={() => onUpdateStatus(candidate._id, "Selected")}
              style={{
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              ⭐ Selected
            </button>

            <button
              onClick={() => onUpdateStatus(candidate._id, "Joined")}
              style={{
                backgroundColor: "#14b8a6",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              👨‍💼 Joined
            </button>
          </>
        )}

        {userRole === "Management Admin" && (
          <button
            onClick={() => onDeleteCandidate(candidate._id)}
            style={{
              backgroundColor: "#fff",
              color: "#111",
              border: "1px solid #ddd",
              padding: "6px 10px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ⚪ Delete
          </button>
        )}

        {candidate.resume && (
          <a
            href={`http://localhost:5000/uploads/${candidate.resume}`}
            target="_blank"
            rel="noreferrer"
            style={{ marginLeft: "6px", fontSize: "13px" }}
          >
            📄 View Resume
          </a>
        )}
      </div>

      <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
          <strong>Performance Rating:</strong> {candidate.performanceRating ?? 0}
        </div>

        {(userRole === "Management Admin" || userRole === "HR Recruiter") && (
          <>
            <select value={selectedRating} onChange={(e) => setSelectedRating(Number(e.target.value))} style={{ padding: "6px", borderRadius: "6px" }}>
              <option value={0}>0 Stars</option>
              <option value={1}>1 Star</option>
              <option value={2}>2 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={5}>5 Stars</option>
            </select>

            <button
              onClick={() => onUpdateRating && onUpdateRating(candidate._id, selectedRating)}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Update Rating
            </button>
          </>
        )}
      </div>

      {scoreResult && (
        <div
          style={{
            marginTop: "12px",
            padding: "15px",
            border: "1px solid #475569",
            borderRadius: "10px",
            backgroundColor: "#1e293b",
            color: "#ffffff",
            lineHeight: "1.7",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <h4
              style={{
                margin: "0",
                color:
                  scoreResult.score >= 80
                    ? "#4ade80"
                    : scoreResult.score >= 60
                    ? "#facc15"
                    : "#f87171",
              }}
            >
              Match Score: {scoreResult.score}%
            </h4>
          </div>

          {scoreResult.recommendation && (
            <p style={{ margin: "8px 0", fontSize: "14px", fontWeight: "bold", color: scoreResult.recommendation === "Shortlist" ? "#4ade80" : scoreResult.recommendation === "Consider" ? "#facc15" : "#f87171" }}>
              📋 Recommendation: {scoreResult.recommendation}
            </p>
          )}

          {scoreResult.strengths && scoreResult.strengths.length > 0 && (
            <p style={{ margin: "8px 0 0 0", color: "#e2e8f0" }}>
              <strong>✅ Strengths:</strong> {Array.isArray(scoreResult.strengths) ? scoreResult.strengths.join(", ") : scoreResult.strengths}
            </p>
          )}

          <p style={{ margin: "8px 0 0 0", color: scoreResult.missingSkills && scoreResult.missingSkills.length > 0 ? "#f87171" : "#cbd5e1" }}>
            <strong>{scoreResult.missingSkills && scoreResult.missingSkills.length > 0 ? "❌ Missing Skills:" : "✓ All Skills Matched:"}</strong> {scoreResult.missingSkills && scoreResult.missingSkills.length > 0 ? (Array.isArray(scoreResult.missingSkills) ? scoreResult.missingSkills.join(", ") : scoreResult.missingSkills) : "None"}
          </p>

          {scoreResult.matched && scoreResult.matched.length > 0 && !scoreResult.strengths && (
            <p style={{ margin: "8px 0 0 0", color: "#cbd5e1" }}>
              <strong>Matched Skills:</strong> {scoreResult.matched.join(", ")}
            </p>
          )}

          {scoreResult.aiEvaluation && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                border: "1px solid #334155",
                borderRadius: "10px",
                backgroundColor: "#111827",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, color: "#60a5fa" }}>
                  🤖 AI Evaluation (Powered by Groq)
                </h4>
                <span style={{ fontSize: "12px", backgroundColor: "#2563eb", padding: "4px 8px", borderRadius: "4px", color: "#ffffff" }}>
                  Groq
                </span>
              </div>

              {scoreResult.aiEvaluation.error ? (
                <p style={{ margin: 0, color: "#f87171" }}>AI Evaluation unavailable</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 10px 0", color: "#cbd5e1" }}>
                    <strong>Match Score:</strong> {scoreResult.aiEvaluation.matchScore}%
                  </p>

                  {scoreResult.aiEvaluation.recommendation && (
                    <p style={{ margin: "0 0 10px 0", color: "#e2e8f0" }}>
                      <strong>Recommendation:</strong> {scoreResult.aiEvaluation.recommendation}
                    </p>
                  )}

                  {scoreResult.aiEvaluation.interviewReadiness && (
                    <p style={{ margin: "0 0 10px 0", color: "#cbd5e1" }}>
                      <strong>Interview Readiness:</strong> {scoreResult.aiEvaluation.interviewReadiness}
                    </p>
                  )}

                  {scoreResult.aiEvaluation.strengths && scoreResult.aiEvaluation.strengths.length > 0 && (
                    <p style={{ margin: "0 0 10px 0", color: "#9ae6b4" }}>
                      <strong>Strengths:</strong> {scoreResult.aiEvaluation.strengths.join(", ")}
                    </p>
                  )}

                  {scoreResult.aiEvaluation.weaknesses && scoreResult.aiEvaluation.weaknesses.length > 0 && (
                    <p style={{ margin: "0 0 10px 0", color: "#fda4af" }}>
                      <strong>Weaknesses:</strong> {scoreResult.aiEvaluation.weaknesses.join(", ")}
                    </p>
                  )}

                  {scoreResult.aiEvaluation.explanation && (
                    <p style={{ margin: 0, color: "#cbd5e1" }}>
                      <strong>Explanation:</strong> {scoreResult.aiEvaluation.explanation}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CandidateCard;
