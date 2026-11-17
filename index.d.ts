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
  export type FacebookPhotoMediaType = 'POSTS' | 'STORIES';
  export type InstagramShareMode = 'TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED' | 'TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS';

  /** X (Twitter) reply settings */
  export type XReplySettings = 'everyone' | 'following' | 'mentionedUsers' | 'subscribers' | 'verified';

  // ==================== Common Options ====================

  export interface CommonUploadOptions {
    /** Post title/caption. Required for YouTube, Reddit, and text posts. Optional for TikTok, Instagram, Facebook, LinkedIn, X, Threads, Bluesky, Pinterest. */
    title?: string;
    /**
     * Images attached to the first comment (Reddit; not on scheduled or queued
     * posts): local paths, Buffers or URLs. The API takes files only, so URLs are
     * downloaded by the SDK and sent as files.
     */
    firstCommentMedia?: string | Buffer | Array<string | Buffer>;
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
    /** Telegram text / caption (falls back to `title`) */
    telegramTitle?: string;
    /** Telegram first comment (falls back to `firstComment`) */
    telegramFirstComment?: string;
    /**
     * Sponsored / paid-partnership post. Mapped to each network's native label
     * (TikTok brand_content_toggle, YouTube hasPaidProductPlacement, X
     * paid_partnership; Facebook and Pinterest also need their sponsor id).
     * Networks without a native label publish without it and the response carries
     * a warning. A network-specific field wins over this one.
     */
    paidPartnership?: boolean;
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
    /** TikTok "Disclose post content" switch; send it with tiktokYourBrand and/or tiktokBrandedContent */
    tiktokDiscloseCommercial?: boolean;
    /** Alias of tiktokDiscloseCommercial */
    discloseCommercial?: boolean;
    /** Promoting your own brand (with tiktokDiscloseCommercial) */
    tiktokYourBrand?: boolean;
    yourBrand?: boolean;
    /** Branded content for a third party (with tiktokDiscloseCommercial) */
    tiktokBrandedContent?: boolean;
    brandedContent?: boolean;
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
    /** TikTok "Disclose post content" switch; send it with tiktokYourBrand and/or tiktokBrandedContent */
    tiktokDiscloseCommercial?: boolean;
    /** Alias of tiktokDiscloseCommercial */
    discloseCommercial?: boolean;
    /** Promoting your own brand (with tiktokDiscloseCommercial) */
    tiktokYourBrand?: boolean;
    yourBrand?: boolean;
    /** Branded content for a third party (with tiktokDiscloseCommercial) */
    tiktokBrandedContent?: boolean;
    brandedContent?: boolean;

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
    /** Trial Reel: shown to non-followers first. Sent as share_mode */
    instagramShareMode?: InstagramShareMode;
    /** AI-generated content label. Sent as the generic is_ai_generated field */
    instagramIsAiGenerated?: boolean;
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
    /** AI-generated content label. Sent as the generic is_ai_generated field */
    instagramIsAiGenerated?: boolean;
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
    /** Custom thumbnail as a file: local path, stream or Buffer (sent as `thumbnail`) */
    youtubeThumbnail?: string | Buffer | NodeJS.ReadableStream;
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
    /** Translated title and description per language: { es: { title, description }, 'pt-BR': { title } } */
    youtubeLocalizations?: Record<string, { title?: string; description?: string }> | string;
    /** Brand partner channel id (UC…, 24 characters) for creator-initiated brand partner access */
    youtubeBrandPartner?: string;
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
    /** Custom video cover URL. Generic API field: X, YouTube, LinkedIn and Facebook (only when facebookMediaType is 'VIDEO') read it */
    thumbnailUrl?: string;
    /** Facebook Place ID */
    facebookPlaceId?: string;
    /** Geographic/age/language targeting */
    facebookTargeting?: Record<string, unknown> | string;
    /** Feed targeting */
    facebookFeedTargeting?: Record<string, unknown> | string;
    /** Sponsor's Facebook Page id for the branded content tag (not on Reels/Stories) */
    facebookSponsorId?: string;
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
    /** POSTS (default) publishes to the feed, STORIES as a Page story */
    facebookMediaType?: FacebookPhotoMediaType;
    /** Facebook Place ID */
    facebookPlaceId?: string;
    /** Geographic/age/language targeting */
    facebookTargeting?: Record<string, unknown> | string;
    /** Feed targeting */
    facebookFeedTargeting?: Record<string, unknown> | string;
    /** Sponsor's Facebook Page id for the branded content tag (not on Reels/Stories) */
    facebookSponsorId?: string;
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
    /** Sponsor's Facebook Page id for the branded content tag (not on Reels/Stories) */
    facebookSponsorId?: string;
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
    /** Sponsor account id for Pinterest's paid partnership label (closed beta) */
    pinterestSponsorId?: string;
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
    /** Sponsor account id for Pinterest's paid partnership label (closed beta) */
    pinterestSponsorId?: string;
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
    /** User ids that may not reply (with replyToId) */
    xExcludeReplyUserIds?: string[] | string;
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
    /** Disclose that the post contains AI-generated media (X `made_with_ai`). Alias: isAiGenerated */
    madeWithAi?: boolean;
    /** Same as madeWithAi */
    xMadeWithAi?: boolean;
    /** Cross-platform alias of madeWithAi (API `is_ai_generated`) */
    isAiGenerated?: boolean;
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
    /** X Article body (plain text / light Markdown). Articles have two heading levels: `###` becomes `header-two`. */
    xArticleBody?: string;
    /** DraftJS content_state JSON (`header-one` / `header-two`; a `header-three` block is converted to `header-two`) */
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
    /** Reddit-specific title (falls back to `title`) */
    redditTitle?: string;
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
    /**
     * Publish up to 10 images as an `app.bsky.embed.gallery` (default: first 4).
     * With 11 or more, the first 10 are published and the response carries a
     * `warnings` entry; the post does not fail.
     */
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
    /** Up to 8 extra hashtags stored on the post without appearing in the text */
    blueskyTags?: string | string[];
    /** Date Bluesky shows and sorts the post by (ISO 8601 with timezone, not in the future) */
    blueskyCreatedAt?: string;
    /** Text longer than 300 characters: publish the rest as replies instead of cutting it */
    blueskyThreadOverflow?: boolean;
    /** Publish a single animated GIF as a looping video */
    blueskyGifAsVideo?: boolean;
    /** Video subtitle tracks: [{ lang, url }] or [{ lang, vtt }] (WebVTT, up to 20) */
    blueskyCaptions?: Array<Record<string, unknown>> | string;
    /** `default` or `gif` (looping, muted, no controls) */
    blueskyVideoPresentation?: 'default' | 'gif';
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
    /** Pin the message after sending it (silent unless telegramPinNotify) */
    telegramPin?: boolean;
    telegramPinNotify?: boolean;
    /** Send a poll: { question, options, type, allows_multiple_answers, correct_option_id, ... } */
    telegramPoll?: Record<string, unknown> | string;
    /** Send a location: { latitude, longitude, live_period, ... } */
    telegramLocation?: Record<string, unknown> | string;
    /** Send a venue: { latitude, longitude, title, address, ... } */
    telegramVenue?: Record<string, unknown> | string;
    /** Send a contact: { phone_number, first_name, ... } */
    telegramContact?: Record<string, unknown> | string;
    /** Send a dice: emoji, or true for 🎲 */
    telegramDice?: string | boolean;
    telegramGameShortName?: string;
    telegramRichMessage?: Record<string, unknown> | string;
    /** Reply to a message of the chat (with telegramReplyQuote) */
    telegramReplyToMessageId?: number | string;
    telegramReplyQuote?: string;
    telegramReplyParameters?: Record<string, unknown> | string;
    telegramLinkPreviewOptions?: Record<string, unknown> | string;
    telegramEntities?: Array<Record<string, unknown>> | string;
    telegramCaptionEntities?: Array<Record<string, unknown>> | string;
    telegramShowCaptionAboveMedia?: boolean;
    /** first comment sent as a reply to the post (default true) */
    telegramFirstCommentAsReply?: boolean;
    telegramDirectMessagesTopicId?: number | string;
    telegramSuggestedPostParameters?: Record<string, unknown> | string;
    telegramEphemeralMessageParameters?: Record<string, unknown> | string;
    telegramMessageEffectId?: string;
    /** Let Telegram download the media from its URL */
    telegramSendByUrl?: boolean;
    /** animation, video_note, live_photo, document, audio, voice, sticker... */
    telegramSendAs?: string;
    /** Paid media: Stars needed to unlock it (1-25000) */
    telegramPaidStarCount?: number;
    telegramPaidPayload?: string;
    /** Video cover: local path, stream, Buffer, URL or file_id */
    telegramCover?: string | Buffer | NodeJS.ReadableStream;
    /** Thumbnail (JPEG ≤ 200 kB): local path, stream or Buffer */
    telegramThumbnail?: string | Buffer | NodeJS.ReadableStream;
    telegramStartTimestamp?: number;
    telegramDisableContentTypeDetection?: boolean;
    telegramLivePhotoPhoto?: string | Buffer | NodeJS.ReadableStream;
    telegramPerformer?: string;
    telegramTitleAudio?: string;
    telegramDuration?: number;
    telegramLength?: number;
    telegramEmoji?: string;
    /** Allow paid broadcasts (spends the bot's Stars above 30 messages/s) */
    telegramAllowPaidBroadcast?: boolean;
    /** Send the text before a video note, sticker, location... (default true) */
    telegramSendTitle?: boolean;
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
    gbpMediaUrl?: string | string[];
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
    /** Alert kind for ALERT posts (Google accepts `COVID_19`) */
    gbpAlertType?: string;
    /** Same as gbpPostType MEDIA: upload to the gallery */
    gbpUploadToGallery?: boolean;
    /** Send every photo (max 10) instead of only the first one */
    gbpMultiMedia?: boolean;
    /** EVENT and OFFER only: DAILY, WEEKLY or MONTHLY */
    gbpRecurrence?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    /** WEEKLY: comma-separated days (MONDAY,THURSDAY) */
    gbpRecurrenceDays?: string;
    /** MONTHLY: 1-31 */
    gbpRecurrenceDayOfMonth?: number;
    /** MONTHLY: FIRST, SECOND, THIRD, FOURTH or LAST */
    gbpRecurrenceWeekOccurrence?: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'LAST';
    /** End of the series (YYYY-MM-DD or RFC 3339) */
    gbpRecurrenceEnd?: string;
    /** Google's own scheduling (RFC 3339 with time zone) */
    gbpScheduledTime?: string;
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

  export interface UploadDocumentOptions extends TelegramOptions {
    /** Post title/caption */
    title: string;
    /** User identifier (profile name) */
    user: string;
    /** `linkedin` (default) and/or `telegram`; any other platform is ignored */
    platforms?: ('linkedin' | 'telegram')[];
    /** Telegram: comment sent after the document */
    telegramFirstComment?: string;
    /** Document description/commentary */
    description?: string;
    /** Visibility setting */
    linkedinVisibility?: LinkedInVisibility;
    /** Page ID for organization posts */
    targetLinkedinPageId?: string;
    /** Comment posted under the document right after publishing */
    firstComment?: string;
    /** Same as firstComment, LinkedIn-specific name */
    linkedinFirstComment?: string;
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
    /**
     * Not generally available yet (team roles and post approvals). `true` when the
     * caller is an Editor or Contributor team member (HTTP 202): nothing is
     * published or scheduled; the post waits for review (`approval_status:
     * 'pending_approval'`) or stays as a draft (`'draft'`). Follow it with
     * `getPostApproval({ approvalId })` or `getStatus(request_id)`.
     */
    pending_approval?: boolean;
    approval_id?: string;
    approval_status?: 'pending_approval' | 'draft';
    /** `null` while the post waits for approval. */
    job_id?: string | null;
    scheduled_date?: string | null;
    queued?: boolean;
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

  /** Body of PATCH /api/uploadposts/schedule/<job_id>. Every key is optional. */
  export interface EditScheduledOptions {
    /** New publish date (ISO 8601); must be in the future and within 1 year */
    scheduledDate?: string;
    /** IANA timezone `scheduledDate` is read in (default UTC) */
    timezone?: string;
    /** New title for every platform */
    title?: string;
    /** New caption/description for every platform */
    caption?: string;
    /** Alias of caption */
    description?: string;
    /** Per-platform text; only the platforms listed are touched */
    platformContent?: Record<string, { title?: string; caption?: string }>;
    /**
     * Any other editable upload option, keyed by its API form name
     * (e.g. `privacyStatus`, `tags`, `disable_comment`, `instagram_first_comment`,
     * `gbp_cta_url`). `null` removes the option; unknown or internal keys are ignored.
     */
    fields?: Record<string, string | number | boolean | string[] | null>;
    /** Native YouTube scheduling (RFC3339), sent as `fields.youtube_publish_at`; `null` removes it */
    youtubePublishAt?: string | null;
    /** New cover image (Instagram / Facebook Reels) as base64 or a data URL */
    coverImageBase64?: string;
    /** File name of the new cover (default `cover.jpg`) */
    coverFilename?: string;
    /** MIME type of the new cover (default `image/jpeg`) */
    coverContentType?: string;
    /** Remove the custom cover */
    removeCover?: boolean;
  }

  export interface EditScheduledResponse {
    success: boolean;
    job_id?: string;
    scheduled_date?: string;
    title?: string;
    caption?: string;
    platform_content?: Record<string, { title: string; caption: string }>;
    error?: string;
    error_code?: string;
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

  // ==================== Client options & errors ====================

  export interface UploadPostClientOptions {
    /**
     * Team members only: email of the account owner to act on, sent as the
     * `X-Act-As-User` header. A seat the owner's plan no longer covers fails
     * with HTTP 403 and `error.code === 'TEAM_SEAT_SUSPENDED'`.
     */
    actAsUser?: string;
  }

  /**
   * What every method throws on a non-2xx answer. `message` keeps the
   * `Upload-Post API error: ...` text; the rest is machine-readable.
   */
  export interface UploadPostApiError extends Error {
    /** HTTP status, when the API answered */
    status?: number;
    /** `code` or `error_code` of the body (e.g. `TEAM_SEAT_SUSPENDED`, `bluesky_dm_scope_missing`); the network code when there was no answer */
    code?: string;
    /** `error_code` of the body, when present */
    errorCode?: string;
    /** `reason` of the body (e.g. `owner_plan_limit`, `webhook_removed`) */
    reason?: string;
    /** `Retry-After` header in seconds, when sent (rate limits) */
    retryAfter?: number;
    /** The full error body */
    response?: any;
  }

  // ==================== Notifications & webhooks ====================

  export type WebhookEvent =
    | 'upload_completed'
    | 'social_account_connected'
    | 'social_account_disconnected'
    | 'social_account_reauth_required'
    | 'dm_received'
    | 'comment_received';

  export interface NotificationsResponse {
    success: boolean;
    notifications?: {
      channels?: Record<string, boolean>;
      webhook_url?: string;
      webhook_events?: string[];
      webhook_secret?: string;
      channel_health?: Record<string, any>;
      [key: string]: any;
    };
    /** @deprecated The API answers with `notifications`; kept for compatibility. */
    config?: { webhook_events?: string[]; webhook_url?: string; [key: string]: any };
  }

  export interface ProfileWebhookResponse {
    success: boolean;
    profile_username?: string;
    webhook_url?: string | null;
    webhook_events?: Partial<Record<WebhookEvent, boolean>> | null;
    message?: string;
  }

  export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'cancelled';

  export interface WebhookDeliveryAttempt {
    attempt: number;
    at: string;
    ok: boolean;
    status_code: number | null;
    /** `timeout`, `connection_error` or another short label when there was no HTTP answer */
    error: string | null;
    duration_ms: number;
  }

  export interface WebhookDelivery {
    /** Same as the `X-Upload-Post-Delivery` header; unchanged across retries */
    delivery_id: string;
    event: string;
    status: WebhookDeliveryStatus;
    target: 'account' | 'profile';
    profile_username: string | null;
    /** Webhook URL without its query string */
    url: string;
    request_id: string | null;
    job_id: string | null;
    platform: string | null;
    /** Sent by testNotifications(): logged, never retried */
    test: boolean;
    attempt_count: number;
    max_attempts: number;
    last_status_code: number | null;
    last_error: string | null;
    next_attempt_at: string | null;
    created_at: string;
    updated_at: string;
    delivered_at: string | null;
    redelivery_of: string | null;
    redelivery_count: number;
    attempts: WebhookDeliveryAttempt[];
    /** The exact body sent. Only with includePayload, or from getWebhookDelivery() */
    payload?: Record<string, any>;
    [key: string]: any;
  }

  export interface ListWebhookDeliveriesOptions {
    event?: WebhookEvent | string;
    status?: WebhookDeliveryStatus;
    requestId?: string;
    jobId?: string;
    profileUsername?: string;
    /** 1-100, default 20 */
    limit?: number;
    /** 1-50 */
    page?: number;
    includePayload?: boolean;
  }

  export interface WebhookDeliveriesResponse {
    success: boolean;
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
    retention_days: number;
    deliveries: WebhookDelivery[];
  }

  export interface WebhookDeliveryResponse {
    success: boolean;
    delivery: WebhookDelivery;
  }

  // ==================== Teams ====================

  export interface TeamMember {
    email: string;
    status?: string;
    invited_at?: string;
    /** Only when seat limits are enforced */
    suspended?: boolean;
    suspended_reason?: 'owner_plan_limit' | null;
    /** With team roles on. */
    role?: 'admin' | 'editor' | 'contributor' | 'viewer';
    /** With team roles on: profiles this member can use (`null` = every profile). */
    profiles?: string[] | null;
    [key: string]: any;
  }

  export interface TeamMembersResponse {
    success: boolean;
    team_members: TeamMember[];
    /** Plan group (basic, professional, advanced, business), when seat limits are enforced */
    plan?: string;
    /** Members the plan covers, when seat limits are enforced */
    seat_limit?: number;
  }

  export interface SharedAccountsResponse {
    success: boolean;
    accounts: Array<{
      owner_email: string;
      owner_name: string;
      status: string;
      suspended?: boolean;
      suspended_reason?: 'owner_plan_limit' | null;
      /** With team roles on: your role in that account. */
      role?: string;
      /** With team roles on: profiles you can use there (`null` = every profile). */
      profiles?: string[] | null;
    }>;
  }

  // ==================== AutoDM ====================

  export type AutodmPlatform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'threads' | 'bluesky';

  export interface StartAutodmOptions {
    profileUsername: string;
    replyMessage: string;
    platform?: AutodmPlatform;
    /** Required on Instagram */
    postUrl?: string;
    /** Post id on the other platforms (or postUrl) */
    postId?: string;
    /** Public replies only: up to 5 alternative texts, rotated */
    replyMessages?: string[];
    /** Instagram only: up to 3 link buttons */
    buttons?: Array<{ title: string; url: string }>;
    /** Minutes, minimum and default 15 */
    monitoringInterval?: number;
    triggerKeywords?: string | string[];
  }

  export type AutodmRuleTrigger = 'comment' | 'story_reply' | 'story_mention' | 'dm_keyword';

  export interface CreateAutodmRuleOptions {
    /** Profile with the Instagram account connected */
    profileUsername: string;
    /** Max 1,000 characters; 640 with buttons */
    replyMessage: string;
    /** Default `['comment']` */
    triggers?: AutodmRuleTrigger[] | AutodmRuleTrigger;
    /** Up to 20, case- and accent-insensitive. Required for `dm_keyword`. Omit or `[]` for no filter */
    triggerKeywords?: string[] | string;
    /** Up to 3 link buttons */
    buttons?: Array<{ title: string; url: string }>;
    /** Whole number 0-720, default 24. Story/DM triggers never go below 24 */
    perUserCooldownHours?: number;
    /** Only `instagram` is supported */
    platform?: 'instagram';
  }

  export interface AutodmRule {
    rule_id: string;
    scope: 'account';
    platform: 'instagram';
    profile_username: string;
    triggers: AutodmRuleTrigger[];
    trigger_keywords: string[];
    reply_message: string;
    buttons: Array<{ type: string; url: string; title: string }>;
    per_user_cooldown_hours: number;
    /** Effective cooldown for story/DM triggers (at least 24) */
    message_cooldown_hours: number;
    status: 'active' | 'paused' | 'reconnect_required' | 'stopped' | 'disabled';
    /** Set when `status` is `stopped`: account_moved, account_disconnected, profile_unlinked, profile_deleted, user_missing */
    stop_reason: string | null;
    is_paused: boolean;
    created_at: string;
    paused_at: string | null;
    last_triggered_at: string | null;
    last_sent_at: string | null;
    stats: Record<string, number>;
    /** Events queued for sending */
    pending: number;
    webhook: {
      subscribed: boolean;
      fields: string[];
      receiving_events: boolean;
      last_event_at: string | null;
      last_event_age_hours: number | null;
      /** Plain-language hint when no events arrived in 6 hours */
      hint: string | null;
      error: string | null;
    };
    [key: string]: any;
  }

  export interface AutodmRuleResponse {
    success: boolean;
    rule?: AutodmRule;
    [key: string]: any;
  }

  export interface AutodmRulesResponse {
    success: boolean;
    enabled: boolean;
    rules: AutodmRule[];
    total: number;
  }

  // ==================== Direct messages ====================

  export type DmPlatform = 'instagram' | 'facebook' | 'whatsapp' | 'bluesky' | 'telegram';

  /** Any API field, by its API name (top-level camelCase keys are sent as snake_case). */
  export interface ApiParams {
    [key: string]: any;
  }

  export interface ApiResponse {
    success?: boolean;
    [key: string]: any;
  }

  export interface SendDmOptions {
    platform: DmPlatform;
    /** Profile username */
    user: string;
    /** Platform id of the person. Bluesky: handle, `@handle`, DID or profile link */
    recipientId?: string;
    /** Bluesky: send into this conversation (also groups) instead of recipientId */
    conversationId?: string;
    /** Optional with attachments, templates or senderAction. Bluesky: max 1,000 characters, 10 mentions */
    message?: string;
    /** Media / attachments. Bluesky: only a shared post, `{ type: 'post', url }` or `{ type: 'post', uri }` */
    attachments?: Record<string, any> | Array<Record<string, any>>;
    /** Instagram, Messenger, WhatsApp: link buttons */
    buttons?: Array<{ title: string; url?: string; [key: string]: any }>;
    /** Instagram / Messenger */
    quickReplies?: Array<Record<string, any>>;
    /** Instagram generic template */
    genericTemplate?: Record<string, any> | Array<Record<string, any>>;
    /**
     * Instagram: typing_on, typing_off, mark_seen, react, unreact.
     * Bluesky: mark_seen / mark_read, react, unreact, delete, accept, mute, unmute, leave.
     * WhatsApp: mark_read.
     */
    senderAction?: string;
    /** Emoji for react/unreact (Bluesky: exactly one emoji). WhatsApp: reaction object */
    reaction?: string | Record<string, any>;
    /** Message to react to, mark read or delete */
    messageId?: string;
    /** Message to reply to */
    replyTo?: string;
    /** WhatsApp approved template / Messenger utility template */
    template?: Record<string, any>;
    /** Messenger message tag (`HUMAN_AGENT`) */
    tag?: string;
    /** Messenger: Facebook Page id */
    pageId?: string;
    /** WhatsApp rich bodies */
    location?: Record<string, any>;
    contacts?: Array<Record<string, any>>;
    list?: Record<string, any>;
    ctaUrl?: Record<string, any>;
    header?: Record<string, any> | string;
    footer?: string;
    typing?: boolean;
    /** Any other API field, sent as given */
    [key: string]: any;
  }

  export interface DmConversationsOptions {
    platform: DmPlatform;
    user: string;
    /** Conversations per page (Bluesky max 25) */
    limit?: number;
    cursor?: string;
    /** Unix seconds/ms or ISO 8601 */
    since?: string | number;
    /** Bluesky: handle or DID */
    participantId?: string;
    /** 1-25, default 10 */
    messagesLimit?: number;
    /** Bluesky only */
    conversationId?: string;
    /** Bluesky only, with conversationId */
    messagesCursor?: string;
    /** Bluesky only */
    status?: 'request' | 'accepted';
    /** Bluesky only */
    readState?: 'unread';
    /** Messenger: Facebook Page id */
    pageId?: string;
    [key: string]: any;
  }

  export interface DmConversationsResponse {
    success: boolean;
    conversations: Array<Record<string, any>>;
    pagination?: { next_cursor?: string | null; has_more?: boolean; [key: string]: any };
    [key: string]: any;
  }

  // ==================== LinkedIn ====================

  export interface LinkedinOrganizationResponse {
    success: boolean;
    /** `urn:li:organization:ID` */
    urn: string;
    id: string;
    /** Exact Page name LinkedIn requires for the mention to link */
    name: string;
    vanity_name: string | null;
    /** Ready to paste: `@[Name](urn:li:organization:ID)` */
    mention: string | null;
    cached: boolean;
  }

  // ==================== Client Class ====================

  /**
   * Upload-Post API client
   * 
   * Supports uploading to: TikTok, Instagram, YouTube, LinkedIn, Facebook,
   * Pinterest, Threads, Reddit, Bluesky, X (Twitter), Discord, Telegram
   */
  // ==================== Generated from the OpenAPI spec ====================
  // Options and answers of the generated methods. Written by codegen/generate.py.
  // <openapi:types>
  /** Options of `sendTelegramGift` (`POST /api/uploadposts/telegram/gifts`). Any other API field is sent as well. */
  export interface SendTelegramGiftOptions extends ApiParams {
    /** Profile username. */
    user: string;
    userId?: number;
    chatId?: string;
    giftId: string;
    maxStarCount: number;
    payForUpgrade?: boolean;
    text?: string;
    textParseMode?: string;
    textEntities?: (Record<string, any>)[];
    confirm: boolean;
    idempotencyKey: string;
  }

  /** Answer of `sendTelegramGift`. */
  export interface SendTelegramGiftResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `giftTelegramPremium` (`POST /api/uploadposts/telegram/gifts/premium`). Any other API field is sent as well. */
  export interface GiftTelegramPremiumOptions extends ApiParams {
    /** Profile username. */
    user: string;
    userId: number;
    monthCount: 3 | 6 | 12;
    starCount: 1000 | 1500 | 2500;
    text?: string;
    confirm: boolean;
    idempotencyKey: string;
  }

  /** Answer of `giftTelegramPremium`. */
  export interface GiftTelegramPremiumResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `getTelegramPaymentSettings` (`GET /api/uploadposts/telegram/payments/settings`). Any other API field is sent as well. */
  export interface GetTelegramPaymentSettingsOptions extends ApiParams {
    /** Profile username with Telegram connected. */
    user: string;
  }

  /** Answer of `getTelegramPaymentSettings`. */
  export interface GetTelegramPaymentSettingsResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `updateTelegramPaymentSettings` (`PUT /api/uploadposts/telegram/payments/settings`). Any other API field is sent as well. */
  export interface UpdateTelegramPaymentSettingsOptions extends ApiParams {
    /** Profile username. */
    user: string;
    preCheckout?: "off" | "approve" | "reject" | (string & {});
    /** Required for approve: maximum order total per currency, e.g. {"XTR": 500}. Setting pre_checkout to off without it clears the stored value. */
    maxTotalAmount?: Record<string, any>;
    allowedPayloadPrefixes?: string[];
    errorMessage?: string;
    shipping?: "off" | "static" | (string & {});
    shippingOptions?: (Record<string, any>)[];
    shippingCountries?: string[];
    onlyUploadPostInvoices?: boolean;
    /** Required to save a rule that answers (approve, reject, shipping static). */
    confirm?: boolean;
  }

  /** Answer of `updateTelegramPaymentSettings`. */
  export interface UpdateTelegramPaymentSettingsResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `setTelegramUpdates` (`POST /api/uploadposts/telegram/updates`). Any other API field is sent as well. */
  export interface SetTelegramUpdatesOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** true to receive, false to stop. */
    enabled: boolean;
    /** Replace a webhook that is not Upload-Post's. */
    replaceExistingWebhook?: boolean;
    /** https URL that also gets every raw update, signed with your webhook secret (required), one attempt. */
    forwardUrl?: string;
    /** Also receive and keep the chats of the connected Telegram Business account (default false). */
    businessChats?: boolean;
    /** Empty answerCallbackQuery if you did not answer a button press in ~8 s. */
    autoAnswerCallbacks?: boolean;
    extraUpdates?: ("channel_post" | "edited_channel_post" | "chat_member" | "chat_boost" | "removed_chat_boost" | "managed_bot" | "stopped_message_generation" | (string & {}))[];
  }

  /** Options of `answerTelegramQuery` (`POST /api/uploadposts/telegram/answer`). Any other API field is sent as well. */
  export interface AnswerTelegramQueryOptions extends ApiParams {
    /** Profile username. */
    user: string;
    type: "callback" | "inline" | "join_request" | "join_request_web_app" | "guest" | "widget" | "shipping" | "pre_checkout" | (string & {});
    /** The query id (or the official field: callback_query_id, inline_query_id...). */
    queryId?: string;
    /** callback: 0-200 characters. */
    text?: string;
    /** callback. */
    showAlert?: boolean;
    /** callback. */
    url?: string;
    /** callback / inline. */
    cacheTime?: number;
    /** inline: up to 50 InlineQueryResult. */
    results?: (Record<string, any>)[];
    /** inline. */
    isPersonal?: boolean;
    /** inline. */
    nextOffset?: string;
    /** inline: InlineQueryResultsButton. */
    button?: Record<string, any>;
    /** join_request: approve|decline|queue. guest: InlineQueryResult. */
    result?: any;
    /** join_request_web_app: https URL. */
    webAppUrl?: string;
    /** widget: up to 1024 bytes. */
    data?: string;
    /** shipping / pre_checkout. */
    ok?: boolean;
    shippingOptions?: (Record<string, any>)[];
    /** shipping / pre_checkout when ok is false. */
    errorMessage?: string;
  }

  /** Options of `getTelegramBusinessConnections` (`GET /api/uploadposts/telegram/business-connections`). Any other API field is sent as well. */
  export interface GetTelegramBusinessConnectionsOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Optional when the bot has one active Business connection. */
    businessConnectionId?: string;
  }

  /** Options of `getTelegramBusinessProfile` (`GET /api/uploadposts/telegram/business-profile`). Any other API field is sent as well. */
  export interface GetTelegramBusinessProfileOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Optional when the bot has one active Business connection. */
    businessConnectionId?: string;
  }

  /** Options of `updateTelegramBusinessProfile` (`PATCH /api/uploadposts/telegram/business-profile`). Any other API field is sent as well. */
  export interface UpdateTelegramBusinessProfileOptions extends ApiParams {
    /** Profile username. */
    user: string;
    businessConnectionId?: string;
    /** 1-64. */
    firstName?: string;
    /** 0-64. */
    lastName?: string;
    /** 0-32. */
    username?: string;
    /** 0-140. */
    bio?: string;
    /** Public URL of the new photo (JPG) or animation (MP4). */
    mediaUrl?: string;
    isPublic?: boolean;
    removePhoto?: boolean;
    /** {show_gift_button, accepted_gift_types}. */
    giftSettings?: Record<string, any>;
  }

  /** Options of `postTelegramStory` (`POST /api/uploadposts/telegram/business-stories`). Any other API field is sent as well. */
  export interface PostTelegramStoryOptions extends ApiParams {
    /** Profile username. */
    user: string;
    businessConnectionId?: string;
    /** Or a multipart 'file'. */
    mediaUrl?: string;
    /** 6, 12, 24 or 48 (hours) or the seconds. */
    activePeriod?: number;
    /** 0-2048. */
    caption?: string;
    parseMode?: string;
    captionEntities?: (Record<string, any>)[];
    areas?: (Record<string, any>)[];
    postToChatPage?: boolean;
    protectContent?: boolean;
    /** PATCH / DELETE. */
    storyId?: number;
  }

  /** Options of `editTelegramStory` (`PATCH /api/uploadposts/telegram/business-stories`). Any other API field is sent as well. */
  export interface EditTelegramStoryOptions extends ApiParams {
    /** Profile username. */
    user: string;
    businessConnectionId?: string;
    /** Or a multipart 'file'. */
    mediaUrl?: string;
    /** 6, 12, 24 or 48 (hours) or the seconds. */
    activePeriod?: number;
    /** 0-2048. */
    caption?: string;
    parseMode?: string;
    captionEntities?: (Record<string, any>)[];
    areas?: (Record<string, any>)[];
    postToChatPage?: boolean;
    protectContent?: boolean;
    /** PATCH / DELETE. */
    storyId?: number;
  }

  /** Options of `deleteTelegramStory` (`DELETE /api/uploadposts/telegram/business-stories`). Any other API field is sent as well. */
  export interface DeleteTelegramStoryOptions extends ApiParams {
    /** Profile username. */
    user: string;
    businessConnectionId?: string;
    /** Or a multipart 'file'. */
    mediaUrl?: string;
    /** 6, 12, 24 or 48 (hours) or the seconds. */
    activePeriod?: number;
    /** 0-2048. */
    caption?: string;
    parseMode?: string;
    captionEntities?: (Record<string, any>)[];
    areas?: (Record<string, any>)[];
    postToChatPage?: boolean;
    protectContent?: boolean;
    /** PATCH / DELETE. */
    storyId: number;
  }

  /** Options of `repostTelegramStory` (`POST /api/uploadposts/telegram/business-stories/repost`). Any other API field is sent as well. */
  export interface RepostTelegramStoryOptions extends ApiParams {
    user: string;
    businessConnectionId?: string;
    fromChatId: number;
    fromStoryId: number;
    activePeriod: number;
    postToChatPage?: boolean;
    protectContent?: boolean;
  }

  /** Options of `getTelegramBusinessGifts` (`GET /api/uploadposts/telegram/business-gifts`). Any other API field is sent as well. */
  export interface GetTelegramBusinessGiftsOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Optional when the bot has one active Business connection. */
    businessConnectionId?: string;
  }

  /** Options of `manageTelegramBusinessGift` (`POST /api/uploadposts/telegram/business-gifts`). Any other API field is sent as well. */
  export interface ManageTelegramBusinessGiftOptions extends ApiParams {
    user: string;
    businessConnectionId?: string;
    action: "convert" | "upgrade" | "transfer" | "delete" | (string & {});
    ownedGiftId: string;
    /** Must be true. */
    confirm: boolean;
    /** upgrade. */
    keepOriginalDetails?: boolean;
    /** upgrade / transfer. */
    starCount?: number;
    /** Required. Unique string (max 128): a repeat with the same key returns the first answer. */
    idempotencyKey: string;
    /** transfer. */
    newOwnerChatId?: number;
  }

  /** Options of `getTelegramBusinessStars` (`GET /api/uploadposts/telegram/business-stars`). Any other API field is sent as well. */
  export interface GetTelegramBusinessStarsOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Optional when the bot has one active Business connection. */
    businessConnectionId?: string;
  }

  /** Options of `transferTelegramBusinessStars` (`POST /api/uploadposts/telegram/business-stars/transfer`). Any other API field is sent as well. */
  export interface TransferTelegramBusinessStarsOptions extends ApiParams {
    user: string;
    businessConnectionId?: string;
    /** 1-10000. */
    starCount: number;
    /** Required. Unique string (max 128): a repeat with the same key returns the first answer. */
    idempotencyKey: string;
    /** Must be true. */
    confirm: boolean;
  }

  /** Options of `analyzeShorts` (`POST /api/uploadposts/analyze-shorts`). Any other API field is sent as well. */
  export interface AnalyzeShortsOptions extends ApiParams {
    /** Max 100 MB and 5 minutes. */
    video: string | Buffer | NodeJS.ReadableStream;
    /** Comma-separated: youtube, instagram, tiktok, facebook. */
    platforms?: string;
    /** Output language (default: the video's). */
    language?: string;
  }

  /** Answer of `analyzeShorts`. */
  export interface AnalyzeShortsResponse extends ApiResponse {
    success?: boolean;
    ai_generated?: boolean;
    remaining_analyses?: number;
    youtube?: { title?: string; description?: string; [key: string]: any };
    instagram?: { caption?: string; [key: string]: any };
    tiktok?: { caption?: string; [key: string]: any };
    facebook?: { caption?: string; [key: string]: any };
  }

  /** Options of `rewriteCaptions` (`POST /api/uploadposts/rewrite-captions`). Any other API field is sent as well. */
  export interface RewriteCaptionsOptions extends ApiParams {
    content: { youtube?: { title?: string; description?: string; [key: string]: any }; instagram?: { caption?: string; [key: string]: any }; tiktok?: { caption?: string; [key: string]: any }; facebook?: { caption?: string; [key: string]: any }; [key: string]: any };
    language: string;
    /** Subset of the platforms in content (default all). */
    platforms?: string[];
  }

  /** Answer of `rewriteCaptions`. */
  export interface RewriteCaptionsResponse extends ApiResponse {
    success?: boolean;
    remaining_analyses?: number;
    youtube?: { title?: string; description?: string; [key: string]: any };
    instagram?: { caption?: string; [key: string]: any };
    tiktok?: { caption?: string; [key: string]: any };
    facebook?: { caption?: string; [key: string]: any };
  }

  /** Options of `createMediaUpload` (`POST /api/uploadposts/media-uploads`). Any other API field is sent as well. */
  export interface CreateMediaUploadOptions extends ApiParams {
    mediaType?: "video" | "image" | "document" | (string & {});
    /** With an allowed extension (video: mp4, mov, m4v, webm, mpeg, mpg, avi, mkv; image: jpg, jpeg, png, webp, gif; document: pdf, ppt, pptx, doc, docx). */
    filename: string;
    /** MIME type matching media_type. */
    contentType?: string;
    /** Size in bytes. */
    contentLength: number;
    source?: string;
  }

  /** Answer of `createMediaUpload`. */
  export interface CreateMediaUploadResponse extends ApiResponse {
    success?: boolean;
    upload_id?: string;
    upload_url?: string;
    method?: string;
    headers?: Record<string, any>;
    put_expires_at?: string;
    expires_at?: string;
    max_file_bytes?: number;
    staging_ttl_hours?: number;
  }

  /** Options of `completeMediaUpload` (`POST /api/uploadposts/media-uploads/{upload_id}/complete`). Any other API field is sent as well. */
  export interface CompleteMediaUploadOptions extends ApiParams {
    /** Upload id. */
    uploadId: string;
  }

  /** Answer of `completeMediaUpload`. */
  export interface CompleteMediaUploadResponse extends ApiResponse {
    success?: boolean;
    upload_id?: string;
    status?: "pending" | "uploaded" | "deleted" | "rejected";
    media_type?: "video" | "image" | "document";
    filename?: string;
    content_type?: string;
    bytes_expected?: number;
    bytes_actual?: number;
    expires_at?: string;
    created_at?: string;
    /** Signed URL to pass as the media URL of an upload (when uploaded and include_url). */
    media_url?: string;
    media_url_expires_in_seconds?: number;
    message?: string;
  }

  /** Options of `getMediaUpload` (`GET /api/uploadposts/media-uploads/{upload_id}`). Any other API field is sent as well. */
  export interface GetMediaUploadOptions extends ApiParams {
    /** Upload id. */
    uploadId: string;
    /** Include media_url (when uploaded). */
    includeUrl?: boolean;
  }

  /** Answer of `getMediaUpload`. */
  export interface GetMediaUploadResponse extends ApiResponse {
    success?: boolean;
    upload_id?: string;
    status?: "pending" | "uploaded" | "deleted" | "rejected";
    media_type?: "video" | "image" | "document";
    filename?: string;
    content_type?: string;
    bytes_expected?: number;
    bytes_actual?: number;
    expires_at?: string;
    created_at?: string;
    /** Signed URL to pass as the media URL of an upload (when uploaded and include_url). */
    media_url?: string;
    media_url_expires_in_seconds?: number;
  }

  /** Options of `deleteMediaUpload` (`DELETE /api/uploadposts/media-uploads/{upload_id}`). Any other API field is sent as well. */
  export interface DeleteMediaUploadOptions extends ApiParams {
    /** Upload id. */
    uploadId: string;
  }

  /** Answer of `deleteMediaUpload`. */
  export interface DeleteMediaUploadResponse extends ApiResponse {
    success?: boolean;
    upload_id?: string;
    status?: string;
    delete_error?: string;
  }

  /** Options of `getScheduledPost` (`GET /api/uploadposts/schedule/{job_id}`). Any other API field is sent as well. */
  export interface GetScheduledPostOptions extends ApiParams {
    /** The unique job identifier. */
    jobId: string;
  }

  /** Answer of `getScheduledPost`. */
  export interface GetScheduledPostResponse extends ApiResponse {
    success?: boolean;
    job_id?: string;
    post_type?: "video" | "photo" | "text" | "document" | "unknown";
    profile_username?: string;
    platforms?: string[];
    scheduled_date?: string;
    original_timezone?: string;
    form?: Record<string, any>;
    media_urls?: string[];
    thumbnail_url?: string;
    cover_preview_url?: string;
    kept_files?: string[];
    editable?: boolean;
    not_editable_reason?: string;
  }

  /** Options of `getScheduledPostThumbnail` (`GET /api/uploadposts/schedule/{job_id}/thumbnail`). Any other API field is sent as well. */
  export interface GetScheduledPostThumbnailOptions extends ApiParams {
    /** The unique job identifier. */
    jobId: string;
  }

  /** Answer of `getScheduledPostThumbnail`. */
  export interface GetScheduledPostThumbnailResponse extends ApiResponse {
    job_id?: string;
    thumbnail_url?: string;
    retry_after?: number;
  }

  /** Options of `getScheduledPostPreview` (`GET /api/uploadposts/schedule/{job_id}/preview`). Any other API field is sent as well. */
  export interface GetScheduledPostPreviewOptions extends ApiParams {
    /** The unique job identifier. */
    jobId: string;
  }

  /** Answer of `getScheduledPostPreview`. */
  export interface GetScheduledPostPreviewResponse extends ApiResponse {
    job_id?: string;
    preview_url?: string;
    cover_preview_url?: string;
    thumbnail_preview_url?: string;
    external_id?: string;
    source_filename?: string;
  }

  /** Options of `createPinterestBoard` (`POST /api/uploadposts/pinterest/boards`). Any other API field is sent as well. */
  export interface CreatePinterestBoardOptions extends ApiParams {
    /** Profile username (alias user); default the first profile with Pinterest. */
    profile?: string;
    /** Alias of profile. */
    user?: string;
    name: string;
    description?: string;
    /** SECRET is rejected (400). */
    privacy?: "PUBLIC" | "PROTECTED" | (string & {});
  }

  /** Answer of `createPinterestBoard`. */
  export interface CreatePinterestBoardResponse extends ApiResponse {
    success?: boolean;
    board?: { id?: string; name?: string; privacy?: string; description?: string; [key: string]: any };
  }

  /** Options of `queryYoutubeAnalytics` (`GET /api/uploadposts/youtube/analytics/query`). Any other API field is sent as well. */
  export interface QueryYoutubeAnalyticsOptions extends ApiParams {
    /** Profile username with a YouTube channel connected. */
    user: string;
    /** YYYY-MM-DD */
    startDate: string;
    /** YYYY-MM-DD */
    endDate: string;
    /** Comma-separated metrics. */
    metrics: string;
    /** Comma-separated dimensions. */
    dimensions?: string;
    /** dimension==value joined with ';' (video/playlist accept up to 500 comma-separated IDs). */
    filters?: string;
    /** Comma-separated; '-' for descending. */
    sort?: string;
    maxResults?: number;
    startIndex?: number;
    /** Optional report ID from GET /uploadposts/youtube/analytics/reports. */
    report?: string;
  }

  /** Answer of `queryYoutubeAnalytics`. */
  export interface QueryYoutubeAnalyticsResponse extends ApiResponse {
    success?: boolean;
    report?: string;
    report_name?: string;
    query?: Record<string, any>;
    column_headers?: (Record<string, any>)[];
    rows?: any[][];
    cached?: boolean;
    cached_at?: string;
    expires_at?: string;
    data_note?: string;
  }

  /** Options of `listYoutubeAnalyticsReports` (`GET /api/uploadposts/youtube/analytics/reports`). Any other API field is sent as well. */
  export interface ListYoutubeAnalyticsReportsOptions extends ApiParams {
    /** Profile username with a YouTube channel connected. */
    user: string;
  }

  /** Options of `listYoutubeAnalyticsGroups` (`GET /api/uploadposts/youtube/analytics/groups`). Any other API field is sent as well. */
  export interface ListYoutubeAnalyticsGroupsOptions extends ApiParams {
    /** Profile username with a YouTube channel connected. */
    user: string;
    /** Up to 50 group IDs, comma separated. */
    ids?: string;
    pageToken?: string;
  }

  /** Options of `listYoutubeAnalyticsGroupItems` (`GET /api/uploadposts/youtube/analytics/groups/{group_id}/items`). Any other API field is sent as well. */
  export interface ListYoutubeAnalyticsGroupItemsOptions extends ApiParams {
    /** Group ID. */
    groupId: string;
    /** Profile username with a YouTube channel connected. */
    user: string;
  }

  /** Options of `getYoutubeAnalyticsUsage` (`GET /api/uploadposts/youtube/analytics/usage`). Any other API field is sent as well. */
  export interface GetYoutubeAnalyticsUsageOptions extends ApiParams {
  }

  /** Options of `listYoutubeReportTypes` (`GET /api/uploadposts/youtube/reporting/report-types`). Any other API field is sent as well. */
  export interface ListYoutubeReportTypesOptions extends ApiParams {
    /** Profile username with a YouTube channel connected. */
    user: string;
    pageToken?: string;
    pageSize?: number;
  }

  /** Options of `listYoutubeReportingJobs` (`GET /api/uploadposts/youtube/reporting/jobs`). Any other API field is sent as well. */
  export interface ListYoutubeReportingJobsOptions extends ApiParams {
    /** Profile username with a YouTube channel connected. */
    user: string;
    pageToken?: string;
    pageSize?: number;
  }

  /** Options of `createYoutubeReportingJob` (`POST /api/uploadposts/youtube/reporting/jobs`). Any other API field is sent as well. */
  export interface CreateYoutubeReportingJobOptions extends ApiParams {
    user: string;
    reportTypeId: string;
    name?: string;
  }

  /** Options of `getYoutubeReportingJob` (`GET /api/uploadposts/youtube/reporting/jobs/{job_id}`). Any other API field is sent as well. */
  export interface GetYoutubeReportingJobOptions extends ApiParams {
    /** Job ID. */
    jobId: string;
    /** Profile username with a YouTube channel connected. */
    user: string;
  }

  /** Options of `deleteYoutubeReportingJob` (`DELETE /api/uploadposts/youtube/reporting/jobs/{job_id}`). Any other API field is sent as well. */
  export interface DeleteYoutubeReportingJobOptions extends ApiParams {
    /** Job ID. */
    jobId: string;
    user: string;
    confirm: boolean;
  }

  /** Options of `listYoutubeReports` (`GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports`). Any other API field is sent as well. */
  export interface ListYoutubeReportsOptions extends ApiParams {
    /** Job ID. */
    jobId: string;
    /** Profile username with a YouTube channel connected. */
    user: string;
    /** RFC 3339 */
    createdAfter?: string;
    /** RFC 3339 */
    startTimeAtOrAfter?: string;
    /** RFC 3339 */
    startTimeBefore?: string;
    pageToken?: string;
    pageSize?: number;
  }

  /** Options of `getYoutubeReport` (`GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}`). Any other API field is sent as well. */
  export interface GetYoutubeReportOptions extends ApiParams {
    /** Job ID. */
    jobId: string;
    /** Report ID. */
    reportId: string;
    /** Profile username with a YouTube channel connected. */
    user: string;
  }

  /** Options of `downloadYoutubeReport` (`GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}/download`). Any other API field is sent as well. */
  export interface DownloadYoutubeReportOptions extends ApiParams {
    /** Job ID. */
    jobId: string;
    /** Report ID. */
    reportId: string;
    /** Profile username with a YouTube channel connected. */
    user: string;
  }

  /** Options of `getYoutubePush` (`GET /api/uploadposts/youtube/push`). Any other API field is sent as well. */
  export interface GetYoutubePushOptions extends ApiParams {
    /** Profile username with a YouTube channel connected. */
    user: string;
  }

  /** Answer of `getYoutubePush`. */
  export interface GetYoutubePushResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `enableYoutubePush` (`POST /api/uploadposts/youtube/push`). Any other API field is sent as well. */
  export interface EnableYoutubePushOptions extends ApiParams {
    /** Profile username. */
    user: string;
  }

  /** Answer of `enableYoutubePush`. */
  export interface EnableYoutubePushResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `disableYoutubePush` (`DELETE /api/uploadposts/youtube/push`). Any other API field is sent as well. */
  export interface DisableYoutubePushOptions extends ApiParams {
    /** Profile username. */
    user: string;
  }

  /** Answer of `disableYoutubePush`. */
  export interface DisableYoutubePushResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `getInstagramPublishingLimit` (`GET /api/uploadposts/instagram/publishing_limit`). Any other API field is sent as well. */
  export interface GetInstagramPublishingLimitOptions extends ApiParams {
    /** Profile username (alias user). */
    profile: string;
    /** Skip the cache. */
    refresh?: boolean;
  }

  /** Answer of `getInstagramPublishingLimit`. */
  export interface GetInstagramPublishingLimitResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    profile?: string;
    quota_usage?: number;
    quota_total?: number;
    quota_duration?: number;
    remaining?: number;
    limit_reached?: boolean;
    fetched_at?: string;
    cached?: boolean;
  }

  /** Options of `getThreadsPublishingLimit` (`GET /api/uploadposts/threads/publishing_limit`). Any other API field is sent as well. */
  export interface GetThreadsPublishingLimitOptions extends ApiParams {
    /** Profile username (or use profile). */
    user?: string;
    /** Alias of user. */
    profile?: string;
    /** Skip the cache. */
    refresh?: boolean;
  }

  /** Answer of `getThreadsPublishingLimit`. */
  export interface GetThreadsPublishingLimitResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    posts?: { used?: number; limit?: number; remaining?: number; window_seconds?: number; [key: string]: any };
    replies?: { used?: number; limit?: number; remaining?: number; window_seconds?: number; [key: string]: any };
    fetched_at?: string;
    cached?: boolean;
  }

  /** Options of `listPinterestBoardSections` (`GET /api/uploadposts/pinterest/boards/{board_id}/sections`). Any other API field is sent as well. */
  export interface ListPinterestBoardSectionsOptions extends ApiParams {
    /** Board id. */
    boardId: string;
    /** Profile username. */
    profile?: string;
  }

  /** Answer of `listPinterestBoardSections`. */
  export interface ListPinterestBoardSectionsResponse extends ApiResponse {
    success?: boolean;
    board_id?: string;
    sections?: ({ id?: string; name?: string; [key: string]: any })[];
    profile?: string;
  }

  /** Options of `createPinterestBoardSection` (`POST /api/uploadposts/pinterest/boards/{board_id}/sections`). Any other API field is sent as well. */
  export interface CreatePinterestBoardSectionOptions extends ApiParams {
    /** Board id. */
    boardId: string;
    /** Profile username (alias user); default the first profile with Pinterest. */
    profile?: string;
    /** Alias of profile. */
    user?: string;
    name: string;
  }

  /** Answer of `createPinterestBoardSection`. */
  export interface CreatePinterestBoardSectionResponse extends ApiResponse {
    success?: boolean;
    board_id?: string;
    section?: { id?: string; name?: string; [key: string]: any };
  }

  /** Options of `getFacebookPageInfo` (`GET /api/uploadposts/facebook/page-info`). Any other API field is sent as well. */
  export interface GetFacebookPageInfoOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Page id (required if the account manages several Pages). */
    pageId?: string;
  }

  /** Answer of `getFacebookPageInfo`. */
  export interface GetFacebookPageInfoResponse extends ApiResponse {
    success?: boolean;
    page_id?: string;
    page?: { id?: string; name?: string; about?: string; description?: string; website?: string; phone?: string; link?: string; category?: string; picture_url?: string; cover_url?: string; emails?: string[]; hours?: Record<string, any>; hours_list?: ({ day?: string; open?: string; close?: string; [key: string]: any })[]; [key: string]: any };
    partial?: boolean;
  }

  /** Options of `updateFacebookPageInfo` (`PATCH /api/uploadposts/facebook/page-info`). Any other API field is sent as well. */
  export interface UpdateFacebookPageInfoOptions extends ApiParams {
    user: string;
    pageId?: string;
    validateOnly?: boolean;
    about?: string;
    description?: string;
    website?: string;
    phone?: string;
    emails?: string[] | string;
    /** At most 2 ranges per day. */
    hours?: ({ day?: string | string[]; open?: string; close?: string; [key: string]: any })[] | Record<string, any>;
    pictureUrl?: string;
    coverUrl?: string;
  }

  /** Answer of `updateFacebookPageInfo`. */
  export interface UpdateFacebookPageInfoResponse extends ApiResponse {
    success?: boolean;
    page_id?: string;
    updated_fields?: string[];
    ignored_fields?: string[];
    validate_only?: boolean;
    would_update?: Record<string, any>;
  }

  /** Options of `listRedditSubreddits` (`GET /api/uploadposts/reddit/subreddits`). Any other API field is sent as well. */
  export interface ListRedditSubredditsOptions extends ApiParams {
    /** Profile username. */
    profile: string;
  }

  /** Answer of `listRedditSubreddits`. */
  export interface ListRedditSubredditsResponse extends ApiResponse {
    success?: boolean;
    subreddits?: string[];
  }

  /** Options of `getRedditPostTypes` (`GET /api/uploadposts/reddit/post-types`). Any other API field is sent as well. */
  export interface GetRedditPostTypesOptions extends ApiParams {
    /** Profile username. */
    profile: string;
    /** Subreddit name without r/. */
    subreddit: string;
  }

  /** Answer of `getRedditPostTypes`. */
  export interface GetRedditPostTypesResponse extends ApiResponse {
    success?: boolean;
    allowed_post_types?: string[];
  }

  /** Options of `listRedditFlairs` (`GET /api/uploadposts/reddit/flairs`). Any other API field is sent as well. */
  export interface ListRedditFlairsOptions extends ApiParams {
    /** Profile username. */
    profile: string;
    /** Subreddit name without r/. */
    subreddit: string;
  }

  /** Answer of `listRedditFlairs`. */
  export interface ListRedditFlairsResponse extends ApiResponse {
    success?: boolean;
    flairs?: ({ id?: string; text?: string; css_class?: string; text_color?: string; mod_only?: boolean; text_editable?: boolean; background_color?: string; type?: string; [key: string]: any })[];
  }

  /** Options of `getUserProfile` (`GET /api/uploadposts/users/{username}`). Any other API field is sent as well. */
  export interface GetUserProfileOptions extends ApiParams {
    /** The username of the profile to retrieve. */
    username: string;
  }

  /** Answer of `getUserProfile`. */
  export interface GetUserProfileResponse extends ApiResponse {
    success?: boolean;
    profile?: { username?: string; display_name?: string; created_at?: string; social_accounts?: Record<string, any>; [key: string]: any };
  }

  /** Options of `renameUserProfile` (`PATCH /api/uploadposts/users/{username}`). Any other API field is sent as well. */
  export interface RenameUserProfileOptions extends ApiParams {
    /** The username of the profile to rename. It is not changed. */
    username: string;
    /** New label. Trimmed; no line breaks. Empty string or null clears it. */
    displayName: string;
  }

  /** Answer of `renameUserProfile`. */
  export interface RenameUserProfileResponse extends ApiResponse {
    success?: boolean;
    profile?: { username?: string; display_name?: string; [key: string]: any };
  }

  /** Options of `disconnectSocialAccount` (`DELETE /api/uploadposts/users/social`). Any other API field is sent as well. */
  export interface DisconnectSocialAccountOptions extends ApiParams {
    /** The profile to disconnect the account from. */
    profileUsername: string;
    /** The platform key as it appears in the profile's `social_accounts` object (e.g. `instagram`, `tiktok`, `facebook`, `youtube`, `linkedin`, `x`). */
    socialPlatform: string;
  }

  /** Answer of `disconnectSocialAccount`. */
  export interface DisconnectSocialAccountResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectDiscordCredentials` (`POST /api/uploadposts/users/discord/credentials`). Any other API field is sent as well. */
  export interface ConnectDiscordCredentialsOptions extends ApiParams {
    profileUsername: string;
    /** https://discord.com/api/webhooks/... */
    webhookUrl: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectDiscordCredentials`. */
  export interface ConnectDiscordCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectTelegramCredentials` (`POST /api/uploadposts/users/telegram/credentials`). Any other API field is sent as well. */
  export interface ConnectTelegramCredentialsOptions extends ApiParams {
    profileUsername: string;
    botToken: string;
    /** Public channel @username or numeric chat id. */
    chatId: string;
    /** Also receive the bot's DMs and other updates (same options as POST /uploadposts/telegram/updates). */
    receiveUpdates?: boolean;
    replaceExistingWebhook?: boolean;
    forwardUrl?: string;
    autoAnswerCallbacks?: boolean;
    extraUpdates?: string[];
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectTelegramCredentials`. */
  export interface ConnectTelegramCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
    /** With receive_updates. */
    updates?: Record<string, any>;
  }

  /** Options of `connectSlackCredentials` (`POST /api/uploadposts/users/slack/credentials`). Any other API field is sent as well. */
  export interface ConnectSlackCredentialsOptions extends ApiParams {
    profileUsername: string;
    webhookUrl: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectSlackCredentials`. */
  export interface ConnectSlackCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectMastodonCredentials` (`POST /api/uploadposts/users/mastodon/credentials`). Any other API field is sent as well. */
  export interface ConnectMastodonCredentialsOptions extends ApiParams {
    profileUsername: string;
    instanceUrl: string;
    accessToken: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectMastodonCredentials`. */
  export interface ConnectMastodonCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectNostrCredentials` (`POST /api/uploadposts/users/nostr/credentials`). Any other API field is sent as well. */
  export interface ConnectNostrCredentialsOptions extends ApiParams {
    profileUsername: string;
    privateKey: string;
    /** Comma-separated wss:// relays (defaults used if omitted). */
    relays?: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectNostrCredentials`. */
  export interface ConnectNostrCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectLemmyCredentials` (`POST /api/uploadposts/users/lemmy/credentials`). Any other API field is sent as well. */
  export interface ConnectLemmyCredentialsOptions extends ApiParams {
    profileUsername: string;
    instanceUrl: string;
    username: string;
    password: string;
    community: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectLemmyCredentials`. */
  export interface ConnectLemmyCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectDevtoCredentials` (`POST /api/uploadposts/users/devto/credentials`). Any other API field is sent as well. */
  export interface ConnectDevtoCredentialsOptions extends ApiParams {
    profileUsername: string;
    apiKey: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectDevtoCredentials`. */
  export interface ConnectDevtoCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectHashnodeCredentials` (`POST /api/uploadposts/users/hashnode/credentials`). Any other API field is sent as well. */
  export interface ConnectHashnodeCredentialsOptions extends ApiParams {
    profileUsername: string;
    pat: string;
    publicationId: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectHashnodeCredentials`. */
  export interface ConnectHashnodeCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectWordpressCredentials` (`POST /api/uploadposts/users/wordpress/credentials`). Any other API field is sent as well. */
  export interface ConnectWordpressCredentialsOptions extends ApiParams {
    profileUsername: string;
    siteUrl: string;
    username: string;
    applicationPassword: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectWordpressCredentials`. */
  export interface ConnectWordpressCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectWhopCredentials` (`POST /api/uploadposts/users/whop/credentials`). Any other API field is sent as well. */
  export interface ConnectWhopCredentialsOptions extends ApiParams {
    profileUsername: string;
    apiKey: string;
    experienceId: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectWhopCredentials`. */
  export interface ConnectWhopCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `connectListmonkCredentials` (`POST /api/uploadposts/users/listmonk/credentials`). Any other API field is sent as well. */
  export interface ConnectListmonkCredentialsOptions extends ApiParams {
    profileUsername: string;
    instanceUrl: string;
    username: string;
    password: string;
    listId: string;
    /** Display name of the connection. */
    name?: string;
  }

  /** Answer of `connectListmonkCredentials`. */
  export interface ConnectListmonkCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `listFacebookPageChoices` (`GET /api/uploadposts/users/facebook-page`). Any other API field is sent as well. */
  export interface ListFacebookPageChoicesOptions extends ApiParams {
    /** Profile username. */
    profileUsername: string;
  }

  /** Answer of `listFacebookPageChoices`. */
  export interface ListFacebookPageChoicesResponse extends ApiResponse {
    success?: boolean;
    pages?: ({ id?: string; name?: string; picture?: string; [key: string]: any })[];
    selected_page_id?: string;
    selected_page_name?: string;
  }

  /** Options of `setFacebookPage` (`POST /api/uploadposts/users/facebook-page`). Any other API field is sent as well. */
  export interface SetFacebookPageOptions extends ApiParams {
    profileUsername: string;
    facebookPageId: string;
  }

  /** Answer of `setFacebookPage`. */
  export interface SetFacebookPageResponse extends ApiResponse {
    success?: boolean;
    facebook_page_id?: string;
    facebook_page_name?: string;
  }

  /** Options of `clearFacebookPage` (`DELETE /api/uploadposts/users/facebook-page`). Any other API field is sent as well. */
  export interface ClearFacebookPageOptions extends ApiParams {
    profileUsername: string;
  }

  /** Answer of `clearFacebookPage`. */
  export interface ClearFacebookPageResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `listLinkedinPageChoices` (`GET /api/uploadposts/users/linkedin-page`). Any other API field is sent as well. */
  export interface ListLinkedinPageChoicesOptions extends ApiParams {
    /** Profile username. */
    profileUsername: string;
  }

  /** Answer of `listLinkedinPageChoices`. */
  export interface ListLinkedinPageChoicesResponse extends ApiResponse {
    success?: boolean;
    pages?: ({ id?: string; name?: string; picture?: string; vanityName?: string; followers?: number; account_id?: string; [key: string]: any })[];
    selected_page_id?: string;
    selected_page_name?: string;
  }

  /** Options of `setLinkedinPage` (`POST /api/uploadposts/users/linkedin-page`). Any other API field is sent as well. */
  export interface SetLinkedinPageOptions extends ApiParams {
    profileUsername: string;
    linkedinPageId: string;
  }

  /** Answer of `setLinkedinPage`. */
  export interface SetLinkedinPageResponse extends ApiResponse {
    success?: boolean;
    linkedin_page_id?: string;
    linkedin_page_name?: string;
  }

  /** Options of `clearLinkedinPage` (`DELETE /api/uploadposts/users/linkedin-page`). Any other API field is sent as well. */
  export interface ClearLinkedinPageOptions extends ApiParams {
    profileUsername: string;
  }

  /** Answer of `clearLinkedinPage`. */
  export interface ClearLinkedinPageResponse extends ApiResponse {
    success?: boolean;
  }

  /** Options of `connectBlueskyCredentials` (`POST /api/uploadposts/users/bluesky/credentials`). Any other API field is sent as well. */
  export interface ConnectBlueskyCredentialsOptions extends ApiParams {
    profileUsername: string;
    handle: string;
    /** Bluesky app password (one with DM access to use Bluesky DMs). */
    password: string;
  }

  /** Answer of `connectBlueskyCredentials`. */
  export interface ConnectBlueskyCredentialsResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `setYoutubeOauthClient` (`POST /api/uploadposts/users/youtube/credentials`). Any other API field is sent as well. */
  export interface SetYoutubeOauthClientOptions extends ApiParams {
    profileUsername: string;
    clientId: string;
    clientSecret: string;
  }

  /** Answer of `setYoutubeOauthClient`. */
  export interface SetYoutubeOauthClientResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `getCurrentUser` (`GET /api/uploadposts/me`). Any other API field is sent as well. */
  export interface GetCurrentUserOptions extends ApiParams {
  }

  /** Answer of `getCurrentUser`. */
  export interface GetCurrentUserResponse extends ApiResponse {
    success?: boolean;
    message?: string;
    email?: string;
    plan?: string;
    /** AI Shorts analyses (POST /uploadposts/analyze-shorts) for the current 30-day window. Read-only: calling this endpoint never uses one. Same rules as the analysis itself. null only if the account data cannot be read. */
    analyze_shorts?: { limit?: number; used?: number; remaining?: number; resets_at?: string; [key: string]: any };
  }

  /** Options of `startOauthConnection` (`POST /api/uploadposts/oauth/{platform}/start`). Any other API field is sent as well. */
  export interface StartOauthConnectionOptions extends ApiParams {
    /** Platform to connect. */
    platform: "tiktok" | "instagram" | "facebook" | "linkedin" | "youtube" | "x" | "twitter" | "threads" | "pinterest" | "google-business" | "twitch" | "reddit" | (string & {});
    /** Profile username (API key auth only). */
    profile?: string;
    /** Absolute http(s) URL to return to. */
    redirectUrl?: string;
  }

  /** Answer of `startOauthConnection`. */
  export interface StartOauthConnectionResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    authorize_url?: string;
    state?: string;
    /** Seconds the state stays valid. */
    expires_in?: number;
  }

  /** Options of `createFfmpegJob` (`POST /api/uploadposts/ffmpeg/jobs/upload`). Any other API field is sent as well. */
  export interface CreateFfmpegJobOptions extends ApiParams {
    /** Array of input file URLs. Referenced as {input0}, {input1}, etc. */
    files?: string[];
    /** FFmpeg command template using {input0}, {input1}, etc. and {output} placeholders. */
    fullCommand: string;
    /** Desired output file extension. */
    outputExtension: string;
    /** Whether to publish the result. */
    publish?: boolean;
    /** Primary media file to process. Referenced as {input} or {input0}. */
    file?: string | Buffer | NodeJS.ReadableStream;
    /** Second input file. Referenced as {input1}. */
    file1?: string | Buffer | NodeJS.ReadableStream;
    /** Third input file. Referenced as {input2}. */
    file2?: string | Buffer | NodeJS.ReadableStream;
  }

  /** Options of `getFfmpegJobStatus` (`GET /api/uploadposts/ffmpeg/jobs/{job_id}`). Any other API field is sent as well. */
  export interface GetFfmpegJobStatusOptions extends ApiParams {
    /** The unique job identifier. */
    jobId: string;
  }

  /** Answer of `getFfmpegJobStatus`. */
  export interface GetFfmpegJobStatusResponse extends ApiResponse {
    job_id?: string;
    /** Status of an FFmpeg processing job. */
    status?: "PENDING" | "PROCESSING" | "FINISHED" | "ERROR";
    /** Duration of the input media in seconds. */
    duration_seconds?: number;
    output_extension?: string;
    /** Present once the job has an output. */
    result?: { media_url?: string; media_url_expires_in_seconds?: number; media_url_note?: string; download_url?: string; download_auth?: string; [key: string]: any };
  }

  /** Options of `downloadFfmpegResult` (`GET /api/uploadposts/ffmpeg/jobs/{job_id}/download`). Any other API field is sent as well. */
  export interface DownloadFfmpegResultOptions extends ApiParams {
    /** The unique job identifier. */
    jobId: string;
  }

  /** Options of `getFfmpegConsumption` (`GET /api/uploadposts/ffmpeg/consumption`). Any other API field is sent as well. */
  export interface GetFfmpegConsumptionOptions extends ApiParams {
  }

  /** Answer of `getFfmpegConsumption`. */
  export interface GetFfmpegConsumptionResponse extends ApiResponse {
    success?: boolean;
    consumption?: { used_minutes?: number; remaining_minutes?: number; quota_minutes?: number; usage_percentage?: number; total_requests?: number; current_month?: string; plan?: string; [key: string]: any };
    history?: ({ duration_seconds?: number; duration_minutes?: number; timestamp?: string; month?: string; type?: string; [key: string]: any })[];
    quota_info?: { plan?: string; quota_minutes?: number; reset_day?: number; next_reset?: string; [key: string]: any };
  }

  /** Options of `listWebhookSubscriptions` (`GET /api/uploadposts/webhooks/subscriptions`). Any other API field is sent as well. */
  export interface ListWebhookSubscriptionsOptions extends ApiParams {
    /** Only active or disabled ones. */
    status?: "active" | "disabled" | (string & {});
    /** Only this source label (e.g. n8n). */
    source?: string;
    /** Only this exact URL. */
    url?: string;
  }

  /** Answer of `listWebhookSubscriptions`. */
  export interface ListWebhookSubscriptionsResponse extends ApiResponse {
    success?: boolean;
    subscriptions?: ({ id?: string; url?: string; events?: string[]; profile_username?: string; source?: string; name?: string; status?: "active" | "disabled"; disabled_reason?: "endpoint_gone" | "failing_too_long" | "blocked_url" | "profile_removed"; disabled_at?: string; created_at?: string; updated_at?: string; last_delivery_at?: string; health?: { consecutive_failures?: number; last_failure?: string; last_failure_at?: string; paused_until?: string; [key: string]: any }; [key: string]: any })[];
    /** Maximum active subscriptions per account. */
    limit?: number;
    active_count?: number;
  }

  /** Options of `createWebhookSubscription` (`POST /api/uploadposts/webhooks/subscriptions`). Any other API field is sent as well. */
  export interface CreateWebhookSubscriptionOptions extends ApiParams {
    /** Public https URL. */
    url: string;
    /** Event names. youtube_video_* only while YouTube push is on and post_approval_* only while post approvals are on; otherwise 400 invalid_events with allowed_events. */
    events: ("upload_completed" | "social_account_connected" | "social_account_disconnected" | "social_account_reauth_required" | "dm_received" | "comment_received" | "review_received" | "review_updated" | "customer_media_received" | "listing_google_update" | "listing_duplicate" | "listing_control_changed" | "telegram_update" | "post_analytics_updated" | "youtube_video_published" | "youtube_video_updated" | "post_approval_requested" | "post_approved" | "post_rejected" | "post_approval_expired" | (string & {}))[];
    /** Only events of this profile. */
    profileUsername?: string;
    source?: string;
    name?: string;
  }

  /** Answer of `createWebhookSubscription`. */
  export interface CreateWebhookSubscriptionResponse extends ApiResponse {
    success?: boolean;
    created?: boolean;
    reactivated?: boolean;
    /** One extra webhook destination of the account (n8n trigger, REST hook...). Independent from the account webhook_url. */
    subscription?: { id?: string; url?: string; events?: string[]; profile_username?: string; source?: string; name?: string; status?: "active" | "disabled"; disabled_reason?: "endpoint_gone" | "failing_too_long" | "blocked_url" | "profile_removed"; disabled_at?: string; created_at?: string; updated_at?: string; last_delivery_at?: string; health?: { consecutive_failures?: number; last_failure?: string; last_failure_at?: string; paused_until?: string; [key: string]: any }; [key: string]: any };
  }

  /** Options of `getWebhookSubscription` (`GET /api/uploadposts/webhooks/subscriptions/{subscription_id}`). Any other API field is sent as well. */
  export interface GetWebhookSubscriptionOptions extends ApiParams {
    /** Subscription id (whsub_...). */
    subscriptionId: string;
  }

  /** Answer of `getWebhookSubscription`. */
  export interface GetWebhookSubscriptionResponse extends ApiResponse {
    success?: boolean;
    /** One extra webhook destination of the account (n8n trigger, REST hook...). Independent from the account webhook_url. */
    subscription?: { id?: string; url?: string; events?: string[]; profile_username?: string; source?: string; name?: string; status?: "active" | "disabled"; disabled_reason?: "endpoint_gone" | "failing_too_long" | "blocked_url" | "profile_removed"; disabled_at?: string; created_at?: string; updated_at?: string; last_delivery_at?: string; health?: { consecutive_failures?: number; last_failure?: string; last_failure_at?: string; paused_until?: string; [key: string]: any }; [key: string]: any };
  }

  /** Options of `deleteWebhookSubscription` (`DELETE /api/uploadposts/webhooks/subscriptions/{subscription_id}`). Any other API field is sent as well. */
  export interface DeleteWebhookSubscriptionOptions extends ApiParams {
    /** Subscription id (whsub_...). */
    subscriptionId: string;
  }

  /** Answer of `deleteWebhookSubscription`. */
  export interface DeleteWebhookSubscriptionResponse extends ApiResponse {
    success?: boolean;
    deleted?: boolean;
    id?: string;
  }

  /** Options of `testWebhookSubscription` (`POST /api/uploadposts/webhooks/subscriptions/{subscription_id}/test`). Any other API field is sent as well. */
  export interface TestWebhookSubscriptionOptions extends ApiParams {
    /** Subscription id (whsub_...). */
    subscriptionId: string;
    /** One of the subscription's events; default its first event. */
    event?: string;
  }

  /** Answer of `testWebhookSubscription`. */
  export interface TestWebhookSubscriptionResponse extends ApiResponse {
    success?: boolean;
    ok?: boolean;
    delivery?: { delivery_id?: string; event?: string; status?: "pending" | "delivered" | "failed" | "cancelled"; target?: "account" | "profile" | "subscription"; profile_username?: string; url?: string; request_id?: string; job_id?: string; platform?: string; test?: boolean; attempt_count?: number; max_attempts?: number; last_status_code?: number; last_error?: string; next_attempt_at?: string; created_at?: string; updated_at?: string; delivered_at?: string; redelivery_of?: string; redelivery_count?: number; attempts?: ({ attempt?: number; at?: string; ok?: boolean; status_code?: number; error?: string; duration_ms?: number; [key: string]: any })[]; payload?: Record<string, any>; subscription_id?: string; [key: string]: any };
  }

  /** Options of `deleteCommentPost` (`POST /api/uploadposts/comments/delete`). Any other API field is sent as well. */
  export interface DeleteCommentPostOptions extends ApiParams {
    /** Target platform. */
    platform: "instagram" | "facebook" | "youtube" | "linkedin" | "tiktok" | (string & {});
    /** Profile username as configured in Upload-Post. */
    user: string;
    /** ID of the comment to delete. */
    commentId: string;
    /** Required for LinkedIn only — the post URN (urn:li:ugcPost:...) the comment belongs to. */
    postId?: string;
  }

  /** Options of `deleteBlueskyChatAccount` (`POST /api/uploadposts/dms/bluesky/account/delete`). Any other API field is sent as well. */
  export interface DeleteBlueskyChatAccountOptions extends ApiParams {
    /** Profile username. */
    user: string;
    confirm: boolean;
    confirmHandle: string;
  }

  /** Options of `listBlueskyMutualGroups` (`GET /api/uploadposts/dms/bluesky/groups`). Any other API field is sent as well. */
  export interface ListBlueskyMutualGroupsOptions extends ApiParams {
    /** Profile username as configured in Upload-Post. */
    user: string;
    subject: string;
    limit?: number;
    cursor?: string;
  }

  /** Options of `createBlueskyGroup` (`POST /api/uploadposts/dms/bluesky/groups`). Any other API field is sent as well. */
  export interface CreateBlueskyGroupOptions extends ApiParams {
    /** Profile username. */
    user: string;
    name: string;
    members: string[];
    idempotencyKey?: string;
  }

  /** Options of `editBlueskyGroup` (`PATCH /api/uploadposts/dms/bluesky/groups/{conversation_id}`). Any other API field is sent as well. */
  export interface EditBlueskyGroupOptions extends ApiParams {
    conversationId: string;
    /** Profile username. */
    user: string;
    name?: string;
    locked?: boolean;
  }

  /** Options of `listBlueskyGroupMembers` (`GET /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`). Any other API field is sent as well. */
  export interface ListBlueskyGroupMembersOptions extends ApiParams {
    conversationId: string;
    /** Profile username as configured in Upload-Post. */
    user: string;
  }

  /** Options of `addBlueskyGroupMembers` (`POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`). Any other API field is sent as well. */
  export interface AddBlueskyGroupMembersOptions extends ApiParams {
    conversationId: string;
    /** Profile username. */
    user: string;
    members: string[];
  }

  /** Options of `removeBlueskyGroupMembers` (`DELETE /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`). Any other API field is sent as well. */
  export interface RemoveBlueskyGroupMembersOptions extends ApiParams {
    conversationId: string;
    /** Profile username. */
    user: string;
    members: string[];
  }

  /** Options of `manageBlueskyJoinLink` (`POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-link`). Any other API field is sent as well. */
  export interface ManageBlueskyJoinLinkOptions extends ApiParams {
    conversationId: string;
    /** Profile username. */
    user: string;
    action: "create" | "edit" | "enable" | "disable" | (string & {});
    requireApproval?: boolean;
    joinRule?: "anyone" | "followed_by_owner" | (string & {});
  }

  /** Options of `listBlueskyJoinRequests` (`GET /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests`). Any other API field is sent as well. */
  export interface ListBlueskyJoinRequestsOptions extends ApiParams {
    conversationId: string;
    /** Profile username as configured in Upload-Post. */
    user: string;
  }

  /** Options of `answerBlueskyJoinRequest` (`POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests`). Any other API field is sent as well. */
  export interface AnswerBlueskyJoinRequestOptions extends ApiParams {
    conversationId: string;
    /** Profile username. */
    user: string;
    action: "approve" | "reject" | "mark_read" | "withdraw" | (string & {});
    member?: string;
  }

  /** Options of `previewBlueskyJoinLinks` (`GET /api/uploadposts/dms/bluesky/join-links`). Any other API field is sent as well. */
  export interface PreviewBlueskyJoinLinksOptions extends ApiParams {
    /** Profile username as configured in Upload-Post. */
    user: string;
    /** Comma-separated join link codes. */
    codes: string;
  }

  /** Options of `joinBlueskyGroup` (`POST /api/uploadposts/dms/bluesky/join-links`). Any other API field is sent as well. */
  export interface JoinBlueskyGroupOptions extends ApiParams {
    /** Profile username. */
    user: string;
    code: string;
  }

  /** Options of `downloadDmMedia` (`GET /api/uploadposts/dms/media`). Any other API field is sent as well. */
  export interface DownloadDmMediaOptions extends ApiParams {
    /** Platform of the conversation. */
    platform: "telegram" | "whatsapp" | (string & {});
    /** Profile username. */
    user: string;
    /** media_id of the attachment (Telegram file_id). */
    mediaId: string;
  }

  /** Options of `blueskyGraphAction` (`POST /api/uploadposts/bluesky/graph`). Any other API field is sent as well. */
  export interface BlueskyGraphActionOptions extends ApiParams {
    /** Profile username. */
    user: string;
    action: "follow" | "unfollow" | "block" | "unblock" | "mute" | "unmute" | "mute_list" | "unmute_list" | "block_list" | "unblock_list" | "mute_thread" | "unmute_thread" | (string & {});
    /** Handle, DID or bsky.app profile link. */
    actor?: string;
    /** List at:// URI, bsky.app link or own list id. */
    list?: string;
    /** First post of the thread. */
    postId?: string;
    onlyReposts?: boolean;
    onlyQuoteposts?: boolean;
  }

  /** Answer of `blueskyGraphAction`. */
  export interface BlueskyGraphActionResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `listBlueskyLists` (`GET /api/uploadposts/bluesky/lists`). Any other API field is sent as well. */
  export interface ListBlueskyListsOptions extends ApiParams {
    /** Profile username. */
    user: string;
    purposes?: string;
    cursor?: string;
  }

  /** Answer of `listBlueskyLists`. */
  export interface ListBlueskyListsResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `createBlueskyList` (`POST /api/uploadposts/bluesky/lists`). Any other API field is sent as well. */
  export interface CreateBlueskyListOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Up to 64 bytes. */
    name: string;
    purpose: "curatelist" | "modlist" | "referencelist" | (string & {});
    /** Up to 300 characters. */
    description?: string;
    /** PNG or JPEG file, up to 1,000,000 bytes (multipart). */
    avatar?: string | Buffer | NodeJS.ReadableStream;
    avatarUrl?: string;
    removeAvatar?: boolean;
  }

  /** Answer of `createBlueskyList`. */
  export interface CreateBlueskyListResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `getBlueskyList` (`GET /api/uploadposts/bluesky/lists/{list_id}`). Any other API field is sent as well. */
  export interface GetBlueskyListOptions extends ApiParams {
    /** The list's record key. */
    listId: string;
    /** Profile username. */
    user: string;
  }

  /** Answer of `getBlueskyList`. */
  export interface GetBlueskyListResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `updateBlueskyList` (`PATCH /api/uploadposts/bluesky/lists/{list_id}`). Any other API field is sent as well. */
  export interface UpdateBlueskyListOptions extends ApiParams {
    /** The list's record key. */
    listId: string;
    /** Profile username. */
    user: string;
    /** Up to 64 bytes. */
    name?: string;
    purpose?: "curatelist" | "modlist" | "referencelist" | (string & {});
    /** Up to 300 characters. */
    description?: string;
    /** PNG or JPEG file, up to 1,000,000 bytes (multipart). */
    avatar?: string | Buffer | NodeJS.ReadableStream;
    avatarUrl?: string;
    removeAvatar?: boolean;
  }

  /** Answer of `updateBlueskyList`. */
  export interface UpdateBlueskyListResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `deleteBlueskyList` (`DELETE /api/uploadposts/bluesky/lists/{list_id}`). Any other API field is sent as well. */
  export interface DeleteBlueskyListOptions extends ApiParams {
    /** The list's record key. */
    listId: string;
    /** Profile username. */
    user: string;
    /** Must be true: this cannot be undone. */
    confirm: boolean;
  }

  /** Answer of `deleteBlueskyList`. */
  export interface DeleteBlueskyListResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `listBlueskyListMembers` (`GET /api/uploadposts/bluesky/lists/{list_id}/members`). Any other API field is sent as well. */
  export interface ListBlueskyListMembersOptions extends ApiParams {
    /** The list's record key. */
    listId: string;
    /** Profile username. */
    user: string;
  }

  /** Answer of `listBlueskyListMembers`. */
  export interface ListBlueskyListMembersResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `addBlueskyListMember` (`POST /api/uploadposts/bluesky/lists/{list_id}/members`). Any other API field is sent as well. */
  export interface AddBlueskyListMemberOptions extends ApiParams {
    /** The list's record key. */
    listId: string;
    /** Profile username. */
    user: string;
    actor: string;
  }

  /** Answer of `addBlueskyListMember`. */
  export interface AddBlueskyListMemberResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `removeBlueskyListMember` (`DELETE /api/uploadposts/bluesky/lists/{list_id}/members`). Any other API field is sent as well. */
  export interface RemoveBlueskyListMemberOptions extends ApiParams {
    /** The list's record key. */
    listId: string;
    /** Profile username. */
    user: string;
    actor: string;
  }

  /** Answer of `removeBlueskyListMember`. */
  export interface RemoveBlueskyListMemberResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `optOutBlueskyList` (`POST /api/uploadposts/bluesky/lists/opt-out`). Any other API field is sent as well. */
  export interface OptOutBlueskyListOptions extends ApiParams {
    /** Profile username. */
    user: string;
    list: string;
  }

  /** Answer of `optOutBlueskyList`. */
  export interface OptOutBlueskyListResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `removeOptOutBlueskyList` (`DELETE /api/uploadposts/bluesky/lists/opt-out`). Any other API field is sent as well. */
  export interface RemoveOptOutBlueskyListOptions extends ApiParams {
    /** Profile username. */
    user: string;
    list: string;
  }

  /** Answer of `removeOptOutBlueskyList`. */
  export interface RemoveOptOutBlueskyListResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `listBlueskyStarterPacks` (`GET /api/uploadposts/bluesky/starter-packs`). Any other API field is sent as well. */
  export interface ListBlueskyStarterPacksOptions extends ApiParams {
    /** Profile username. */
    user: string;
  }

  /** Answer of `listBlueskyStarterPacks`. */
  export interface ListBlueskyStarterPacksResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `createBlueskyStarterPack` (`POST /api/uploadposts/bluesky/starter-packs`). Any other API field is sent as well. */
  export interface CreateBlueskyStarterPackOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** Up to 50 characters. */
    name: string;
    description?: string;
    /** Up to 3 feed at:// URIs. */
    feeds?: string[];
    /** Own list to use. */
    list?: string;
    /** Up to 25 accounts per request (a new list is created; add more through /lists/{list_id}/members). */
    members?: string[];
  }

  /** Answer of `createBlueskyStarterPack`. */
  export interface CreateBlueskyStarterPackResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `getBlueskyStarterPack` (`GET /api/uploadposts/bluesky/starter-packs/{pack_id}`). Any other API field is sent as well. */
  export interface GetBlueskyStarterPackOptions extends ApiParams {
    /** The starter pack's record key. */
    packId: string;
    /** Profile username. */
    user: string;
  }

  /** Answer of `getBlueskyStarterPack`. */
  export interface GetBlueskyStarterPackResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `updateBlueskyStarterPack` (`PATCH /api/uploadposts/bluesky/starter-packs/{pack_id}`). Any other API field is sent as well. */
  export interface UpdateBlueskyStarterPackOptions extends ApiParams {
    /** The starter pack's record key. */
    packId: string;
    /** Profile username. */
    user: string;
    /** Up to 50 characters. */
    name?: string;
    description?: string;
    /** Up to 3 feed at:// URIs. */
    feeds?: string[];
    /** Own list to use. */
    list?: string;
    /** Up to 25 accounts per request (a new list is created; add more through /lists/{list_id}/members). */
    members?: string[];
  }

  /** Answer of `updateBlueskyStarterPack`. */
  export interface UpdateBlueskyStarterPackResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `deleteBlueskyStarterPack` (`DELETE /api/uploadposts/bluesky/starter-packs/{pack_id}`). Any other API field is sent as well. */
  export interface DeleteBlueskyStarterPackOptions extends ApiParams {
    /** The starter pack's record key. */
    packId: string;
    /** Profile username. */
    user: string;
    /** Must be true: this cannot be undone. */
    confirm: boolean;
    deleteList?: boolean;
  }

  /** Answer of `deleteBlueskyStarterPack`. */
  export interface DeleteBlueskyStarterPackResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `listBlueskyFeeds` (`GET /api/uploadposts/bluesky/feeds`). Any other API field is sent as well. */
  export interface ListBlueskyFeedsOptions extends ApiParams {
    /** Profile username. */
    user: string;
  }

  /** Answer of `listBlueskyFeeds`. */
  export interface ListBlueskyFeedsResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `createBlueskyFeed` (`POST /api/uploadposts/bluesky/feeds`). Any other API field is sent as well. */
  export interface CreateBlueskyFeedOptions extends ApiParams {
    /** Profile username. */
    user: string;
    /** 1-15 letters, digits or dashes (create only). */
    rkey: string;
    /** Feed generator service DID. */
    did: string;
    /** Up to 24 characters. */
    displayName: string;
    description?: string;
    /** PNG or JPEG file, up to 1,000,000 bytes (multipart). */
    avatar?: string | Buffer | NodeJS.ReadableStream;
    acceptsInteractions?: boolean;
    contentMode?: "unspecified" | "video" | (string & {});
  }

  /** Answer of `createBlueskyFeed`. */
  export interface CreateBlueskyFeedResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `updateBlueskyFeed` (`PATCH /api/uploadposts/bluesky/feeds/{rkey}`). Any other API field is sent as well. */
  export interface UpdateBlueskyFeedOptions extends ApiParams {
    /** The feed's record key. */
    rkey: string;
    /** Profile username. */
    user: string;
    /** Feed generator service DID. */
    did?: string;
    /** Up to 24 characters. */
    displayName?: string;
    description?: string;
    /** PNG or JPEG file, up to 1,000,000 bytes (multipart). */
    avatar?: string | Buffer | NodeJS.ReadableStream;
    acceptsInteractions?: boolean;
    contentMode?: "unspecified" | "video" | (string & {});
  }

  /** Answer of `updateBlueskyFeed`. */
  export interface UpdateBlueskyFeedResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `deleteBlueskyFeed` (`DELETE /api/uploadposts/bluesky/feeds/{rkey}`). Any other API field is sent as well. */
  export interface DeleteBlueskyFeedOptions extends ApiParams {
    /** The feed's record key. */
    rkey: string;
    /** Profile username. */
    user: string;
    /** Must be true: this cannot be undone. */
    confirm: boolean;
  }

  /** Answer of `deleteBlueskyFeed`. */
  export interface DeleteBlueskyFeedResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `reportOnBluesky` (`POST /api/uploadposts/bluesky/report`). Any other API field is sent as well. */
  export interface ReportOnBlueskyOptions extends ApiParams {
    /** Profile username. */
    user: string;
    postId?: string;
    actor?: string;
    /** spam, violation, misleading, sexual, rude, other, appeal, or tools.ozone.report.defs#reason... values. */
    reasonType: string;
    /** Up to 2,000 characters. */
    reason?: string;
    /** Must be true: this cannot be undone. */
    confirm: boolean;
  }

  /** Answer of `reportOnBluesky`. */
  export interface ReportOnBlueskyResponse extends ApiResponse {
    success?: boolean;
    platform?: string;
    action?: string;
    record_uri?: string;
    changed?: boolean;
  }

  /** Options of `listPostApprovals` (`GET /api/uploadposts/approvals`). Any other API field is sent as well. */
  export interface ListPostApprovalsOptions extends ApiParams {
    /** Comma-separated statuses (default the open ones). */
    status?: string;
    /** Only this profile. */
    profileUsername?: string;
    /** Only this author email. */
    author?: string;
    /** Page size. */
    limit?: number;
    /** created_at of the last item of the previous page (next_before). */
    before?: string;
    /** true (or 1): answer only how many items there are per status, with the same filters (status, profile_username, author; limit and before are ignored). Nothing is listed or signed. */
    countOnly?: boolean;
  }

  /** Answer of `listPostApprovals` (shape 1: list). */
  export interface ListPostApprovalsResponse1 extends ApiResponse {
    success?: boolean;
    items?: ({ approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; author_email?: string; author_role?: "editor" | "contributor"; created_at?: string; updated_at?: string; decided_by?: string; decided_by_role?: string; decided_at?: string; decision_comment?: string; job_id?: string; request_id?: string; external_id?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; fields?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any })[];
    next_before?: string;
  }

  /** Answer of `listPostApprovals` (shape 2: count_only). */
  export interface ListPostApprovalsResponse2 extends ApiResponse {
    success?: boolean;
    /** One key per requested status (default pending_approval and draft). */
    counts?: Record<string, any>;
    total?: number;
  }

  /** Answer of `listPostApprovals`: one of 2 shapes. */
  export type ListPostApprovalsResponse = ListPostApprovalsResponse1 | ListPostApprovalsResponse2;

  /** Options of `getPostApproval` (`GET /api/uploadposts/approvals/{approval_id}`). Any other API field is sent as well. */
  export interface GetPostApprovalOptions extends ApiParams {
    /** Approval id. */
    approvalId: string;
  }

  /** Answer of `getPostApproval`. */
  export interface GetPostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for (or past) review. Created when an Editor (pending_approval) or a Contributor (draft) publishes. */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; author_email?: string; author_role?: "editor" | "contributor"; created_at?: string; updated_at?: string; decided_by?: string; decided_by_role?: string; decided_at?: string; decision_comment?: string; job_id?: string; request_id?: string; external_id?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; fields?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
  }

  /** Options of `editPostApproval` (`PATCH /api/uploadposts/approvals/{approval_id}`). Any other API field is sent as well. */
  export interface EditPostApprovalOptions extends ApiParams {
    /** Approval id. */
    approvalId: string;
    title?: string;
    caption?: string;
    /** Alias of caption. */
    description?: string;
    platformContent?: Record<string, any>;
    fields?: Record<string, any>;
    scheduledDate?: string;
    timezone?: string;
    coverImageBase64?: string;
    removeCover?: boolean;
  }

  /** Answer of `editPostApproval`. */
  export interface EditPostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for (or past) review. Created when an Editor (pending_approval) or a Contributor (draft) publishes. */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; author_email?: string; author_role?: "editor" | "contributor"; created_at?: string; updated_at?: string; decided_by?: string; decided_by_role?: string; decided_at?: string; decision_comment?: string; job_id?: string; request_id?: string; external_id?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; fields?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
  }

  /** Options of `withdrawPostApproval` (`DELETE /api/uploadposts/approvals/{approval_id}`). Any other API field is sent as well. */
  export interface WithdrawPostApprovalOptions extends ApiParams {
    /** Approval id. */
    approvalId: string;
  }

  /** Answer of `withdrawPostApproval`. */
  export interface WithdrawPostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for (or past) review. Created when an Editor (pending_approval) or a Contributor (draft) publishes. */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; author_email?: string; author_role?: "editor" | "contributor"; created_at?: string; updated_at?: string; decided_by?: string; decided_by_role?: string; decided_at?: string; decision_comment?: string; job_id?: string; request_id?: string; external_id?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; fields?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
  }

  /** Options of `approvePostApproval` (`POST /api/uploadposts/approvals/{approval_id}/approve`). Any other API field is sent as well. */
  export interface ApprovePostApprovalOptions extends ApiParams {
    /** Approval id. */
    approvalId: string;
    version: number;
    comment?: string;
    scheduledDate?: string;
    timezone?: string;
    publishNow?: boolean;
  }

  /** Answer of `approvePostApproval`. */
  export interface ApprovePostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for (or past) review. Created when an Editor (pending_approval) or a Contributor (draft) publishes. */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; author_email?: string; author_role?: "editor" | "contributor"; created_at?: string; updated_at?: string; decided_by?: string; decided_by_role?: string; decided_at?: string; decision_comment?: string; job_id?: string; request_id?: string; external_id?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; fields?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
    job_id?: string;
    scheduled_date?: string;
  }

  /** Options of `rejectPostApproval` (`POST /api/uploadposts/approvals/{approval_id}/reject`). Any other API field is sent as well. */
  export interface RejectPostApprovalOptions extends ApiParams {
    /** Approval id. */
    approvalId: string;
    comment: string;
  }

  /** Answer of `rejectPostApproval`. */
  export interface RejectPostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for (or past) review. Created when an Editor (pending_approval) or a Contributor (draft) publishes. */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; author_email?: string; author_role?: "editor" | "contributor"; created_at?: string; updated_at?: string; decided_by?: string; decided_by_role?: string; decided_at?: string; decision_comment?: string; job_id?: string; request_id?: string; external_id?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; fields?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
  }

  /** Options of `listClientPostApprovals` (`GET /api/uploadposts/approvals/client`). Any other API field is sent as well. */
  export interface ListClientPostApprovalsOptions extends ApiParams {
    /** Profile JWT (from generateJwt), sent as `Authorization: Bearer`. */
    token: string;
  }

  /** Answer of `listClientPostApprovals`. */
  export interface ListClientPostApprovalsResponse extends ApiResponse {
    success?: boolean;
    profile_username?: string;
    items?: ({ approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; created_at?: string; updated_at?: string; decided_at?: string; decision_comment?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any })[];
  }

  /** Options of `approveClientPostApproval` (`POST /api/uploadposts/approvals/client/{approval_id}/approve`). Any other API field is sent as well. */
  export interface ApproveClientPostApprovalOptions extends ApiParams {
    /** Profile JWT (from generateJwt), sent as `Authorization: Bearer`. */
    token: string;
    /** Approval id. */
    approvalId: string;
    version: number;
    comment?: string;
  }

  /** Answer of `approveClientPostApproval`. */
  export interface ApproveClientPostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for approval as the end client sees it (connect page): never the author, who decided, or internal ids (author_email, author_role, decided_by, decided_by_role, request_id, external_id, job_id, fields are le... */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; created_at?: string; updated_at?: string; decided_at?: string; decision_comment?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
    job_id?: string;
    scheduled_date?: string;
  }

  /** Options of `rejectClientPostApproval` (`POST /api/uploadposts/approvals/client/{approval_id}/reject`). Any other API field is sent as well. */
  export interface RejectClientPostApprovalOptions extends ApiParams {
    /** Profile JWT (from generateJwt), sent as `Authorization: Bearer`. */
    token: string;
    /** Approval id. */
    approvalId: string;
    comment: string;
  }

  /** Answer of `rejectClientPostApproval`. */
  export interface RejectClientPostApprovalResponse extends ApiResponse {
    success?: boolean;
    /** A post waiting for approval as the end client sees it (connect page): never the author, who decided, or internal ids (author_email, author_role, decided_by, decided_by_role, request_id, external_id, job_id, fields are le... */
    item?: { approval_id?: string; status?: "pending_approval" | "draft" | "approving" | "approved" | "rejected" | "withdrawn" | "expired"; kind?: "approval" | "draft"; version?: number; profile_username?: string; platforms?: string[]; post_type?: string; title?: string; caption?: string; platform_content?: Record<string, any>; immediate?: boolean; queued?: boolean; scheduled_date?: string; expires_at?: string; created_at?: string; updated_at?: string; decided_at?: string; decision_comment?: string; destinations?: { facebook_page_id?: string; linkedin_page_id?: string; pinterest_board_id?: string; [key: string]: any }; destinations_effective?: Record<string, any>; has_preview?: boolean; preview_url?: string; thumbnail_url?: string; [key: string]: any };
  }

  /** Options of `getTeamRoles` (`GET /api/uploadposts/teams/roles`). Any other API field is sent as well. */
  export interface GetTeamRolesOptions extends ApiParams {
  }

  /** Answer of `getTeamRoles`. */
  export interface GetTeamRolesResponse extends ApiResponse {
    success?: boolean;
    enabled?: boolean;
    approvals_enabled?: boolean;
    roles?: ("owner" | "admin" | "editor" | "contributor" | "viewer")[];
    permissions?: Record<string, any>;
    approval_roles?: string[];
    your_email?: string;
    your_role?: "owner" | "admin" | "editor" | "contributor" | "viewer";
    /** null = every profile. */
    your_profiles?: string[];
  }

  /** Options of `listTeamAudit` (`GET /api/uploadposts/teams/audit`). Any other API field is sent as well. */
  export interface ListTeamAuditOptions extends ApiParams {
    /** Only this member email. */
    actor?: string;
    /** Only this action. */
    action?: "post_created" | "published" | "scheduled_edited" | "scheduled_cancelled" | "approval_requested" | "draft_created" | "approval_edited" | "approved" | "rejected" | "approval_withdrawn" | "approval_expired" | "member_access_changed" | (string & {});
    /** Only this profile. */
    profileUsername?: string;
    /** Only this approval or job id. */
    targetId?: string;
    /** ISO 8601, inclusive. */
    since?: string;
    /** ISO 8601, exclusive. */
    until?: string;
    /** Page size. */
    limit?: number;
    /** next_cursor of the previous page. */
    cursor?: string;
  }

  /** Answer of `listTeamAudit`. */
  export interface ListTeamAuditResponse extends ApiResponse {
    success?: boolean;
    items?: ({ id?: string; action?: "post_created" | "published" | "scheduled_edited" | "scheduled_cancelled" | "approval_requested" | "draft_created" | "approval_edited" | "approved" | "rejected" | "approval_withdrawn" | "approval_expired" | "member_access_changed"; actor_email?: string; actor_role?: string; target_type?: string; target_id?: string; profile_username?: string; details?: Record<string, any>; at?: string; [key: string]: any })[];
    next_cursor?: string;
    retention_days?: number;
  }

  /** Options of `sendFeedback` (`POST /api/uploadposts/feedback`). Any other API field is sent as well. */
  export interface SendFeedbackOptions extends ApiParams {
    message: string;
    category?: "bug" | "docs" | "error_message" | "feature_request" | "other" | (string & {});
    endpoint?: string;
    requestId?: string;
    /** Name of the agent or tool. */
    agent?: string;
  }

  /** Answer of `sendFeedback`. */
  export interface SendFeedbackResponse extends ApiResponse {
    success?: boolean;
    id?: string;
    duplicate?: boolean;
    message?: string;
  }

  /** Options of `updateGoogleBusinessAccount` (`PATCH /api/uploadposts/google-business/accounts`). Any other API field is sent as well. */
  export interface UpdateGoogleBusinessAccountOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** `accounts/{id}` or a bare id. */
    account?: string;
    /** New name. */
    accountName: string;
    /** Google validates only; nothing changes. */
    validateOnly?: boolean;
    /** Required (`true`) unless `validate_only`. */
    confirm?: boolean;
  }

  /** Answer of `updateGoogleBusinessAccount`. */
  export interface UpdateGoogleBusinessAccountResponse extends ApiResponse {
    success?: boolean;
    /** Present when validating only. */
    validate_only?: boolean;
    /** Google's Account. */
    account?: Record<string, any>;
  }

  /** Options of `createGoogleBusinessAdmin` (`POST /api/uploadposts/google-business/admins`). Any other API field is sent as well. */
  export interface CreateGoogleBusinessAdminOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** `account` (default) or `location`. */
    scope?: "account" | "location" | (string & {});
    /** Target account (`scope=account`). */
    account?: string;
    /** Target location (`scope=location`). */
    locationId?: string;
    /** Email of the person to invite (one of `admin` / `admin_account`). */
    admin?: string;
    /** `accounts/{id}` of a location group to invite to a location (`scope=location` only). */
    adminAccount?: string;
    role: "OWNER" | "MANAGER" | "SITE_MANAGER" | (string & {});
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `createGoogleBusinessAdmin`. */
  export interface CreateGoogleBusinessAdminResponse extends ApiResponse {
    success?: boolean;
    parent?: string;
    /** Google's new Admin. */
    admin?: Record<string, any>;
  }

  /** Options of `updateGoogleBusinessAdmin` (`PATCH /api/uploadposts/google-business/admins`). Any other API field is sent as well. */
  export interface UpdateGoogleBusinessAdminOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** `accounts/{a}/admins/{id}` or `locations/{l}/admins/{id}` (alias `name`). */
    adminName: string;
    role: "PRIMARY_OWNER" | "OWNER" | "MANAGER" | "SITE_MANAGER" | (string & {});
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `updateGoogleBusinessAdmin`. */
  export interface UpdateGoogleBusinessAdminResponse extends ApiResponse {
    success?: boolean;
    /** Google's Admin. */
    admin?: Record<string, any>;
    /** Present when nothing changed. */
    unchanged?: boolean;
  }

  /** Options of `deleteGoogleBusinessAdmin` (`DELETE /api/uploadposts/google-business/admins`). Any other API field is sent as well. */
  export interface DeleteGoogleBusinessAdminOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Admin resource name from GET /admins (alias `name`). */
    adminName: string;
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `deleteGoogleBusinessAdmin`. */
  export interface DeleteGoogleBusinessAdminResponse extends ApiResponse {
    success?: boolean;
    /** Resource name of the removed admin. */
    removed?: string;
  }

  /** Options of `acceptGoogleBusinessInvitation` (`POST /api/uploadposts/google-business/invitations/accept`). Any other API field is sent as well. */
  export interface AcceptGoogleBusinessInvitationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** `accounts/{a}/invitations/{id}` (alias `invitation_name`). */
    invitation: string;
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `acceptGoogleBusinessInvitation`. */
  export interface AcceptGoogleBusinessInvitationResponse extends ApiResponse {
    success?: boolean;
    invitation?: string;
    action?: "accept" | "decline";
    role?: string;
  }

  /** Options of `declineGoogleBusinessInvitation` (`POST /api/uploadposts/google-business/invitations/decline`). Any other API field is sent as well. */
  export interface DeclineGoogleBusinessInvitationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** `accounts/{a}/invitations/{id}` (alias `invitation_name`). */
    invitation: string;
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `declineGoogleBusinessInvitation`. */
  export interface DeclineGoogleBusinessInvitationResponse extends ApiResponse {
    success?: boolean;
    invitation?: string;
    action?: "accept" | "decline";
    role?: string;
  }

  /** Options of `transferGoogleBusinessLocation` (`POST /api/uploadposts/google-business/locations/transfer`). Any other API field is sent as well. */
  export interface TransferGoogleBusinessLocationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Location: `locations/{id}`, a bare id or `accounts/{a}/locations/{id}`. */
    locationId: string;
    /** `accounts/{id}` that receives the location. */
    destinationAccount: string;
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `transferGoogleBusinessLocation`. */
  export interface TransferGoogleBusinessLocationResponse extends ApiResponse {
    success?: boolean;
    location_id?: string;
    destination_account?: string;
    previous_account?: string;
  }

  /** Options of `createGoogleBusinessLocation` (`POST /api/uploadposts/google-business/locations/create`). Any other API field is sent as well. */
  export interface CreateGoogleBusinessLocationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Google account, `accounts/{id}` or a bare id. Default: the account saved when Google Business was connected. */
    account?: string;
    /** Google Location object (instead of the friendly fields). */
    location?: Record<string, any>;
    /** BCP 47; cannot be changed later. */
    languageCode: string;
    title?: string;
    primaryCategory?: string;
    /** Up to 50 letters, digits, `-` or `_`. Generated if missing. */
    requestId?: string;
    /** Validate and return what would be sent, without applying it. */
    dryRun?: boolean;
    /** Required (`true`) for a real creation. */
    confirm?: boolean;
  }

  /** Answer of `createGoogleBusinessLocation`. */
  export interface CreateGoogleBusinessLocationResponse extends ApiResponse {
    success?: boolean;
    account?: string;
    dry_run?: boolean;
    request_id?: string;
    /** Google's new Location. */
    location?: Record<string, any>;
    location_id?: string;
  }

  /** Options of `deleteGoogleBusinessLocation` (`DELETE /api/uploadposts/google-business/locations/delete`). Any other API field is sent as well. */
  export interface DeleteGoogleBusinessLocationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Location: `locations/{id}`, a bare id or `accounts/{a}/locations/{id}`. */
    locationId: string;
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `deleteGoogleBusinessLocation`. */
  export interface DeleteGoogleBusinessLocationResponse extends ApiResponse {
    success?: boolean;
    location_id?: string;
    deleted?: boolean;
  }

  /** Options of `getGoogleBusinessNotificationSettings` (`GET /api/uploadposts/google-business/notifications`). Any other API field is sent as well. */
  export interface GetGoogleBusinessNotificationSettingsOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Google account, `accounts/{id}` or a bare id. Default: the account saved when Google Business was connected. */
    account?: string;
  }

  /** Answer of `getGoogleBusinessNotificationSettings`. */
  export interface GetGoogleBusinessNotificationSettingsResponse extends ApiResponse {
    success?: boolean;
    account?: string;
    /** Google's NotificationSetting (`name`, `notificationTypes`, `pubsubTopic`). */
    notification_setting?: Record<string, any>;
    active?: boolean;
    managed_by_upload_post?: boolean;
    other_tool_configured?: boolean;
    available_types?: string[];
    /** Google notification type -> webhook event. */
    webhook_events?: Record<string, any>;
  }

  /** Options of `updateGoogleBusinessNotificationSettings` (`PUT /api/uploadposts/google-business/notifications`). Any other API field is sent as well. */
  export interface UpdateGoogleBusinessNotificationSettingsOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Google account, `accounts/{id}` or a bare id. Default: the account saved when Google Business was connected. */
    account?: string;
    /** `true` (default) or `false`. */
    enabled?: boolean;
    /** Types to receive (alias `notification_types`). Default: all six. */
    types?: ("GOOGLE_UPDATE" | "NEW_REVIEW" | "UPDATED_REVIEW" | "NEW_CUSTOMER_MEDIA" | "DUPLICATE_LOCATION" | "VOICE_OF_MERCHANT_UPDATED" | (string & {}))[];
    /** Must be `true`: this replaces any other tool's setting for this Google account. */
    confirm: boolean;
    /** `true` to replace a setting that belongs to another tool. */
    force?: boolean;
    /** With `enabled: false` and `force: true` on another tool's setting: switch that tool's notifications off too. */
    confirmOtherTool?: boolean;
  }

  /** Answer of `updateGoogleBusinessNotificationSettings`. */
  export interface UpdateGoogleBusinessNotificationSettingsResponse extends ApiResponse {
    success?: boolean;
    account?: string;
    /** Google's NotificationSetting (`name`, `notificationTypes`, `pubsubTopic`). */
    notification_setting?: Record<string, any>;
    active?: boolean;
    managed_by_upload_post?: boolean;
    other_tool_configured?: boolean;
    available_types?: string[];
    /** Google notification type -> webhook event. */
    webhook_events?: Record<string, any>;
    changed?: boolean;
    google_setting_kept?: boolean;
    webhook_events_to_subscribe?: string[];
    notice?: string;
  }

  /** Options of `startGoogleBusinessVerification` (`POST /api/uploadposts/google-business/verification/start`). Any other API field is sent as well. */
  export interface StartGoogleBusinessVerificationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Location: `locations/{id}`, a bare id or `accounts/{a}/locations/{id}`. */
    locationId?: string;
    method: "ADDRESS" | "EMAIL" | "PHONE_CALL" | "SMS" | "AUTO" | "TRUSTED_PARTNER" | (string & {});
    /** `PHONE_CALL` / `SMS`: one of the numbers in the options. */
    phoneNumber?: string;
    /** `EMAIL`: one of the addresses in the options. */
    emailAddress?: string;
    /** `ADDRESS`: name the postcard is addressed to. */
    mailerContact?: string;
    /** Required for `TRUSTED_PARTNER`. */
    trustedPartnerToken?: string;
    /** Vetted partners only. Not with the four fields above. */
    token?: string;
    /** BCP-47, default `en`. The methods depend on the language and the country. */
    languageCode?: string;
    /** Only for service-area businesses without a storefront: `{"address": {PostalAddress with regionCode}}`. */
    context?: Record<string, any>;
    /** Must be `true`. */
    confirm: boolean;
  }

  /** Answer of `startGoogleBusinessVerification`. */
  export interface StartGoogleBusinessVerificationResponse extends ApiResponse {
    success?: boolean;
    location_id?: string;
    verification_name?: string;
    state?: string;
    /** Google's Verification. */
    verification?: Record<string, any>;
  }

  /** Options of `completeGoogleBusinessVerification` (`POST /api/uploadposts/google-business/verification/complete`). Any other API field is sent as well. */
  export interface CompleteGoogleBusinessVerificationOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Location: `locations/{id}`, a bare id or `accounts/{a}/locations/{id}`. */
    locationId?: string;
    /** `locations/{l}/verifications/{v}` (one of `verification_name` / `verification_id`). */
    verificationName?: string;
    /** Last part of the name, with `location_id`. */
    verificationId?: string;
    /** The code Google sent. */
    pin: string;
  }

  /** Answer of `completeGoogleBusinessVerification`. */
  export interface CompleteGoogleBusinessVerificationResponse extends ApiResponse {
    success?: boolean;
    location_id?: string;
    verification_name?: string;
    state?: string;
    /** Google's Verification. */
    verification?: Record<string, any>;
  }

  /** Options of `generateGoogleBusinessVerificationToken` (`POST /api/uploadposts/google-business/verification/token`). Any other API field is sent as well. */
  export interface GenerateGoogleBusinessVerificationTokenOptions extends ApiParams {
    /** Profile username with Google Business connected (alias `profile`). */
    user: string;
    /** Location: `locations/{id}`, a bare id or `accounts/{a}/locations/{id}`. */
    locationId?: string;
  }

  /** Answer of `generateGoogleBusinessVerificationToken`. */
  export interface GenerateGoogleBusinessVerificationTokenResponse extends ApiResponse {
    success?: boolean;
    location_id?: string;
    result?: string;
    instant_verification_token?: string;
    /** Google's whole answer. */
    response?: Record<string, any>;
  }

  /** Options of `connectChatgptAdsAccount` (`POST /api/uploadposts/ads/chatgpt/connect`). Any other API field is sent as well. */
  export interface ConnectChatgptAdsAccountOptions extends ApiParams {
    /** Your OpenAI Ads API key (ads.openai.com -> Settings -> API keys). */
    apiKey: string;
    /** Link the ad account to this profile. */
    profileUsername?: string;
    /** Friendly label. Default: the ad account name reported by OpenAI. */
    name?: string;
    /** Make this the account used when a request does not choose one. */
    default?: boolean;
  }

  /** Answer of `connectChatgptAdsAccount`. */
  export interface ConnectChatgptAdsAccountResponse extends ApiResponse {
    success?: boolean;
    message?: string;
    /** A connected ChatGPT Ads account. The API key is never returned. */
    account?: { ad_account_id?: string; name?: string; currency_code?: string; timezone?: string; status?: string; url?: string; review_status?: string; default?: boolean; connected_at?: string; updated_at?: string; profiles?: string[]; [key: string]: any };
  }

  /** Options of `listChatgptAdsAccounts` (`GET /api/uploadposts/ads/chatgpt/accounts`). Any other API field is sent as well. */
  export interface ListChatgptAdsAccountsOptions extends ApiParams {
  }

  /** Answer of `listChatgptAdsAccounts`. */
  export interface ListChatgptAdsAccountsResponse extends ApiResponse {
    success?: boolean;
    accounts?: ({ ad_account_id?: string; name?: string; currency_code?: string; timezone?: string; status?: string; url?: string; review_status?: string; default?: boolean; connected_at?: string; updated_at?: string; profiles?: string[]; [key: string]: any })[];
    count?: number;
  }

  /** Options of `disconnectChatgptAdsAccount` (`DELETE /api/uploadposts/ads/chatgpt/accounts/{ad_account_id}`). Any other API field is sent as well. */
  export interface DisconnectChatgptAdsAccountOptions extends ApiParams {
    /** Connected ad account (`adacct_...`). */
    adAccountId: string;
    /** Only unlink this profile. */
    profileUsername?: string;
  }

  /** Answer of `disconnectChatgptAdsAccount`. */
  export interface DisconnectChatgptAdsAccountResponse extends ApiResponse {
    success?: boolean;
    message?: string;
  }

  /** Options of `getChatgptAdsAccount` (`GET /api/uploadposts/ads/chatgpt/account`). Any other API field is sent as well. */
  export interface GetChatgptAdsAccountOptions extends ApiParams {
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsAccount`. */
  export interface GetChatgptAdsAccountResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad account object, unchanged. */
    account?: Record<string, any>;
  }

  /** Options of `listChatgptAdsCampaigns` (`GET /api/uploadposts/ads/chatgpt/campaigns`). Any other API field is sent as well. */
  export interface ListChatgptAdsCampaignsOptions extends ApiParams {
    /** 1-500 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** Sort order. */
    order?: "asc" | "desc" | (string & {});
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `listChatgptAdsCampaigns`. */
  export interface ListChatgptAdsCampaignsResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign objects. */
    campaigns?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `createChatgptAdsCampaign` (`POST /api/uploadposts/ads/chatgpt/campaigns`). Any other API field is sent as well. */
  export interface CreateChatgptAdsCampaignOptions extends ApiParams {
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** 3-1000 characters. */
    name: string;
    /** Lifetime spend limit in the ad account currency. Minimum 1. */
    budget?: number;
    /** Same in micros (`25000000` = 25.00). Alternative to `budget`. */
    budgetMicros?: number;
    /** Default `paused`: nothing starts spending by accident. */
    status?: "paused" | "active" | (string & {});
    description?: string;
    /** Unix timestamp or ISO-8601 datetime. Empty or null clears it. */
    startTime?: number | string;
    /** Unix timestamp or ISO-8601 datetime. Empty or null clears it. */
    endTime?: number | string;
    /** Default `impressions`. Cannot be changed later. */
    biddingType?: "impressions" | "clicks" | "conversions" | (string & {});
    /** Exactly one active standard event setting; required for `conversions`. */
    conversionEventSettingIds?: string[];
    /** Passed to OpenAI as is. */
    mode?: string;
    /** Product feed (product-feed campaigns). */
    productFeedId?: string;
    /** OpenAI location ids (country, region or DMA). Shorthand for `targeting.locations.include`. */
    locations?: string[];
    /** Shorthand for `targeting.custom_audiences.ids`. */
    customAudienceIds?: string[];
    /** Shorthand for `targeting.excluded_custom_audiences.ids`. */
    excludedCustomAudienceIds?: string[];
    /** Full OpenAI targeting object. Overrides the shorthands. */
    targeting?: Record<string, any>;
  }

  /** Answer of `createChatgptAdsCampaign`. */
  export interface CreateChatgptAdsCampaignResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign object, unchanged. */
    campaign?: Record<string, any>;
  }

  /** Options of `getChatgptAdsCampaign` (`GET /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}`). Any other API field is sent as well. */
  export interface GetChatgptAdsCampaignOptions extends ApiParams {
    /** Campaign id. */
    campaignId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsCampaign`. */
  export interface GetChatgptAdsCampaignResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign object, unchanged. */
    campaign?: Record<string, any>;
  }

  /** Options of `updateChatgptAdsCampaign` (`POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}`). Any other API field is sent as well. */
  export interface UpdateChatgptAdsCampaignOptions extends ApiParams {
    /** Campaign id. */
    campaignId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** 3-1000 characters. */
    name?: string;
    /** Lifetime spend limit in the ad account currency. Minimum 1. */
    budget?: number;
    /** Same in micros (`25000000` = 25.00). Alternative to `budget`. */
    budgetMicros?: number;
    /** `archived` is irreversible. */
    status?: "active" | "paused" | "archived" | (string & {});
    description?: string;
    /** Unix timestamp or ISO-8601 datetime. Empty or null clears it. */
    startTime?: number | string;
    /** Unix timestamp or ISO-8601 datetime. Empty or null clears it. */
    endTime?: number | string;
    /** OpenAI location ids (country, region or DMA). Shorthand for `targeting.locations.include`. */
    locations?: string[];
    /** Shorthand for `targeting.custom_audiences.ids`. */
    customAudienceIds?: string[];
    /** Shorthand for `targeting.excluded_custom_audiences.ids`. */
    excludedCustomAudienceIds?: string[];
    /** Full OpenAI targeting object. Overrides the shorthands. */
    targeting?: Record<string, any>;
  }

  /** Answer of `updateChatgptAdsCampaign`. */
  export interface UpdateChatgptAdsCampaignResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign object, unchanged. */
    campaign?: Record<string, any>;
  }

  /** Options of `activateChatgptAdsCampaign` (`POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/activate`). Any other API field is sent as well. */
  export interface ActivateChatgptAdsCampaignOptions extends ApiParams {
    /** Campaign id. */
    campaignId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `activateChatgptAdsCampaign`. */
  export interface ActivateChatgptAdsCampaignResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign object, unchanged. */
    campaign?: Record<string, any>;
  }

  /** Options of `pauseChatgptAdsCampaign` (`POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/pause`). Any other API field is sent as well. */
  export interface PauseChatgptAdsCampaignOptions extends ApiParams {
    /** Campaign id. */
    campaignId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `pauseChatgptAdsCampaign`. */
  export interface PauseChatgptAdsCampaignResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign object, unchanged. */
    campaign?: Record<string, any>;
  }

  /** Options of `archiveChatgptAdsCampaign` (`POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/archive`). Any other API field is sent as well. */
  export interface ArchiveChatgptAdsCampaignOptions extends ApiParams {
    /** Campaign id. */
    campaignId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `archiveChatgptAdsCampaign`. */
  export interface ArchiveChatgptAdsCampaignResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign object, unchanged. */
    campaign?: Record<string, any>;
  }

  /** Options of `getChatgptAdsCampaignInsights` (`GET /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/insights`). Any other API field is sent as well. */
  export interface GetChatgptAdsCampaignInsightsOptions extends ApiParams {
    /** Campaign id. */
    campaignId: string;
    /** `YYYY-MM-DD`, start of a date range in the ad account timezone. */
    since?: string;
    /** `YYYY-MM-DD`, end of the date range. */
    until?: string;
    /** Default `daily`. */
    timeGranularity?: "hourly" | "daily" | "monthly" | "none" | (string & {});
    /** Row entity inside the endpoint's scope. */
    aggregationLevel?: "ad_account" | "campaign" | "ad_group" | "ad" | (string & {});
    /** Repeatable (`fields` or `fields[]`). Metrics and metadata: `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `campaign.name`... */
    fields?: string[];
    /** Repeatable. One of `product`, `country`, `device`. */
    segments?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    filters?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    sort?: string[];
    /** Repeatable JSON-encoded range objects, for windows `since`/`until` cannot express (they win over `since`/`until`). */
    timeRanges?: string[];
    /** 1-2000 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsCampaignInsights`. */
  export interface GetChatgptAdsCampaignInsightsResponse extends ApiResponse {
    success?: boolean;
    /** Insight rows from OpenAI. */
    insights?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `listChatgptAdsAdGroups` (`GET /api/uploadposts/ads/chatgpt/adgroups`). Any other API field is sent as well. */
  export interface ListChatgptAdsAdGroupsOptions extends ApiParams {
    /** Parent campaign. */
    campaignId: string;
    /** 1-500 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** Sort order. */
    order?: "asc" | "desc" | (string & {});
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `listChatgptAdsAdGroups`. */
  export interface ListChatgptAdsAdGroupsResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group objects. */
    ad_groups?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `createChatgptAdsAdGroup` (`POST /api/uploadposts/ads/chatgpt/adgroups`). Any other API field is sent as well. */
  export interface CreateChatgptAdsAdGroupOptions extends ApiParams {
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** Parent campaign. */
    campaignId: string;
    /** 3-1000 characters. */
    name: string;
    /** Max bid per billing event in account currency (`0.06` = a $60 CPM on impression billing). */
    maxBid?: number;
    /** Same in micros. Alternative to `max_bid`. */
    maxBidMicros?: number;
    /** Default `impression`; `click` for click and conversion campaigns. */
    billingEventType?: "impression" | "click" | (string & {});
    /** Full OpenAI bidding config. Overrides `max_bid` / `billing_event_type`. */
    biddingConfig?: Record<string, any>;
    /** Default `paused`: nothing starts spending by accident. */
    status?: "paused" | "active" | (string & {});
    description?: string;
    /** When your product or service is useful, in your own words. */
    contextHints?: string[];
    /** Product filters for product-feed campaigns. */
    productSet?: Record<string, any>;
  }

  /** Answer of `createChatgptAdsAdGroup`. */
  export interface CreateChatgptAdsAdGroupResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group object, unchanged. */
    ad_group?: Record<string, any>;
  }

  /** Options of `getChatgptAdsAdGroup` (`GET /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}`). Any other API field is sent as well. */
  export interface GetChatgptAdsAdGroupOptions extends ApiParams {
    /** Ad group id. */
    adGroupId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsAdGroup`. */
  export interface GetChatgptAdsAdGroupResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group object, unchanged. */
    ad_group?: Record<string, any>;
  }

  /** Options of `updateChatgptAdsAdGroup` (`POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}`). Any other API field is sent as well. */
  export interface UpdateChatgptAdsAdGroupOptions extends ApiParams {
    /** Ad group id. */
    adGroupId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** 3-1000 characters. */
    name?: string;
    /** Max bid per billing event in account currency (`0.06` = a $60 CPM on impression billing). */
    maxBid?: number;
    /** Same in micros. Alternative to `max_bid`. */
    maxBidMicros?: number;
    /** Default `impression`; `click` for click and conversion campaigns. */
    billingEventType?: "impression" | "click" | (string & {});
    /** Full OpenAI bidding config. Overrides `max_bid` / `billing_event_type`. */
    biddingConfig?: Record<string, any>;
    /** `archived` is irreversible. */
    status?: "active" | "paused" | "archived" | (string & {});
    description?: string;
    /** When your product or service is useful, in your own words. */
    contextHints?: string[];
    /** Product filters for product-feed campaigns. */
    productSet?: Record<string, any>;
  }

  /** Answer of `updateChatgptAdsAdGroup`. */
  export interface UpdateChatgptAdsAdGroupResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group object, unchanged. */
    ad_group?: Record<string, any>;
  }

  /** Options of `activateChatgptAdsAdGroup` (`POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/activate`). Any other API field is sent as well. */
  export interface ActivateChatgptAdsAdGroupOptions extends ApiParams {
    /** Ad group id. */
    adGroupId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `activateChatgptAdsAdGroup`. */
  export interface ActivateChatgptAdsAdGroupResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group object, unchanged. */
    ad_group?: Record<string, any>;
  }

  /** Options of `pauseChatgptAdsAdGroup` (`POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/pause`). Any other API field is sent as well. */
  export interface PauseChatgptAdsAdGroupOptions extends ApiParams {
    /** Ad group id. */
    adGroupId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `pauseChatgptAdsAdGroup`. */
  export interface PauseChatgptAdsAdGroupResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group object, unchanged. */
    ad_group?: Record<string, any>;
  }

  /** Options of `archiveChatgptAdsAdGroup` (`POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/archive`). Any other API field is sent as well. */
  export interface ArchiveChatgptAdsAdGroupOptions extends ApiParams {
    /** Ad group id. */
    adGroupId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `archiveChatgptAdsAdGroup`. */
  export interface ArchiveChatgptAdsAdGroupResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad group object, unchanged. */
    ad_group?: Record<string, any>;
  }

  /** Options of `getChatgptAdsAdGroupInsights` (`GET /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/insights`). Any other API field is sent as well. */
  export interface GetChatgptAdsAdGroupInsightsOptions extends ApiParams {
    /** Ad group id. */
    adGroupId: string;
    /** `YYYY-MM-DD`, start of a date range in the ad account timezone. */
    since?: string;
    /** `YYYY-MM-DD`, end of the date range. */
    until?: string;
    /** Default `daily`. */
    timeGranularity?: "hourly" | "daily" | "monthly" | "none" | (string & {});
    /** Row entity inside the endpoint's scope. */
    aggregationLevel?: "ad_account" | "campaign" | "ad_group" | "ad" | (string & {});
    /** Repeatable (`fields` or `fields[]`). Metrics and metadata: `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `campaign.name`... */
    fields?: string[];
    /** Repeatable. One of `product`, `country`, `device`. */
    segments?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    filters?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    sort?: string[];
    /** Repeatable JSON-encoded range objects, for windows `since`/`until` cannot express (they win over `since`/`until`). */
    timeRanges?: string[];
    /** 1-2000 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsAdGroupInsights`. */
  export interface GetChatgptAdsAdGroupInsightsResponse extends ApiResponse {
    success?: boolean;
    /** Insight rows from OpenAI. */
    insights?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `listChatgptAdsAds` (`GET /api/uploadposts/ads/chatgpt/ads`). Any other API field is sent as well. */
  export interface ListChatgptAdsAdsOptions extends ApiParams {
    /** Parent ad group. */
    adGroupId: string;
    /** 1-500 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** Sort order. */
    order?: "asc" | "desc" | (string & {});
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `listChatgptAdsAds`. */
  export interface ListChatgptAdsAdsResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad objects. */
    ads?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `createChatgptAdsAd` (`POST /api/uploadposts/ads/chatgpt/ads`). Any other API field is sent as well. */
  export interface CreateChatgptAdsAdOptions extends ApiParams {
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** Parent ad group. */
    adGroupId: string;
    /** Internal name, 3-1000 characters. Not shown to users. */
    name: string;
    /** Headline, 3-50 characters. */
    title?: string;
    /** Copy, up to 100 characters. */
    body?: string;
    /** http(s) destination URL. */
    targetUrl?: string;
    /** Creative id from POST /creatives. */
    fileId?: string;
    price?: string;
    /** Creative type (flat form). */
    type?: "chat_card" | "product_ad_template" | (string & {});
    /** Default `paused`: nothing starts spending by accident. */
    status?: "paused" | "active" | (string & {});
    /** Creative. `chat_card` (default) needs `title`, `body`, `target_url` and `file_id`; `product_ad_template` takes image and destination from the feed item. */
    creative?: { type?: "chat_card" | "product_ad_template" | (string & {}); title?: string; body?: string; target_url?: string; file_id?: string; price?: string; [key: string]: any };
  }

  /** Answer of `createChatgptAdsAd`. */
  export interface CreateChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad object, unchanged. */
    ad?: Record<string, any>;
  }

  /** Options of `getChatgptAdsAd` (`GET /api/uploadposts/ads/chatgpt/ads/{ad_id}`). Any other API field is sent as well. */
  export interface GetChatgptAdsAdOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsAd`. */
  export interface GetChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad object, unchanged. */
    ad?: Record<string, any>;
  }

  /** Options of `updateChatgptAdsAd` (`POST /api/uploadposts/ads/chatgpt/ads/{ad_id}`). Any other API field is sent as well. */
  export interface UpdateChatgptAdsAdOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** 3-1000 characters. */
    name?: string;
    /** `archived` is irreversible. */
    status?: "active" | "paused" | "archived" | (string & {});
    /** Creative. `chat_card` (default) needs `title`, `body`, `target_url` and `file_id`; `product_ad_template` takes image and destination from the feed item. */
    creative?: { type?: "chat_card" | "product_ad_template" | (string & {}); title?: string; body?: string; target_url?: string; file_id?: string; price?: string; [key: string]: any };
  }

  /** Answer of `updateChatgptAdsAd`. */
  export interface UpdateChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad object, unchanged. */
    ad?: Record<string, any>;
  }

  /** Options of `activateChatgptAdsAd` (`POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/activate`). Any other API field is sent as well. */
  export interface ActivateChatgptAdsAdOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `activateChatgptAdsAd`. */
  export interface ActivateChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad object, unchanged. */
    ad?: Record<string, any>;
  }

  /** Options of `pauseChatgptAdsAd` (`POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/pause`). Any other API field is sent as well. */
  export interface PauseChatgptAdsAdOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `pauseChatgptAdsAd`. */
  export interface PauseChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad object, unchanged. */
    ad?: Record<string, any>;
  }

  /** Options of `archiveChatgptAdsAd` (`POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/archive`). Any other API field is sent as well. */
  export interface ArchiveChatgptAdsAdOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `archiveChatgptAdsAd`. */
  export interface ArchiveChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's ad object, unchanged. */
    ad?: Record<string, any>;
  }

  /** Options of `getChatgptAdsAdInsights` (`GET /api/uploadposts/ads/chatgpt/ads/{ad_id}/insights`). Any other API field is sent as well. */
  export interface GetChatgptAdsAdInsightsOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** `YYYY-MM-DD`, start of a date range in the ad account timezone. */
    since?: string;
    /** `YYYY-MM-DD`, end of the date range. */
    until?: string;
    /** Default `daily`. */
    timeGranularity?: "hourly" | "daily" | "monthly" | "none" | (string & {});
    /** Row entity inside the endpoint's scope. */
    aggregationLevel?: "ad_account" | "campaign" | "ad_group" | "ad" | (string & {});
    /** Repeatable (`fields` or `fields[]`). Metrics and metadata: `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `campaign.name`... */
    fields?: string[];
    /** Repeatable. One of `product`, `country`, `device`. */
    segments?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    filters?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    sort?: string[];
    /** Repeatable JSON-encoded range objects, for windows `since`/`until` cannot express (they win over `since`/`until`). */
    timeRanges?: string[];
    /** 1-2000 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsAdInsights`. */
  export interface GetChatgptAdsAdInsightsResponse extends ApiResponse {
    success?: boolean;
    /** Insight rows from OpenAI. */
    insights?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `previewChatgptAdsAd` (`POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/preview`). Any other API field is sent as well. */
  export interface PreviewChatgptAdsAdOptions extends ApiParams {
    /** Ad id. */
    adId: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `previewChatgptAdsAd`. */
  export interface PreviewChatgptAdsAdResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's preview object, unchanged. */
    preview?: Record<string, any>;
  }

  /** Options of `uploadChatgptAdsCreative` (`POST /api/uploadposts/ads/chatgpt/creatives`). Any other API field is sent as well. */
  export interface UploadChatgptAdsCreativeOptions extends ApiParams {
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** http(s) image URL. */
    imageUrl?: string;
    /** Image, up to 10 MB. */
    file?: string | Buffer | NodeJS.ReadableStream;
  }

  /** Answer of `uploadChatgptAdsCreative`. */
  export interface UploadChatgptAdsCreativeResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's answer. */
    creative?: { file_id?: string; [key: string]: any };
  }

  /** Options of `getChatgptAdsAccountInsights` (`GET /api/uploadposts/ads/chatgpt/insights`). Any other API field is sent as well. */
  export interface GetChatgptAdsAccountInsightsOptions extends ApiParams {
    /** `YYYY-MM-DD`, start of a date range in the ad account timezone. */
    since?: string;
    /** `YYYY-MM-DD`, end of the date range. */
    until?: string;
    /** Default `daily`. */
    timeGranularity?: "hourly" | "daily" | "monthly" | "none" | (string & {});
    /** Row entity inside the endpoint's scope. */
    aggregationLevel?: "ad_account" | "campaign" | "ad_group" | "ad" | (string & {});
    /** Repeatable (`fields` or `fields[]`). Metrics and metadata: `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `campaign.name`... */
    fields?: string[];
    /** Repeatable. One of `product`, `country`, `device`. */
    segments?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    filters?: string[];
    /** Repeatable JSON-encoded objects, passed through to OpenAI. */
    sort?: string[];
    /** Repeatable JSON-encoded range objects, for windows `since`/`until` cannot express (they win over `since`/`until`). */
    timeRanges?: string[];
    /** 1-2000 (default 20). */
    limit?: number;
    /** Cursor: `last_id` of the previous page. */
    after?: string;
    /** Cursor: `first_id` of the next page. */
    before?: string;
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
  }

  /** Answer of `getChatgptAdsAccountInsights`. */
  export interface GetChatgptAdsAccountInsightsResponse extends ApiResponse {
    success?: boolean;
    /** Insight rows from OpenAI. */
    insights?: (Record<string, any>)[];
    has_more?: boolean;
    first_id?: string;
    /** Send it as `after` for the next page. */
    last_id?: string;
    count?: number;
  }

  /** Options of `promoteChatgptAds` (`POST /api/uploadposts/ads/chatgpt/promote`). Any other API field is sent as well. */
  export interface PromoteChatgptAdsOptions extends ApiParams {
    /** ChatGPT Ads account to use (`adacct_...`). Without it: `X-Ads-Account-Id` header, then `ad_account_id` in the JSON body, then the only or the default connected account (several and no default = 400). */
    adAccountId?: string;
    /** Use the ad account linked to this profile, and only that one (404 if the profile has none linked; never falls back to the default account). */
    profileUsername?: string;
    /** Ad headline, 3-50 characters. */
    title: string;
    /** Ad copy, up to 100 characters. */
    body: string;
    /** http(s) destination URL. */
    targetUrl: string;
    /** Creative image URL (one of `image_url` / `file_id`). */
    imageUrl?: string;
    /** Already uploaded creative id. */
    fileId?: string;
    /** Lifetime spend limit in the ad account currency. Minimum 1. */
    budget?: number;
    /** Same in micros (`25000000` = 25.00). Alternative to `budget`. */
    budgetMicros?: number;
    /** Max bid per billing event in account currency (`0.06` = a $60 CPM on impression billing). */
    maxBid?: number;
    /** Same in micros. Alternative to `max_bid`. */
    maxBidMicros?: number;
    /** Base name of the three objects. Default: `title`. */
    name?: string;
    /** Default `paused`: nothing starts spending by accident. */
    status?: "paused" | "active" | (string & {});
    /** Default `impressions`. */
    biddingType?: "impressions" | "clicks" | "conversions" | (string & {});
    /** Default: `impression` for impression campaigns, `click` otherwise. */
    billingEventType?: "impression" | "click" | (string & {});
    /** Unix timestamp or ISO-8601 datetime. Empty or null clears it. */
    startTime?: number | string;
    /** Unix timestamp or ISO-8601 datetime. Empty or null clears it. */
    endTime?: number | string;
    /** Campaign description. */
    description?: string;
    /** For `conversions` bidding. */
    conversionEventSettingIds?: string[];
    /** OpenAI location ids (country, region or DMA). Shorthand for `targeting.locations.include`. */
    locations?: string[];
    /** Shorthand for `targeting.custom_audiences.ids`. */
    customAudienceIds?: string[];
    /** Shorthand for `targeting.excluded_custom_audiences.ids`. */
    excludedCustomAudienceIds?: string[];
    /** Full OpenAI targeting object. Overrides the shorthands. */
    targeting?: Record<string, any>;
    /** When the ad is useful, e.g. `["productivity"]`. */
    contextHints?: string[];
    /** Creative price. */
    price?: string;
    adGroupName?: string;
    adName?: string;
  }

  /** Answer of `promoteChatgptAds`. */
  export interface PromoteChatgptAdsResponse extends ApiResponse {
    success?: boolean;
    /** OpenAI's campaign. */
    campaign?: Record<string, any>;
    /** OpenAI's ad group. */
    ad_group?: Record<string, any>;
    /** OpenAI's ad. */
    ad?: Record<string, any>;
    status?: "paused" | "active";
    message?: string;
  }

  // </openapi:types>

  export class UploadPost {
    /**
     * Create a new Upload-Post client
     * @param apiKey - Your API key from Upload-Post
     * @param options - Client options (e.g. `actAsUser` for team members)
     */
    constructor(apiKey: string, options?: UploadPostClientOptions);

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
        /** TikTok only, when present: the upload's TikTok `publish_id` (drafts get their post id once published publicly) */
        original_publish_id?: string;
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
        /** TikTok only, when present: the upload's TikTok `publish_id` */
        original_publish_id?: string | null;
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
    editScheduled(jobId: string, options?: EditScheduledOptions): Promise<EditScheduledResponse>;

    // User Management
    /**
     * List all users/profiles
     */
    listUsers(): Promise<UsersResponse>;

    /**
     * Create a new user/profile. A username that already exists fails with 409
     * ("Username already in use"); the profile limit of the plan with 403
     * `PROFILE_LIMIT_REACHED`.
     * @param username - Profile name to create
     */
    createUser(username: string): Promise<{ success: boolean; profile?: Record<string, any>; [key: string]: any }>;

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
      /**
       * Not generally available yet (post approvals). `true` lets the end client
       * approve or reject the pending posts of this profile from the connect page
       * (`listClientPostApprovals` and friends, called with this JWT). Stored on
       * the profile; generate again with `false` to turn it off.
       */
      clientApproval?: boolean;
    }): Promise<JwtResponse>;

    /**
     * Validate a JWT token (`GET`, the token goes in `Authorization: Bearer`).
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
        /** While post approvals are on: whether the end client may approve posts with this JWT. */
        client_approval?: boolean;
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
    getNotificationConfig(): Promise<NotificationsResponse>;

    /**
     * Update notification configuration (including webhook settings)
     * @param options - Notification config options
     */
    updateNotificationConfig(options?: {
      /** upload_completed, social_account_*, and the opt-in dm_received / comment_received */
      webhookEvents?: Array<WebhookEvent | string>;
      webhookUrl?: string;
      /** Channels to turn on/off, e.g. `{ webhook: true }` */
      channels?: Record<string, boolean> | string[];
      telegramChatId?: string;
      slackWebhookUrl?: string;
      whatsappToPhone?: string;
    }): Promise<NotificationsResponse>;

    /**
     * Send a test notification through the configured channels. Webhook test
     * deliveries are logged (`test: true`) but never retried.
     */
    testNotifications(): Promise<{ success: boolean; [key: string]: any }>;

    /** Remove the account webhook (URL and events) and turn the webhook channel off. */
    deleteNotificationWebhook(): Promise<NotificationsResponse>;

    /** Rotate the webhook signing secret. The old one stops working at once. */
    rotateWebhookSecret(): Promise<{ success: boolean; webhook_secret: string }>;

    /** Get the webhook of one profile */
    getProfileWebhook(profileUsername: string): Promise<ProfileWebhookResponse>;

    /**
     * Set the webhook of one profile. `webhookEvents: null` clears the
     * per-profile selection; omit it to keep the current one.
     */
    setProfileWebhook(options: {
      profileUsername: string;
      webhookUrl: string;
      webhookEvents?: Partial<Record<WebhookEvent, boolean>> | null;
    }): Promise<ProfileWebhookResponse>;

    /** Remove the webhook of one profile */
    deleteProfileWebhook(profileUsername: string): Promise<ProfileWebhookResponse>;

    // Webhook deliveries

    /**
     * List webhook deliveries (account and per-profile), newest first, kept 7
     * days. Delivery is at least once: retryable failures (timeout, connection
     * error, 5xx, 408, 429) are retried up to 6 attempts over ~8.5 hours with
     * the same `X-Upload-Post-Delivery` id.
     */
    listWebhookDeliveries(options?: ListWebhookDeliveriesOptions): Promise<WebhookDeliveriesResponse>;

    /** Get one delivery, always with its `payload`. 404 if unknown or older than 7 days. */
    getWebhookDelivery(deliveryId: string): Promise<WebhookDeliveryResponse>;

    /**
     * Send a logged delivery again as a new delivery (new id, original in
     * `X-Upload-Post-Redelivery-Of`). 404 unknown; 409 with `reason`
     * `webhook_removed` / `event_unsubscribed` / `blocked_url`; 503
     * `delivery_log_disabled`.
     */
    redeliverWebhook(deliveryId: string): Promise<WebhookDeliveryResponse>;

    // Teams

    /**
     * List your team members (owner only). With seat limits enforced, members
     * carry `suspended` / `suspended_reason` and the response adds `plan` and
     * `seat_limit`.
     */
    listTeamMembers(): Promise<TeamMembersResponse>;

    /** List the accounts shared with you, with `suspended` when your seat is not covered. */
    listSharedAccounts(): Promise<SharedAccountsResponse>;

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
      platform?: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'tiktok' | 'threads' | 'x' | 'bluesky' | 'reddit';
      postId?: string;
      postUrl?: string;
      /**
       * Read the replies to this comment instead of the post's top-level comments.
       * Supported on TikTok, Threads, YouTube, Instagram, Facebook and LinkedIn
       * (company Pages; prefer the full `comment_urn`). X, Bluesky and Reddit
       * answer `400 platform_not_supported`.
       */
      commentId?: string;
      limit?: number;
      /** `pagination.next_cursor` of the previous page (a numeric offset on LinkedIn replies) */
      after?: string;
    }): Promise<{
      success: boolean;
      comments?: Array<{
        id: string;
        text: string;
        timestamp: string;
        user: { id: string; username: string };
        [key: string]: any;
      }>;
      pagination?: { next_cursor?: string | null; has_next?: boolean; [key: string]: any };
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

    // AutoDM

    /**
     * Start a per-post monitor (DM on Instagram, public reply on TikTok,
     * YouTube, Facebook, Threads, Bluesky). 2 per profile per day, 15-day expiry.
     */
    startAutodm(options: StartAutodmOptions): Promise<{ success: boolean; monitor_id?: string; [key: string]: any }>;
    stopAutodm(monitorId: string): Promise<{ success: boolean; [key: string]: any }>;
    pauseAutodm(monitorId: string): Promise<{ success: boolean; [key: string]: any }>;
    resumeAutodm(monitorId: string): Promise<{ success: boolean; [key: string]: any }>;
    deleteAutodm(monitorId: string): Promise<{ success: boolean; [key: string]: any }>;
    getAutodmStatus(options?: { includeInactive?: boolean }): Promise<{ success: boolean; [key: string]: any }>;
    getAutodmLogs(monitorId: string): Promise<{ success: boolean; [key: string]: any }>;

    /**
     * Create an account-wide Instagram AutoDM rule: every post (present and
     * future), story replies, story mentions and keyword DMs, no expiry, up to
     * 10 per account. Webhook only: `502 webhook_subscription_failed` means
     * reconnect Instagram.
     */
    createAutodmRule(options: CreateAutodmRuleOptions): Promise<AutodmRuleResponse>;
    listAutodmRules(options?: { profileUsername?: string }): Promise<AutodmRulesResponse>;
    pauseAutodmRule(ruleId: string): Promise<AutodmRuleResponse>;
    /** A `stopped` rule resumes only once its account is back on its profile (else `409 rule_stopped`). */
    resumeAutodmRule(ruleId: string): Promise<AutodmRuleResponse>;
    deleteAutodmRule(ruleId: string): Promise<AutodmRuleResponse>;

    // Direct messages

    /**
     * Send a DM or a DM action on Instagram, Messenger (`facebook`), WhatsApp or
     * Bluesky. Bluesky needs an app password with DM access (else
     * `403 bluesky_dm_scope_missing`); a `504 bluesky_send_unconfirmed` may have
     * been delivered, so check the conversation before resending.
     */
    sendDm(options: SendDmOptions): Promise<{ success: boolean; conversation_id?: string; message_id?: string; [key: string]: any }>;

    /** List DM conversations with their latest messages. */
    getDmConversations(options: DmConversationsOptions): Promise<DmConversationsResponse>;

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
      /** Not available for Instagram, TikTok or Reddit (400 with the reason). */
      platform: 'facebook' | 'youtube' | 'x' | 'linkedin' | 'threads' | 'pinterest' | 'bluesky' | 'google_business' | 'telegram';
      postId: string;
      /** Telegram: delete every message of the post, not only postId */
      deleteAllMessages?: boolean;
      [key: string]: any;
    }): Promise<{
      success: boolean;
      message?: string;
      error?: string;
    }>;

    // ==================== Resource endpoints ====================
    // Posts: edit, repost, actions
    /**
     * Edit a published post (Facebook, LinkedIn, X, Google Business, Telegram: text, buttons, pin/unpin, stop a poll, live location, replace the media).
     * @see https://docs.upload-post.com/api/edit-post
     */
    editPost(options: { user: string; platform: string; postId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Repost / reshare a post (LinkedIn, X, Threads; Telegram forward or copy with `mode`, `post_ids`, `all_messages`).
     * @see https://docs.upload-post.com/api/repost
     */
    repostPost(options: { user: string; platform: string; postId?: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Act on a published post: Telegram reactions and forward/copy; Bluesky bookmark/unbookmark, pin/unpin, reply and quote settings, detach/reattach quotes.
     * @see https://docs.upload-post.com/api/bluesky-post-actions
     */
    postAction(options: { user: string; platform: string; action: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Save a post: a Pinterest Pin to a board, or a Bluesky bookmark (`platform: "bluesky"`).
     * @see https://docs.upload-post.com/api/save-pin
     */
    savePost(options: { user: string; postId: string } & ApiParams): Promise<ApiResponse>;

    // Best time to post and queue
    /**
     * Best hours to publish for a connected account, with `source` and `confidence` (`timezone`, `top`, `refresh`, `page_urn`, `facebook_page_id`).
     * @see https://docs.upload-post.com/api/best-times
     */
    getBestTimes(options: { profileUsername: string; platform: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Queue settings, including `slots_mode`, `auto_slots` and `effective_slots`.
     * `configured` is `false` while the queue of the profile was never saved
     * (`queue_settings` then shows the defaults).
     * @see https://docs.upload-post.com/api/queue-system
     */
    getQueueSettings(options: { profileUsername: string } & ApiParams): Promise<ApiResponse & { queue_settings?: Record<string, any>; configured?: boolean }>;

    /**
     * Update the queue. `slots: "auto"` (or `slots_mode: "auto"`) fills the best hours automatically (`auto_slots_count`, `auto_platforms`, `refresh`); a `slots` array switches back to fixed slots.
     * @see https://docs.upload-post.com/api/queue-system
     */
    updateQueueSettings(options: { profileUsername: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Upcoming queue slots and what is scheduled in each (`count`, max 50).
     * @see https://docs.upload-post.com/api/queue-system
     */
    getQueuePreview(options: { profileUsername: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Next free queue slot.
     * @see https://docs.upload-post.com/api/queue-system
     */
    getNextQueueSlot(options: { profileUsername: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Mark a queue slot (ISO 8601, UTC) as full.
     * @see https://docs.upload-post.com/api/queue-system
     */
    markQueueSlotFull(options: { profileUsername: string; slotDatetime: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Unmark a queue slot marked as full.
     * @see https://docs.upload-post.com/api/queue-system
     */
    unmarkQueueSlotFull(options: { profileUsername: string; slotDatetime: string } & ApiParams): Promise<ApiResponse>;

    // Telegram: chat, members and invite links
    /**
     * Chat details, subscribers/members and administrators (`include_administrators`, `return_bots`).
     * @see https://docs.upload-post.com/api/telegram-chat-insights
     */
    getTelegramChatInfo(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Change the chat title, description, photo (file or `photo_url`), permissions, slow mode, sticker set...
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    updateTelegramChatInfo(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Boosts of the chat (with `user_id`: that user's boosts).
     * @see https://docs.upload-post.com/api/telegram-chat-insights
     */
    getTelegramBoosts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read one member (`user_id`) or list the administrators.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    getTelegramMember(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Ban, unban, restrict, promote or give a custom title to a member (`action`).
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    moderateTelegramMember(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create an invite link (name, expiry, member limit, join requests, subscription).
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    createTelegramInviteLink(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit an invite link.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    editTelegramInviteLink(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Revoke an invite link.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    revokeTelegramInviteLink(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Generate a new primary invite link (the previous one stops working).
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    createTelegramPrimaryInviteLink(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Approve or decline a request to join the chat.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    answerTelegramJoinRequest(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Custom emoji that can be used as forum topic icons.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    getTelegramTopicIcons(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a forum topic.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    createTelegramTopic(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit, close, reopen, hide, unhide or unpin a forum topic.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    editTelegramTopic(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a forum topic.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    deleteTelegramTopic(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Unpin every message of the chat (or of a topic).
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    unpinAllTelegramMessages(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Make the bot leave the connected chat.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    leaveTelegramChat(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Approve or decline a suggested post in a channel direct messages chat.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    answerTelegramSuggestedPost(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Last messages of a user's personal channel.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    getTelegramUserPersonalChatMessages(options: { user: string; userId: number | string } & ApiParams): Promise<ApiResponse>;

    /**
     * Profile audios of a Telegram user.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    getTelegramUserProfileAudios(options: { user: string; userId: number | string } & ApiParams): Promise<ApiResponse>;

    /**
     * Backdrops available for the Telegram share screen theme.
     * @see https://docs.upload-post.com/api/telegram-chat
     */
    getTelegramShareThemeBackdrops(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Whether update receiving is on for the bot.
     * @see https://docs.upload-post.com/api/telegram-inbox
     */
    getTelegramUpdatesStatus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Telegram: bot profile, commands and stickers
    /**
     * Bot name, descriptions, photo, menu button and default administrator rights.
     * @see https://docs.upload-post.com/api/telegram-bot-profile
     */
    getTelegramBotProfile(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Change the bot profile (`photo`/`animation` as file or URL, `menu_button`, `default_administrator_rights`...).
     * @see https://docs.upload-post.com/api/telegram-bot-profile
     */
    updateTelegramBotProfile(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Bot commands for a scope and language.
     * @see https://docs.upload-post.com/api/telegram-bot-profile
     */
    getTelegramBotCommands(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Set the bot commands (`commands`, `scope`, `language_code`).
     * @see https://docs.upload-post.com/api/telegram-bot-profile
     */
    setTelegramBotCommands(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete the bot commands of a scope and language.
     * @see https://docs.upload-post.com/api/telegram-bot-profile
     */
    deleteTelegramBotCommands(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read a sticker set (`name`) or custom emoji stickers.
     * @see https://docs.upload-post.com/api/telegram-stickers
     */
    getTelegramStickerSet(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a sticker set.
     * @see https://docs.upload-post.com/api/telegram-stickers
     */
    createTelegramStickerSet(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit a sticker set (add, replace, reorder stickers, title, thumbnail, emoji, keywords...).
     * @see https://docs.upload-post.com/api/telegram-stickers
     */
    editTelegramStickerSet(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a sticker set, or a sticker from it.
     * @see https://docs.upload-post.com/api/telegram-stickers
     */
    deleteTelegramStickerSet(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Upload a sticker file (`sticker` file or `sticker_url`, `sticker_format`, `owner_user_id`); returns its `file_id`.
     * @see https://docs.upload-post.com/api/telegram-stickers
     */
    uploadTelegramStickerFile(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Telegram: Stars, invoices and gifts
    /**
     * The bot's Telegram Stars balance.
     * @see https://docs.upload-post.com/api/telegram-chat-insights
     */
    getTelegramStars(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * The bot's Telegram Stars transactions (`offset`, `limit`).
     * @see https://docs.upload-post.com/api/telegram-chat-insights
     */
    getTelegramStarTransactions(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Send an invoice to the connected chat or to `chat_id` (payments go to your bot).
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    sendTelegramInvoice(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create an invoice link.
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    createTelegramInvoiceLink(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Refund a Telegram Stars payment (`user_id`, `telegram_payment_charge_id`).
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    refundTelegramStarPayment(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Cancel or re-enable a user's Stars subscription.
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    editTelegramStarSubscription(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Gifts the bot can send.
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    getTelegramAvailableGifts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Gifts owned by a user or a chat.
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    getTelegramOwnedGifts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * A unique gift by name.
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    getTelegramUniqueGift(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Payment queries that were not answered in time.
     * @see https://docs.upload-post.com/api/telegram-payments
     */
    getTelegramUnansweredPayments(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Bluesky: reads
    /**
     * Who liked, reposted or quoted a post (`type`: likes, reposts, quotes; `limit`, `cursor`).
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    getPostEngagement(options: { postId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * One or several Bluesky profiles (`actor`: handles or DIDs, comma separated, up to 25; without it, the connected account).
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    getBlueskyProfiles(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Search Bluesky posts (`sort`, `since`, `until`, `author`, `lang`, `tag`, `limit`, `cursor`...).
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    searchBlueskyPosts(options: { user: string; q: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Search Bluesky accounts.
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    searchBlueskyActors(options: { q: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Followers of an account (`actor`, or the connected one with `user`; `known=true` for followers you follow).
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    getBlueskyFollowers(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Accounts an account follows.
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    getBlueskyFollows(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Read-only gateway to an allow-listed public Bluesky XRPC method (e.g. `app.bsky.feed.getAuthorFeed`); returns Bluesky's answer untouched.
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    blueskyXrpc(options: { nsid: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Moderation labels on the account and its posts.
     * @see https://docs.upload-post.com/api/bluesky-reads
     */
    getBlueskyLabels(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Bluesky: notifications
    /**
     * List notifications (`reasons`, `priority`, `limit`, `cursor`).
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    getBlueskyNotifications(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Unread notification count.
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    getBlueskyUnreadCount(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Mark notifications as seen (up to `seen_at`).
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    markBlueskyNotificationsSeen(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Notification preferences.
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    getBlueskyNotificationPreferences(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Update notification preferences.
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    updateBlueskyNotificationPreferences(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Accounts whose activity you are subscribed to.
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    getBlueskyActivitySubscriptions(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Subscribe to (or stop) an account's posts and replies.
     * @see https://docs.upload-post.com/api/bluesky-notifications
     */
    setBlueskyActivitySubscription(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Bluesky: profile, settings and drafts
    /**
     * The connected account's profile record.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    getBlueskyOwnProfile(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Update the profile (display name, description, `avatar`/`banner` files, links, pinned post...). Fields not sent stay as they are.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    updateBlueskyProfile(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read the live status.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    getBlueskyStatus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Set the live status.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    setBlueskyStatus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Clear the live status.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    clearBlueskyStatus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Chat and discovery settings.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    getBlueskySettings(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Change chat and discovery settings.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    updateBlueskySettings(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * App preferences (content filters, feeds, muted words...).
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    getBlueskyPreferences(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replace some app preferences.
     * @see https://docs.upload-post.com/api/bluesky-profile
     */
    updateBlueskyPreferences(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * List drafts.
     * @see https://docs.upload-post.com/api/bluesky-drafts
     */
    listBlueskyDrafts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a draft.
     * @see https://docs.upload-post.com/api/bluesky-drafts
     */
    createBlueskyDraft(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replace a draft.
     * @see https://docs.upload-post.com/api/bluesky-drafts
     */
    updateBlueskyDraft(options: { user: string; draftId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a draft.
     * @see https://docs.upload-post.com/api/bluesky-drafts
     */
    deleteBlueskyDraft(options: { user: string; draftId: string } & ApiParams): Promise<ApiResponse>;

    // Bluesky: chat
    /**
     * Chat status of the account.
     * @see https://docs.upload-post.com/api/bluesky-chat
     */
    getBlueskyChatStatus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * DM notification settings.
     * @see https://docs.upload-post.com/api/bluesky-chat
     */
    getBlueskyChatPreferences(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Change DM notification settings.
     * @see https://docs.upload-post.com/api/bluesky-chat
     */
    updateBlueskyChatPreferences(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Export the account's chat history.
     * @see https://docs.upload-post.com/api/bluesky-chat
     */
    exportBlueskyChat(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Google Business: posts and reviews
    /**
     * List the location's posts (`location_id`, `page_size`, `page_token`). Edit them with editPost and delete them with unpublishPost.
     * @see https://docs.upload-post.com/api/google-business-posts
     */
    listGoogleBusinessPosts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read one post (`post_id` or `post_name`).
     * @see https://docs.upload-post.com/api/google-business-posts
     */
    getGoogleBusinessPost(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * List reviews (`location_id`, `page_size`, `page_token`, `order_by`).
     * @see https://docs.upload-post.com/api/google-business-reviews
     */
    listGoogleBusinessReviews(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read one review (`review_name`, or `review_id` + `location_id`).
     * @see https://docs.upload-post.com/api/google-business-reviews
     */
    getGoogleBusinessReview(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Reviews of several locations at once (`location_ids`).
     * @see https://docs.upload-post.com/api/google-business-reviews
     */
    batchGetGoogleBusinessReviews(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Reply to a review, or replace the reply (`review_name`, or `review_id` + `location_id`).
     * @see https://docs.upload-post.com/api/google-business-reviews
     */
    replyToGoogleBusinessReview(options: { user: string; comment: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete the reply to a review.
     * @see https://docs.upload-post.com/api/google-business-reviews
     */
    deleteGoogleBusinessReviewReply(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Google Business: gallery and performance
    /**
     * List the location's gallery.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    listGoogleBusinessMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read one gallery item.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    getGoogleBusinessMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Upload a photo or video to the gallery: `file` (local path, stream or Buffer) or `source_url`, plus `category`, `description`, `media_format`.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    uploadGoogleBusinessMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Change a gallery item's category.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    updateGoogleBusinessMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a gallery item.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    deleteGoogleBusinessMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Photos uploaded by customers.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    listGoogleBusinessCustomerMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * One customer photo.
     * @see https://docs.upload-post.com/api/google-business-media
     */
    getGoogleBusinessCustomerMedia(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Daily metrics for any date range (impressions, calls, website clicks, directions...: `metrics`, `start_date`, `end_date`).
     * @see https://docs.upload-post.com/api/google-business-performance
     */
    getGoogleBusinessPerformance(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Monthly search keywords that showed the location (`start_month`, `end_month`).
     * @see https://docs.upload-post.com/api/google-business-performance
     */
    getGoogleBusinessSearchKeywords(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Google Business: location info
    /**
     * Read the location's info (name, address, hours, phones, categories, service area, open status...).
     * @see https://docs.upload-post.com/api/google-business-info
     */
    getGoogleBusinessLocationInfo(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit the location's info. `edit_mode: "legacy"` (default) or `"strict"` (`dry_run`, `confirm`, `include_edit_status`); `validate_only` in both.
     * @see https://docs.upload-post.com/api/google-business-info
     */
    updateGoogleBusinessLocationInfo(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Changes Google suggested for the location (`diff_fields`).
     * @see https://docs.upload-post.com/api/google-business-info
     */
    getGoogleBusinessGoogleUpdates(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Accept or reject Google's suggested changes, field by field.
     * @see https://docs.upload-post.com/api/google-business-info
     */
    answerGoogleBusinessGoogleUpdates(options: { user: string; decision: string; fields: string[] } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit status of each field (experimental).
     * @see https://docs.upload-post.com/api/google-business-info
     */
    getGoogleBusinessLocationInfoExtended(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * List locations with filters (`account`, `filter`, `order_by`, `read_mask`, `page_size`, `page_token`).
     * @see https://docs.upload-post.com/api/google-business-info
     */
    listGoogleBusinessLocations(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Locations available to a profile and the one pinned for its uploads.
     * @see https://docs.upload-post.com/api/google-business-location
     */
    getGoogleBusinessPinnedLocation(options: { profileUsername: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Pin the location a profile publishes to (instead of passing gbpLocationId on every upload).
     * @see https://docs.upload-post.com/api/google-business-location
     */
    pinGoogleBusinessLocation(options: { profileUsername: string; gbpLocationId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Clear the pinned location.
     * @see https://docs.upload-post.com/api/google-business-location
     */
    clearGoogleBusinessLocationPin(options: { profileUsername: string } & ApiParams): Promise<ApiResponse>;

    // Google Business: catalogs, attributes, Place Actions, menus, services and lodging
    /**
     * Search categories (`region_code`, `language_code`, `query`).
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    searchGoogleBusinessCategories(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Category details: service types and more-hours types (`names`).
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    batchGetGoogleBusinessCategories(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Search chains (`name`).
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    searchGoogleBusinessChains(options?: ApiParams): Promise<ApiResponse>;

    /**
     * One chain (`chain`).
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    getGoogleBusinessChain(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Is the business already on Google? Search Google's listings.
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    searchGoogleBusinessGoogleLocations(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Locations Google recommends for the account.
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    getGoogleBusinessRecommendedLocations(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Report a wrong listing to Google.
     * @see https://docs.upload-post.com/api/google-business-catalogs
     */
    reportGoogleBusinessGoogleLocation(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Attributes the location can use.
     * @see https://docs.upload-post.com/api/google-business-attributes
     */
    getGoogleBusinessAvailableAttributes(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Current attributes of the location.
     * @see https://docs.upload-post.com/api/google-business-attributes
     */
    getGoogleBusinessAttributes(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Update attributes.
     * @see https://docs.upload-post.com/api/google-business-attributes
     */
    updateGoogleBusinessAttributes(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Attributes as Google shows them.
     * @see https://docs.upload-post.com/api/google-business-attributes
     */
    getGoogleBusinessAttributesGoogleUpdated(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Attributes with their edit status (experimental).
     * @see https://docs.upload-post.com/api/google-business-attributes
     */
    getGoogleBusinessAttributesExtended(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Place Action types (booking, ordering, shopping links...) the location can use.
     * @see https://docs.upload-post.com/api/google-business-place-actions
     */
    getGoogleBusinessPlaceActionTypes(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * List Place Action links.
     * @see https://docs.upload-post.com/api/google-business-place-actions
     */
    listGoogleBusinessPlaceActions(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read one Place Action link (`link`).
     * @see https://docs.upload-post.com/api/google-business-place-actions
     */
    getGoogleBusinessPlaceAction(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a Place Action link.
     * @see https://docs.upload-post.com/api/google-business-place-actions
     */
    createGoogleBusinessPlaceAction(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit or switch off a Place Action link.
     * @see https://docs.upload-post.com/api/google-business-place-actions
     */
    updateGoogleBusinessPlaceAction(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a Place Action link.
     * @see https://docs.upload-post.com/api/google-business-place-actions
     */
    deleteGoogleBusinessPlaceAction(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Food menus of the location.
     * @see https://docs.upload-post.com/api/google-business-menus-services
     */
    getGoogleBusinessFoodMenus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replace the food menus.
     * @see https://docs.upload-post.com/api/google-business-menus-services
     */
    updateGoogleBusinessFoodMenus(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Services of the location.
     * @see https://docs.upload-post.com/api/google-business-menus-services
     */
    getGoogleBusinessServices(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replace the services.
     * @see https://docs.upload-post.com/api/google-business-menus-services
     */
    updateGoogleBusinessServices(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Lodging data of a hotel (`read_mask`).
     * @see https://docs.upload-post.com/api/google-business-lodging
     */
    getGoogleBusinessLodging(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Update lodging data.
     * @see https://docs.upload-post.com/api/google-business-lodging
     */
    updateGoogleBusinessLodging(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Lodging data as Google shows it.
     * @see https://docs.upload-post.com/api/google-business-lodging
     */
    getGoogleBusinessLodgingGoogleUpdated(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // Google Business: accounts and verification (reads)
    /**
     * Google Business accounts and location groups (`type`).
     * @see https://docs.upload-post.com/api/google-business-accounts
     */
    listGoogleBusinessAccounts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Read one account (`account`).
     * @see https://docs.upload-post.com/api/google-business-accounts
     */
    getGoogleBusinessAccount(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a location group or user group (`type`, `account_name`, `confirm`).
     * @see https://docs.upload-post.com/api/google-business-accounts
     */
    createGoogleBusinessAccount(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Admins of an account or a location (`scope`, `location_id`).
     * @see https://docs.upload-post.com/api/google-business-accounts
     */
    listGoogleBusinessAdmins(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Pending invitations of an account.
     * @see https://docs.upload-post.com/api/google-business-accounts
     */
    listGoogleBusinessInvitations(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Whether the location is verified and in good standing.
     * @see https://docs.upload-post.com/api/google-business-verification
     */
    getGoogleBusinessVerificationState(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Verification methods available for the location.
     * @see https://docs.upload-post.com/api/google-business-verification
     */
    getGoogleBusinessVerificationOptions(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Past verifications of the location.
     * @see https://docs.upload-post.com/api/google-business-verification
     */
    listGoogleBusinessVerifications(options: { user: string } & ApiParams): Promise<ApiResponse>;


    // YouTube: videos, thumbnail and quota
    /**
     * Full details of videos: status, processing, statistics, translations, paid placement... (`ids`, `chart` or `my_rating`; `parts`, `include_owner_details`).
     * @see https://docs.upload-post.com/api/youtube-videos
     */
    getYoutubeVideos(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Your account's daily allowance for the YouTube management endpoints and what is left.
     * @see https://docs.upload-post.com/api/youtube-videos
     */
    getYoutubeQuota(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Set a video's thumbnail: `thumbnail` (local file, stream or Buffer) or `thumbnail_url`.
     * @see https://docs.upload-post.com/api/youtube-thumbnail
     */
    setYoutubeThumbnail(options: { user: string; videoId: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: playlists
    /**
     * List the channel's playlists (or `ids`).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    listYoutubePlaylists(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a playlist (`title`, `description`, `privacy_status`, `default_language`, `localizations`...).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    createYoutubePlaylist(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit a playlist (only what you send changes).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    updateYoutubePlaylist(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a playlist (needs `confirm: true`; the videos stay).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    deleteYoutubePlaylist(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Videos of a playlist.
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    listYoutubePlaylistItems(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Add a video to a playlist (`video_id`, `position`, `note`).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    addYoutubePlaylistItem(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Reorder a playlist video or change its note.
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    updateYoutubePlaylistItem(options: { user: string; playlistId: string; itemId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Remove a video from a playlist (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    deleteYoutubePlaylistItem(options: { user: string; playlistId: string; itemId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * The playlist's custom image.
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    getYoutubePlaylistImage(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Add the playlist image: `image` (local file, stream or Buffer) or `image_url`.
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    setYoutubePlaylistImage(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replace the playlist image (same fields, needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    replaceYoutubePlaylistImage(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Remove the playlist image (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-playlists
     */
    deleteYoutubePlaylistImage(options: { user: string; playlistId: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: captions
    /**
     * Caption tracks of a video.
     * @see https://docs.upload-post.com/api/youtube-captions
     */
    listYoutubeCaptions(options: { user: string; videoId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Add a caption track: `file` (local file, stream or Buffer) or `file_url`, plus `language`, `name`, `is_draft`.
     * @see https://docs.upload-post.com/api/youtube-captions
     */
    uploadYoutubeCaption(options: { user: string; videoId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replace a track's file and/or publish a draft (`is_draft: false`).
     * @see https://docs.upload-post.com/api/youtube-captions
     */
    updateYoutubeCaption(options: { user: string; captionId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Download a track (`tfmt`: srt, vtt, sbv, scc, ttml; `tlang` to translate). Returns the file's text.
     * @see https://docs.upload-post.com/api/youtube-captions
     */
    downloadYoutubeCaption(options: { user: string; captionId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a track (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-captions
     */
    deleteYoutubeCaption(options: { user: string; captionId: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: comments inbox
    /**
     * Comment threads of a video (`video_id`), of the whole channel (`scope: "channel"`) or by `ids`; `moderation_status`, `order`, `search_terms`...
     * @see https://docs.upload-post.com/api/youtube-comments
     */
    listYoutubeComments(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Replies to a comment (`parent_id`) or comments by `ids`.
     * @see https://docs.upload-post.com/api/youtube-comments
     */
    listYoutubeCommentReplies(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Reply to a comment (`parent_id`) or comment on a video (`video_id`); `idempotency_key` optional.
     * @see https://docs.upload-post.com/api/youtube-comments
     */
    createYoutubeComment(options: { user: string; text: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit your own comment (`text`).
     * @see https://docs.upload-post.com/api/youtube-comments
     */
    updateYoutubeComment(options: { user: string; commentId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete your own comment (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-comments
     */
    deleteYoutubeComment(options: { user: string; commentId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Approve, hold or reject comments of your channel (`rejected` needs `confirm: true`; `ban_author`).
     * @see https://docs.upload-post.com/api/youtube-comments
     */
    moderateYoutubeComments(options: { user: string; commentIds: string; status: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: search and catalogs
    /**
     * Search videos, channels and playlists (`q`, `for_mine`, `channel_id`, `type`, `order`...).
     * @see https://docs.upload-post.com/api/youtube-search-catalogs
     */
    searchYoutube(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Video categories of a region (`region`, `hl`, `assignable_only`).
     * @see https://docs.upload-post.com/api/youtube-search-catalogs
     */
    getYoutubeCategories(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Languages YouTube supports (`hl`).
     * @see https://docs.upload-post.com/api/youtube-search-catalogs
     */
    getYoutubeLanguages(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Regions (countries) YouTube supports (`hl`).
     * @see https://docs.upload-post.com/api/youtube-search-catalogs
     */
    getYoutubeRegions(options?: ApiParams): Promise<ApiResponse>;

    /**
     * Reasons for an abuse report (`hl`).
     * @see https://docs.upload-post.com/api/youtube-search-catalogs
     */
    getYoutubeAbuseReasons(options?: ApiParams): Promise<ApiResponse>;

    // YouTube: subscriptions, ratings, reports and activity
    /**
     * Channels the connected channel subscribes to (or its subscribers).
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    listYoutubeSubscriptions(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Subscribe the connected channel to a channel (`channel_id`).
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    subscribeYoutubeChannel(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Unsubscribe.
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    unsubscribeYoutubeChannel(options: { user: string; subscriptionId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Like, dislike or remove the rating of a video (`rating`: like, dislike, none).
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    rateYoutubeVideo(options: { user: string; videoId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * The channel's rating of up to 50 videos.
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    getYoutubeRating(options: { user: string; ids: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Report a video (needs `confirm: true`; it cannot be withdrawn).
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    reportYoutubeVideoAbuse(options: { user: string; videoId: string; reasonId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Activity of the channel (uploads, likes, playlist additions...).
     * @see https://docs.upload-post.com/api/youtube-channel-actions
     */
    getYoutubeActivities(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: channel settings
    /**
     * Read the connected channel (settings, branding, translations, statistics).
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    getYoutubeChannel(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Change the channel settings or translations (only what you send changes).
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    updateYoutubeChannel(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Public data of any channel (`for_handle`, `channel_id`...).
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    lookupYoutubeChannel(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Upload and apply the banner: `image` (local file, stream or Buffer) or `image_url`.
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    setYoutubeChannelBanner(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Sections of the channel page.
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    listYoutubeChannelSections(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a section.
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    createYoutubeChannelSection(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit or move a section.
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    updateYoutubeChannelSection(options: { user: string; sectionId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a section (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    deleteYoutubeChannelSection(options: { user: string; sectionId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Set the watermark: `image` (local file, stream or Buffer) or `image_url`, `timing_type`, `offset_ms`, `duration_ms` (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    setYoutubeWatermark(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Remove the watermark (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-channel
     */
    removeYoutubeWatermark(options: { user: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: live broadcasts and streams
    /**
     * List live broadcasts (`status`, `ids`...).
     * @see https://docs.upload-post.com/api/youtube-live
     */
    listYoutubeBroadcasts(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a broadcast (`title`, `scheduled_start_time`, `privacy_status`...).
     * @see https://docs.upload-post.com/api/youtube-live
     */
    createYoutubeBroadcast(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * One broadcast.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    getYoutubeBroadcast(options: { user: string; broadcastId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit a broadcast.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    updateYoutubeBroadcast(options: { user: string; broadcastId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a broadcast (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-live
     */
    deleteYoutubeBroadcast(options: { user: string; broadcastId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Bind a stream to the broadcast (`stream_id`), or unbind it.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    bindYoutubeBroadcast(options: { user: string; broadcastId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Go `testing`, `live` or `complete` (`live` and `complete` need `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-live
     */
    transitionYoutubeBroadcast(options: { user: string; broadcastId: string; status: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Insert an ad break.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    insertYoutubeCuepoint(options: { user: string; broadcastId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * List streams.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    listYoutubeStreams(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Create a stream (its key is a secret).
     * @see https://docs.upload-post.com/api/youtube-live
     */
    createYoutubeStream(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * One stream.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    getYoutubeStream(options: { user: string; streamId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Edit a stream.
     * @see https://docs.upload-post.com/api/youtube-live
     */
    updateYoutubeStream(options: { user: string; streamId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a stream (needs `confirm: true`; encoders using its key stop).
     * @see https://docs.upload-post.com/api/youtube-live
     */
    deleteYoutubeStream(options: { user: string; streamId: string } & ApiParams): Promise<ApiResponse>;

    // YouTube: live chat, polls and moderation
    /**
     * Read the live chat (`broadcast_id` or `live_chat_id`, `page_token`).
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    getYoutubeLiveChat(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Post a message or a poll in the live chat (`idempotency_key` optional).
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    sendYoutubeLiveChatMessage(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Close a poll.
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    closeYoutubeLiveChatPoll(options: { user: string; messageId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Delete a chat message (needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    deleteYoutubeLiveChatMessage(options: { user: string; messageId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Moderators of the live chat.
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    listYoutubeLiveModerators(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Add a moderator (`channel_id`).
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    addYoutubeLiveModerator(options: { user: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Remove a moderator (the `id` from the list; needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    removeYoutubeLiveModerator(options: { user: string; moderatorId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Ban a user from the chat (`permanent` or `temporary` with `ban_duration_seconds`; needs `confirm: true`).
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    banYoutubeLiveChatUser(options: { user: string; channelId: string; type: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Lift a ban.
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    unbanYoutubeLiveChatUser(options: { user: string; banId: string } & ApiParams): Promise<ApiResponse>;

    /**
     * Super Chats and Super Stickers received.
     * @see https://docs.upload-post.com/api/youtube-live-chat
     */
    listYoutubeSuperChats(options: { user: string } & ApiParams): Promise<ApiResponse>;

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
     * Resolve a LinkedIn company Page (URL, vanity, id or URN) to its URN and
     * exact name, for a `@[Name](urn:li:organization:ID)` mention. People cannot
     * be resolved (`400 linkedin_person_not_resolvable`).
     */
    resolveLinkedinOrganization(options: { user: string; url: string }): Promise<LinkedinOrganizationResponse>;

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

    // ==================== Generated from the OpenAPI spec ====================
    // Written by codegen/generate.py from codegen/openapi.json: do not edit by hand.
    // <openapi:methods>
    // ---- Telegram ----

    /**
     * Send a gift from the bot's Stars.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_stars_spend_disabled` until the feature is available.
     *
     * sendGift. Spends the bot's Stars. Requires confirm=true and max_star_count (checked against the current price).
     *
     * `POST /api/uploadposts/telegram/gifts`
     */
    sendTelegramGift(options: SendTelegramGiftOptions): Promise<SendTelegramGiftResponse>;

    /**
     * Gift Telegram Premium from the bot's Stars.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_stars_spend_disabled` until the feature is available.
     *
     * Spends the bot's Stars.
     *
     * `POST /api/uploadposts/telegram/gifts/premium`
     */
    giftTelegramPremium(options: GiftTelegramPremiumOptions): Promise<GiftTelegramPremiumResponse>;

    /**
     * Automatic pre-checkout rules.
     *
     * **The automatic answers need the bot's updates turned on (POST /api/uploadposts/telegram/updates).**
     *
     * `GET /api/uploadposts/telegram/payments/settings`
     */
    getTelegramPaymentSettings(options: GetTelegramPaymentSettingsOptions): Promise<GetTelegramPaymentSettingsResponse>;

    /**
     * Set automatic pre-checkout rules.
     *
     * **The automatic answers need the bot's updates turned on (POST /api/uploadposts/telegram/updates).**
     *
     * `PUT /api/uploadposts/telegram/payments/settings`
     */
    updateTelegramPaymentSettings(options: UpdateTelegramPaymentSettingsOptions): Promise<UpdateTelegramPaymentSettingsResponse>;

    /**
     * Turn Telegram updates on or off.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_updates_unavailable` until the feature is available.
     *
     * Opt-in per bot. A webhook that is not Upload-Post's is never replaced without replace_existing_webhook=true (409 telegram_webhook_in_use otherwise). With no webhook, the answer warns that a getUpdates integration stops receiving.
     *
     * `POST /api/uploadposts/telegram/updates`
     */
    setTelegramUpdates(options: SetTelegramUpdatesOptions): Promise<ApiResponse>;

    /**
     * Answer a Telegram query.
     *
     * Answer a callback_query, inline_query, join request, guest/widget query, shipping or pre-checkout query received as a telegram_update event. 410 telegram_query_expired when Telegram's time is up.
     *
     * `POST /api/uploadposts/telegram/answer`
     */
    answerTelegramQuery(options: AnswerTelegramQueryOptions): Promise<ApiResponse>;

    /**
     * Telegram Business connections.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * Connections of the bot with Telegram Business accounts (rights, enabled).
     *
     * `GET /api/uploadposts/telegram/business-connections`
     */
    getTelegramBusinessConnections(options: GetTelegramBusinessConnectionsOptions): Promise<ApiResponse>;

    /**
     * Telegram Business account.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * The connected account.
     *
     * `GET /api/uploadposts/telegram/business-profile`
     */
    getTelegramBusinessProfile(options: GetTelegramBusinessProfileOptions): Promise<ApiResponse>;

    /**
     * Update the Telegram Business profile.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * first_name/last_name, username, bio, photo (multipart or media_url, is_public), remove_photo, gift_settings.
     *
     * `PATCH /api/uploadposts/telegram/business-profile`
     */
    updateTelegramBusinessProfile(options: UpdateTelegramBusinessProfileOptions): Promise<ApiResponse>;

    /**
     * Post a Telegram story.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * postStory on behalf of the Business account. Photos 1080x1920 up to 10 MB; videos 720x1280 H.265 up to 30 MB, 60 s.
     *
     * `POST /api/uploadposts/telegram/business-stories`
     */
    postTelegramStory(options: PostTelegramStoryOptions): Promise<ApiResponse>;

    /**
     * Edit a Telegram story.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * editStory.
     *
     * `PATCH /api/uploadposts/telegram/business-stories`
     */
    editTelegramStory(options: EditTelegramStoryOptions): Promise<ApiResponse>;

    /**
     * Delete a Telegram story.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * deleteStory.
     *
     * `DELETE /api/uploadposts/telegram/business-stories`
     */
    deleteTelegramStory(options: DeleteTelegramStoryOptions): Promise<ApiResponse>;

    /**
     * Repost a Telegram story.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * repostStory from another Business account of the same bot.
     *
     * `POST /api/uploadposts/telegram/business-stories/repost`
     */
    repostTelegramStory(options: RepostTelegramStoryOptions): Promise<ApiResponse>;

    /**
     * Telegram Business gifts.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * getBusinessAccountGifts with Telegram's filters.
     *
     * `GET /api/uploadposts/telegram/business-gifts`
     */
    getTelegramBusinessGifts(options: GetTelegramBusinessGiftsOptions): Promise<ApiResponse>;

    /**
     * Convert, upgrade, transfer or delete a gift.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * Irreversible: requires confirm=true and an idempotency_key (a repeat with the same key returns the first answer).
     *
     * `POST /api/uploadposts/telegram/business-gifts`
     */
    manageTelegramBusinessGift(options: ManageTelegramBusinessGiftOptions): Promise<ApiResponse>;

    /**
     * Telegram Business Stars balance.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * getBusinessAccountStarBalance.
     *
     * `GET /api/uploadposts/telegram/business-stars`
     */
    getTelegramBusinessStars(options: GetTelegramBusinessStarsOptions): Promise<ApiResponse>;

    /**
     * Move Stars to the bot.
     *
     * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
     *
     * transferBusinessAccountStars (1-10000). Requires confirm=true and an idempotency_key.
     *
     * `POST /api/uploadposts/telegram/business-stars/transfer`
     */
    transferTelegramBusinessStars(options: TransferTelegramBusinessStarsOptions): Promise<ApiResponse>;

    // ---- Content Upload ----

    /**
     * AI titles and captions for a short video.
     *
     * Watches the video and writes a title/description (YouTube) and captions (Instagram, TikTok, Facebook). Counts against the monthly AI Shorts quota (a failed analysis is not counted).
     *
     * `POST /api/uploadposts/analyze-shorts`
     */
    analyzeShorts(options: AnalyzeShortsOptions): Promise<AnalyzeShortsResponse>;

    /**
     * Translate or rewrite captions with AI.
     *
     * Rewrites texts with the same shape analyze-shorts returns into another language. Uses the AI Shorts quota.
     *
     * `POST /api/uploadposts/rewrite-captions`
     */
    rewriteCaptions(options: RewriteCaptionsOptions): Promise<RewriteCaptionsResponse>;

    /**
     * Get a signed URL to upload a file.
     *
     * For clients that cannot send large files in a multipart request (AI agents, the MCP server): create the upload, PUT the bytes to upload_url with the returned headers, call /complete, then pass media_url to the upload endpoints. Files expire after staging_ttl_hours. Per-file size, files in progress and monthly files/bytes depend on the plan.
     *
     * `POST /api/uploadposts/media-uploads`
     */
    createMediaUpload(options: CreateMediaUploadOptions): Promise<CreateMediaUploadResponse>;

    /**
     * Confirm a signed upload.
     *
     * Checks the uploaded object (size, type) and returns media_url.
     *
     * `POST /api/uploadposts/media-uploads/{upload_id}/complete`
     */
    completeMediaUpload(options: CompleteMediaUploadOptions): Promise<CompleteMediaUploadResponse>;

    /**
     * Get a signed upload.
     *
     * `GET /api/uploadposts/media-uploads/{upload_id}`
     */
    getMediaUpload(options: GetMediaUploadOptions): Promise<GetMediaUploadResponse>;

    /**
     * Delete a signed upload.
     *
     * `DELETE /api/uploadposts/media-uploads/{upload_id}`
     */
    deleteMediaUpload(options: DeleteMediaUploadOptions): Promise<DeleteMediaUploadResponse>;

    // ---- Upload Management ----

    /**
     * Get a scheduled post.
     *
     * The options a scheduled post was scheduled with (limited to what PATCH can change), signed media URLs and whether it can still be edited.
     *
     * `GET /api/uploadposts/schedule/{job_id}`
     */
    getScheduledPost(options: GetScheduledPostOptions): Promise<GetScheduledPostResponse>;

    /**
     * Get a scheduled post's thumbnail.
     *
     * Signed URL of a small JPEG of the post's video or first image. A post without one gets it built once and kept. Call it only for posts you display; the list already carries most thumbnails.
     *
     * `GET /api/uploadposts/schedule/{job_id}/thumbnail`
     */
    getScheduledPostThumbnail(options: GetScheduledPostThumbnailOptions): Promise<GetScheduledPostThumbnailResponse>;

    /**
     * Preview URLs of a scheduled post.
     *
     * Signed, short-lived URLs of the media, cover and thumbnail of one scheduled job (the listing only says has_preview).
     *
     * `GET /api/uploadposts/schedule/{job_id}/preview`
     */
    getScheduledPostPreview(options: GetScheduledPostPreviewOptions): Promise<GetScheduledPostPreviewResponse>;

    // ---- Platform Integration ----

    /**
     * Create a Pinterest board.
     *
     * Without a profile the first profile of the account with a Pinterest account is used.
     *
     * `POST /api/uploadposts/pinterest/boards`
     */
    createPinterestBoard(options: CreatePinterestBoardOptions): Promise<CreatePinterestBoardResponse>;

    /**
     * Run a YouTube Analytics channel report.
     *
     * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. reports.query for the profile's channel with any dimensions, metrics, filters and sort of YouTube's channel reports. Validated against the official report tables before it reaches YouTube (invalid combinations: 400 youtube_analytics_unsupported_query with hints, nothing spent). Revenue and ad metrics are not available. Answers are cached (12 h; 7 days for ranges that ended more than 5 days ago). Each uncached call counts 1 request of the account's daily Analytics allowance. Data has a 48-72 h delay.
     *
     * `GET /api/uploadposts/youtube/analytics/query`
     */
    queryYoutubeAnalytics(options: QueryYoutubeAnalyticsOptions): Promise<QueryYoutubeAnalyticsResponse>;

    /**
     * YouTube Analytics report catalog.
     *
     * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. The 47 YouTube channel reports with their dimensions, metrics, filters, sort options and row limits. Does not call YouTube.
     *
     * `GET /api/uploadposts/youtube/analytics/reports`
     */
    listYoutubeAnalyticsReports(options: ListYoutubeAnalyticsReportsOptions): Promise<ApiResponse>;

    /**
     * List YouTube Analytics groups.
     *
     * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. groups.list of the channel (mine=true, or ids). Cached 30 minutes; 1 request of the Analytics allowance per uncached call.
     *
     * `GET /api/uploadposts/youtube/analytics/groups`
     */
    listYoutubeAnalyticsGroups(options: ListYoutubeAnalyticsGroupsOptions): Promise<ApiResponse>;

    /**
     * List the items of a YouTube Analytics group.
     *
     * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. groupItems.list. Cached 30 minutes.
     *
     * `GET /api/uploadposts/youtube/analytics/groups/{group_id}/items`
     */
    listYoutubeAnalyticsGroupItems(options: ListYoutubeAnalyticsGroupItemsOptions): Promise<ApiResponse>;

    /**
     * Daily allowance of YouTube Analytics and bulk reports.
     *
     * **Not generally available yet.** Off by default: answers `503` with `youtube_feature_disabled` until the feature is available.
     *
     * The caller's own usage today of the Analytics and bulk reports allowances. While Analytics and bulk reports are not generally available yet, each service shows enabled: false.
     *
     * `GET /api/uploadposts/youtube/analytics/usage`
     */
    getYoutubeAnalyticsUsage(options?: GetYoutubeAnalyticsUsageOptions): Promise<ApiResponse>;

    /**
     * List YouTube bulk report types.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. reportTypes.list for the channel (one page, cached 24 h). can_create_job marks the channel/playlist types that can be scheduled.
     *
     * `GET /api/uploadposts/youtube/reporting/report-types`
     */
    listYoutubeReportTypes(options: ListYoutubeReportTypesOptions): Promise<ApiResponse>;

    /**
     * List YouTube reporting jobs.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.list of the channel (one page). used_by_upload_post marks the job behind Upload-Post's thumbnail impressions.
     *
     * `GET /api/uploadposts/youtube/reporting/jobs`
     */
    listYoutubeReportingJobs(options: ListYoutubeReportingJobsOptions): Promise<ApiResponse>;

    /**
     * Create a YouTube reporting job.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.create: YouTube then generates one CSV per day (first ones within ~48 h, covering the previous 30 days). One job per report type and up to 20 per channel.
     *
     * `POST /api/uploadposts/youtube/reporting/jobs`
     */
    createYoutubeReportingJob(options: CreateYoutubeReportingJobOptions): Promise<ApiResponse>;

    /**
     * Get a YouTube reporting job.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.get.
     *
     * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}`
     */
    getYoutubeReportingJob(options: GetYoutubeReportingJobOptions): Promise<ApiResponse>;

    /**
     * Delete a YouTube reporting job.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.delete: stops the daily reports. Requires confirm: true. A channel_reach_basic_a1 job (used by Upload-Post for thumbnail impressions) cannot be deleted (409 youtube_reporting_job_in_use). 502 youtube_write_outcome_unknown: list the jobs to check.
     *
     * `DELETE /api/uploadposts/youtube/reporting/jobs/{job_id}`
     */
    deleteYoutubeReportingJob(options: DeleteYoutubeReportingJobOptions): Promise<ApiResponse>;

    /**
     * List the reports of a YouTube reporting job.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.reports.list (one page). Each item has download_path.
     *
     * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports`
     */
    listYoutubeReports(options: ListYoutubeReportsOptions): Promise<ApiResponse>;

    /**
     * Get a YouTube report.
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.reports.get (metadata).
     *
     * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}`
     */
    getYoutubeReport(options: GetYoutubeReportOptions): Promise<ApiResponse>;

    /**
     * Download a YouTube report (CSV).
     *
     * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. The report's CSV file, streamed. Up to 100 MB; up to 2 downloads at a time per account. Counts 2 requests of the bulk reports allowance.
     *
     * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}/download`
     */
    downloadYoutubeReport(options: DownloadYoutubeReportOptions): Promise<string>;

    /**
     * YouTube new video notifications status.
     *
     * **Not generally available yet.** Answers 503 youtube_feature_disabled until it is enabled. State of the push subscription of the profile's channel (null when off). No YouTube quota.
     *
     * `GET /api/uploadposts/youtube/push`
     */
    getYoutubePush(options: GetYoutubePushOptions): Promise<GetYoutubePushResponse>;

    /**
     * Turn on YouTube new video notifications.
     *
     * **Not generally available yet.** Answers 503 youtube_feature_disabled until it is enabled. Requires a webhook listing youtube_video_published and/or youtube_video_updated. No YouTube quota.
     *
     * `POST /api/uploadposts/youtube/push`
     */
    enableYoutubePush(options: EnableYoutubePushOptions): Promise<EnableYoutubePushResponse>;

    /**
     * Turn off YouTube new video notifications.
     *
     * **Not generally available yet.** Answers 503 youtube_feature_disabled until it is enabled. No YouTube quota.
     *
     * `DELETE /api/uploadposts/youtube/push`
     */
    disableYoutubePush(options: DisableYoutubePushOptions): Promise<DisableYoutubePushResponse>;

    /**
     * Instagram publishing quota.
     *
     * Instagram content publishing usage of the connected account (Instagram allows a limited number of posts per 24 h). Cached; refresh=true skips the cache.
     *
     * `GET /api/uploadposts/instagram/publishing_limit`
     */
    getInstagramPublishingLimit(options: GetInstagramPublishingLimitOptions): Promise<GetInstagramPublishingLimitResponse>;

    /**
     * Threads publishing quota.
     *
     * Send user or profile (one is required: 400 without both).
     *
     * `GET /api/uploadposts/threads/publishing_limit`
     */
    getThreadsPublishingLimit(options?: GetThreadsPublishingLimitOptions): Promise<GetThreadsPublishingLimitResponse>;

    /**
     * List the sections of a Pinterest board.
     *
     * `GET /api/uploadposts/pinterest/boards/{board_id}/sections`
     */
    listPinterestBoardSections(options: ListPinterestBoardSectionsOptions): Promise<ListPinterestBoardSectionsResponse>;

    /**
     * Create a section in a Pinterest board.
     *
     * Without a profile the first profile of the account with a Pinterest account is used.
     *
     * `POST /api/uploadposts/pinterest/boards/{board_id}/sections`
     */
    createPinterestBoardSection(options: CreatePinterestBoardSectionOptions): Promise<CreatePinterestBoardSectionResponse>;

    /**
     * Read a Facebook Page's public info.
     *
     * `GET /api/uploadposts/facebook/page-info`
     */
    getFacebookPageInfo(options: GetFacebookPageInfoOptions): Promise<GetFacebookPageInfoResponse>;

    /**
     * Update a Facebook Page's public info.
     *
     * Only the fields sent change. validate_only: true checks without writing. Needs Meta's pages_manage_metadata permission (pending App Review: 403 facebook_permission_missing until then). POST is accepted as an alias.
     *
     * `PATCH /api/uploadposts/facebook/page-info`
     */
    updateFacebookPageInfo(options: UpdateFacebookPageInfoOptions): Promise<UpdateFacebookPageInfoResponse>;

    /**
     * Subreddits the Reddit account belongs to.
     *
     * `GET /api/uploadposts/reddit/subreddits`
     */
    listRedditSubreddits(options: ListRedditSubredditsOptions): Promise<ListRedditSubredditsResponse>;

    /**
     * Post types a subreddit allows.
     *
     * `GET /api/uploadposts/reddit/post-types`
     */
    getRedditPostTypes(options: GetRedditPostTypesOptions): Promise<GetRedditPostTypesResponse>;

    /**
     * Post flairs of a subreddit.
     *
     * Pass the id as reddit_flair_id when publishing; editable flairs take reddit_flair_text.
     *
     * `GET /api/uploadposts/reddit/flairs`
     */
    listRedditFlairs(options: ListRedditFlairsOptions): Promise<ListRedditFlairsResponse>;

    // ---- User Management ----

    /**
     * Get a specific user profile.
     *
     * Retrieve information for a single user profile by username.
     *
     * `GET /api/uploadposts/users/{username}`
     */
    getUserProfile(options: GetUserProfileOptions): Promise<GetUserProfileResponse>;

    /**
     * Rename a user profile.
     *
     * Set the profile's display_name, the label shown in the dashboard. The username does not change: it stays the `user` value of every API call, so history, scheduled posts, analytics and existing integrations keep working. An empty string or null removes the display name. display_name is the only editable field; any other field returns 400 FIELD_NOT_EDITABLE.
     *
     * `PATCH /api/uploadposts/users/{username}`
     */
    renameUserProfile(options: RenameUserProfileOptions): Promise<RenameUserProfileResponse>;

    /**
     * Disconnect a social account from a profile.
     *
     * Unlink one social platform from a user profile. Other platforms connected to the same profile are not touched. The stored credentials are deleted only if no other profile of your account still uses that social account. Fires the `social_account_disconnected` webhook with `reason: "manual_disconnect"`. Disconnecting a platform that is already disconnected returns 200.
     *
     * `DELETE /api/uploadposts/users/social`
     */
    disconnectSocialAccount(options: DisconnectSocialAccountOptions): Promise<DisconnectSocialAccountResponse>;

    /**
     * Connect Discord with credentials.
     *
     * Discord channel incoming webhook (no OAuth). No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/discord/credentials`
     */
    connectDiscordCredentials(options: ConnectDiscordCredentialsOptions): Promise<ConnectDiscordCredentialsResponse>;

    /**
     * Connect Telegram with credentials.
     *
     * Telegram bot token + target chat. Upload-Post validates both (getMe, getChat) and stores the token encrypted. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/telegram/credentials`
     */
    connectTelegramCredentials(options: ConnectTelegramCredentialsOptions): Promise<ConnectTelegramCredentialsResponse>;

    /**
     * Connect Slack with credentials.
     *
     * Slack channel Incoming Webhook URL (text only). No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/slack/credentials`
     */
    connectSlackCredentials(options: ConnectSlackCredentialsOptions): Promise<ConnectSlackCredentialsResponse>;

    /**
     * Connect Mastodon with credentials.
     *
     * Mastodon instance access token. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/mastodon/credentials`
     */
    connectMastodonCredentials(options: ConnectMastodonCredentialsOptions): Promise<ConnectMastodonCredentialsResponse>;

    /**
     * Connect Nostr with credentials.
     *
     * Nostr private key (nsec or hex) and optional relays. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/nostr/credentials`
     */
    connectNostrCredentials(options: ConnectNostrCredentialsOptions): Promise<ConnectNostrCredentialsResponse>;

    /**
     * Connect Lemmy with credentials.
     *
     * Lemmy instance, login and target community. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/lemmy/credentials`
     */
    connectLemmyCredentials(options: ConnectLemmyCredentialsOptions): Promise<ConnectLemmyCredentialsResponse>;

    /**
     * Connect Dev.to with credentials.
     *
     * Dev.to API key. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/devto/credentials`
     */
    connectDevtoCredentials(options: ConnectDevtoCredentialsOptions): Promise<ConnectDevtoCredentialsResponse>;

    /**
     * Connect Hashnode with credentials.
     *
     * Hashnode Personal Access Token and publication id. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/hashnode/credentials`
     */
    connectHashnodeCredentials(options: ConnectHashnodeCredentialsOptions): Promise<ConnectHashnodeCredentialsResponse>;

    /**
     * Connect WordPress with credentials.
     *
     * Self-hosted WordPress site, username and Application Password. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/wordpress/credentials`
     */
    connectWordpressCredentials(options: ConnectWordpressCredentialsOptions): Promise<ConnectWordpressCredentialsResponse>;

    /**
     * Connect Whop with credentials.
     *
     * Whop API key (forum:post:create) and experience id. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/whop/credentials`
     */
    connectWhopCredentials(options: ConnectWhopCredentialsOptions): Promise<ConnectWhopCredentialsResponse>;

    /**
     * Connect Listmonk with credentials.
     *
     * Listmonk instance, login and list id (each post sends a campaign). No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
     *
     * `POST /api/uploadposts/users/listmonk/credentials`
     */
    connectListmonkCredentials(options: ConnectListmonkCredentialsOptions): Promise<ConnectListmonkCredentialsResponse>;

    /**
     * List the Facebook Pages a profile can publish to.
     *
     * Every Facebook Page of the profile's connected account and the one selected for publishing.
     *
     * `GET /api/uploadposts/users/facebook-page`
     */
    listFacebookPageChoices(options: ListFacebookPageChoicesOptions): Promise<ListFacebookPageChoicesResponse>;

    /**
     * Select the Facebook Page used when publishing.
     *
     * `POST /api/uploadposts/users/facebook-page`
     */
    setFacebookPage(options: SetFacebookPageOptions): Promise<SetFacebookPageResponse>;

    /**
     * Clear the selected Facebook Page.
     *
     * Back to the default (the first one of the account).
     *
     * `DELETE /api/uploadposts/users/facebook-page`
     */
    clearFacebookPage(options: ClearFacebookPageOptions): Promise<ClearFacebookPageResponse>;

    /**
     * List the LinkedIn Pages a profile can publish to.
     *
     * Every LinkedIn Page of the profile's connected account and the one selected for publishing.
     *
     * `GET /api/uploadposts/users/linkedin-page`
     */
    listLinkedinPageChoices(options: ListLinkedinPageChoicesOptions): Promise<ListLinkedinPageChoicesResponse>;

    /**
     * Select the LinkedIn Page used when publishing.
     *
     * `POST /api/uploadposts/users/linkedin-page`
     */
    setLinkedinPage(options: SetLinkedinPageOptions): Promise<SetLinkedinPageResponse>;

    /**
     * Clear the selected LinkedIn Page.
     *
     * Back to the default (the first one of the account).
     *
     * `DELETE /api/uploadposts/users/linkedin-page`
     */
    clearLinkedinPage(options: ClearLinkedinPageOptions): Promise<ClearLinkedinPageResponse>;

    /**
     * Connect Bluesky with an app password.
     *
     * Logs in to Bluesky with the handle and an app password, stores the password encrypted and links the account to the profile. Also accepted with the profile JWT of the connect page.
     *
     * `POST /api/uploadposts/users/bluesky/credentials`
     */
    connectBlueskyCredentials(options: ConnectBlueskyCredentialsOptions): Promise<ConnectBlueskyCredentialsResponse>;

    /**
     * Use your own Google OAuth client for a profile's YouTube.
     *
     * Stores (encrypted) the client_id and client_secret of your own Google Cloud OAuth client; that profile then authorizes YouTube against it (its own API quota).
     *
     * `POST /api/uploadposts/users/youtube/credentials`
     */
    setYoutubeOauthClient(options: SetYoutubeOauthClientOptions): Promise<SetYoutubeOauthClientResponse>;

    // ---- Authentication ----

    /**
     * Get current user.
     *
     * Verify the validity of your API key and retrieve basic account information including email and subscription plan.
     *
     * `GET /api/uploadposts/me`
     */
    getCurrentUser(options?: GetCurrentUserOptions): Promise<GetCurrentUserResponse>;

    /**
     * Connect API: start connecting a social account.
     *
     * Build your own connect page: returns the platform's authorize_url for a profile. Send the user there; Upload-Post finishes the OAuth and sends them back to redirect_url. Authenticate with the API key (then `profile` is required) or with the profile JWT of POST /uploadposts/users/generate-jwt (profile taken from the token). The state is single-use: a retry needs a new start.
     *
     * `POST /api/uploadposts/oauth/{platform}/start`
     */
    startOauthConnection(options: StartOauthConnectionOptions): Promise<StartOauthConnectionResponse>;

    // ---- FFmpeg Editor ----

    /**
     * Create FFmpeg job.
     *
     * Submit a media processing job using an FFmpeg command template. Supports single or multiple input files via multipart upload or JSON with URLs. Jobs are asynchronous — poll the status endpoint until finished.
     *
     * `POST /api/uploadposts/ffmpeg/jobs/upload`
     */
    createFfmpegJob(options: CreateFfmpegJobOptions): Promise<ApiResponse>;

    /**
     * Get FFmpeg job status.
     *
     * Poll the status of an FFmpeg processing job. Statuses: PENDING, PROCESSING, FINISHED, ERROR.
     *
     * `GET /api/uploadposts/ffmpeg/jobs/{job_id}`
     */
    getFfmpegJobStatus(options: GetFfmpegJobStatusOptions): Promise<GetFfmpegJobStatusResponse>;

    /**
     * Download FFmpeg result.
     *
     * Download the processed file when job status is FINISHED. Returns binary media with appropriate Content-Type and Content-Disposition headers.
     *
     * `GET /api/uploadposts/ffmpeg/jobs/{job_id}/download`
     */
    downloadFfmpegResult(options: DownloadFfmpegResultOptions): Promise<Buffer>;

    /**
     * Get FFmpeg consumption.
     *
     * Check your current FFmpeg usage, remaining quota, and processing history for the current month.
     *
     * `GET /api/uploadposts/ffmpeg/consumption`
     */
    getFfmpegConsumption(options?: GetFfmpegConsumptionOptions): Promise<GetFfmpegConsumptionResponse>;

    // ---- Webhooks ----

    /**
     * List webhook subscriptions.
     *
     * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
     *
     * Newest first, active and disabled. An n8n trigger checks whether its subscription exists with `?url=<its url>&status=active`.
     *
     * `GET /api/uploadposts/webhooks/subscriptions`
     */
    listWebhookSubscriptions(options?: ListWebhookSubscriptionsOptions): Promise<ListWebhookSubscriptionsResponse>;

    /**
     * Create a webhook subscription.
     *
     * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
     *
     * Adds a destination that receives the listed events, besides the account webhook. Idempotent: the same url + events + profile_username returns the existing subscription (200, `created: false`) and reactivates it if it was disabled (`reactivated: true`); `name` and `source` are updated when sent. At most 10 active subscriptions per account. Team members (X-Act-As-User) cannot create them.
     *
     * `POST /api/uploadposts/webhooks/subscriptions`
     */
    createWebhookSubscription(options: CreateWebhookSubscriptionOptions): Promise<CreateWebhookSubscriptionResponse>;

    /**
     * Get a webhook subscription.
     *
     * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
     *
     * `GET /api/uploadposts/webhooks/subscriptions/{subscription_id}`
     */
    getWebhookSubscription(options: GetWebhookSubscriptionOptions): Promise<GetWebhookSubscriptionResponse>;

    /**
     * Delete a webhook subscription.
     *
     * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
     *
     * Stops sending to it right away. A second DELETE answers 404 (an integration can treat 404 as already deleted).
     *
     * `DELETE /api/uploadposts/webhooks/subscriptions/{subscription_id}`
     */
    deleteWebhookSubscription(options: DeleteWebhookSubscriptionOptions): Promise<DeleteWebhookSubscriptionResponse>;

    /**
     * Send a test event to a subscription.
     *
     * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
     *
     * Sends one signed sample now, with the keys of the real event and `test: true`. Logged as a test delivery: never retried and never counted towards disabling the subscription. `ok` tells whether the destination answered 2xx. For the post approval events the sample has the shape of the real event ({event, user_email, profile_username, approval: {...}, created_at}).
     *
     * `POST /api/uploadposts/webhooks/subscriptions/{subscription_id}/test`
     */
    testWebhookSubscription(options: TestWebhookSubscriptionOptions): Promise<TestWebhookSubscriptionResponse>;

    // ---- Instagram Interactions ----

    /**
     * Delete a comment (POST alias).
     *
     * POST alias of DELETE /uploadposts/comments/delete, for clients that cannot send a body with DELETE. Same body and behavior.
     *
     * `POST /api/uploadposts/comments/delete`
     */
    deleteCommentPost(options: DeleteCommentPostOptions): Promise<ApiResponse>;

    /**
     * Delete the Bluesky chat account.
     *
     * **Not generally available yet.** Answers `403` `bluesky_chat_delete_disabled`.
     *
     * Deletes every conversation and message of the account's Bluesky chat account (not the Bluesky account). Needs confirm: true and confirm_handle; not enabled yet (403 bluesky_chat_delete_disabled). Account owner only; every attempt is recorded.
     *
     * `POST /api/uploadposts/dms/bluesky/account/delete`
     */
    deleteBlueskyChatAccount(options: DeleteBlueskyChatAccountOptions): Promise<ApiResponse>;

    /**
     * Bluesky groups shared with someone.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `GET /api/uploadposts/dms/bluesky/groups`
     */
    listBlueskyMutualGroups(options: ListBlueskyMutualGroupsOptions): Promise<ApiResponse>;

    /**
     * Create a Bluesky group chat.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Members get a request to accept. Every invited member counts as one DM (all or nothing); at most 10 members by handle per request. Idempotent for 10 minutes per idempotency_key (or name + members). Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `POST /api/uploadposts/dms/bluesky/groups`
     */
    createBlueskyGroup(options: CreateBlueskyGroupOptions): Promise<ApiResponse>;

    /**
     * Rename, lock or unlock a Bluesky group.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Owner only. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `PATCH /api/uploadposts/dms/bluesky/groups/{conversation_id}`
     */
    editBlueskyGroup(options: EditBlueskyGroupOptions): Promise<ApiResponse>;

    /**
     * Bluesky group members.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `GET /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`
     */
    listBlueskyGroupMembers(options: ListBlueskyGroupMembersOptions): Promise<ApiResponse>;

    /**
     * Add members to a Bluesky group.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Owner only. One DM of quota per added member. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`
     */
    addBlueskyGroupMembers(options: AddBlueskyGroupMembersOptions): Promise<ApiResponse>;

    /**
     * Remove members from a Bluesky group.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Owner only. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `DELETE /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`
     */
    removeBlueskyGroupMembers(options: RemoveBlueskyGroupMembersOptions): Promise<ApiResponse>;

    /**
     * Manage a Bluesky group join link.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * action: create, edit, enable or disable. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-link`
     */
    manageBlueskyJoinLink(options: ManageBlueskyJoinLinkOptions): Promise<ApiResponse>;

    /**
     * Pending requests to join a Bluesky group.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Owner only. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `GET /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests`
     */
    listBlueskyJoinRequests(options: ListBlueskyJoinRequestsOptions): Promise<ApiResponse>;

    /**
     * Answer or withdraw a Bluesky join request.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * action: approve / reject (with member), mark_read, or withdraw (your own request). Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests`
     */
    answerBlueskyJoinRequest(options: AnswerBlueskyJoinRequestOptions): Promise<ApiResponse>;

    /**
     * Preview Bluesky join links.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * Up to 50 codes; status active, disabled or invalid. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `GET /api/uploadposts/dms/bluesky/join-links`
     */
    previewBlueskyJoinLinks(options: PreviewBlueskyJoinLinksOptions): Promise<ApiResponse>;

    /**
     * Ask to join a Bluesky group.
     *
     * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
     *
     * status is joined or pending. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
     *
     * `POST /api/uploadposts/dms/bluesky/join-links`
     */
    joinBlueskyGroup(options: JoinBlueskyGroupOptions): Promise<ApiResponse>;

    /**
     * Download a DM attachment.
     *
     * Returns the file of an attachment received in a DM (the media_id in dm_received). Telegram: bots download up to 20 MB.
     *
     * `GET /api/uploadposts/dms/media`
     */
    downloadDmMedia(options: DownloadDmMediaOptions): Promise<Buffer>;

    // ---- Bluesky ----

    /**
     * Follow, block or mute (one target per call).
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * follow/unfollow (daily limit), block/unblock, mute/unmute (only_reposts, only_quoteposts), mute_list/unmute_list, block_list/unblock_list (moderation lists), mute_thread/unmute_thread.
     *
     * `POST /api/uploadposts/bluesky/graph`
     */
    blueskyGraphAction(options: BlueskyGraphActionOptions): Promise<BlueskyGraphActionResponse>;

    /**
     * The account's lists.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * getLists for the account.
     *
     * `GET /api/uploadposts/bluesky/lists`
     */
    listBlueskyLists(options: ListBlueskyListsOptions): Promise<ListBlueskyListsResponse>;

    /**
     * Create a list.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Curated, moderation or reference list.
     *
     * `POST /api/uploadposts/bluesky/lists`
     */
    createBlueskyList(options: CreateBlueskyListOptions): Promise<CreateBlueskyListResponse>;

    /**
     * A list and its members.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * getList.
     *
     * `GET /api/uploadposts/bluesky/lists/{list_id}`
     */
    getBlueskyList(options: GetBlueskyListOptions): Promise<GetBlueskyListResponse>;

    /**
     * Update a list.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Merges the fields sent.
     *
     * `PATCH /api/uploadposts/bluesky/lists/{list_id}`
     */
    updateBlueskyList(options: UpdateBlueskyListOptions): Promise<UpdateBlueskyListResponse>;

    /**
     * Delete a list and its members.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Needs confirm=true.
     *
     * `DELETE /api/uploadposts/bluesky/lists/{list_id}`
     */
    deleteBlueskyList(options: DeleteBlueskyListOptions): Promise<DeleteBlueskyListResponse>;

    /**
     * List members.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * getList items.
     *
     * `GET /api/uploadposts/bluesky/lists/{list_id}/members`
     */
    listBlueskyListMembers(options: ListBlueskyListMembersOptions): Promise<ListBlueskyListMembersResponse>;

    /**
     * Add a member.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * One account per call.
     *
     * `POST /api/uploadposts/bluesky/lists/{list_id}/members`
     */
    addBlueskyListMember(options: AddBlueskyListMemberOptions): Promise<AddBlueskyListMemberResponse>;

    /**
     * Remove a member.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * One account per call.
     *
     * `DELETE /api/uploadposts/bluesky/lists/{list_id}/members`
     */
    removeBlueskyListMember(options: RemoveBlueskyListMemberOptions): Promise<RemoveBlueskyListMemberResponse>;

    /**
     * Ask not to appear in a reference list.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * referencelistoptout.
     *
     * `POST /api/uploadposts/bluesky/lists/opt-out`
     */
    optOutBlueskyList(options: OptOutBlueskyListOptions): Promise<OptOutBlueskyListResponse>;

    /**
     * Withdraw the opt-out.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * `DELETE /api/uploadposts/bluesky/lists/opt-out`
     */
    removeOptOutBlueskyList(options: RemoveOptOutBlueskyListOptions): Promise<RemoveOptOutBlueskyListResponse>;

    /**
     * The account's starter packs.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * `GET /api/uploadposts/bluesky/starter-packs`
     */
    listBlueskyStarterPacks(options: ListBlueskyStarterPacksOptions): Promise<ListBlueskyStarterPacksResponse>;

    /**
     * Create a starter pack.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * `POST /api/uploadposts/bluesky/starter-packs`
     */
    createBlueskyStarterPack(options: CreateBlueskyStarterPackOptions): Promise<CreateBlueskyStarterPackResponse>;

    /**
     * A starter pack.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * `GET /api/uploadposts/bluesky/starter-packs/{pack_id}`
     */
    getBlueskyStarterPack(options: GetBlueskyStarterPackOptions): Promise<GetBlueskyStarterPackResponse>;

    /**
     * Update a starter pack.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * name, description, feeds.
     *
     * `PATCH /api/uploadposts/bluesky/starter-packs/{pack_id}`
     */
    updateBlueskyStarterPack(options: UpdateBlueskyStarterPackOptions): Promise<UpdateBlueskyStarterPackResponse>;

    /**
     * Delete a starter pack.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Needs confirm=true; delete_list=true also deletes its list.
     *
     * `DELETE /api/uploadposts/bluesky/starter-packs/{pack_id}`
     */
    deleteBlueskyStarterPack(options: DeleteBlueskyStarterPackOptions): Promise<DeleteBlueskyStarterPackResponse>;

    /**
     * Feeds declared by the account.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * `GET /api/uploadposts/bluesky/feeds`
     */
    listBlueskyFeeds(options: ListBlueskyFeedsOptions): Promise<ListBlueskyFeedsResponse>;

    /**
     * Declare a custom feed.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Points to a feed generator service run by someone else.
     *
     * `POST /api/uploadposts/bluesky/feeds`
     */
    createBlueskyFeed(options: CreateBlueskyFeedOptions): Promise<CreateBlueskyFeedResponse>;

    /**
     * Update a feed declaration.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * `PATCH /api/uploadposts/bluesky/feeds/{rkey}`
     */
    updateBlueskyFeed(options: UpdateBlueskyFeedOptions): Promise<UpdateBlueskyFeedResponse>;

    /**
     * Delete a feed declaration.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Needs confirm=true.
     *
     * `DELETE /api/uploadposts/bluesky/feeds/{rkey}`
     */
    deleteBlueskyFeed(options: DeleteBlueskyFeedOptions): Promise<DeleteBlueskyFeedResponse>;

    /**
     * Report a post or account to Bluesky moderation.
     *
     * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
     *
     * Needs confirm=true. Up to 20 reports per account per UTC day.
     *
     * `POST /api/uploadposts/bluesky/report`
     */
    reportOnBluesky(options: ReportOnBlueskyOptions): Promise<ReportOnBlueskyResponse>;

    // ---- Teams and Approvals ----

    /**
     * List posts awaiting approval.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * Open items by default (pending_approval and draft). Editors and Contributors only see their own; members limited to some profiles only see those. Page with `before` = the previous `next_before`.
     *
     * `GET /api/uploadposts/approvals`
     */
    listPostApprovals(options?: ListPostApprovalsOptions): Promise<ListPostApprovalsResponse>;

    /**
     * Get a post awaiting approval.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * The author or a reviewer (owner or Admin). Adds fields, preview_url, thumbnail_url and destinations_effective.
     *
     * `GET /api/uploadposts/approvals/{approval_id}`
     */
    getPostApproval(options: GetPostApprovalOptions): Promise<GetPostApprovalResponse>;

    /**
     * Edit a post awaiting approval.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * The author or a reviewer, while it is open. Same body and validations as `PATCH /uploadposts/schedule/{job_id}`. Every edit raises `version` by one.
     *
     * `PATCH /api/uploadposts/approvals/{approval_id}`
     */
    editPostApproval(options: EditPostApprovalOptions): Promise<EditPostApprovalResponse>;

    /**
     * Withdraw or discard a post awaiting approval.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * The author withdraws it or a reviewer discards it: status withdrawn; its media is deleted.
     *
     * `DELETE /api/uploadposts/approvals/{approval_id}`
     */
    withdrawPostApproval(options: WithdrawPostApprovalOptions): Promise<WithdrawPostApprovalResponse>;

    /**
     * Approve a post.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * Reviewer only (owner or Admin). `version` is required: the `item.version` you reviewed. Date used: the one in the body; else now (immediate posts or `publish_now`); else the next free queue slot (posts sent with add_to_queue); else the post's own date if it is more than 60 s away. Monthly credits are reserved now; if creating the job fails the item reopens and the credits come back (500 approval_failed).
     *
     * `POST /api/uploadposts/approvals/{approval_id}/approve`
     */
    approvePostApproval(options: ApprovePostApprovalOptions): Promise<ApprovePostApprovalResponse>;

    /**
     * Reject a post.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * Reviewer only. `comment` is required (max 2000 characters) and is shown to the author.
     *
     * `POST /api/uploadposts/approvals/{approval_id}/reject`
     */
    rejectPostApproval(options: RejectPostApprovalOptions): Promise<RejectPostApprovalResponse>;

    /**
     * End client: list posts to approve.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * Called with the **profile JWT** of the white-label connect page (`Authorization: Bearer <access_url token>`), generated with `client_approval: true` (`POST /uploadposts/users/generate-jwt`). Only the `pending_approval` posts of that profile; the end client cannot change the date. The account owner turns it off by generating the JWT again with `client_approval: false`. Items come without author or internal ids.
     *
     * `GET /api/uploadposts/approvals/client`
     * Authenticated with the profile JWT (`token`), not the API key.
     */
    listClientPostApprovals(options: ListClientPostApprovalsOptions): Promise<ListClientPostApprovalsResponse>;

    /**
     * End client: approve a post.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * Called with the **profile JWT** of the white-label connect page (`Authorization: Bearer <access_url token>`), generated with `client_approval: true` (`POST /uploadposts/users/generate-jwt`). Only the `pending_approval` posts of that profile; the end client cannot change the date. The account owner turns it off by generating the JWT again with `client_approval: false`. `version` is required, as for reviewers. Recorded as decided_by `client:<profile>`, decided_by_role `client`.
     *
     * `POST /api/uploadposts/approvals/client/{approval_id}/approve`
     * Authenticated with the profile JWT (`token`), not the API key.
     */
    approveClientPostApproval(options: ApproveClientPostApprovalOptions): Promise<ApproveClientPostApprovalResponse>;

    /**
     * End client: reject a post.
     *
     * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
     *
     * Called with the **profile JWT** of the white-label connect page (`Authorization: Bearer <access_url token>`), generated with `client_approval: true` (`POST /uploadposts/users/generate-jwt`). Only the `pending_approval` posts of that profile; the end client cannot change the date. The account owner turns it off by generating the JWT again with `client_approval: false`. `comment` is required.
     *
     * `POST /api/uploadposts/approvals/client/{approval_id}/reject`
     * Authenticated with the profile JWT (`token`), not the API key.
     */
    rejectClientPostApproval(options: RejectClientPostApprovalOptions): Promise<RejectClientPostApprovalResponse>;

    /**
     * Team roles and your role.
     *
     * The role matrix and the caller's role. `enabled: false` while team roles are not available: then every member is treated as Admin with every profile. Roles and profile lists are changed by the account owner from the dashboard.
     *
     * `GET /api/uploadposts/teams/roles`
     */
    getTeamRoles(options?: GetTeamRolesOptions): Promise<GetTeamRolesResponse>;

    /**
     * Team activity log.
     *
     * What team members did on the account (posts created, published, edited or cancelled, approvals and decisions, access changes), newest first. Owner and Admin members only. Rows are kept `retention_days` days.
     *
     * `GET /api/uploadposts/teams/audit`
     */
    listTeamAudit(options?: ListTeamAuditOptions): Promise<ListTeamAuditResponse>;

    // ---- Feedback ----

    /**
     * Send feedback to the Upload-Post team.
     *
     * For AI agents and developers. Never include credentials or personal data (they are redacted anyway). A repeated report returns duplicate: true.
     *
     * `POST /api/uploadposts/feedback`
     */
    sendFeedback(options: SendFeedbackOptions): Promise<SendFeedbackResponse>;

    // ---- Google Business ----

    /**
     * Rename a Google Business account.
     *
     * **Not generally available yet.** Off by default: answers `403` with `ownership_changes_disabled` until the feature is available.
     *
     * Renames a business account (only the name). With `validate_only: true` Google checks the request without changing anything (no `confirm` needed); that mode works today. A real rename is not generally available yet: 403 `ownership_changes_disabled`. `account` must be the account connected to the profile or the owner of one of its saved locations (404 `account_not_found` otherwise).
     *
     * `PATCH /api/uploadposts/google-business/accounts`
     */
    updateGoogleBusinessAccount(options: UpdateGoogleBusinessAccountOptions): Promise<UpdateGoogleBusinessAccountResponse>;

    /**
     * Invite an admin.
     *
     * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
     *
     * Google emails the invitation; the person gets access once they accept. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
     *
     * `POST /api/uploadposts/google-business/admins`
     */
    createGoogleBusinessAdmin(options: CreateGoogleBusinessAdminOptions): Promise<CreateGoogleBusinessAdminResponse>;

    /**
     * Change an admin's role.
     *
     * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
     *
     * Changes the role of an admin (`admin_name` from GET /admins). If the role is already that one, the answer has `unchanged: true` and nothing is sent. Refused with 409 `last_owner` if it would demote the last owner and 409 `connected_identity` if it would demote the Google account connected to Upload-Post. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
     *
     * `PATCH /api/uploadposts/google-business/admins`
     */
    updateGoogleBusinessAdmin(options: UpdateGoogleBusinessAdminOptions): Promise<UpdateGoogleBusinessAdminResponse>;

    /**
     * Remove an admin.
     *
     * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
     *
     * Removes an admin at once (they would have to be invited again). Refused with 409 `last_owner` / `connected_identity` like the role change. JSON body. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
     *
     * `DELETE /api/uploadposts/google-business/admins`
     */
    deleteGoogleBusinessAdmin(options: DeleteGoogleBusinessAdminOptions): Promise<DeleteGoogleBusinessAdminResponse>;

    /**
     * Accept an invitation.
     *
     * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
     *
     * Accepts a pending invitation (404 `invitation_not_found` otherwise). Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
     *
     * `POST /api/uploadposts/google-business/invitations/accept`
     */
    acceptGoogleBusinessInvitation(options: AcceptGoogleBusinessInvitationOptions): Promise<AcceptGoogleBusinessInvitationResponse>;

    /**
     * Decline an invitation.
     *
     * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
     *
     * Declines a pending invitation (404 `invitation_not_found` otherwise). Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
     *
     * `POST /api/uploadposts/google-business/invitations/decline`
     */
    declineGoogleBusinessInvitation(options: DeclineGoogleBusinessInvitationOptions): Promise<DeclineGoogleBusinessInvitationResponse>;

    /**
     * Transfer a location to another account.
     *
     * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
     *
     * Moves a location to another Google account. Google only allows it when the connected user owns the location and manages the destination account. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
     *
     * `POST /api/uploadposts/google-business/locations/transfer`
     */
    transferGoogleBusinessLocation(options: TransferGoogleBusinessLocationOptions): Promise<TransferGoogleBusinessLocationResponse>;

    /**
     * Create a location.
     *
     * **Not generally available yet.** Answers 503 `gbp_feature_disabled` before anything else is checked. Send `location` (a Google Location object) or the friendly fields of location info, plus `language_code`. `title`, `primary_category` and `language_code` are required. Needs `confirm: true` (not with `dry_run`). `request_id` comes back in every answer: on 502 `google_result_unknown` repeat with the same `request_id` and Google never creates it twice. Search first with google-locations/search. Daily creation limits: 429 `daily_limit_reached` / `google_daily_quota_exhausted`.
     *
     * `POST /api/uploadposts/google-business/locations/create`
     */
    createGoogleBusinessLocation(options: CreateGoogleBusinessLocationOptions): Promise<CreateGoogleBusinessLocationResponse>;

    /**
     * Delete a location.
     *
     * **Not generally available yet.** Answers 503 `gbp_feature_disabled` before anything else is checked. Irreversible. Needs `confirm: true`. If Google does not allow deleting it through the API: 409 `location_cannot_be_deleted` (delete it from business.google.com).
     *
     * `DELETE /api/uploadposts/google-business/locations/delete`
     */
    deleteGoogleBusinessLocation(options: DeleteGoogleBusinessLocationOptions): Promise<DeleteGoogleBusinessLocationResponse>;

    /**
     * Get real-time notification settings.
     *
     * **Not generally available yet.** Answers 503 `gbp_notifications_unavailable` and no Google Business event is sent to webhooks. Google keeps one notification setting per Google account; when another tool owns it, `other_tool_configured` is `true`.
     *
     * `GET /api/uploadposts/google-business/notifications`
     */
    getGoogleBusinessNotificationSettings(options: GetGoogleBusinessNotificationSettingsOptions): Promise<GetGoogleBusinessNotificationSettingsResponse>;

    /**
     * Turn real-time notifications on or off.
     *
     * **Not generally available yet.** Answers 503 `gbp_notifications_unavailable` and no Google Business event is sent to webhooks. Turns notifications on or off for the Google account; webhooks must also list the events (`review_received`, `review_updated`, `customer_media_received`, `listing_google_update`, `listing_duplicate`, `listing_control_changed`) in `webhook_events`. Needs `confirm: true`. If Google does not confirm the change (`outcome_unknown: true`), read the setting before retrying.
     *
     * `PUT /api/uploadposts/google-business/notifications`
     */
    updateGoogleBusinessNotificationSettings(options: UpdateGoogleBusinessNotificationSettingsOptions): Promise<UpdateGoogleBusinessNotificationSettingsResponse>;

    /**
     * Start a verification.
     *
     * **Not generally available yet.** Answers 503 `gbp_feature_disabled`. Google contacts the business (postcard, SMS, call or email), so `confirm: true` is required. 3 verifications a day per location (429 `daily_limit_reached`, `scope: location`). `AUTO` verifications are `COMPLETED` at once; the others wait for the code. On 502 `google_result_unknown`, check the list before trying again.
     *
     * `POST /api/uploadposts/google-business/verification/start`
     */
    startGoogleBusinessVerification(options: StartGoogleBusinessVerificationOptions): Promise<StartGoogleBusinessVerificationResponse>;

    /**
     * Enter the verification code.
     *
     * **Not generally available yet.** Answers 503 `gbp_feature_disabled`. Sends the code Google sent. 10 attempts a day per account and location (429 `daily_limit_reached`); only codes Google actually checked count. `state: COMPLETED` when Google accepts it.
     *
     * `POST /api/uploadposts/google-business/verification/complete`
     */
    completeGoogleBusinessVerification(options: CompleteGoogleBusinessVerificationOptions): Promise<CompleteGoogleBusinessVerificationResponse>;

    /**
     * Get an instant verification token.
     *
     * **Not generally available yet.** Answers 503 `gbp_feature_disabled`. Asks Google for an instant verification token. When Google reserves it to its vetted partners, 403 `partner_only`: use verification/start instead.
     *
     * `POST /api/uploadposts/google-business/verification/token`
     */
    generateGoogleBusinessVerificationToken(options: GenerateGoogleBusinessVerificationTokenOptions): Promise<GenerateGoogleBusinessVerificationTokenResponse>;

    // ---- ChatGPT Ads ----

    /**
     * Connect a ChatGPT Ads account.
     *
     * Stores an OpenAI Ads API key after validating it live against OpenAI. Each key is scoped to one ad account. The key is encrypted at rest and never returned. Posting the same account again replaces the stored key (key rotation). The first account connected becomes the default. Spend runs on your own OpenAI billing.
     *
     * `POST /api/uploadposts/ads/chatgpt/connect`
     */
    connectChatgptAdsAccount(options: ConnectChatgptAdsAccountOptions): Promise<ConnectChatgptAdsAccountResponse>;

    /**
     * List connected ChatGPT Ads accounts.
     *
     * Connected ad accounts (never the credentials), default first, each with the `profiles` it is linked to.
     *
     * `GET /api/uploadposts/ads/chatgpt/accounts`
     */
    listChatgptAdsAccounts(options?: ListChatgptAdsAccountsOptions): Promise<ListChatgptAdsAccountsResponse>;

    /**
     * Disconnect a ChatGPT Ads account.
     *
     * Without `profile_username`: forgets the stored key and unlinks every profile (if it was the default, another connected account becomes the default). With `profile_username`: only unlinks that profile and keeps the key for the others. Campaigns keep running in Ads Manager either way.
     *
     * `DELETE /api/uploadposts/ads/chatgpt/accounts/{ad_account_id}`
     */
    disconnectChatgptAdsAccount(options: DisconnectChatgptAdsAccountOptions): Promise<DisconnectChatgptAdsAccountResponse>;

    /**
     * Get live ad account metadata.
     *
     * The selected ad account's metadata, read live from OpenAI. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/account`
     */
    getChatgptAdsAccount(options?: GetChatgptAdsAccountOptions): Promise<GetChatgptAdsAccountResponse>;

    /**
     * List campaigns.
     *
     * Campaigns of the ad account. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/campaigns`
     */
    listChatgptAdsCampaigns(options?: ListChatgptAdsCampaignsOptions): Promise<ListChatgptAdsCampaignsResponse>;

    /**
     * Create a campaign.
     *
     * Creates a campaign (budget, schedule, location and audience targeting). One of `budget` / `budget_micros` is required. Created `paused` unless `status: active` is sent. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/campaigns`
     */
    createChatgptAdsCampaign(options: CreateChatgptAdsCampaignOptions): Promise<CreateChatgptAdsCampaignResponse>;

    /**
     * Get a campaign.
     *
     * One campaign. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}`
     */
    getChatgptAdsCampaign(options: GetChatgptAdsCampaignOptions): Promise<GetChatgptAdsCampaignResponse>;

    /**
     * Update a campaign.
     *
     * Updates a campaign. Every field is optional; at least one is required (400 `No updatable fields supplied`). Archiving is irreversible. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}`
     */
    updateChatgptAdsCampaign(options: UpdateChatgptAdsCampaignOptions): Promise<UpdateChatgptAdsCampaignResponse>;

    /**
     * Activate a campaign.
     *
     * Sets the campaign `active`. An ad only serves when its campaign, ad group and ad are all active and the ad passed OpenAI's review. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/activate`
     */
    activateChatgptAdsCampaign(options: ActivateChatgptAdsCampaignOptions): Promise<ActivateChatgptAdsCampaignResponse>;

    /**
     * Pause a campaign.
     *
     * Sets the campaign `paused`. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/pause`
     */
    pauseChatgptAdsCampaign(options: PauseChatgptAdsCampaignOptions): Promise<PauseChatgptAdsCampaignResponse>;

    /**
     * Archive a campaign.
     *
     * Archives the campaign. Irreversible. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/archive`
     */
    archiveChatgptAdsCampaign(options: ArchiveChatgptAdsCampaignOptions): Promise<ArchiveChatgptAdsCampaignResponse>;

    /**
     * Get campaign insights.
     *
     * Performance of one campaign; rows per `aggregation_level` inside it. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/insights`
     */
    getChatgptAdsCampaignInsights(options: GetChatgptAdsCampaignInsightsOptions): Promise<GetChatgptAdsCampaignInsightsResponse>;

    /**
     * List ad groups.
     *
     * Ad groups of a campaign. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/adgroups`
     */
    listChatgptAdsAdGroups(options: ListChatgptAdsAdGroupsOptions): Promise<ListChatgptAdsAdGroupsResponse>;

    /**
     * Create an ad group.
     *
     * Creates an ad group (the bid) under a campaign. One of `max_bid` / `max_bid_micros` is required unless `bidding_config` is sent. Created `paused` unless `status: active` is sent. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/adgroups`
     */
    createChatgptAdsAdGroup(options: CreateChatgptAdsAdGroupOptions): Promise<CreateChatgptAdsAdGroupResponse>;

    /**
     * Get an ad group.
     *
     * One ad group. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}`
     */
    getChatgptAdsAdGroup(options: GetChatgptAdsAdGroupOptions): Promise<GetChatgptAdsAdGroupResponse>;

    /**
     * Update an ad group.
     *
     * Updates an ad group. Every field is optional; at least one is required (400 `No updatable fields supplied`). Archiving is irreversible. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}`
     */
    updateChatgptAdsAdGroup(options: UpdateChatgptAdsAdGroupOptions): Promise<UpdateChatgptAdsAdGroupResponse>;

    /**
     * Activate an ad group.
     *
     * Sets the ad group `active`. An ad only serves when its campaign, ad group and ad are all active and the ad passed OpenAI's review. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/activate`
     */
    activateChatgptAdsAdGroup(options: ActivateChatgptAdsAdGroupOptions): Promise<ActivateChatgptAdsAdGroupResponse>;

    /**
     * Pause an ad group.
     *
     * Sets the ad group `paused`. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/pause`
     */
    pauseChatgptAdsAdGroup(options: PauseChatgptAdsAdGroupOptions): Promise<PauseChatgptAdsAdGroupResponse>;

    /**
     * Archive an ad group.
     *
     * Archives the ad group. Irreversible. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/archive`
     */
    archiveChatgptAdsAdGroup(options: ArchiveChatgptAdsAdGroupOptions): Promise<ArchiveChatgptAdsAdGroupResponse>;

    /**
     * Get ad group insights.
     *
     * Performance of one ad group; rows per `aggregation_level` inside it. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/insights`
     */
    getChatgptAdsAdGroupInsights(options: GetChatgptAdsAdGroupInsightsOptions): Promise<GetChatgptAdsAdGroupInsightsResponse>;

    /**
     * List ads.
     *
     * Ads of an ad group. `review_status` is `in_review`, `approved` or `rejected`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/ads`
     */
    listChatgptAdsAds(options: ListChatgptAdsAdsOptions): Promise<ListChatgptAdsAdsResponse>;

    /**
     * Create an ad.
     *
     * Creates an ad (the creative) under an ad group: send `title`, `body`, `target_url` and `file_id` at the top level, or a full `creative` object (needed for `product_ad_template`). It starts serving after OpenAI's review (`review_status: approved`). Created `paused` unless `status: active` is sent. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/ads`
     */
    createChatgptAdsAd(options: CreateChatgptAdsAdOptions): Promise<CreateChatgptAdsAdResponse>;

    /**
     * Get an ad.
     *
     * One ad. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/ads/{ad_id}`
     */
    getChatgptAdsAd(options: GetChatgptAdsAdOptions): Promise<GetChatgptAdsAdResponse>;

    /**
     * Update an ad.
     *
     * Updates an ad. Only `name`, `status` and `creative` are read; an edited ad goes back into review. Every field is optional; at least one is required (400 `No updatable fields supplied`). Archiving is irreversible. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}`
     */
    updateChatgptAdsAd(options: UpdateChatgptAdsAdOptions): Promise<UpdateChatgptAdsAdResponse>;

    /**
     * Activate an ad.
     *
     * Sets the ad `active`. An ad only serves when its campaign, ad group and ad are all active and the ad passed OpenAI's review. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/activate`
     */
    activateChatgptAdsAd(options: ActivateChatgptAdsAdOptions): Promise<ActivateChatgptAdsAdResponse>;

    /**
     * Pause an ad.
     *
     * Sets the ad `paused`. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/pause`
     */
    pauseChatgptAdsAd(options: PauseChatgptAdsAdOptions): Promise<PauseChatgptAdsAdResponse>;

    /**
     * Archive an ad.
     *
     * Archives the ad. Irreversible. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/archive`
     */
    archiveChatgptAdsAd(options: ArchiveChatgptAdsAdOptions): Promise<ArchiveChatgptAdsAdResponse>;

    /**
     * Get ad insights.
     *
     * Performance of one ad; rows per `aggregation_level` inside it. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/ads/{ad_id}/insights`
     */
    getChatgptAdsAdInsights(options: GetChatgptAdsAdInsightsOptions): Promise<GetChatgptAdsAdInsightsResponse>;

    /**
     * Preview an ad.
     *
     * A temporary iframe preview of the ad (expires in 24 h). No body. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/preview`
     */
    previewChatgptAdsAd(options: PreviewChatgptAdsAdOptions): Promise<PreviewChatgptAdsAdResponse>;

    /**
     * Upload a creative image.
     *
     * Uploads the image an ad uses; reuse the returned `file_id`. JSON with `image_url` (OpenAI fetches it) or multipart with a binary `file` (up to 10 MB). A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/creatives`
     */
    uploadChatgptAdsCreative(options?: UploadChatgptAdsCreativeOptions): Promise<UploadChatgptAdsCreativeResponse>;

    /**
     * Get ad account insights.
     *
     * Performance of the whole ad account; rows per `aggregation_level`. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `GET /api/uploadposts/ads/chatgpt/insights`
     */
    getChatgptAdsAccountInsights(options?: GetChatgptAdsAccountInsightsOptions): Promise<GetChatgptAdsAccountInsightsResponse>;

    /**
     * Launch an ad in one call.
     *
     * Creates the campaign, ad group and ad, and uploads the creative from `image_url` (or reuses `file_id`), in one request. Every payload is validated before the first write; everything is created paused and only activated (`status: active`) once all three exist. If a later step fails, the error carries `details.created` with the ids already created so you can finish or archive them. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
     *
     * `POST /api/uploadposts/ads/chatgpt/promote`
     */
    promoteChatgptAds(options: PromoteChatgptAdsOptions): Promise<PromoteChatgptAdsResponse>;

    // </openapi:methods>

    /** Operations behind the generated methods: [HTTP method, path, details]. */
    static OPENAPI_OPERATIONS: Record<string, [string, string, Record<string, any>]>;
  }

  export default UploadPost;
}
