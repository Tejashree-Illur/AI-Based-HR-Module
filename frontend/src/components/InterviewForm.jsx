import { useState } from "react";

function InterviewForm({ candidates = [], onSchedule }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const candidateId = form.candidateId.value;
    const selectedOption = form.candidateId.selectedOptions[0];
    const selectedCandidateName = selectedOption && selectedOption.dataset.name;
    const selectedCandidateEmail = selectedOption && selectedOption.dataset.email;

    // If manual entry (empty value), read manual name/email inputs
    const manualName = form.candidateName && form.candidateName.value;
    const manualEmail = form.candidateEmail && form.candidateEmail.value;

    const candidateName = (candidateId === "" ? manualName : selectedCandidateName) || "";
    const candidateEmail = candidateId === "" ? (manualEmail || "") : (selectedCandidateEmail || "");

    const interviewer = form.interviewer.value;
    const datetime = form.datetime.value;
    const duration = form.duration.value;
    const notes = form.notes.value;

    onSchedule({
      candidateId,
      candidateName,
      candidateEmail,
      interviewer,
      datetime,
      duration,
      notes,
    });

    form.reset();
    setSelectedCandidateId("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "20px", marginBottom: "20px" }}>
      <h3>Schedule Interview</h3>
      <label>
        Candidate:
        <select
          name="candidateId"
          value={selectedCandidateId}
          onChange={(e) => setSelectedCandidateId(e.target.value)}
          style={{ display: "block", marginBottom: "8px" }}
        >
          <option value="">-- New / Manual Entry --</option>
          {candidates.map((c) => (
            <option key={c._id} value={c._id} data-name={c.name} data-email={c.email}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
      </label>

      {selectedCandidateId === "" && (
        <>
          <label>
            Candidate Name:
            <input name="candidateName" required style={{ display: "block", marginBottom: "8px", width: "300px" }} />
          </label>

          <label>
            Candidate Email:
            <input name="candidateEmail" type="email" required style={{ display: "block", marginBottom: "8px", width: "300px" }} />
          </label>
        </>
      )}

      <label>
        Interviewer:
        <input name="interviewer" required style={{ display: "block", marginBottom: "8px", width: "300px" }} />
      </label>
      <label>
        Date & Time:
        <input name="datetime" type="datetime-local" required style={{ display: "block", marginBottom: "8px", width: "300px" }} />
      </label>
      <label>
        Duration (minutes):
        <input name="duration" type="number" defaultValue={30} style={{ display: "block", marginBottom: "8px", width: "120px" }} />
      </label>
      <label>
        Notes:
        <textarea name="notes" style={{ display: "block", marginBottom: "8px", width: "400px", height: "80px" }} />
      </label>
      <button type="submit">Schedule</button>
    </form>
  );
}

export default InterviewForm;
