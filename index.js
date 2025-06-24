import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { createReadStream } from 'fs';

/**
 * @typedef {Object} UploadOptions
 * @property {string} title - Video title
 * @property {string} user - User identifier
 * @property {string[]} platforms - Array of platforms (e.g. ['tiktok', 'youtube', 'instagram'])
 * @property {string} [video] - The video file to upload (can be a file upload or a video URL) - typically handled by videoPath param.
 *
 * @property {'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'} [privacy_level] - TikTok: Privacy setting
 * @property {boolean} [disable_duet] - TikTok: Disable duet feature
 * @property {boolean} [disable_comment] - TikTok: Disable comments
 * @property {boolean} [disable_stitch] - TikTok: Disable stitch feature
 * @property {number} [cover_timestamp] - TikTok: Timestamp in milliseconds for video cover
 * @property {boolean} [brand_content_toggle] - TikTok: Enable branded content
 * @property {boolean} [brand_organic] - TikTok: Enable organic branded content
 * @property {boolean} [branded_content] - TikTok: Enable branded content with disclosure
 * @property {boolean} [brand_organic_toggle] - TikTok: Enable organic branded content toggle
 * @property {boolean} [is_aigc] - TikTok: Indicates if content is AI-generated
 *
 * @property {'REELS' | 'STORIES'} [media_type] - Instagram: Type of media
 * @property {boolean} [share_to_feed] - Instagram: Whether to share to feed
 * @property {string} [collaborators] - Instagram: Comma-separated list of collaborator usernames
 * @property {string} [cover_url] - Instagram: URL for custom video cover
 * @property {string} [audio_name] - Instagram: Name of the audio track
 * @property {string} [user_tags] - Instagram: Comma-separated list of user tags
 * @property {string} [location_id] - Instagram: Instagram location ID
 * @property {string} [thumb_offset] - Instagram: Timestamp offset for video thumbnail
 *
 * @property {string} [description] - LinkedIn, YouTube, Facebook, Threads: Description or commentary
 * @property {'CONNECTIONS' | 'PUBLIC' | 'LOGGED_IN' | 'CONTAINER'} [visibility] - LinkedIn: Visibility setting
 * @property {string} [target_linkedin_page_id] - LinkedIn: Page ID for organization uploads
 *
 * @property {string[]} [tags] - YouTube: Array of tags
 * @property {string} [categoryId] - YouTube: Video category ID
 * @property {'public' | 'unlisted' | 'private'} [privacyStatus] - YouTube: Privacy setting
 * @property {boolean} [embeddable] - YouTube: Whether video is embeddable
 * @property {'youtube' | 'creativeCommon'} [license] - YouTube: Video license
 * @property {boolean} [publicStatsViewable] - YouTube: Whether public stats are viewable
 * @property {boolean} [madeForKids] - YouTube: Whether video is made for kids
 *
 * @property {string} [facebook_page_id] - Facebook: Page ID
 * @property {'DRAFT' | 'PUBLISHED' | 'SCHEDULED'} [video_state] - Facebook: Desired state of the video
 *
 * @property {string[]} [tagged_user_ids] - X (Twitter): Array of user IDs to tag
 * @property {'following' | 'mentionedUsers' | 'everyone'} [reply_settings] - X (Twitter): Who can reply
 * @property {boolean} [nullcast] - X (Twitter): Whether to publish without broadcasting
 * @property {string} [place_id] - X (Twitter): Location place ID
 * @property {number} [poll_duration] - X (Twitter): Poll duration in minutes
 * @property {string[]} [poll_options] - X (Twitter): Array of poll options
 * @property {'following' | 'mentionedUsers' | 'everyone'} [poll_reply_settings] - X (Twitter): Who can reply to poll
 *
 * @property {string} [pinterest_board_id] - Pinterest: Board ID
 * @property {string} [pinterest_link] - Pinterest: Destination link
 * @property {string} [pinterest_cover_image_url] - Pinterest: URL of an image to use as the video cover
 * @property {string} [pinterest_cover_image_content_type] - Pinterest: Content type of the cover image
 * @property {string} [pinterest_cover_image_data] - Pinterest: Base64 encoded cover image data
 * @property {number} [pinterest_cover_image_key_frame_time] - Pinterest: Time in ms of video frame for cover
 */

/**
 * @typedef {Object} UploadPhotosOptions
 * @property {string} user - User identifier
 * @property {string[]} platforms - Array of target platforms. Supported: tiktok, instagram, linkedin, facebook, x, threads, pinterest
 * @property {string[]} photos - Array of photo file paths or URLs
 * @property {string} title - Title of the post
 * @property {string} [caption] - Caption/description for the photos
 * @property {'PUBLIC'} [visibility] - LinkedIn: Visibility setting ("PUBLIC")
 * @property {string} [target_linkedin_page_id] - LinkedIn: Page ID for organization uploads
 * @property {string} [facebook_page_id] - Facebook: Page ID
 * @property {boolean} [auto_add_music] - TikTok: Automatically add background music
 * @property {boolean} [disable_comment] - TikTok: Disable comments
 * @property {boolean} [branded_content] - TikTok: Branded content (requires disclose_commercial=true)
 * @property {boolean} [disclose_commercial] - TikTok: Disclose commercial nature
 * @property {number} [photo_cover_index] - TikTok: Index of photo for cover
 * @property {string} [description] - TikTok: Description (defaults to title)
 * @property {'IMAGE' | 'STORIES'} [media_type] - Instagram: Media type ("IMAGE" or "STORIES")
 * @property {string} [pinterest_board_id] - Pinterest: Board ID
 * @property {string} [pinterest_alt_text] - Pinterest: Alt text
 * @property {string} [pinterest_link] - Pinterest: Destination link
 */

/**
 * @typedef {Object} UploadTextOptions
 * @property {string} user - User identifier
 * @property {('linkedin' | 'x' | 'facebook' | 'threads')[]} platforms - Array of target platforms.
 * @property {string} title - The text content for the post.
 * @property {string} [target_linkedin_page_id] - LinkedIn: Page ID for organization posts.
 * @property {string} [facebook_page_id] - Facebook: Page ID. Required if 'facebook' is in platforms.
 */

/**
 * Upload-Post API client
 */
export class UploadPost {
  /**
   * @param {string} apiKey - Your API key from Upload-Post
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.upload-post.com/api';
  }

  /**
   * Upload video to social media platforms
   * @param {string} videoPath - Path to video file
   * @param {UploadOptions} options - Upload options
   * @returns {Promise<Object>} API response
   */
  async upload(videoPath, options) {
    const form = new FormData();
    
    form.append('video', createReadStream(videoPath));
    form.append('title', options.title);
    form.append('user', options.user);
    options.platforms.forEach(platform => {
      form.append('platform[]', platform);
    });

    // Add platform-specific parameters if they exist in options
    // TikTok
    if (options.privacy_level) form.append('privacy_level', options.privacy_level);
    if (options.disable_duet !== undefined) form.append('disable_duet', options.disable_duet.toString());
    if (options.disable_comment !== undefined) form.append('disable_comment', options.disable_comment.toString());
    if (options.disable_stitch !== undefined) form.append('disable_stitch', options.disable_stitch.toString());
    if (options.cover_timestamp !== undefined) form.append('cover_timestamp', options.cover_timestamp.toString());
    if (options.brand_content_toggle !== undefined) form.append('brand_content_toggle', options.brand_content_toggle.toString());
    if (options.brand_organic !== undefined) form.append('brand_organic', options.brand_organic.toString());
    if (options.branded_content !== undefined) form.append('branded_content', options.branded_content.toString());
    if (options.brand_organic_toggle !== undefined) form.append('brand_organic_toggle', options.brand_organic_toggle.toString());
    if (options.is_aigc !== undefined) form.append('is_aigc', options.is_aigc.toString());

    // Instagram
    if (options.media_type) form.append('media_type', options.media_type); // Used by photos and videos
    if (options.share_to_feed !== undefined) form.append('share_to_feed', options.share_to_feed.toString());
    if (options.collaborators) form.append('collaborators', options.collaborators);
    if (options.cover_url) form.append('cover_url', options.cover_url);
    if (options.audio_name) form.append('audio_name', options.audio_name);
    if (options.user_tags) form.append('user_tags', options.user_tags);
    if (options.location_id) form.append('location_id', options.location_id);
    if (options.thumb_offset) form.append('thumb_offset', options.thumb_offset);
    
    // LinkedIn
    if (options.description) form.append('description', options.description); // Used by multiple platforms
    if (options.visibility) form.append('visibility', options.visibility); // Used by multiple platforms
    if (options.target_linkedin_page_id) form.append('target_linkedin_page_id', options.target_linkedin_page_id);

    // YouTube
    if (options.tags) options.tags.forEach(tag => form.append('tags[]', tag));
    if (options.categoryId) form.append('categoryId', options.categoryId);
    if (options.privacyStatus) form.append('privacyStatus', options.privacyStatus);
    if (options.embeddable !== undefined) form.append('embeddable', options.embeddable.toString());
    if (options.license) form.append('license', options.license);
    if (options.publicStatsViewable !== undefined) form.append('publicStatsViewable', options.publicStatsViewable.toString());
    if (options.madeForKids !== undefined) form.append('madeForKids', options.madeForKids.toString());

    // Facebook
    if (options.facebook_page_id) form.append('facebook_page_id', options.facebook_page_id);
    if (options.video_state) form.append('video_state', options.video_state);

    // X (Twitter)
    if (options.tagged_user_ids) options.tagged_user_ids.forEach(id => form.append('tagged_user_ids[]', id));
    if (options.reply_settings) form.append('reply_settings', options.reply_settings);
    if (options.nullcast !== undefined) form.append('nullcast', options.nullcast.toString());
    if (options.place_id) form.append('place_id', options.place_id);
    if (options.poll_duration !== undefined) form.append('poll_duration', options.poll_duration.toString());
    if (options.poll_options) options.poll_options.forEach(opt => form.append('poll_options[]', opt));
    if (options.poll_reply_settings) form.append('poll_reply_settings', options.poll_reply_settings);
    
    // Pinterest
    if (options.pinterest_board_id) form.append('pinterest_board_id', options.pinterest_board_id);
    if (options.pinterest_link) form.append('pinterest_link', options.pinterest_link);
    if (options.pinterest_cover_image_url) form.append('pinterest_cover_image_url', options.pinterest_cover_image_url);
    if (options.pinterest_cover_image_content_type) form.append('pinterest_cover_image_content_type', options.pinterest_cover_image_content_type);
    if (options.pinterest_cover_image_data) form.append('pinterest_cover_image_data', options.pinterest_cover_image_data);
    if (options.pinterest_cover_image_key_frame_time !== undefined) form.append('pinterest_cover_image_key_frame_time', options.pinterest_cover_image_key_frame_time.toString());

    // If video is passed as a URL in options.video (as per API docs for URL uploads)
    if (options.video && (options.video.startsWith('http://') || options.video.startsWith('https://'))) {
        form.append('video', options.video);
    }


    try {
      const response = await axios.post(`${this.baseUrl}/upload`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Apikey ${this.apiKey}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return response.data;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload photos to social media platforms
   * @param {string[]} photosPathsOrUrls - Array of photo file paths or URLs
   * @param {UploadPhotosOptions} options - Upload photos options
   * @returns {Promise<Object>} API response
   */
  async uploadPhotos(photosPathsOrUrls, options) {
    const form = new FormData();

    // Common parameters
    form.append('user', options.user);
    form.append('title', options.title);
    if (options.caption) {
      form.append('caption', options.caption);
    }
    options.platforms.forEach(platform => {
      form.append('platform[]', platform);
    });

    photosPathsOrUrls.forEach(photoItem => {
      if (typeof photoItem === 'string' && (photoItem.startsWith('http://') || photoItem.startsWith('https://'))) {
        form.append('photos[]', photoItem); // Pass URL as string
      } else if (typeof photoItem === 'string') {
        if (!fs.existsSync(photoItem)) {
          throw new Error(`Photo file not found: ${photoItem}`);
        }
        form.append('photos[]', createReadStream(photoItem)); // Pass file path as stream
      } else {
        throw new Error(`Invalid photo item: ${photoItem}. Must be a file path or URL string.`);
      }
    });
    
    // Platform-specific parameters
    // LinkedIn
    if (options.visibility) form.append('visibility', options.visibility);
    if (options.target_linkedin_page_id) form.append('target_linkedin_page_id', options.target_linkedin_page_id);
    
    // Facebook
    if (options.facebook_page_id) form.append('facebook_page_id', options.facebook_page_id);

    // TikTok
    if (options.auto_add_music !== undefined) form.append('auto_add_music', options.auto_add_music.toString());
    if (options.disable_comment !== undefined) form.append('disable_comment', options.disable_comment.toString());
    if (options.branded_content !== undefined) form.append('branded_content', options.branded_content.toString());
    if (options.disclose_commercial !== undefined) form.append('disclose_commercial', options.disclose_commercial.toString());
    if (options.photo_cover_index !== undefined) form.append('photo_cover_index', options.photo_cover_index.toString());
    if (options.description) form.append('description', options.description);

    // Instagram
    if (options.media_type) form.append('media_type', options.media_type);

    // Pinterest
    if (options.pinterest_board_id) form.append('pinterest_board_id', options.pinterest_board_id);
    if (options.pinterest_alt_text) form.append('pinterest_alt_text', options.pinterest_alt_text);
    if (options.pinterest_link) form.append('pinterest_link', options.pinterest_link);

    try {
      const response = await axios.post(`${this.baseUrl}/upload_photos`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Apikey ${this.apiKey}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return response.data;
    } catch (error) {
      let errorMessage = `Photo upload failed: ${error.message}`;
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage += ` - ${error.response.data.message}`;
      } else if (error.response && error.response.data && error.response.data.detail) {
         errorMessage += ` - ${error.response.data.detail}`;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload text posts to social media platforms
   * @param {UploadTextOptions} options - Upload text options
   * @returns {Promise<Object>} API response
   */
  async uploadText(options) {
    const form = new FormData();

    // Common parameters
    form.append('user', options.user);
    form.append('title', options.title); // 'title' is used as the text content field for all supported platforms

    options.platforms.forEach(platform => {
      form.append('platform[]', platform);
    });

    // Platform-specific parameters
    // LinkedIn
    if (options.target_linkedin_page_id && options.platforms.includes('linkedin')) {
      form.append('target_linkedin_page_id', options.target_linkedin_page_id);
    }

    // Facebook
    if (options.facebook_page_id && options.platforms.includes('facebook')) {
      form.append('facebook_page_id', options.facebook_page_id);
    }
    // X (Twitter) and Threads use the common 'title' parameter for their text content.

    try {
      const response = await axios.post(`${this.baseUrl}/upload_text`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Apikey ${this.apiKey}`
        },
      });

      if (response.status !== 200) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return response.data;
    } catch (error) {
      let errorMessage = `Text post upload failed: ${error.message}`;
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        } else if (error.response.data.detail) {
          errorMessage += ` - ${error.response.data.detail}`;
        } else {
          errorMessage += ` - ${JSON.stringify(error.response.data)}`;
        }
      }
      throw new Error(errorMessage);
    }
  }
}
