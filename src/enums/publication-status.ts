enum PublicationStatus {
  PUBLISHED = 'PUBLISHED', // The final version has been published in a journal, conference, or book.
  ACCEPTED = 'ACCEPTED', // The paper has been accepted but not yet published (in press).
  IN_REVIEW = 'IN_REVIEW', // The paper has been submitted and is currently under peer review.
  PREPRINT = 'PREPRINT', // The paper has been uploaded to a preprint server (e.g., arXiv) before review.
}

export default PublicationStatus;
