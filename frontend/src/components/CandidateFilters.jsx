function CandidateFilters({
  requiredSkills,
  onRequiredSkillsChange,
  filterStatus,
  onFilterStatusChange,
  search,
  onSearchChange,
}) {
  return (
    <>
      <input
        type="text"
        placeholder="Required Skills (React, JavaScript, MongoDB)"
        value={requiredSkills}
        onChange={onRequiredSkillsChange}
        style={{
          width: "400px",
          padding: "10px",
          marginBottom: "15px",
          display: "block",
        }}
      />
      <select
        value={filterStatus}
        onChange={onFilterStatusChange}
        style={{
          padding: "10px",
          marginBottom: "15px",
        }}
      >
        <option value="All">All Candidates</option>
        <option value="Applied">Applied</option>
        <option value="Shortlisted">Shortlisted</option>
        <option value="Rejected">Rejected</option>
      </select>
      <input
        type="text"
        placeholder="Search Candidate"
        value={search}
        onChange={onSearchChange}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "15px",
          display: "block",
        }}
      />
    </>
  );
}

export default CandidateFilters;
