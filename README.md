# Upload-Post Node.js Client

Official client library for [Upload-Post](https://www.upload-post.com) API - cross-platform social media video upload.

## Features

- 🚀 Simple video upload to multiple platforms
- 🔒 Secure API key authentication
- 📁 Supports all major video formats
- 📝 Automatic form data handling

## Installation

```bash
npm install upload-post
```

## Usage

```javascript
import { UploadPost } from 'upload-post';

const uploader = new UploadPost('your-api-key-here');

// Upload video with options
try {
  const result = await uploader.upload(
    '/path/to/your/local/video.mp4', // or "https://example.com/remote/video.mp4"
    {
      title: 'My Awesome Video',
      user: 'test-user',
      platforms: ['tiktok', 'youtube'],
      // TikTok specific
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_comment: false,
      // YouTube specific
      description: 'This is a great video about coding.',
      tags: ['coding', 'nodejs', 'api'],
      privacyStatus: 'public'
    }
  );
  console.log('Upload successful:', result);
} catch (error) {
  console.error('Upload failed:', error.message);
}

// Example: Upload video from a URL
try {
  const resultFromUrl = await uploader.upload(
    null, // videoPath can be null or undefined if options.video is a URL
    {
      video: "https://example.com/remote/another_video.mp4",
      title: 'Remote Video Fun',
      user: 'test-user-url',
      platforms: ['instagram'],
      media_type: 'REELS',
      share_to_feed: true
    }
  );
  console.log('Upload from URL successful:', resultFromUrl);
} catch (error) {
  console.error('Upload from URL failed:', error.message);
}
```

## API Documentation

### Constructor
`new UploadPost(apiKey: string)`

### upload()
`upload(videoPath: string, options: UploadOptions): Promise<object>`

#### Video Upload Options (`UploadOptions`)
**Common Parameters:**
- `videoPath`: (Required) Path to your local video file (e.g., MP4, MOV) OR a public URL to a video file. If providing a URL, you can also use the `options.video` field.
- `options.title`: (Required) Title of the video.
- `options.user`: (Required) User identifier.
- `options.platforms`: (Required) Array of target platforms (e.g., `['tiktok', 'youtube', 'instagram']`). Supported: `tiktok`, `instagram`, `linkedin`, `youtube`, `facebook`, `x` (Twitter), `threads`, `pinterest`.
- `options.video`: (Optional) Public URL of the video file. Use this if `videoPath` is not a local file.

**Platform-Specific Parameters (all optional):**

-   **TikTok:**
    -   `options.privacy_level`: `'PUBLIC_TO_EVERYONE'`, `'MUTUAL_FOLLOW_FRIENDS'`, `'FOLLOWER_OF_CREATOR'`, or `'SELF_ONLY'`.
    -   `options.disable_duet`: `boolean`.
    -   `options.disable_comment`: `boolean`.
    -   `options.disable_stitch`: `boolean`.
    -   `options.cover_timestamp`: `number` (milliseconds for video cover).
    -   `options.brand_content_toggle`: `boolean`.
    -   `options.brand_organic`: `boolean`.
    -   `options.branded_content`: `boolean`.
    -   `options.brand_organic_toggle`: `boolean`.
    -   `options.is_aigc`: `boolean` (AI-generated content).
-   **Instagram:**
    -   `options.media_type`: `'REELS'` or `'STORIES'`. Default: `'REELS'`.
    -   `options.share_to_feed`: `boolean`.
    -   `options.collaborators`: `string` (comma-separated usernames).
    -   `options.cover_url`: `string` (URL for custom video cover).
    -   `options.audio_name`: `string`.
    -   `options.user_tags`: `string` (comma-separated user tags).
    -   `options.location_id`: `string`.
    -   `options.thumb_offset`: `string` (timestamp offset for thumbnail).
-   **LinkedIn:**
    -   `options.description`: `string` (post commentary, defaults to `title`).
    -   `options.visibility`: `'CONNECTIONS'`, `'PUBLIC'`, `'LOGGED_IN'`, or `'CONTAINER'`. Default: `'PUBLIC'`.
    -   `options.target_linkedin_page_id`: `string` (LinkedIn page ID for organization uploads).
-   **YouTube:**
    -   `options.description`: `string` (video description, defaults to `title`).
    -   `options.tags`: `string[]` (array of tags).
    -   `options.categoryId`: `string` (video category ID, default: `"22"`).
    -   `options.privacyStatus`: `'public'`, `'unlisted'`, or `'private'`. Default: `'public'`.
    -   `options.embeddable`: `boolean`.
    -   `options.license`: `'youtube'` or `'creativeCommon'`.
    -   `options.publicStatsViewable`: `boolean`.
    -   `options.madeForKids`: `boolean`.
-   **Facebook:**
    -   `options.facebook_page_id`: (Required if `facebook` in `platforms`) Facebook Page ID.
    -   `options.description`: `string` (video description, defaults to `title`).
    -   `options.video_state`: `'DRAFT'`, `'PUBLISHED'`, or `'SCHEDULED'`. Default: `'PUBLISHED'`.
-   **Threads:**
    -   `options.description`: `string` (post commentary, defaults to `title`).
-   **X (Twitter):**
    -   `options.tagged_user_ids`: `string[]` (array of user IDs to tag).
    -   `options.reply_settings`: `'following'`, `'mentionedUsers'`, or `'everyone'`.
    -   `options.nullcast`: `boolean` (publish without broadcasting).
    -   `options.place_id`: `string` (location place ID).
    -   `options.poll_duration`: `number` (poll duration in minutes).
    -   `options.poll_options`: `string[]` (array of poll options).
    -   `options.poll_reply_settings`: `'following'`, `'mentionedUsers'`, or `'everyone'` (for poll replies).
-   **Pinterest:**
    -   `options.pinterest_board_id`: (Required if `pinterest` in `platforms`) Pinterest board ID.
    -   `options.pinterest_link`: `string` (destination link for the Pin).
    -   `options.pinterest_cover_image_url`: `string` (URL for cover image).
    -   `options.pinterest_cover_image_content_type`: `string` (e.g., `image/jpeg`).
    -   `options.pinterest_cover_image_data`: `string` (Base64 encoded cover image).
    -   `options.pinterest_cover_image_key_frame_time`: `number` (milliseconds for video frame to use as cover).

### uploadPhotos()
`uploadPhotos(photos: string[], options: UploadPhotosOptions): Promise<object>`

Uploads photos to various social media platforms.

#### Photo Upload Options (`UploadPhotosOptions`)
- `photos`: Array of strings, where each string is a local file path to a photo or a public URL of a photo.
- `options.user`: (Required) User identifier.
- `options.platforms`: (Required) Array of target platforms. Supported: `tiktok`, `instagram`, `linkedin`, `facebook`, `x`, `threads`, `pinterest`.
- `options.title`: (Required) Title of the post.
- `options.caption`: (Optional) Caption/description for the photos. This will be used as the post commentary.

##### Platform-Specific Parameters (Optional unless stated otherwise):

-   **LinkedIn:**
    -   `options.visibility`: `'PUBLIC'` - Visibility setting for the post.
    -   `options.target_linkedin_page_id`: LinkedIn page ID to upload photos to an organization.
-   **Facebook:**
    -   `options.facebook_page_id`: (Required if `facebook` in `platforms`) Facebook Page ID.
-   **TikTok:**
    -   `options.auto_add_music`: `boolean` - Automatically add background music.
    -   `options.disable_comment`: `boolean` - Disable comments.
    -   `options.branded_content`: `boolean` - Indicate branded content (requires `disclose_commercial` to be `true`).
    -   `options.disclose_commercial`: `boolean` - Disclose commercial nature.
    -   `options.photo_cover_index`: `number` - Index (0-based) of the photo to use as cover.
    -   `options.description`: `string` - Description for TikTok (defaults to `title`).
-   **Instagram:**
    -   `options.media_type`: `'IMAGE'` or `'STORIES'` - Type of media. Defaults to `'IMAGE'`.
-   **Pinterest:**
    -   `options.pinterest_board_id`: (Required if `pinterest` in `platforms`) Pinterest board ID.
    -   `options.pinterest_alt_text`: `string` - Alt text for the image.
    -   `options.pinterest_link`: `string` - Destination link for the Pin.

**X (Twitter) and Threads** do not require additional parameters.

#### Example: Uploading Photos

```javascript
import { UploadPost } from 'upload-post';

const uploader = new UploadPost('your-api-key-here');

// Example: Upload photos to Instagram and Facebook
try {
  const photoResult = await uploader.uploadPhotos(
    ['/path/to/your/image1.jpg', 'https://example.com/images/photo2.jpg'],
    {
      user: 'test-user',
      platforms: ['instagram', 'facebook'],
      title: 'My Beautiful Photos',
      caption: 'Check out these amazing shots!',
      facebook_page_id: 'your-facebook-page-id', // Required for Facebook
      media_type: 'IMAGE' // Optional for Instagram
    }
  );
  console.log('Photo upload successful:', photoResult);
} catch (error) {
  console.error('Photo upload failed:', error.message);
}
```

### uploadText()
`uploadText(options: UploadTextOptions): Promise<object>`

Uploads text-only posts to supported social media platforms.

#### Text Upload Options (`UploadTextOptions`)
- `options.user`: (Required) User identifier.
- `options.platforms`: (Required) Array of target platforms. Supported: `'linkedin'`, `'x'` (Twitter), `'facebook'`, `'threads'`.
- `options.title`: (Required) The text content for the post. This field is used as the main content for all specified platforms.

##### Platform-Specific Parameters:
-   **LinkedIn:**
    -   `options.target_linkedin_page_id`: (Optional) LinkedIn page ID to upload text to an organization's page. If not provided, posts to the user's personal profile.
-   **Facebook:**
    -   `options.facebook_page_id`: (Required if `'facebook'` is in `platforms`) Facebook Page ID where the text will be posted.

**X (Twitter) and Threads** use the common `options.title` for the text content and do not require additional specific parameters for text posts.

#### Example: Uploading a Text Post

```javascript
import { UploadPost } from 'upload-post';

const uploader = new UploadPost('your-api-key-here');

// Example: Upload a text post to X (Twitter) and LinkedIn
try {
  const textResult = await uploader.uploadText({
    user: 'test-user',
    platforms: ['x', 'linkedin'],
    title: 'This is my awesome text post for X and LinkedIn!',
    target_linkedin_page_id: 'your-linkedin-org-page-id' // Optional: for LinkedIn organization page
  });
  console.log('Text post successful:', textResult);
} catch (error) {
  console.error('Text post failed:', error.message);
}

// Example: Upload a text post to a Facebook Page
try {
  const fbTextResult = await uploader.uploadText({
    user: 'test-user-fb',
    platforms: ['facebook'],
    title: 'Hello Facebook Page!',
    facebook_page_id: 'your-facebook-page-id' // Required for Facebook
  });
  console.log('Facebook text post successful:', fbTextResult);
} catch (error) {
  console.error('Facebook text post failed:', error.message);
}
```

## Error Handling
The library throws errors for:
- Missing required parameters
- File not found
- API request failures
- Invalid platform specifications

## License
MIT
