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
    /** Reply to an existing post (X: tweet ID; Bluesky: post URL or AT-URI). */
    replyToId?: string;
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
    /**
     * Needs the `comments` capability on the connection: without it the post
     * still publishes and the response carries a warning instead of the comment.
     */
    tiktokFirstComment?: string;
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
    /**
     * Post mode. `MEDIA_UPLOAD` is the same draft as {@link TikTokVideoOptions.tiktokUploadToDraft}.
     * Alias: `postMode` / `post_mode`.
     */
    tiktokPostMode?: TikTokPostMode;
    /** Alias of {@link TikTokVideoOptions.tiktokPostMode}. */
    postMode?: TikTokPostMode;
    /** Alias of {@link TikTokVideoOptions.tiktokPostMode}. */
    post_mode?: TikTokPostMode;
    /** Branded content toggle */
    brandContentToggle?: boolean;
    /** Brand organic toggle */
    brandOrganicToggle?: boolean;
    /** Only show the video in ads */
    tiktokIsAdsOnly?: boolean;
    /** TikTok One invite link. Requires branded content. */
    tiktokTtoInviteLink?: string;

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
    /**
     * Publish to drafts. Same draft as `tiktokPostMode: 'MEDIA_UPLOAD'` /
     * `postMode: 'MEDIA_UPLOAD'`. Aliases: `uploadToDraft`, `tiktok_upload_to_draft`,
     * `upload_to_draft`. When true TikTok ignores the rest of the post settings.
     */
    tiktokUploadToDraft?: boolean;
    /** Alias of {@link TikTokVideoOptions.tiktokUploadToDraft}. */
    uploadToDraft?: boolean;
    /** Alias of {@link TikTokVideoOptions.tiktokUploadToDraft}. */
    tiktok_upload_to_draft?: boolean;
    /** Alias of {@link TikTokVideoOptions.tiktokUploadToDraft}. */
    upload_to_draft?: boolean;
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
    /**
     * Post mode. `MEDIA_UPLOAD` is the same draft as {@link TikTokPhotoOptions.tiktokUploadToDraft}.
     * Alias: `postMode` / `post_mode`.
     */
    tiktokPostMode?: TikTokPostMode;
    /** Alias of {@link TikTokPhotoOptions.tiktokPostMode}. */
    postMode?: TikTokPostMode;
    /** Alias of {@link TikTokPhotoOptions.tiktokPostMode}. */
    post_mode?: TikTokPostMode;
    /** Branded content toggle */
    brandContentToggle?: boolean;
    /** Brand organic toggle */
    brandOrganicToggle?: boolean;

    // ---- Music, location, AI disclosure and draft ----
    // Photo posts accept the track id, the location pair, the AI disclosure and
    // the draft switch — not the volume/trim or cover-image fields, which are
    // video-only. Available on connections that declare the matching capability
    // (`music`, `location`, `draft`) — see `capabilities` on the TikTok account
    // returned by listUsers(). Without it the field is ignored, the post still
    // publishes, and the response includes a per-field `warnings` entry.

    /** Commercial Music Library track id (see getTiktokTrendingMusic) */
    tiktokMusicId?: string;
    /** Location id to tag (see getTiktokLocations) */
    tiktokLocationId?: string;
    /** Location name. Required whenever tiktokLocationId is set */
    tiktokLocationName?: string;
    /** AI-generated content disclosure */
    tiktokIsAiGenerated?: boolean;
    /**
     * Publish to drafts. Same draft as `tiktokPostMode: 'MEDIA_UPLOAD'` /
     * `postMode: 'MEDIA_UPLOAD'`. Aliases: `uploadToDraft`, `tiktok_upload_to_draft`,
     * `upload_to_draft`.
     */
    tiktokUploadToDraft?: boolean;
    /** Alias of {@link TikTokPhotoOptions.tiktokUploadToDraft}. */
    uploadToDraft?: boolean;
    /** Alias of {@link TikTokPhotoOptions.tiktokUploadToDraft}. */
    tiktok_upload_to_draft?: boolean;
    /** Alias of {@link TikTokPhotoOptions.tiktokUploadToDraft}. */
    upload_to_draft?: boolean;
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
    /** Alt text: string (applied to every item) or list of strings, ≤1000 chars each */
    instagramAltText?: string | string[];
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
    /** Notify subscribers. Default true; send false to suppress the notification */
    youtubeNotifySubscribers?: boolean;
    /** RFC3339 time. Uploads the video as private until this instant (Studio: Scheduled) */
    youtubePublishAt?: string;
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
    /** Alt text per image (string, JSON list, or repeated). Default = title */
    linkedinAltText?: string | string[];
    /** Disable reshare by others */
    linkedinDisableReshare?: boolean;
    /** Override the scraped link-share title (< 400 chars) */
    linkedinLinkTitle?: string;
    /** Override the scraped link-share description (< 4086 chars) */
    linkedinLinkDescription?: string;
    /** Alt text for the link-share thumbnail */
    linkedinThumbnailAltText?: string;
    /** Organic Page targeting: geo locations (CSV, JSON list, URN or numeric id) */
    linkedinTargetGeoLocations?: string | string[];
    linkedinTargetIndustries?: string | string[];
    linkedinTargetSeniorities?: string | string[];
    linkedinTargetJobFunctions?: string | string[];
    linkedinTargetStaffCountRanges?: string | string[];
    linkedinTargetInterfaceLocales?: string | string[];
    linkedinTargetDegrees?: string | string[];
    linkedinTargetFieldsOfStudy?: string | string[];
    linkedinTargetOrganizations?: string | string[];
    /** Raw LinkedIn targetEntities facets JSON */
    linkedinTargetEntities?: Record<string, unknown> | string;
    /** Reject the post if LinkedIn reports audience < 300 */
    linkedinTargetCheckAudience?: boolean;
    /** English SRT captions: local path, stream, or file */
    linkedinSubtitles?: string | Buffer | NodeJS.ReadableStream;
    /** Public URL of an English SRT file */
    linkedinSubtitlesUrl?: string;
    /** Inline English SRT text */
    linkedinSubtitlesText?: string;
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
    /** Facebook Place ID */
    facebookPlaceId?: string;
    /** Geographic/age/language targeting */
    facebookTargeting?: Record<string, unknown> | string;
    /** Feed targeting */
    facebookFeedTargeting?: Record<string, unknown> | string;
    /** AI-generated disclosure on Reels */
    facebookIsAiGenerated?: boolean;
    /** Unpublished type for page video: DRAFT, INLINE_CREATED, ADS_POST, PUBLISHED. Do not send SCHEDULED — use scheduledDate. */
    facebookUnpublishedContentType?: 'DRAFT' | 'INLINE_CREATED' | 'ADS_POST' | 'PUBLISHED' | string;
    /** Hide the video from the Page story */
    facebookNoStory?: boolean;
    /** Secret/unpublished video */
    facebookSecret?: boolean;
    /** Page IDs to invite as Reel collaborators (max 10 / 24h) */
    facebookCollaborators?: string | string[];
  }

  export interface FacebookPhotoOptions {
    /** Facebook Page ID */
    facebookPageId?: string;
    /** Alt text per photo */
    facebookAltText?: string | string[];
    /** Facebook Place ID */
    facebookPlaceId?: string;
    /** Geographic/age/language targeting */
    facebookTargeting?: Record<string, unknown> | string;
    /** Feed targeting */
    facebookFeedTargeting?: Record<string, unknown> | string;
  }

  export interface FacebookTextOptions {
    /** Facebook Page ID */
    facebookPageId?: string;
    /** URL to attach as link preview */
    facebookLinkUrl?: string;
    /** Facebook Place ID */
    facebookPlaceId?: string;
    /** Geographic/age/language targeting */
    facebookTargeting?: Record<string, unknown> | string;
    /** Feed targeting */
    facebookFeedTargeting?: Record<string, unknown> | string;
    /** Link-post CTA, e.g. { type: 'LEARN_MORE', link: 'https://…' } */
    facebookCallToAction?: Record<string, unknown> | string;
    /** Link carousel (2–5 objects with `link`) */
    facebookChildAttachments?: Array<Record<string, unknown>> | string;
    /** Show the multi-share end card (requires child attachments) */
    facebookMultiShareEndCard?: boolean;
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
    /** Key frame time in seconds (values larger than the video duration are treated as milliseconds) */
    pinterestCoverImageKeyFrameTime?: number;
    /** Board section ID */
    pinterestBoardSectionId?: string;
    /** AI disclosures: AI_MODIFIED and/or SYNTHETIC_PERFORMER */
    pinterestAiDisclosures?: string | string[];
  }

  export interface PinterestPhotoOptions {
    /** Board ID */
    pinterestBoardId?: string;
    /** Alt text */
    pinterestAltText?: string;
    /** Destination link */
    pinterestLink?: string;
    /** Board section ID */
    pinterestBoardSectionId?: string;
    /** AI disclosures: AI_MODIFIED and/or SYNTHETIC_PERFORMER */
    pinterestAiDisclosures?: string | string[];
    /** Per-slide titles on a 2–5 photo carousel */
    pinterestCarouselTitles?: string | string[];
    /** Per-slide descriptions on a 2–5 photo carousel */
    pinterestCarouselDescriptions?: string | string[];
    /** Per-slide links on a 2–5 photo carousel */
    pinterestCarouselLinks?: string | string[];
    /** 0-based cover index on a carousel */
    pinterestCarouselIndex?: number;
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
    /** Paid partnership label on the first post */
    xPaidPartnership?: boolean;
    /** ID of the tweet to reply to (alias of the generic replyToId). */
    xReplyToId?: string;
  }

  export interface XMediaOptions extends XBaseOptions {
    /** User IDs to tag */
    xTaggedUserIds?: string | string[];
    /** Location place ID */
    xPlaceId?: string;
    /** Comma-separated image layout for thread (e.g. "4,4" or "2,3,1"). Each value 1-4, total must equal image count. */
    xThreadImageLayout?: string;
    /** Alt text (≤1000 chars). String for video; string, list or `x_alt_text[]` for photos */
    xAltText?: string | string[];
    /** Public URL of a .srt file (≤1 MB) */
    xSubtitlesUrl?: string;
    /** Inline SRT text, or a URL if the value starts with http(s) */
    xSubtitles?: string;
    /** 2-letter language code (default EN) */
    xSubtitlesLanguage?: string;
    /** Subtitle track name shown on X (≤150 chars) */
    xSubtitlesName?: string;
  }

  export interface XTextOptions extends XBaseOptions {
    /** URL to attach */
    xPostUrl?: string;
    /** Tweet ID to quote. Quote posts require an X API Enterprise plan. */
    xQuoteTweetId?: string;
    /** Poll options (2-4 options) */
    xPollOptions?: string | string[];
    /** Poll duration in minutes (5-10080) */
    xPollDuration?: number;
    /** Who can reply to poll */
    xPollReplySettings?: XReplySettings;
    /** Card URI for Twitter Cards */
    xCardUri?: string;
    /** X Article title (≤100 chars, Premium) */
    xArticleTitle?: string;
    /** X Article body (plain text / light Markdown) */
    xArticleBody?: string;
    /** DraftJS content_state JSON */
    xArticleContentState?: Record<string, unknown> | string;
    /** Create the Article as a draft only */
    xArticleDraft?: boolean;
    /** Article cover: local file, public URL, or X media_id */
    xArticleCoverMedia?: string | Buffer | NodeJS.ReadableStream;
  }

  // ==================== Threads Options ====================

  export interface ThreadsOptions {
    /** Post long text as single post (vs thread) */
    threadsLongTextAsPost?: boolean;
    /** Comma-separated list of how many media items per Threads post (e.g. "5,5"). Each value 1-20, total must equal file count. */
    threadsThreadMediaLayout?: string;
    /** Topic tag for the Threads post */
    threadsTopicTag?: string;
    /** Who can reply: everyone, accounts_you_follow, mentioned_only, parent_post_author_only, followers_only */
    threadsReplyControl?: 'everyone' | 'accounts_you_follow' | 'mentioned_only' | 'parent_post_author_only' | 'followers_only' | 'followers' | string;
    /** Alt text per image/video (≤1000 chars) */
    threadsAltText?: string | string[];
    /** Publish as a reply to this Threads post id */
    threadsReplyToId?: string;
    /** Quote this Threads post id */
    threadsQuotePostId?: string;
    /** Force a link preview (text posts) */
    threadsLinkAttachment?: string;
    /** Poll options, 2–4 strings of 1–25 chars (text posts) */
    threadsPollOptions?: string | string[];
    /** Publish a text container without the second threads_publish call */
    threadsAutoPublishText?: boolean;
  }

  // ==================== Reddit Options ====================

  /**
   * Reddit is currently unavailable. Uploads, OAuth and comments return HTTP 503
   * with `error_code=reddit_unavailable`. Fields are still accepted and forwarded.
   */
  export interface RedditOptions {
    /** Subreddit name (without r/) */
    redditSubreddit?: string;
    /** Flair template ID */
    redditFlairId?: string;
    redditNsfw?: boolean;
    redditSpoiler?: boolean;
    redditResubmit?: boolean;
    redditSendReplies?: boolean;
    /** Custom text for editable flairs */
    redditFlairText?: string;
    /** Per-image captions (JSON array or `||`-separated) */
    redditGalleryCaptions?: string | string[];
    /** Per-image outbound URLs (JSON array or `||`-separated) */
    redditGalleryUrls?: string | string[];
  }

  // ==================== Bluesky Options ====================

  export interface BlueskyOptions {
    /** Alt text per image/video (string, JSON array or `||`-separated) */
    blueskyAltText?: string | string[];
    /** Up to 3 BCP-47 language codes, comma-separated */
    blueskyLangs?: string | string[];
    /** Content labels: porn, sexual, nudity, graphic-media */
    blueskyLabels?: string | string[];
    /** Publish up to 20 images as a gallery (default: first 4) */
    blueskyGallery?: boolean;
    /** Who can reply: everyone, nobody, mention, following, followers, list:<at://uri> */
    blueskyThreadgate?: string;
    /** Alias of blueskyThreadgate */
    blueskyReplySettings?: string;
    /** `disable_quotes` or `true` to block quotes */
    blueskyPostgate?: string | boolean;
    /** Alias of blueskyPostgate */
    blueskyQuoteSettings?: string | boolean;
    /** Quote a post (bsky.app URL or at:// URI) */
    blueskyQuoteUri?: string;
    blueskyQuoteId?: string;
    blueskyQuoteUrl?: string;
  }

  export interface DiscordOptions {
    discordThreadId?: string;
    discordThreadName?: string;
    discordAppliedTags?: string | string[];
    discordEmbeds?: Array<Record<string, unknown>> | string;
    discordUsername?: string;
    discordAvatarUrl?: string;
    discordAllowedMentions?: Record<string, unknown> | string;
    discordAltText?: string | string[];
    discordFlags?: number;
    discordTts?: boolean;
    discordPoll?: Record<string, unknown> | string;
    discordMaxFileMb?: number;
  }

  export interface TelegramOptions {
    telegramParseMode?: 'MarkdownV2' | 'HTML' | string;
    telegramMessageThreadId?: number | string;
    telegramDisableNotification?: boolean;
    telegramProtectContent?: boolean;
    telegramHasSpoiler?: boolean;
    telegramLinkPreview?: boolean;
    telegramReplyMarkup?: Record<string, unknown> | string;
    telegramCaptionOverflow?: 'truncate' | 'split';
    telegramAsDocument?: boolean;
    telegramMediaUrls?: string | string[];
  }

  export interface MastodonOptions {
    mastodonVisibility?: 'public' | 'unlisted' | 'private' | 'direct';
    mastodonSensitive?: boolean;
    mastodonSpoilerText?: string;
    mastodonLanguage?: string;
    mastodonAltText?: string | string[];
    mastodonPollOptions?: string | string[];
    mastodonPollExpiresIn?: number;
    mastodonPollMultiple?: boolean;
    mastodonScheduledAt?: string;
  }

  export interface WordpressOptions {
    wordpressStatus?: 'publish' | 'draft' | 'pending' | 'future';
    wordpressDate?: string;
    wordpressCategories?: string | string[];
    wordpressTags?: string | string[];
    wordpressExcerpt?: string;
    wordpressSlug?: string;
    wordpressAltText?: string;
    wordpressMediaCaption?: string;
    wordpressBlockFormat?: boolean;
  }

  export interface LemmyOptions {
    lemmyUrl?: string;
    lemmyCommunity?: string;
    lemmyNsfw?: boolean;
    lemmyLanguageId?: number | string;
    lemmyAltText?: string;
  }

  export interface SlackOptions {
    slackMarkdown?: boolean;
    slackBlocks?: Array<Record<string, unknown>> | string;
    slackMrkdwn?: boolean;
    slackAltText?: string;
    slackFirstCommentMode?: 'separate' | 'inline';
  }

  export interface NostrOptions {
    nostrKind?: 1 | 20 | 22 | 34235 | 30023 | number;
    nostrLongForm?: boolean;
  }

  export interface DevtoOptions {
    devtoTags?: string | string[];
    devtoCanonicalUrl?: string;
    devtoDescription?: string;
    devtoMainImage?: string;
    devtoSeries?: string;
    devtoPublished?: boolean;
  }

  export interface HashnodeOptions {
    hashnodeTags?: string | string[];
    hashnodeOriginalArticleUrl?: string;
    hashnodeSubtitle?: string;
    hashnodeCoverImageUrl?: string;
    hashnodeDraft?: boolean;
    hashnodeBody?: string;
    /** Alias of hashnodeBody */
    content?: string;
  }

  export interface WhopOptions {
    whopBody?: string;
    whopPinned?: boolean;
    whopIsMention?: boolean;
    whopPaywallAmount?: number;
    whopPaywallCurrency?: string;
    whopAttachmentIds?: string | string[];
  }

  export interface ListmonkOptions {
    listmonkContentType?: 'richtext' | 'markdown' | 'html' | 'plain';
    listmonkSendAt?: string;
    listmonkLists?: string | string[];
    listmonkTemplateId?: string | number;
    listmonkMediaIds?: string | string[];
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
    /** BCP-47 language code. Default "en" */
    gbpLanguageCode?: string;
    /** Alias of gbpOfferCoupon */
    gbpCouponCode?: string;
    /** Alias of gbpOfferRedeemUrl */
    gbpRedeemUrl?: string;
    /** Alias of gbpOfferTerms */
    gbpTerms?: string;
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
    GoogleBusinessOptions,
    BlueskyOptions,
    DiscordOptions,
    TelegramOptions,
    MastodonOptions,
    WordpressOptions {
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
    GoogleBusinessOptions,
    BlueskyOptions,
    DiscordOptions,
    TelegramOptions,
    MastodonOptions,
    LemmyOptions,
    WordpressOptions {
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
    GoogleBusinessOptions,
    BlueskyOptions,
    DiscordOptions,
    TelegramOptions,
    SlackOptions,
    MastodonOptions,
    NostrOptions,
    LemmyOptions,
    DevtoOptions,
    HashnodeOptions,
    WordpressOptions,
    WhopOptions,
    ListmonkOptions {
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
    linkedinAltText?: string | string[];
    linkedinDisableReshare?: boolean;
    linkedinTargetCheckAudience?: boolean;
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

  // ==================== Audience, Suggestions and Comment Actions ====================

  /** One row of an audience breakdown: a bucket and its share. */
  export interface AudienceSlice {
    name?: string;
    value?: number;
    percentage?: number;
    [key: string]: any;
  }

  /** Category averages returned when `benchmarkCategory` is asked for. */
  export interface AudienceBenchmark {
    category?: string;
    average_comments?: number;
    average_engagement_rate?: number;
    average_follower_count?: number;
    average_follower_growth?: number;
    average_likes?: number;
    average_shares?: number;
    average_video_count?: number;
    average_video_views?: number;
    [key: string]: any;
  }

  export interface AudienceResponse {
    success: boolean;
    platform?: string;
    /** The window actually used after the 60-day / not-today clamps. */
    range?: { start_date?: string; end_date?: string };
    audience?: {
      countries?: AudienceSlice[];
      cities?: AudienceSlice[];
      ages?: AudienceSlice[];
      genders?: AudienceSlice[];
    };
    /** Followers online per hour of the day, e.g. `{ hour: '14', followers_online: 1494 }`. */
    activity_by_hour?: Array<{ hour?: string; followers_online?: number; [key: string]: any }>;
    /** Follower count per day inside the window. */
    followers_daily?: Array<{ date?: string; total?: number; new?: number; lost?: number; [key: string]: any }>;
    /** Taps on the profile: bio link, address, app download, email, phone, leads. */
    profile_actions?: Record<string, number>;
    bio_description?: string | null;
    /** Every category `benchmarkCategory` accepts, so a picker needs no extra call. */
    benchmark_categories?: string[];
    /** Only when a `benchmarkCategory` was asked for. */
    benchmark?: AudienceBenchmark;
    [key: string]: any;
  }

  /** Which kind of suggestion `getSuggestions` asks for. */
  export type SuggestionType = 'hashtags' | 'keywords';

  export interface SuggestionsResponse {
    success: boolean;
    platform?: string;
    type?: SuggestionType;
    query?: string | null;
    /** With `type: 'hashtags'`. */
    hashtags?: Array<{ name?: string; view_count?: number; [key: string]: any }>;
    /** With `type: 'keywords'`. */
    keywords?: Array<Record<string, any>>;
    [key: string]: any;
  }

  /** What `commentAction` does to a comment. Each action carries its own inverse. */
  export type CommentActionValue = 'hide' | 'unhide' | 'like' | 'unlike' | 'pin' | 'unpin';

  export interface CommentActionResponse {
    success: boolean;
    platform?: string;
    action?: CommentActionValue;
    comment_id?: string;
    result?: Record<string, any>;
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
     * Get analytics for a specific post across all platforms.
     *
     * `post_metrics` carries whatever the platform reports, so it is not the
     * same shape everywhere: TikTok adds `retention` (the curve, second by
     * second), `impression_sources` (For You, search, profile...),
     * `audience_types` (followers vs non-followers), `new_followers`, `reach`
     * and the watch times (`average_time_watched`, `total_time_watched`,
     * `full_video_watched_rate`) on top of the usual counters.
     *
     * @param requestId - The request_id from the upload
     */
    getPostAnalytics(requestId: string): Promise<{
      success: boolean;
      post: { request_id: string; profile_username: string; post_title: string; post_caption: string; media_type: string; upload_timestamp: string };
      platforms: Record<string, {
        success: boolean;
        platform_post_id?: string;
        post_url?: string;
        /** Counters plus, on TikTok, retention / impression_sources / audience_types and watch times. */
        post_metrics?: Record<string, any>;
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
     * Get who the audience is: where they are, how old they are, when they are
     * online and what they tap on the profile.
     *
     * One endpoint for every platform, chosen with `platform`; a platform that
     * cannot answer it returns `platform_not_supported` with the list of the
     * ones that can. The window is clamped server-side to at most 60 days
     * ending before today.
     *
     * @param options - Query options
     */
    getAudience(options: {
      user: string;
      platform: 'tiktok';
      /** Window start, ISO `YYYY-MM-DD`. */
      startDate?: string;
      /** Window end, ISO `YYYY-MM-DD`. Always clamped to before today. */
      endDate?: string;
      /** Compare the account against this category's averages. */
      benchmarkCategory?: string;
    }): Promise<AudienceResponse>;

    /**
     * Get what to write about: the hashtags or the searches a platform
     * suggests around a keyword.
     *
     * One endpoint for both questions, told apart by `type`, and one endpoint
     * for every platform, chosen with `platform`.
     *
     * @param options - Query options
     */
    getSuggestions(options: {
      user: string;
      platform: 'tiktok';
      type: SuggestionType;
      /** Keyword to get suggestions around. */
      q?: string;
      countryCode?: string;
      language?: string;
    }): Promise<SuggestionsResponse>;

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

    // Comments

    /**
     * Get comments on a post, or the replies hanging from one of them.
     *
     * Pass `commentId` to read that comment's replies instead of the post's
     * top-level comments.
     *
     * @param options - Query options
     */
    getPostComments(options: {
      user: string;
      platform?: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'tiktok';
      postId?: string;
      postUrl?: string;
      /** Read the replies to this comment instead of the post's top-level comments. */
      commentId?: string;
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
      platform: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'tiktok';
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
      platform: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'tiktok';
      commentId: string;
      /** Post identifier (the post URN for LinkedIn) */
      postId?: string;
    }): Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;

    /**
     * Moderate a comment: hide, like or pin it — and undo any of the three.
     *
     * One method for every platform, chosen with `platform`. `postId` is
     * required for hide/unhide and pin/unpin; like/unlike take the comment
     * alone and never send it.
     *
     * @param options - Action options
     */
    commentAction(options: {
      user: string;
      platform: 'tiktok';
      commentId: string;
      action: CommentActionValue;
      /** Required for hide/unhide and pin/unpin; never sent for like/unlike. */
      postId?: string;
    }): Promise<CommentActionResponse>;

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
