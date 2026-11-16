import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { createReadStream } from 'fs';

const API_BASE_URL = 'https://api.upload-post.com/api';

/**
 * Upload-Post API client
 * 
 * Supports uploading to: TikTok, Instagram, YouTube, LinkedIn, Facebook,
 * Pinterest, Threads, Reddit, Bluesky, X (Twitter), Discord, Telegram
 */
export class UploadPost {
  /**
   * @param {string} apiKey - Your API key from Upload-Post
   * @param {Object} [options] - Client options
   * @param {string} [options.actAsUser] - Team members only: email of the account
   *   owner to act on. Sent as the `X-Act-As-User` header on every request. If the
   *   owner's current plan no longer covers your team seat, requests fail with HTTP
   *   403 and `error.code === 'TEAM_SEAT_SUSPENDED'` until the owner upgrades or
   *   frees a seat.
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseUrl = API_BASE_URL;
    this.actAsUser = options.actAsUser || null;
  }

  /**
   * Make an API request
   * @private
   */
  async _request(endpoint, method = 'GET', data = null, isFormData = false, extraHeaders = {}) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Apikey ${this.apiKey}`,
        'X-Upload-Post-Source': 'npm',
        ...(this.actAsUser ? { 'X-Act-As-User': this.actAsUser } : {}),
        ...extraHeaders,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    };

    if (data) {
      if (isFormData) {
        config.headers = { ...config.headers, ...data.getHeaders() };
        config.data = data;
      } else if (method === 'GET') {
        config.params = data;
      } else {
        config.headers['Content-Type'] = 'application/json';
        config.data = data;
      }
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      const data = error.response?.data;
      const apiError = typeof data?.error === 'string' ? data.error : undefined;
      const message = data?.message || data?.detail || apiError || error.message;
      const err = new Error(`Upload-Post API error: ${message}`);
      // Machine-readable details, so callers can branch on the code instead of
      // parsing the message (e.g. TEAM_SEAT_SUSPENDED, bluesky_dm_scope_missing,
      // webhook_subscription_failed, linkedin_comment_not_found).
      err.status = error.response?.status;
      // No response at all (DNS, timeout): keep the network code (ECONNABORTED...).
      err.code = (data && (data.code || data.error_code)) || (error.response ? undefined : error.code);
      err.errorCode = data?.error_code;
      err.reason = data?.reason;
      const retryAfter = error.response?.headers?.['retry-after'];
      if (retryAfter !== undefined) err.retryAfter = Number(retryAfter);
      err.response = data;
      throw err;
    }
  }

  /**
   * The API collapses two uploads carrying the same key within 24 hours into a
   * single post. Retrying an upload without one publishes it twice.
   * @private
   */
  _idempotencyHeaders(options) {
    const key = options.idempotencyKey || options.requestId;
    return key ? { 'Idempotency-Key': String(key) } : {};
  }

  /**
   * First defined alias. Upload option keys are camelCase; a few fields also
   * accept the snake_case name the API uses.
   * @private
   */
  _pick(options, ...keys) {
    for (const key of keys) {
      if (options[key] !== undefined) return options[key];
    }
  }

  /**
   * Append a whitelist field. Objects/arrays go as JSON; booleans and numbers
   * as strings. Empty strings are omitted.
   * @private
   */
  _appendField(form, field, value) {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean' || typeof value === 'number') {
      form.append(field, String(value));
      return;
    }
    if (Array.isArray(value)) {
      form.append(field, JSON.stringify(value));
      return;
    }
    if (typeof value === 'object' && typeof value.pipe !== 'function' && !Buffer.isBuffer(value)) {
      form.append(field, JSON.stringify(value));
      return;
    }
    if (value === '') return;
    form.append(field, value);
  }

  /**
   * Local path becomes a file stream; http(s) URLs and other values pass through.
   * @private
   */
  _appendFileField(form, field, value) {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.startsWith('http://') || lower.startsWith('https://') || !fs.existsSync(value)) {
        form.append(field, value);
      } else {
        form.append(field, createReadStream(value));
      }
      return;
    }
    form.append(field, value);
  }

  /**
   * Repeat `field[]` once per item (carousel titles, alt-text lists, …).
   * @private
   */
  _appendRepeated(form, field, value) {
    if (value === undefined || value === null || value === '') return;
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (item === undefined || item === null || item === '') continue;
      form.append(field, typeof item === 'object' ? JSON.stringify(item) : String(item));
    }
  }

  /**
   * Add common upload parameters to form
   * @private
   */
  _addCommonParams(form, options) {
    form.append('user', options.user);
    if (options.title) form.append('title', options.title);

    // Platforms
    const platforms = Array.isArray(options.platforms) ? options.platforms : [options.platforms];
    platforms.forEach(p => form.append('platform[]', p));

    // Optional common parameters
    if (options.firstComment) form.append('first_comment', options.firstComment);
    // Reply to an existing post (X: tweet ID; Bluesky: post URL or AT-URI). The
    // API has always accepted `reply_to_id`; the SDK simply never mapped it.
    const replyToId = options.replyToId || options.xReplyToId || options.blueskyReplyToId;
    if (replyToId) form.append('reply_to_id', replyToId);
    if (options.altText) form.append('alt_text', options.altText);
    if (options.scheduledDate) form.append('scheduled_date', options.scheduledDate);
    if (options.timezone) form.append('timezone', options.timezone);
    if (options.addToQueue !== undefined) form.append('add_to_queue', String(options.addToQueue));
    if (options.maxPostsPerSlot !== undefined) form.append('max_posts_per_slot', String(options.maxPostsPerSlot));
    if (options.asyncUpload !== undefined) form.append('async_upload', String(options.asyncUpload));
    // AI auto-generation of native per-platform copy from the media (fills blank fields)
    // Sponsored / paid-partnership post, mapped by the API to each network's
    // native label (TikTok brand_content_toggle, YouTube hasPaidProductPlacement,
    // X paid_partnership; Facebook and Pinterest also need their sponsor id).
    // A network-specific field wins over it.
    this._appendField(form, 'paid_partnership', this._pick(options, 'paidPartnership', 'paid_partnership'));

    // Platform-specific title overrides
    if (options.blueskyTitle) form.append('bluesky_title', options.blueskyTitle);
    if (options.instagramTitle) form.append('instagram_title', options.instagramTitle);
    if (options.facebookTitle) form.append('facebook_title', options.facebookTitle);
    if (options.tiktokTitle) form.append('tiktok_title', options.tiktokTitle);
    if (options.linkedinTitle) form.append('linkedin_title', options.linkedinTitle);
    if (options.xTitle) form.append('x_title', options.xTitle);
    if (options.youtubeTitle) form.append('youtube_title', options.youtubeTitle);
    if (options.pinterestTitle) form.append('pinterest_title', options.pinterestTitle);
    if (options.threadsTitle) form.append('threads_title', options.threadsTitle);
    this._appendField(form, 'telegram_title', this._pick(options, 'telegramTitle', 'telegram_title'));
    // New credential-based platforms
    if (options.slackTitle) form.append('slack_title', options.slackTitle);
    if (options.mastodonTitle) form.append('mastodon_title', options.mastodonTitle);
    if (options.nostrTitle) form.append('nostr_title', options.nostrTitle);
    if (options.lemmyTitle) form.append('lemmy_title', options.lemmyTitle);
    if (options.devtoTitle) form.append('devto_title', options.devtoTitle);
    if (options.hashnodeTitle) form.append('hashnode_title', options.hashnodeTitle);
    if (options.wordpressTitle) form.append('wordpress_title', options.wordpressTitle);
    if (options.whopTitle) form.append('whop_title', options.whopTitle);
    if (options.listmonkTitle) form.append('listmonk_title', options.listmonkTitle);

    // Platform-specific description overrides
    if (options.description) form.append('description', options.description);
    if (options.linkedinDescription) form.append('linkedin_description', options.linkedinDescription);
    if (options.youtubeDescription) form.append('youtube_description', options.youtubeDescription);
    if (options.facebookDescription) form.append('facebook_description', options.facebookDescription);
    if (options.tiktokDescription) form.append('tiktok_description', options.tiktokDescription);
    if (options.pinterestDescription) form.append('pinterest_description', options.pinterestDescription);

    // Platform-specific first comment overrides
    if (options.instagramFirstComment) form.append('instagram_first_comment', options.instagramFirstComment);
    if (options.facebookFirstComment) form.append('facebook_first_comment', options.facebookFirstComment);
    if (options.xFirstComment) form.append('x_first_comment', options.xFirstComment);
    if (options.threadsFirstComment) form.append('threads_first_comment', options.threadsFirstComment);
    if (options.youtubeFirstComment) form.append('youtube_first_comment', options.youtubeFirstComment);
    if (options.redditFirstComment) form.append('reddit_first_comment', options.redditFirstComment);
    if (options.blueskyFirstComment) form.append('bluesky_first_comment', options.blueskyFirstComment);
    if (options.linkedinFirstComment) form.append('linkedin_first_comment', options.linkedinFirstComment);
    // TikTok takes a first comment like everyone else. It needs the `comments`
    // capability on the connection: without it the post still publishes and the
    // response carries a warning instead of the comment.
    if (options.tiktokFirstComment) form.append('tiktok_first_comment', options.tiktokFirstComment);
    this._appendField(form, 'telegram_first_comment', this._pick(options, 'telegramFirstComment', 'telegram_first_comment'));

    if (options.firstCommentMedia) {
      const mediaItems = Array.isArray(options.firstCommentMedia) ? options.firstCommentMedia : [options.firstCommentMedia];
      for (const mediaItem of mediaItems) {
        if (typeof mediaItem === 'string') {
          if (mediaItem.toLowerCase().startsWith('http://') || mediaItem.toLowerCase().startsWith('https://')) {
            form.append('first_comment_media[]', mediaItem);
          } else {
            if (fs.existsSync(mediaItem)) {
              form.append('first_comment_media[]', createReadStream(mediaItem));
            }
          }
        } else {
          form.append('first_comment_media[]', mediaItem);
        }
      }
    }
  }

  /**
   * Add TikTok-specific parameters
   * @private
   */
  _addTiktokParams(form, options, isVideo = true) {
    // [form field, option key, "flag" when the value is a boolean/number sent as
    // soon as it is defined, "text" when an empty value means "not set"].
    //
    // The shared block is shared on purpose: the backend reads privacy_level and
    // post_mode on both /upload and /upload_photos, and TikTok's photo endpoint
    // also accepts the music track id, the location pair and is_ai_generated.
    // Gating them behind isVideo made photo carousels always publish as
    // PUBLIC_TO_EVERYONE / DIRECT_POST and unable to carry music or a location.
    //
    // The music/location/cover/draft fields need the matching capability on the
    // connection (see `capabilities` on the TikTok account returned by
    // listUsers() / GET /api/uploadposts/users). Without it the field is ignored,
    // the post still publishes, and the response carries a per-field `warnings`
    // entry.
    const shared = [
      ['disable_comment', 'tiktokDisableComment', 'flag'],
      ['brand_content_toggle', 'brandContentToggle', 'flag'],
      ['brand_organic_toggle', 'brandOrganicToggle', 'flag'],
      ['privacy_level', 'tiktokPrivacyLevel', 'text'],
      ['tiktok_music_id', 'tiktokMusicId', 'text'],
      ['tiktok_location_id', 'tiktokLocationId', 'text'],
      ['tiktok_location_name', 'tiktokLocationName', 'text'],
      ['tiktok_is_ai_generated', 'tiktokIsAiGenerated', 'flag'],
    ];
    // Video-only: TikTok's photo contract takes the track id alone, with no
    // volume or trim, and has no custom cover.
    const videoOnly = [
      ['disable_duet', 'tiktokDisableDuet', 'flag'],
      ['disable_stitch', 'tiktokDisableStitch', 'flag'],
      ['cover_timestamp', 'tiktokCoverTimestamp', 'flag'],
      ['is_aigc', 'tiktokIsAigc', 'flag'],
      ['tiktok_music_volume', 'tiktokMusicVolume', 'flag'],
      ['tiktok_music_start', 'tiktokMusicStart', 'flag'],
      ['tiktok_music_end', 'tiktokMusicEnd', 'flag'],
      ['tiktok_original_sound_volume', 'tiktokOriginalSoundVolume', 'flag'],
      ['tiktok_cover_image_url', 'tiktokCoverImageUrl', 'text'],
    ];
    const photoOnly = [
      ['auto_add_music', 'tiktokAutoAddMusic', 'flag'],
      ['photo_cover_index', 'tiktokPhotoCoverIndex', 'flag'],
    ];

    for (const [field, key, kind] of shared.concat(isVideo ? videoOnly : photoOnly)) {
      const value = options[key];
      if (kind === 'flag' ? value === undefined : !value) continue;
      form.append(field, String(value));
    }
    // TikTok's "Disclose post content" switch and its two kinds (your own brand,
    // branded content for a third party).
    this._appendField(form, 'disclose_commercial', this._pick(options, 'tiktokDiscloseCommercial', 'discloseCommercial', 'disclose_commercial'));
    this._appendField(form, 'your_brand', this._pick(options, 'tiktokYourBrand', 'yourBrand', 'your_brand'));
    this._appendField(form, 'branded_content', this._pick(options, 'tiktokBrandedContent', 'brandedContent', 'branded_content'));

    // Draft: postMode MEDIA_UPLOAD and tiktokUploadToDraft are the same draft.
    // Pass both through (camelCase and snake_case). Do not collapse them.
    const postMode = this._pick(options, 'tiktokPostMode', 'postMode', 'post_mode');
    if (postMode) form.append('post_mode', String(postMode));
    const uploadToDraft = this._pick(
      options,
      'tiktokUploadToDraft', 'uploadToDraft', 'tiktok_upload_to_draft', 'upload_to_draft'
    );
    if (uploadToDraft !== undefined) form.append('tiktok_upload_to_draft', String(uploadToDraft));

    if (isVideo) {
      const adsOnly = this._pick(options, 'tiktokIsAdsOnly', 'isAdsOnly', 'tiktok_is_ads_only', 'is_ads_only');
      if (adsOnly !== undefined) form.append('tiktok_is_ads_only', String(adsOnly));
      const tto = this._pick(options, 'tiktokTtoInviteLink', 'ttoInviteLink', 'tiktok_tto_invite_link', 'tto_invite_link');
      if (tto) form.append('tiktok_tto_invite_link', String(tto));
    }
  }

  /**
   * Add Instagram-specific parameters
   * @private
   */
  _addInstagramParams(form, options, isVideo = true) {
    if (options.instagramMediaType) form.append('media_type', options.instagramMediaType);
    if (options.instagramCollaborators) form.append('collaborators', options.instagramCollaborators);
    if (options.instagramUserTags) form.append('user_tags', options.instagramUserTags);
    if (options.instagramLocationId) form.append('location_id', options.instagramLocationId);
    // AI-content label. The API field is the generic is_ai_generated, which other
    // platforms in the same post also read (it is the same media).
    this._appendField(form, 'is_ai_generated', this._pick(options, 'instagramIsAiGenerated', 'isAiGenerated', 'is_ai_generated'));

    if (isVideo) {
      if (options.instagramShareToFeed !== undefined) form.append('share_to_feed', String(options.instagramShareToFeed));
      // Trial Reels: TRIAL_REELS_SHARE_TO_FOLLOWERS_IF_LIKED or TRIAL_REELS_DONT_SHARE_TO_FOLLOWERS.
      this._appendField(form, 'share_mode', this._pick(options, 'instagramShareMode', 'share_mode'));
      if (options.instagramCoverUrl) {
        const coverVal = options.instagramCoverUrl;
        if (typeof coverVal === 'string' && (coverVal.toLowerCase().startsWith('http://') || coverVal.toLowerCase().startsWith('https://'))) {
          form.append('cover_url', coverVal);
        } else if (typeof coverVal === 'string') {
          form.append('cover_image', createReadStream(coverVal));
        } else {
          form.append('cover_image', coverVal);
        }
      }
      if (options.instagramAudioName) form.append('audio_name', options.instagramAudioName);
      if (options.instagramThumbOffset) form.append('thumb_offset', options.instagramThumbOffset);
    } else {
      this._appendField(form, 'instagram_alt_text', this._pick(options, 'instagramAltText', 'instagram_alt_text'));
    }
  }

  /**
   * Add YouTube-specific parameters
   * @private
   */
  _addYoutubeParams(form, options) {
    if (options.youtubeTags) {
      const tags = Array.isArray(options.youtubeTags) ? options.youtubeTags : options.youtubeTags.split(',').map(t => t.trim());
      tags.forEach(tag => form.append('tags[]', tag));
    }
    if (options.youtubeCategoryId) form.append('categoryId', options.youtubeCategoryId);
    if (options.youtubePrivacyStatus) form.append('privacyStatus', options.youtubePrivacyStatus);
    if (options.youtubeEmbeddable !== undefined) form.append('embeddable', String(options.youtubeEmbeddable));
    if (options.youtubeLicense) form.append('license', options.youtubeLicense);
    if (options.youtubePublicStatsViewable !== undefined) form.append('publicStatsViewable', String(options.youtubePublicStatsViewable));
    if (options.youtubeThumbnailUrl) form.append('thumbnail_url', options.youtubeThumbnailUrl);
    if (options.youtubeSelfDeclaredMadeForKids !== undefined) form.append('selfDeclaredMadeForKids', String(options.youtubeSelfDeclaredMadeForKids));
    if (options.youtubeContainsSyntheticMedia !== undefined) form.append('containsSyntheticMedia', String(options.youtubeContainsSyntheticMedia));
    if (options.youtubeDefaultLanguage) form.append('defaultLanguage', options.youtubeDefaultLanguage);
    if (options.youtubeDefaultAudioLanguage) form.append('defaultAudioLanguage', options.youtubeDefaultAudioLanguage);
    if (options.youtubeAllowedCountries) form.append('allowedCountries', options.youtubeAllowedCountries);
    if (options.youtubeBlockedCountries) form.append('blockedCountries', options.youtubeBlockedCountries);
    if (options.youtubeHasPaidProductPlacement !== undefined) form.append('hasPaidProductPlacement', String(options.youtubeHasPaidProductPlacement));
    if (options.youtubeRecordingDate) form.append('recordingDate', options.youtubeRecordingDate);
    if (options.youtubeNotifySubscribers !== undefined) form.append('youtube_notify_subscribers', String(options.youtubeNotifySubscribers));
    if (options.youtubePublishAt) form.append('youtube_publish_at', options.youtubePublishAt);
    // Translated title/description per language ({ es: { title, description } }) and the
    // brand partner channel id (UC…) for creator-initiated brand partner access.
    this._appendField(form, 'youtube_localizations', this._pick(options, 'youtubeLocalizations', 'youtube_localizations'));
    this._appendField(form, 'youtube_brand_partner', this._pick(options, 'youtubeBrandPartner', 'youtube_brand_partner'));
    if (options.youtubePlaylistId) {
      const playlistIds = Array.isArray(options.youtubePlaylistId)
        ? options.youtubePlaylistId.join(',')
        : options.youtubePlaylistId;
      form.append('youtube_playlist_id', playlistIds);
    }
    if (options.youtubeSubtitles && Array.isArray(options.youtubeSubtitles)) {
      options.youtubeSubtitles.forEach((sub, idx) => {
        if (sub.language) {
          form.append(`youtube_subtitle_language_${idx}`, sub.language);
          if (sub.name) form.append(`youtube_subtitle_name_${idx}`, sub.name);
          if (sub.file) {
            // file can be a string path or a ReadableStream
            if (typeof sub.file === 'string') {
              form.append(`youtube_subtitle_file_${idx}`, createReadStream(sub.file));
            } else {
              form.append(`youtube_subtitle_file_${idx}`, sub.file);
            }
          } else if (sub.url) {
            form.append(`youtube_subtitle_file_${idx}`, sub.url);
          }
        }
      });
    }
  }

  /**
   * Add LinkedIn-specific parameters
   * @private
   */
  _addLinkedinParams(form, options, isText = false) {
    if (options.linkedinVisibility) form.append('visibility', options.linkedinVisibility);
    if (options.targetLinkedinPageId) form.append('target_linkedin_page_id', options.targetLinkedinPageId);
    if (isText && (options.linkedinLinkUrl || options.linkUrl)) {
      form.append('linkedin_link_url', options.linkedinLinkUrl || options.linkUrl);
    }
    this._appendField(form, 'linkedin_alt_text', this._pick(options, 'linkedinAltText', 'linkedin_alt_text'));
    this._appendField(form, 'linkedin_disable_reshare', this._pick(options, 'linkedinDisableReshare', 'linkedin_disable_reshare'));
    this._appendField(form, 'linkedin_link_title', this._pick(options, 'linkedinLinkTitle', 'linkedin_link_title'));
    this._appendField(form, 'linkedin_link_description', this._pick(options, 'linkedinLinkDescription', 'linkedin_link_description'));
    this._appendField(form, 'linkedin_thumbnail_alt_text', this._pick(options, 'linkedinThumbnailAltText', 'linkedin_thumbnail_alt_text'));
    this._appendField(form, 'linkedin_target_geo_locations', this._pick(options, 'linkedinTargetGeoLocations', 'linkedin_target_geo_locations'));
    this._appendField(form, 'linkedin_target_industries', this._pick(options, 'linkedinTargetIndustries', 'linkedin_target_industries'));
    this._appendField(form, 'linkedin_target_seniorities', this._pick(options, 'linkedinTargetSeniorities', 'linkedin_target_seniorities'));
    this._appendField(form, 'linkedin_target_job_functions', this._pick(options, 'linkedinTargetJobFunctions', 'linkedin_target_job_functions'));
    this._appendField(form, 'linkedin_target_staff_count_ranges', this._pick(options, 'linkedinTargetStaffCountRanges', 'linkedin_target_staff_count_ranges'));
    this._appendField(form, 'linkedin_target_interface_locales', this._pick(options, 'linkedinTargetInterfaceLocales', 'linkedin_target_interface_locales'));
    this._appendField(form, 'linkedin_target_degrees', this._pick(options, 'linkedinTargetDegrees', 'linkedin_target_degrees'));
    this._appendField(form, 'linkedin_target_fields_of_study', this._pick(options, 'linkedinTargetFieldsOfStudy', 'linkedin_target_fields_of_study'));
    this._appendField(form, 'linkedin_target_organizations', this._pick(options, 'linkedinTargetOrganizations', 'linkedin_target_organizations'));
    this._appendField(form, 'linkedin_target_entities', this._pick(options, 'linkedinTargetEntities', 'linkedin_target_entities'));
    this._appendField(form, 'linkedin_target_check_audience', this._pick(options, 'linkedinTargetCheckAudience', 'linkedin_target_check_audience'));
    this._appendFileField(form, 'linkedin_subtitles', this._pick(options, 'linkedinSubtitles', 'linkedin_subtitles'));
    this._appendField(form, 'linkedin_subtitles_url', this._pick(options, 'linkedinSubtitlesUrl', 'linkedin_subtitles_url'));
    this._appendField(form, 'linkedin_subtitles_text', this._pick(options, 'linkedinSubtitlesText', 'linkedin_subtitles_text'));
  }

  /**
   * Add Facebook-specific parameters
   * @private
   */
  _addFacebookParams(form, options, isVideo = false, isText = false) {
    if (options.facebookPageId) form.append('facebook_page_id', options.facebookPageId);

    this._appendField(form, 'facebook_place_id', this._pick(options, 'facebookPlaceId', 'facebook_place_id'));
    this._appendField(form, 'facebook_targeting', this._pick(options, 'facebookTargeting', 'facebook_targeting'));
    this._appendField(form, 'facebook_feed_targeting', this._pick(options, 'facebookFeedTargeting', 'facebook_feed_targeting'));
    // Branded content tag: the sponsor's Facebook Page id (not on Reels/Stories).
    this._appendField(form, 'facebook_sponsor_id', this._pick(options, 'facebookSponsorId', 'facebook_sponsor_id'));

    if (isVideo) {
      if (options.facebookVideoState) form.append('video_state', options.facebookVideoState);
      if (options.facebookMediaType) form.append('facebook_media_type', options.facebookMediaType);
      if (options.thumbnailUrl) form.append('thumbnail_url', options.thumbnailUrl);
      this._appendField(form, 'facebook_is_ai_generated', this._pick(options, 'facebookIsAiGenerated', 'facebook_is_ai_generated'));
      this._appendField(form, 'facebook_unpublished_content_type', this._pick(options, 'facebookUnpublishedContentType', 'facebook_unpublished_content_type'));
      this._appendField(form, 'facebook_no_story', this._pick(options, 'facebookNoStory', 'facebook_no_story'));
      this._appendField(form, 'facebook_secret', this._pick(options, 'facebookSecret', 'facebook_secret'));
      this._appendField(form, 'facebook_collaborators', this._pick(options, 'facebookCollaborators', 'facebook_collaborators'));
    }

    if (!isVideo && !isText) {
      this._appendField(form, 'facebook_alt_text', this._pick(options, 'facebookAltText', 'facebook_alt_text'));
      // POSTS (default) or STORIES for a Page photo story.
      this._appendField(form, 'facebook_media_type', this._pick(options, 'facebookMediaType', 'facebook_media_type'));
    }

    if (isText && options.facebookLinkUrl) {
      form.append('facebook_link_url', options.facebookLinkUrl);
    }
    if (isText) {
      this._appendField(form, 'facebook_call_to_action', this._pick(options, 'facebookCallToAction', 'facebook_call_to_action'));
      this._appendField(form, 'facebook_child_attachments', this._pick(options, 'facebookChildAttachments', 'facebook_child_attachments'));
      this._appendField(form, 'facebook_multi_share_end_card', this._pick(options, 'facebookMultiShareEndCard', 'facebook_multi_share_end_card'));
    }
  }

  /**
   * Add Pinterest-specific parameters
   * @private
   */
  _addPinterestParams(form, options, isVideo = false) {
    if (options.pinterestBoardId) form.append('pinterest_board_id', options.pinterestBoardId);
    if (options.pinterestAltText) form.append('pinterest_alt_text', options.pinterestAltText);
    if (options.pinterestLink) form.append('pinterest_link', options.pinterestLink);
    this._appendField(form, 'pinterest_board_section_id', this._pick(options, 'pinterestBoardSectionId', 'pinterest_board_section_id'));
    this._appendField(form, 'pinterest_ai_disclosures', this._pick(options, 'pinterestAiDisclosures', 'pinterest_ai_disclosures'));
    this._appendField(form, 'pinterest_sponsor_id', this._pick(options, 'pinterestSponsorId', 'pinterest_sponsor_id'));

    if (!isVideo) {
      this._appendRepeated(form, 'pinterest_carousel_titles[]', this._pick(options, 'pinterestCarouselTitles', 'pinterest_carousel_titles'));
      this._appendRepeated(form, 'pinterest_carousel_descriptions[]', this._pick(options, 'pinterestCarouselDescriptions', 'pinterest_carousel_descriptions'));
      this._appendRepeated(form, 'pinterest_carousel_links[]', this._pick(options, 'pinterestCarouselLinks', 'pinterest_carousel_links'));
      this._appendField(form, 'pinterest_carousel_index', this._pick(options, 'pinterestCarouselIndex', 'pinterest_carousel_index'));
    }

    if (isVideo) {
      if (options.pinterestCoverImageUrl) form.append('pinterest_cover_image_url', options.pinterestCoverImageUrl);
      if (options.pinterestCoverImageContentType) form.append('pinterest_cover_image_content_type', options.pinterestCoverImageContentType);
      if (options.pinterestCoverImageData) form.append('pinterest_cover_image_data', options.pinterestCoverImageData);
      if (options.pinterestCoverImageKeyFrameTime !== undefined) form.append('pinterest_cover_image_key_frame_time', options.pinterestCoverImageKeyFrameTime);
    }
  }

  /**
   * Add X (Twitter) specific parameters
   * @private
   */
  _addXParams(form, options, isText = false) {
    if (options.xReplySettings && options.xReplySettings !== 'everyone') form.append('reply_settings', options.xReplySettings);
    if (options.xNullcast !== undefined) form.append('nullcast', String(options.xNullcast));
    if (options.xQuoteTweetId) form.append('quote_tweet_id', options.xQuoteTweetId);
    if (options.xGeoPlaceId) form.append('geo_place_id', options.xGeoPlaceId);
    if (options.xForSuperFollowersOnly !== undefined) form.append('for_super_followers_only', String(options.xForSuperFollowersOnly));
    if (options.xCommunityId) form.append('community_id', options.xCommunityId);
    if (options.xShareWithFollowers !== undefined) form.append('share_with_followers', String(options.xShareWithFollowers));
    if (options.xDirectMessageDeepLink) form.append('direct_message_deep_link', options.xDirectMessageDeepLink);
    if (options.xLongTextAsPost !== undefined) form.append('x_long_text_as_post', String(options.xLongTextAsPost));
    this._appendField(form, 'x_paid_partnership', this._pick(options, 'xPaidPartnership', 'x_paid_partnership'));

    if (!isText) {
      if (options.xTaggedUserIds) {
        const ids = Array.isArray(options.xTaggedUserIds) ? options.xTaggedUserIds : options.xTaggedUserIds.split(',').map(t => t.trim());
        ids.forEach(id => form.append('tagged_user_ids[]', id));
      }
      if (options.xPlaceId) form.append('place_id', options.xPlaceId);
      if (options.xThreadImageLayout) form.append('x_thread_image_layout', options.xThreadImageLayout);
      this._appendField(form, 'x_alt_text', this._pick(options, 'xAltText', 'x_alt_text'));
      this._appendField(form, 'x_subtitles_url', this._pick(options, 'xSubtitlesUrl', 'x_subtitles_url'));
      this._appendField(form, 'x_subtitles', this._pick(options, 'xSubtitles', 'x_subtitles'));
      this._appendField(form, 'x_subtitles_language', this._pick(options, 'xSubtitlesLanguage', 'x_subtitles_language'));
      this._appendField(form, 'x_subtitles_name', this._pick(options, 'xSubtitlesName', 'x_subtitles_name'));
      // AI-media disclosure (X "made_with_ai"); is_ai_generated is the cross-platform alias.
      this._appendField(form, 'made_with_ai', this._pick(options, 'xMadeWithAi', 'madeWithAi', 'made_with_ai', 'isAiGenerated', 'is_ai_generated'));
    } else {
      if (options.xPostUrl) form.append('post_url', options.xPostUrl);
      if (options.xCardUri) form.append('card_uri', options.xCardUri);

      // Poll options
      if (options.xPollOptions) {
        const pollOpts = Array.isArray(options.xPollOptions) ? options.xPollOptions : options.xPollOptions.split(',').map(t => t.trim());
        pollOpts.forEach(opt => form.append('poll_options[]', opt));
        if (options.xPollDuration) form.append('poll_duration', options.xPollDuration);
        if (options.xPollReplySettings) form.append('poll_reply_settings', options.xPollReplySettings);
      }
      this._appendField(form, 'x_article_title', this._pick(options, 'xArticleTitle', 'x_article_title'));
      this._appendField(form, 'x_article_body', this._pick(options, 'xArticleBody', 'x_article_body'));
      this._appendField(form, 'x_article_content_state', this._pick(options, 'xArticleContentState', 'x_article_content_state'));
      this._appendField(form, 'x_article_draft', this._pick(options, 'xArticleDraft', 'x_article_draft'));
      this._appendFileField(form, 'x_article_cover_media', this._pick(options, 'xArticleCoverMedia', 'x_article_cover_media'));
    }
  }

  /**
   * Add Threads-specific parameters
   * @private
   */
  _addThreadsParams(form, options) {
    if (options.threadsLongTextAsPost !== undefined) form.append('threads_long_text_as_post', String(options.threadsLongTextAsPost));
    if (options.threadsThreadMediaLayout) form.append('threads_thread_media_layout', options.threadsThreadMediaLayout);
    if (options.threadsTopicTag) form.append('threads_topic_tag', options.threadsTopicTag);
    this._appendField(form, 'threads_reply_control', this._pick(options, 'threadsReplyControl', 'threads_reply_control'));
    this._appendField(form, 'threads_alt_text', this._pick(options, 'threadsAltText', 'threads_alt_text'));
    this._appendField(form, 'threads_reply_to_id', this._pick(options, 'threadsReplyToId', 'threads_reply_to_id'));
    this._appendField(form, 'threads_quote_post_id', this._pick(options, 'threadsQuotePostId', 'threads_quote_post_id'));
    this._appendField(form, 'threads_link_attachment', this._pick(options, 'threadsLinkAttachment', 'threads_link_attachment'));
    this._appendField(form, 'threads_poll_options', this._pick(options, 'threadsPollOptions', 'threads_poll_options'));
    this._appendField(form, 'threads_auto_publish_text', this._pick(options, 'threadsAutoPublishText', 'threads_auto_publish_text'));
  }

  /**
   * Add Google Business Profile parameters
   *
   * gbpLocationId is required for accounts with more than one location; the API
   * only auto-selects when exactly one location exists.
   *
   * gbpPostType switches the call from the default Local Post to a gallery
   * photo upload (MEDIA / PHOTO / GALLERY). Any other value, or omitting it,
   * keeps the Local Post behaviour.
   * @private
   */
  _addGoogleBusinessParams(form, options) {
    if (options.gbpLocationId) form.append('gbp_location_id', options.gbpLocationId);
    if (options.gbpPostType) form.append('gbp_post_type', String(options.gbpPostType).toUpperCase());
    if (options.gbpMediaCategory) form.append('gbp_media_category', String(options.gbpMediaCategory).toUpperCase());
    if (options.gbpTopicType) form.append('gbp_topic_type', String(options.gbpTopicType).toUpperCase());
    // One URL, or several (photos only, with gbpMultiMedia) as gbp_media_url[].
    if (Array.isArray(options.gbpMediaUrl)) this._appendRepeated(form, 'gbp_media_url[]', options.gbpMediaUrl);
    else if (options.gbpMediaUrl) form.append('gbp_media_url', options.gbpMediaUrl);
    if (options.gbpMediaFormat) form.append('gbp_media_format', String(options.gbpMediaFormat).toUpperCase());
    if (options.gbpCtaType) form.append('gbp_cta_type', String(options.gbpCtaType).toUpperCase());
    if (options.gbpCtaUrl) form.append('gbp_cta_url', options.gbpCtaUrl);
    if (options.gbpEventTitle) form.append('gbp_event_title', options.gbpEventTitle);
    if (options.gbpEventStartDate) form.append('gbp_event_start_date', options.gbpEventStartDate);
    if (options.gbpEventStartTime) form.append('gbp_event_start_time', options.gbpEventStartTime);
    if (options.gbpEventEndDate) form.append('gbp_event_end_date', options.gbpEventEndDate);
    if (options.gbpEventEndTime) form.append('gbp_event_end_time', options.gbpEventEndTime);
    if (options.gbpOfferCoupon) form.append('gbp_offer_coupon', options.gbpOfferCoupon);
    if (options.gbpOfferRedeemUrl) form.append('gbp_offer_redeem_url', options.gbpOfferRedeemUrl);
    if (options.gbpOfferTerms) form.append('gbp_offer_terms', options.gbpOfferTerms);
    this._appendField(form, 'gbp_language_code', this._pick(options, 'gbpLanguageCode', 'gbp_language_code'));
    this._appendField(form, 'gbp_coupon_code', this._pick(options, 'gbpCouponCode', 'gbp_coupon_code'));
    this._appendField(form, 'gbp_redeem_url', this._pick(options, 'gbpRedeemUrl', 'gbp_redeem_url'));
    this._appendField(form, 'gbp_terms', this._pick(options, 'gbpTerms', 'gbp_terms'));
    for (const [field, key] of [
      ['gbp_alert_type', 'gbpAlertType'],
      ['gbp_upload_to_gallery', 'gbpUploadToGallery'],
      ['gbp_multi_media', 'gbpMultiMedia'],
      ['gbp_recurrence', 'gbpRecurrence'],
      ['gbp_recurrence_days', 'gbpRecurrenceDays'],
      ['gbp_recurrence_day_of_month', 'gbpRecurrenceDayOfMonth'],
      ['gbp_recurrence_week_occurrence', 'gbpRecurrenceWeekOccurrence'],
      ['gbp_recurrence_end', 'gbpRecurrenceEnd'],
      ['gbp_scheduled_time', 'gbpScheduledTime'],
    ]) {
      this._appendField(form, field, this._pick(options, key, field));
    }
  }

  /**
   * Add Reddit-specific parameters
   * @private
   */
  _addRedditParams(form, options, isText = false) {
    if (options.redditSubreddit) form.append('subreddit', options.redditSubreddit);
    if (options.redditFlairId) form.append('flair_id', options.redditFlairId);
    if (isText && (options.redditLinkUrl || options.linkUrl)) {
      form.append('reddit_link_url', options.redditLinkUrl || options.linkUrl);
    }
    this._appendField(form, 'reddit_nsfw', this._pick(options, 'redditNsfw', 'reddit_nsfw'));
    this._appendField(form, 'reddit_spoiler', this._pick(options, 'redditSpoiler', 'reddit_spoiler'));
    this._appendField(form, 'reddit_resubmit', this._pick(options, 'redditResubmit', 'reddit_resubmit'));
    this._appendField(form, 'reddit_send_replies', this._pick(options, 'redditSendReplies', 'reddit_send_replies'));
    this._appendField(form, 'reddit_flair_text', this._pick(options, 'redditFlairText', 'reddit_flair_text'));
    this._appendField(form, 'reddit_gallery_captions', this._pick(options, 'redditGalleryCaptions', 'reddit_gallery_captions'));
    this._appendField(form, 'reddit_gallery_urls', this._pick(options, 'redditGalleryUrls', 'reddit_gallery_urls'));
  }

  /**
   * Add Bluesky-specific parameters
   * @private
   */
  _addBlueskyParams(form, options) {
    this._appendField(form, 'bluesky_alt_text', this._pick(options, 'blueskyAltText', 'bluesky_alt_text'));
    this._appendField(form, 'bluesky_langs', this._pick(options, 'blueskyLangs', 'bluesky_langs'));
    this._appendField(form, 'bluesky_labels', this._pick(options, 'blueskyLabels', 'bluesky_labels'));
    this._appendField(form, 'bluesky_gallery', this._pick(options, 'blueskyGallery', 'bluesky_gallery'));
    this._appendField(form, 'bluesky_threadgate', this._pick(options, 'blueskyThreadgate', 'bluesky_threadgate', 'blueskyReplySettings', 'bluesky_reply_settings'));
    this._appendField(form, 'bluesky_postgate', this._pick(options, 'blueskyPostgate', 'bluesky_postgate', 'blueskyQuoteSettings', 'bluesky_quote_settings'));
    this._appendField(form, 'bluesky_quote_uri', this._pick(options, 'blueskyQuoteUri', 'bluesky_quote_uri', 'blueskyQuoteId', 'bluesky_quote_id', 'blueskyQuoteUrl', 'bluesky_quote_url'));
    for (const [field, key] of [
      ['bluesky_tags', 'blueskyTags'],
      ['bluesky_created_at', 'blueskyCreatedAt'],
      ['bluesky_thread_overflow', 'blueskyThreadOverflow'],
      ['bluesky_gif_as_video', 'blueskyGifAsVideo'],
      ['bluesky_captions', 'blueskyCaptions'],
      ['bluesky_video_presentation', 'blueskyVideoPresentation'],
    ]) {
      this._appendField(form, field, this._pick(options, key, field));
    }
  }

  /**
   * Add Discord-specific parameters
   * @private
   */
  _addDiscordParams(form, options) {
    this._appendField(form, 'discord_thread_id', this._pick(options, 'discordThreadId', 'discord_thread_id'));
    this._appendField(form, 'discord_thread_name', this._pick(options, 'discordThreadName', 'discord_thread_name'));
    this._appendField(form, 'discord_applied_tags', this._pick(options, 'discordAppliedTags', 'discord_applied_tags'));
    this._appendField(form, 'discord_embeds', this._pick(options, 'discordEmbeds', 'discord_embeds'));
    this._appendField(form, 'discord_username', this._pick(options, 'discordUsername', 'discord_username'));
    this._appendField(form, 'discord_avatar_url', this._pick(options, 'discordAvatarUrl', 'discord_avatar_url'));
    this._appendField(form, 'discord_allowed_mentions', this._pick(options, 'discordAllowedMentions', 'discord_allowed_mentions'));
    this._appendField(form, 'discord_alt_text', this._pick(options, 'discordAltText', 'discord_alt_text'));
    this._appendField(form, 'discord_flags', this._pick(options, 'discordFlags', 'discord_flags'));
    this._appendField(form, 'discord_tts', this._pick(options, 'discordTts', 'discord_tts'));
    this._appendField(form, 'discord_poll', this._pick(options, 'discordPoll', 'discord_poll'));
    this._appendField(form, 'discord_max_file_mb', this._pick(options, 'discordMaxFileMb', 'discord_max_file_mb'));
  }

  /**
   * Add Telegram-specific parameters
   * @private
   */
  _addTelegramParams(form, options) {
    this._appendField(form, 'telegram_parse_mode', this._pick(options, 'telegramParseMode', 'telegram_parse_mode'));
    this._appendField(form, 'telegram_message_thread_id', this._pick(options, 'telegramMessageThreadId', 'telegram_message_thread_id'));
    this._appendField(form, 'telegram_disable_notification', this._pick(options, 'telegramDisableNotification', 'telegram_disable_notification'));
    this._appendField(form, 'telegram_protect_content', this._pick(options, 'telegramProtectContent', 'telegram_protect_content'));
    this._appendField(form, 'telegram_has_spoiler', this._pick(options, 'telegramHasSpoiler', 'telegram_has_spoiler'));
    this._appendField(form, 'telegram_link_preview', this._pick(options, 'telegramLinkPreview', 'telegram_link_preview'));
    this._appendField(form, 'telegram_reply_markup', this._pick(options, 'telegramReplyMarkup', 'telegram_reply_markup'));
    this._appendField(form, 'telegram_caption_overflow', this._pick(options, 'telegramCaptionOverflow', 'telegram_caption_overflow'));
    this._appendField(form, 'telegram_as_document', this._pick(options, 'telegramAsDocument', 'telegram_as_document'));
    this._appendField(form, 'telegram_media_urls', this._pick(options, 'telegramMediaUrls', 'telegram_media_urls'));
    // Bot API 10.4 options. JSON objects keep Telegram's own shape
    // (ReplyParameters, LinkPreviewOptions, MessageEntity, InputPollOption...).
    for (const [field, key] of [
      ['telegram_pin', 'telegramPin'],
      ['telegram_pin_notify', 'telegramPinNotify'],
      ['telegram_poll', 'telegramPoll'],
      ['telegram_location', 'telegramLocation'],
      ['telegram_venue', 'telegramVenue'],
      ['telegram_contact', 'telegramContact'],
      ['telegram_dice', 'telegramDice'],
      ['telegram_game_short_name', 'telegramGameShortName'],
      ['telegram_rich_message', 'telegramRichMessage'],
      ['telegram_reply_to_message_id', 'telegramReplyToMessageId'],
      ['telegram_reply_quote', 'telegramReplyQuote'],
      ['telegram_reply_parameters', 'telegramReplyParameters'],
      ['telegram_link_preview_options', 'telegramLinkPreviewOptions'],
      ['telegram_entities', 'telegramEntities'],
      ['telegram_caption_entities', 'telegramCaptionEntities'],
      ['telegram_show_caption_above_media', 'telegramShowCaptionAboveMedia'],
      ['telegram_first_comment_as_reply', 'telegramFirstCommentAsReply'],
      ['telegram_direct_messages_topic_id', 'telegramDirectMessagesTopicId'],
      ['telegram_suggested_post_parameters', 'telegramSuggestedPostParameters'],
      ['telegram_ephemeral_message_parameters', 'telegramEphemeralMessageParameters'],
      ['telegram_message_effect_id', 'telegramMessageEffectId'],
      ['telegram_send_by_url', 'telegramSendByUrl'],
      ['telegram_send_as', 'telegramSendAs'],
      ['telegram_paid_star_count', 'telegramPaidStarCount'],
      ['telegram_paid_payload', 'telegramPaidPayload'],
      ['telegram_start_timestamp', 'telegramStartTimestamp'],
      ['telegram_disable_content_type_detection', 'telegramDisableContentTypeDetection'],
      ['telegram_performer', 'telegramPerformer'],
      ['telegram_title_audio', 'telegramTitleAudio'],
      ['telegram_duration', 'telegramDuration'],
      ['telegram_length', 'telegramLength'],
      ['telegram_emoji', 'telegramEmoji'],
    ]) {
      this._appendField(form, field, this._pick(options, key, field));
    }
    // Files (local path, stream or Buffer) or URLs / file_ids.
    for (const [field, key] of [
      ['telegram_cover', 'telegramCover'],
      ['telegram_thumbnail', 'telegramThumbnail'],
      ['telegram_live_photo_photo', 'telegramLivePhotoPhoto'],
    ]) {
      this._appendFileField(form, field, this._pick(options, key, field));
    }
  }

  /**
   * Add Mastodon-specific parameters
   * @private
   */
  _addMastodonParams(form, options) {
    this._appendField(form, 'mastodon_visibility', this._pick(options, 'mastodonVisibility', 'mastodon_visibility'));
    this._appendField(form, 'mastodon_sensitive', this._pick(options, 'mastodonSensitive', 'mastodon_sensitive'));
    this._appendField(form, 'mastodon_spoiler_text', this._pick(options, 'mastodonSpoilerText', 'mastodon_spoiler_text'));
    this._appendField(form, 'mastodon_language', this._pick(options, 'mastodonLanguage', 'mastodon_language'));
    this._appendField(form, 'mastodon_alt_text', this._pick(options, 'mastodonAltText', 'mastodon_alt_text'));
    this._appendField(form, 'mastodon_poll_options', this._pick(options, 'mastodonPollOptions', 'mastodon_poll_options'));
    this._appendField(form, 'mastodon_poll_expires_in', this._pick(options, 'mastodonPollExpiresIn', 'mastodon_poll_expires_in'));
    this._appendField(form, 'mastodon_poll_multiple', this._pick(options, 'mastodonPollMultiple', 'mastodon_poll_multiple'));
    this._appendField(form, 'mastodon_scheduled_at', this._pick(options, 'mastodonScheduledAt', 'mastodon_scheduled_at'));
  }

  /**
   * Add WordPress-specific parameters
   * @private
   */
  _addWordpressParams(form, options) {
    this._appendField(form, 'wordpress_status', this._pick(options, 'wordpressStatus', 'wordpress_status'));
    this._appendField(form, 'wordpress_date', this._pick(options, 'wordpressDate', 'wordpress_date'));
    this._appendField(form, 'wordpress_categories', this._pick(options, 'wordpressCategories', 'wordpress_categories'));
    this._appendField(form, 'wordpress_tags', this._pick(options, 'wordpressTags', 'wordpress_tags'));
    this._appendField(form, 'wordpress_excerpt', this._pick(options, 'wordpressExcerpt', 'wordpress_excerpt'));
    this._appendField(form, 'wordpress_slug', this._pick(options, 'wordpressSlug', 'wordpress_slug'));
    this._appendField(form, 'wordpress_alt_text', this._pick(options, 'wordpressAltText', 'wordpress_alt_text'));
    this._appendField(form, 'wordpress_media_caption', this._pick(options, 'wordpressMediaCaption', 'wordpress_media_caption'));
    this._appendField(form, 'wordpress_block_format', this._pick(options, 'wordpressBlockFormat', 'wordpress_block_format'));
  }

  /**
   * Add Lemmy-specific parameters
   * @private
   */
  _addLemmyParams(form, options) {
    this._appendField(form, 'lemmy_url', this._pick(options, 'lemmyUrl', 'lemmy_url'));
    this._appendField(form, 'lemmy_community', this._pick(options, 'lemmyCommunity', 'lemmy_community'));
    this._appendField(form, 'lemmy_nsfw', this._pick(options, 'lemmyNsfw', 'lemmy_nsfw'));
    this._appendField(form, 'lemmy_language_id', this._pick(options, 'lemmyLanguageId', 'lemmy_language_id'));
    this._appendField(form, 'lemmy_alt_text', this._pick(options, 'lemmyAltText', 'lemmy_alt_text'));
  }

  /**
   * Add Slack-specific parameters
   * @private
   */
  _addSlackParams(form, options) {
    this._appendField(form, 'slack_markdown', this._pick(options, 'slackMarkdown', 'slack_markdown'));
    this._appendField(form, 'slack_blocks', this._pick(options, 'slackBlocks', 'slack_blocks'));
    this._appendField(form, 'slack_mrkdwn', this._pick(options, 'slackMrkdwn', 'slack_mrkdwn'));
    this._appendField(form, 'slack_alt_text', this._pick(options, 'slackAltText', 'slack_alt_text'));
    this._appendField(form, 'slack_first_comment_mode', this._pick(options, 'slackFirstCommentMode', 'slack_first_comment_mode'));
  }

  /**
   * Add Nostr-specific parameters
   * @private
   */
  _addNostrParams(form, options) {
    this._appendField(form, 'nostr_kind', this._pick(options, 'nostrKind', 'nostr_kind'));
    this._appendField(form, 'nostr_long_form', this._pick(options, 'nostrLongForm', 'nostr_long_form'));
  }

  /**
   * Add Dev.to-specific parameters
   * @private
   */
  _addDevtoParams(form, options) {
    this._appendField(form, 'devto_tags', this._pick(options, 'devtoTags', 'devto_tags'));
    this._appendField(form, 'devto_canonical_url', this._pick(options, 'devtoCanonicalUrl', 'devto_canonical_url'));
    this._appendField(form, 'devto_description', this._pick(options, 'devtoDescription', 'devto_description'));
    this._appendField(form, 'devto_main_image', this._pick(options, 'devtoMainImage', 'devto_main_image'));
    this._appendField(form, 'devto_series', this._pick(options, 'devtoSeries', 'devto_series'));
    this._appendField(form, 'devto_published', this._pick(options, 'devtoPublished', 'devto_published'));
  }

  /**
   * Add Hashnode-specific parameters
   * @private
   */
  _addHashnodeParams(form, options) {
    this._appendField(form, 'hashnode_tags', this._pick(options, 'hashnodeTags', 'hashnode_tags'));
    this._appendField(form, 'hashnode_original_article_url', this._pick(options, 'hashnodeOriginalArticleUrl', 'hashnode_original_article_url'));
    this._appendField(form, 'hashnode_subtitle', this._pick(options, 'hashnodeSubtitle', 'hashnode_subtitle'));
    this._appendField(form, 'hashnode_cover_image_url', this._pick(options, 'hashnodeCoverImageUrl', 'hashnode_cover_image_url'));
    this._appendField(form, 'hashnode_draft', this._pick(options, 'hashnodeDraft', 'hashnode_draft'));
    this._appendField(form, 'hashnode_body', this._pick(options, 'hashnodeBody', 'hashnode_body', 'content'));
  }

  /**
   * Add Whop-specific parameters
   * @private
   */
  _addWhopParams(form, options) {
    this._appendField(form, 'whop_body', this._pick(options, 'whopBody', 'whop_body'));
    this._appendField(form, 'whop_pinned', this._pick(options, 'whopPinned', 'whop_pinned'));
    this._appendField(form, 'whop_is_mention', this._pick(options, 'whopIsMention', 'whop_is_mention'));
    this._appendField(form, 'whop_paywall_amount', this._pick(options, 'whopPaywallAmount', 'whop_paywall_amount'));
    this._appendField(form, 'whop_paywall_currency', this._pick(options, 'whopPaywallCurrency', 'whop_paywall_currency'));
    this._appendField(form, 'whop_attachment_ids', this._pick(options, 'whopAttachmentIds', 'whop_attachment_ids'));
  }

  /**
   * Add Listmonk-specific parameters
   * @private
   */
  _addListmonkParams(form, options) {
    this._appendField(form, 'listmonk_content_type', this._pick(options, 'listmonkContentType', 'listmonk_content_type'));
    this._appendField(form, 'listmonk_send_at', this._pick(options, 'listmonkSendAt', 'listmonk_send_at'));
    this._appendField(form, 'listmonk_lists', this._pick(options, 'listmonkLists', 'listmonk_lists'));
    this._appendField(form, 'listmonk_template_id', this._pick(options, 'listmonkTemplateId', 'listmonk_template_id'));
    this._appendField(form, 'listmonk_media_ids', this._pick(options, 'listmonkMediaIds', 'listmonk_media_ids'));
  }

  /**
   * Credential-channel and Bluesky helpers. Called from every upload verb so
   * unlisted fields are not dropped when those platforms are in `platforms`.
   * @private
   */
  _addCredentialPlatformParams(form, options) {
    const platforms = Array.isArray(options.platforms) ? options.platforms : [options.platforms];
    if (platforms.includes('bluesky')) this._addBlueskyParams(form, options);
    if (platforms.includes('discord')) this._addDiscordParams(form, options);
    if (platforms.includes('telegram')) this._addTelegramParams(form, options);
    if (platforms.includes('mastodon')) this._addMastodonParams(form, options);
    if (platforms.includes('wordpress')) this._addWordpressParams(form, options);
    if (platforms.includes('lemmy')) this._addLemmyParams(form, options);
    if (platforms.includes('slack')) this._addSlackParams(form, options);
    if (platforms.includes('nostr')) this._addNostrParams(form, options);
    if (platforms.includes('devto')) this._addDevtoParams(form, options);
    if (platforms.includes('hashnode')) this._addHashnodeParams(form, options);
    if (platforms.includes('whop')) this._addWhopParams(form, options);
    if (platforms.includes('listmonk')) this._addListmonkParams(form, options);
  }

  /**
   * Upload a video to social media platforms
   * 
   * @param {string} videoPathOrUrl - Path to video file or video URL
   * @param {Object} options - Upload options
   * @param {string} options.title - Video title/caption
   * @param {string} options.user - User identifier (profile name)
   * @param {string[]} options.platforms - Target platforms (tiktok, instagram, youtube, linkedin, facebook, pinterest, threads, bluesky, x, discord, telegram)
   * @param {string} [options.description] - Video description
   * @param {string} [options.firstComment] - First comment to post
   * @param {string} [options.scheduledDate] - ISO date for scheduling (e.g., "2024-12-25T10:00:00Z")
   * @param {string} [options.timezone] - Timezone for scheduled date (e.g., "Europe/Madrid")
   * @param {boolean} [options.addToQueue] - Add to posting queue instead of immediate post
   * @param {boolean} [options.asyncUpload=true] - Process upload asynchronously
   * 
   * TikTok options:
   * @param {string} [options.tiktokPrivacyLevel] - PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, SELF_ONLY. TikTok decides per account which of these are available (a private account has no PUBLIC_TO_EVERYONE); asking for another one fails with error_code tiktok_privacy_unavailable listing the allowed ones. Omit it to keep the account's own default.
   * @param {boolean} [options.tiktokDisableDuet] - Disable duet
   * @param {boolean} [options.tiktokDisableComment] - Disable comments
   * @param {boolean} [options.tiktokDisableStitch] - Disable stitch
   * @param {number} [options.tiktokCoverTimestamp] - Timestamp in ms for video cover
   * @param {boolean} [options.tiktokIsAigc] - AI-generated content flag
   * @param {string} [options.tiktokPostMode] - DIRECT_POST or MEDIA_UPLOAD. MEDIA_UPLOAD is the same draft as tiktokUploadToDraft
   * @param {boolean} [options.brandContentToggle] - Branded content toggle
   * @param {boolean} [options.brandOrganicToggle] - Brand organic toggle
   * @param {boolean} [options.tiktokIsAdsOnly] - Only show the video in ads
   * @param {string} [options.tiktokTtoInviteLink] - TikTok One invite link (requires branded content)
   *
   * TikTok music, location, cover and draft options. Available on connections that
   * declare the matching `capabilities` (music, location, cover_image, draft) on the
   * TikTok account returned by listUsers() / GET /api/uploadposts/users. If your
   * connection does not have it, the field is ignored, the post still publishes, and
   * the response includes a per-field `warnings` entry — reconnect the TikTok account
   * to enable it.
   * @param {string} [options.tiktokMusicId] - Commercial Music Library track id (see getTiktokTrendingMusic)
   * @param {number} [options.tiktokMusicVolume] - Music volume 0-100 (defaults to 50 when music is set)
   * @param {number} [options.tiktokMusicStart] - Music start offset in ms
   * @param {number} [options.tiktokMusicEnd] - Music end offset in ms
   * @param {number} [options.tiktokOriginalSoundVolume] - Original video audio volume 0-100 (defaults to 50 when music is set, so the original audio is not muted)
   * @param {string} [options.tiktokLocationId] - Location id (see getTiktokLocations)
   * @param {string} [options.tiktokLocationName] - Location name, required whenever tiktokLocationId is set
   * @param {string} [options.tiktokCoverImageUrl] - Custom cover image URL
   * @param {boolean} [options.tiktokIsAiGenerated] - AI-generated content disclosure
   * @param {boolean} [options.tiktokUploadToDraft] - Publish to drafts (same as postMode MEDIA_UPLOAD). When true TikTok ignores the rest of the post settings
   *
   * Instagram options:
   * @param {string} [options.instagramMediaType] - REELS or STORIES
   * @param {boolean} [options.instagramShareToFeed] - Share to feed
   * @param {string} [options.instagramCollaborators] - Comma-separated collaborator usernames
   * @param {string|Buffer|ReadableStream} [options.instagramCoverUrl] - Custom cover: URL string, file path, Buffer, or ReadableStream
   * @param {string} [options.instagramAudioName] - Audio track name
   * @param {string} [options.instagramUserTags] - Comma-separated user tags
   * @param {string} [options.instagramLocationId] - Location ID
   * @param {string} [options.instagramThumbOffset] - Thumbnail offset
   * 
   * YouTube options:
   * @param {string|string[]} [options.youtubeTags] - Video tags
   * @param {string} [options.youtubeCategoryId] - Category ID (e.g., "22" for People & Blogs)
   * @param {string} [options.youtubePrivacyStatus] - public, unlisted, or private
   * @param {boolean} [options.youtubeEmbeddable] - Allow embedding
   * @param {string} [options.youtubeLicense] - youtube or creativeCommon
   * @param {boolean} [options.youtubePublicStatsViewable] - Show public stats
   * @param {string} [options.youtubeThumbnailUrl] - Custom thumbnail URL
   * @param {boolean} [options.youtubeSelfDeclaredMadeForKids] - Made for kids flag
   * @param {boolean} [options.youtubeContainsSyntheticMedia] - AI/synthetic content flag
   * @param {string} [options.youtubeDefaultLanguage] - Title/description language (BCP-47)
   * @param {string} [options.youtubeDefaultAudioLanguage] - Audio language (BCP-47)
   * @param {string} [options.youtubeAllowedCountries] - Comma-separated country codes
   * @param {string} [options.youtubeBlockedCountries] - Comma-separated country codes
   * @param {boolean} [options.youtubeHasPaidProductPlacement] - Paid placement flag
   * @param {string} [options.youtubeRecordingDate] - Recording date (ISO 8601)
   * 
   * LinkedIn options:
   * @param {string} [options.linkedinVisibility] - PUBLIC, CONNECTIONS, LOGGED_IN, CONTAINER
   * @param {string} [options.targetLinkedinPageId] - Page ID for organization posts
   * 
   * Facebook options:
   * @param {string} [options.facebookPageId] - Facebook Page ID
   * @param {string} [options.facebookVideoState] - PUBLISHED or DRAFT
   * @param {string} [options.facebookMediaType] - REELS, STORIES, or VIDEO
   * @param {string} [options.thumbnailUrl] - Thumbnail URL for normal page videos (VIDEO type only)
   *
   * Pinterest options:
   * @param {string} [options.pinterestBoardId] - Board ID
   * @param {string} [options.pinterestLink] - Destination link
   * @param {string} [options.pinterestCoverImageUrl] - Cover image URL
   * @param {number} [options.pinterestCoverImageKeyFrameTime] - Key frame time in ms
   * 
   * X (Twitter) options:
   * @param {string} [options.xReplySettings] - everyone, following, mentionedUsers, subscribers, verified
   * @param {boolean} [options.xNullcast] - Promoted-only post
   * @param {string|string[]} [options.xTaggedUserIds] - User IDs to tag
   * @param {string} [options.xPlaceId] - Location place ID
   * @param {string} [options.xGeoPlaceId] - Geographic place ID
   * @param {boolean} [options.xForSuperFollowersOnly] - Exclusive for super followers
   * @param {string} [options.xCommunityId] - Community ID
   * @param {boolean} [options.xShareWithFollowers] - Share community post with followers
   * @param {boolean} [options.xLongTextAsPost] - Post long text as single post
   * 
   * Threads options:
   * @param {boolean} [options.threadsLongTextAsPost] - Post long text as single post (vs thread)
   * @param {string} [options.threadsThreadMediaLayout] - Comma-separated list of how many media items per Threads post (e.g. "5,5")
   * @param {string} [options.threadsTopicTag] - Topic tag for the Threads post (1-50 chars, no periods or ampersands)
   *
   * @returns {Promise<Object>} API response with request_id for async uploads
   */
  async upload(videoPathOrUrl, options) {
    const form = new FormData();

    // Handle video (file path or URL)
    if (typeof videoPathOrUrl === 'string' && (videoPathOrUrl.toLowerCase().startsWith('http://') || videoPathOrUrl.toLowerCase().startsWith('https://'))) {
      form.append('video', videoPathOrUrl);
    } else {
      if (!fs.existsSync(videoPathOrUrl)) {
        throw new Error(`Video file not found: ${videoPathOrUrl}`);
      }
      form.append('video', createReadStream(videoPathOrUrl));
    }

    this._addCommonParams(form, options);
    
    const platforms = Array.isArray(options.platforms) ? options.platforms : [options.platforms];
    if (platforms.includes('tiktok')) this._addTiktokParams(form, options, true);
    if (platforms.includes('instagram')) this._addInstagramParams(form, options, true);
    if (platforms.includes('youtube')) this._addYoutubeParams(form, options);
    if (platforms.includes('linkedin')) this._addLinkedinParams(form, options);
    if (platforms.includes('facebook')) this._addFacebookParams(form, options, true);
    if (platforms.includes('pinterest')) this._addPinterestParams(form, options, true);
    if (platforms.includes('x')) this._addXParams(form, options, false);
    if (platforms.includes('threads')) this._addThreadsParams(form, options);
    if (platforms.includes('reddit')) this._addRedditParams(form, options);
    if (platforms.includes('google_business')) this._addGoogleBusinessParams(form, options);
    this._addCredentialPlatformParams(form, options);

    // thumbnail_url is one generic API field, read by X, YouTube, LinkedIn and Facebook.
    // The Facebook and YouTube helpers already send it for their platform; send it once
    // here for the rest (X since 2.15.0) without duplicating the field.
    const cover = this._pick(options, 'thumbnailUrl', 'thumbnail_url');
    const coverAlreadySent = (platforms.includes('facebook') && cover)
      || (platforms.includes('youtube') && options.youtubeThumbnailUrl);
    if (cover && !coverAlreadySent) form.append('thumbnail_url', cover);

    return this._request('/upload', 'POST', form, true, this._idempotencyHeaders(options));
  }

  /**
   * Upload photos to social media platforms
   * 
   * @param {string[]} photosPathsOrUrls - Array of photo file paths or URLs
   * @param {Object} options - Upload options
   * @param {string} options.title - Post title/caption
   * @param {string} options.user - User identifier (profile name)
   * @param {string[]} options.platforms - Target platforms (tiktok, instagram, linkedin, facebook, x, threads, pinterest, reddit, bluesky, discord, telegram)
   * @param {string} [options.description] - Photo description
   * @param {string} [options.firstComment] - First comment to post
   * @param {string} [options.altText] - Alt text for accessibility
   * @param {string} [options.scheduledDate] - ISO date for scheduling
   * @param {string} [options.timezone] - Timezone for scheduled date
   * @param {boolean} [options.addToQueue] - Add to posting queue
   * @param {boolean} [options.asyncUpload=true] - Process upload asynchronously
   * 
   * TikTok options:
   * @param {boolean} [options.tiktokAutoAddMusic] - Auto add music
   * @param {boolean} [options.tiktokDisableComment] - Disable comments
   * @param {number} [options.tiktokPhotoCoverIndex] - Index of photo for cover (0-based). Sent as `photo_cover_index`
   * @param {string} [options.tiktokPrivacyLevel] - PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, SELF_ONLY. TikTok requires one on photo posts, so it defaults to PUBLIC_TO_EVERYONE; asking for one the account does not have fails with error_code tiktok_privacy_unavailable listing the allowed ones.
   * @param {boolean} [options.brandContentToggle] - Branded content toggle
   * @param {boolean} [options.brandOrganicToggle] - Brand organic toggle
   *
   * TikTok music, location, AI disclosure and draft on photo posts. TikTok's
   * photo contract takes the track id alone — no volume/trim, no custom cover
   * (those are video-only). `tiktokUploadToDraft` and `postMode: 'MEDIA_UPLOAD'`
   * are the same draft; both are passed through. Available on connections that
   * declare the matching `capabilities` (music, location, draft) on the TikTok
   * account returned by listUsers(); otherwise the field is ignored, the post
   * still publishes, and the response includes a per-field `warnings` entry.
   * @param {string} [options.tiktokMusicId] - Commercial Music Library track id (see getTiktokTrendingMusic)
   * @param {string} [options.tiktokLocationId] - Location id (see getTiktokLocations)
   * @param {string} [options.tiktokLocationName] - Location name, required whenever tiktokLocationId is set
   * @param {boolean} [options.tiktokIsAiGenerated] - AI-generated content disclosure
   * @param {string} [options.tiktokPostMode] - DIRECT_POST or MEDIA_UPLOAD. MEDIA_UPLOAD is the same draft as tiktokUploadToDraft
   * @param {boolean} [options.tiktokUploadToDraft] - Publish to drafts. Same draft as postMode MEDIA_UPLOAD
   * @param {string} [options.instagramAltText] - Alt text for photos (string or list, ≤1000 chars each)
   *
   * Instagram options:
   * @param {string} [options.instagramMediaType] - IMAGE or STORIES
   * @param {string} [options.instagramCollaborators] - Comma-separated collaborator usernames
   * @param {string} [options.instagramUserTags] - Comma-separated user tags
   * @param {string} [options.instagramLocationId] - Location ID
   * 
   * LinkedIn options:
   * @param {string} [options.linkedinVisibility] - PUBLIC (only PUBLIC supported for photos)
   * @param {string} [options.targetLinkedinPageId] - Page ID for organization posts
   * 
   * Facebook options:
   * @param {string} [options.facebookPageId] - Facebook Page ID
   * 
   * Pinterest options:
   * @param {string} [options.pinterestBoardId] - Board ID
   * @param {string} [options.pinterestAltText] - Alt text
   * @param {string} [options.pinterestLink] - Destination link
   * 
   * X (Twitter) options:
   * @param {string} [options.xReplySettings] - Who can reply
   * @param {boolean} [options.xNullcast] - Promoted-only post
   * @param {string|string[]} [options.xTaggedUserIds] - User IDs to tag
   * @param {boolean} [options.xLongTextAsPost] - Post long text as single post
   *
   * Threads options:
   * @param {boolean} [options.threadsLongTextAsPost] - Post long text as single post
   * @param {string} [options.threadsThreadMediaLayout] - Comma-separated list of how many media items per Threads post (e.g. "5,5")
   * @param {string} [options.threadsTopicTag] - Topic tag for the Threads post (1-50 chars, no periods or ampersands)
   *
   * Reddit options (currently unavailable: HTTP 503, error_code=reddit_unavailable):
   * @param {string} [options.redditSubreddit] - Subreddit name (without r/)
   * @param {string} [options.redditFlairId] - Flair template ID
   *
   * @returns {Promise<Object>} API response
   */
  async uploadPhotos(photosPathsOrUrls, options) {
    const form = new FormData();

    // Handle photos (file paths or URLs)
    for (const photoItem of photosPathsOrUrls) {
      if (typeof photoItem === 'string' && (photoItem.toLowerCase().startsWith('http://') || photoItem.toLowerCase().startsWith('https://'))) {
        form.append('photos[]', photoItem);
      } else {
        if (!fs.existsSync(photoItem)) {
          throw new Error(`Photo file not found: ${photoItem}`);
        }
        form.append('photos[]', createReadStream(photoItem));
      }
    }

    this._addCommonParams(form, options);
    
    const platforms = Array.isArray(options.platforms) ? options.platforms : [options.platforms];
    if (platforms.includes('tiktok')) this._addTiktokParams(form, options, false);
    if (platforms.includes('instagram')) this._addInstagramParams(form, options, false);
    if (platforms.includes('linkedin')) this._addLinkedinParams(form, options);
    if (platforms.includes('facebook')) this._addFacebookParams(form, options, false);
    if (platforms.includes('pinterest')) this._addPinterestParams(form, options, false);
    if (platforms.includes('x')) this._addXParams(form, options, false);
    if (platforms.includes('threads')) this._addThreadsParams(form, options);
    if (platforms.includes('reddit')) this._addRedditParams(form, options);
    if (platforms.includes('google_business')) this._addGoogleBusinessParams(form, options);
    this._addCredentialPlatformParams(form, options);

    return this._request('/upload_photos', 'POST', form, true, this._idempotencyHeaders(options));
  }

  /**
   * Upload text posts to social media platforms
   * 
   * @param {Object} options - Upload options
   * @param {string} options.title - Text content for the post
   * @param {string} options.user - User identifier (profile name)
   * @param {string[]} options.platforms - Target platforms (x, linkedin, facebook, threads, reddit, bluesky, discord, telegram)
   * @param {string} [options.firstComment] - First comment to post
   * @param {string} [options.scheduledDate] - ISO date for scheduling
   * @param {string} [options.timezone] - Timezone for scheduled date
   * @param {boolean} [options.addToQueue] - Add to posting queue
   * @param {boolean} [options.asyncUpload=true] - Process upload asynchronously
   * @param {string} [options.linkUrl] - Generic URL for link preview card (works for LinkedIn, Bluesky, Facebook). Platform-specific params take priority.
   *
   * LinkedIn options:
   * @param {string} [options.targetLinkedinPageId] - Page ID for organization posts
   * @param {string} [options.linkedinLinkUrl] - URL to attach as link preview on LinkedIn
   *
   * Bluesky options:
   * @param {string} [options.blueskyLinkUrl] - URL to attach as external embed link preview on Bluesky
   *
   * Facebook options:
   * @param {string} [options.facebookPageId] - Facebook Page ID
   * @param {string} [options.facebookLinkUrl] - URL to attach as link preview on Facebook
   * 
   * X (Twitter) options:
   * @param {string} [options.xReplySettings] - Who can reply
   * @param {string} [options.xPostUrl] - URL to attach
   * @param {string} [options.xQuoteTweetId] - Tweet ID to quote
   * @param {string|string[]} [options.xPollOptions] - Poll options (2-4 options)
   * @param {number} [options.xPollDuration] - Poll duration in minutes (5-10080)
   * @param {string} [options.xPollReplySettings] - Who can reply to poll
   * @param {string} [options.xCardUri] - Card URI for Twitter Cards
   * @param {boolean} [options.xLongTextAsPost] - Post long text as single post
   *
   * Threads options:
   * @param {boolean} [options.threadsLongTextAsPost] - Post long text as single post
   * @param {string} [options.threadsThreadMediaLayout] - Comma-separated list of how many media items per Threads post (e.g. "5,5")
   * @param {string} [options.threadsTopicTag] - Topic tag for the Threads post (1-50 chars, no periods or ampersands)
   *
   * Reddit options (currently unavailable: HTTP 503, error_code=reddit_unavailable):
   * @param {string} [options.redditSubreddit] - Subreddit name (without r/)
   * @param {string} [options.redditFlairId] - Flair template ID
   *
   * @returns {Promise<Object>} API response
   */
  async uploadText(options) {
    const form = new FormData();

    this._addCommonParams(form, options);

    // Generic link_url support
    if (options.linkUrl) form.append('link_url', options.linkUrl);

    const platforms = Array.isArray(options.platforms) ? options.platforms : [options.platforms];
    if (platforms.includes('linkedin')) this._addLinkedinParams(form, options, true);
    if (platforms.includes('facebook')) this._addFacebookParams(form, options, false, true);
    if (platforms.includes('x')) this._addXParams(form, options, true);
    if (platforms.includes('threads')) this._addThreadsParams(form, options);
    if (platforms.includes('reddit')) this._addRedditParams(form, options, true);
    if (platforms.includes('bluesky') && (options.blueskyLinkUrl || options.linkUrl)) {
      form.append('bluesky_link_url', options.blueskyLinkUrl || options.linkUrl);
    }
    if (platforms.includes('google_business')) this._addGoogleBusinessParams(form, options);
    this._addCredentialPlatformParams(form, options);

    return this._request('/upload_text', 'POST', form, true, this._idempotencyHeaders(options));
  }

  /**
   * Upload a document to LinkedIn (PDF, PPT, PPTX, DOC, DOCX)
   * 
   * @param {string} documentPathOrUrl - Path to document file or document URL
   * @param {Object} options - Upload options
   * @param {string} options.title - Post title/caption
   * @param {string} options.user - User identifier (profile name)
   * @param {string} [options.description] - Document description/commentary
   * @param {string} [options.linkedinVisibility] - PUBLIC, CONNECTIONS, LOGGED_IN, CONTAINER
   * @param {string} [options.targetLinkedinPageId] - Page ID for organization posts
   * @param {string} [options.scheduledDate] - ISO date for scheduling
   * @param {string} [options.timezone] - Timezone for scheduled date
   * @param {boolean} [options.addToQueue] - Add to posting queue
   * @param {boolean} [options.asyncUpload=true] - Process upload asynchronously
   * @param {string} [options.firstComment] - Comment posted under the document right after publishing
   * @param {string} [options.linkedinFirstComment] - Same, LinkedIn-specific name (used when firstComment is not set)
   * 
   * @returns {Promise<Object>} API response
   */
  async uploadDocument(documentPathOrUrl, options) {
    const form = new FormData();

    // Handle document (file path or URL)
    if (typeof documentPathOrUrl === 'string' && (documentPathOrUrl.toLowerCase().startsWith('http://') || documentPathOrUrl.toLowerCase().startsWith('https://'))) {
      form.append('document', documentPathOrUrl);
    } else {
      if (!fs.existsSync(documentPathOrUrl)) {
        throw new Error(`Document file not found: ${documentPathOrUrl}`);
      }
      form.append('document', createReadStream(documentPathOrUrl));
    }

    // Force linkedin platform
    form.append('user', options.user);
    form.append('title', options.title);
    form.append('platform[]', 'linkedin');

    if (options.description) form.append('description', options.description);
    if (options.scheduledDate) form.append('scheduled_date', options.scheduledDate);
    if (options.timezone) form.append('timezone', options.timezone);
    if (options.addToQueue !== undefined) form.append('add_to_queue', String(options.addToQueue));
    if (options.maxPostsPerSlot !== undefined) form.append('max_posts_per_slot', String(options.maxPostsPerSlot));
    if (options.asyncUpload !== undefined) form.append('async_upload', String(options.asyncUpload));
    // First comment under the document post. This method does not go through
    // _addCommonParams, so without these two lines the option was dropped.
    if (options.firstComment) form.append('first_comment', options.firstComment);
    if (options.linkedinFirstComment) form.append('linkedin_first_comment', options.linkedinFirstComment);
    // AI auto-generation of native per-platform copy from the media (fills blank fields)

    this._addLinkedinParams(form, options);

    return this._request('/upload_document', 'POST', form, true, this._idempotencyHeaders(options));
  }

  // ==================== Status & History ====================

  /**
   * Get the status of an async upload
   * 
   * @param {string} requestId - The request_id from an async upload
   * @returns {Promise<Object>} Upload status
   */
  async getStatus(requestId) {
    return this._request('/uploadposts/status', 'GET', { request_id: requestId });
  }

  /**
   * Get the status of a scheduled or queued upload by job ID
   *
   * @param {string} jobId - The job_id from a scheduled or queued upload
   * @returns {Promise<Object>} Upload status
   */
  async getJobStatus(jobId) {
    return this._request('/uploadposts/status', 'GET', { job_id: jobId });
  }

  /**
   * Get upload history
   * 
   * @param {Object} [options] - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page (20, 50, or 100)
   * @returns {Promise<Object>} Upload history
   */
  async getHistory(options = {}) {
    return this._request('/uploadposts/history', 'GET', {
      page: options.page || 1,
      limit: options.limit || 20
    });
  }

  /**
   * Get analytics for a profile
   *
   * @param {string} profileUsername - Profile username
   * @param {Object} [options] - Query options
   * @param {string[]} [options.platforms] - Filter by platforms (instagram, linkedin, facebook, x, youtube, tiktok, threads, pinterest, reddit)
   * @param {string} [options.pageId] - Facebook Page ID (required for Facebook analytics)
   * @param {string} [options.pageUrn] - LinkedIn organization/company page URN or numeric ID. LinkedIn analytics are only available for pages you administer; personal profiles are not supported (LinkedIn exposes no member-level analytics). Defaults to the first administered organization page.
   * @returns {Promise<Object>} Analytics data per platform
   */
  async getAnalytics(profileUsername, options = {}) {
    const params = {};
    if (options.platforms && options.platforms.length > 0) {
      params.platforms = options.platforms.join(',');
    }
    if (options.pageId) params.page_id = options.pageId;
    if (options.pageUrn) params.page_urn = options.pageUrn;
    return this._request(`/analytics/${encodeURIComponent(profileUsername)}`, 'GET', params);
  }

  /**
   * Get total impressions for a profile from daily snapshots
   *
   * @param {string} profileUsername - Profile username
   * @param {Object} [options] - Query options
   * @param {string} [options.period] - Period shortcut: last_day, last_week, last_month, last_3months, last_year
   * @param {string} [options.startDate] - Start date in YYYY-MM-DD format
   * @param {string} [options.endDate] - End date in YYYY-MM-DD format
   * @param {string} [options.date] - Single date in YYYY-MM-DD format
   * @param {string[]} [options.platforms] - Filter by platforms
   * @param {boolean} [options.breakdown] - Include per-platform and per-day breakdown
   * @param {string[]} [options.metrics] - Specific metrics to aggregate (e.g., ['likes', 'comments', 'shares'])
   * @returns {Promise<Object>} Total impressions data
   */
  async getTotalImpressions(profileUsername, options = {}) {
    const params = {};
    if (options.period) params.period = options.period;
    if (options.startDate) params.start_date = options.startDate;
    if (options.endDate) params.end_date = options.endDate;
    if (options.date) params.date = options.date;
    if (options.platforms && options.platforms.length > 0) {
      params.platform = options.platforms.join(',');
    }
    if (options.breakdown) params.breakdown = 'true';
    if (options.metrics && options.metrics.length > 0) {
      params.metrics = options.metrics.join(',');
    }
    return this._request(`/uploadposts/total-impressions/${encodeURIComponent(profileUsername)}`, 'GET', params);
  }

  /**
   * Get analytics for a specific post across all platforms it was published to
   *
   * `post_metrics` carries whatever the platform reports, so it is not the same
   * shape everywhere: on TikTok it also brings `retention` (the curve, second
   * by second), `impression_sources` (For You, search, profile...),
   * `audience_types` (followers vs non-followers), `new_followers`, `reach` and
   * the watch times (`average_time_watched`, `total_time_watched`,
   * `full_video_watched_rate`).
   *
   * TikTok drafts (`postMode: 'MEDIA_UPLOAD'` / `tiktokUploadToDraft`) have no
   * post until the creator publishes them from the TikTok app. Call this with
   * the upload's request_id afterwards: Upload-Post asks TikTok which post came
   * from the draft, then returns its metrics and fills in `platform_post_id`
   * and `post_url`. Until then `post_metrics_error` says the draft is not
   * published yet (that answer is reused for a while, from ~5 minutes on a new
   * upload to 6 hours on an old one); after 30 days without a post it stops
   * asking TikTok — use getPostAnalyticsByPlatformId() with the post id. TikTok
   * only gives the id of a **public**, moderated post, so a draft published as
   * private never gets per-post analytics. `original_publish_id` (TikTok only)
   * is the upload's TikTok `publish_id`; `post_url` stays empty when the
   * account's @username is not known.
   *
   * @param {string} requestId - The request_id from the upload
   * @returns {Promise<Object>} Post analytics with per-platform metrics
   */
  async getPostAnalytics(requestId) {
    return this._request(`/uploadposts/post-analytics/${encodeURIComponent(requestId)}`, 'GET');
  }

  /**
   * Get analytics for any post (including organic posts) using its native platform ID
   *
   * @param {string} platformPostId - The native post ID on the platform (e.g., Instagram media ID)
   * @param {string} platform - The platform to query (instagram, youtube, tiktok, facebook, linkedin, x, threads, pinterest, reddit)
   * @param {string} user - The profile_username that owns the social account
   * @returns {Promise<Object>} Post analytics with live per-post metrics from the platform API
   */
  async getPostAnalyticsByPlatformId(platformPostId, platform, user) {
    return this._request('/uploadposts/post-analytics', 'GET', {
      platform_post_id: platformPostId,
      platform,
      user,
    });
  }

  /**
   * Replay per-post metrics already fetched, instead of querying the
   * platforms live.
   *
   * Because it never calls the platform APIs it is not subject to the live
   * post-analytics rate limit (100 requests / 5 minutes), which makes it the
   * right method for paging through a profile's whole post history.
   *
   * @param {string} user - Profile username
   * @param {Object} [options] - Query options
   * @param {string} [options.platform] - Filter by platform (instagram, tiktok, youtube, facebook, linkedin, threads, pinterest, reddit)
   * @param {number} [options.limit=50] - Posts per page (max 200)
   * @param {string} [options.cursor] - Opaque cursor from a previous response's next_cursor
   * @param {string} [options.since] - Start date in YYYY-MM-DD format (defaults to 30 days ago)
   * @param {string} [options.until] - End date in YYYY-MM-DD format (defaults to today)
   * @returns {Promise<Object>} Cached post metrics with next_cursor and has_more
   */
  async getCachedPostAnalytics(user, options = {}) {
    const params = { user };
    if (options.platform) params.platform = options.platform;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.cursor) params.cursor = options.cursor;
    if (options.since) params.since = options.since;
    if (options.until) params.until = options.until;
    return this._request('/uploadposts/post-analytics/cached', 'GET', params);
  }

  /**
   * Get who the audience is: where they are, how old they are, when they are
   * online and what they tap on the profile.
   *
   * Where the post-analytics methods answer *how did my posts do*, this one
   * answers *who is following me*. It is one endpoint for every platform,
   * chosen with `platform` — a platform that cannot answer it comes back with
   * `platform_not_supported` and the list of the ones that can.
   *
   * The window is clamped server-side: at most 60 days, and `endDate` always
   * before today. A wider window is trimmed rather than rejected.
   *
   * Pass `benchmarkCategory` to also get the averages of that category next to
   * the account's own numbers; the accepted values come back in
   * `benchmark_categories` on every response, so a picker needs no extra call.
   *
   * @param {Object} options - Query options
   * @param {string} options.user - Profile username
   * @param {string} options.platform - Platform to ask (tiktok)
   * @param {string} [options.startDate] - Window start, ISO `YYYY-MM-DD`
   * @param {string} [options.endDate] - Window end, ISO `YYYY-MM-DD`
   * @param {string} [options.benchmarkCategory] - Category to compare the account
   *   against, e.g. `SOFTWARE_AND_APPS`
   * @returns {Promise<Object>} `range`, `audience` (countries, cities, ages, genders),
   *   `activity_by_hour`, `followers_daily`, `profile_actions`, `bio_description`,
   *   `benchmark_categories` and, with a category, `benchmark`
   */
  async getAudience(options = {}) {
    const params = { user: options.user, platform: options.platform };
    if (options.startDate) params.start_date = options.startDate;
    if (options.endDate) params.end_date = options.endDate;
    if (options.benchmarkCategory) params.benchmark_category = options.benchmarkCategory;
    return this._request('/uploadposts/audience', 'GET', params);
  }

  /**
   * Get what to write about: the hashtags or the searches a platform suggests
   * around a keyword.
   *
   * One endpoint for both questions, told apart by `type`:
   *
   *   type        answers
   *   hashtags    `{ hashtags: [{ name, view_count }] }`
   *   keywords    `{ keywords: [...] }`
   *
   * Chosen with `platform`, like every other question in the API — a platform
   * that cannot answer it comes back with `platform_not_supported` and the list
   * of the ones that can.
   *
   * @param {Object} options - Query options
   * @param {string} options.user - Profile username
   * @param {string} options.platform - Platform to ask (tiktok)
   * @param {('hashtags'|'keywords')} options.type - Which suggestions you want
   * @param {string} [options.q] - Keyword to get suggestions around
   * @param {string} [options.countryCode] - ISO country code to bias the suggestions
   * @param {string} [options.language] - Language code to bias the suggestions
   * @returns {Promise<Object>} `{ success, platform, type, hashtags }` or
   *   `{ success, platform, type, keywords }`
   */
  async getSuggestions(options = {}) {
    const params = { user: options.user, platform: options.platform, type: options.type };
    if (options.q) params.q = options.q;
    if (options.countryCode) params.country_code = options.countryCode;
    if (options.language) params.language = options.language;
    return this._request('/uploadposts/suggestions', 'GET', params);
  }

  /**
   * Get available metrics configuration for all supported platforms
   *
   * @returns {Promise<Object>} Platform metrics config (primary fields, available metrics, labels)
   */
  async getPlatformMetrics() {
    return this._request('/uploadposts/platform-metrics', 'GET');
  }

  /**
   * Get detailed Reddit posts with full media information
   *
   * @param {string} profileUsername - Profile username
   * @returns {Promise<Object>} Detailed Reddit posts
   */
  async getRedditDetailedPosts(profileUsername) {
    return this._request('/uploadposts/reddit/detailed-posts/', 'GET', { profile_username: profileUsername });
  }

  /**
   * Get recent media from a connected social account.
   *
   * @param {string} platform - instagram, tiktok, youtube, linkedin, facebook, x, threads, pinterest, bluesky, reddit
   * @param {string} user - Profile username
   * @param {Object} [options]
   * @param {string} [options.pageUrn] - LinkedIn only. Numeric org ID, full URN, or "me" to force the personal profile.
   * @param {number} [options.limit=25] - Items per page, clamped to 1-100. Per-platform caps: TikTok 20, YouTube 50, everything else 100.
   * @param {string} [options.cursor] - Opaque cursor from a previous response's `pagination.next_cursor`.
   *   LinkedIn, Discord and Telegram do not support cursors: passing one there returns HTTP 400.
   * @returns {Promise<Object>} `{ success, media, pagination: { limit, next_cursor, has_more } }`
   */
  async getMedia(platform, user, options = {}) {
    const params = { platform, user };
    if (options.pageUrn) params.page_urn = options.pageUrn;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.cursor) params.cursor = options.cursor;
    return this._request('/uploadposts/media', 'GET', params);
  }

  // ==================== Scheduled Posts ====================

  /**
   * List scheduled posts
   * 
   * @returns {Promise<Object>} List of scheduled posts
   */
  async listScheduled() {
    return this._request('/uploadposts/schedule', 'GET');
  }

  /**
   * Cancel a scheduled post
   * 
   * @param {string} jobId - Scheduled job ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelScheduled(jobId) {
    return this._request(`/uploadposts/schedule/${jobId}`, 'DELETE');
  }

  /**
   * Edit a scheduled post
   * 
   * @param {string} jobId - Scheduled job ID
   * @param {Object} options - Edit options
   * @param {string} [options.scheduledDate] - New scheduled date (ISO 8601)
   * @param {string} [options.timezone] - New timezone
   * @param {string} [options.title] - New title for every platform
   * @param {string} [options.caption] - New caption/description for every platform
   * @param {string} [options.description] - Alias of caption
   * @param {Object} [options.platformContent] - Per-platform text, e.g.
   *   { instagram: { caption: '...' }, tiktok: { caption: '...' }, youtube: { title: '...' } }.
   *   Only the platforms listed are touched.
   * @param {Object} [options.fields] - Any other editable upload option, keyed by the
   *   API form name (e.g. { privacyStatus: 'unlisted', tags: '["a","b"]', disable_comment: true,
   *   instagram_first_comment: '...' }). `null` removes an option. Unknown or internal keys
   *   are ignored by the API.
   * @param {string|null} [options.youtubePublishAt] - Native YouTube scheduling (RFC3339),
   *   sent as fields.youtube_publish_at; `null` removes it. Wins over the same key in `fields`.
   * @param {string} [options.coverImageBase64] - New cover image (Instagram / Facebook Reels),
   *   base64 or a data URL
   * @param {string} [options.coverFilename] - File name of the new cover (default cover.jpg)
   * @param {string} [options.coverContentType] - MIME type of the new cover (default image/jpeg)
   * @param {boolean} [options.removeCover] - Remove the custom cover
   * @returns {Promise<Object>} Edit result
   */
  async editScheduled(jobId, options = {}) {
    const body = {};
    if (options.scheduledDate) body.scheduled_date = options.scheduledDate;
    if (options.timezone) body.timezone = options.timezone;
    if (options.title !== undefined) body.title = options.title;
    if (options.caption !== undefined) body.caption = options.caption;
    else if (options.description !== undefined) body.description = options.description;
    if (options.platformContent) body.platform_content = options.platformContent;
    const fields = { ...(options.fields || {}) };
    if (options.youtubePublishAt !== undefined) fields.youtube_publish_at = options.youtubePublishAt;
    if (Object.keys(fields).length) body.fields = fields;
    if (options.removeCover === true) body.remove_cover = true;
    else if (options.coverImageBase64) {
      body.cover_image_base64 = options.coverImageBase64;
      if (options.coverFilename) body.cover_filename = options.coverFilename;
      if (options.coverContentType) body.cover_content_type = options.coverContentType;
    }
    return this._request(`/uploadposts/schedule/${jobId}`, 'PATCH', body);
  }

  // ==================== User Management ====================

  /**
   * List all users/profiles
   * 
   * @returns {Promise<Object>} List of users
   */
  async listUsers() {
    return this._request('/uploadposts/users', 'GET');
  }

  /**
   * Create a new user/profile
   * 
   * @param {string} username - Profile name to create
   * @returns {Promise<Object>} Created user
   */
  async createUser(username) {
    return this._request('/uploadposts/users', 'POST', { username });
  }

  /**
   * Delete a user/profile
   * 
   * @param {string} username - Profile name to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUser(username) {
    return this._request('/uploadposts/users', 'DELETE', { username });
  }

  /**
   * Generate a JWT for platform integration
   * Used when integrating Upload-Post into your own platform
   * 
   * @param {string} username - Profile username
   * @param {Object} [options] - JWT options
   * @param {string} [options.redirectUrl] - URL to redirect after linking
   * @param {string} [options.logoImage] - Logo image URL for the linking page
   * @param {string} [options.redirectButtonText] - Text for redirect button
   * @param {string[]} [options.platforms] - Platforms to show for connection
   * @param {boolean} [options.showCalendar] - Whether to show the calendar view
   * @param {boolean} [options.readonlyCalendar] - Show only a read-only calendar (no editing, no account connection)
   * @param {string} [options.connectTitle] - Custom title for the connection page
   * @param {string} [options.connectDescription] - Custom description for the connection page
   * @param {('en'|'es'|'de'|'fr'|'pt'|'pl'|'tr')} [options.language] - Force the connection page language for this profile. When omitted, the page auto-detects the visitor's browser language and falls back to English.
   * @param {Object.<string, string>} [options.uiLabels] - Flat map of i18n dot-path keys to replacement strings, e.g. `{ 'connect.title': 'Link your accounts' }`. Max 100 entries; keys must match `^[a-zA-Z0-9_.]+$` and values are strings of up to 300 characters. Returned back in the `profile` object of validateJwt.
   * @returns {Promise<Object>} JWT and connection URL
   */
  async generateJwt(username, options = {}) {
    const body = { username };
    if (options.redirectUrl) body.redirect_url = options.redirectUrl;
    if (options.logoImage) body.logo_image = options.logoImage;
    if (options.redirectButtonText) body.redirect_button_text = options.redirectButtonText;
    if (options.platforms && options.platforms.length > 0) body.platforms = options.platforms;
    if (options.showCalendar !== undefined) body.show_calendar = options.showCalendar;
    if (options.readonlyCalendar !== undefined) body.readonly_calendar = options.readonlyCalendar;
    if (options.connectTitle) body.connect_title = options.connectTitle;
    if (options.connectDescription) body.connect_description = options.connectDescription;
    if (options.language) body.language = options.language;
    if (options.uiLabels) body.ui_labels = options.uiLabels;
    return this._request('/uploadposts/users/generate-jwt', 'POST', body);
  }

  /**
   * Validate a JWT token
   * 
   * @param {string} jwt - JWT token to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateJwt(jwt) {
    return this._request('/uploadposts/users/validate-jwt', 'GET', null, false, { Authorization: `Bearer ${jwt}` });
  }

  /**
   * Get user preferences (including calendar settings)
   *
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    return this._request('/uploadposts/users/preferences', 'GET');
  }

  /**
   * Update user preferences (including calendar settings)
   *
   * @param {Object} options - Preferences options
   * @param {number} [options.weekStartDay] - Week start day (0=Sunday, 1=Monday)
   * @returns {Promise<Object>} Updated preferences
   */
  async updateUserPreferences(options = {}) {
    const body = {};
    if (options.weekStartDay !== undefined) body.week_start_day = options.weekStartDay;
    return this._request('/uploadposts/users/preferences', 'POST', body);
  }

  /**
   * Get notification configuration (including webhook settings)
   *
   * @returns {Promise<Object>} Notification config
   */
  async getNotificationConfig() {
    return this._request('/uploadposts/users/notifications', 'GET');
  }

  /**
   * Update notification configuration (including webhook settings)
   *
   * @param {Object} options - Notification config options
   * @param {string[]} [options.webhookEvents] - Webhook event types to subscribe to (upload_completed, social_account_connected, social_account_disconnected, social_account_reauth_required, dm_received, comment_received). `dm_received` and `comment_received` are opt-in.
   * @param {string} [options.webhookUrl] - Webhook URL for notifications. Changing it resets the webhook's failure pause.
   * @param {Object.<string, boolean>} [options.channels] - Channels to turn on or off, e.g. `{ webhook: true, telegram: false }`
   * @param {string} [options.telegramChatId] - Telegram chat id for notifications
   * @param {string} [options.slackWebhookUrl] - Slack incoming webhook URL
   * @param {string} [options.whatsappToPhone] - WhatsApp number for notifications
   * @returns {Promise<Object>} `{ success, notifications }`
   */
  async updateNotificationConfig(options = {}) {
    const body = {};
    if (options.webhookEvents) body.webhook_events = options.webhookEvents;
    if (options.webhookUrl) body.webhook_url = options.webhookUrl;
    if (options.channels) body.channels = options.channels;
    if (options.telegramChatId) body.telegram_chat_id = options.telegramChatId;
    if (options.slackWebhookUrl) body.slack_webhook_url = options.slackWebhookUrl;
    if (options.whatsappToPhone) body.whatsapp_to_phone = options.whatsappToPhone;
    return this._request('/uploadposts/users/notifications', 'POST', body);
  }

  /**
   * Send a test notification through the configured channels
   *
   * @returns {Promise<Object>} Test result
   */
  async testNotifications() {
    return this._request('/uploadposts/users/notifications/test', 'POST', {});
  }

  /**
   * Remove the account webhook (URL and events) and turn the webhook channel
   * off. Telegram, Slack and WhatsApp are left as they are.
   *
   * @returns {Promise<Object>} `{ success, notifications }`
   */
  async deleteNotificationWebhook() {
    return this._request('/uploadposts/users/notifications', 'DELETE');
  }

  /**
   * Rotate the secret that signs every webhook delivery (`X-Upload-Post-Signature`).
   * The old secret stops working at once: update your verifier with the new one.
   *
   * @returns {Promise<Object>} `{ success, webhook_secret }`
   */
  async rotateWebhookSecret() {
    return this._request('/uploadposts/users/webhook-secret', 'POST', {});
  }

  /**
   * Get the webhook of one profile (sent alongside the account webhook)
   *
   * @param {string} profileUsername - Profile username
   * @returns {Promise<Object>} `{ success, profile_username, webhook_url, webhook_events }`
   */
  async getProfileWebhook(profileUsername) {
    return this._request('/uploadposts/users/profile-webhook', 'GET', { profile_username: profileUsername });
  }

  /**
   * Set (or replace) the webhook of one profile. Its deliveries are signed with
   * the account's webhook secret and paused on their own after repeated failures.
   *
   * @param {Object} options
   * @param {string} options.profileUsername - Profile username
   * @param {string} options.webhookUrl - Public https URL
   * @param {Object.<string, boolean>|null} [options.webhookEvents] - Event -> on/off
   *   (`upload_completed`, `social_account_connected`, `social_account_disconnected`,
   *   `social_account_reauth_required`, `dm_received`, `comment_received`). `null`
   *   clears the per-profile selection; omit it to keep the current one.
   * @returns {Promise<Object>} The profile webhook
   */
  async setProfileWebhook(options) {
    const body = { profile_username: options.profileUsername, webhook_url: options.webhookUrl };
    if (options.webhookEvents !== undefined) body.webhook_events = options.webhookEvents;
    return this._request('/uploadposts/users/profile-webhook', 'POST', body);
  }

  /**
   * Remove the webhook of one profile
   *
   * @param {string} profileUsername - Profile username
   * @returns {Promise<Object>} `{ success, message, profile_username }`
   */
  async deleteProfileWebhook(profileUsername) {
    return this._request('/uploadposts/users/profile-webhook', 'DELETE', { profile_username: profileUsername });
  }

  // ==================== Webhook deliveries ====================

  /**
   * List the webhook deliveries of the account (account and per-profile
   * webhooks), newest first. Deliveries are kept for 7 days.
   *
   * Webhooks are delivered at least once: a timeout, connection error, 5xx, 408
   * or 429 is retried up to 6 attempts over about 8.5 hours, with the same
   * `X-Upload-Post-Delivery` id (deduplicate on it). Other 4xx answers are final.
   *
   * @param {Object} [options] - Filters
   * @param {string} [options.event] - e.g. `upload_completed`, `dm_received`
   * @param {('pending'|'delivered'|'failed'|'cancelled')} [options.status]
   * @param {string} [options.requestId] - Deliveries of one upload
   * @param {string} [options.jobId] - Deliveries of one scheduled/async job
   * @param {string} [options.profileUsername] - Deliveries of that profile's webhook
   * @param {number} [options.limit] - Page size, 1-100 (default 20)
   * @param {number} [options.page] - Page number, 1-50 (narrow with filters for older rows)
   * @param {boolean} [options.includePayload] - Include each delivery's `payload`
   *   (left out by default; getWebhookDelivery() always includes it)
   * @returns {Promise<Object>} `{ success, page, limit, total, has_more, retention_days, deliveries }`
   */
  async listWebhookDeliveries(options = {}) {
    const params = {};
    if (options.event) params.event = options.event;
    if (options.status) params.status = options.status;
    if (options.requestId) params.request_id = options.requestId;
    if (options.jobId) params.job_id = options.jobId;
    if (options.profileUsername) params.profile_username = options.profileUsername;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.page !== undefined) params.page = options.page;
    if (options.includePayload !== undefined) params.include_payload = String(Boolean(options.includePayload));
    return this._request('/uploadposts/webhooks/deliveries', 'GET', params);
  }

  /**
   * Get one webhook delivery, always with its `payload` (the exact body sent).
   * 404 when it does not exist, is older than 7 days or belongs to another account.
   *
   * @param {string} deliveryId - The `delivery_id` (= `X-Upload-Post-Delivery` header)
   * @returns {Promise<Object>} `{ success, delivery }`
   */
  async getWebhookDelivery(deliveryId) {
    return this._request(`/uploadposts/webhooks/deliveries/${encodeURIComponent(deliveryId)}`, 'GET');
  }

  /**
   * Send a logged delivery again, right away, with the same body. It is a new
   * delivery: own `delivery_id`, the original in `X-Upload-Post-Redelivery-Of`,
   * sent to the webhook URL configured now, and retried like any other.
   *
   * Errors: 404 (unknown, older than 7 days or another account's), 409 with
   * `error.reason` `webhook_removed` / `event_unsubscribed` / `blocked_url`, 503
   * `delivery_log_disabled`.
   *
   * @param {string} deliveryId - The delivery to send again
   * @returns {Promise<Object>} `{ success, delivery }` (the new delivery, with `redelivery_of`)
   */
  async redeliverWebhook(deliveryId) {
    return this._request(`/uploadposts/webhooks/deliveries/${encodeURIComponent(deliveryId)}/redeliver`, 'POST', {});
  }

  // ==================== Teams ====================

  /**
   * List the members of your team (account owner only; a member acting with
   * `actAsUser` gets 403). When seat limits are enforced each member carries
   * `suspended` / `suspended_reason` (`owner_plan_limit`) and the response adds
   * `plan` and `seat_limit`: after a downgrade the last invited members are
   * suspended, not removed, until you upgrade or remove someone.
   *
   * @returns {Promise<Object>} `{ success, team_members, plan?, seat_limit? }`
   */
  async listTeamMembers() {
    return this._request('/uploadposts/teams/members', 'GET');
  }

  /**
   * List the accounts shared with you as a team member. Each one may carry
   * `suspended` / `suspended_reason`: a suspended seat cannot act on that
   * account (403 `TEAM_SEAT_SUSPENDED`) until its owner upgrades or frees a seat.
   *
   * @returns {Promise<Object>} `{ success, accounts: [{ owner_email, owner_name, status, suspended?, suspended_reason? }] }`
   */
  async listSharedAccounts() {
    return this._request('/uploadposts/teams/shared-with-me', 'GET');
  }

  // ==================== Comments ====================

  /**
   * Get comments on a post, or the replies hanging from one of them
   *
   * Pass `commentId` to read the replies to that comment instead of the
   * post's top-level comments. It is the same question — *what was said
   * here* — so it is the same endpoint with one more parameter, not a
   * separate method per platform.
   *
   * On TikTok this needs the `comments` capability on the connection (see
   * `capabilities` on the TikTok account returned by listUsers()). TikTok grants
   * it at connect time, so an account connected earlier has to be reconnected.
   *
   * Replies (`commentId`) can be read on TikTok, Threads, YouTube, Instagram,
   * Facebook and LinkedIn (company Pages only). X, Bluesky and Reddit answer
   * `400 platform_not_supported`. Notes per platform:
   * - Instagram: `commentId` is the numeric comment id.
   * - Facebook: `postId` is still required (its `{pageId}_` prefix picks the
   *   Page); `commentId` is `{post}_{comment}`.
   * - LinkedIn: pass the full `comment_urn` (`urn:li:comment:(urn:li:activity:N,N)`)
   *   for a single call; a bare numeric id is looked up in the post's first 250
   *   comments, otherwise `404 linkedin_comment_not_found`. `after` is a numeric
   *   offset. Errors: `403 linkedin_personal_not_supported` (personal profile post),
   *   `403 linkedin_page_access_denied` (no longer a Page admin: reconnect).
   * - A malformed `commentId` gives `400 invalid_comment_id`; an unknown one on
   *   Instagram/Facebook gives `404 comment_not_found`. A comment with no replies
   *   is a 200 with an empty list.
   *
   * @param {Object} options - Query options
   * @param {string} options.user - Profile username
   * @param {string} [options.platform='instagram'] - Platform (instagram, facebook, youtube, linkedin, tiktok, threads, x, bluesky, reddit)
   * @param {string} [options.postId] - Native post/media ID (provide postId or postUrl).
   *   Required on TikTok, which has no post URL lookup.
   * @param {string} [options.postUrl] - Full post URL (provide postId or postUrl)
   * @param {string} [options.commentId] - Read the replies to this comment instead
   *   of the post's top-level comments
   * @param {number} [options.limit] - Max number of comments to return
   * @param {string} [options.after] - Pagination cursor for the next page
   *   (`pagination.next_cursor`; a numeric offset on LinkedIn replies)
   * @returns {Promise<Object>} `{ success, comments, pagination? }`
   */
  async getPostComments(options = {}) {
    // Backwards compatibility: getPostComments(user, { postId, postUrl })
    if (typeof options === 'string') {
      options = { user: options, ...(arguments[1] || {}) };
    }
    const params = { platform: options.platform || 'instagram', user: options.user };
    if (options.postId) params.post_id = options.postId;
    if (options.postUrl) params.post_url = options.postUrl;
    if (options.commentId) params.comment_id = options.commentId;
    if (options.limit !== undefined) params.limit = options.limit;
    if (options.after) params.after = options.after;
    return this._request('/uploadposts/comments', 'GET', params);
  }

  /**
   * Send a private reply (DM) to the author of an Instagram comment
   *
   * @param {Object} options - Reply options
   * @param {string} options.user - Profile username
   * @param {string} options.commentId - Comment ID from getPostComments
   * @param {string} options.message - Reply message text
   * @param {Array<{title: string, url: string}>} [options.buttons] - Optional web_url
   *   buttons (max 3) rendered in the Instagram DM. Each item is `{ title, url }`.
   * @returns {Promise<Object>} Reply result
   */
  async replyToComment(options) {
    const body = {
      platform: 'instagram',
      user: options.user,
      comment_id: options.commentId,
      message: options.message
    };
    if (options.buttons) body.buttons = options.buttons;
    return this._request('/uploadposts/comments/reply', 'POST', body);
  }

  /**
   * Post a public reply to an Instagram comment (visible under the original comment)
   *
   * @param {Object} options - Reply options
   * @param {string} options.user - Profile username
   * @param {string} options.commentId - Comment ID from getPostComments
   * @param {string} options.message - Reply message text
   * @returns {Promise<Object>} Reply result with the new comment ID
   */
  async publicReplyToComment(options) {
    return this._request('/uploadposts/comments/public-reply', 'POST', {
      platform: 'instagram',
      user: options.user,
      comment_id: options.commentId,
      message: options.message
    });
  }

  /**
   * Create a comment on a post, or reply to an existing comment
   *
   * One of postId, postUrl, or commentId is required. Pass commentId to reply
   * to an existing comment; pass postId/postUrl to comment on the post itself.
   *
   * On TikTok this needs the `comments` capability on the connection (see
   * `capabilities` on the TikTok account returned by listUsers()). TikTok grants
   * it at connect time, so an account connected earlier has to be reconnected.
   *
   * @param {Object} options - Comment options
   * @param {string} options.user - Profile username
   * @param {string} options.platform - Platform (instagram, facebook, youtube, linkedin, tiktok)
   * @param {string} options.message - Comment text
   * @param {string} [options.postId] - Native post/media ID to comment on
   * @param {string} [options.postUrl] - Full post URL to comment on
   * @param {string} [options.commentId] - Existing comment ID to reply to
   * @returns {Promise<Object>} Created comment result
   */
  async createComment(options) {
    const body = {
      platform: options.platform,
      user: options.user,
      message: options.message
    };
    if (options.commentId) body.comment_id = options.commentId;
    if (options.postId) body.post_id = options.postId;
    if (options.postUrl) body.post_url = options.postUrl;
    return this._request('/uploadposts/comments/create', 'POST', body);
  }

  /**
   * Delete a comment on a post
   *
   * On TikTok this needs the `comments` capability on the connection (see
   * `capabilities` on the TikTok account returned by listUsers()). TikTok grants
   * it at connect time, so an account connected earlier has to be reconnected.
   *
   * @param {Object} options - Delete options
   * @param {string} options.user - Profile username
   * @param {string} options.platform - Platform (instagram, facebook, youtube, linkedin, tiktok)
   * @param {string} options.commentId - Comment ID to delete
   * @param {string} [options.postId] - Post identifier (the post URN for LinkedIn)
   * @returns {Promise<Object>} Deletion result
   */
  async deleteComment(options) {
    const body = {
      platform: options.platform,
      user: options.user,
      comment_id: options.commentId
    };
    if (options.postId) body.post_id = options.postId;
    return this._request('/uploadposts/comments/delete', 'DELETE', body);
  }

  /**
   * Moderate a comment: hide, like or pin it — and undo any of the three
   *
   * One method for every platform, because it is one question: *do this to
   * that comment*. Each action carries its own inverse:
   *
   *   action              post_id
   *   hide / unhide       required
   *   like / unlike       not sent (the platform likes the comment on its own)
   *   pin / unpin         required
   *
   * On TikTok this needs the `comments` capability on the connection (see
   * `capabilities` on the TikTok account returned by listUsers()). TikTok grants
   * it at connect time, so an account connected earlier has to be reconnected.
   *
   * @param {Object} options - Action options
   * @param {string} options.user - Profile username
   * @param {string} options.platform - Platform (tiktok)
   * @param {string} options.commentId - Comment to act on
   * @param {('hide'|'unhide'|'like'|'unlike'|'pin'|'unpin')} options.action - What to do
   * @param {string} [options.postId] - Native post ID. Required for hide/unhide and
   *   pin/unpin; never sent for like/unlike.
   * @returns {Promise<Object>} `{ success, platform, action, comment_id, result }`
   */
  async commentAction(options) {
    const body = {
      platform: options.platform,
      user: options.user,
      comment_id: options.commentId,
      action: options.action
    };
    // Liking takes the comment alone; hiding and pinning need the post too.
    const likes = options.action === 'like' || options.action === 'unlike';
    if (!likes && options.postId) body.post_id = options.postId;
    return this._request('/uploadposts/comments/action', 'POST', body);
  }

  // ==================== AutoDM ====================

  /**
   * Start a per-post monitor: answers every new comment on one post, with a
   * private DM on Instagram or a public reply on TikTok, YouTube, Facebook,
   * Threads and Bluesky. Monitors stop after 15 days and a profile can create 2
   * per day. For the whole Instagram account use createAutodmRule() instead.
   *
   * @param {Object} options
   * @param {string} options.profileUsername - Profile username
   * @param {string} options.replyMessage - DM text (Instagram) or public reply
   * @param {('instagram'|'tiktok'|'youtube'|'facebook'|'threads'|'bluesky')} [options.platform='instagram']
   * @param {string} [options.postUrl] - Post URL (required on Instagram)
   * @param {string} [options.postId] - Post id on the other platforms (or postUrl)
   * @param {string[]} [options.replyMessages] - Public replies only: up to 5 alternative texts, rotated
   * @param {Array<{title: string, url: string}>} [options.buttons] - Instagram only: up to 3 link buttons
   * @param {number} [options.monitoringInterval] - Minutes between checks (min and default 15)
   * @param {string|string[]} [options.triggerKeywords] - Only answer comments containing one of these
   * @returns {Promise<Object>} Monitor result with `monitor_id`
   */
  async startAutodm(options) {
    const body = {
      profile_username: options.profileUsername,
      reply_message: options.replyMessage,
    };
    if (options.platform) body.platform = options.platform;
    if (options.postUrl) body.post_url = options.postUrl;
    if (options.postId) body.post_id = options.postId;
    if (options.replyMessages) body.reply_messages = options.replyMessages;
    if (options.buttons) body.buttons = options.buttons;
    if (options.monitoringInterval !== undefined) body.monitoring_interval = options.monitoringInterval;
    if (options.triggerKeywords !== undefined) body.trigger_keywords = options.triggerKeywords;
    return this._request('/uploadposts/autodms/start', 'POST', body);
  }

  /** @private */
  _autodmMonitorAction(action, monitorId) {
    return this._request(`/uploadposts/autodms/${action}`, 'POST', { monitor_id: monitorId });
  }

  /**
   * Stop a per-post monitor (it stays listed with `include_inactive`)
   * @param {string} monitorId - The monitor id
   * @returns {Promise<Object>}
   */
  async stopAutodm(monitorId) {
    return this._autodmMonitorAction('stop', monitorId);
  }

  /**
   * Pause a per-post monitor
   * @param {string} monitorId - The monitor id
   * @returns {Promise<Object>}
   */
  async pauseAutodm(monitorId) {
    return this._autodmMonitorAction('pause', monitorId);
  }

  /**
   * Resume a paused per-post monitor
   * @param {string} monitorId - The monitor id
   * @returns {Promise<Object>}
   */
  async resumeAutodm(monitorId) {
    return this._autodmMonitorAction('resume', monitorId);
  }

  /**
   * Delete a per-post monitor
   * @param {string} monitorId - The monitor id
   * @returns {Promise<Object>}
   */
  async deleteAutodm(monitorId) {
    return this._autodmMonitorAction('delete', monitorId);
  }

  /**
   * List per-post monitors and their stats
   * @param {Object} [options]
   * @param {boolean} [options.includeInactive=false] - Also return stopped/expired monitors
   * @returns {Promise<Object>}
   */
  async getAutodmStatus(options = {}) {
    const params = {};
    if (options.includeInactive !== undefined) params.include_inactive = String(Boolean(options.includeInactive));
    return this._request('/uploadposts/autodms/status', 'GET', params);
  }

  /**
   * Get the log of one per-post monitor
   * @param {string} monitorId - The monitor id
   * @returns {Promise<Object>}
   */
  async getAutodmLogs(monitorId) {
    return this._request('/uploadposts/autodms/logs', 'GET', { monitor_id: monitorId });
  }

  /**
   * Create an account-wide AutoDM rule on Instagram: it answers comments on
   * every post and reel (present and future), story replies, story mentions
   * and keyword DMs, with no expiry. Up to 10 rules per Instagram account; they
   * do not count towards the 2 monitors/day. Rules work only from Meta's
   * webhooks: creating one subscribes the account, and if Meta refuses the
   * rule is not created (`502 webhook_subscription_failed`: reconnect Instagram).
   *
   * Other errors (see `error.code`): `400` invalid fields / `reconnect_required`,
   * `409` `duplicate_rule` / `rule_limit_reached` / `rule_creation_in_progress`
   * (retry in a few seconds), `503` `account_rules_disabled`.
   *
   * @param {Object} options
   * @param {string} options.profileUsername - Profile with the Instagram account
   * @param {string} options.replyMessage - DM text (max 1,000 characters; 640 with buttons)
   * @param {Array<('comment'|'story_reply'|'story_mention'|'dm_keyword')>|string} [options.triggers] - Default `['comment']`
   * @param {string|string[]} [options.triggerKeywords] - Up to 20, case- and accent-insensitive.
   *   Required for `dm_keyword`; not applied to `story_mention`. Omit (or `[]`) for no filter.
   * @param {Array<{title: string, url: string}>} [options.buttons] - Up to 3 link buttons
   * @param {number} [options.perUserCooldownHours] - Whole number 0-720 (default 24): one DM per person
   *   per rule in this window. Story/DM triggers never go below 24 (`message_cooldown_hours`).
   * @returns {Promise<Object>} `{ success, rule }` with `status`, `stats`, `pending` and `webhook`
   */
  async createAutodmRule(options) {
    const body = {
      profile_username: options.profileUsername,
      reply_message: options.replyMessage,
    };
    if (options.platform) body.platform = options.platform;
    if (options.triggers !== undefined) body.triggers = options.triggers;
    if (options.triggerKeywords !== undefined) body.trigger_keywords = options.triggerKeywords;
    if (options.buttons) body.buttons = options.buttons;
    if (options.perUserCooldownHours !== undefined) body.per_user_cooldown_hours = options.perUserCooldownHours;
    return this._request('/uploadposts/autodms/rules', 'POST', body);
  }

  /**
   * List account-wide AutoDM rules. Each rule has `status` (`active`, `paused`,
   * `reconnect_required`, `stopped` with `stop_reason`, `disabled`), `stats`,
   * `pending` and `webhook` (`subscribed`, `receiving_events`, `last_event_at`,
   * `last_event_age_hours`, `hint`, `error`): if no events arrive for an
   * account, it shows here instead of failing silently.
   *
   * @param {Object} [options]
   * @param {string} [options.profileUsername] - Only this profile's rules
   * @returns {Promise<Object>} `{ success, enabled, rules, total }`
   */
  async listAutodmRules(options = {}) {
    const params = {};
    if (options.profileUsername) params.profile_username = options.profileUsername;
    return this._request('/uploadposts/autodms/rules', 'GET', params);
  }

  /** @private */
  _autodmRuleAction(action, ruleId) {
    return this._request(`/uploadposts/autodms/rules/${action}`, 'POST', { rule_id: ruleId });
  }

  /**
   * Pause an account-wide rule (it answers nothing until resumed)
   * @param {string} ruleId - The `rule_id`
   * @returns {Promise<Object>}
   */
  async pauseAutodmRule(ruleId) {
    return this._autodmRuleAction('pause', ruleId);
  }

  /**
   * Resume an account-wide rule. A `stopped` rule comes back only once its
   * Instagram account is connected to its profile again (else `409 rule_stopped`).
   * @param {string} ruleId - The `rule_id`
   * @returns {Promise<Object>}
   */
  async resumeAutodmRule(ruleId) {
    return this._autodmRuleAction('resume', ruleId);
  }

  /**
   * Delete an account-wide rule and its queued events
   * @param {string} ruleId - The `rule_id`
   * @returns {Promise<Object>}
   */
  async deleteAutodmRule(ruleId) {
    return this._autodmRuleAction('delete', ruleId);
  }

  // ==================== Direct messages ====================

  /** camelCase option -> API field, for sendDm / getDmConversations. @private */
  _dmBody(options, map) {
    const out = {};
    for (const [key, value] of Object.entries(options || {})) {
      if (value === undefined) continue;
      // Known camelCase names are mapped; anything else (snake_case or a field
      // added to the API later) is sent as given, so nothing is dropped silently.
      out[map[key] || key] = value;
    }
    return out;
  }

  /**
   * Send a direct message, or a DM action, on Instagram, Facebook Messenger,
   * WhatsApp or Bluesky. One endpoint for every platform, chosen with `platform`.
   *
   * Bluesky needs an app password created with "Allow access to your direct
   * messages" (else `403 bluesky_dm_scope_missing`: reconnect). There
   * `recipientId` is a handle, `@handle`, DID or profile link, or pass
   * `conversationId` (also for groups); `message` is at most 1,000 characters
   * with up to 10 `@mentions`; `attachments` can only share a post
   * (`{ type: 'post', url }`); `senderAction` is `mark_seen`/`mark_read`, `react`,
   * `unreact` (one emoji in `reaction`), `delete`, `accept`, `mute`, `unmute` or
   * `leave`. Buttons, quick replies, templates and typing are rejected with 400.
   * A `504 bluesky_send_unconfirmed` (`retryable: false`) means the DM may have
   * gone out: check the conversation before sending it again.
   *
   * Telegram (`platform: 'telegram'`) sends from your own connected bot to a
   * person who started it (`recipientId` = their user id): text, media, buttons
   * (`reply_markup`) and sender actions. Reading Telegram conversations needs
   * update receiving, which is not available yet.
   *
   * Known options are camelCase and mapped to the API names; any other key is
   * sent as given.
   *
   * @param {Object} options
   * @param {('instagram'|'facebook'|'whatsapp'|'bluesky'|'telegram')} options.platform
   * @param {string} options.user - Profile username
   * @param {string} [options.recipientId] - Platform id of the person (Bluesky: handle/DID)
   * @param {string} [options.conversationId] - Bluesky: send into this conversation
   * @param {string} [options.message] - Text (optional with attachments, templates or senderAction)
   * @param {Object|Object[]} [options.attachments] - Media/attachments (Bluesky: a shared post)
   * @param {Array<{title: string, url: string}>} [options.buttons] - Instagram/Messenger/WhatsApp buttons
   * @param {Object[]} [options.quickReplies] - Instagram/Messenger quick replies
   * @param {Object|Object[]} [options.genericTemplate] - Instagram generic template
   * @param {string} [options.senderAction] - e.g. `typing_on`, `mark_seen`, `react`, `mark_read`
   * @param {string|Object} [options.reaction] - Emoji for `react` (WhatsApp: reaction object)
   * @param {string} [options.messageId] - Message to react to / mark read / delete
   * @param {string} [options.replyTo] - Message to reply to
   * @param {Object} [options.template] - WhatsApp approved template / Messenger utility template
   * @param {string} [options.tag] - Messenger message tag (`HUMAN_AGENT`)
   * @param {string} [options.pageId] - Messenger: Facebook Page id
   * @param {Object} [options.location] - WhatsApp location
   * @param {Object[]} [options.contacts] - WhatsApp contacts
   * @param {Object} [options.list] - WhatsApp interactive list
   * @param {Object} [options.ctaUrl] - WhatsApp CTA URL button
   * @param {Object|string} [options.header] - WhatsApp interactive header
   * @param {string} [options.footer] - WhatsApp interactive footer
   * @param {boolean} [options.typing] - WhatsApp typing indicator
   * @returns {Promise<Object>} Send result (Bluesky: `conversation_id`, `message_id`)
   */
  async sendDm(options) {
    const body = this._dmBody(options, {
      recipientId: 'recipient_id',
      conversationId: 'conversation_id',
      quickReplies: 'quick_replies',
      genericTemplate: 'generic_template',
      senderAction: 'sender_action',
      messageId: 'message_id',
      replyTo: 'reply_to',
      pageId: 'page_id',
      facebookPageId: 'facebook_page_id',
      ctaUrl: 'cta_url',
    });
    return this._request('/uploadposts/dms/send', 'POST', body);
  }

  /**
   * List DM conversations with their latest messages, on Instagram, Facebook
   * Messenger, WhatsApp or Bluesky. Each message has `from`/`to`/`message`/
   * `direction`; Bluesky adds `reactions`, `reply_to`, `status`
   * (`request`/`accepted`), `unread_count`, `muted`, `kind` (`direct`/`group`).
   * On Bluesky at most 25 conversations come per page; ones past the time
   * budget carry only their last message and `messages_truncated: true`.
   *
   * @param {Object} options
   * @param {('instagram'|'facebook'|'whatsapp'|'bluesky'|'telegram')} options.platform
   * @param {string} options.user - Profile username
   * @param {number} [options.limit] - Conversations per page (Bluesky max 25)
   * @param {string} [options.cursor] - `pagination.next_cursor` of the previous page
   * @param {string|number} [options.since] - Unix seconds/ms or ISO 8601
   * @param {string} [options.participantId] - Only the 1:1 conversation with this person (Bluesky: handle/DID)
   * @param {number} [options.messagesLimit] - Messages per conversation, 1-25 (default 10)
   * @param {string} [options.conversationId] - Bluesky: one conversation (direct or group)
   * @param {string} [options.messagesCursor] - Bluesky: older messages of `conversationId`
   * @param {('request'|'accepted')} [options.status] - Bluesky: requests or accepted chats
   * @param {'unread'} [options.readState] - Bluesky: only unread conversations
   * @param {string} [options.pageId] - Messenger: Facebook Page id
   * @returns {Promise<Object>} `{ success, conversations, pagination, ... }`
   */
  async getDmConversations(options) {
    const params = this._dmBody(options, {
      participantId: 'participant_id',
      messagesLimit: 'messages_limit',
      conversationId: 'conversation_id',
      messagesCursor: 'messages_cursor',
      readState: 'read_state',
      pageId: 'page_id',
      facebookPageId: 'facebook_page_id',
    });
    return this._request('/uploadposts/dms/conversations', 'GET', params);
  }

  // ==================== Post Management ====================

  /**
   * Retry a failed post
   *
   * Provide the request_id (from an async upload) or the job_id (from a
   * scheduled/queued upload).
   *
   * @param {Object} options - Retry options
   * @param {string} [options.requestId] - The request_id of the post to retry
   * @param {string} [options.jobId] - The job_id of the post to retry
   * @returns {Promise<Object>} Retry result
   */
  async retryPost(options = {}) {
    const body = {};
    if (options.requestId) body.request_id = options.requestId;
    if (options.jobId) body.job_id = options.jobId;
    return this._request('/uploadposts/posts/retry', 'POST', body);
  }

  /**
   * Unpublish (delete) a post from the platform
   *
   * Not available for Instagram (Meta only allows it through Facebook Login and
   * Upload-Post connects Instagram with Instagram Login: delete it in the app),
   * TikTok (no delete API) or Reddit; those answer 400 with the reason.
   *
   * @param {Object} options - Unpublish options
   * @param {string} options.user - Profile username
   * @param {string} options.platform - Platform (facebook, youtube, x, linkedin, pinterest, bluesky, google_business, telegram)
   * @param {string} options.postId - Native post ID to unpublish
   * @param {boolean} [options.deleteAllMessages] - Telegram: delete every message of the
   *   post (album, caption rest, first comment), not only `postId`
   * @returns {Promise<Object>} Unpublish result
   */
  async unpublishPost(options) {
    // Extra options (e.g. Telegram `deleteAllMessages`) go through as API fields.
    const { platform, user, postId, ...rest } = options;
    const body = { platform, user, post_id: postId };
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) body[this._apiKey(key)] = value;
    }
    return this._request('/uploadposts/posts/unpublish', 'POST', body);
  }

  // ==================== Resource endpoints ====================
  //
  // Post actions, best times, the queue, and the Telegram, Bluesky and Google
  // Business management endpoints all go through _call(): every option is sent
  // to the API, nothing is dropped. Top-level camelCase keys become the API's
  // snake_case (`locationId` -> `location_id`; snake_case keys are sent as
  // given) and nested objects are sent untouched, so Telegram / Google objects
  // keep their own shape. Path parameters (`draftId`, `nsid`...) are taken out
  // of the options. A file field (`file`, `photo`, `sticker`, `avatar`,
  // `telegramMedia`...) given as a local path, stream or Buffer turns the
  // request into multipart/form-data; URLs and Telegram file_ids stay strings.

  /** @private */
  _apiKey(key) {
    if (!/[A-Z]/.test(key) || UploadPost.KEEP_CAMEL_KEYS.has(key)) return key;
    return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  }

  /** @private */
  _isUploadValue(value) {
    if (Buffer.isBuffer(value)) return true;
    if (value && typeof value === 'object' && typeof value.pipe === 'function') return true;
    if (typeof value !== 'string' || !value) return false;
    const lower = value.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) return false;
    try {
      return fs.statSync(value).isFile();
    } catch {
      return false;
    }
  }

  /** @private */
  async _call(method, path, options = {}, defaults = {}) {
    const params = {};
    for (const [key, value] of Object.entries({ ...defaults, ...(options || {}) })) {
      if (value === undefined) continue;
      params[this._apiKey(key)] = value;
    }
    const endpoint = path.replace(/\{(\w+)\}/g, (_, name) => {
      const value = params[name];
      delete params[name];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Upload-Post: ${name} is required`);
      }
      return encodeURIComponent(String(value));
    });

    if (method === 'GET') {
      const query = {};
      for (const [key, value] of Object.entries(params)) {
        if (value === null) continue;
        if (Array.isArray(value)) query[key] = value.join(',');
        else if (typeof value === 'object') query[key] = JSON.stringify(value);
        else if (typeof value === 'boolean') query[key] = String(value);
        else query[key] = value;
      }
      return this._request(endpoint, 'GET', Object.keys(query).length ? query : null);
    }

    const fileKeys = Object.keys(params).filter(
      (key) => UploadPost.FILE_FIELDS.has(key) && this._isUploadValue(params[key])
    );
    if (fileKeys.length) {
      const form = new FormData();
      for (const [key, value] of Object.entries(params)) {
        if (fileKeys.includes(key)) {
          if (typeof value === 'string') form.append(key, createReadStream(value));
          else if (Buffer.isBuffer(value)) form.append(key, value, { filename: key });
          else form.append(key, value);
        } else {
          this._appendField(form, key, value);
        }
      }
      return this._request(endpoint, method, form, true);
    }
    return this._request(endpoint, method, params);
  }

  // ---- Posts: edit, repost, actions ----
  /**
   * Edit a published post (Facebook, LinkedIn, X, Google Business, Telegram: text, buttons, pin/unpin, stop a poll, live location, replace the media).
   * YouTube: `title`, `description`, `tags`, `privacyStatus`, `categoryId`, `publishAt`,
   * `hasPaidProductPlacement`, `defaultLanguage`, `embeddable`, `publicStatsViewable`,
   * `selfDeclaredMadeForKids`, `containsSyntheticMedia`, `license`, `recordingDate`,
   * `localizations`, `localizationsRemove`, `brandPartner` (the YouTube camelCase names are sent as they are).
   * @see https://docs.upload-post.com/api/edit-post
   * @param {Object} options - `user`, `platform`, `postId` and any other API field
   * @returns {Promise<Object>}
   */
  async editPost(options = {}) {
    return this._call('POST', '/uploadposts/posts/edit', options);
  }

  /**
   * Repost / reshare a post (LinkedIn, X, Threads; Telegram forward or copy with `mode`, `post_ids`, `all_messages`).
   * @see https://docs.upload-post.com/api/repost
   * @param {Object} options - `user`, `platform` and any other API field (optional: `postId`)
   * @returns {Promise<Object>}
   */
  async repostPost(options = {}) {
    return this._call('POST', '/uploadposts/posts/repost', options);
  }

  /**
   * Act on a published post: Telegram reactions and forward/copy; Bluesky bookmark/unbookmark, pin/unpin, reply and quote settings, detach/reattach quotes.
   * @see https://docs.upload-post.com/api/bluesky-post-actions
   * @param {Object} options - `user`, `platform`, `action` and any other API field
   * @returns {Promise<Object>}
   */
  async postAction(options = {}) {
    return this._call('POST', '/uploadposts/posts/action', options);
  }

  /**
   * Save a post: a Pinterest Pin to a board, or a Bluesky bookmark (`platform: "bluesky"`).
   * @see https://docs.upload-post.com/api/save-pin
   * @param {Object} options - `user`, `postId` and any other API field
   * @returns {Promise<Object>}
   */
  async savePost(options = {}) {
    return this._call('POST', '/uploadposts/posts/save', options);
  }

  // ---- Best time to post and queue ----
  /**
   * Best hours to publish for a connected account, with `source` and `confidence` (`timezone`, `top`, `refresh`, `page_urn`, `facebook_page_id`).
   * @see https://docs.upload-post.com/api/best-times
   * @param {Object} options - `profileUsername`, `platform` and any other API field
   * @returns {Promise<Object>}
   */
  async getBestTimes(options = {}) {
    return this._call('GET', '/uploadposts/best-times', options);
  }

  /**
   * Queue settings, including `slots_mode`, `auto_slots` and `effective_slots`.
   * @see https://docs.upload-post.com/api/queue-system
   * @param {Object} options - `profileUsername` and any other API field
   * @returns {Promise<Object>}
   */
  async getQueueSettings(options = {}) {
    return this._call('GET', '/uploadposts/queue/settings', options);
  }

  /**
   * Update the queue. `slots: "auto"` (or `slots_mode: "auto"`) fills the best hours automatically (`auto_slots_count`, `auto_platforms`, `refresh`); a `slots` array switches back to fixed slots.
   * @see https://docs.upload-post.com/api/queue-system
   * @param {Object} options - `profileUsername` and any other API field
   * @returns {Promise<Object>}
   */
  async updateQueueSettings(options = {}) {
    return this._call('POST', '/uploadposts/queue/settings', options);
  }

  /**
   * Upcoming queue slots and what is scheduled in each (`count`, max 50).
   * @see https://docs.upload-post.com/api/queue-system
   * @param {Object} options - `profileUsername` and any other API field
   * @returns {Promise<Object>}
   */
  async getQueuePreview(options = {}) {
    return this._call('GET', '/uploadposts/queue/preview', options);
  }

  /**
   * Next free queue slot.
   * @see https://docs.upload-post.com/api/queue-system
   * @param {Object} options - `profileUsername` and any other API field
   * @returns {Promise<Object>}
   */
  async getNextQueueSlot(options = {}) {
    return this._call('GET', '/uploadposts/queue/next-slot', options);
  }

  /**
   * Mark a queue slot (ISO 8601, UTC) as full.
   * @see https://docs.upload-post.com/api/queue-system
   * @param {Object} options - `profileUsername`, `slotDatetime` and any other API field
   * @returns {Promise<Object>}
   */
  async markQueueSlotFull(options = {}) {
    return this._call('POST', '/uploadposts/queue/slot-full', options);
  }

  /**
   * Unmark a queue slot marked as full.
   * @see https://docs.upload-post.com/api/queue-system
   * @param {Object} options - `profileUsername`, `slotDatetime` and any other API field
   * @returns {Promise<Object>}
   */
  async unmarkQueueSlotFull(options = {}) {
    return this._call('DELETE', '/uploadposts/queue/slot-full', options);
  }

  // ---- Telegram: chat, members and invite links ----
  /**
   * Chat details, subscribers/members and administrators (`include_administrators`, `return_bots`).
   * @see https://docs.upload-post.com/api/telegram-chat-insights
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramChatInfo(options = {}) {
    return this._call('GET', '/uploadposts/telegram/chat-info', options);
  }

  /**
   * Change the chat title, description, photo (file or `photo_url`), permissions, slow mode, sticker set...
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateTelegramChatInfo(options = {}) {
    return this._call('PATCH', '/uploadposts/telegram/chat-info', options);
  }

  /**
   * Boosts of the chat (with `user_id`: that user's boosts).
   * @see https://docs.upload-post.com/api/telegram-chat-insights
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramBoosts(options = {}) {
    return this._call('GET', '/uploadposts/telegram/boosts', options);
  }

  /**
   * Read one member (`user_id`) or list the administrators.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramMember(options = {}) {
    return this._call('GET', '/uploadposts/telegram/members', options);
  }

  /**
   * Ban, unban, restrict, promote or give a custom title to a member (`action`).
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async moderateTelegramMember(options = {}) {
    return this._call('POST', '/uploadposts/telegram/members', options);
  }

  /**
   * Create an invite link (name, expiry, member limit, join requests, subscription).
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createTelegramInviteLink(options = {}) {
    return this._call('POST', '/uploadposts/telegram/invite-links', options);
  }

  /**
   * Edit an invite link.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async editTelegramInviteLink(options = {}) {
    return this._call('PATCH', '/uploadposts/telegram/invite-links', options);
  }

  /**
   * Revoke an invite link.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async revokeTelegramInviteLink(options = {}) {
    return this._call('DELETE', '/uploadposts/telegram/invite-links', options);
  }

  /**
   * Generate a new primary invite link (the previous one stops working).
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createTelegramPrimaryInviteLink(options = {}) {
    return this._call('POST', '/uploadposts/telegram/invite-links/primary', options);
  }

  /**
   * Approve or decline a request to join the chat.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async answerTelegramJoinRequest(options = {}) {
    return this._call('POST', '/uploadposts/telegram/join-requests', options);
  }

  /**
   * Custom emoji that can be used as forum topic icons.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramTopicIcons(options = {}) {
    return this._call('GET', '/uploadposts/telegram/topics/icons', options);
  }

  /**
   * Create a forum topic.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createTelegramTopic(options = {}) {
    return this._call('POST', '/uploadposts/telegram/topics', options);
  }

  /**
   * Edit, close, reopen, hide, unhide or unpin a forum topic.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async editTelegramTopic(options = {}) {
    return this._call('PATCH', '/uploadposts/telegram/topics', options);
  }

  /**
   * Delete a forum topic.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteTelegramTopic(options = {}) {
    return this._call('DELETE', '/uploadposts/telegram/topics', options);
  }

  /**
   * Unpin every message of the chat (or of a topic).
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async unpinAllTelegramMessages(options = {}) {
    return this._call('POST', '/uploadposts/telegram/unpin-all', options);
  }

  /**
   * Make the bot leave the connected chat.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async leaveTelegramChat(options = {}) {
    return this._call('POST', '/uploadposts/telegram/leave', options);
  }

  /**
   * Approve or decline a suggested post in a channel direct messages chat.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async answerTelegramSuggestedPost(options = {}) {
    return this._call('POST', '/uploadposts/telegram/suggested-posts', options);
  }

  /**
   * Last messages of a user's personal channel.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user`, `userId` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramUserPersonalChatMessages(options = {}) {
    return this._call('GET', '/uploadposts/telegram/users/{user_id}/personal-chat-messages', options);
  }

  /**
   * Profile audios of a Telegram user.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user`, `userId` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramUserProfileAudios(options = {}) {
    return this._call('GET', '/uploadposts/telegram/users/{user_id}/profile-audios', options);
  }

  /**
   * Backdrops available for the Telegram share screen theme.
   * @see https://docs.upload-post.com/api/telegram-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramShareThemeBackdrops(options = {}) {
    return this._call('GET', '/uploadposts/telegram/share-theme-backdrops', options);
  }

  /**
   * Whether update receiving is on for the bot.
   * @see https://docs.upload-post.com/api/telegram-inbox
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramUpdatesStatus(options = {}) {
    return this._call('GET', '/uploadposts/telegram/updates', options);
  }

  // ---- Telegram: bot profile, commands and stickers ----
  /**
   * Bot name, descriptions, photo, menu button and default administrator rights.
   * @see https://docs.upload-post.com/api/telegram-bot-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramBotProfile(options = {}) {
    return this._call('GET', '/uploadposts/telegram/bot-profile', options);
  }

  /**
   * Change the bot profile (`photo`/`animation` as file or URL, `menu_button`, `default_administrator_rights`...).
   * @see https://docs.upload-post.com/api/telegram-bot-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateTelegramBotProfile(options = {}) {
    return this._call('PATCH', '/uploadposts/telegram/bot-profile', options);
  }

  /**
   * Bot commands for a scope and language.
   * @see https://docs.upload-post.com/api/telegram-bot-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramBotCommands(options = {}) {
    return this._call('GET', '/uploadposts/telegram/bot-commands', options);
  }

  /**
   * Set the bot commands (`commands`, `scope`, `language_code`).
   * @see https://docs.upload-post.com/api/telegram-bot-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async setTelegramBotCommands(options = {}) {
    return this._call('POST', '/uploadposts/telegram/bot-commands', options);
  }

  /**
   * Delete the bot commands of a scope and language.
   * @see https://docs.upload-post.com/api/telegram-bot-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteTelegramBotCommands(options = {}) {
    return this._call('DELETE', '/uploadposts/telegram/bot-commands', options);
  }

  /**
   * Read a sticker set (`name`) or custom emoji stickers.
   * @see https://docs.upload-post.com/api/telegram-stickers
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramStickerSet(options = {}) {
    return this._call('GET', '/uploadposts/telegram/sticker-sets', options);
  }

  /**
   * Create a sticker set.
   * @see https://docs.upload-post.com/api/telegram-stickers
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createTelegramStickerSet(options = {}) {
    return this._call('POST', '/uploadposts/telegram/sticker-sets', options);
  }

  /**
   * Edit a sticker set (add, replace, reorder stickers, title, thumbnail, emoji, keywords...).
   * @see https://docs.upload-post.com/api/telegram-stickers
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async editTelegramStickerSet(options = {}) {
    return this._call('PATCH', '/uploadposts/telegram/sticker-sets', options);
  }

  /**
   * Delete a sticker set, or a sticker from it.
   * @see https://docs.upload-post.com/api/telegram-stickers
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteTelegramStickerSet(options = {}) {
    return this._call('DELETE', '/uploadposts/telegram/sticker-sets', options);
  }

  /**
   * Upload a sticker file (`sticker` file or `sticker_url`, `sticker_format`, `owner_user_id`); returns its `file_id`.
   * @see https://docs.upload-post.com/api/telegram-stickers
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async uploadTelegramStickerFile(options = {}) {
    return this._call('POST', '/uploadposts/telegram/sticker-sets/upload', options);
  }

  // ---- Telegram: Stars, invoices and gifts ----
  /**
   * The bot's Telegram Stars balance.
   * @see https://docs.upload-post.com/api/telegram-chat-insights
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramStars(options = {}) {
    return this._call('GET', '/uploadposts/telegram/stars', options);
  }

  /**
   * The bot's Telegram Stars transactions (`offset`, `limit`).
   * @see https://docs.upload-post.com/api/telegram-chat-insights
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramStarTransactions(options = {}) {
    return this._call('GET', '/uploadposts/telegram/stars/transactions', options);
  }

  /**
   * Send an invoice to the connected chat or to `chat_id` (payments go to your bot).
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async sendTelegramInvoice(options = {}) {
    return this._call('POST', '/uploadposts/telegram/invoices', options);
  }

  /**
   * Create an invoice link.
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createTelegramInvoiceLink(options = {}) {
    return this._call('POST', '/uploadposts/telegram/invoice-links', options);
  }

  /**
   * Refund a Telegram Stars payment (`user_id`, `telegram_payment_charge_id`).
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async refundTelegramStarPayment(options = {}) {
    return this._call('POST', '/uploadposts/telegram/stars/refund', options);
  }

  /**
   * Cancel or re-enable a user's Stars subscription.
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async editTelegramStarSubscription(options = {}) {
    return this._call('POST', '/uploadposts/telegram/stars/subscription', options);
  }

  /**
   * Gifts the bot can send.
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramAvailableGifts(options = {}) {
    return this._call('GET', '/uploadposts/telegram/gifts', options);
  }

  /**
   * Gifts owned by a user or a chat.
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramOwnedGifts(options = {}) {
    return this._call('GET', '/uploadposts/telegram/gifts/owned', options);
  }

  /**
   * A unique gift by name.
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramUniqueGift(options = {}) {
    return this._call('GET', '/uploadposts/telegram/gifts/unique', options);
  }

  /**
   * Payment queries that were not answered in time.
   * @see https://docs.upload-post.com/api/telegram-payments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getTelegramUnansweredPayments(options = {}) {
    return this._call('GET', '/uploadposts/telegram/payments/unanswered', options);
  }

  // ---- Bluesky: reads ----
  /**
   * Who liked, reposted or quoted a post (`type`: likes, reposts, quotes; `limit`, `cursor`).
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - `postId` and any other API field
   * @returns {Promise<Object>}
   */
  async getPostEngagement(options = {}) {
    return this._call('GET', '/uploadposts/post-engagement', options, { platform: 'bluesky' });
  }

  /**
   * One or several Bluesky profiles (`actor`: handles or DIDs, comma separated, up to 25; without it, the connected account).
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getBlueskyProfiles(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/profile', options);
  }

  /**
   * Search Bluesky posts (`sort`, `since`, `until`, `author`, `lang`, `tag`, `limit`, `cursor`...).
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - `user`, `q` and any other API field
   * @returns {Promise<Object>}
   */
  async searchBlueskyPosts(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/search/posts', options);
  }

  /**
   * Search Bluesky accounts.
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - `q` and any other API field
   * @returns {Promise<Object>}
   */
  async searchBlueskyActors(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/search/actors', options);
  }

  /**
   * Followers of an account (`actor`, or the connected one with `user`; `known=true` for followers you follow).
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getBlueskyFollowers(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/followers', options);
  }

  /**
   * Accounts an account follows.
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getBlueskyFollows(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/follows', options);
  }

  /**
   * Read-only gateway to an allow-listed public Bluesky XRPC method (e.g. `app.bsky.feed.getAuthorFeed`); returns Bluesky's answer untouched.
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - `nsid` and any other API field
   * @returns {Promise<Object>}
   */
  async blueskyXrpc(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/xrpc/{nsid}', options);
  }

  /**
   * Moderation labels on the account and its posts.
   * @see https://docs.upload-post.com/api/bluesky-reads
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyLabels(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/labels', options);
  }

  // ---- Bluesky: notifications ----
  /**
   * List notifications (`reasons`, `priority`, `limit`, `cursor`).
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyNotifications(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/notifications', options);
  }

  /**
   * Unread notification count.
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyUnreadCount(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/notifications/unread-count', options);
  }

  /**
   * Mark notifications as seen (up to `seen_at`).
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async markBlueskyNotificationsSeen(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/notifications/seen', options);
  }

  /**
   * Notification preferences.
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyNotificationPreferences(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/notification-preferences', options);
  }

  /**
   * Update notification preferences.
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateBlueskyNotificationPreferences(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/notification-preferences', options);
  }

  /**
   * Accounts whose activity you are subscribed to.
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyActivitySubscriptions(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/activity-subscriptions', options);
  }

  /**
   * Subscribe to (or stop) an account's posts and replies.
   * @see https://docs.upload-post.com/api/bluesky-notifications
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async setBlueskyActivitySubscription(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/activity-subscriptions', options);
  }

  // ---- Bluesky: profile, settings and drafts ----
  /**
   * The connected account's profile record.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyOwnProfile(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/profile/self', options);
  }

  /**
   * Update the profile (display name, description, `avatar`/`banner` files, links, pinned post...). Fields not sent stay as they are.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateBlueskyProfile(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/profile/self', options);
  }

  /**
   * Read the live status.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyStatus(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/status', options);
  }

  /**
   * Set the live status.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async setBlueskyStatus(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/status', options);
  }

  /**
   * Clear the live status.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async clearBlueskyStatus(options = {}) {
    return this._call('DELETE', '/uploadposts/bluesky/status', options);
  }

  /**
   * Chat and discovery settings.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskySettings(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/settings', options);
  }

  /**
   * Change chat and discovery settings.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateBlueskySettings(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/settings', options);
  }

  /**
   * App preferences (content filters, feeds, muted words...).
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyPreferences(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/preferences', options);
  }

  /**
   * Replace some app preferences.
   * @see https://docs.upload-post.com/api/bluesky-profile
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateBlueskyPreferences(options = {}) {
    return this._call('PUT', '/uploadposts/bluesky/preferences', options);
  }

  /**
   * List drafts.
   * @see https://docs.upload-post.com/api/bluesky-drafts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listBlueskyDrafts(options = {}) {
    return this._call('GET', '/uploadposts/bluesky/drafts', options);
  }

  /**
   * Create a draft.
   * @see https://docs.upload-post.com/api/bluesky-drafts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createBlueskyDraft(options = {}) {
    return this._call('POST', '/uploadposts/bluesky/drafts', options);
  }

  /**
   * Replace a draft.
   * @see https://docs.upload-post.com/api/bluesky-drafts
   * @param {Object} options - `user`, `draftId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateBlueskyDraft(options = {}) {
    return this._call('PATCH', '/uploadposts/bluesky/drafts/{draft_id}', options);
  }

  /**
   * Delete a draft.
   * @see https://docs.upload-post.com/api/bluesky-drafts
   * @param {Object} options - `user`, `draftId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteBlueskyDraft(options = {}) {
    return this._call('DELETE', '/uploadposts/bluesky/drafts/{draft_id}', options);
  }

  // ---- Bluesky: chat ----
  /**
   * Chat status of the account.
   * @see https://docs.upload-post.com/api/bluesky-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyChatStatus(options = {}) {
    return this._call('GET', '/uploadposts/dms/bluesky/status', options);
  }

  /**
   * DM notification settings.
   * @see https://docs.upload-post.com/api/bluesky-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getBlueskyChatPreferences(options = {}) {
    return this._call('GET', '/uploadposts/dms/bluesky/preferences', options);
  }

  /**
   * Change DM notification settings.
   * @see https://docs.upload-post.com/api/bluesky-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateBlueskyChatPreferences(options = {}) {
    return this._call('POST', '/uploadposts/dms/bluesky/preferences', options);
  }

  /**
   * Export the account's chat history.
   * @see https://docs.upload-post.com/api/bluesky-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async exportBlueskyChat(options = {}) {
    return this._call('GET', '/uploadposts/dms/bluesky/export', options);
  }

  // ---- Google Business: posts and reviews ----
  /**
   * List the location's posts (`location_id`, `page_size`, `page_token`). Edit them with editPost and delete them with unpublishPost.
   * @see https://docs.upload-post.com/api/google-business-posts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessPosts(options = {}) {
    return this._call('GET', '/uploadposts/google-business/posts', options);
  }

  /**
   * Read one post (`post_id` or `post_name`).
   * @see https://docs.upload-post.com/api/google-business-posts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessPost(options = {}) {
    return this._call('GET', '/uploadposts/google-business/posts/get', options);
  }

  /**
   * List reviews (`location_id`, `page_size`, `page_token`, `order_by`).
   * @see https://docs.upload-post.com/api/google-business-reviews
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessReviews(options = {}) {
    return this._call('GET', '/uploadposts/google-business/reviews', options);
  }

  /**
   * Read one review (`review_name`, or `review_id` + `location_id`).
   * @see https://docs.upload-post.com/api/google-business-reviews
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessReview(options = {}) {
    return this._call('GET', '/uploadposts/google-business/reviews/get', options);
  }

  /**
   * Reviews of several locations at once (`location_ids`).
   * @see https://docs.upload-post.com/api/google-business-reviews
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async batchGetGoogleBusinessReviews(options = {}) {
    return this._call('GET', '/uploadposts/google-business/reviews/batch', options);
  }

  /**
   * Reply to a review, or replace the reply (`review_name`, or `review_id` + `location_id`).
   * @see https://docs.upload-post.com/api/google-business-reviews
   * @param {Object} options - `user`, `comment` and any other API field
   * @returns {Promise<Object>}
   */
  async replyToGoogleBusinessReview(options = {}) {
    return this._call('PUT', '/uploadposts/google-business/reviews/reply', options);
  }

  /**
   * Delete the reply to a review.
   * @see https://docs.upload-post.com/api/google-business-reviews
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteGoogleBusinessReviewReply(options = {}) {
    return this._call('DELETE', '/uploadposts/google-business/reviews/reply', options);
  }

  // ---- Google Business: gallery and performance ----
  /**
   * List the location's gallery.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessMedia(options = {}) {
    return this._call('GET', '/uploadposts/google-business/media', options);
  }

  /**
   * Read one gallery item.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessMedia(options = {}) {
    return this._call('GET', '/uploadposts/google-business/media/get', options);
  }

  /**
   * Upload a photo or video to the gallery: `file` (local path, stream or Buffer) or `source_url`, plus `category`, `description`, `media_format`.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async uploadGoogleBusinessMedia(options = {}) {
    return this._call('POST', '/uploadposts/google-business/media', options);
  }

  /**
   * Change a gallery item's category.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessMedia(options = {}) {
    return this._call('PATCH', '/uploadposts/google-business/media', options);
  }

  /**
   * Delete a gallery item.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteGoogleBusinessMedia(options = {}) {
    return this._call('DELETE', '/uploadposts/google-business/media', options);
  }

  /**
   * Photos uploaded by customers.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessCustomerMedia(options = {}) {
    return this._call('GET', '/uploadposts/google-business/media/customers', options);
  }

  /**
   * One customer photo.
   * @see https://docs.upload-post.com/api/google-business-media
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessCustomerMedia(options = {}) {
    return this._call('GET', '/uploadposts/google-business/media/customers/get', options);
  }

  /**
   * Daily metrics for any date range (impressions, calls, website clicks, directions...: `metrics`, `start_date`, `end_date`).
   * @see https://docs.upload-post.com/api/google-business-performance
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessPerformance(options = {}) {
    return this._call('GET', '/uploadposts/google-business/performance', options);
  }

  /**
   * Monthly search keywords that showed the location (`start_month`, `end_month`).
   * @see https://docs.upload-post.com/api/google-business-performance
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessSearchKeywords(options = {}) {
    return this._call('GET', '/uploadposts/google-business/performance/keywords', options);
  }

  // ---- Google Business: location info ----
  /**
   * Read the location's info (name, address, hours, phones, categories, service area, open status...).
   * @see https://docs.upload-post.com/api/google-business-info
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessLocationInfo(options = {}) {
    return this._call('GET', '/uploadposts/google-business/location-info', options);
  }

  /**
   * Edit the location's info. `edit_mode: "legacy"` (default) or `"strict"` (`dry_run`, `confirm`, `include_edit_status`); `validate_only` in both.
   * @see https://docs.upload-post.com/api/google-business-info
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessLocationInfo(options = {}) {
    return this._call('PATCH', '/uploadposts/google-business/location-info', options);
  }

  /**
   * Changes Google suggested for the location (`diff_fields`).
   * @see https://docs.upload-post.com/api/google-business-info
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessGoogleUpdates(options = {}) {
    return this._call('GET', '/uploadposts/google-business/location-info/google-updated', options);
  }

  /**
   * Accept or reject Google's suggested changes, field by field.
   * @see https://docs.upload-post.com/api/google-business-info
   * @param {Object} options - `user`, `decision`, `fields` and any other API field
   * @returns {Promise<Object>}
   */
  async answerGoogleBusinessGoogleUpdates(options = {}) {
    return this._call('POST', '/uploadposts/google-business/location-info/google-updates', options);
  }

  /**
   * Edit status of each field (experimental).
   * @see https://docs.upload-post.com/api/google-business-info
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessLocationInfoExtended(options = {}) {
    return this._call('GET', '/uploadposts/google-business/location-info/extended', options);
  }

  /**
   * List locations with filters (`account`, `filter`, `order_by`, `read_mask`, `page_size`, `page_token`).
   * @see https://docs.upload-post.com/api/google-business-info
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessLocations(options = {}) {
    return this._call('GET', '/uploadposts/google-business/locations/list', options);
  }

  /**
   * Locations available to a profile and the one pinned for its uploads.
   * @see https://docs.upload-post.com/api/google-business-location
   * @param {Object} options - `profileUsername` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessPinnedLocation(options = {}) {
    return this._call('GET', '/uploadposts/users/google-business-location', options);
  }

  /**
   * Pin the location a profile publishes to (instead of passing gbpLocationId on every upload).
   * @see https://docs.upload-post.com/api/google-business-location
   * @param {Object} options - `profileUsername`, `gbpLocationId` and any other API field
   * @returns {Promise<Object>}
   */
  async pinGoogleBusinessLocation(options = {}) {
    return this._call('POST', '/uploadposts/users/google-business-location', options);
  }

  /**
   * Clear the pinned location.
   * @see https://docs.upload-post.com/api/google-business-location
   * @param {Object} options - `profileUsername` and any other API field
   * @returns {Promise<Object>}
   */
  async clearGoogleBusinessLocationPin(options = {}) {
    return this._call('DELETE', '/uploadposts/users/google-business-location', options);
  }

  // ---- Google Business: catalogs, attributes, Place Actions, menus, services and lodging ----
  /**
   * Search categories (`region_code`, `language_code`, `query`).
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async searchGoogleBusinessCategories(options = {}) {
    return this._call('GET', '/uploadposts/google-business/categories', options);
  }

  /**
   * Category details: service types and more-hours types (`names`).
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async batchGetGoogleBusinessCategories(options = {}) {
    return this._call('GET', '/uploadposts/google-business/categories/batch', options);
  }

  /**
   * Search chains (`name`).
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async searchGoogleBusinessChains(options = {}) {
    return this._call('GET', '/uploadposts/google-business/chains', options);
  }

  /**
   * One chain (`chain`).
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessChain(options = {}) {
    return this._call('GET', '/uploadposts/google-business/chains/get', options);
  }

  /**
   * Is the business already on Google? Search Google's listings.
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async searchGoogleBusinessGoogleLocations(options = {}) {
    return this._call('POST', '/uploadposts/google-business/google-locations/search', options);
  }

  /**
   * Locations Google recommends for the account.
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessRecommendedLocations(options = {}) {
    return this._call('GET', '/uploadposts/google-business/google-locations/recommended', options);
  }

  /**
   * Report a wrong listing to Google.
   * @see https://docs.upload-post.com/api/google-business-catalogs
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async reportGoogleBusinessGoogleLocation(options = {}) {
    return this._call('POST', '/uploadposts/google-business/google-locations/report', options);
  }

  /**
   * Attributes the location can use.
   * @see https://docs.upload-post.com/api/google-business-attributes
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessAvailableAttributes(options = {}) {
    return this._call('GET', '/uploadposts/google-business/attributes/available', options);
  }

  /**
   * Current attributes of the location.
   * @see https://docs.upload-post.com/api/google-business-attributes
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessAttributes(options = {}) {
    return this._call('GET', '/uploadposts/google-business/attributes', options);
  }

  /**
   * Update attributes.
   * @see https://docs.upload-post.com/api/google-business-attributes
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessAttributes(options = {}) {
    return this._call('PATCH', '/uploadposts/google-business/attributes', options);
  }

  /**
   * Attributes as Google shows them.
   * @see https://docs.upload-post.com/api/google-business-attributes
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessAttributesGoogleUpdated(options = {}) {
    return this._call('GET', '/uploadposts/google-business/attributes/google-updated', options);
  }

  /**
   * Attributes with their edit status (experimental).
   * @see https://docs.upload-post.com/api/google-business-attributes
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessAttributesExtended(options = {}) {
    return this._call('GET', '/uploadposts/google-business/attributes/extended', options);
  }

  /**
   * Place Action types (booking, ordering, shopping links...) the location can use.
   * @see https://docs.upload-post.com/api/google-business-place-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessPlaceActionTypes(options = {}) {
    return this._call('GET', '/uploadposts/google-business/place-actions/types', options);
  }

  /**
   * List Place Action links.
   * @see https://docs.upload-post.com/api/google-business-place-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessPlaceActions(options = {}) {
    return this._call('GET', '/uploadposts/google-business/place-actions', options);
  }

  /**
   * Read one Place Action link (`link`).
   * @see https://docs.upload-post.com/api/google-business-place-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessPlaceAction(options = {}) {
    return this._call('GET', '/uploadposts/google-business/place-actions/get', options);
  }

  /**
   * Create a Place Action link.
   * @see https://docs.upload-post.com/api/google-business-place-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createGoogleBusinessPlaceAction(options = {}) {
    return this._call('POST', '/uploadposts/google-business/place-actions', options);
  }

  /**
   * Edit or switch off a Place Action link.
   * @see https://docs.upload-post.com/api/google-business-place-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessPlaceAction(options = {}) {
    return this._call('PATCH', '/uploadposts/google-business/place-actions', options);
  }

  /**
   * Delete a Place Action link.
   * @see https://docs.upload-post.com/api/google-business-place-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteGoogleBusinessPlaceAction(options = {}) {
    return this._call('DELETE', '/uploadposts/google-business/place-actions', options);
  }

  /**
   * Food menus of the location.
   * @see https://docs.upload-post.com/api/google-business-menus-services
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessFoodMenus(options = {}) {
    return this._call('GET', '/uploadposts/google-business/food-menus', options);
  }

  /**
   * Replace the food menus.
   * @see https://docs.upload-post.com/api/google-business-menus-services
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessFoodMenus(options = {}) {
    return this._call('PUT', '/uploadposts/google-business/food-menus', options);
  }

  /**
   * Services of the location.
   * @see https://docs.upload-post.com/api/google-business-menus-services
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessServices(options = {}) {
    return this._call('GET', '/uploadposts/google-business/services', options);
  }

  /**
   * Replace the services.
   * @see https://docs.upload-post.com/api/google-business-menus-services
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessServices(options = {}) {
    return this._call('PUT', '/uploadposts/google-business/services', options);
  }

  /**
   * Lodging data of a hotel (`read_mask`).
   * @see https://docs.upload-post.com/api/google-business-lodging
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessLodging(options = {}) {
    return this._call('GET', '/uploadposts/google-business/lodging', options);
  }

  /**
   * Update lodging data.
   * @see https://docs.upload-post.com/api/google-business-lodging
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessLodging(options = {}) {
    return this._call('PATCH', '/uploadposts/google-business/lodging', options);
  }

  /**
   * Lodging data as Google shows it.
   * @see https://docs.upload-post.com/api/google-business-lodging
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessLodgingGoogleUpdated(options = {}) {
    return this._call('GET', '/uploadposts/google-business/lodging/google-updated', options);
  }

  // ---- Google Business: accounts and verification (reads) ----
  /**
   * Google Business accounts and location groups (`type`).
   * @see https://docs.upload-post.com/api/google-business-accounts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessAccounts(options = {}) {
    return this._call('GET', '/uploadposts/google-business/accounts', options);
  }

  /**
   * Read one account (`account`).
   * @see https://docs.upload-post.com/api/google-business-accounts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessAccount(options = {}) {
    return this._call('GET', '/uploadposts/google-business/accounts/get', options);
  }

  /**
   * Create a location group or user group (`type`, `account_name`, `confirm`).
   * @see https://docs.upload-post.com/api/google-business-accounts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createGoogleBusinessAccount(options = {}) {
    return this._call('POST', '/uploadposts/google-business/accounts', options);
  }

  /**
   * Admins of an account or a location (`scope`, `location_id`).
   * @see https://docs.upload-post.com/api/google-business-accounts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessAdmins(options = {}) {
    return this._call('GET', '/uploadposts/google-business/admins', options);
  }

  /**
   * Pending invitations of an account.
   * @see https://docs.upload-post.com/api/google-business-accounts
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessInvitations(options = {}) {
    return this._call('GET', '/uploadposts/google-business/invitations', options);
  }

  /**
   * Whether the location is verified and in good standing.
   * @see https://docs.upload-post.com/api/google-business-verification
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessVerificationState(options = {}) {
    return this._call('GET', '/uploadposts/google-business/verification/state', options);
  }

  /**
   * Verification methods available for the location.
   * @see https://docs.upload-post.com/api/google-business-verification
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessVerificationOptions(options = {}) {
    return this._call('POST', '/uploadposts/google-business/verification/options', options);
  }

  /**
   * Past verifications of the location.
   * @see https://docs.upload-post.com/api/google-business-verification
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listGoogleBusinessVerifications(options = {}) {
    return this._call('GET', '/uploadposts/google-business/verifications', options);
  }

  // ---- YouTube: videos, thumbnail and quota ----
  /**
   * Full details of videos: status, processing, statistics, translations, paid placement... (`ids`, `chart` or `my_rating`; `parts`, `include_owner_details`).
   * @see https://docs.upload-post.com/api/youtube-videos
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeVideos(options = {}) {
    return this._call('GET', '/uploadposts/youtube/videos', options);
  }

  /**
   * Your account's daily allowance for the YouTube management endpoints and what is left.
   * @see https://docs.upload-post.com/api/youtube-videos
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getYoutubeQuota(options = {}) {
    return this._call('GET', '/uploadposts/youtube/quota', options);
  }

  /**
   * Set a video's thumbnail: `thumbnail` (local file, stream or Buffer) or `thumbnail_url`.
   * @see https://docs.upload-post.com/api/youtube-thumbnail
   * @param {Object} options - `user`, `videoId` and any other API field
   * @returns {Promise<Object>}
   */
  async setYoutubeThumbnail(options = {}) {
    return this._call('POST', '/uploadposts/youtube/thumbnail', options);
  }

  // ---- YouTube: playlists ----
  /**
   * List the channel's playlists (or `ids`).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubePlaylists(options = {}) {
    return this._call('GET', '/uploadposts/youtube/playlists', options);
  }

  /**
   * Create a playlist (`title`, `description`, `privacy_status`, `default_language`, `localizations`...).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createYoutubePlaylist(options = {}) {
    return this._call('POST', '/uploadposts/youtube/playlists', options);
  }

  /**
   * Edit a playlist (only what you send changes).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubePlaylist(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/playlists/{playlist_id}', options);
  }

  /**
   * Delete a playlist (needs `confirm: true`; the videos stay).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubePlaylist(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/playlists/{playlist_id}', options);
  }

  /**
   * Videos of a playlist.
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubePlaylistItems(options = {}) {
    return this._call('GET', '/uploadposts/youtube/playlists/{playlist_id}/items', options);
  }

  /**
   * Add a video to a playlist (`video_id`, `position`, `note`).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async addYoutubePlaylistItem(options = {}) {
    return this._call('POST', '/uploadposts/youtube/playlists/{playlist_id}/items', options);
  }

  /**
   * Reorder a playlist video or change its note.
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId`, `itemId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubePlaylistItem(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/playlists/{playlist_id}/items/{item_id}', options);
  }

  /**
   * Remove a video from a playlist (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId`, `itemId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubePlaylistItem(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/playlists/{playlist_id}/items/{item_id}', options);
  }

  /**
   * The playlist's custom image.
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubePlaylistImage(options = {}) {
    return this._call('GET', '/uploadposts/youtube/playlists/{playlist_id}/image', options);
  }

  /**
   * Add the playlist image: `image` (local file, stream or Buffer) or `image_url`.
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async setYoutubePlaylistImage(options = {}) {
    return this._call('POST', '/uploadposts/youtube/playlists/{playlist_id}/image', options);
  }

  /**
   * Replace the playlist image (same fields, needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async replaceYoutubePlaylistImage(options = {}) {
    return this._call('PUT', '/uploadposts/youtube/playlists/{playlist_id}/image', options);
  }

  /**
   * Remove the playlist image (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-playlists
   * @param {Object} options - `user`, `playlistId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubePlaylistImage(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/playlists/{playlist_id}/image', options);
  }

  // ---- YouTube: captions ----
  /**
   * Caption tracks of a video.
   * @see https://docs.upload-post.com/api/youtube-captions
   * @param {Object} options - `user`, `videoId` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeCaptions(options = {}) {
    return this._call('GET', '/uploadposts/youtube/captions', options);
  }

  /**
   * Add a caption track: `file` (local file, stream or Buffer) or `file_url`, plus `language`, `name`, `is_draft`.
   * @see https://docs.upload-post.com/api/youtube-captions
   * @param {Object} options - `user`, `videoId` and any other API field
   * @returns {Promise<Object>}
   */
  async uploadYoutubeCaption(options = {}) {
    return this._call('POST', '/uploadposts/youtube/captions', options);
  }

  /**
   * Replace a track's file and/or publish a draft (`is_draft: false`).
   * @see https://docs.upload-post.com/api/youtube-captions
   * @param {Object} options - `user`, `captionId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubeCaption(options = {}) {
    return this._call('PUT', '/uploadposts/youtube/captions/{caption_id}', options);
  }

  /**
   * Download a track (`tfmt`: srt, vtt, sbv, scc, ttml; `tlang` to translate). Returns the file's text.
   * @see https://docs.upload-post.com/api/youtube-captions
   * @param {Object} options - `user`, `captionId` and any other API field
   * @returns {Promise<Object>}
   */
  async downloadYoutubeCaption(options = {}) {
    return this._call('GET', '/uploadposts/youtube/captions/{caption_id}/download', options);
  }

  /**
   * Delete a track (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-captions
   * @param {Object} options - `user`, `captionId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubeCaption(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/captions/{caption_id}', options);
  }

  // ---- YouTube: comments inbox ----
  /**
   * Comment threads of a video (`video_id`), of the whole channel (`scope: "channel"`) or by `ids`; `moderation_status`, `order`, `search_terms`...
   * @see https://docs.upload-post.com/api/youtube-comments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeComments(options = {}) {
    return this._call('GET', '/uploadposts/youtube/comments', options);
  }

  /**
   * Replies to a comment (`parent_id`) or comments by `ids`.
   * @see https://docs.upload-post.com/api/youtube-comments
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeCommentReplies(options = {}) {
    return this._call('GET', '/uploadposts/youtube/comments/replies', options);
  }

  /**
   * Reply to a comment (`parent_id`) or comment on a video (`video_id`); `idempotency_key` optional.
   * @see https://docs.upload-post.com/api/youtube-comments
   * @param {Object} options - `user`, `text` and any other API field
   * @returns {Promise<Object>}
   */
  async createYoutubeComment(options = {}) {
    return this._call('POST', '/uploadposts/youtube/comments', options);
  }

  /**
   * Edit your own comment (`text`).
   * @see https://docs.upload-post.com/api/youtube-comments
   * @param {Object} options - `user`, `commentId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubeComment(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/comments/{comment_id}', options);
  }

  /**
   * Delete your own comment (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-comments
   * @param {Object} options - `user`, `commentId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubeComment(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/comments/{comment_id}', options);
  }

  /**
   * Approve, hold or reject comments of your channel (`rejected` needs `confirm: true`; `ban_author`).
   * @see https://docs.upload-post.com/api/youtube-comments
   * @param {Object} options - `user`, `commentIds`, `status` and any other API field
   * @returns {Promise<Object>}
   */
  async moderateYoutubeComments(options = {}) {
    return this._call('POST', '/uploadposts/youtube/comments/moderate', options);
  }

  // ---- YouTube: search and catalogs ----
  /**
   * Search videos, channels and playlists (`q`, `for_mine`, `channel_id`, `type`, `order`...).
   * @see https://docs.upload-post.com/api/youtube-search-catalogs
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async searchYoutube(options = {}) {
    return this._call('GET', '/uploadposts/youtube/search', options);
  }

  /**
   * Video categories of a region (`region`, `hl`, `assignable_only`).
   * @see https://docs.upload-post.com/api/youtube-search-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getYoutubeCategories(options = {}) {
    return this._call('GET', '/uploadposts/youtube/categories', options);
  }

  /**
   * Languages YouTube supports (`hl`).
   * @see https://docs.upload-post.com/api/youtube-search-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getYoutubeLanguages(options = {}) {
    return this._call('GET', '/uploadposts/youtube/languages', options);
  }

  /**
   * Regions (countries) YouTube supports (`hl`).
   * @see https://docs.upload-post.com/api/youtube-search-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getYoutubeRegions(options = {}) {
    return this._call('GET', '/uploadposts/youtube/regions', options);
  }

  /**
   * Reasons for an abuse report (`hl`).
   * @see https://docs.upload-post.com/api/youtube-search-catalogs
   * @param {Object} options - Any API field
   * @returns {Promise<Object>}
   */
  async getYoutubeAbuseReasons(options = {}) {
    return this._call('GET', '/uploadposts/youtube/abuse-reasons', options);
  }

  // ---- YouTube: subscriptions, ratings, reports and activity ----
  /**
   * Channels the connected channel subscribes to (or its subscribers).
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeSubscriptions(options = {}) {
    return this._call('GET', '/uploadposts/youtube/subscriptions', options);
  }

  /**
   * Subscribe the connected channel to a channel (`channel_id`).
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async subscribeYoutubeChannel(options = {}) {
    return this._call('POST', '/uploadposts/youtube/subscriptions', options);
  }

  /**
   * Unsubscribe.
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user`, `subscriptionId` and any other API field
   * @returns {Promise<Object>}
   */
  async unsubscribeYoutubeChannel(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/subscriptions/{subscription_id}', options);
  }

  /**
   * Like, dislike or remove the rating of a video (`rating`: like, dislike, none).
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user`, `videoId` and any other API field
   * @returns {Promise<Object>}
   */
  async rateYoutubeVideo(options = {}) {
    return this._call('POST', '/uploadposts/youtube/videos/{video_id}/rate', options);
  }

  /**
   * The channel's rating of up to 50 videos.
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user`, `ids` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeRating(options = {}) {
    return this._call('GET', '/uploadposts/youtube/videos/rating', options);
  }

  /**
   * Report a video (needs `confirm: true`; it cannot be withdrawn).
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user`, `videoId`, `reasonId` and any other API field
   * @returns {Promise<Object>}
   */
  async reportYoutubeVideoAbuse(options = {}) {
    return this._call('POST', '/uploadposts/youtube/videos/{video_id}/report-abuse', options);
  }

  /**
   * Activity of the channel (uploads, likes, playlist additions...).
   * @see https://docs.upload-post.com/api/youtube-channel-actions
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeActivities(options = {}) {
    return this._call('GET', '/uploadposts/youtube/activities', options);
  }

  // ---- YouTube: channel settings ----
  /**
   * Read the connected channel (settings, branding, translations, statistics).
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeChannel(options = {}) {
    return this._call('GET', '/uploadposts/youtube/channel', options);
  }

  /**
   * Change the channel settings or translations (only what you send changes).
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubeChannel(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/channel', options);
  }

  /**
   * Public data of any channel (`for_handle`, `channel_id`...).
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async lookupYoutubeChannel(options = {}) {
    return this._call('GET', '/uploadposts/youtube/channel/lookup', options);
  }

  /**
   * Upload and apply the banner: `image` (local file, stream or Buffer) or `image_url`.
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async setYoutubeChannelBanner(options = {}) {
    return this._call('POST', '/uploadposts/youtube/channel/banner', options);
  }

  /**
   * Sections of the channel page.
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeChannelSections(options = {}) {
    return this._call('GET', '/uploadposts/youtube/channel/sections', options);
  }

  /**
   * Create a section.
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createYoutubeChannelSection(options = {}) {
    return this._call('POST', '/uploadposts/youtube/channel/sections', options);
  }

  /**
   * Edit or move a section.
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user`, `sectionId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubeChannelSection(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/channel/sections/{section_id}', options);
  }

  /**
   * Delete a section (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user`, `sectionId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubeChannelSection(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/channel/sections/{section_id}', options);
  }

  /**
   * Set the watermark: `image` (local file, stream or Buffer) or `image_url`, `timing_type`, `offset_ms`, `duration_ms` (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async setYoutubeWatermark(options = {}) {
    return this._call('POST', '/uploadposts/youtube/channel/watermark', options);
  }

  /**
   * Remove the watermark (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-channel
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async removeYoutubeWatermark(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/channel/watermark', options);
  }

  // ---- YouTube: live broadcasts and streams ----
  /**
   * List live broadcasts (`status`, `ids`...).
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeBroadcasts(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/broadcasts', options);
  }

  /**
   * Create a broadcast (`title`, `scheduled_start_time`, `privacy_status`...).
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createYoutubeBroadcast(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/broadcasts', options);
  }

  /**
   * One broadcast.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `broadcastId` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeBroadcast(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/broadcasts/{broadcast_id}', options);
  }

  /**
   * Edit a broadcast.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `broadcastId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubeBroadcast(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/live/broadcasts/{broadcast_id}', options);
  }

  /**
   * Delete a broadcast (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `broadcastId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubeBroadcast(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/live/broadcasts/{broadcast_id}', options);
  }

  /**
   * Bind a stream to the broadcast (`stream_id`), or unbind it.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `broadcastId` and any other API field
   * @returns {Promise<Object>}
   */
  async bindYoutubeBroadcast(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/broadcasts/{broadcast_id}/bind', options);
  }

  /**
   * Go `testing`, `live` or `complete` (`live` and `complete` need `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `broadcastId`, `status` and any other API field
   * @returns {Promise<Object>}
   */
  async transitionYoutubeBroadcast(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/broadcasts/{broadcast_id}/transition', options);
  }

  /**
   * Insert an ad break.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `broadcastId` and any other API field
   * @returns {Promise<Object>}
   */
  async insertYoutubeCuepoint(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/broadcasts/{broadcast_id}/cuepoint', options);
  }

  /**
   * List streams.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeStreams(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/streams', options);
  }

  /**
   * Create a stream (its key is a secret).
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async createYoutubeStream(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/streams', options);
  }

  /**
   * One stream.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `streamId` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeStream(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/streams/{stream_id}', options);
  }

  /**
   * Edit a stream.
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `streamId` and any other API field
   * @returns {Promise<Object>}
   */
  async updateYoutubeStream(options = {}) {
    return this._call('PATCH', '/uploadposts/youtube/live/streams/{stream_id}', options);
  }

  /**
   * Delete a stream (needs `confirm: true`; encoders using its key stop).
   * @see https://docs.upload-post.com/api/youtube-live
   * @param {Object} options - `user`, `streamId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubeStream(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/live/streams/{stream_id}', options);
  }

  // ---- YouTube: live chat, polls and moderation ----
  /**
   * Read the live chat (`broadcast_id` or `live_chat_id`, `page_token`).
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async getYoutubeLiveChat(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/chat', options);
  }

  /**
   * Post a message or a poll in the live chat (`idempotency_key` optional).
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async sendYoutubeLiveChatMessage(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/chat', options);
  }

  /**
   * Close a poll.
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user`, `messageId` and any other API field
   * @returns {Promise<Object>}
   */
  async closeYoutubeLiveChatPoll(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/chat/polls/{message_id}/close', options);
  }

  /**
   * Delete a chat message (needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user`, `messageId` and any other API field
   * @returns {Promise<Object>}
   */
  async deleteYoutubeLiveChatMessage(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/live/chat/messages/{message_id}', options);
  }

  /**
   * Moderators of the live chat.
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeLiveModerators(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/moderators', options);
  }

  /**
   * Add a moderator (`channel_id`).
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async addYoutubeLiveModerator(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/moderators', options);
  }

  /**
   * Remove a moderator (the `id` from the list; needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user`, `moderatorId` and any other API field
   * @returns {Promise<Object>}
   */
  async removeYoutubeLiveModerator(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/live/moderators/{moderator_id}', options);
  }

  /**
   * Ban a user from the chat (`permanent` or `temporary` with `ban_duration_seconds`; needs `confirm: true`).
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user`, `channelId`, `type` and any other API field
   * @returns {Promise<Object>}
   */
  async banYoutubeLiveChatUser(options = {}) {
    return this._call('POST', '/uploadposts/youtube/live/bans', options);
  }

  /**
   * Lift a ban.
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user`, `banId` and any other API field
   * @returns {Promise<Object>}
   */
  async unbanYoutubeLiveChatUser(options = {}) {
    return this._call('DELETE', '/uploadposts/youtube/live/bans/{ban_id}', options);
  }

  /**
   * Super Chats and Super Stickers received.
   * @see https://docs.upload-post.com/api/youtube-live-chat
   * @param {Object} options - `user` and any other API field
   * @returns {Promise<Object>}
   */
  async listYoutubeSuperChats(options = {}) {
    return this._call('GET', '/uploadposts/youtube/live/super-chats', options);
  }

  // ==================== Helper Endpoints ====================

  /**
   * Get Facebook pages for a profile
   * 
   * @param {string} [profile] - Profile username
   * @returns {Promise<Object>} List of Facebook pages
   */
  async getFacebookPages(profile) {
    const params = profile ? { profile } : {};
    return this._request('/uploadposts/facebook/pages', 'GET', params);
  }

  /**
   * Get LinkedIn pages for a profile
   * 
   * @param {string} [profile] - Profile username
   * @returns {Promise<Object>} List of LinkedIn pages
   */
  async getLinkedinPages(profile) {
    const params = profile ? { profile } : {};
    return this._request('/uploadposts/linkedin/pages', 'GET', params);
  }

  /**
   * Resolve a LinkedIn company Page to its URN and exact name, to mention it in
   * a post as `@[Exact Name](urn:li:organization:ID)`. LinkedIn only links the
   * mention when the name matches exactly, capitals included; otherwise it is
   * published as plain text. Uses the profile's LinkedIn connection.
   *
   * People cannot be resolved (LinkedIn member ids are app-scoped): a `/in/` URL
   * or `urn:li:person` gives `400 linkedin_person_not_resolvable`. Other errors
   * (`error.code`): `400 invalid_parameter`, `401 linkedin_reauth_required`,
   * `403 linkedin_permission_missing` (reconnect LinkedIn), `404
   * organization_not_found`, `429 rate_limited` / `linkedin_rate_limited`, `502
   * linkedin_unavailable`. Cached answers do not call LinkedIn (`cached: true`).
   *
   * @param {Object} options
   * @param {string} options.user - Profile username with LinkedIn connected
   * @param {string} options.url - Page URL (`linkedin.com/company|showcase|school/<vanity>`),
   *   vanity name (with or without `@`), numeric id or `urn:li:organization:ID`
   * @returns {Promise<Object>} `{ success, urn, id, name, vanity_name, mention, cached }`
   */
  async resolveLinkedinOrganization(options) {
    return this._request('/uploadposts/linkedin/resolve-organization', 'GET', {
      user: options.user,
      url: options.url,
    });
  }

  /**
   * Get Pinterest boards for a profile
   * 
   * @param {string} [profile] - Profile username
   * @returns {Promise<Object>} List of Pinterest boards
   */
  async getPinterestBoards(profile) {
    const params = profile ? { profile } : {};
    return this._request('/uploadposts/pinterest/boards', 'GET', params);
  }

  /**
   * Catalogue filters shared by the trending and search endpoints, so both
   * address the same cached chart slice.
   * @private
   */
  _tiktokMusicParams(profile, options = {}) {
    const params = { profile };
    if (options.genre) params.genre = options.genre;
    if (options.countryCode) params.country_code = options.countryCode;
    if (options.dateRange) params.date_range = options.dateRange;
    return params;
  }

  /**
   * Get trending tracks from the TikTok Commercial Music Library.
   *
   * Available on connections that declare the `music` capability (see
   * `capabilities` on the TikTok account returned by listUsers() /
   * GET /api/uploadposts/users). The returned `id` is what you pass as
   * `tiktokMusicId` on an upload — not `commercial_music_id`, which TikTok
   * rejects on public posts.
   *
   * @param {string} profile - Profile username
   * @param {Object} [options] - Query options
   * @param {string} [options.genre] - Genre filter (e.g. ALL, POP). Defaults to ALL upstream.
   * @param {string} [options.countryCode] - ISO country code. Defaults to US upstream.
   * @param {('1DAY'|'7DAY'|'30DAY'|'90DAY')} [options.dateRange] - Trending window. Defaults to 7DAY upstream.
   * @returns {Promise<Object>} Trending tracks
   */
  async getTiktokTrendingMusic(profile, options = {}) {
    return this._request('/uploadposts/tiktok/music/trending', 'GET',
      this._tiktokMusicParams(profile, options));
  }

  /**
   * Search the TikTok Commercial Music Library by song title or artist.
   *
   * TikTok itself has no music search endpoint — its only catalogue read is the
   * trending chart for a genre/country/period. Upload-Post caches those charts
   * and matches your text against them, so this searches the trending charts,
   * not TikTok's whole catalogue. Matching is case- and accent-insensitive and
   * every word must match.
   *
   * Returns the same track objects as getTiktokTrendingMusic(), so the `id` is
   * again what you pass as `tiktokMusicId` on an upload.
   *
   * @param {string} profile - Profile username
   * @param {Object} [options] - Query options
   * @param {string} [options.q] - Text matched against titles and artists (max 80 chars). Omit for the chart in trending order.
   * @param {string} [options.genre] - Genre filter (e.g. ALL, POP). Defaults to ALL upstream.
   * @param {string} [options.countryCode] - ISO country code choosing which chart is searched. Defaults to US upstream.
   * @param {('1DAY'|'7DAY'|'30DAY'|'90DAY')} [options.dateRange] - Chart window. Defaults to 7DAY upstream.
   * @param {number} [options.limit] - Maximum tracks to return (capped at 100 upstream).
   * @returns {Promise<Object>} Matching tracks plus a `catalog` block describing the corpus searched
   */
  async searchTiktokMusic(profile, options = {}) {
    const params = this._tiktokMusicParams(profile, options);
    if (options.q) params.q = options.q;
    if (options.limit !== undefined && options.limit !== null) params.limit = options.limit;
    return this._request('/uploadposts/tiktok/music/search', 'GET', params);
  }

  /**
   * Search TikTok locations (places) to tag on a post.
   *
   * Available on connections that declare the `location` capability (see
   * `capabilities` on the TikTok account returned by listUsers() /
   * GET /api/uploadposts/users). Pass the returned `location_id` as
   * `tiktokLocationId` and `location_name` as `tiktokLocationName` on an upload;
   * TikTok requires both together.
   *
   * @param {string} profile - Profile username
   * @param {string} query - Search query (max 100 characters)
   * @returns {Promise<Object>} Matching locations (up to 20)
   */
  async getTiktokLocations(profile, query) {
    return this._request('/uploadposts/tiktok/locations', 'GET', { profile, q: query });
  }

  /**
   * Get what the connected TikTok account is allowed to publish.
   *
   * The point of this call is `privacy_level_options`: TikTok narrows the four
   * privacy values per account (a private account has no `PUBLIC_TO_EVERYONE`),
   * and sending one the account does not have fails the upload with
   * `error_code: "tiktok_privacy_unavailable"`. Ask here to offer only the
   * values that will work, instead of the full enum.
   *
   * @param {string} profile - Profile username
   * @returns {Promise<Object>} privacy_level_options, max_video_post_duration_sec
   *   and the account's comment/duet/stitch switches
   */
  async getTiktokPublishingSettings(profile) {
    return this._request('/uploadposts/tiktok/settings', 'GET', { profile });
  }

  /**
   * Get Google Business Profile locations for a connected account
   *
   * @param {string} [profile] - Profile username
   * @returns {Promise<Object>} List of Google Business locations
   */
  async getGoogleBusinessLocations(profile) {
    const params = profile ? { profile } : {};
    return this._request('/uploadposts/google-business/locations', 'GET', params);
  }

  /**
   * Select a specific Google Business Profile location for a profile
   *
   * @param {string} locationId - The location ID to select (e.g. "accounts/123/locations/456")
   * @param {string} [profile] - Profile username
   * @returns {Promise<Object>} Selection result with google_business_id and display_name
   */
  async selectGoogleBusinessLocation(locationId, profile) {
    // The API now pins a location per profile; with both arguments this pins it.
    if (locationId && profile) {
      return this.pinGoogleBusinessLocation({ profileUsername: profile, gbpLocationId: locationId });
    }
    throw new Error(
      'selectGoogleBusinessLocation is not supported: the API has no persistent location selection. ' +
      'Pass gbpLocationId on the upload, or pin one with pinGoogleBusinessLocation({ profileUsername, gbpLocationId }).'
    );
  }
}

// Option keys the API itself spells in camelCase (Google / YouTube names).
UploadPost.KEEP_CAMEL_KEYS = new Set([
  'ignoreRatingOnlyReviews', 'hasPaidProductPlacement', 'categoryId', 'privacyStatus',
  'publicStatsViewable', 'selfDeclaredMadeForKids', 'containsSyntheticMedia',
  'defaultLanguage', 'defaultAudioLanguage', 'recordingDate', 'allowedCountries',
  'blockedCountries', 'publishAt',
]);

// Fields that take a file (multipart) when given a local path, stream or Buffer.
UploadPost.FILE_FIELDS = new Set([
  'file', 'photo', 'animation', 'sticker', 'avatar', 'banner', 'thumbnail', 'image',
  'telegram_media', 'telegram_thumbnail', 'telegram_cover', 'telegram_live_photo_photo',
]);

// Default export for CommonJS compatibility
export default UploadPost;
