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

  export type MissingReason = 'not_supported' | 'reauth_required' | 'quota' | 'platform_delay' | 'not_fetched';

  export interface PostAnalyticsDailyResponse {
    success: boolean;
    platform: string;
    platform_post_id: string | null;
    profile_username: string | null;
    request_id?: string;
    source: 'snapshot_cache';
    /** `on_demand` on X and YouTube: only updated when someone reads the post. */
    refresh_policy: 'on_demand' | 'on_read';
    refresh_policy_note: string;
    days: Array<{
      date: string;
      as_of: string;
      source: 'post_read' | 'listing';
      metrics: Record<string, number>;
      account_id?: string;
      /** Days since the previous row (null on the first one). */
      gap_days: number | null;
      /** Gained since the previous row, over `gap_days`. */
      delta: Record<string, number> | null;
      delta_reason?: 'account_changed';
    }>;
    snapshots: number;
    first_date: string | null;
    last_date: string | null;
    as_of: string | null;
    next_refresh_at: null;
    missing_reason: MissingReason | null;
    truncated?: boolean;
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
    getAnalytics(profileUsername: string, options?: {
      platforms?: string[];
      pageId?: string;
      pageUrn?: string;
      /** Start of a period, YYYY-MM-DD: adds a `period` block per platform (from stored daily snapshots). */
      since?: string;
      /** End of the period, YYYY-MM-DD (default today, UTC; at most 366 days). */
      until?: string;
      /** `previous` adds the previous period of the same length and `vs_previous`. */
      compare?: 'previous';
    }): Promise<AnalyticsResponse>;

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
    getPostAnalytics(requestId: string, options?: {
      /** Only this platform. */
      platform?: string;
      /** Ask the network again even if a recent stored reading exists (limited per hour). */
      refresh?: boolean;
    }): Promise<{
      success: boolean;
      post: { request_id: string; profile_username: string; post_title: string; post_caption: string; media_type: string; upload_timestamp: string };
      /** Oldest `as_of` of the platforms. */
      as_of?: string | null;
      /** Earliest `next_refresh_at` of the platforms. */
      next_refresh_at?: string | null;
      platforms: Record<string, {
        success: boolean;
        platform_post_id?: string;
        post_url?: string;
        /** Counters plus, on TikTok, retention / impression_sources / audience_types and watch times; normalized `avg_watch_seconds`, `watch_time_seconds`, `completion_rate` (0-100). */
        post_metrics?: Record<string, any>;
        post_metrics_source?: string;
        post_metrics_error?: string;
        /** When the network was asked for these metrics. */
        as_of?: string | null;
        /** Earliest moment asking again can return newer metrics; null = only `refresh` refreshes them. */
        next_refresh_at?: string | null;
        /** `live` or `snapshot` (last stored reading), where freshness by post age applies. */
        served_from?: 'live' | 'snapshot';
        /** `refresh` asked past the hourly limit: the stored reading was served. */
        refresh_limited?: boolean;
        /** Error of the last live read when the post was deleted or access was lost. */
        live_error?: string;
        /** Metrics not reported, with the reason. */
        missing?: Record<string, MissingReason>;
        missing_reason?: MissingReason;
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
      /** views, likes, comments, shares, engagement, published_at or as_of; prefix `-` for descending. */
      sort?: string;
      /** Overrides the `-` prefix of sort. */
      order?: 'asc' | 'desc';
      /** What since/until filter on: the reading day (default) or the publish day. */
      dateField?: 'captured_at' | 'published_at';
      /** `external`: posts not published with Upload-Post; `all`: both. */
      origin?: 'external' | 'all';
    }): Promise<{
      success: boolean;
      profile_username: string;
      platform: string | null;
      as_of?: string | null;
      next_refresh_at?: null;
      truncated?: boolean;
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
        /** When the network was asked for these metrics. */
        as_of?: string | null;
        /** Posts published with Upload-Post. */
        request_id?: string;
        post_title?: string;
        /** First 140 characters of the caption. */
        caption_preview?: string;
        origin?: 'upload_post' | 'external';
        account_id?: string;
        listing_source?: string;
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
      /** Per metric: native label, API field, unit, kind, summable; plus delay_hours and views_field. */
      metric_catalog?: Record<string, any>;
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
     * @see https://docs.upload-post.com/api/queue-system
     */
    getQueueSettings(options: { profileUsername: string } & ApiParams): Promise<ApiResponse>;

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
    getPostAnalyticsByPlatformId(platformPostId: string, platform: string, user: string, options?: {
      /** Ask the network again even if a recent stored reading exists (limited per hour). */
      refresh?: boolean;
    }): Promise<Record<string, unknown>>;

    /**
     * Day-by-day history of a post published with Upload-Post, from stored
     * readings (never calls the network). `platform` is required.
     */
    getPostAnalyticsDaily(requestId: string, options: { platform: string; since?: string; until?: string }): Promise<PostAnalyticsDailyResponse>;

    /** Day-by-day history of any post of a connected account, by its native id. */
    getPostAnalyticsDailyByPlatformId(
      platformPostId: string,
      platform: string,
      user: string,
      options?: { since?: string; until?: string }
    ): Promise<PostAnalyticsDailyResponse>;

    /**
     * Each post against the profile's other posts at the same age (1h, 24h,
     * 7d, 30d), and median views by format, hour, weekday, hashtags and caption
     * length. Computed from stored readings only.
     */
    getInsights(options: { user: string; platform?: string; since?: string; until?: string }): Promise<{
      success: boolean;
      profile_username: string;
      since: string;
      until: string;
      ages: string[];
      min_sample: number;
      by_platform: Record<string, {
        posts_considered: number;
        posts_with_photos: number;
        posts: Array<{
          platform_post_id: string;
          request_id?: string | null;
          published_at: string | null;
          format: string | null;
          at_age: Record<string, { views: number; median_others?: number | null; n?: number; low_sample?: boolean; vs_median?: number | null }>;
        }>;
        groups: Record<string, Record<string, any>>;
        derived?: boolean;
        derived_notice?: string;
      }>;
      as_of?: string | null;
      [key: string]: any;
    }>;

    /**
     * Per profile and platform: connection, analytics polling, refresh mode,
     * network delay, last readings, coverage and stored history. Never calls a network.
     */
    getAnalyticsStatus(options?: { user?: string; platform?: string }): Promise<{
      success: boolean;
      generated_at: string;
      profiles: Array<{ profile_username: string; platforms: Record<string, Record<string, any>> }>;
      missing_reasons: MissingReason[];
      truncated?: boolean;
      profiles_total?: number;
      profiles_returned?: number;
    }>;

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
