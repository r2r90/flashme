/**
 * Response from presigned URL generation.
 */
export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

/**
 * Public URL response.
 */
export interface PublicUrlResponse {
  publicUrl: string;
}
