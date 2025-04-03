declare module 'upload-post' {
  export interface UploadOptions {
    /** Video title */
    title: string;
    /** User identifier */
    user: string;
    /** Array of target platforms */
    platforms: string[];
  }

  /**
   * Upload-Post API client
   */
  export class UploadPost {
    /**
     * @param apiKey - Your API key from Upload-Post
     */
    constructor(apiKey: string);

    /**
     * Upload video to social media platforms
     * @param videoPath - Path to video file
     * @param options - Upload options
     * @returns Promise with API response
     */
    upload(videoPath: string, options: UploadOptions): Promise<object>;
  }
}
