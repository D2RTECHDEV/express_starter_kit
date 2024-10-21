import { nanoid } from "nanoid";

/**
 * Generate user id
 * @param {number} size
 * @returns {Promise<string>}
 */
export const generateUserID = (size: number): string => {
  return nanoid(size);
};
