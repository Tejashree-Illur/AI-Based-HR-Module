function DashboardStats({ stats }) {
  const cards = [
    { title: "Candidates", value: stats.totalCandidates, color: "#3498db" },
    { title: "Employees", value: stats.totalEmployees ?? 0, color: "#3182ce" },
    { title: "Resumes", value: stats.totalResumes, color: "#16a085" },
    { title: "Shortlisted", value: stats.shortlisted, color: "#2ecc71" },
    { title: "Rejected", value: stats.rejected, color: "#e74c3c" },
    { title: "Interview Scheduled", value: stats.interviewsScheduled, color: "#f39c12" },
    { title: "Interview Completed", value: stats.interviewsCompleted, color: "#9b59b6" },
    { title: "Average Rating", value: stats.averageRating ?? 0, color: "#f6ad55" },
    { title: "🏆 Top Performer", value: stats.topPerformer ?? null, color: "#2b6cb0" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        marginTop: "20px",
        marginBottom: "30px",
        flexWrap: "wrap",
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            background: "white",
            borderTop: `5px solid ${card.color}`,
            padding: "20px",
            borderRadius: "12px",
            minWidth: "180px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-4px)";
            e.target.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }}
        >
          <h3 style={{ color: "#555", margin: "0 0 10px 0", fontSize: "14px" }}>
            {card.title}
          </h3>
          <h2 style={{ color: card.color, margin: "0", fontSize: "32px" }}>
            {card.title === "🏆 Top Performer" ? (
              card.value ? (
                `${card.value.name} ${"⭐".repeat(card.value.performanceRating || 0)}`
              ) : (
                "No Ratings Yet"
              )
            ) : (
              card.value
            )}
          </h2>
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
