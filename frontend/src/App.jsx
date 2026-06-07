import { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import DashboardStats from "./components/DashboardStats";
import AddCandidateForm from "./components/AddCandidateForm";
import CandidateFilters from "./components/CandidateFilters";
import CandidateList from "./components/CandidateList";
import InterviewForm from "./components/InterviewForm";
import InterviewList from "./components/InterviewList";
import HRAssistant from "./components/HRAssistant";
import InterviewQuestionGenerator from "./components/InterviewQuestionGenerator";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateSkill, setCandidateSkill] = useState("");
  const [resume, setResume] = useState(null);

  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalResumes: 0,
    shortlisted: 0,
    rejected: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
  });
  const [requiredSkills, setRequiredSkills] = useState("");
  const [scoreResults, setScoreResults] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [interviews, setInterviews] = useState([]);

  const fetchCandidates = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/candidates");
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/stats");
      const data = await response.json();
      // Also fetch performance stats
      try {
        const perfResp = await fetch("http://localhost:5000/api/performance-stats", {
          headers: { "x-user-role": user?.role || "" },
        });
        if (perfResp.ok) {
          const perfData = await perfResp.json();
          setStats({ ...data, ...perfData });
        } else {
          setStats(data);
        }
      } catch (e) {
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCandidates();
      fetchStats();
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/interviews");
      const data = await response.json();
      setInterviews(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loginUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Login Failed");
    }
  };

  const registerUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      alert(data.message);

      if (response.ok) {
        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("");
      }
    } catch (error) {
      console.error(error);
      alert("Registration Failed");
    }
  };

  const addCandidate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", candidateName);
      formData.append("email", candidateEmail);
      formData.append("skill", candidateSkill);
      if (resume) {
        formData.append("resume", resume);
      }

      const response = await fetch("http://localhost:5000/api/candidates", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      alert(data.message);
      setCandidateName("");
      setCandidateEmail("");
      setCandidateSkill("");
      setResume(null);
      fetchCandidates();
      fetchStats();
    } catch (error) {
      console.error(error);
      alert("Failed to Add Candidate");
    }
  };

  const scoreCandidate = async (candidateId, candidateSkills) => {
    try {
      // Calculate the existing rule-based score first
      const scoreResponse = await fetch("http://localhost:5000/api/score-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidateSkills, requiredSkills }),
      });

      const scoreData = await scoreResponse.json();
      const baseScoreResult = {
        score: scoreData.score,
        matched: scoreData.matched || [],
        missingSkills: scoreData.missing || [],
        recommendation:
          scoreData.score >= 80
            ? "Shortlist"
            : scoreData.score >= 60
            ? "Consider"
            : "Reject",
        isAI: false,
      };

      setScoreResults((prev) => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          ...baseScoreResult,
          aiEvaluation: prev[candidateId]?.aiEvaluation || null,
        },
      }));

      // Then ask Groq for the AI evaluation summary
      const aiResponse = await fetch("http://localhost:5000/api/ai-evaluate-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidateSkills, requiredSkills }),
      });

      if (!aiResponse.ok) {
        setScoreResults((prev) => ({
          ...prev,
          [candidateId]: {
            ...prev[candidateId],
            ...baseScoreResult,
            aiEvaluation: { error: "AI Evaluation unavailable" },
          },
        }));
        return;
      }

      const aiData = await aiResponse.json();
      if (aiData.error) {
        setScoreResults((prev) => ({
          ...prev,
          [candidateId]: {
            ...prev[candidateId],
            ...baseScoreResult,
            aiEvaluation: { error: "AI Evaluation unavailable" },
          },
        }));
        return;
      }

      setScoreResults((prev) => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          ...baseScoreResult,
          aiEvaluation: {
            matchScore: aiData.matchScore,
            strengths: aiData.strengths || [],
            weaknesses: aiData.weaknesses || [],
            interviewReadiness: aiData.interviewReadiness || "Low",
            recommendation: aiData.recommendation || "Reject",
            explanation: aiData.explanation || "",
            error: null,
          },
        },
      }));
    } catch (error) {
      console.error("Score Candidate Error:", error);
      setScoreResults((prev) => ({
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          aiEvaluation: { error: "AI Evaluation unavailable" },
        },
      }));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/candidates/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      alert(data.message);
      fetchCandidates();
      fetchStats();
    } catch (error) {
      console.error(error);
      alert("Failed to Update Status");
    }
  };

  const deleteCandidate = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/candidates/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      alert(data.message);
      fetchCandidates();
      fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  const updateRating = async (id, rating) => {
    try {
      const response = await fetch(`http://localhost:5000/api/candidates/${id}/rating`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
        },
        body: JSON.stringify({ rating }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to update rating");
        return;
      }

      alert(data.message || "Rating updated");
      fetchCandidates();
      fetchStats();
    } catch (error) {
      console.error(error);
      alert("Failed to update rating");
    }
  };

  const createInterview = async (payload) => {
    try {
      const response = await fetch("http://localhost:5000/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (typeof data.emailSent === "boolean") {
        if (data.emailSent) {
          alert("Interview scheduled and email sent.");
        } else {
          alert("Interview scheduled but email could not be sent.");
        }
      } else {
        alert(data.message || "Interview scheduled");
      }
      fetchInterviews();
    } catch (error) {
      console.error(error);
      alert("Failed to schedule interview");
    }
  };

  const deleteInterview = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/interviews/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      alert(data.message || "Interview deleted");
      fetchInterviews();
    } catch (error) {
      console.error(error);
    }
  };

  const updateInterviewStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/interviews/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      alert(data.message);
      fetchInterviews();
      fetchStats();
    } catch (error) {
      console.error(error);
    }
  };

  const sectionStyle = {
    background: "#0b1220",
    color: "#e5e7eb",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 2px 14px rgba(2,6,23,0.6)",
    marginBottom: "25px",
  };

  const buttonStyle = {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  };

  const containerStyle = {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  };

  if (user) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "100vh",
          padding: "30px 20px",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "40px", textAlign: "center", color: "white" }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "42px" }}>
              ✨ SmartRecruit AI
            </h1>
            <p style={{ margin: "0", fontSize: "18px", opacity: 0.95 }}>
              AI-Powered Recruitment Management System
            </p>
            <div style={{ marginTop: "15px", fontSize: "16px", opacity: 0.9 }}>
              <span>Welcome, <strong>{user.name}</strong></span>
              <span style={{ marginLeft: "15px" }}>👤 Role: <strong>{user.role}</strong></span>
            </div>
          </div>

          {/* Dashboard Stats - Management Admin and Senior Manager only */}
          {(user.role === "Management Admin" || user.role === "Senior Manager") && (
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                📊 Recruitment Pipeline
              </h3>
              <DashboardStats stats={stats} />
            </div>
          )}

          {/* Add Candidate Section - Management Admin and HR Recruiter only */}
          {(user.role === "Management Admin" || user.role === "HR Recruiter") && (
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                ➕ Add Candidate
              </h3>
              <AddCandidateForm
                candidateName={candidateName}
                candidateEmail={candidateEmail}
                candidateSkill={candidateSkill}
                onNameChange={(e) => setCandidateName(e.target.value)}
                onEmailChange={(e) => setCandidateEmail(e.target.value)}
                onSkillChange={(e) => setCandidateSkill(e.target.value)}
                onResumeChange={(e) => setResume(e.target.files[0])}
                onAddCandidate={addCandidate}
              />
            </div>
          )}

          {/* AI Tools Side by Side - Management Admin, Senior Manager, and HR Recruiter */}
          {(user.role === "Management Admin" || user.role === "Senior Manager" || user.role === "HR Recruiter") && (
            <div style={containerStyle}>
              <div style={{ ...sectionStyle, flex: 1, minWidth: "300px" }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                  💬 HR Assistant
                </h3>
                <HRAssistant />
              </div>
              {(user.role === "Management Admin" || user.role === "HR Recruiter") && (
                <div style={{ ...sectionStyle, flex: 1, minWidth: "300px" }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                    🤖 Interview Questions
                  </h3>
                  <InterviewQuestionGenerator />
                </div>
              )}
            </div>
          )}

          {/* Resume Screening Section - Management Admin and HR Recruiter only */}
          {(user.role === "Management Admin" || user.role === "HR Recruiter") && (
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                🔍 AI Resume Screening
              </h3>
              <CandidateFilters
                requiredSkills={requiredSkills}
                onRequiredSkillsChange={(e) => setRequiredSkills(e.target.value)}
                filterStatus={filterStatus}
                onFilterStatusChange={(e) => setFilterStatus(e.target.value)}
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Schedule Interview Section - Management Admin and HR Recruiter only */}
          {(user.role === "Management Admin" || user.role === "HR Recruiter") && (
            <div style={sectionStyle}>
              <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                📅 Schedule Interview
              </h3>
              <InterviewForm candidates={candidates} onSchedule={createInterview} />
            </div>
          )}

          {/* Candidate List and Interviews (Collapsible feel) */}
          <div style={containerStyle}>
              <div style={{ ...sectionStyle, flex: 1, minWidth: "300px" }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                  👥 Candidate List
                </h3>
                <div style={{ maxHeight: "700px", overflowY: "auto", paddingRight: "6px" }}>
                  <CandidateList
                    candidates={candidates}
                    filterStatus={filterStatus}
                    search={search}
                    scoreResults={scoreResults}
                    userRole={user.role}
                    onScoreCandidate={scoreCandidate}
                    onUpdateStatus={updateStatus}
                    onDeleteCandidate={deleteCandidate}
                    onUpdateRating={updateRating}
                  />
                </div>
              </div>
            <div style={{ ...sectionStyle, flex: 1, minWidth: "300px" }}>
              <h3 style={{ margin: "0 0 20px 0", color: "#e5e7eb", fontSize: "18px" }}>
                🎯 Interview Schedule
              </h3>
              <div style={{ maxHeight: "700px", overflowY: "auto", paddingRight: "6px" }}>
                <InterviewList
                  interviews={interviews}
                  userRole={user.role}
                  onDeleteInterview={deleteInterview}
                  onUpdateStatus={updateInterviewStatus}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "20px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            {(user.role === "Management Admin" || user.role === "Senior Manager") && (
              <button
                onClick={() => {
                  window.open("http://localhost:5000/api/export-candidates");
                }}
                style={{ ...buttonStyle, backgroundColor: "#10b981" }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
              >
                📥 Export CSV
              </button>
            )}
            <button
              onClick={() => setUser(null)}
              style={{ ...buttonStyle, backgroundColor: "#ef4444" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#dc2626")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#ef4444")}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoginForm
      name={name}
      email={email}
      password={password}
      role={role}
      isRegister={isRegister}
      onNameChange={(e) => setName(e.target.value)}
      onEmailChange={(e) => setEmail(e.target.value)}
      onPasswordChange={(e) => setPassword(e.target.value)}
      onRoleChange={(e) => setRole(e.target.value)}
      onToggleRegister={() => setIsRegister((prev) => !prev)}
      onSubmit={isRegister ? registerUser : loginUser}
    />
  );
}

export default App;
