declare module 'upload-post' {
  // ==================== Common Types ====================

  /** Supported platforms for video upload */
  export type VideoPlatform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'facebook' | 'pinterest' | 'threads' | 'bluesky' | 'x';

  /** Supported platforms for photo upload */
  export type PhotoPlatform = 'tiktok' | 'instagram' | 'linkedin' | 'facebook' | 'pinterest' | 'threads' | 'reddit' | 'bluesky' | 'x';

  /** Supported platforms for text upload */
  export type TextPlatform = 'x' | 'linkedin' | 'facebook' | 'threads' | 'reddit' | 'bluesky';

  /** TikTok privacy levels */
  export type TikTokPrivacyLevel = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY';

  /** TikTok post modes */
  export type TikTokPostMode = 'DIRECT_POST' | 'MEDIA_UPLOAD';

  /** Instagram media types for video */
  export type InstagramVideoMediaType = 'REELS' | 'STORIES';

  /** Instagram media types for photos */
  export type InstagramPhotoMediaType = 'IMAGE' | 'STORIES';

  /** YouTube privacy status */
  export type YouTubePrivacyStatus = 'public' | 'unlisted' | 'private';

  /** YouTube license */
  export type YouTubeLicense = 'youtube' | 'creativeCommon';

  /** LinkedIn visibility */
  export type LinkedInVisibility = 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN' | 'CONTAINER';

  /** Facebook video state */
  export type FacebookVideoState = 'PUBLISHED' | 'DRAFT';

  /** Facebook media type */
  export type FacebookMediaType = 'REELS' | 'STORIES' | 'VIDEO';

  /** X (Twitter) reply settings */
  export type XReplySettings = 'everyone' | 'following' | 'mentionedUsers' | 'subscribers' | 'verified';

  // ==================== Common Options ====================

  export interface CommonUploadOptions {
    /** Post title/caption. Required for YouTube, Reddit, and text posts. Optional for TikTok, Instagram, Facebook, LinkedIn, X, Threads, Bluesky, Pinterest. */
    title?: string;
    /** User identifier (profile name) */
    user: string;
    /** First comment to post after publishing */
    firstComment?: string;
    /** Alt text for accessibility */
    altText?: string;
    /** ISO date for scheduling (e.g., "2024-12-25T10:00:00Z") */
    scheduledDate?: string;
    /** Timezone for scheduled date (e.g., "Europe/Madrid") */
    timezone?: string;
    /** Add to posting queue instead of immediate post */
    addToQueue?: boolean;
    /** Process upload asynchronously (default: true) */
    asyncUpload?: boolean;

    // Platform-specific title overrides
    blueskyTitle?: string;
    instagramTitle?: string;
    facebookTitle?: string;
    tiktokTitle?: string;
    linkedinTitle?: string;
    xTitle?: string;
    youtubeTitle?: string;
    pinterestTitle?: string;
    threadsTitle?: string;

    // Platform-specific description overrides
    description?: string;
    linkedinDescription?: string;
    youtubeDescription?: string;
    facebookDescription?: string;
    tiktokDescription?: string;
    pinterestDescription?: string;

    // Platform-specific first comment overrides
    instagramFirstComment?: string;
    facebookFirstComment?: string;
    xFirstComment?: string;
    threadsFirstComment?: string;
    youtubeFirstComment?: string;
    redditFirstComment?: string;
    blueskyFirstComment?: string;
  }

  // ==================== TikTok Options ====================

  export interface TikTokVideoOptions {
    /** Privacy setting */
    tiktokPrivacyLevel?: TikTokPrivacyLevel;
    /** Disable duet */
    tiktokDisableDuet?: boolean;
    /** Disable comments */
    tiktokDisableComment?: boolean;
    /** Disable stitch */
    tiktokDisableStitch?: boolean;
    /** Timestamp in ms for video cover */
    tiktokCoverTimestamp?: number;
    /** AI-generated content flag */
    tiktokIsAigc?: boolean;
    /** Post mode */
    tiktokPostMode?: TikTokPostMode;
    /** Branded content toggle */
    brandContentToggle?: boolean;
    /** Brand organic toggle */
    brandOrganicToggle?: boolean;
  }

  export interface TikTokPhotoOptions {
    /** Auto add music */
    tiktokAutoAddMusic?: boolean;
    /** Disable comments */
    tiktokDisableComment?: boolean;
    /** Index of photo for cover (0-based) */
    tiktokPhotoCoverIndex?: number;
    /** Branded content toggle */
    brandContentToggle?: boolean;
    /** Brand organic toggle */
    brandOrganicToggle?: boolean;
  }

  // ==================== Instagram Options ====================

  export interface InstagramVideoOptions {
    /** Media type */
    instagramMediaType?: InstagramVideoMediaType;
    /** Share to feed */
    instagramShareToFeed?: boolean;
    /** Comma-separated collaborator usernames */
    instagramCollaborators?: string;
    /** Custom cover URL */
    instagramCoverUrl?: string;
    /** Audio track name */
    instagramAudioName?: string;
    /** Comma-separated user tags */
    instagramUserTags?: string;
    /** Location ID */
    instagramLocationId?: string;
    /** Thumbnail offset */
    instagramThumbOffset?: string;
  }

  export interface InstagramPhotoOptions {
    /** Media type */
    instagramMediaType?: InstagramPhotoMediaType;
    /** Comma-separated collaborator usernames */
    instagramCollaborators?: string;
    /** Comma-separated user tags */
    instagramUserTags?: string;
    /** Location ID */
    instagramLocationId?: string;
  }

  // ==================== YouTube Options ====================

  export interface YouTubeOptions {
    /** Video tags */
    youtubeTags?: string | string[];
    /** Category ID (e.g., "22" for People & Blogs) */
    youtubeCategoryId?: string;
    /** Privacy status */
    youtubePrivacyStatus?: YouTubePrivacyStatus;
    /** Allow embedding */
    youtubeEmbeddable?: boolean;
    /** Video license */
    youtubeLicense?: YouTubeLicense;
    /** Show public stats */
    youtubePublicStatsViewable?: boolean;
    /** Custom thumbnail URL */
    youtubeThumbnailUrl?: string;
    /** Made for kids flag (COPPA) */
    youtubeSelfDeclaredMadeForKids?: boolean;
    /** AI/synthetic content flag */
    youtubeContainsSyntheticMedia?: boolean;
    /** Title/description language (BCP-47) */
    youtubeDefaultLanguage?: string;
    /** Audio language (BCP-47) */
    youtubeDefaultAudioLanguage?: string;
    /** Comma-separated allowed country codes */
    youtubeAllowedCountries?: string;
    /** Comma-separated blocked country codes */
    youtubeBlockedCountries?: string;
    /** Paid product placement flag */
    youtubeHasPaidProductPlacement?: boolean;
    /** Recording date (ISO 8601) */
    youtubeRecordingDate?: string;
  }

  // ==================== LinkedIn Options ====================

  export interface LinkedInOptions {
    /** Visibility setting */
    linkedinVisibility?: LinkedInVisibility;
    /** Page ID for organization posts */
    targetLinkedinPageId?: string;
  }

  // ==================== Facebook Options ====================

  export interface FacebookVideoOptions {
    /** Facebook Page ID */
    facebookPageId?: string;
    /** Video state */
    facebookVideoState?: FacebookVideoState;
    /** Media type */
    facebookMediaType?: FacebookMediaType;
    /** Thumbnail URL for normal page videos (only when facebookMediaType is 'VIDEO') */
    thumbnailUrl?: string;
  }

  export interface FacebookPhotoOptions {
    /** Facebook Page ID */
    facebookPageId?: string;
  }

  export interface FacebookTextOptions {
    /** Facebook Page ID */
    facebookPageId?: string;
    /** URL to attach as link preview */
    facebookLinkUrl?: string;
  }

  // ==================== Pinterest Options ====================

  export interface PinterestVideoOptions {
    /** Board ID */
    pinterestBoardId?: string;
    /** Destination link */
    pinterestLink?: string;
    /** Cover image URL */
    pinterestCoverImageUrl?: string;
    /** Cover image content type */
    pinterestCoverImageContentType?: string;
    /** Base64-encoded cover image data */
    pinterestCoverImageData?: string;
    /** Key frame time in ms for cover */
    pinterestCoverImageKeyFrameTime?: number;
  }

  export interface PinterestPhotoOptions {
    /** Board ID */
    pinterestBoardId?: string;
    /** Alt text */
    pinterestAltText?: string;
    /** Destination link */
    pinterestLink?: string;
  }

  // ==================== X (Twitter) Options ====================

  export interface XBaseOptions {
    /** Who can reply */
    xReplySettings?: XReplySettings;
    /** Promoted-only post */
    xNullcast?: boolean;
    /** Geographic place ID */
    xGeoPlaceId?: string;
    /** Exclusive for super followers */
    xForSuperFollowersOnly?: boolean;
    /** Community ID */
    xCommunityId?: string;
    /** Share community post with followers */
    xShareWithFollowers?: boolean;
    /** Direct message deep link */
    xDirectMessageDeepLink?: string;
    /** Post long text as single post */
    xLongTextAsPost?: boolean;
  }

  export interface XMediaOptions extends XBaseOptions {
    /** User IDs to tag */
    xTaggedUserIds?: string | string[];
    /** Location place ID */
    xPlaceId?: string;
    /** Comma-separated image layout for thread (e.g. "4,4" or "2,3,1"). Each value 1-4, total must equal image count. */
    xThreadImageLayout?: string;
  }

  export interface XTextOptions extends XBaseOptions {
    /** URL to attach */
    xPostUrl?: string;
    /** Tweet ID to quote */
    xQuoteTweetId?: string;
    /** Poll options (2-4 options) */
    xPollOptions?: string | string[];
    /** Poll duration in minutes (5-10080) */
    xPollDuration?: number;
    /** Who can reply to poll */
    xPollReplySettings?: XReplySettings;
    /** Card URI for Twitter Cards */
    xCardUri?: string;
  }

  // ==================== Threads Options ====================

  export interface ThreadsOptions {
    /** Post long text as single post (vs thread) */
    threadsLongTextAsPost?: boolean;
    /** Comma-separated list of how many media items per Threads post (e.g. "5,5"). Each value 1-10, total must equal file count. */
    threadsThreadMediaLayout?: string;
  }

  // ==================== Reddit Options ====================

  export interface RedditOptions {
    /** Subreddit name (without r/) */
    redditSubreddit?: string;
    /** Flair template ID */
    redditFlairId?: string;
  }

  // ==================== Combined Upload Options ====================

  export interface UploadVideoOptions extends CommonUploadOptions,
    TikTokVideoOptions,
    InstagramVideoOptions,
    YouTubeOptions,
    LinkedInOptions,
    FacebookVideoOptions,
    PinterestVideoOptions,
    XMediaOptions,
    ThreadsOptions {
    /** Target platforms */
    platforms: VideoPlatform[];
  }

  export interface UploadPhotosOptions extends CommonUploadOptions,
    TikTokPhotoOptions,
    InstagramPhotoOptions,
    LinkedInOptions,
    FacebookPhotoOptions,
    PinterestPhotoOptions,
    XMediaOptions,
    ThreadsOptions,
    RedditOptions {
    /** Target platforms */
    platforms: PhotoPlatform[];
  }

  export interface UploadTextOptions extends CommonUploadOptions,
    LinkedInOptions,
    FacebookTextOptions,
    XTextOptions,
    ThreadsOptions,
    RedditOptions {
    /** Target platforms */
    platforms: TextPlatform[];
  }

  export interface UploadDocumentOptions {
    /** Post title/caption */
    title: string;
    /** User identifier (profile name) */
    user: string;
    /** Document description/commentary */
    description?: string;
    /** Visibility setting */
    linkedinVisibility?: LinkedInVisibility;
    /** Page ID for organization posts */
    targetLinkedinPageId?: string;
    /** ISO date for scheduling */
    scheduledDate?: string;
    /** Timezone for scheduled date */
    timezone?: string;
    /** Add to posting queue */
    addToQueue?: boolean;
    /** Process upload asynchronously */
    asyncUpload?: boolean;
  }

  // ==================== Response Types ====================

  export interface UploadResponse {
    success: boolean;
    request_id?: string;
    message?: string;
    data?: {
      status?: string;
      platforms?: Array<{
        name: string;
        url?: string;
        error?: string;
      }>;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export interface StatusResponse {
    success: boolean;
    status?: string;
    request_id?: string;
    data?: any;
    [key: string]: any;
  }

  export interface HistoryResponse {
    success: boolean;
    uploads?: any[];
    page?: number;
    total?: number;
    [key: string]: any;
  }

  export interface AnalyticsResponse {
    success: boolean;
    analytics?: any;
    [key: string]: any;
  }

  export interface ScheduledResponse {
    success: boolean;
    scheduled?: any[];
    [key: string]: any;
  }

  export interface UserProfile {
    username: string;
    social_accounts?: Record<string, any>;
    created_at?: string;
  }

  export interface UsersResponse {
    success: boolean;
    profiles?: UserProfile[];
    [key: string]: any;
  }

  export interface JwtResponse {
    success: boolean;
    jwt?: string;
    connection_url?: string;
    [key: string]: any;
  }

  export interface PagesResponse {
    success: boolean;
    pages?: Array<{ id: string; name?: string }>;
    [key: string]: any;
  }

  export interface BoardsResponse {
    success: boolean;
    boards?: Array<{ id: string; name?: string }>;
    [key: string]: any;
  }

  // ==================== Client Class ====================

  /**
   * Upload-Post API client
   * 
   * Supports uploading to: TikTok, Instagram, YouTube, LinkedIn, Facebook,
   * Pinterest, Threads, Reddit, Bluesky, X (Twitter)
   */
  export class UploadPost {
    /**
     * Create a new Upload-Post client
     * @param apiKey - Your API key from Upload-Post
     */
    constructor(apiKey: string);

    // Upload methods
    /**
     * Upload a video to social media platforms
     * @param videoPathOrUrl - Path to video file or video URL
     * @param options - Upload options
     */
    upload(videoPathOrUrl: string, options: UploadVideoOptions): Promise<UploadResponse>;

    /**
     * Upload photos to social media platforms
     * @param photosPathsOrUrls - Array of photo file paths or URLs
     * @param options - Upload options
     */
    uploadPhotos(photosPathsOrUrls: string[], options: UploadPhotosOptions): Promise<UploadResponse>;

    /**
     * Upload text posts to social media platforms
     * @param options - Upload options
     */
    uploadText(options: UploadTextOptions): Promise<UploadResponse>;

    /**
     * Upload a document to LinkedIn (PDF, PPT, PPTX, DOC, DOCX)
     * @param documentPathOrUrl - Path to document file or document URL
     * @param options - Upload options
     */
    uploadDocument(documentPathOrUrl: string, options: UploadDocumentOptions): Promise<UploadResponse>;

    // Status & History
    /**
     * Get the status of an async upload
     * @param requestId - The request_id from an async upload
     */
    getStatus(requestId: string): Promise<StatusResponse>;

    /**
     * Get upload history
     * @param options - Query options
     */
    getHistory(options?: { page?: number; limit?: number }): Promise<HistoryResponse>;

    /**
     * Get analytics for a profile
     * @param profileUsername - Profile username
     * @param options - Query options
     */
    getAnalytics(profileUsername: string, options?: { platforms?: string[] }): Promise<AnalyticsResponse>;

    // Scheduled Posts
    /**
     * List scheduled posts
     */
    listScheduled(): Promise<ScheduledResponse>;

    /**
     * Cancel a scheduled post
     * @param jobId - Scheduled job ID
     */
    cancelScheduled(jobId: string): Promise<{ success: boolean }>;

    /**
     * Edit a scheduled post
     * @param jobId - Scheduled job ID
     * @param options - Edit options
     */
    editScheduled(jobId: string, options: { scheduledDate?: string; timezone?: string }): Promise<{ success: boolean }>;

    // User Management
    /**
     * List all users/profiles
     */
    listUsers(): Promise<UsersResponse>;

    /**
     * Create a new user/profile
     * @param username - Profile name to create
     */
    createUser(username: string): Promise<{ success: boolean; username?: string }>;

    /**
     * Delete a user/profile
     * @param username - Profile name to delete
     */
    deleteUser(username: string): Promise<{ success: boolean }>;

    /**
     * Generate a JWT for platform integration
     * @param username - Profile username
     * @param options - JWT options
     */
    generateJwt(username: string, options?: {
      redirectUrl?: string;
      logoImage?: string;
      redirectButtonText?: string;
      platforms?: string[];
      showCalendar?: boolean;
      readonlyCalendar?: boolean;
      connectTitle?: string;
      connectDescription?: string;
    }): Promise<JwtResponse>;

    /**
     * Validate a JWT token
     * @param jwt - JWT token to validate
     */
    validateJwt(jwt: string): Promise<{ success: boolean; valid?: boolean }>;

    // Helper Endpoints
    /**
     * Get Facebook pages for a profile
     * @param profile - Profile username
     */
    getFacebookPages(profile?: string): Promise<PagesResponse>;

    /**
     * Get LinkedIn pages for a profile
     * @param profile - Profile username
     */
    getLinkedinPages(profile?: string): Promise<PagesResponse>;

    /**
     * Get Pinterest boards for a profile
     * @param profile - Profile username
     */
    getPinterestBoards(profile?: string): Promise<BoardsResponse>;
  }

  export default UploadPost;
}
