import { DEFAULT_LOCALE, LANG_EN, LANG_SI, LOCALE_EN, LOCALE_SI } from "../constants/common-vars";
import BlogPostDocument from "../documents/blog-post-document";
import BlogPost from "../interfaces/i-blog-post";
import BlogPostView from "../interfaces/i-blog-post-view";
import { capitalizeLang } from "../utils/common-util";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToBlogPost = (doc: BlogPostDocument): BlogPost => {
  return mapDocument(doc) as BlogPost;
};

export const mapDocumentsToBlogPosts = (docs: BlogPostDocument[]): BlogPost[] => {
  return mapDocuments(docs) as BlogPost[];
};

export const mapDocumentToBlogPostView = (lang: string, doc: BlogPostDocument): BlogPostView => {
  const blogPostView = mapDocument(doc) as BlogPostView & Record<string, any>;

  const langSuffix = capitalizeLang(lang);

  // Assign language-specific fields
  blogPostView.title = blogPostView[`title${langSuffix}`];
  blogPostView.summary = blogPostView[`summary${langSuffix}`];
  blogPostView.content = blogPostView[`content${langSuffix}`];
  blogPostView.pageDescription = blogPostView[`pageDescription${langSuffix}`];

  const locale = lang === LANG_SI ? LOCALE_SI : lang === LANG_EN ? LOCALE_EN : DEFAULT_LOCALE;

  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(blogPostView.dateTime));

  const formattedTime = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  }).format(new Date(blogPostView.dateTime));

  blogPostView.formattedDate = formattedDate;
  blogPostView.formattedTime = formattedTime;

  // Remove unnecessary fields
  delete blogPostView[`title${langSuffix}`];
  delete blogPostView[`summary${langSuffix}`];
  delete blogPostView[`content${langSuffix}`];
  delete blogPostView[`pageDescription${langSuffix}`];

  return blogPostView;
};

export const mapDocumentsToBlogPostViews = (lang: string, docs: BlogPostDocument[]): BlogPostView[] => {
  return docs.map((doc) => mapDocumentToBlogPostView(lang, doc));
};