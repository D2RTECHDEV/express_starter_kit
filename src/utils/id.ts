/**
 * Generate user id
 * @param {number} size
 * @returns {Promise<string>}
 */
export const generateUserID = async (size: number): Promise<string> => {
  const di = await import("@oslojs/encoding");
  const buffer = crypto.getRandomValues(new Uint8Array(size));
  return di.encodeBase32LowerCaseNoPadding(buffer);
};
