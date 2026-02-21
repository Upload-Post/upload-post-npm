import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { createReadStream } from 'fs';

const API_BASE_URL = 'https://api.upload-post.com/api';

/**
 * Upload-Post API client
 * 
 * Supports uploading to: TikTok, Instagram, YouTube, LinkedIn, Facebook, 
 * Pinterest, Threads, Reddit, Bluesky, X (Twitter)
 */
export class UploadPost {
  /**
   * @param {string} apiKey - Your API key from Upload-Post
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Make an API request
   * @private
   */
  async _request(endpoint, method = 'GET', data = null, isFormData = false) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Apikey ${this.apiKey}`
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
      const message = error.response?.data?.message || error.response?.data?.detail || error.message;
      throw new Error(`Upload-Post API error: ${message}`);
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
    if (options.altText) form.append('alt_text', options.altText);
    if (options.scheduledDate) form.append('scheduled_date', options.scheduledDate);
    if (options.timezone) form.append('timezone', options.timezone);
    if (options.addToQueue !== undefined) form.append('add_to_queue', String(options.addToQueue));
    if (options.asyncUpload !== undefined) form.append('async_upload', String(options.asyncUpload));

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
  }

  /**
   * Add TikTok-specific parameters
   * @private
   */
  _addTiktokParams(form, options, isVideo = true) {
    if (options.tiktokDisableComment !== undefined) form.append('disable_comment', String(options.tiktokDisableComment));
    if (options.brandContentToggle !== undefined) form.append('brand_content_toggle', String(options.brandContentToggle));
    if (options.brandOrganicToggle !== undefined) form.append('brand_organic_toggle', String(options.brandOrganicToggle));

    if (isVideo) {
      if (options.tiktokPrivacyLevel) form.append('privacy_level', options.tiktokPrivacyLevel);
      if (options.tiktokDisableDuet !== undefined) form.append('disable_duet', String(options.tiktokDisableDuet));
      if (options.tiktokDisableStitch !== undefined) form.append('disable_stitch', String(options.tiktokDisableStitch));
      if (options.tiktokCoverTimestamp !== undefined) form.append('cover_timestamp', options.tiktokCoverTimestamp);
      if (options.tiktokIsAigc !== undefined) form.append('is_aigc', String(options.tiktokIsAigc));
      if (options.tiktokPostMode) form.append('post_mode', options.tiktokPostMode);
    } else {
      // Photo-specific
      if (options.tiktokAutoAddMusic !== undefined) form.append('auto_add_music', String(options.tiktokAutoAddMusic));
      if (options.tiktokPhotoCoverIndex !== undefined) form.append('photo_cover_index', options.tiktokPhotoCoverIndex);
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

    if (isVideo) {
      if (options.instagramShareToFeed !== undefined) form.append('share_to_feed', String(options.instagramShareToFeed));
      if (options.instagramCoverUrl) form.append('cover_url', options.instagramCoverUrl);
      if (options.instagramAudioName) form.append('audio_name', options.instagramAudioName);
      if (options.instagramThumbOffset) form.append('thumb_offset', options.instagramThumbOffset);
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
  }

  /**
   * Add Facebook-specific parameters
   * @private
   */
  _addFacebookParams(form, options, isVideo = false, isText = false) {
    if (options.facebookPageId) form.append('facebook_page_id', options.facebookPageId);
    
    if (isVideo) {
      if (options.facebookVideoState) form.append('video_state', options.facebookVideoState);
      if (options.facebookMediaType) form.append('facebook_media_type', options.facebookMediaType);
      if (options.thumbnailUrl) form.append('thumbnail_url', options.thumbnailUrl);
    }
    
    if (isText && options.facebookLinkUrl) {
      form.append('facebook_link_url', options.facebookLinkUrl);
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

    if (!isText) {
      if (options.xTaggedUserIds) {
        const ids = Array.isArray(options.xTaggedUserIds) ? options.xTaggedUserIds : options.xTaggedUserIds.split(',').map(t => t.trim());
        ids.forEach(id => form.append('tagged_user_ids[]', id));
      }
      if (options.xPlaceId) form.append('place_id', options.xPlaceId);
      if (options.xThreadImageLayout) form.append('x_thread_image_layout', options.xThreadImageLayout);
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
    }
  }

  /**
   * Add Threads-specific parameters
   * @private
   */
  _addThreadsParams(form, options) {
    if (options.threadsLongTextAsPost !== undefined) form.append('threads_long_text_as_post', String(options.threadsLongTextAsPost));
    if (options.threadsThreadMediaLayout) form.append('threads_thread_media_layout', options.threadsThreadMediaLayout);
  }

  /**
   * Add Reddit-specific parameters
   * @private
   */
  _addRedditParams(form, options) {
    if (options.redditSubreddit) form.append('subreddit', options.redditSubreddit);
    if (options.redditFlairId) form.append('flair_id', options.redditFlairId);
  }

  /**
   * Upload a video to social media platforms
   * 
   * @param {string} videoPathOrUrl - Path to video file or video URL
   * @param {Object} options - Upload options
   * @param {string} options.title - Video title/caption
   * @param {string} options.user - User identifier (profile name)
   * @param {string[]} options.platforms - Target platforms (tiktok, instagram, youtube, linkedin, facebook, pinterest, threads, bluesky, x)
   * @param {string} [options.description] - Video description
   * @param {string} [options.firstComment] - First comment to post
   * @param {string} [options.scheduledDate] - ISO date for scheduling (e.g., "2024-12-25T10:00:00Z")
   * @param {string} [options.timezone] - Timezone for scheduled date (e.g., "Europe/Madrid")
   * @param {boolean} [options.addToQueue] - Add to posting queue instead of immediate post
   * @param {boolean} [options.asyncUpload=true] - Process upload asynchronously
   * 
   * TikTok options:
   * @param {string} [options.tiktokPrivacyLevel] - PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, SELF_ONLY
   * @param {boolean} [options.tiktokDisableDuet] - Disable duet
   * @param {boolean} [options.tiktokDisableComment] - Disable comments
   * @param {boolean} [options.tiktokDisableStitch] - Disable stitch
   * @param {number} [options.tiktokCoverTimestamp] - Timestamp in ms for video cover
   * @param {boolean} [options.tiktokIsAigc] - AI-generated content flag
   * @param {string} [options.tiktokPostMode] - DIRECT_POST or MEDIA_UPLOAD
   * @param {boolean} [options.brandContentToggle] - Branded content toggle
   * @param {boolean} [options.brandOrganicToggle] - Brand organic toggle
   * 
   * Instagram options:
   * @param {string} [options.instagramMediaType] - REELS or STORIES
   * @param {boolean} [options.instagramShareToFeed] - Share to feed
   * @param {string} [options.instagramCollaborators] - Comma-separated collaborator usernames
   * @param {string} [options.instagramCoverUrl] - Custom cover URL
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
   *
   * @returns {Promise<Object>} API response with request_id for async uploads
   */
  async upload(videoPathOrUrl, options) {
    const form = new FormData();

    // Handle video (file path or URL)
    if (videoPathOrUrl.toLowerCase().startsWith('http://') || videoPathOrUrl.toLowerCase().startsWith('https://')) {
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

    return this._request('/upload', 'POST', form, true);
  }

  /**
   * Upload photos to social media platforms
   * 
   * @param {string[]} photosPathsOrUrls - Array of photo file paths or URLs
   * @param {Object} options - Upload options
   * @param {string} options.title - Post title/caption
   * @param {string} options.user - User identifier (profile name)
   * @param {string[]} options.platforms - Target platforms (tiktok, instagram, linkedin, facebook, x, threads, pinterest, reddit, bluesky)
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
   * @param {number} [options.tiktokPhotoCoverIndex] - Index of photo for cover (0-based)
   * @param {boolean} [options.brandContentToggle] - Branded content toggle
   * @param {boolean} [options.brandOrganicToggle] - Brand organic toggle
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
   *
   * Reddit options:
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

    return this._request('/upload_photos', 'POST', form, true);
  }

  /**
   * Upload text posts to social media platforms
   * 
   * @param {Object} options - Upload options
   * @param {string} options.title - Text content for the post
   * @param {string} options.user - User identifier (profile name)
   * @param {string[]} options.platforms - Target platforms (x, linkedin, facebook, threads, reddit, bluesky)
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
   *
   * Reddit options:
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
    if (platforms.includes('reddit')) this._addRedditParams(form, options);
    if (platforms.includes('bluesky') && (options.blueskyLinkUrl || options.linkUrl)) {
      form.append('bluesky_link_url', options.blueskyLinkUrl || options.linkUrl);
    }

    return this._request('/upload_text', 'POST', form, true);
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
   * 
   * @returns {Promise<Object>} API response
   */
  async uploadDocument(documentPathOrUrl, options) {
    const form = new FormData();

    // Handle document (file path or URL)
    if (documentPathOrUrl.toLowerCase().startsWith('http://') || documentPathOrUrl.toLowerCase().startsWith('https://')) {
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
    if (options.asyncUpload !== undefined) form.append('async_upload', String(options.asyncUpload));

    this._addLinkedinParams(form, options);

    return this._request('/upload_document', 'POST', form, true);
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
   * @param {string} [options.pageUrn] - LinkedIn page URN (defaults to "me" for personal profile)
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
   * @param {string} requestId - The request_id from the upload
   * @returns {Promise<Object>} Post analytics with per-platform metrics
   */
  async getPostAnalytics(requestId) {
    return this._request(`/uploadposts/post-analytics/${encodeURIComponent(requestId)}`, 'GET');
  }

  /**
   * Get available metrics configuration for all supported platforms
   *
   * @returns {Promise<Object>} Platform metrics config (primary fields, available metrics, labels)
   */
  async getPlatformMetrics() {
    return this._request('/uploadposts/platform-metrics', 'GET');
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
   * @returns {Promise<Object>} Edit result
   */
  async editScheduled(jobId, options) {
    const body = {};
    if (options.scheduledDate) body.scheduled_date = options.scheduledDate;
    if (options.timezone) body.timezone = options.timezone;
    return this._request(`/uploadposts/schedule/${jobId}`, 'POST', body);
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
    return this._request('/uploadposts/users/generate-jwt', 'POST', body);
  }

  /**
   * Validate a JWT token
   * 
   * @param {string} jwt - JWT token to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateJwt(jwt) {
    return this._request('/uploadposts/users/validate-jwt', 'POST', { jwt });
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
   * Get Pinterest boards for a profile
   * 
   * @param {string} [profile] - Profile username
   * @returns {Promise<Object>} List of Pinterest boards
   */
  async getPinterestBoards(profile) {
    const params = profile ? { profile } : {};
    return this._request('/uploadposts/pinterest/boards', 'GET', params);
  }
}

// Default export for CommonJS compatibility
export default UploadPost;
