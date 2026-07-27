import { getCacheStrategy } from "../cache/cache-factory";
import logger from "../config/logger-config";
import { SUMMARY_STATS_KEY } from "../constants/common-vars";
import { SummaryStats, WeightedLabelValueStat } from "../interfaces/i-stat";
import AwardModel from "../models/award-model";
import BookModel from "../models/book-model";
import CourseModel from "../models/course-model";
import PublicationModel from "../models/publication-model";
import ResearchModel from "../models/research-model";

const SUMMARY_STATS_CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

type StatLabel = "books" | "publications" | "research" | "awards" | "courses";

const STAT_WEIGHTS: Record<StatLabel, number> = {
  books: 3,
  publications: 2,
  research: 2,
  awards: 1,
  courses: 1,
};

export const getSummaryStats = async (): Promise<SummaryStats> => {
  const cache = getCacheStrategy();
  const cached = await cache.get<SummaryStats>(SUMMARY_STATS_KEY);
  if (cached) return cached;

  logger.info('No cache summary stat data found, hitting db to get summary stats');

  const notDeleted = { deleted: false };

  const jobs = {
    books: BookModel.countDocuments(notDeleted),
    publications: PublicationModel.countDocuments(notDeleted),
    research: ResearchModel.countDocuments(notDeleted),
    awards: AwardModel.countDocuments(notDeleted),
    courses: CourseModel.countDocuments(notDeleted),
  };

  const keys = Object.keys(jobs) as Array<keyof typeof jobs>;
  const results = await Promise.allSettled(Object.values(jobs));

  const counts: Record<string, number | null> = {};
  results.forEach((res, i) => {
    const label = keys[i];
    counts[label] = res.status === "fulfilled" ? res.value : null;
    if (res.status === "rejected") {
      logger.error(`Stats: ${label} failed`, res.reason);
    }
  });

  const stats: WeightedLabelValueStat[] = keys
    .filter((label) => counts[label] !== null)
    .map((label) => ({
      label,
      value: counts[label] as number,
      weight: STAT_WEIGHTS[label] ?? 0,
    }));

  const result: SummaryStats = { stats };
  await cache.set(SUMMARY_STATS_KEY, result, SUMMARY_STATS_CACHE_TTL_SECONDS);

  return result;
}
