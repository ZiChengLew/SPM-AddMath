import { TRACKER_DEFAULT_USER_ID } from './config';
import {
  deleteResult as deleteResultFromRepo,
  getResultById as getResultByIdFromRepo,
  listRecommendations as listRecommendationsFromRepo,
  listResults as listResultsFromRepo,
  upsertResult as upsertResultInRepo
} from './repository';
import type { RecommendationSet, ResultRecord, ResultUpsertPayload } from './types';

/**
 * Legacy compatibility wrapper. Calls now delegate to the Postgres-backed repository.
 * Prefer importing from `repository.ts` directly for new code.
 */
export const trackerStore = {
  async listResults(userId = TRACKER_DEFAULT_USER_ID): Promise<ResultRecord[]> {
    return listResultsFromRepo(userId);
  },
  async getResultById(resultId: string, userId = TRACKER_DEFAULT_USER_ID): Promise<ResultRecord | null> {
    return getResultByIdFromRepo(userId, resultId);
  },
  async upsertResult(payload: ResultUpsertPayload): Promise<ResultRecord> {
    return upsertResultInRepo(payload);
  },
  async deleteResult(resultId: string, userId = TRACKER_DEFAULT_USER_ID): Promise<boolean> {
    return deleteResultFromRepo(userId, resultId);
  },
  async listRecommendations(userId = TRACKER_DEFAULT_USER_ID): Promise<RecommendationSet[]> {
    return listRecommendationsFromRepo(userId);
  }
};
