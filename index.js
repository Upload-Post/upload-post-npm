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
  async _request(endpoint, method = 'GET', data = null, isFormData = false, extraHeaders = {}, requestConfig = {}) {
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

    // Query string on a request with a body, and file answers (generated methods).
    if (requestConfig.params) config.params = { ...(config.params || {}), ...requestConfig.params };
    if (requestConfig.responseType) config.responseType = requestConfig.responseType;

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      let data = error.response?.data;
      // A file request (responseType arraybuffer) gets its JSON error as bytes.
      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        const text = Buffer.from(data).toString('utf8');
        try { data = JSON.parse(text); } catch { data = text; }
      }
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
      err.errorType = data?.error_type;
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
   * A required value that goes in the URL path, encoded. An empty one would
   * send `/undefined` (or drop the segment), so it fails before the request.
   * @private
   */
  _pathParam(name, value) {
    if (value === undefined || value === null || String(value).trim() === '') {
      throw new Error(`Upload-Post: ${name} is required`);
    }
    return encodeURIComponent(String(value));
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
        } else if (mediaItem && Buffer.isBuffer(mediaItem.buffer) && mediaItem.filename) {
          // A URL downloaded by _withFirstCommentFiles().
          form.append('first_comment_media[]', mediaItem.buffer, { filename: mediaItem.filename, contentType: mediaItem.contentType });
        } else if (Buffer.isBuffer(mediaItem)) {
          form.append('first_comment_media[]', mediaItem, { filename: 'image.jpg' });
        } else {
          form.append('first_comment_media[]', mediaItem);
        }
      }
    }
  }

  /**
   * The API takes first comment images (`first_comment_media[]`) as files only: a
   * URL in that field was ignored without a word. URLs in `firstCommentMedia` are
   * downloaded here and sent as files; a URL that cannot be downloaded fails the
   * upload with an error that says which one, instead of publishing without it.
   * @private
   */
  async _withFirstCommentFiles(options) {
    if (!options || !options.firstCommentMedia) return options;
    const items = Array.isArray(options.firstCommentMedia) ? options.firstCommentMedia : [options.firstCommentMedia];
    const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);
    if (!items.some(isUrl)) return options;
    const resolved = [];
    for (const item of items) {
      if (!isUrl(item)) {
        resolved.push(item);
        continue;
      }
      let response;
      try {
        // Plain request: no API key or Upload-Post headers go to a third-party host.
        response = await axios.get(item, { responseType: 'arraybuffer', timeout: 60000, maxContentLength: 50 * 1024 * 1024, headers: {} });
      } catch (error) {
        throw new Error(`Upload-Post: could not download firstCommentMedia ${item} (${error.message}). `
          + 'The API takes first comment images as files: pass a local path or a Buffer instead.');
      }
      const name = decodeURIComponent(new URL(item).pathname.split('/').pop() || '') || 'image.jpg';
      const contentType = String(response.headers?.['content-type'] || '').split(';')[0] || undefined;
      resolved.push({ buffer: Buffer.from(response.data), filename: name, contentType });
    }
    return { ...options, firstCommentMedia: resolved };
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
    // Custom thumbnail as a file (local path, stream or Buffer); youtubeThumbnailUrl takes a URL.
    const thumbnail = this._pick(options, 'youtubeThumbnail', 'thumbnail');
    if (thumbnail && this._isUploadValue(thumbnail)) {
      if (typeof thumbnail === 'string') form.append('thumbnail', createReadStream(thumbnail));
      else if (Buffer.isBuffer(thumbnail)) form.append('thumbnail', thumbnail, { filename: 'thumbnail.jpg' });
      else form.append('thumbnail', thumbnail);
    }
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
    // Users who may not reply (with replyToId): an array, or comma-separated.
    const excludeReply = this._pick(options, 'xExcludeReplyUserIds', 'excludeReplyUserIds', 'exclude_reply_user_ids');
    if (Array.isArray(excludeReply)) excludeReply.forEach((id) => form.append('exclude_reply_user_ids[]', String(id)));
    else this._appendField(form, 'exclude_reply_user_ids', excludeReply);

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
    this._appendField(form, 'reddit_title', this._pick(options, 'redditTitle', 'reddit_title'));
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
      ['telegram_allow_paid_broadcast', 'telegramAllowPaidBroadcast'],
      ['telegram_send_title', 'telegramSendTitle'],
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

    options = await this._withFirstCommentFiles(options);
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

    options = await this._withFirstCommentFiles(options);
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

    options = await this._withFirstCommentFiles(options);
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
   * @param {string[]} [options.platforms] - `['linkedin']` (default), `['telegram']` or both: Telegram takes any
   *   file up to 50 MB, with the same `telegram*` options as the other uploads
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

    // LinkedIn by default; `platforms: ['telegram']` (or both) sends the file to
    // Telegram too. Other platforms do not take documents.
    form.append('user', options.user);
    form.append('title', options.title);
    const requested = options.platforms === undefined ? [] : [].concat(options.platforms);
    const docPlatforms = requested.filter((p) => p === 'linkedin' || p === 'telegram');
    (docPlatforms.length ? docPlatforms : ['linkedin']).forEach((p) => form.append('platform[]', p));

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
    if (docPlatforms.includes('telegram')) {
      this._addTelegramParams(form, options);
      this._appendField(form, 'telegram_first_comment', this._pick(options, 'telegramFirstComment', 'telegram_first_comment'));
    }

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
   * @param {Object} options - Query options
   * @param {string[]} options.platforms - Required: the platforms to read (instagram, linkedin, facebook, x, youtube, tiktok, threads, pinterest, reddit); an array or a comma-separated string
   * @param {string} [options.pageId] - Facebook Page ID (required for Facebook analytics)
   * @param {string} [options.pageUrn] - LinkedIn organization/company page URN or numeric ID. LinkedIn analytics are only available for pages you administer; personal profiles are not supported (LinkedIn exposes no member-level analytics). Defaults to the first administered organization page.
   * @returns {Promise<Object>} Analytics data per platform
   */
  async getAnalytics(profileUsername, options = {}) {
    const profile = this._pathParam('profileUsername', profileUsername);
    const platforms = Array.isArray(options.platforms)
      ? options.platforms.filter((p) => p !== undefined && p !== null && String(p).trim() !== '').join(',')
      : String(options.platforms ?? '').trim();
    if (!platforms) {
      // The API answers 400 without it.
      throw new Error('Upload-Post: platforms is required (e.g. { platforms: [\'instagram\'] })');
    }
    const params = { platforms };
    if (options.pageId) params.page_id = options.pageId;
    if (options.pageUrn) params.page_urn = options.pageUrn;
    return this._request(`/analytics/${profile}`, 'GET', params);
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
    return this._request(`/uploadposts/total-impressions/${this._pathParam('profileUsername', profileUsername)}`, 'GET', params);
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
    return this._request(`/uploadposts/post-analytics/${this._pathParam('requestId', requestId)}`, 'GET');
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
    return this._request(`/uploadposts/schedule/${this._pathParam('jobId', jobId)}`, 'DELETE');
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
    const job = this._pathParam('jobId', jobId);
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
    return this._request(`/uploadposts/schedule/${job}`, 'PATCH', body);
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
   * Create a new user/profile. A username that already exists fails with 409
   * ("Username already in use"); the profile limit of the plan with 403
   * `PROFILE_LIMIT_REACHED`.
   *
   * @param {string} username - Profile name to create
   * @returns {Promise<Object>} `{ success, profile }`
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
   * @param {('light'|'dark'|'auto'|null)} [options.connectTheme] - Force the connection page theme; `'auto'` (or `null`) follows the visitor's preference again.
   * @param {boolean} [options.clientApproval] - Not generally available yet (post approvals). `true` lets the end client approve or reject the pending posts of this profile from the connect page (`listClientPostApprovals`, `approveClientPostApproval`, `rejectClientPostApproval` with this JWT). Stored on the profile; generate again with `false` to turn it off.
   * @param {boolean} [options.preserveSettings] - `true` mints the link without changing the profile's saved settings (by default every setting not sent here is cleared). `platforms` then applies to this link only. Cannot be combined with the other options, which are stored on the profile (400 `preserve_settings_conflict`). The answer carries `settings_preserved: true`.
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
    if (options.connectTheme !== undefined) body.connect_theme = options.connectTheme;
    if (options.clientApproval !== undefined) body.client_approval = options.clientApproval;
    if (options.preserveSettings !== undefined) body.preserve_settings = options.preserveSettings;
    return this._request('/uploadposts/users/generate-jwt', 'POST', body);
  }

  /**
   * Validate a JWT token (`GET`, the token goes in `Authorization: Bearer`).
   * While post approvals are on, `profile.client_approval` says whether the
   * end client may approve posts with this JWT.
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
    return this._request(`/uploadposts/webhooks/deliveries/${this._pathParam('deliveryId', deliveryId)}`, 'GET');
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
    return this._request(`/uploadposts/webhooks/deliveries/${this._pathParam('deliveryId', deliveryId)}/redeliver`, 'POST', {});
  }

  // ==================== Teams ====================

  /**
   * List the members of your team (account owner only; a member acting with
   * `actAsUser` gets 403). When seat limits are enforced each member carries
   * `suspended` / `suspended_reason` (`owner_plan_limit`) and the response adds
   * `plan` and `seat_limit`: after a downgrade the last invited members are
   * suspended, not removed, until you upgrade or remove someone. With team
   * roles on, each member also has `role` (admin, editor, contributor, viewer)
   * and `profiles` (`null` = every profile). Inviting members and changing
   * roles is done by the owner in the dashboard, not with the API key.
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
   * With team roles on, each account also has your `role` and `profiles` there.
   *
   * @returns {Promise<Object>} `{ success, accounts: [{ owner_email, owner_name, status, suspended?, suspended_reason?, role?, profiles? }] }`
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

  /**
   * Run one operation of the OpenAPI spec. Behind every generated method (see
   * UploadPost.OPENAPI_OPERATIONS): option keys are camelCase or the API's own
   * names, path parameters go in the URL, query parameters in the query string
   * and the rest in the JSON body. A file field given as a local path, stream or
   * Buffer turns the body into multipart/form-data.
   * @private
   */
  async _op(name, options = {}) {
    const [method, route, meta = {}] = UploadPost.OPENAPI_OPERATIONS[name];
    const opts = { ...(options || {}) };
    const headers = {};
    if (meta.bearer) {
      const { token } = opts;
      delete opts.token;
      if (!token) throw new Error('Upload-Post: token (the profile JWT) is required');
      headers.Authorization = `Bearer ${token}`;
    }
    const known = new Set([...(meta.q || []), ...(meta.b || []), ...(route.match(/\{(\w+)\}/g) || []).map((p) => p.slice(1, -1))]);
    const params = {};
    for (const [key, value] of Object.entries(opts)) {
      if (value === undefined) continue;
      params[known.has(key) ? key : this._apiKey(key)] = value;
    }
    const endpoint = route.replace(/\{(\w+)\}/g, (_, pathName) => {
      const value = params[pathName];
      delete params[pathName];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Upload-Post: ${pathName} is required`);
      }
      return encodeURIComponent(String(value));
    });

    const query = {};
    const body = {};
    for (const [key, value] of Object.entries(params)) {
      const inQuery = method === 'GET' || (meta.q || []).includes(key) || (method === 'DELETE' && !meta.b);
      if (!inQuery) {
        body[key] = value;
      } else if (value !== null) {
        if (Array.isArray(value)) query[key] = value.join(',');
        else if (typeof value === 'object') query[key] = JSON.stringify(value);
        else if (typeof value === 'boolean') query[key] = String(value);
        else query[key] = value;
      }
    }
    const config = {};
    if (meta.raw) config.responseType = meta.raw === 'binary' ? 'arraybuffer' : 'text';
    if (method === 'GET' || (method === 'DELETE' && !meta.b && !Object.keys(body).length)) {
      return this._request(endpoint, method, Object.keys(query).length ? query : null, false, headers, config);
    }
    if (Object.keys(query).length) config.params = query;

    const fileFields = new Set(meta.f || []);
    const isFile = (key, value) => (fileFields.has(key) || UploadPost.FILE_FIELDS.has(key))
      && (Array.isArray(value) ? value.length > 0 && value.every((v) => this._isUploadValue(v)) : this._isUploadValue(value));
    const fileKeys = Object.keys(body).filter((key) => isFile(key, body[key]));
    if (fileKeys.length || meta.mp) {
      const form = new FormData();
      const appendFile = (key, value) => {
        if (typeof value === 'string') form.append(key, createReadStream(value));
        else if (Buffer.isBuffer(value)) form.append(key, value, { filename: key.replace(/\[\]$/, '') });
        else form.append(key, value);
      };
      for (const [key, value] of Object.entries(body)) {
        if (!fileKeys.includes(key)) this._appendField(form, key, value);
        else if (Array.isArray(value)) value.forEach((v) => appendFile(key, v));
        else appendFile(key, value);
      }
      return this._request(endpoint, method, form, true, headers, config);
    }
    return this._request(endpoint, method, body, false, headers, config);
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
   * `configured` is `false` while the queue of the profile was never saved
   * (`queue_settings` then shows the defaults).
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

  // ==================== Generated from the OpenAPI spec ====================
  //
  // One method per API operation that has no hand-written method above. Written
  // by codegen/generate.py from codegen/openapi.json: do not edit by hand, edit the
  // spec (or codegen/sdk-map.json) and run `python3 codegen/generate.py`.
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
   * @param {SendTelegramGiftOptions} options
   * @returns {Promise<Object>}
   */
  async sendTelegramGift(options = {}) {
    return this._op('sendTelegramGift', options);
  }

  /**
   * Gift Telegram Premium from the bot's Stars.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_stars_spend_disabled` until the feature is available.
   *
   * Spends the bot's Stars.
   *
   * `POST /api/uploadposts/telegram/gifts/premium`
   * @param {GiftTelegramPremiumOptions} options
   * @returns {Promise<Object>}
   */
  async giftTelegramPremium(options = {}) {
    return this._op('giftTelegramPremium', options);
  }

  /**
   * Automatic pre-checkout rules.
   *
   * **The automatic answers need the bot's updates turned on (POST /api/uploadposts/telegram/updates).**
   *
   * `GET /api/uploadposts/telegram/payments/settings`
   * @param {GetTelegramPaymentSettingsOptions} options
   * @returns {Promise<Object>}
   */
  async getTelegramPaymentSettings(options = {}) {
    return this._op('getTelegramPaymentSettings', options);
  }

  /**
   * Set automatic pre-checkout rules.
   *
   * **The automatic answers need the bot's updates turned on (POST /api/uploadposts/telegram/updates).**
   *
   * `PUT /api/uploadposts/telegram/payments/settings`
   * @param {UpdateTelegramPaymentSettingsOptions} options
   * @returns {Promise<Object>}
   */
  async updateTelegramPaymentSettings(options = {}) {
    return this._op('updateTelegramPaymentSettings', options);
  }

  /**
   * Turn Telegram updates on or off.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_updates_unavailable` until the feature is available.
   *
   * Opt-in per bot. A webhook that is not Upload-Post's is never replaced without replace_existing_webhook=true (409 telegram_webhook_in_use otherwise). With no webhook, the answer warns that a getUpdates integration stops receiving.
   *
   * `POST /api/uploadposts/telegram/updates`
   * @param {SetTelegramUpdatesOptions} options
   * @returns {Promise<Object>}
   */
  async setTelegramUpdates(options = {}) {
    return this._op('setTelegramUpdates', options);
  }

  /**
   * Answer a Telegram query.
   *
   * Answer a callback_query, inline_query, join request, guest/widget query, shipping or pre-checkout query received as a telegram_update event. 410 telegram_query_expired when Telegram's time is up.
   *
   * `POST /api/uploadposts/telegram/answer`
   * @param {AnswerTelegramQueryOptions} options
   * @returns {Promise<Object>}
   */
  async answerTelegramQuery(options = {}) {
    return this._op('answerTelegramQuery', options);
  }

  /**
   * Telegram Business connections.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * Connections of the bot with Telegram Business accounts (rights, enabled).
   *
   * `GET /api/uploadposts/telegram/business-connections`
   * @param {GetTelegramBusinessConnectionsOptions} options
   * @returns {Promise<Object>}
   */
  async getTelegramBusinessConnections(options = {}) {
    return this._op('getTelegramBusinessConnections', options);
  }

  /**
   * Telegram Business account.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * The connected account.
   *
   * `GET /api/uploadposts/telegram/business-profile`
   * @param {GetTelegramBusinessProfileOptions} options
   * @returns {Promise<Object>}
   */
  async getTelegramBusinessProfile(options = {}) {
    return this._op('getTelegramBusinessProfile', options);
  }

  /**
   * Update the Telegram Business profile.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * first_name/last_name, username, bio, photo (multipart or media_url, is_public), remove_photo, gift_settings.
   *
   * `PATCH /api/uploadposts/telegram/business-profile`
   * @param {UpdateTelegramBusinessProfileOptions} options
   * @returns {Promise<Object>}
   */
  async updateTelegramBusinessProfile(options = {}) {
    return this._op('updateTelegramBusinessProfile', options);
  }

  /**
   * Post a Telegram story.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * postStory on behalf of the Business account. Photos 1080x1920 up to 10 MB; videos 720x1280 H.265 up to 30 MB, 60 s.
   *
   * `POST /api/uploadposts/telegram/business-stories`
   * @param {PostTelegramStoryOptions} options
   * @returns {Promise<Object>}
   */
  async postTelegramStory(options = {}) {
    return this._op('postTelegramStory', options);
  }

  /**
   * Edit a Telegram story.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * editStory.
   *
   * `PATCH /api/uploadposts/telegram/business-stories`
   * @param {EditTelegramStoryOptions} options
   * @returns {Promise<Object>}
   */
  async editTelegramStory(options = {}) {
    return this._op('editTelegramStory', options);
  }

  /**
   * Delete a Telegram story.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * deleteStory.
   *
   * `DELETE /api/uploadposts/telegram/business-stories`
   * @param {DeleteTelegramStoryOptions} options
   * @returns {Promise<Object>}
   */
  async deleteTelegramStory(options = {}) {
    return this._op('deleteTelegramStory', options);
  }

  /**
   * Repost a Telegram story.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * repostStory from another Business account of the same bot.
   *
   * `POST /api/uploadposts/telegram/business-stories/repost`
   * @param {RepostTelegramStoryOptions} options
   * @returns {Promise<Object>}
   */
  async repostTelegramStory(options = {}) {
    return this._op('repostTelegramStory', options);
  }

  /**
   * Telegram Business gifts.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * getBusinessAccountGifts with Telegram's filters.
   *
   * `GET /api/uploadposts/telegram/business-gifts`
   * @param {GetTelegramBusinessGiftsOptions} options
   * @returns {Promise<Object>}
   */
  async getTelegramBusinessGifts(options = {}) {
    return this._op('getTelegramBusinessGifts', options);
  }

  /**
   * Convert, upgrade, transfer or delete a gift.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * Irreversible: requires confirm=true and an idempotency_key (a repeat with the same key returns the first answer).
   *
   * `POST /api/uploadposts/telegram/business-gifts`
   * @param {ManageTelegramBusinessGiftOptions} options
   * @returns {Promise<Object>}
   */
  async manageTelegramBusinessGift(options = {}) {
    return this._op('manageTelegramBusinessGift', options);
  }

  /**
   * Telegram Business Stars balance.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * getBusinessAccountStarBalance.
   *
   * `GET /api/uploadposts/telegram/business-stars`
   * @param {GetTelegramBusinessStarsOptions} options
   * @returns {Promise<Object>}
   */
  async getTelegramBusinessStars(options = {}) {
    return this._op('getTelegramBusinessStars', options);
  }

  /**
   * Move Stars to the bot.
   *
   * **Not generally available yet.** Off by default: answers `503` with `telegram_business_unavailable` until the feature is available.
   *
   * transferBusinessAccountStars (1-10000). Requires confirm=true and an idempotency_key.
   *
   * `POST /api/uploadposts/telegram/business-stars/transfer`
   * @param {TransferTelegramBusinessStarsOptions} options
   * @returns {Promise<Object>}
   */
  async transferTelegramBusinessStars(options = {}) {
    return this._op('transferTelegramBusinessStars', options);
  }

  // ---- Content Upload ----
  /**
   * AI titles and captions for a short video.
   *
   * Watches the video and writes a title/description (YouTube) and captions (Instagram, TikTok, Facebook). Counts against the monthly AI Shorts quota (a failed analysis is not counted).
   *
   * `POST /api/uploadposts/analyze-shorts`
   * @param {AnalyzeShortsOptions} options
   * @returns {Promise<Object>}
   */
  async analyzeShorts(options = {}) {
    return this._op('analyzeShorts', options);
  }

  /**
   * Translate or rewrite captions with AI.
   *
   * Rewrites texts with the same shape analyze-shorts returns into another language. Uses the AI Shorts quota.
   *
   * `POST /api/uploadposts/rewrite-captions`
   * @param {RewriteCaptionsOptions} options
   * @returns {Promise<Object>}
   */
  async rewriteCaptions(options = {}) {
    return this._op('rewriteCaptions', options);
  }

  /**
   * Get a signed URL to upload a file.
   *
   * For clients that cannot send large files in a multipart request (AI agents, the MCP server): create the upload, PUT the bytes to upload_url with the returned headers, call /complete, then pass media_url to the upload endpoints. Files expire after staging_ttl_hours. Per-file size, files in progress and monthly files/bytes depend on the plan.
   *
   * `POST /api/uploadposts/media-uploads`
   * @param {CreateMediaUploadOptions} options
   * @returns {Promise<Object>}
   */
  async createMediaUpload(options = {}) {
    return this._op('createMediaUpload', options);
  }

  /**
   * Confirm a signed upload.
   *
   * Checks the uploaded object (size, type) and returns media_url.
   *
   * `POST /api/uploadposts/media-uploads/{upload_id}/complete`
   * @param {CompleteMediaUploadOptions} options
   * @returns {Promise<Object>}
   */
  async completeMediaUpload(options = {}) {
    return this._op('completeMediaUpload', options);
  }

  /**
   * Get a signed upload.
   *
   * `GET /api/uploadposts/media-uploads/{upload_id}`
   * @param {GetMediaUploadOptions} options
   * @returns {Promise<Object>}
   */
  async getMediaUpload(options = {}) {
    return this._op('getMediaUpload', options);
  }

  /**
   * Delete a signed upload.
   *
   * `DELETE /api/uploadposts/media-uploads/{upload_id}`
   * @param {DeleteMediaUploadOptions} options
   * @returns {Promise<Object>}
   */
  async deleteMediaUpload(options = {}) {
    return this._op('deleteMediaUpload', options);
  }

  // ---- Upload Management ----
  /**
   * Get a scheduled post.
   *
   * The options a scheduled post was scheduled with (limited to what PATCH can change), signed media URLs and whether it can still be edited.
   *
   * `GET /api/uploadposts/schedule/{job_id}`
   * @param {GetScheduledPostOptions} options
   * @returns {Promise<Object>}
   */
  async getScheduledPost(options = {}) {
    return this._op('getScheduledPost', options);
  }

  /**
   * Get a scheduled post's thumbnail.
   *
   * Signed URL of a small JPEG of the post's video or first image. A post without one gets it built once and kept. Call it only for posts you display; the list already carries most thumbnails.
   *
   * `GET /api/uploadposts/schedule/{job_id}/thumbnail`
   * @param {GetScheduledPostThumbnailOptions} options
   * @returns {Promise<Object>}
   */
  async getScheduledPostThumbnail(options = {}) {
    return this._op('getScheduledPostThumbnail', options);
  }

  /**
   * Preview URLs of a scheduled post.
   *
   * Signed, short-lived URLs of the media, cover and thumbnail of one scheduled job (the listing only says has_preview).
   *
   * `GET /api/uploadposts/schedule/{job_id}/preview`
   * @param {GetScheduledPostPreviewOptions} options
   * @returns {Promise<Object>}
   */
  async getScheduledPostPreview(options = {}) {
    return this._op('getScheduledPostPreview', options);
  }

  // ---- Platform Integration ----
  /**
   * Create a Pinterest board.
   *
   * Without a profile the first profile of the account with a Pinterest account is used.
   *
   * `POST /api/uploadposts/pinterest/boards`
   * @param {CreatePinterestBoardOptions} options
   * @returns {Promise<Object>}
   */
  async createPinterestBoard(options = {}) {
    return this._op('createPinterestBoard', options);
  }

  /**
   * Run a YouTube Analytics channel report.
   *
   * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. reports.query for the profile's channel with any dimensions, metrics, filters and sort of YouTube's channel reports. Validated against the official report tables before it reaches YouTube (invalid combinations: 400 youtube_analytics_unsupported_query with hints, nothing spent). Revenue and ad metrics are not available. Answers are cached (12 h; 7 days for ranges that ended more than 5 days ago). Each uncached call counts 1 request of the account's daily Analytics allowance. Data has a 48-72 h delay.
   *
   * `GET /api/uploadposts/youtube/analytics/query`
   * @param {QueryYoutubeAnalyticsOptions} options
   * @returns {Promise<Object>}
   */
  async queryYoutubeAnalytics(options = {}) {
    return this._op('queryYoutubeAnalytics', options);
  }

  /**
   * YouTube Analytics report catalog.
   *
   * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. The 47 YouTube channel reports with their dimensions, metrics, filters, sort options and row limits. Does not call YouTube.
   *
   * `GET /api/uploadposts/youtube/analytics/reports`
   * @param {ListYoutubeAnalyticsReportsOptions} options
   * @returns {Promise<Object>}
   */
  async listYoutubeAnalyticsReports(options = {}) {
    return this._op('listYoutubeAnalyticsReports', options);
  }

  /**
   * List YouTube Analytics groups.
   *
   * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. groups.list of the channel (mine=true, or ids). Cached 30 minutes; 1 request of the Analytics allowance per uncached call.
   *
   * `GET /api/uploadposts/youtube/analytics/groups`
   * @param {ListYoutubeAnalyticsGroupsOptions} options
   * @returns {Promise<Object>}
   */
  async listYoutubeAnalyticsGroups(options = {}) {
    return this._op('listYoutubeAnalyticsGroups', options);
  }

  /**
   * List the items of a YouTube Analytics group.
   *
   * **Not generally available yet.** Answers 503 youtube_analytics_disabled until it is enabled. groupItems.list. Cached 30 minutes.
   *
   * `GET /api/uploadposts/youtube/analytics/groups/{group_id}/items`
   * @param {ListYoutubeAnalyticsGroupItemsOptions} options
   * @returns {Promise<Object>}
   */
  async listYoutubeAnalyticsGroupItems(options = {}) {
    return this._op('listYoutubeAnalyticsGroupItems', options);
  }

  /**
   * Daily allowance of YouTube Analytics and bulk reports.
   *
   * **Not generally available yet.** Off by default: answers `503` with `youtube_feature_disabled` until the feature is available.
   *
   * The caller's own usage today of the Analytics and bulk reports allowances. While Analytics and bulk reports are not generally available yet, each service shows enabled: false.
   *
   * `GET /api/uploadposts/youtube/analytics/usage`
   * @param {GetYoutubeAnalyticsUsageOptions} [options]
   * @returns {Promise<Object>}
   */
  async getYoutubeAnalyticsUsage(options = {}) {
    return this._op('getYoutubeAnalyticsUsage', options);
  }

  /**
   * List YouTube bulk report types.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. reportTypes.list for the channel (one page, cached 24 h). can_create_job marks the channel/playlist types that can be scheduled.
   *
   * `GET /api/uploadposts/youtube/reporting/report-types`
   * @param {ListYoutubeReportTypesOptions} options
   * @returns {Promise<Object>}
   */
  async listYoutubeReportTypes(options = {}) {
    return this._op('listYoutubeReportTypes', options);
  }

  /**
   * List YouTube reporting jobs.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.list of the channel (one page). used_by_upload_post marks the job behind Upload-Post's thumbnail impressions.
   *
   * `GET /api/uploadposts/youtube/reporting/jobs`
   * @param {ListYoutubeReportingJobsOptions} options
   * @returns {Promise<Object>}
   */
  async listYoutubeReportingJobs(options = {}) {
    return this._op('listYoutubeReportingJobs', options);
  }

  /**
   * Create a YouTube reporting job.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.create: YouTube then generates one CSV per day (first ones within ~48 h, covering the previous 30 days). One job per report type and up to 20 per channel.
   *
   * `POST /api/uploadposts/youtube/reporting/jobs`
   * @param {CreateYoutubeReportingJobOptions} options
   * @returns {Promise<Object>}
   */
  async createYoutubeReportingJob(options = {}) {
    return this._op('createYoutubeReportingJob', options);
  }

  /**
   * Get a YouTube reporting job.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.get.
   *
   * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}`
   * @param {GetYoutubeReportingJobOptions} options
   * @returns {Promise<Object>}
   */
  async getYoutubeReportingJob(options = {}) {
    return this._op('getYoutubeReportingJob', options);
  }

  /**
   * Delete a YouTube reporting job.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.delete: stops the daily reports. Requires confirm: true. A channel_reach_basic_a1 job (used by Upload-Post for thumbnail impressions) cannot be deleted (409 youtube_reporting_job_in_use). 502 youtube_write_outcome_unknown: list the jobs to check.
   *
   * `DELETE /api/uploadposts/youtube/reporting/jobs/{job_id}`
   * @param {DeleteYoutubeReportingJobOptions} options
   * @returns {Promise<Object>}
   */
  async deleteYoutubeReportingJob(options = {}) {
    return this._op('deleteYoutubeReportingJob', options);
  }

  /**
   * List the reports of a YouTube reporting job.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.reports.list (one page). Each item has download_path.
   *
   * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports`
   * @param {ListYoutubeReportsOptions} options
   * @returns {Promise<Object>}
   */
  async listYoutubeReports(options = {}) {
    return this._op('listYoutubeReports', options);
  }

  /**
   * Get a YouTube report.
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. jobs.reports.get (metadata).
   *
   * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}`
   * @param {GetYoutubeReportOptions} options
   * @returns {Promise<Object>}
   */
  async getYoutubeReport(options = {}) {
    return this._op('getYoutubeReport', options);
  }

  /**
   * Download a YouTube report (CSV).
   *
   * **Not generally available yet.** Answers 503 youtube_reporting_disabled until it is enabled. The report's CSV file, streamed. Up to 100 MB; up to 2 downloads at a time per account. Counts 2 requests of the bulk reports allowance.
   *
   * `GET /api/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}/download`
   * @param {DownloadYoutubeReportOptions} options
   * @returns {Promise<string>} The file
   */
  async downloadYoutubeReport(options = {}) {
    return this._op('downloadYoutubeReport', options);
  }

  /**
   * YouTube new video notifications status.
   *
   * **Not generally available yet.** Answers 503 youtube_feature_disabled until it is enabled. State of the push subscription of the profile's channel (null when off). No YouTube quota.
   *
   * `GET /api/uploadposts/youtube/push`
   * @param {GetYoutubePushOptions} options
   * @returns {Promise<Object>}
   */
  async getYoutubePush(options = {}) {
    return this._op('getYoutubePush', options);
  }

  /**
   * Turn on YouTube new video notifications.
   *
   * **Not generally available yet.** Answers 503 youtube_feature_disabled until it is enabled. Requires a webhook listing youtube_video_published and/or youtube_video_updated. No YouTube quota.
   *
   * `POST /api/uploadposts/youtube/push`
   * @param {EnableYoutubePushOptions} options
   * @returns {Promise<Object>}
   */
  async enableYoutubePush(options = {}) {
    return this._op('enableYoutubePush', options);
  }

  /**
   * Turn off YouTube new video notifications.
   *
   * **Not generally available yet.** Answers 503 youtube_feature_disabled until it is enabled. No YouTube quota.
   *
   * `DELETE /api/uploadposts/youtube/push`
   * @param {DisableYoutubePushOptions} options
   * @returns {Promise<Object>}
   */
  async disableYoutubePush(options = {}) {
    return this._op('disableYoutubePush', options);
  }

  /**
   * Instagram publishing quota.
   *
   * Instagram content publishing usage of the connected account (Instagram allows a limited number of posts per 24 h). Cached; refresh=true skips the cache.
   *
   * `GET /api/uploadposts/instagram/publishing_limit`
   * @param {GetInstagramPublishingLimitOptions} options
   * @returns {Promise<Object>}
   */
  async getInstagramPublishingLimit(options = {}) {
    return this._op('getInstagramPublishingLimit', options);
  }

  /**
   * Threads publishing quota.
   *
   * Send user or profile (one is required: 400 without both).
   *
   * `GET /api/uploadposts/threads/publishing_limit`
   * @param {GetThreadsPublishingLimitOptions} [options]
   * @returns {Promise<Object>}
   */
  async getThreadsPublishingLimit(options = {}) {
    return this._op('getThreadsPublishingLimit', options);
  }

  /**
   * List the sections of a Pinterest board.
   *
   * `GET /api/uploadposts/pinterest/boards/{board_id}/sections`
   * @param {ListPinterestBoardSectionsOptions} options
   * @returns {Promise<Object>}
   */
  async listPinterestBoardSections(options = {}) {
    return this._op('listPinterestBoardSections', options);
  }

  /**
   * Create a section in a Pinterest board.
   *
   * Without a profile the first profile of the account with a Pinterest account is used.
   *
   * `POST /api/uploadposts/pinterest/boards/{board_id}/sections`
   * @param {CreatePinterestBoardSectionOptions} options
   * @returns {Promise<Object>}
   */
  async createPinterestBoardSection(options = {}) {
    return this._op('createPinterestBoardSection', options);
  }

  /**
   * Read a Facebook Page's public info.
   *
   * `GET /api/uploadposts/facebook/page-info`
   * @param {GetFacebookPageInfoOptions} options
   * @returns {Promise<Object>}
   */
  async getFacebookPageInfo(options = {}) {
    return this._op('getFacebookPageInfo', options);
  }

  /**
   * Update a Facebook Page's public info.
   *
   * Only the fields sent change. validate_only: true checks without writing. Needs Meta's pages_manage_metadata permission (pending App Review: 403 facebook_permission_missing until then). POST is accepted as an alias.
   *
   * `PATCH /api/uploadposts/facebook/page-info`
   * @param {UpdateFacebookPageInfoOptions} options
   * @returns {Promise<Object>}
   */
  async updateFacebookPageInfo(options = {}) {
    return this._op('updateFacebookPageInfo', options);
  }

  /**
   * Subreddits the Reddit account belongs to.
   *
   * `GET /api/uploadposts/reddit/subreddits`
   * @param {ListRedditSubredditsOptions} options
   * @returns {Promise<Object>}
   */
  async listRedditSubreddits(options = {}) {
    return this._op('listRedditSubreddits', options);
  }

  /**
   * Post types a subreddit allows.
   *
   * `GET /api/uploadposts/reddit/post-types`
   * @param {GetRedditPostTypesOptions} options
   * @returns {Promise<Object>}
   */
  async getRedditPostTypes(options = {}) {
    return this._op('getRedditPostTypes', options);
  }

  /**
   * Post flairs of a subreddit.
   *
   * Pass the id as reddit_flair_id when publishing; editable flairs take reddit_flair_text.
   *
   * `GET /api/uploadposts/reddit/flairs`
   * @param {ListRedditFlairsOptions} options
   * @returns {Promise<Object>}
   */
  async listRedditFlairs(options = {}) {
    return this._op('listRedditFlairs', options);
  }

  // ---- User Management ----
  /**
   * Get a specific user profile.
   *
   * Retrieve information for a single user profile by username.
   *
   * `GET /api/uploadposts/users/{username}`
   * @param {GetUserProfileOptions} options
   * @returns {Promise<Object>}
   */
  async getUserProfile(options = {}) {
    return this._op('getUserProfile', options);
  }

  /**
   * Rename a user profile.
   *
   * Set the profile's display_name, the label shown in the dashboard. The username does not change: it stays the `user` value of every API call, so history, scheduled posts, analytics and existing integrations keep working. An empty string or null removes the display name. display_name is the only editable field; any other field returns 400 FIELD_NOT_EDITABLE.
   *
   * `PATCH /api/uploadposts/users/{username}`
   * @param {RenameUserProfileOptions} options
   * @returns {Promise<Object>}
   */
  async renameUserProfile(options = {}) {
    return this._op('renameUserProfile', options);
  }

  /**
   * Disconnect a social account from a profile.
   *
   * Unlink one social platform from a user profile. Other platforms connected to the same profile are not touched. The stored credentials are deleted only if no other profile of your account still uses that social account. Fires the `social_account_disconnected` webhook with `reason: "manual_disconnect"`. Disconnecting a platform that is already disconnected returns 200.
   *
   * `DELETE /api/uploadposts/users/social`
   * @param {DisconnectSocialAccountOptions} options
   * @returns {Promise<Object>}
   */
  async disconnectSocialAccount(options = {}) {
    return this._op('disconnectSocialAccount', options);
  }

  /**
   * Connect Discord with credentials.
   *
   * Discord channel incoming webhook (no OAuth). No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/discord/credentials`
   * @param {ConnectDiscordCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectDiscordCredentials(options = {}) {
    return this._op('connectDiscordCredentials', options);
  }

  /**
   * Connect Telegram with credentials.
   *
   * Telegram bot token + target chat. Upload-Post validates both (getMe, getChat) and stores the token encrypted. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/telegram/credentials`
   * @param {ConnectTelegramCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectTelegramCredentials(options = {}) {
    return this._op('connectTelegramCredentials', options);
  }

  /**
   * Connect Slack with credentials.
   *
   * Slack channel Incoming Webhook URL (text only). No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/slack/credentials`
   * @param {ConnectSlackCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectSlackCredentials(options = {}) {
    return this._op('connectSlackCredentials', options);
  }

  /**
   * Connect Mastodon with credentials.
   *
   * Mastodon instance access token. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/mastodon/credentials`
   * @param {ConnectMastodonCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectMastodonCredentials(options = {}) {
    return this._op('connectMastodonCredentials', options);
  }

  /**
   * Connect Nostr with credentials.
   *
   * Nostr private key (nsec or hex) and optional relays. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/nostr/credentials`
   * @param {ConnectNostrCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectNostrCredentials(options = {}) {
    return this._op('connectNostrCredentials', options);
  }

  /**
   * Connect Lemmy with credentials.
   *
   * Lemmy instance, login and target community. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/lemmy/credentials`
   * @param {ConnectLemmyCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectLemmyCredentials(options = {}) {
    return this._op('connectLemmyCredentials', options);
  }

  /**
   * Connect Dev.to with credentials.
   *
   * Dev.to API key. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/devto/credentials`
   * @param {ConnectDevtoCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectDevtoCredentials(options = {}) {
    return this._op('connectDevtoCredentials', options);
  }

  /**
   * Connect Hashnode with credentials.
   *
   * Hashnode Personal Access Token and publication id. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/hashnode/credentials`
   * @param {ConnectHashnodeCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectHashnodeCredentials(options = {}) {
    return this._op('connectHashnodeCredentials', options);
  }

  /**
   * Connect WordPress with credentials.
   *
   * Self-hosted WordPress site, username and Application Password. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/wordpress/credentials`
   * @param {ConnectWordpressCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectWordpressCredentials(options = {}) {
    return this._op('connectWordpressCredentials', options);
  }

  /**
   * Connect Whop with credentials.
   *
   * Whop API key (forum:post:create) and experience id. No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/whop/credentials`
   * @param {ConnectWhopCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectWhopCredentials(options = {}) {
    return this._op('connectWhopCredentials', options);
  }

  /**
   * Connect Listmonk with credentials.
   *
   * Listmonk instance, login and list id (each post sends a campaign). No OAuth and no browser redirect: Upload-Post validates the credentials, encrypts the secret and links the account to the profile. Also accepted with the profile JWT of the white-label connect page.
   *
   * `POST /api/uploadposts/users/listmonk/credentials`
   * @param {ConnectListmonkCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectListmonkCredentials(options = {}) {
    return this._op('connectListmonkCredentials', options);
  }

  /**
   * List the Facebook Pages a profile can publish to.
   *
   * Every Facebook Page of the profile's connected account and the one selected for publishing.
   *
   * `GET /api/uploadposts/users/facebook-page`
   * @param {ListFacebookPageChoicesOptions} options
   * @returns {Promise<Object>}
   */
  async listFacebookPageChoices(options = {}) {
    return this._op('listFacebookPageChoices', options);
  }

  /**
   * Select the Facebook Page used when publishing.
   *
   * `POST /api/uploadposts/users/facebook-page`
   * @param {SetFacebookPageOptions} options
   * @returns {Promise<Object>}
   */
  async setFacebookPage(options = {}) {
    return this._op('setFacebookPage', options);
  }

  /**
   * Clear the selected Facebook Page.
   *
   * Back to the default (the first one of the account).
   *
   * `DELETE /api/uploadposts/users/facebook-page`
   * @param {ClearFacebookPageOptions} options
   * @returns {Promise<Object>}
   */
  async clearFacebookPage(options = {}) {
    return this._op('clearFacebookPage', options);
  }

  /**
   * List the LinkedIn Pages a profile can publish to.
   *
   * Every LinkedIn Page of the profile's connected account and the one selected for publishing.
   *
   * `GET /api/uploadposts/users/linkedin-page`
   * @param {ListLinkedinPageChoicesOptions} options
   * @returns {Promise<Object>}
   */
  async listLinkedinPageChoices(options = {}) {
    return this._op('listLinkedinPageChoices', options);
  }

  /**
   * Select the LinkedIn Page used when publishing.
   *
   * `POST /api/uploadposts/users/linkedin-page`
   * @param {SetLinkedinPageOptions} options
   * @returns {Promise<Object>}
   */
  async setLinkedinPage(options = {}) {
    return this._op('setLinkedinPage', options);
  }

  /**
   * Clear the selected LinkedIn Page.
   *
   * Back to the default (the first one of the account).
   *
   * `DELETE /api/uploadposts/users/linkedin-page`
   * @param {ClearLinkedinPageOptions} options
   * @returns {Promise<Object>}
   */
  async clearLinkedinPage(options = {}) {
    return this._op('clearLinkedinPage', options);
  }

  /**
   * Connect Bluesky with an app password.
   *
   * Logs in to Bluesky with the handle and an app password, stores the password encrypted and links the account to the profile. Also accepted with the profile JWT of the connect page.
   *
   * `POST /api/uploadposts/users/bluesky/credentials`
   * @param {ConnectBlueskyCredentialsOptions} options
   * @returns {Promise<Object>}
   */
  async connectBlueskyCredentials(options = {}) {
    return this._op('connectBlueskyCredentials', options);
  }

  /**
   * Use your own Google OAuth client for a profile's YouTube.
   *
   * Stores (encrypted) the client_id and client_secret of your own Google Cloud OAuth client; that profile then authorizes YouTube against it (its own API quota).
   *
   * `POST /api/uploadposts/users/youtube/credentials`
   * @param {SetYoutubeOauthClientOptions} options
   * @returns {Promise<Object>}
   */
  async setYoutubeOauthClient(options = {}) {
    return this._op('setYoutubeOauthClient', options);
  }

  // ---- Authentication ----
  /**
   * Get current user.
   *
   * Verify the validity of your API key and retrieve basic account information including email and subscription plan.
   *
   * `GET /api/uploadposts/me`
   * @param {GetCurrentUserOptions} [options]
   * @returns {Promise<Object>}
   */
  async getCurrentUser(options = {}) {
    return this._op('getCurrentUser', options);
  }

  /**
   * Connect API: start connecting a social account.
   *
   * Build your own connect page: returns the platform's authorize_url for a profile. Send the user there; Upload-Post finishes the OAuth and sends them back to redirect_url. Authenticate with the API key (then `profile` is required) or with the profile JWT of POST /uploadposts/users/generate-jwt (profile taken from the token). The state is single-use: a retry needs a new start.
   *
   * `POST /api/uploadposts/oauth/{platform}/start`
   * @param {StartOauthConnectionOptions} options
   * @returns {Promise<Object>}
   */
  async startOauthConnection(options = {}) {
    return this._op('startOauthConnection', options);
  }

  // ---- FFmpeg Editor ----
  /**
   * Create FFmpeg job.
   *
   * Submit a media processing job using an FFmpeg command template. Supports single or multiple input files via multipart upload or JSON with URLs. Jobs are asynchronous — poll the status endpoint until finished.
   *
   * `POST /api/uploadposts/ffmpeg/jobs/upload`
   * @param {CreateFfmpegJobOptions} options
   * @returns {Promise<Object>}
   */
  async createFfmpegJob(options = {}) {
    return this._op('createFfmpegJob', options);
  }

  /**
   * Get FFmpeg job status.
   *
   * Poll the status of an FFmpeg processing job. Statuses: PENDING, PROCESSING, FINISHED, ERROR.
   *
   * `GET /api/uploadposts/ffmpeg/jobs/{job_id}`
   * @param {GetFfmpegJobStatusOptions} options
   * @returns {Promise<Object>}
   */
  async getFfmpegJobStatus(options = {}) {
    return this._op('getFfmpegJobStatus', options);
  }

  /**
   * Download FFmpeg result.
   *
   * Download the processed file when job status is FINISHED. Returns binary media with appropriate Content-Type and Content-Disposition headers.
   *
   * `GET /api/uploadposts/ffmpeg/jobs/{job_id}/download`
   * @param {DownloadFfmpegResultOptions} options
   * @returns {Promise<Buffer>} The file
   */
  async downloadFfmpegResult(options = {}) {
    return this._op('downloadFfmpegResult', options);
  }

  /**
   * Get FFmpeg consumption.
   *
   * Check your current FFmpeg usage, remaining quota, and processing history for the current month.
   *
   * `GET /api/uploadposts/ffmpeg/consumption`
   * @param {GetFfmpegConsumptionOptions} [options]
   * @returns {Promise<Object>}
   */
  async getFfmpegConsumption(options = {}) {
    return this._op('getFfmpegConsumption', options);
  }

  // ---- Webhooks ----
  /**
   * List webhook subscriptions.
   *
   * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
   *
   * Newest first, active and disabled. An n8n trigger checks whether its subscription exists with `?url=<its url>&status=active`.
   *
   * `GET /api/uploadposts/webhooks/subscriptions`
   * @param {ListWebhookSubscriptionsOptions} [options]
   * @returns {Promise<Object>}
   */
  async listWebhookSubscriptions(options = {}) {
    return this._op('listWebhookSubscriptions', options);
  }

  /**
   * Create a webhook subscription.
   *
   * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
   *
   * Adds a destination that receives the listed events, besides the account webhook. Idempotent: the same url + events + profile_username returns the existing subscription (200, `created: false`) and reactivates it if it was disabled (`reactivated: true`); `name` and `source` are updated when sent. At most 10 active subscriptions per account. Team members (X-Act-As-User) cannot create them.
   *
   * `POST /api/uploadposts/webhooks/subscriptions`
   * @param {CreateWebhookSubscriptionOptions} options
   * @returns {Promise<Object>}
   */
  async createWebhookSubscription(options = {}) {
    return this._op('createWebhookSubscription', options);
  }

  /**
   * Get a webhook subscription.
   *
   * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
   *
   * `GET /api/uploadposts/webhooks/subscriptions/{subscription_id}`
   * @param {GetWebhookSubscriptionOptions} options
   * @returns {Promise<Object>}
   */
  async getWebhookSubscription(options = {}) {
    return this._op('getWebhookSubscription', options);
  }

  /**
   * Delete a webhook subscription.
   *
   * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
   *
   * Stops sending to it right away. A second DELETE answers 404 (an integration can treat 404 as already deleted).
   *
   * `DELETE /api/uploadposts/webhooks/subscriptions/{subscription_id}`
   * @param {DeleteWebhookSubscriptionOptions} options
   * @returns {Promise<Object>}
   */
  async deleteWebhookSubscription(options = {}) {
    return this._op('deleteWebhookSubscription', options);
  }

  /**
   * Send a test event to a subscription.
   *
   * **Not generally available yet.** While webhook subscriptions are switched off for your account every route of this group answers `503` with `reason: webhook_subscriptions_disabled`.
   *
   * Sends one signed sample now, with the keys of the real event and `test: true`. Logged as a test delivery: never retried and never counted towards disabling the subscription. `ok` tells whether the destination answered 2xx. For the post approval events the sample has the shape of the real event ({event, user_email, profile_username, approval: {...}, created_at}).
   *
   * `POST /api/uploadposts/webhooks/subscriptions/{subscription_id}/test`
   * @param {TestWebhookSubscriptionOptions} options
   * @returns {Promise<Object>}
   */
  async testWebhookSubscription(options = {}) {
    return this._op('testWebhookSubscription', options);
  }

  // ---- Instagram Interactions ----
  /**
   * Delete a comment (POST alias).
   *
   * POST alias of DELETE /uploadposts/comments/delete, for clients that cannot send a body with DELETE. Same body and behavior.
   *
   * `POST /api/uploadposts/comments/delete`
   * @param {DeleteCommentPostOptions} options
   * @returns {Promise<Object>}
   */
  async deleteCommentPost(options = {}) {
    return this._op('deleteCommentPost', options);
  }

  /**
   * Delete the Bluesky chat account.
   *
   * **Not generally available yet.** Answers `403` `bluesky_chat_delete_disabled`.
   *
   * Deletes every conversation and message of the account's Bluesky chat account (not the Bluesky account). Needs confirm: true and confirm_handle; not enabled yet (403 bluesky_chat_delete_disabled). Account owner only; every attempt is recorded.
   *
   * `POST /api/uploadposts/dms/bluesky/account/delete`
   * @param {DeleteBlueskyChatAccountOptions} options
   * @returns {Promise<Object>}
   */
  async deleteBlueskyChatAccount(options = {}) {
    return this._op('deleteBlueskyChatAccount', options);
  }

  /**
   * Bluesky groups shared with someone.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `GET /api/uploadposts/dms/bluesky/groups`
   * @param {ListBlueskyMutualGroupsOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyMutualGroups(options = {}) {
    return this._op('listBlueskyMutualGroups', options);
  }

  /**
   * Create a Bluesky group chat.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Members get a request to accept. Every invited member counts as one DM (all or nothing); at most 10 members by handle per request. Idempotent for 10 minutes per idempotency_key (or name + members). Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `POST /api/uploadposts/dms/bluesky/groups`
   * @param {CreateBlueskyGroupOptions} options
   * @returns {Promise<Object>}
   */
  async createBlueskyGroup(options = {}) {
    return this._op('createBlueskyGroup', options);
  }

  /**
   * Rename, lock or unlock a Bluesky group.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Owner only. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `PATCH /api/uploadposts/dms/bluesky/groups/{conversation_id}`
   * @param {EditBlueskyGroupOptions} options
   * @returns {Promise<Object>}
   */
  async editBlueskyGroup(options = {}) {
    return this._op('editBlueskyGroup', options);
  }

  /**
   * Bluesky group members.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `GET /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`
   * @param {ListBlueskyGroupMembersOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyGroupMembers(options = {}) {
    return this._op('listBlueskyGroupMembers', options);
  }

  /**
   * Add members to a Bluesky group.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Owner only. One DM of quota per added member. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`
   * @param {AddBlueskyGroupMembersOptions} options
   * @returns {Promise<Object>}
   */
  async addBlueskyGroupMembers(options = {}) {
    return this._op('addBlueskyGroupMembers', options);
  }

  /**
   * Remove members from a Bluesky group.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Owner only. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `DELETE /api/uploadposts/dms/bluesky/groups/{conversation_id}/members`
   * @param {RemoveBlueskyGroupMembersOptions} options
   * @returns {Promise<Object>}
   */
  async removeBlueskyGroupMembers(options = {}) {
    return this._op('removeBlueskyGroupMembers', options);
  }

  /**
   * Manage a Bluesky group join link.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * action: create, edit, enable or disable. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-link`
   * @param {ManageBlueskyJoinLinkOptions} options
   * @returns {Promise<Object>}
   */
  async manageBlueskyJoinLink(options = {}) {
    return this._op('manageBlueskyJoinLink', options);
  }

  /**
   * Pending requests to join a Bluesky group.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Owner only. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `GET /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests`
   * @param {ListBlueskyJoinRequestsOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyJoinRequests(options = {}) {
    return this._op('listBlueskyJoinRequests', options);
  }

  /**
   * Answer or withdraw a Bluesky join request.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * action: approve / reject (with member), mark_read, or withdraw (your own request). Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `POST /api/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests`
   * @param {AnswerBlueskyJoinRequestOptions} options
   * @returns {Promise<Object>}
   */
  async answerBlueskyJoinRequest(options = {}) {
    return this._op('answerBlueskyJoinRequest', options);
  }

  /**
   * Preview Bluesky join links.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * Up to 50 codes; status active, disabled or invalid. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `GET /api/uploadposts/dms/bluesky/join-links`
   * @param {PreviewBlueskyJoinLinksOptions} options
   * @returns {Promise<Object>}
   */
  async previewBlueskyJoinLinks(options = {}) {
    return this._op('previewBlueskyJoinLinks', options);
  }

  /**
   * Ask to join a Bluesky group.
   *
   * **Not generally available yet.** Group chats answer `403` `bluesky_dm_experimental_disabled` until they are turned on.
   *
   * status is joined or pending. Experimental on Bluesky: answers carry experimental: true; 403 bluesky_dm_experimental_disabled while not enabled.
   *
   * `POST /api/uploadposts/dms/bluesky/join-links`
   * @param {JoinBlueskyGroupOptions} options
   * @returns {Promise<Object>}
   */
  async joinBlueskyGroup(options = {}) {
    return this._op('joinBlueskyGroup', options);
  }

  /**
   * Download a DM attachment.
   *
   * Returns the file of an attachment received in a DM (the media_id in dm_received). Telegram: bots download up to 20 MB.
   *
   * `GET /api/uploadposts/dms/media`
   * @param {DownloadDmMediaOptions} options
   * @returns {Promise<Buffer>} The file
   */
  async downloadDmMedia(options = {}) {
    return this._op('downloadDmMedia', options);
  }

  // ---- Bluesky ----
  /**
   * Follow, block or mute (one target per call).
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * follow/unfollow (daily limit), block/unblock, mute/unmute (only_reposts, only_quoteposts), mute_list/unmute_list, block_list/unblock_list (moderation lists), mute_thread/unmute_thread.
   *
   * `POST /api/uploadposts/bluesky/graph`
   * @param {BlueskyGraphActionOptions} options
   * @returns {Promise<Object>}
   */
  async blueskyGraphAction(options = {}) {
    return this._op('blueskyGraphAction', options);
  }

  /**
   * The account's lists.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * getLists for the account.
   *
   * `GET /api/uploadposts/bluesky/lists`
   * @param {ListBlueskyListsOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyLists(options = {}) {
    return this._op('listBlueskyLists', options);
  }

  /**
   * Create a list.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Curated, moderation or reference list.
   *
   * `POST /api/uploadposts/bluesky/lists`
   * @param {CreateBlueskyListOptions} options
   * @returns {Promise<Object>}
   */
  async createBlueskyList(options = {}) {
    return this._op('createBlueskyList', options);
  }

  /**
   * A list and its members.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * getList.
   *
   * `GET /api/uploadposts/bluesky/lists/{list_id}`
   * @param {GetBlueskyListOptions} options
   * @returns {Promise<Object>}
   */
  async getBlueskyList(options = {}) {
    return this._op('getBlueskyList', options);
  }

  /**
   * Update a list.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Merges the fields sent.
   *
   * `PATCH /api/uploadposts/bluesky/lists/{list_id}`
   * @param {UpdateBlueskyListOptions} options
   * @returns {Promise<Object>}
   */
  async updateBlueskyList(options = {}) {
    return this._op('updateBlueskyList', options);
  }

  /**
   * Delete a list and its members.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Needs confirm=true.
   *
   * `DELETE /api/uploadposts/bluesky/lists/{list_id}`
   * @param {DeleteBlueskyListOptions} options
   * @returns {Promise<Object>}
   */
  async deleteBlueskyList(options = {}) {
    return this._op('deleteBlueskyList', options);
  }

  /**
   * List members.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * getList items.
   *
   * `GET /api/uploadposts/bluesky/lists/{list_id}/members`
   * @param {ListBlueskyListMembersOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyListMembers(options = {}) {
    return this._op('listBlueskyListMembers', options);
  }

  /**
   * Add a member.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * One account per call.
   *
   * `POST /api/uploadposts/bluesky/lists/{list_id}/members`
   * @param {AddBlueskyListMemberOptions} options
   * @returns {Promise<Object>}
   */
  async addBlueskyListMember(options = {}) {
    return this._op('addBlueskyListMember', options);
  }

  /**
   * Remove a member.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * One account per call.
   *
   * `DELETE /api/uploadposts/bluesky/lists/{list_id}/members`
   * @param {RemoveBlueskyListMemberOptions} options
   * @returns {Promise<Object>}
   */
  async removeBlueskyListMember(options = {}) {
    return this._op('removeBlueskyListMember', options);
  }

  /**
   * Ask not to appear in a reference list.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * referencelistoptout.
   *
   * `POST /api/uploadposts/bluesky/lists/opt-out`
   * @param {OptOutBlueskyListOptions} options
   * @returns {Promise<Object>}
   */
  async optOutBlueskyList(options = {}) {
    return this._op('optOutBlueskyList', options);
  }

  /**
   * Withdraw the opt-out.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * `DELETE /api/uploadposts/bluesky/lists/opt-out`
   * @param {RemoveOptOutBlueskyListOptions} options
   * @returns {Promise<Object>}
   */
  async removeOptOutBlueskyList(options = {}) {
    return this._op('removeOptOutBlueskyList', options);
  }

  /**
   * The account's starter packs.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * `GET /api/uploadposts/bluesky/starter-packs`
   * @param {ListBlueskyStarterPacksOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyStarterPacks(options = {}) {
    return this._op('listBlueskyStarterPacks', options);
  }

  /**
   * Create a starter pack.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * `POST /api/uploadposts/bluesky/starter-packs`
   * @param {CreateBlueskyStarterPackOptions} options
   * @returns {Promise<Object>}
   */
  async createBlueskyStarterPack(options = {}) {
    return this._op('createBlueskyStarterPack', options);
  }

  /**
   * A starter pack.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * `GET /api/uploadposts/bluesky/starter-packs/{pack_id}`
   * @param {GetBlueskyStarterPackOptions} options
   * @returns {Promise<Object>}
   */
  async getBlueskyStarterPack(options = {}) {
    return this._op('getBlueskyStarterPack', options);
  }

  /**
   * Update a starter pack.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * name, description, feeds.
   *
   * `PATCH /api/uploadposts/bluesky/starter-packs/{pack_id}`
   * @param {UpdateBlueskyStarterPackOptions} options
   * @returns {Promise<Object>}
   */
  async updateBlueskyStarterPack(options = {}) {
    return this._op('updateBlueskyStarterPack', options);
  }

  /**
   * Delete a starter pack.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Needs confirm=true; delete_list=true also deletes its list.
   *
   * `DELETE /api/uploadposts/bluesky/starter-packs/{pack_id}`
   * @param {DeleteBlueskyStarterPackOptions} options
   * @returns {Promise<Object>}
   */
  async deleteBlueskyStarterPack(options = {}) {
    return this._op('deleteBlueskyStarterPack', options);
  }

  /**
   * Feeds declared by the account.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * `GET /api/uploadposts/bluesky/feeds`
   * @param {ListBlueskyFeedsOptions} options
   * @returns {Promise<Object>}
   */
  async listBlueskyFeeds(options = {}) {
    return this._op('listBlueskyFeeds', options);
  }

  /**
   * Declare a custom feed.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Points to a feed generator service run by someone else.
   *
   * `POST /api/uploadposts/bluesky/feeds`
   * @param {CreateBlueskyFeedOptions} options
   * @returns {Promise<Object>}
   */
  async createBlueskyFeed(options = {}) {
    return this._op('createBlueskyFeed', options);
  }

  /**
   * Update a feed declaration.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * `PATCH /api/uploadposts/bluesky/feeds/{rkey}`
   * @param {UpdateBlueskyFeedOptions} options
   * @returns {Promise<Object>}
   */
  async updateBlueskyFeed(options = {}) {
    return this._op('updateBlueskyFeed', options);
  }

  /**
   * Delete a feed declaration.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Needs confirm=true.
   *
   * `DELETE /api/uploadposts/bluesky/feeds/{rkey}`
   * @param {DeleteBlueskyFeedOptions} options
   * @returns {Promise<Object>}
   */
  async deleteBlueskyFeed(options = {}) {
    return this._op('deleteBlueskyFeed', options);
  }

  /**
   * Report a post or account to Bluesky moderation.
   *
   * **Not generally available yet.** Answers `503` `bluesky_feature_disabled` until it is turned on.
   *
   * Needs confirm=true. Up to 20 reports per account per UTC day.
   *
   * `POST /api/uploadposts/bluesky/report`
   * @param {ReportOnBlueskyOptions} options
   * @returns {Promise<Object>}
   */
  async reportOnBluesky(options = {}) {
    return this._op('reportOnBluesky', options);
  }

  // ---- Teams and Approvals ----
  /**
   * List posts awaiting approval.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * Open items by default (pending_approval and draft). Editors and Contributors only see their own; members limited to some profiles only see those. Page with `before` = the previous `next_before`.
   *
   * `GET /api/uploadposts/approvals`
   * @param {ListPostApprovalsOptions} [options]
   * @returns {Promise<Object>}
   */
  async listPostApprovals(options = {}) {
    return this._op('listPostApprovals', options);
  }

  /**
   * Get a post awaiting approval.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * The author or a reviewer (owner or Admin). Adds fields, preview_url, thumbnail_url and destinations_effective.
   *
   * `GET /api/uploadposts/approvals/{approval_id}`
   * @param {GetPostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async getPostApproval(options = {}) {
    return this._op('getPostApproval', options);
  }

  /**
   * Edit a post awaiting approval.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * The author or a reviewer, while it is open. Same body and validations as `PATCH /uploadposts/schedule/{job_id}`. Every edit raises `version` by one.
   *
   * `PATCH /api/uploadposts/approvals/{approval_id}`
   * @param {EditPostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async editPostApproval(options = {}) {
    return this._op('editPostApproval', options);
  }

  /**
   * Withdraw or discard a post awaiting approval.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * The author withdraws it or a reviewer discards it: status withdrawn; its media is deleted.
   *
   * `DELETE /api/uploadposts/approvals/{approval_id}`
   * @param {WithdrawPostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async withdrawPostApproval(options = {}) {
    return this._op('withdrawPostApproval', options);
  }

  /**
   * Approve a post.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * Reviewer only (owner or Admin). `version` is required: the `item.version` you reviewed. Date used: the one in the body; else now (immediate posts or `publish_now`); else the next free queue slot (posts sent with add_to_queue); else the post's own date if it is more than 60 s away. Monthly credits are reserved now; if creating the job fails the item reopens and the credits come back (500 approval_failed).
   *
   * `POST /api/uploadposts/approvals/{approval_id}/approve`
   * @param {ApprovePostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async approvePostApproval(options = {}) {
    return this._op('approvePostApproval', options);
  }

  /**
   * Reject a post.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * Reviewer only. `comment` is required (max 2000 characters) and is shown to the author.
   *
   * `POST /api/uploadposts/approvals/{approval_id}/reject`
   * @param {RejectPostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async rejectPostApproval(options = {}) {
    return this._op('rejectPostApproval', options);
  }

  /**
   * End client: list posts to approve.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * Called with the **profile JWT** of the white-label connect page (`Authorization: Bearer <access_url token>`), generated with `client_approval: true` (`POST /uploadposts/users/generate-jwt`). Only the `pending_approval` posts of that profile; the end client cannot change the date. The account owner turns it off by generating the JWT again with `client_approval: false`. Items come without author or internal ids.
   *
   * `GET /api/uploadposts/approvals/client`
   * Authenticated with the profile JWT (`token`), not the API key.
   * @param {ListClientPostApprovalsOptions} options
   * @returns {Promise<Object>}
   */
  async listClientPostApprovals(options = {}) {
    return this._op('listClientPostApprovals', options);
  }

  /**
   * End client: approve a post.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * Called with the **profile JWT** of the white-label connect page (`Authorization: Bearer <access_url token>`), generated with `client_approval: true` (`POST /uploadposts/users/generate-jwt`). Only the `pending_approval` posts of that profile; the end client cannot change the date. The account owner turns it off by generating the JWT again with `client_approval: false`. `version` is required, as for reviewers. Recorded as decided_by `client:<profile>`, decided_by_role `client`.
   *
   * `POST /api/uploadposts/approvals/client/{approval_id}/approve`
   * Authenticated with the profile JWT (`token`), not the API key.
   * @param {ApproveClientPostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async approveClientPostApproval(options = {}) {
    return this._op('approveClientPostApproval', options);
  }

  /**
   * End client: reject a post.
   *
   * **Not generally available yet.** While post approvals are switched off every route of this group answers `503` with `error_code: post_approvals_disabled`.
   *
   * Called with the **profile JWT** of the white-label connect page (`Authorization: Bearer <access_url token>`), generated with `client_approval: true` (`POST /uploadposts/users/generate-jwt`). Only the `pending_approval` posts of that profile; the end client cannot change the date. The account owner turns it off by generating the JWT again with `client_approval: false`. `comment` is required.
   *
   * `POST /api/uploadposts/approvals/client/{approval_id}/reject`
   * Authenticated with the profile JWT (`token`), not the API key.
   * @param {RejectClientPostApprovalOptions} options
   * @returns {Promise<Object>}
   */
  async rejectClientPostApproval(options = {}) {
    return this._op('rejectClientPostApproval', options);
  }

  /**
   * Team roles and your role.
   *
   * The role matrix and the caller's role. `enabled: false` while team roles are not available: then every member is treated as Admin with every profile. Roles and profile lists are changed by the account owner from the dashboard.
   *
   * `GET /api/uploadposts/teams/roles`
   * @param {GetTeamRolesOptions} [options]
   * @returns {Promise<Object>}
   */
  async getTeamRoles(options = {}) {
    return this._op('getTeamRoles', options);
  }

  /**
   * Team activity log.
   *
   * What team members did on the account (posts created, published, edited or cancelled, approvals and decisions, access changes), newest first. Owner and Admin members only. Rows are kept `retention_days` days.
   *
   * `GET /api/uploadposts/teams/audit`
   * @param {ListTeamAuditOptions} [options]
   * @returns {Promise<Object>}
   */
  async listTeamAudit(options = {}) {
    return this._op('listTeamAudit', options);
  }

  // ---- Feedback ----
  /**
   * Send feedback to the Upload-Post team.
   *
   * For AI agents and developers. Never include credentials or personal data (they are redacted anyway). A repeated report returns duplicate: true.
   *
   * `POST /api/uploadposts/feedback`
   * @param {SendFeedbackOptions} options
   * @returns {Promise<Object>}
   */
  async sendFeedback(options = {}) {
    return this._op('sendFeedback', options);
  }

  // ---- Google Business ----
  /**
   * Rename a Google Business account.
   *
   * **Not generally available yet.** Off by default: answers `403` with `ownership_changes_disabled` until the feature is available.
   *
   * Renames a business account (only the name). With `validate_only: true` Google checks the request without changing anything (no `confirm` needed); that mode works today. A real rename is not generally available yet: 403 `ownership_changes_disabled`. `account` must be the account connected to the profile or the owner of one of its saved locations (404 `account_not_found` otherwise).
   *
   * `PATCH /api/uploadposts/google-business/accounts`
   * @param {UpdateGoogleBusinessAccountOptions} options
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessAccount(options = {}) {
    return this._op('updateGoogleBusinessAccount', options);
  }

  /**
   * Invite an admin.
   *
   * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
   *
   * Google emails the invitation; the person gets access once they accept. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
   *
   * `POST /api/uploadposts/google-business/admins`
   * @param {CreateGoogleBusinessAdminOptions} options
   * @returns {Promise<Object>}
   */
  async createGoogleBusinessAdmin(options = {}) {
    return this._op('createGoogleBusinessAdmin', options);
  }

  /**
   * Change an admin's role.
   *
   * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
   *
   * Changes the role of an admin (`admin_name` from GET /admins). If the role is already that one, the answer has `unchanged: true` and nothing is sent. Refused with 409 `last_owner` if it would demote the last owner and 409 `connected_identity` if it would demote the Google account connected to Upload-Post. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
   *
   * `PATCH /api/uploadposts/google-business/admins`
   * @param {UpdateGoogleBusinessAdminOptions} options
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessAdmin(options = {}) {
    return this._op('updateGoogleBusinessAdmin', options);
  }

  /**
   * Remove an admin.
   *
   * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
   *
   * Removes an admin at once (they would have to be invited again). Refused with 409 `last_owner` / `connected_identity` like the role change. JSON body. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
   *
   * `DELETE /api/uploadposts/google-business/admins`
   * @param {DeleteGoogleBusinessAdminOptions} options
   * @returns {Promise<Object>}
   */
  async deleteGoogleBusinessAdmin(options = {}) {
    return this._op('deleteGoogleBusinessAdmin', options);
  }

  /**
   * Accept an invitation.
   *
   * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
   *
   * Accepts a pending invitation (404 `invitation_not_found` otherwise). Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
   *
   * `POST /api/uploadposts/google-business/invitations/accept`
   * @param {AcceptGoogleBusinessInvitationOptions} options
   * @returns {Promise<Object>}
   */
  async acceptGoogleBusinessInvitation(options = {}) {
    return this._op('acceptGoogleBusinessInvitation', options);
  }

  /**
   * Decline an invitation.
   *
   * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
   *
   * Declines a pending invitation (404 `invitation_not_found` otherwise). Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
   *
   * `POST /api/uploadposts/google-business/invitations/decline`
   * @param {DeclineGoogleBusinessInvitationOptions} options
   * @returns {Promise<Object>}
   */
  async declineGoogleBusinessInvitation(options = {}) {
    return this._op('declineGoogleBusinessInvitation', options);
  }

  /**
   * Transfer a location to another account.
   *
   * **Not generally available yet.** The API answers HTTP 503 until it is switched on.
   *
   * Moves a location to another Google account. Google only allows it when the connected user owns the location and manages the destination account. Not generally available yet: answers 403 `ownership_changes_disabled` (do it in Google Business Profile). When enabled, only the owner of the Upload-Post account can do it (a team member gets 403 `owner_only`). Needs `"confirm": true`. Every change is audited. On 502 `google_result_unknown`, check with the matching GET before resending.
   *
   * `POST /api/uploadposts/google-business/locations/transfer`
   * @param {TransferGoogleBusinessLocationOptions} options
   * @returns {Promise<Object>}
   */
  async transferGoogleBusinessLocation(options = {}) {
    return this._op('transferGoogleBusinessLocation', options);
  }

  /**
   * Create a location.
   *
   * **Not generally available yet.** Answers 503 `gbp_feature_disabled` before anything else is checked. Send `location` (a Google Location object) or the friendly fields of location info, plus `language_code`. `title`, `primary_category` and `language_code` are required. Needs `confirm: true` (not with `dry_run`). `request_id` comes back in every answer: on 502 `google_result_unknown` repeat with the same `request_id` and Google never creates it twice. Search first with google-locations/search. Daily creation limits: 429 `daily_limit_reached` / `google_daily_quota_exhausted`.
   *
   * `POST /api/uploadposts/google-business/locations/create`
   * @param {CreateGoogleBusinessLocationOptions} options
   * @returns {Promise<Object>}
   */
  async createGoogleBusinessLocation(options = {}) {
    return this._op('createGoogleBusinessLocation', options);
  }

  /**
   * Delete a location.
   *
   * **Not generally available yet.** Answers 503 `gbp_feature_disabled` before anything else is checked. Irreversible. Needs `confirm: true`. If Google does not allow deleting it through the API: 409 `location_cannot_be_deleted` (delete it from business.google.com).
   *
   * `DELETE /api/uploadposts/google-business/locations/delete`
   * @param {DeleteGoogleBusinessLocationOptions} options
   * @returns {Promise<Object>}
   */
  async deleteGoogleBusinessLocation(options = {}) {
    return this._op('deleteGoogleBusinessLocation', options);
  }

  /**
   * Get real-time notification settings.
   *
   * **Not generally available yet.** Answers 503 `gbp_notifications_unavailable` and no Google Business event is sent to webhooks. Google keeps one notification setting per Google account; when another tool owns it, `other_tool_configured` is `true`.
   *
   * `GET /api/uploadposts/google-business/notifications`
   * @param {GetGoogleBusinessNotificationSettingsOptions} options
   * @returns {Promise<Object>}
   */
  async getGoogleBusinessNotificationSettings(options = {}) {
    return this._op('getGoogleBusinessNotificationSettings', options);
  }

  /**
   * Turn real-time notifications on or off.
   *
   * **Not generally available yet.** Answers 503 `gbp_notifications_unavailable` and no Google Business event is sent to webhooks. Turns notifications on or off for the Google account; webhooks must also list the events (`review_received`, `review_updated`, `customer_media_received`, `listing_google_update`, `listing_duplicate`, `listing_control_changed`) in `webhook_events`. Needs `confirm: true`. If Google does not confirm the change (`outcome_unknown: true`), read the setting before retrying.
   *
   * `PUT /api/uploadposts/google-business/notifications`
   * @param {UpdateGoogleBusinessNotificationSettingsOptions} options
   * @returns {Promise<Object>}
   */
  async updateGoogleBusinessNotificationSettings(options = {}) {
    return this._op('updateGoogleBusinessNotificationSettings', options);
  }

  /**
   * Start a verification.
   *
   * **Not generally available yet.** Answers 503 `gbp_feature_disabled`. Google contacts the business (postcard, SMS, call or email), so `confirm: true` is required. 3 verifications a day per location (429 `daily_limit_reached`, `scope: location`). `AUTO` verifications are `COMPLETED` at once; the others wait for the code. On 502 `google_result_unknown`, check the list before trying again.
   *
   * `POST /api/uploadposts/google-business/verification/start`
   * @param {StartGoogleBusinessVerificationOptions} options
   * @returns {Promise<Object>}
   */
  async startGoogleBusinessVerification(options = {}) {
    return this._op('startGoogleBusinessVerification', options);
  }

  /**
   * Enter the verification code.
   *
   * **Not generally available yet.** Answers 503 `gbp_feature_disabled`. Sends the code Google sent. 10 attempts a day per account and location (429 `daily_limit_reached`); only codes Google actually checked count. `state: COMPLETED` when Google accepts it.
   *
   * `POST /api/uploadposts/google-business/verification/complete`
   * @param {CompleteGoogleBusinessVerificationOptions} options
   * @returns {Promise<Object>}
   */
  async completeGoogleBusinessVerification(options = {}) {
    return this._op('completeGoogleBusinessVerification', options);
  }

  /**
   * Get an instant verification token.
   *
   * **Not generally available yet.** Answers 503 `gbp_feature_disabled`. Asks Google for an instant verification token. When Google reserves it to its vetted partners, 403 `partner_only`: use verification/start instead.
   *
   * `POST /api/uploadposts/google-business/verification/token`
   * @param {GenerateGoogleBusinessVerificationTokenOptions} options
   * @returns {Promise<Object>}
   */
  async generateGoogleBusinessVerificationToken(options = {}) {
    return this._op('generateGoogleBusinessVerificationToken', options);
  }

  // ---- ChatGPT Ads ----
  /**
   * Connect a ChatGPT Ads account.
   *
   * Stores an OpenAI Ads API key after validating it live against OpenAI. Each key is scoped to one ad account. The key is encrypted at rest and never returned. Posting the same account again replaces the stored key (key rotation). The first account connected becomes the default. Spend runs on your own OpenAI billing.
   *
   * `POST /api/uploadposts/ads/chatgpt/connect`
   * @param {ConnectChatgptAdsAccountOptions} options
   * @returns {Promise<Object>}
   */
  async connectChatgptAdsAccount(options = {}) {
    return this._op('connectChatgptAdsAccount', options);
  }

  /**
   * List connected ChatGPT Ads accounts.
   *
   * Connected ad accounts (never the credentials), default first, each with the `profiles` it is linked to.
   *
   * `GET /api/uploadposts/ads/chatgpt/accounts`
   * @param {ListChatgptAdsAccountsOptions} [options]
   * @returns {Promise<Object>}
   */
  async listChatgptAdsAccounts(options = {}) {
    return this._op('listChatgptAdsAccounts', options);
  }

  /**
   * Disconnect a ChatGPT Ads account.
   *
   * Without `profile_username`: forgets the stored key and unlinks every profile (if it was the default, another connected account becomes the default). With `profile_username`: only unlinks that profile and keeps the key for the others. Campaigns keep running in Ads Manager either way.
   *
   * `DELETE /api/uploadposts/ads/chatgpt/accounts/{ad_account_id}`
   * @param {DisconnectChatgptAdsAccountOptions} options
   * @returns {Promise<Object>}
   */
  async disconnectChatgptAdsAccount(options = {}) {
    return this._op('disconnectChatgptAdsAccount', options);
  }

  /**
   * Get live ad account metadata.
   *
   * The selected ad account's metadata, read live from OpenAI. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/account`
   * @param {GetChatgptAdsAccountOptions} [options]
   * @returns {Promise<Object>}
   */
  async getChatgptAdsAccount(options = {}) {
    return this._op('getChatgptAdsAccount', options);
  }

  /**
   * List campaigns.
   *
   * Campaigns of the ad account. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/campaigns`
   * @param {ListChatgptAdsCampaignsOptions} [options]
   * @returns {Promise<Object>}
   */
  async listChatgptAdsCampaigns(options = {}) {
    return this._op('listChatgptAdsCampaigns', options);
  }

  /**
   * Create a campaign.
   *
   * Creates a campaign (budget, schedule, location and audience targeting). One of `budget` / `budget_micros` is required. Created `paused` unless `status: active` is sent. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/campaigns`
   * @param {CreateChatgptAdsCampaignOptions} options
   * @returns {Promise<Object>}
   */
  async createChatgptAdsCampaign(options = {}) {
    return this._op('createChatgptAdsCampaign', options);
  }

  /**
   * Get a campaign.
   *
   * One campaign. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}`
   * @param {GetChatgptAdsCampaignOptions} options
   * @returns {Promise<Object>}
   */
  async getChatgptAdsCampaign(options = {}) {
    return this._op('getChatgptAdsCampaign', options);
  }

  /**
   * Update a campaign.
   *
   * Updates a campaign. Every field is optional; at least one is required (400 `No updatable fields supplied`). Archiving is irreversible. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}`
   * @param {UpdateChatgptAdsCampaignOptions} options
   * @returns {Promise<Object>}
   */
  async updateChatgptAdsCampaign(options = {}) {
    return this._op('updateChatgptAdsCampaign', options);
  }

  /**
   * Activate a campaign.
   *
   * Sets the campaign `active`. An ad only serves when its campaign, ad group and ad are all active and the ad passed OpenAI's review. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/activate`
   * @param {ActivateChatgptAdsCampaignOptions} options
   * @returns {Promise<Object>}
   */
  async activateChatgptAdsCampaign(options = {}) {
    return this._op('activateChatgptAdsCampaign', options);
  }

  /**
   * Pause a campaign.
   *
   * Sets the campaign `paused`. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/pause`
   * @param {PauseChatgptAdsCampaignOptions} options
   * @returns {Promise<Object>}
   */
  async pauseChatgptAdsCampaign(options = {}) {
    return this._op('pauseChatgptAdsCampaign', options);
  }

  /**
   * Archive a campaign.
   *
   * Archives the campaign. Irreversible. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/archive`
   * @param {ArchiveChatgptAdsCampaignOptions} options
   * @returns {Promise<Object>}
   */
  async archiveChatgptAdsCampaign(options = {}) {
    return this._op('archiveChatgptAdsCampaign', options);
  }

  /**
   * Get campaign insights.
   *
   * Performance of one campaign; rows per `aggregation_level` inside it. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/campaigns/{campaign_id}/insights`
   * @param {GetChatgptAdsCampaignInsightsOptions} options
   * @returns {Promise<Object>}
   */
  async getChatgptAdsCampaignInsights(options = {}) {
    return this._op('getChatgptAdsCampaignInsights', options);
  }

  /**
   * List ad groups.
   *
   * Ad groups of a campaign. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/adgroups`
   * @param {ListChatgptAdsAdGroupsOptions} options
   * @returns {Promise<Object>}
   */
  async listChatgptAdsAdGroups(options = {}) {
    return this._op('listChatgptAdsAdGroups', options);
  }

  /**
   * Create an ad group.
   *
   * Creates an ad group (the bid) under a campaign. One of `max_bid` / `max_bid_micros` is required unless `bidding_config` is sent. Created `paused` unless `status: active` is sent. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/adgroups`
   * @param {CreateChatgptAdsAdGroupOptions} options
   * @returns {Promise<Object>}
   */
  async createChatgptAdsAdGroup(options = {}) {
    return this._op('createChatgptAdsAdGroup', options);
  }

  /**
   * Get an ad group.
   *
   * One ad group. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}`
   * @param {GetChatgptAdsAdGroupOptions} options
   * @returns {Promise<Object>}
   */
  async getChatgptAdsAdGroup(options = {}) {
    return this._op('getChatgptAdsAdGroup', options);
  }

  /**
   * Update an ad group.
   *
   * Updates an ad group. Every field is optional; at least one is required (400 `No updatable fields supplied`). Archiving is irreversible. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}`
   * @param {UpdateChatgptAdsAdGroupOptions} options
   * @returns {Promise<Object>}
   */
  async updateChatgptAdsAdGroup(options = {}) {
    return this._op('updateChatgptAdsAdGroup', options);
  }

  /**
   * Activate an ad group.
   *
   * Sets the ad group `active`. An ad only serves when its campaign, ad group and ad are all active and the ad passed OpenAI's review. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/activate`
   * @param {ActivateChatgptAdsAdGroupOptions} options
   * @returns {Promise<Object>}
   */
  async activateChatgptAdsAdGroup(options = {}) {
    return this._op('activateChatgptAdsAdGroup', options);
  }

  /**
   * Pause an ad group.
   *
   * Sets the ad group `paused`. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/pause`
   * @param {PauseChatgptAdsAdGroupOptions} options
   * @returns {Promise<Object>}
   */
  async pauseChatgptAdsAdGroup(options = {}) {
    return this._op('pauseChatgptAdsAdGroup', options);
  }

  /**
   * Archive an ad group.
   *
   * Archives the ad group. Irreversible. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/archive`
   * @param {ArchiveChatgptAdsAdGroupOptions} options
   * @returns {Promise<Object>}
   */
  async archiveChatgptAdsAdGroup(options = {}) {
    return this._op('archiveChatgptAdsAdGroup', options);
  }

  /**
   * Get ad group insights.
   *
   * Performance of one ad group; rows per `aggregation_level` inside it. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/insights`
   * @param {GetChatgptAdsAdGroupInsightsOptions} options
   * @returns {Promise<Object>}
   */
  async getChatgptAdsAdGroupInsights(options = {}) {
    return this._op('getChatgptAdsAdGroupInsights', options);
  }

  /**
   * List ads.
   *
   * Ads of an ad group. `review_status` is `in_review`, `approved` or `rejected`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/ads`
   * @param {ListChatgptAdsAdsOptions} options
   * @returns {Promise<Object>}
   */
  async listChatgptAdsAds(options = {}) {
    return this._op('listChatgptAdsAds', options);
  }

  /**
   * Create an ad.
   *
   * Creates an ad (the creative) under an ad group: send `title`, `body`, `target_url` and `file_id` at the top level, or a full `creative` object (needed for `product_ad_template`). It starts serving after OpenAI's review (`review_status: approved`). Created `paused` unless `status: active` is sent. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/ads`
   * @param {CreateChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async createChatgptAdsAd(options = {}) {
    return this._op('createChatgptAdsAd', options);
  }

  /**
   * Get an ad.
   *
   * One ad. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/ads/{ad_id}`
   * @param {GetChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async getChatgptAdsAd(options = {}) {
    return this._op('getChatgptAdsAd', options);
  }

  /**
   * Update an ad.
   *
   * Updates an ad. Only `name`, `status` and `creative` are read; an edited ad goes back into review. Every field is optional; at least one is required (400 `No updatable fields supplied`). Archiving is irreversible. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}`
   * @param {UpdateChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async updateChatgptAdsAd(options = {}) {
    return this._op('updateChatgptAdsAd', options);
  }

  /**
   * Activate an ad.
   *
   * Sets the ad `active`. An ad only serves when its campaign, ad group and ad are all active and the ad passed OpenAI's review. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/activate`
   * @param {ActivateChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async activateChatgptAdsAd(options = {}) {
    return this._op('activateChatgptAdsAd', options);
  }

  /**
   * Pause an ad.
   *
   * Sets the ad `paused`. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/pause`
   * @param {PauseChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async pauseChatgptAdsAd(options = {}) {
    return this._op('pauseChatgptAdsAd', options);
  }

  /**
   * Archive an ad.
   *
   * Archives the ad. Irreversible. No body: choose the ad account with the query parameter or the header. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/archive`
   * @param {ArchiveChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async archiveChatgptAdsAd(options = {}) {
    return this._op('archiveChatgptAdsAd', options);
  }

  /**
   * Get ad insights.
   *
   * Performance of one ad; rows per `aggregation_level` inside it. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/ads/{ad_id}/insights`
   * @param {GetChatgptAdsAdInsightsOptions} options
   * @returns {Promise<Object>}
   */
  async getChatgptAdsAdInsights(options = {}) {
    return this._op('getChatgptAdsAdInsights', options);
  }

  /**
   * Preview an ad.
   *
   * A temporary iframe preview of the ad (expires in 24 h). No body. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/ads/{ad_id}/preview`
   * @param {PreviewChatgptAdsAdOptions} options
   * @returns {Promise<Object>}
   */
  async previewChatgptAdsAd(options = {}) {
    return this._op('previewChatgptAdsAd', options);
  }

  /**
   * Upload a creative image.
   *
   * Uploads the image an ad uses; reuse the returned `file_id`. JSON with `image_url` (OpenAI fetches it) or multipart with a binary `file` (up to 10 MB). A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/creatives`
   * @param {UploadChatgptAdsCreativeOptions} [options]
   * @returns {Promise<Object>}
   */
  async uploadChatgptAdsCreative(options = {}) {
    return this._op('uploadChatgptAdsCreative', options);
  }

  /**
   * Get ad account insights.
   *
   * Performance of the whole ad account; rows per `aggregation_level`. Repeatable parameters accept `key` or `key[]` and are forwarded to OpenAI. Page forward with `after=<last_id>`. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `GET /api/uploadposts/ads/chatgpt/insights`
   * @param {GetChatgptAdsAccountInsightsOptions} [options]
   * @returns {Promise<Object>}
   */
  async getChatgptAdsAccountInsights(options = {}) {
    return this._op('getChatgptAdsAccountInsights', options);
  }

  /**
   * Launch an ad in one call.
   *
   * Creates the campaign, ad group and ad, and uploads the creative from `image_url` (or reuses `file_id`), in one request. Every payload is validated before the first write; everything is created paused and only activated (`status: active`) once all three exist. If a later step fails, the error carries `details.created` with the ids already created so you can finish or archive them. A 401 can also mean OpenAI rejected the stored key (revoked): reconnect the account with POST /connect.
   *
   * `POST /api/uploadposts/ads/chatgpt/promote`
   * @param {PromoteChatgptAdsOptions} options
   * @returns {Promise<Object>}
   */
  async promoteChatgptAds(options = {}) {
    return this._op('promoteChatgptAds', options);
  }

  // </openapi:methods>
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

// Operations behind the generated methods: [HTTP method, path, details]. Details:
// q = query parameters, b = body fields, f = file fields, mp = multipart only,
// bearer = profile JWT instead of the API key, raw = the answer is a file,
// na = not generally available yet (HTTP 503 until switched on).
// <openapi:operations>
UploadPost.OPENAPI_OPERATIONS = {
  sendTelegramGift: ["POST", "/uploadposts/telegram/gifts", {"b": ["user", "user_id", "chat_id", "gift_id", "max_star_count", "pay_for_upgrade", "text", "text_parse_mode", "text_entities", "confirm", "idempotency_key"], "na": 1}],
  giftTelegramPremium: ["POST", "/uploadposts/telegram/gifts/premium", {"b": ["user", "user_id", "month_count", "star_count", "text", "confirm", "idempotency_key"], "na": 1}],
  getTelegramPaymentSettings: ["GET", "/uploadposts/telegram/payments/settings", {"q": ["user"]}],
  updateTelegramPaymentSettings: ["PUT", "/uploadposts/telegram/payments/settings", {"b": ["user", "pre_checkout", "max_total_amount", "allowed_payload_prefixes", "error_message", "shipping", "shipping_options", "shipping_countries", "only_upload_post_invoices", "confirm"]}],
  setTelegramUpdates: ["POST", "/uploadposts/telegram/updates", {"b": ["user", "enabled", "replace_existing_webhook", "forward_url", "business_chats", "auto_answer_callbacks", "extra_updates"], "na": 1}],
  answerTelegramQuery: ["POST", "/uploadposts/telegram/answer", {"b": ["user", "type", "query_id", "text", "show_alert", "url", "cache_time", "results", "is_personal", "next_offset", "button", "result", "web_app_url", "data", "ok", "shipping_options", "error_message"]}],
  getTelegramBusinessConnections: ["GET", "/uploadposts/telegram/business-connections", {"q": ["user", "business_connection_id"], "na": 1}],
  getTelegramBusinessProfile: ["GET", "/uploadposts/telegram/business-profile", {"q": ["user", "business_connection_id"], "na": 1}],
  updateTelegramBusinessProfile: ["PATCH", "/uploadposts/telegram/business-profile", {"b": ["user", "business_connection_id", "first_name", "last_name", "username", "bio", "media_url", "is_public", "remove_photo", "gift_settings"], "na": 1}],
  postTelegramStory: ["POST", "/uploadposts/telegram/business-stories", {"b": ["user", "business_connection_id", "media_url", "active_period", "caption", "parse_mode", "caption_entities", "areas", "post_to_chat_page", "protect_content", "story_id"], "na": 1}],
  editTelegramStory: ["PATCH", "/uploadposts/telegram/business-stories", {"b": ["user", "business_connection_id", "media_url", "active_period", "caption", "parse_mode", "caption_entities", "areas", "post_to_chat_page", "protect_content", "story_id"], "na": 1}],
  deleteTelegramStory: ["DELETE", "/uploadposts/telegram/business-stories", {"b": ["user", "business_connection_id", "media_url", "active_period", "caption", "parse_mode", "caption_entities", "areas", "post_to_chat_page", "protect_content", "story_id"], "na": 1}],
  repostTelegramStory: ["POST", "/uploadposts/telegram/business-stories/repost", {"b": ["user", "business_connection_id", "from_chat_id", "from_story_id", "active_period", "post_to_chat_page", "protect_content"], "na": 1}],
  getTelegramBusinessGifts: ["GET", "/uploadposts/telegram/business-gifts", {"q": ["user", "business_connection_id"], "na": 1}],
  manageTelegramBusinessGift: ["POST", "/uploadposts/telegram/business-gifts", {"b": ["user", "business_connection_id", "action", "owned_gift_id", "confirm", "keep_original_details", "star_count", "idempotency_key", "new_owner_chat_id"], "na": 1}],
  getTelegramBusinessStars: ["GET", "/uploadposts/telegram/business-stars", {"q": ["user", "business_connection_id"], "na": 1}],
  transferTelegramBusinessStars: ["POST", "/uploadposts/telegram/business-stars/transfer", {"b": ["user", "business_connection_id", "star_count", "idempotency_key", "confirm"], "na": 1}],
  analyzeShorts: ["POST", "/uploadposts/analyze-shorts", {"b": ["video", "platforms", "language"], "f": ["video"], "mp": 1}],
  rewriteCaptions: ["POST", "/uploadposts/rewrite-captions", {"b": ["content", "language", "platforms"]}],
  createMediaUpload: ["POST", "/uploadposts/media-uploads", {"b": ["media_type", "filename", "content_type", "content_length", "source"]}],
  completeMediaUpload: ["POST", "/uploadposts/media-uploads/{upload_id}/complete", {}],
  getMediaUpload: ["GET", "/uploadposts/media-uploads/{upload_id}", {"q": ["include_url"]}],
  deleteMediaUpload: ["DELETE", "/uploadposts/media-uploads/{upload_id}", {}],
  getScheduledPost: ["GET", "/uploadposts/schedule/{job_id}", {}],
  getScheduledPostThumbnail: ["GET", "/uploadposts/schedule/{job_id}/thumbnail", {}],
  getScheduledPostPreview: ["GET", "/uploadposts/schedule/{job_id}/preview", {}],
  createPinterestBoard: ["POST", "/uploadposts/pinterest/boards", {"q": ["profile", "user"], "b": ["user", "name", "description", "privacy", "profile"]}],
  queryYoutubeAnalytics: ["GET", "/uploadposts/youtube/analytics/query", {"q": ["user", "start_date", "end_date", "metrics", "dimensions", "filters", "sort", "max_results", "start_index", "report"], "na": 1}],
  listYoutubeAnalyticsReports: ["GET", "/uploadposts/youtube/analytics/reports", {"q": ["user"], "na": 1}],
  listYoutubeAnalyticsGroups: ["GET", "/uploadposts/youtube/analytics/groups", {"q": ["user", "ids", "page_token"], "na": 1}],
  listYoutubeAnalyticsGroupItems: ["GET", "/uploadposts/youtube/analytics/groups/{group_id}/items", {"q": ["user"], "na": 1}],
  getYoutubeAnalyticsUsage: ["GET", "/uploadposts/youtube/analytics/usage", {"na": 1}],
  listYoutubeReportTypes: ["GET", "/uploadposts/youtube/reporting/report-types", {"q": ["user", "page_token", "page_size"], "na": 1}],
  listYoutubeReportingJobs: ["GET", "/uploadposts/youtube/reporting/jobs", {"q": ["user", "page_token", "page_size"], "na": 1}],
  createYoutubeReportingJob: ["POST", "/uploadposts/youtube/reporting/jobs", {"b": ["user", "report_type_id", "name"], "na": 1}],
  getYoutubeReportingJob: ["GET", "/uploadposts/youtube/reporting/jobs/{job_id}", {"q": ["user"], "na": 1}],
  deleteYoutubeReportingJob: ["DELETE", "/uploadposts/youtube/reporting/jobs/{job_id}", {"b": ["user", "confirm"], "na": 1}],
  listYoutubeReports: ["GET", "/uploadposts/youtube/reporting/jobs/{job_id}/reports", {"q": ["user", "created_after", "start_time_at_or_after", "start_time_before", "page_token", "page_size"], "na": 1}],
  getYoutubeReport: ["GET", "/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}", {"q": ["user"], "na": 1}],
  downloadYoutubeReport: ["GET", "/uploadposts/youtube/reporting/jobs/{job_id}/reports/{report_id}/download", {"q": ["user"], "raw": "text", "na": 1}],
  getYoutubePush: ["GET", "/uploadposts/youtube/push", {"q": ["user"], "na": 1}],
  enableYoutubePush: ["POST", "/uploadposts/youtube/push", {"b": ["user"], "na": 1}],
  disableYoutubePush: ["DELETE", "/uploadposts/youtube/push", {"b": ["user"], "na": 1}],
  getInstagramPublishingLimit: ["GET", "/uploadposts/instagram/publishing_limit", {"q": ["profile", "refresh"]}],
  getThreadsPublishingLimit: ["GET", "/uploadposts/threads/publishing_limit", {"q": ["user", "profile", "refresh"]}],
  listPinterestBoardSections: ["GET", "/uploadposts/pinterest/boards/{board_id}/sections", {"q": ["profile"]}],
  createPinterestBoardSection: ["POST", "/uploadposts/pinterest/boards/{board_id}/sections", {"q": ["profile", "user"], "b": ["user", "name", "profile"]}],
  getFacebookPageInfo: ["GET", "/uploadposts/facebook/page-info", {"q": ["user", "page_id"]}],
  updateFacebookPageInfo: ["PATCH", "/uploadposts/facebook/page-info", {"b": ["user", "page_id", "validate_only", "about", "description", "website", "phone", "emails", "hours", "picture_url", "cover_url"]}],
  listRedditSubreddits: ["GET", "/uploadposts/reddit/subreddits", {"q": ["profile"]}],
  getRedditPostTypes: ["GET", "/uploadposts/reddit/post-types", {"q": ["profile", "subreddit"]}],
  listRedditFlairs: ["GET", "/uploadposts/reddit/flairs", {"q": ["profile", "subreddit"]}],
  getUserProfile: ["GET", "/uploadposts/users/{username}", {}],
  renameUserProfile: ["PATCH", "/uploadposts/users/{username}", {"b": ["display_name"]}],
  disconnectSocialAccount: ["DELETE", "/uploadposts/users/social", {"b": ["profile_username", "social_platform"]}],
  connectDiscordCredentials: ["POST", "/uploadposts/users/discord/credentials", {"b": ["profile_username", "webhook_url", "name"]}],
  connectTelegramCredentials: ["POST", "/uploadposts/users/telegram/credentials", {"b": ["profile_username", "bot_token", "chat_id", "receive_updates", "replace_existing_webhook", "forward_url", "auto_answer_callbacks", "extra_updates", "name"]}],
  connectSlackCredentials: ["POST", "/uploadposts/users/slack/credentials", {"b": ["profile_username", "webhook_url", "name"]}],
  connectMastodonCredentials: ["POST", "/uploadposts/users/mastodon/credentials", {"b": ["profile_username", "instance_url", "access_token", "name"]}],
  connectNostrCredentials: ["POST", "/uploadposts/users/nostr/credentials", {"b": ["profile_username", "private_key", "relays", "name"]}],
  connectLemmyCredentials: ["POST", "/uploadposts/users/lemmy/credentials", {"b": ["profile_username", "instance_url", "username", "password", "community", "name"]}],
  connectDevtoCredentials: ["POST", "/uploadposts/users/devto/credentials", {"b": ["profile_username", "api_key", "name"]}],
  connectHashnodeCredentials: ["POST", "/uploadposts/users/hashnode/credentials", {"b": ["profile_username", "pat", "publication_id", "name"]}],
  connectWordpressCredentials: ["POST", "/uploadposts/users/wordpress/credentials", {"b": ["profile_username", "site_url", "username", "application_password", "name"]}],
  connectWhopCredentials: ["POST", "/uploadposts/users/whop/credentials", {"b": ["profile_username", "api_key", "experience_id", "name"]}],
  connectListmonkCredentials: ["POST", "/uploadposts/users/listmonk/credentials", {"b": ["profile_username", "instance_url", "username", "password", "list_id", "name"]}],
  listFacebookPageChoices: ["GET", "/uploadposts/users/facebook-page", {"q": ["profile_username"]}],
  setFacebookPage: ["POST", "/uploadposts/users/facebook-page", {"b": ["profile_username", "facebook_page_id"]}],
  clearFacebookPage: ["DELETE", "/uploadposts/users/facebook-page", {"b": ["profile_username"]}],
  listLinkedinPageChoices: ["GET", "/uploadposts/users/linkedin-page", {"q": ["profile_username"]}],
  setLinkedinPage: ["POST", "/uploadposts/users/linkedin-page", {"b": ["profile_username", "linkedin_page_id"]}],
  clearLinkedinPage: ["DELETE", "/uploadposts/users/linkedin-page", {"b": ["profile_username"]}],
  connectBlueskyCredentials: ["POST", "/uploadposts/users/bluesky/credentials", {"b": ["profile_username", "handle", "password"]}],
  setYoutubeOauthClient: ["POST", "/uploadposts/users/youtube/credentials", {"b": ["profile_username", "client_id", "client_secret"]}],
  getCurrentUser: ["GET", "/uploadposts/me", {}],
  startOauthConnection: ["POST", "/uploadposts/oauth/{platform}/start", {"b": ["profile", "redirect_url"]}],
  createFfmpegJob: ["POST", "/uploadposts/ffmpeg/jobs/upload", {"b": ["files", "full_command", "output_extension", "publish", "file", "file1", "file2"], "f": ["file", "file1", "file2"]}],
  getFfmpegJobStatus: ["GET", "/uploadposts/ffmpeg/jobs/{job_id}", {}],
  downloadFfmpegResult: ["GET", "/uploadposts/ffmpeg/jobs/{job_id}/download", {"raw": "binary"}],
  getFfmpegConsumption: ["GET", "/uploadposts/ffmpeg/consumption", {}],
  listWebhookSubscriptions: ["GET", "/uploadposts/webhooks/subscriptions", {"q": ["status", "source", "url"], "na": 1}],
  createWebhookSubscription: ["POST", "/uploadposts/webhooks/subscriptions", {"b": ["url", "events", "profile_username", "source", "name"], "na": 1}],
  getWebhookSubscription: ["GET", "/uploadposts/webhooks/subscriptions/{subscription_id}", {"na": 1}],
  deleteWebhookSubscription: ["DELETE", "/uploadposts/webhooks/subscriptions/{subscription_id}", {"na": 1}],
  testWebhookSubscription: ["POST", "/uploadposts/webhooks/subscriptions/{subscription_id}/test", {"b": ["event"], "na": 1}],
  deleteCommentPost: ["POST", "/uploadposts/comments/delete", {"b": ["platform", "user", "comment_id", "post_id"]}],
  deleteBlueskyChatAccount: ["POST", "/uploadposts/dms/bluesky/account/delete", {"b": ["user", "confirm", "confirm_handle"], "na": 1}],
  listBlueskyMutualGroups: ["GET", "/uploadposts/dms/bluesky/groups", {"q": ["user", "subject", "limit", "cursor"], "na": 1}],
  createBlueskyGroup: ["POST", "/uploadposts/dms/bluesky/groups", {"b": ["user", "name", "members", "idempotency_key"], "na": 1}],
  editBlueskyGroup: ["PATCH", "/uploadposts/dms/bluesky/groups/{conversation_id}", {"b": ["user", "name", "locked"], "na": 1}],
  listBlueskyGroupMembers: ["GET", "/uploadposts/dms/bluesky/groups/{conversation_id}/members", {"q": ["user"], "na": 1}],
  addBlueskyGroupMembers: ["POST", "/uploadposts/dms/bluesky/groups/{conversation_id}/members", {"b": ["user", "members"], "na": 1}],
  removeBlueskyGroupMembers: ["DELETE", "/uploadposts/dms/bluesky/groups/{conversation_id}/members", {"b": ["user", "members"], "na": 1}],
  manageBlueskyJoinLink: ["POST", "/uploadposts/dms/bluesky/groups/{conversation_id}/join-link", {"b": ["user", "action", "require_approval", "join_rule"], "na": 1}],
  listBlueskyJoinRequests: ["GET", "/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests", {"q": ["user"], "na": 1}],
  answerBlueskyJoinRequest: ["POST", "/uploadposts/dms/bluesky/groups/{conversation_id}/join-requests", {"b": ["user", "action", "member"], "na": 1}],
  previewBlueskyJoinLinks: ["GET", "/uploadposts/dms/bluesky/join-links", {"q": ["user", "codes"], "na": 1}],
  joinBlueskyGroup: ["POST", "/uploadposts/dms/bluesky/join-links", {"b": ["user", "code"], "na": 1}],
  downloadDmMedia: ["GET", "/uploadposts/dms/media", {"q": ["platform", "user", "media_id"], "raw": "binary"}],
  blueskyGraphAction: ["POST", "/uploadposts/bluesky/graph", {"b": ["user", "action", "actor", "list", "post_id", "only_reposts", "only_quoteposts"], "na": 1}],
  listBlueskyLists: ["GET", "/uploadposts/bluesky/lists", {"q": ["user", "purposes", "cursor"], "na": 1}],
  createBlueskyList: ["POST", "/uploadposts/bluesky/lists", {"b": ["user", "name", "purpose", "description", "avatar", "avatar_url", "remove_avatar"], "f": ["avatar"], "na": 1}],
  getBlueskyList: ["GET", "/uploadposts/bluesky/lists/{list_id}", {"q": ["user"], "na": 1}],
  updateBlueskyList: ["PATCH", "/uploadposts/bluesky/lists/{list_id}", {"b": ["user", "name", "purpose", "description", "avatar", "avatar_url", "remove_avatar"], "f": ["avatar"], "na": 1}],
  deleteBlueskyList: ["DELETE", "/uploadposts/bluesky/lists/{list_id}", {"b": ["user", "confirm"], "na": 1}],
  listBlueskyListMembers: ["GET", "/uploadposts/bluesky/lists/{list_id}/members", {"q": ["user"], "na": 1}],
  addBlueskyListMember: ["POST", "/uploadposts/bluesky/lists/{list_id}/members", {"b": ["user", "actor"], "na": 1}],
  removeBlueskyListMember: ["DELETE", "/uploadposts/bluesky/lists/{list_id}/members", {"b": ["user", "actor"], "na": 1}],
  optOutBlueskyList: ["POST", "/uploadposts/bluesky/lists/opt-out", {"b": ["user", "list"], "na": 1}],
  removeOptOutBlueskyList: ["DELETE", "/uploadposts/bluesky/lists/opt-out", {"b": ["user", "list"], "na": 1}],
  listBlueskyStarterPacks: ["GET", "/uploadposts/bluesky/starter-packs", {"q": ["user"], "na": 1}],
  createBlueskyStarterPack: ["POST", "/uploadposts/bluesky/starter-packs", {"b": ["user", "name", "description", "feeds", "list", "members"], "na": 1}],
  getBlueskyStarterPack: ["GET", "/uploadposts/bluesky/starter-packs/{pack_id}", {"q": ["user"], "na": 1}],
  updateBlueskyStarterPack: ["PATCH", "/uploadposts/bluesky/starter-packs/{pack_id}", {"b": ["user", "name", "description", "feeds", "list", "members"], "na": 1}],
  deleteBlueskyStarterPack: ["DELETE", "/uploadposts/bluesky/starter-packs/{pack_id}", {"b": ["user", "confirm", "delete_list"], "na": 1}],
  listBlueskyFeeds: ["GET", "/uploadposts/bluesky/feeds", {"q": ["user"], "na": 1}],
  createBlueskyFeed: ["POST", "/uploadposts/bluesky/feeds", {"b": ["user", "rkey", "did", "display_name", "description", "avatar", "accepts_interactions", "content_mode"], "f": ["avatar"], "na": 1}],
  updateBlueskyFeed: ["PATCH", "/uploadposts/bluesky/feeds/{rkey}", {"b": ["user", "did", "display_name", "description", "avatar", "accepts_interactions", "content_mode"], "f": ["avatar"], "na": 1}],
  deleteBlueskyFeed: ["DELETE", "/uploadposts/bluesky/feeds/{rkey}", {"b": ["user", "confirm"], "na": 1}],
  reportOnBluesky: ["POST", "/uploadposts/bluesky/report", {"b": ["user", "post_id", "actor", "reason_type", "reason", "confirm"], "na": 1}],
  listPostApprovals: ["GET", "/uploadposts/approvals", {"q": ["status", "profile_username", "author", "limit", "before", "count_only"], "na": 1}],
  getPostApproval: ["GET", "/uploadposts/approvals/{approval_id}", {"na": 1}],
  editPostApproval: ["PATCH", "/uploadposts/approvals/{approval_id}", {"b": ["title", "caption", "description", "platform_content", "fields", "scheduled_date", "timezone", "cover_image_base64", "remove_cover"], "na": 1}],
  withdrawPostApproval: ["DELETE", "/uploadposts/approvals/{approval_id}", {"na": 1}],
  approvePostApproval: ["POST", "/uploadposts/approvals/{approval_id}/approve", {"b": ["version", "comment", "scheduled_date", "timezone", "publish_now"], "na": 1}],
  rejectPostApproval: ["POST", "/uploadposts/approvals/{approval_id}/reject", {"b": ["comment"], "na": 1}],
  listClientPostApprovals: ["GET", "/uploadposts/approvals/client", {"bearer": 1, "na": 1}],
  approveClientPostApproval: ["POST", "/uploadposts/approvals/client/{approval_id}/approve", {"b": ["version", "comment"], "bearer": 1, "na": 1}],
  rejectClientPostApproval: ["POST", "/uploadposts/approvals/client/{approval_id}/reject", {"b": ["comment"], "bearer": 1, "na": 1}],
  getTeamRoles: ["GET", "/uploadposts/teams/roles", {}],
  listTeamAudit: ["GET", "/uploadposts/teams/audit", {"q": ["actor", "action", "profile_username", "target_id", "since", "until", "limit", "cursor"]}],
  sendFeedback: ["POST", "/uploadposts/feedback", {"b": ["message", "category", "endpoint", "request_id", "agent"]}],
  updateGoogleBusinessAccount: ["PATCH", "/uploadposts/google-business/accounts", {"b": ["user", "account", "account_name", "validate_only", "confirm"], "na": 1}],
  createGoogleBusinessAdmin: ["POST", "/uploadposts/google-business/admins", {"b": ["user", "scope", "account", "location_id", "admin", "admin_account", "role", "confirm"], "na": 1}],
  updateGoogleBusinessAdmin: ["PATCH", "/uploadposts/google-business/admins", {"b": ["user", "admin_name", "role", "confirm"], "na": 1}],
  deleteGoogleBusinessAdmin: ["DELETE", "/uploadposts/google-business/admins", {"b": ["user", "admin_name", "confirm"], "na": 1}],
  acceptGoogleBusinessInvitation: ["POST", "/uploadposts/google-business/invitations/accept", {"b": ["user", "invitation", "confirm"], "na": 1}],
  declineGoogleBusinessInvitation: ["POST", "/uploadposts/google-business/invitations/decline", {"b": ["user", "invitation", "confirm"], "na": 1}],
  transferGoogleBusinessLocation: ["POST", "/uploadposts/google-business/locations/transfer", {"b": ["user", "location_id", "destination_account", "confirm"], "na": 1}],
  createGoogleBusinessLocation: ["POST", "/uploadposts/google-business/locations/create", {"b": ["user", "account", "location", "language_code", "title", "primary_category", "request_id", "dry_run", "confirm"], "na": 1}],
  deleteGoogleBusinessLocation: ["DELETE", "/uploadposts/google-business/locations/delete", {"b": ["user", "location_id", "confirm"], "na": 1}],
  getGoogleBusinessNotificationSettings: ["GET", "/uploadposts/google-business/notifications", {"q": ["user", "account"], "na": 1}],
  updateGoogleBusinessNotificationSettings: ["PUT", "/uploadposts/google-business/notifications", {"b": ["user", "account", "enabled", "types", "confirm", "force", "confirm_other_tool"], "na": 1}],
  startGoogleBusinessVerification: ["POST", "/uploadposts/google-business/verification/start", {"b": ["user", "location_id", "method", "phone_number", "email_address", "mailer_contact", "trusted_partner_token", "token", "language_code", "context", "confirm"], "na": 1}],
  completeGoogleBusinessVerification: ["POST", "/uploadposts/google-business/verification/complete", {"b": ["user", "location_id", "verification_name", "verification_id", "pin"], "na": 1}],
  generateGoogleBusinessVerificationToken: ["POST", "/uploadposts/google-business/verification/token", {"b": ["user", "location_id"], "na": 1}],
  connectChatgptAdsAccount: ["POST", "/uploadposts/ads/chatgpt/connect", {"b": ["api_key", "profile_username", "name", "default"]}],
  listChatgptAdsAccounts: ["GET", "/uploadposts/ads/chatgpt/accounts", {}],
  disconnectChatgptAdsAccount: ["DELETE", "/uploadposts/ads/chatgpt/accounts/{ad_account_id}", {"q": ["profile_username"]}],
  getChatgptAdsAccount: ["GET", "/uploadposts/ads/chatgpt/account", {"q": ["ad_account_id", "profile_username"]}],
  listChatgptAdsCampaigns: ["GET", "/uploadposts/ads/chatgpt/campaigns", {"q": ["limit", "after", "before", "order", "ad_account_id", "profile_username"]}],
  createChatgptAdsCampaign: ["POST", "/uploadposts/ads/chatgpt/campaigns", {"q": ["ad_account_id", "profile_username"], "b": ["name", "budget", "budget_micros", "status", "description", "start_time", "end_time", "bidding_type", "conversion_event_setting_ids", "mode", "product_feed_id", "locations", "custom_audience_ids", "excluded_custom_audience_ids", "targeting", "ad_account_id", "profile_username"]}],
  getChatgptAdsCampaign: ["GET", "/uploadposts/ads/chatgpt/campaigns/{campaign_id}", {"q": ["ad_account_id", "profile_username"]}],
  updateChatgptAdsCampaign: ["POST", "/uploadposts/ads/chatgpt/campaigns/{campaign_id}", {"q": ["ad_account_id", "profile_username"], "b": ["name", "budget", "budget_micros", "status", "description", "start_time", "end_time", "locations", "custom_audience_ids", "excluded_custom_audience_ids", "targeting", "ad_account_id", "profile_username"]}],
  activateChatgptAdsCampaign: ["POST", "/uploadposts/ads/chatgpt/campaigns/{campaign_id}/activate", {"q": ["ad_account_id", "profile_username"]}],
  pauseChatgptAdsCampaign: ["POST", "/uploadposts/ads/chatgpt/campaigns/{campaign_id}/pause", {"q": ["ad_account_id", "profile_username"]}],
  archiveChatgptAdsCampaign: ["POST", "/uploadposts/ads/chatgpt/campaigns/{campaign_id}/archive", {"q": ["ad_account_id", "profile_username"]}],
  getChatgptAdsCampaignInsights: ["GET", "/uploadposts/ads/chatgpt/campaigns/{campaign_id}/insights", {"q": ["since", "until", "time_granularity", "aggregation_level", "fields", "segments", "filters", "sort", "time_ranges", "limit", "after", "before", "ad_account_id", "profile_username"]}],
  listChatgptAdsAdGroups: ["GET", "/uploadposts/ads/chatgpt/adgroups", {"q": ["campaign_id", "limit", "after", "before", "order", "ad_account_id", "profile_username"]}],
  createChatgptAdsAdGroup: ["POST", "/uploadposts/ads/chatgpt/adgroups", {"q": ["ad_account_id", "profile_username"], "b": ["campaign_id", "name", "max_bid", "max_bid_micros", "billing_event_type", "bidding_config", "status", "description", "context_hints", "product_set", "ad_account_id", "profile_username"]}],
  getChatgptAdsAdGroup: ["GET", "/uploadposts/ads/chatgpt/adgroups/{ad_group_id}", {"q": ["ad_account_id", "profile_username"]}],
  updateChatgptAdsAdGroup: ["POST", "/uploadposts/ads/chatgpt/adgroups/{ad_group_id}", {"q": ["ad_account_id", "profile_username"], "b": ["name", "max_bid", "max_bid_micros", "billing_event_type", "bidding_config", "status", "description", "context_hints", "product_set", "ad_account_id", "profile_username"]}],
  activateChatgptAdsAdGroup: ["POST", "/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/activate", {"q": ["ad_account_id", "profile_username"]}],
  pauseChatgptAdsAdGroup: ["POST", "/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/pause", {"q": ["ad_account_id", "profile_username"]}],
  archiveChatgptAdsAdGroup: ["POST", "/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/archive", {"q": ["ad_account_id", "profile_username"]}],
  getChatgptAdsAdGroupInsights: ["GET", "/uploadposts/ads/chatgpt/adgroups/{ad_group_id}/insights", {"q": ["since", "until", "time_granularity", "aggregation_level", "fields", "segments", "filters", "sort", "time_ranges", "limit", "after", "before", "ad_account_id", "profile_username"]}],
  listChatgptAdsAds: ["GET", "/uploadposts/ads/chatgpt/ads", {"q": ["ad_group_id", "limit", "after", "before", "order", "ad_account_id", "profile_username"]}],
  createChatgptAdsAd: ["POST", "/uploadposts/ads/chatgpt/ads", {"q": ["ad_account_id", "profile_username"], "b": ["ad_group_id", "name", "title", "body", "target_url", "file_id", "price", "type", "status", "creative", "ad_account_id", "profile_username"]}],
  getChatgptAdsAd: ["GET", "/uploadposts/ads/chatgpt/ads/{ad_id}", {"q": ["ad_account_id", "profile_username"]}],
  updateChatgptAdsAd: ["POST", "/uploadposts/ads/chatgpt/ads/{ad_id}", {"q": ["ad_account_id", "profile_username"], "b": ["name", "status", "creative", "ad_account_id", "profile_username"]}],
  activateChatgptAdsAd: ["POST", "/uploadposts/ads/chatgpt/ads/{ad_id}/activate", {"q": ["ad_account_id", "profile_username"]}],
  pauseChatgptAdsAd: ["POST", "/uploadposts/ads/chatgpt/ads/{ad_id}/pause", {"q": ["ad_account_id", "profile_username"]}],
  archiveChatgptAdsAd: ["POST", "/uploadposts/ads/chatgpt/ads/{ad_id}/archive", {"q": ["ad_account_id", "profile_username"]}],
  getChatgptAdsAdInsights: ["GET", "/uploadposts/ads/chatgpt/ads/{ad_id}/insights", {"q": ["since", "until", "time_granularity", "aggregation_level", "fields", "segments", "filters", "sort", "time_ranges", "limit", "after", "before", "ad_account_id", "profile_username"]}],
  previewChatgptAdsAd: ["POST", "/uploadposts/ads/chatgpt/ads/{ad_id}/preview", {"q": ["ad_account_id", "profile_username"]}],
  uploadChatgptAdsCreative: ["POST", "/uploadposts/ads/chatgpt/creatives", {"q": ["ad_account_id", "profile_username"], "b": ["image_url", "ad_account_id", "profile_username", "file"], "f": ["file"]}],
  getChatgptAdsAccountInsights: ["GET", "/uploadposts/ads/chatgpt/insights", {"q": ["since", "until", "time_granularity", "aggregation_level", "fields", "segments", "filters", "sort", "time_ranges", "limit", "after", "before", "ad_account_id", "profile_username"]}],
  promoteChatgptAds: ["POST", "/uploadposts/ads/chatgpt/promote", {"q": ["ad_account_id", "profile_username"], "b": ["title", "body", "target_url", "image_url", "file_id", "budget", "budget_micros", "max_bid", "max_bid_micros", "name", "status", "bidding_type", "billing_event_type", "start_time", "end_time", "description", "conversion_event_setting_ids", "locations", "custom_audience_ids", "excluded_custom_audience_ids", "targeting", "context_hints", "price", "ad_group_name", "ad_name", "ad_account_id", "profile_username"]}],
};
// </openapi:operations>

// Default export for CommonJS compatibility
export default UploadPost;
