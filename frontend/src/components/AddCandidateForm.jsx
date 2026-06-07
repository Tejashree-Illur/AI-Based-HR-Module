function AddCandidateForm({
  candidateName,
  candidateEmail,
  candidateSkill,
  onNameChange,
  onEmailChange,
  onSkillChange,
  onResumeChange,
  onAddCandidate,
}) {
  return (
    <>
      <input
        type="text"
        placeholder="Candidate Name"
        value={candidateName}
        onChange={onNameChange}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "10px",
          display: "block",
        }}
      />
      <input
        type="email"
        placeholder="Candidate Email"
        value={candidateEmail}
        onChange={onEmailChange}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "10px",
          display: "block",
        }}
      />
      <input
        type="text"
        placeholder="Skill"
        value={candidateSkill}
        onChange={onSkillChange}
        style={{
          width: "300px",
          padding: "10px",
          marginBottom: "10px",
          display: "block",
        }}
      />
      <input
        type="file"
        accept=".pdf"
        onChange={onResumeChange}
        style={{
          marginBottom: "15px",
          display: "block",
        }}
      />
      <button onClick={onAddCandidate}>Add Candidate</button>
    </>
  );
}

export default AddCandidateForm;
