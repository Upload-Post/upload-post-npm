declare module 'upload-post' {
  export interface UploadOptions {
    /** Video title */
    title: string;
    /** User identifier */
    user: string;
    /** Array of target platforms. Supported: tiktok, instagram, linkedin, youtube, facebook, twitter, threads, pinterest */
    platforms: string[];
    /** The video file to upload (can be a file upload or a video URL) */
    video?: string; // Already handled by videoPath parameter, but good to have for consistency if API supports 'video' form field directly for URLs

    // TikTok specific
    privacy_level?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';
    disable_duet?: boolean;
    disable_comment?: boolean; // Note: also a common param for photos on TikTok
    disable_stitch?: boolean;
    cover_timestamp?: number;
    brand_content_toggle?: boolean;
    brand_organic?: boolean;
    branded_content?: boolean; // Note: also a common param for photos on TikTok
    brand_organic_toggle?: boolean;
    is_aigc?: boolean;

    // Instagram specific
    media_type?: 'REELS' | 'STORIES'; // Note: also a param for photos, but with different values
    share_to_feed?: boolean;
    collaborators?: string; // Comma-separated list
    cover_url?: string;
    audio_name?: string;
    user_tags?: string; // Comma-separated list
    location_id?: string;
    thumb_offset?: string;

    // LinkedIn specific
    description?: string; // Note: also a common param for photos on TikTok & FB videos
    visibility?: 'CONNECTIONS' | 'PUBLIC' | 'LOGGED_IN' | 'CONTAINER'; // Note: different values than photo visibility
    target_linkedin_page_id?: string; // Note: also a param for photos

    // YouTube specific
    // description?: string; // Already listed under LinkedIn, will be used if provided
    tags?: string[];
    categoryId?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    embeddable?: boolean;
    license?: 'youtube' | 'creativeCommon';
    publicStatsViewable?: boolean;
    madeForKids?: boolean;

    // Facebook specific
    facebook_page_id?: string; // Note: also a param for photos
    // description?: string; // Already listed under LinkedIn
    video_state?: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

    // Threads specific
    // description?: string; // Already listed under LinkedIn

    // X (Twitter) specific
    tagged_user_ids?: string[];
    reply_settings?: 'following' | 'mentionedUsers' | 'everyone';
    nullcast?: boolean;
    place_id?: string;
    poll_duration?: number; // in minutes
    poll_options?: string[];
    poll_reply_settings?: 'following' | 'mentionedUsers' | 'everyone';

    // Pinterest specific
    pinterest_board_id?: string; // Note: also a param for photos
    pinterest_link?: string; // Note: also a param for photos
    pinterest_cover_image_url?: string;
    pinterest_cover_image_content_type?: string;
    pinterest_cover_image_data?: string; // Base64 encoded
    pinterest_cover_image_key_frame_time?: number; // in milliseconds
  }

  export interface UploadPhotosOptions {
    /** User identifier */
    user: string;
    /** Array of target platforms. Supported: tiktok, instagram, linkedin, facebook, x, threads, pinterest */
    platforms: string[];
    /** Array of photo file paths or URLs */
    photos: string[];
    /** Title of the post */
    title: string;
    /** Caption/description for the photos (this will be used as the post commentary) */
    caption?: string;

    // LinkedIn specific
    /** Visibility setting for the LinkedIn post (accepted value: "PUBLIC") */
    visibility?: 'PUBLIC';
    /** LinkedIn page ID to upload photos to an organization */
    target_linkedin_page_id?: string;

    // Facebook specific
    /** Facebook Page ID where the photos will be posted */
    facebook_page_id?: string;

    // TikTok specific
    /** Automatically add background music to photos */
    auto_add_music?: boolean;
    /** Disable comments on the post */
    disable_comment?: boolean;
    /** Indicate if the post is branded content (requires disclose_commercial=true) */
    branded_content?: boolean;
    /** Disclose the commercial nature of the post (used with branded_content) */
    disclose_commercial?: boolean;
    /** Index (starting at 0) of the photo to use as the cover/thumbnail for the TikTok photo post */
    photo_cover_index?: number;
    /** Description for the TikTok post. If not provided, the title value will be used by default. */
    description?: string;

    // Instagram specific
    /** Type of media ("IMAGE" or "STORIES") */
    media_type?: 'IMAGE' | 'STORIES';

    // Pinterest specific
    /** Pinterest board ID to publish the photo to. */
    pinterest_board_id?: string;
    /** Alt text for the image. */
    pinterest_alt_text?: string;
    /** Destination link for the photo Pin. */
    pinterest_link?: string;
  }

  export interface UploadTextOptions {
    /** User identifier */
    user: string;
    /** Array of target platforms. Supported: linkedin, x, facebook, threads */
    platforms: ('linkedin' | 'x' | 'facebook' | 'threads')[];
    /** The text content for the post. This will be used as the 'title' parameter for all supported platforms. */
    title: string;

    // LinkedIn specific
    /** LinkedIn page ID to upload text to an organization's page. */
    target_linkedin_page_id?: string;

    // Facebook specific
    /** Facebook Page ID where the text will be posted. Required if 'facebook' is in platforms. */
    facebook_page_id?: string;

    // X (Twitter) and Threads do not have additional specific parameters beyond 'title' for the text content.
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

    /**
     * Upload photos to social media platforms
     * @param photos - Array of photo file paths or URLs
     * @param options - Upload photos options
     * @returns Promise with API response
     */
    uploadPhotos(photos: string[], options: UploadPhotosOptions): Promise<object>;

    /**
     * Upload text posts to social media platforms
     * @param options - Upload text options
     * @returns Promise with API response
     */
    uploadText(options: UploadTextOptions): Promise<object>;
  }
}
