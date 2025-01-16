import BlogPostDocument from "../documents/blog-post-document";
import BlogPost from "../interfaces/i-blog-post";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToBlogPost = (doc: BlogPostDocument): BlogPost => {
  return mapDocument(doc) as BlogPost;
};

export const mapDocumentsToBlogPosts = (docs: BlogPostDocument[]): BlogPost[] => {
  return mapDocuments(docs) as BlogPost[];
};