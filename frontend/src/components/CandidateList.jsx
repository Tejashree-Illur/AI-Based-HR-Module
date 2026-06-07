import CandidateCard from "./CandidateCard";

function CandidateList({
  candidates,
  filterStatus,
  search,
  scoreResults,
  userRole,
  onScoreCandidate,
  onUpdateStatus,
  onDeleteCandidate,
  onUpdateRating,
}) {
  const filteredCandidates = candidates.filter((candidate) => {
    const statusMatch =
      filterStatus === "All"
        ? true
        : (candidate.status || "Applied") === filterStatus;
    const searchMatch = candidate.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    const scoreA = scoreResults[a._id]?.score ?? -1;
    const scoreB = scoreResults[b._id]?.score ?? -1;

    if (scoreA === scoreB) {
      return a.name.localeCompare(b.name);
    }

    return scoreB - scoreA;
  });

  if (sortedCandidates.length === 0) {
    return <p>No candidates found.</p>;
  }

  return (
    <>
      {sortedCandidates.map((candidate) => (
        <CandidateCard
          key={candidate._id}
          candidate={candidate}
          scoreResult={scoreResults[candidate._id]}
          userRole={userRole}
          onScoreCandidate={onScoreCandidate}
          onUpdateStatus={onUpdateStatus}
          onDeleteCandidate={onDeleteCandidate}
          onUpdateRating={onUpdateRating}
        />
      ))}
    </>
  );
}

export default CandidateList;
