function InterviewList({ interviews = [], userRole, onDeleteInterview, onUpdateStatus }) {
  if (!interviews || interviews.length === 0) {
    return <p>No interviews scheduled.</p>;
  }

  return (
    <div style={{ marginTop: "10px" }}>
      {interviews.map((interview) => (
        <div key={interview._id} style={{ border: "1px solid #253242", padding: "12px", marginBottom: "8px", borderRadius: "8px", background: "transparent" }}>
          <strong style={{ display: "block", marginBottom: "6px" }}>{interview.candidateName || interview.candidateId}</strong>
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>Interviewer: {interview.interviewer}</div>
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>Date: {new Date(interview.datetime).toLocaleString()}</div>
          <div style={{ fontSize: "13px", marginBottom: "6px" }}>Duration: {interview.duration} minutes</div>
          <div>
            <strong>Status:</strong>{" "}
            <span style={{ color: interview.status === "Completed" ? "green" : "orange", fontWeight: "bold" }}>
              {interview.status || "Scheduled"}
            </span>
          </div>
          {interview.notes && <div style={{ marginTop: "6px" }}>Notes: {interview.notes}</div>}

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            {(userRole === "Management Admin" || userRole === "HR Recruiter") && (
              <button onClick={() => onDeleteInterview(interview._id)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>🗑 Delete</button>
            )}
            {(userRole === "Management Admin" || userRole === "Senior Manager" || userRole === "HR Recruiter") && (
              <button
                onClick={() => onUpdateStatus(interview._id, "Completed")}
                style={{ padding: "6px 10px", borderRadius: "8px", border: "none", background: "#10b981", color: "white", cursor: "pointer" }}
              >
                ✅ Complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default InterviewList;
