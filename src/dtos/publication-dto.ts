import DocumentStatus from "../enums/document-status";
import PublicationType from "../enums/publication-type";
import PublicationStatus from "../enums/publication-status";
import { VersionDto } from "./base-dto";

interface PublicationAuthorDto {
  name: string;
  isMe?: boolean; 
}

export interface ActivationPublicationDto {
  status: DocumentStatus;
}

export interface CreatePublicationDto {
  type: PublicationType;
	year: number;
	title: string;
	description: string; // any related detail
  source: string; // journal name of an article / book name of a book chapter / event and location of a conference
	authors: PublicationAuthorDto[]; // authors list
	publicationStatus: PublicationStatus;
	tags: string[]; // ex: Q1 / Q2 / Best paper 
	publicationUrl: string; // publication url
	pdfUrl: string; // pdf url
	doiUrl: string; // doi url
	arxivUrl: string; // arXiv url
	bibtex: string;
}

export interface UpdatePublicationDto extends CreatePublicationDto, VersionDto {
}
