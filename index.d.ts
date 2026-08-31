declare module 'upload-post' {
  // ==================== Common Types ====================

  /** Supported platforms for video upload */
  export type VideoPlatform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'facebook' | 'pinterest' | 'threads' | 'reddit' | 'bluesky' | 'x' | 'google_business' | 'discord' | 'telegram' | 'mastodon' | 'wordpress';

  /** Supported platforms for photo upload */
  export type PhotoPlatform = 'tiktok' | 'instagram' | 'linkedin' | 'facebook' | 'pinterest' | 'threads' | 'reddit' | 'bluesky' | 'x' | 'google_business' | 'discord' | 'telegram' | 'mastodon' | 'lemmy' | 'wordpress';

  /** Supported platforms for text upload */
  export type TextPlatform = 'x' | 'linkedin' | 'facebook' | 'threads' | 'reddit' | 'bluesky' | 'google_business' | 'discord' | 'telegram' | 'slack' | 'mastodon' | 'nostr' | 'lemmy' | 'devto' | 'hashnode' | 'wordpress' | 'whop' | 'listmonk';

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
    /**
     * Key the API uses to collapse duplicate uploads within a 24-hour window.
     * Pass the same value when retrying a failed upload, otherwise the retry publishes a second post.
     */
    idempotencyKey?: string;
    /** Alias for {@link CommonUploadOptions.idempotencyKey}. */
    requestId?: string;
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
    /** Maximum number of posts allowed per queue slot (overrides profile setting). Only used when addToQueue is true. */
    maxPostsPerSlot?: number;
    /** Process upload asynchronously (default: true) */
    asyncUpload?: boolean;
    /** If true, AI generates native per-platform title/description from the media and fills any field left empty */
    /** Generate only the title with AI */
    /** Generate only the description with AI */
    /** Force the AI output language (ISO code); omit to auto-detect from the media */

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
    slackTitle?: string;
    mastodonTitle?: string;
    nostrTitle?: string;
    lemmyTitle?: string;
    devtoTitle?: string;
    hashnodeTitle?: string;
    wordpressTitle?: string;
    whopTitle?: string;
    listmonkTitle?: string;

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
    /**
     * Privacy setting. TikTok decides per account which levels are available (a
     * private account has no `PUBLIC_TO_EVERYONE`); asking for another one fails
     * with `error_code: "tiktok_privacy_unavailable"` listing the allowed ones.
     * Omit it to keep the account's own default.
     */
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

    // ---- Music, location, cover and draft ----
    // Available on connections that declare the matching capability (`music`,
    // `location`, `cover_image`, `draft`) — see `capabilities` on the TikTok
    // account returned by listUsers() / GET /api/uploadposts/users. If your
    // connection does not have it, the field is ignored, the post still
    // publishes, and the response includes a per-field `warnings` entry —
    // reconnect the TikTok account to enable it.

    /** Commercial Music Library track id (see getTiktokTrendingMusic) */
    tiktokMusicId?: string;
    /** Music volume, 0-100. Defaults to 50 when music is set */
    tiktokMusicVolume?: number;
    /** Music start offset in ms */
    tiktokMusicStart?: number;
    /** Music end offset in ms */
    tiktokMusicEnd?: number;
    /** Original video audio volume, 0-100. Defaults to 50 when music is set, so the original audio is not muted */
    tiktokOriginalSoundVolume?: number;
    /** Location id to tag (see getTiktokLocations) */
    tiktokLocationId?: string;
    /** Location name. Required whenever tiktokLocationId is set */
    tiktokLocationName?: string;
    /** Custom cover image URL */
    tiktokCoverImageUrl?: string;
    /** AI-generated content disclosure */
    tiktokIsAiGenerated?: boolean;
    /** Publish to drafts. When true TikTok ignores the rest of the post settings */
    tiktokUploadToDraft?: boolean;
  }

  export interface TikTokPhotoOptions {
    /** Auto add music */
    tiktokAutoAddMusic?: boolean;
    /** Disable comments */
    tiktokDisableComment?: boolean;
    /** Index of photo for cover (0-based). Sent as `photo_cover_index` */
    tiktokPhotoCoverIndex?: number;
    /**
     * Privacy setting. TikTok REQUIRES one on photo posts, so it defaults to
     * `PUBLIC_TO_EVERYONE`. Which values the account may use is decided by TikTok
     * (a private account has no `PUBLIC_TO_EVERYONE`); asking for another one
     * fails with `error_code: "tiktok_privacy_unavailable"` listing the allowed
     * ones.
     */
    tiktokPrivacyLevel?: TikTokPrivacyLevel;
    /** Post mode, e.g. DIRECT_POST or MEDIA_UPLOAD (inbox) */
    tiktokPostMode?: string;
    /** Branded content toggle */
    brandContentToggle?: boolean;
    /** Brand organic toggle */
    brandOrganicToggle?: boolean;

    // ---- Music, location and AI disclosure ----
    // Photo posts accept the track id, the location pair and the AI disclosure —
    // not the volume/trim, cover-image or draft fields, which are video-only.
    // Available on connections that declare the matching capability (`music`,
    // `location`) — see `capabilities` on the TikTok account returned by
    // listUsers(). Without it the field is ignored, the post still publishes, and
    // the response includes a per-field `warnings` entry.

    /** Commercial Music Library track id (see getTiktokTrendingMusic) */
    tiktokMusicId?: string;
    /** Location id to tag (see getTiktokLocations) */
    tiktokLocationId?: string;
    /** Location name. Required whenever tiktokLocationId is set */
    tiktokLocationName?: string;
    /** AI-generated content disclosure */
    tiktokIsAiGenerated?: boolean;
  }

  // ==================== Instagram Options ====================

  export interface InstagramVideoOptions {
    /** Media type */
    instagramMediaType?: InstagramVideoMediaType;
    /** Share to feed */
    instagramShareToFeed?: boolean;
    /** Comma-separated collaborator usernames */
    instagramCollaborators?: string;
    /** Custom cover: URL string, file path, Buffer, or ReadableStream */
    instagramCoverUrl?: string | Buffer | NodeJS.ReadableStream;
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
    /** Playlist ID(s) to add the uploaded video to — one ID, an array, or a comma-separated list */
    youtubePlaylistId?: string | string[];
    /** Subtitle/caption files to upload. Each entry needs a language code and either a file path or URL. */
    youtubeSubtitles?: Array<{
      /** BCP-47 language code (e.g. "en", "es") */
      language: string;
      /** Display name for the subtitle track (e.g. "English", "Español") */
      name?: string;
      /** Path to the subtitle file (SRT, VTT, SBV, SUB, ASS, SSA, TTML) */
      file?: string;
      /** URL to the subtitle file */
      url?: string;
    }>;
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
    /** Topic tag for the Threads post */
    threadsTopicTag?: string;
  }

  // ==================== Reddit Options ====================

  export interface RedditOptions {
    /** Subreddit name (without r/) */
    redditSubreddit?: string;
    /** Flair template ID */
    redditFlairId?: string;
  }

  // ==================== Combined Upload Options ====================

  export type GoogleBusinessMediaCategory =
    | 'COVER'
    | 'PROFILE'
    | 'LOGO'
    | 'EXTERIOR'
    | 'INTERIOR'
    | 'PRODUCT'
    | 'AT_WORK'
    | 'FOOD_AND_DRINK'
    | 'MENU'
    | 'COMMON_AREA'
    | 'ROOMS'
    | 'TEAMS'
    | 'ADDITIONAL';

  export interface GoogleBusinessOptions {
    /** Google Business location id, e.g. "accounts/123/locations/456". Required when the account has more than one location; the API auto-selects only for single-location accounts. List them with getGoogleBusinessLocations(). */
    gbpLocationId?: string;
    /** Publish to the location's gallery instead of creating a Local Post. Omitting it (or sending any other value) keeps the Local Post behaviour. */
    gbpPostType?: 'MEDIA' | 'PHOTO' | 'GALLERY';
    /** Gallery category for the uploaded photo. Only used with gbpPostType. Defaults to ADDITIONAL. */
    gbpMediaCategory?: GoogleBusinessMediaCategory;
    /** Post type. Defaults to STANDARD. */
    gbpTopicType?: 'STANDARD' | 'EVENT' | 'OFFER';
    /** Media URL attached to the post */
    gbpMediaUrl?: string;
    /** Media format */
    gbpMediaFormat?: 'PHOTO' | 'VIDEO';
    /** Call-to-action button */
    gbpCtaType?: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
    /** URL the call-to-action button opens */
    gbpCtaUrl?: string;
    /** Event title. Used when gbpTopicType is EVENT. */
    gbpEventTitle?: string;
    /** Event start date, YYYY-MM-DD */
    gbpEventStartDate?: string;
    /** Event start time, HH:MM */
    gbpEventStartTime?: string;
    /** Event end date, YYYY-MM-DD */
    gbpEventEndDate?: string;
    /** Event end time, HH:MM */
    gbpEventEndTime?: string;
    /** Offer coupon code. Used when gbpTopicType is OFFER. */
    gbpOfferCoupon?: string;
    /** URL to redeem the offer */
    gbpOfferRedeemUrl?: string;
    /** Offer terms and conditions */
    gbpOfferTerms?: string;
  }

  export interface UploadVideoOptions extends CommonUploadOptions,
    TikTokVideoOptions,
    InstagramVideoOptions,
    YouTubeOptions,
    LinkedInOptions,
    FacebookVideoOptions,
    PinterestVideoOptions,
    XMediaOptions,
    ThreadsOptions,
    RedditOptions,
    GoogleBusinessOptions {
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
    RedditOptions,
    GoogleBusinessOptions {
    /** Target platforms */
    platforms: PhotoPlatform[];
  }

  export interface LinkPreviewOptions {
    /** Generic URL for link preview card (works for LinkedIn, Bluesky, Facebook). Platform-specific params take priority. */
    linkUrl?: string;
    /** URL for link preview card on LinkedIn */
    linkedinLinkUrl?: string;
    /** URL for external embed link preview on Bluesky */
    blueskyLinkUrl?: string;
  }

  export interface UploadTextOptions extends CommonUploadOptions,
    LinkedInOptions,
    FacebookTextOptions,
    XTextOptions,
    ThreadsOptions,
    RedditOptions,
    LinkPreviewOptions,
    GoogleBusinessOptions {
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
    /** Maximum number of posts allowed per queue slot (overrides profile setting). Only used when addToQueue is true. */
    maxPostsPerSlot?: number;
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

  /**
   * Instagram audience breakdown. Each key maps a bucket (age range, gender,
   * country code, city name) to a follower/engager count.
   */
  export interface DemographicsBreakdown {
    age?: Record<string, number>;
    gender?: Record<string, number>;
    country?: Record<string, number>;
    city?: Record<string, number>;
  }

  export interface InstagramAnalytics {
    /** Breakdown of the account's followers. */
    follower_demographics?: DemographicsBreakdown;
    /** Breakdown of the accounts that engaged with the profile's content. Same shape as follower_demographics. */
    engaged_audience_demographics?: DemographicsBreakdown;
    [key: string]: any;
  }

  export interface AnalyticsResponse {
    success: boolean;
    analytics?: {
      instagram?: InstagramAnalytics;
      [platform: string]: any;
    };
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

  /** Trending window accepted by the TikTok Commercial Music Library. */
  export type TikTokMusicDateRange = '1DAY' | '7DAY' | '30DAY' | '90DAY';

  export interface TikTokMusicTrack {
    /** Pass this as `tiktokMusicId` on an upload. */
    id: string;
    /**
     * TikTok's catalogue id for the same track, returned for reference only.
     * Do NOT send it as `tiktokMusicId`: TikTok rejects it on public posts.
     */
    commercial_music_id?: string;
    title?: string;
    artist?: string;
    /** Track duration in seconds. */
    duration?: number;
    genres?: string[];
    /** Artwork image URL. */
    cover_url?: string;
    /** Audio preview URL. */
    preview_url?: string;
    rank?: number;
    [key: string]: any;
  }

  export interface TikTokTrendingMusicResponse {
    success: boolean;
    tracks?: TikTokMusicTrack[];
    [key: string]: any;
  }

  export interface TikTokMusicSearchResponse {
    success: boolean;
    /** Matches, ranked by relevance; same shape as the trending endpoint. */
    tracks?: TikTokMusicTrack[];
    /** How many tracks matched before `limit` was applied. */
    total?: number;
    query?: string;
    /** What the search actually ran against. */
    catalog?: {
      /** Number of tracks in the searched corpus. */
      tracks_indexed?: number;
      /** Genre charts currently loaded for this country and period. */
      genres_indexed?: string[];
      /** False when this request had to load a chart from TikTok. */
      cached?: boolean;
    };
    [key: string]: any;
  }

  export interface TikTokLocation {
    location_id: string;
    location_name?: string;
    location_address?: string;
    [key: string]: any;
  }

  export interface TikTokLocationsResponse {
    success: boolean;
    locations?: TikTokLocation[];
    [key: string]: any;
  }

  export interface TikTokPublishingSettingsResponse {
    success: boolean;
    /** The privacy levels THIS account may use — a subset of the four. */
    privacy_level_options?: TikTokPrivacyLevel[];
    /** Longest video the account can publish, in seconds. */
    max_video_post_duration_sec?: number;
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
    [key: string]: any;
  }

  // ==================== Client Class ====================

  /**
   * Upload-Post API client
   * 
   * Supports uploading to: TikTok, Instagram, YouTube, LinkedIn, Facebook,
   * Pinterest, Threads, Reddit, Bluesky, X (Twitter), Discord, Telegram
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
     * Get the status of a scheduled or queued upload by job ID
     * @param jobId - The job_id from a scheduled or queued upload
     */
    getJobStatus(jobId: string): Promise<StatusResponse>;

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
    getAnalytics(profileUsername: string, options?: { platforms?: string[]; pageId?: string; pageUrn?: string }): Promise<AnalyticsResponse>;

    /**
     * Get total impressions for a profile from daily snapshots
     * @param profileUsername - Profile username
     * @param options - Query options
     */
    getTotalImpressions(profileUsername: string, options?: {
      period?: 'last_day' | 'last_week' | 'last_month' | 'last_3months' | 'last_year';
      startDate?: string;
      endDate?: string;
      date?: string;
      platforms?: string[];
      breakdown?: boolean;
      metrics?: string[];
    }): Promise<{
      success: boolean;
      profile_username: string;
      start_date: string;
      end_date: string;
      total_impressions?: number;
      metrics?: Record<string, number>;
      per_platform?: Record<string, number | Record<string, number>>;
      per_day?: Record<string, number | Record<string, number>>;
      platforms_filter?: string[];
    }>;

    /**
     * Get analytics for a specific post across all platforms
     * @param requestId - The request_id from the upload
     */
    getPostAnalytics(requestId: string): Promise<{
      success: boolean;
      post: { request_id: string; profile_username: string; post_title: string; post_caption: string; media_type: string; upload_timestamp: string };
      platforms: Record<string, {
        success: boolean;
        platform_post_id?: string;
        post_url?: string;
        post_metrics?: Record<string, number>;
        post_metrics_source?: string;
        post_metrics_error?: string;
        profile_snapshot_at_post_date?: Record<string, number>;
        profile_snapshot_latest?: Record<string, number>;
        profile_snapshot_latest_date?: string;
        error_message?: string;
      }>;
    }>;

    /**
     * Replay per-post metrics already fetched, instead of querying
     * the platforms live. Not subject to the live post-analytics rate limit
     * (100 requests / 5 minutes), so it is the right call for paging through a
     * profile's whole post history.
     *
     * @param user - Profile username
     * @param options - Query options
     */
    getCachedPostAnalytics(user: string, options?: {
      platform?: 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin' | 'threads' | 'pinterest' | 'reddit';
      /** Posts per page. Default 50, max 200. */
      limit?: number;
      /** Opaque cursor from a previous response's next_cursor. */
      cursor?: string;
      /** Start date, YYYY-MM-DD. Defaults to 30 days ago. */
      since?: string;
      /** End date, YYYY-MM-DD. Defaults to today. */
      until?: string;
    }): Promise<{
      success: boolean;
      profile_username: string;
      platform: string | null;
      since: string;
      until: string;
      source: 'snapshot_cache';
      posts: Array<{
        post_id: string;
        platform: string;
        profile_username: string;
        date: string;
        captured_at: string;
        metrics: Record<string, number>;
        post_url?: string | null;
        media_type?: string | null;
        upload_timestamp?: string | null;
      }>;
      limit: number;
      next_cursor: string | null;
      has_more: boolean;
    }>;

    /**
     * Get available metrics configuration for all supported platforms
     */
    getPlatformMetrics(): Promise<Record<string, {
      primary_impressions_field: string;
      available_metrics: string[];
      metric_labels: Record<string, string>;
    }>>;

    /**
     * Get recent media from a connected social account.
     *
     * @param options.pageUrn - LinkedIn only. Numeric org ID, full org URN, or "me" to force the personal profile.
     * @param options.limit - Items per page. Default 25, clamped to 1-100. Per-platform caps: TikTok 20, YouTube 50, everything else 100.
     * @param options.cursor - Opaque cursor from a previous response's `pagination.next_cursor`. LinkedIn, Discord and Telegram do not support cursors: passing one there returns HTTP 400.
     */
    getMedia(
      platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'facebook' | 'x' | 'threads' | 'pinterest' | 'bluesky' | 'reddit' | string,
      user: string,
      options?: { pageUrn?: string; limit?: number; cursor?: string }
    ): Promise<{
      success: boolean;
      media: Array<{
        id: string;
        caption: string | null;
        media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'TEXT' | string;
        media_url: string | null;
        permalink: string | null;
        timestamp: string | null;
        thumbnail_url: string | null;
      }>;
      pagination?: {
        limit: number;
        /** null on the last page. */
        next_cursor: string | null;
        has_more: boolean;
      };
    }>;

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
      language?: 'en' | 'es' | 'de' | 'fr' | 'pt' | 'pl' | 'tr';
      /**
       * Flat map of i18n dot-path keys to replacement strings, e.g.
       * `{ 'connect.title': 'Link your accounts' }`. Max 100 entries; keys must
       * match `^[a-zA-Z0-9_.]+$` and values are strings of up to 300 characters.
       * Returned back in the `profile` object of validateJwt.
       */
      uiLabels?: Record<string, string>;
    }): Promise<JwtResponse>;

    /**
     * Validate a JWT token
     * @param jwt - JWT token to validate
     */
    validateJwt(jwt: string): Promise<{
      success: boolean;
      valid?: boolean;
      profile?: {
        username?: string;
        language?: 'en' | 'es' | 'de' | 'fr' | 'pt' | 'pl' | 'tr';
        /** The ui_labels sent to generateJwt, echoed back for the connection page. */
        ui_labels?: Record<string, string>;
        [key: string]: any;
      };
      [key: string]: any;
    }>;

    /**
     * Get user preferences (including calendar settings)
     */
    getUserPreferences(): Promise<{ success: boolean; preferences?: { week_start_day?: number; [key: string]: any } }>;

    /**
     * Update user preferences (including calendar settings)
     * @param options - Preferences options
     */
    updateUserPreferences(options?: { weekStartDay?: number }): Promise<{ success: boolean; preferences?: { week_start_day?: number; [key: string]: any } }>;

    /**
     * Get notification configuration (including webhook settings)
     */
    getNotificationConfig(): Promise<{ success: boolean; config?: { webhook_events?: string[]; webhook_url?: string; [key: string]: any } }>;

    /**
     * Update notification configuration (including webhook settings)
     * @param options - Notification config options
     */
    updateNotificationConfig(options?: {
      webhookEvents?: string[];
      webhookUrl?: string;
      channels?: string[];
      telegramChatId?: string;
      slackWebhookUrl?: string;
      whatsappToPhone?: string;
    }): Promise<{ success: boolean; config?: { webhook_events?: string[]; webhook_url?: string; [key: string]: any } }>;

    /**
     * Send a test notification through the configured channels
     */
    testNotifications(): Promise<{ success: boolean; [key: string]: any }>;

    // Instagram Comments

    /**
     * Get comments on a post
     * @param options - Query options
     */
    getPostComments(options: {
      user: string;
      platform?: 'instagram' | 'facebook' | 'youtube' | 'linkedin';
      postId?: string;
      postUrl?: string;
      limit?: number;
      after?: string;
    }): Promise<{
      success: boolean;
      comments?: Array<{
        id: string;
        text: string;
        timestamp: string;
        user: { id: string; username: string };
      }>;
    }>;
    /**
     * Get comments on an Instagram post (legacy positional signature)
     * @param user - Profile username
     * @param options - Query options
     */
    getPostComments(user: string, options?: { postId?: string; postUrl?: string }): Promise<{
      success: boolean;
      comments?: Array<{
        id: string;
        text: string;
        timestamp: string;
        user: { id: string; username: string };
      }>;
    }>;

    /**
     * Send a private reply (DM) to the author of an Instagram comment
     * @param options - Reply options
     */
    replyToComment(options: { user: string; commentId: string; message: string; buttons?: Array<{ title: string; url: string }> }): Promise<{
      success: boolean;
      recipient_id?: string;
      message_id?: string;
      message?: string;
      error?: string;
    }>;

    /**
     * Post a public reply to an Instagram comment (visible under the original comment)
     * @param options - Reply options
     */
    publicReplyToComment(options: { user: string; commentId: string; message: string }): Promise<{
      success: boolean;
      id?: string;
      message?: string;
      error?: string;
    }>;

    /**
     * Create a comment on a post, or reply to an existing comment.
     * One of postId, postUrl, or commentId is required.
     * @param options - Comment options
     */
    createComment(options: {
      user: string;
      platform: 'instagram' | 'facebook' | 'youtube' | 'linkedin';
      message: string;
      postId?: string;
      postUrl?: string;
      commentId?: string;
    }): Promise<{
      success: boolean;
      id?: string;
      message?: string;
      error?: string;
    }>;

    /**
     * Delete a comment on a post
     * @param options - Delete options
     */
    deleteComment(options: {
      user: string;
      platform: 'instagram' | 'facebook' | 'youtube' | 'linkedin';
      commentId: string;
      /** Post identifier (the post URN for LinkedIn) */
      postId?: string;
    }): Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;

    // Post Management
    /**
     * Retry a failed post. Provide requestId or jobId.
     * @param options - Retry options
     */
    retryPost(options: { requestId?: string; jobId?: string }): Promise<{
      success: boolean;
      request_id?: string;
      job_id?: string;
      message?: string;
      error?: string;
    }>;

    /**
     * Unpublish (delete) a post from the platform
     * @param options - Unpublish options
     */
    unpublishPost(options: {
      user: string;
      platform: 'facebook' | 'youtube' | 'x' | 'linkedin' | 'threads';
      postId: string;
    }): Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;

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

    /**
     * Get analytics for a post published outside Upload-Post, by its native platform ID
     * @param platformPostId - The post ID assigned by the platform
     * @param platform - Platform the post lives on
     * @param user - Profile username that owns the connected account
     */
    getPostAnalyticsByPlatformId(platformPostId: string, platform: string, user: string): Promise<Record<string, unknown>>;

    /**
     * Get detailed Reddit posts with full media information
     * @param profileUsername - Profile username
     */
    getRedditDetailedPosts(profileUsername: string): Promise<Record<string, unknown>>;

    /**
     * Get available Google Business locations for a profile
     * @param profile - Profile username
     */
    getGoogleBusinessLocations(profile?: string): Promise<Record<string, unknown>>;

    /**
     * Get trending tracks from the TikTok Commercial Music Library.
     *
     * Available on connections that declare the `music` capability (see
     * `capabilities` on the TikTok account returned by listUsers() /
     * GET /api/uploadposts/users). Pass the returned `id` as `tiktokMusicId`
     * on an upload (NOT `commercial_music_id` — TikTok rejects that one on
     * public posts).
     *
     * @param profile - Profile username
     * @param options - Query options
     */
    getTiktokTrendingMusic(
      profile: string,
      options?: {
        genre?: string;
        countryCode?: string;
        dateRange?: TikTokMusicDateRange;
      }
    ): Promise<TikTokTrendingMusicResponse>;

    /**
     * Search the TikTok Commercial Music Library by song title or artist.
     *
     * TikTok has no music search endpoint, so this searches the trending charts
     * Upload-Post caches (per genre / country / period), not TikTok's whole
     * catalogue. Matching is case- and accent-insensitive and every word must
     * match. Returns the same track objects as getTiktokTrendingMusic().
     *
     * @param profile - Profile username
     * @param options - Query options
     */
    searchTiktokMusic(
      profile: string,
      options?: {
        q?: string;
        genre?: string;
        countryCode?: string;
        dateRange?: TikTokMusicDateRange;
        limit?: number;
      }
    ): Promise<TikTokMusicSearchResponse>;

    /**
     * Search TikTok locations (places) to tag on a post.
     *
     * Available on connections that declare the `location` capability (see
     * `capabilities` on the TikTok account returned by listUsers() /
     * GET /api/uploadposts/users). TikTok requires both the id and the name, so
     * pass `location_id` as `tiktokLocationId` and `location_name` as
     * `tiktokLocationName`.
     *
     * @param profile - Profile username
     * @param query - Search query (max 100 characters)
     */
    getTiktokLocations(profile: string, query: string): Promise<TikTokLocationsResponse>;

    /**
     * Get what the connected TikTok account is allowed to publish.
     *
     * The point of this call is `privacy_level_options`: TikTok narrows the four
     * privacy values per account (a private account has no `PUBLIC_TO_EVERYONE`),
     * and sending one the account does not have fails the upload with
     * `error_code: "tiktok_privacy_unavailable"`. Ask here to offer only the
     * values that will work, instead of the full enum.
     *
     * @param profile - Profile username
     */
    getTiktokPublishingSettings(profile: string): Promise<TikTokPublishingSettingsResponse>;
  }

  export default UploadPost;
}
