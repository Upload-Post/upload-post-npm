# Upload-Post SDK for Node.js

Official Node.js client for the [Upload-Post API](https://www.upload-post.com) - Cross-platform social media upload.

Upload videos, photos, text posts, and documents to **TikTok, Instagram, YouTube, LinkedIn, Facebook, Pinterest, Threads, Reddit, Bluesky, and X (Twitter)** with a single API.

## Installation

```bash
npm install upload-post
```

## Quick Start

```javascript
import { UploadPost } from 'upload-post';

const client = new UploadPost('YOUR_API_KEY');

// Upload a video to multiple platforms
const response = await client.upload('./video.mp4', {
  title: 'Check out this awesome video! 🎬',
  user: 'my-profile',
  platforms: ['tiktok', 'instagram', 'youtube']
});

console.log(response);
```

## Features

- ✅ **Video Upload** - TikTok, Instagram, YouTube, LinkedIn, Facebook, Pinterest, Threads, Bluesky, X
- ✅ **Photo Upload** - TikTok, Instagram, LinkedIn, Facebook, Pinterest, Threads, Reddit, Bluesky, X
- ✅ **Text Posts** - X, LinkedIn, Facebook, Threads, Reddit, Bluesky
- ✅ **Document Upload** - LinkedIn (PDF, PPT, PPTX, DOC, DOCX)
- ✅ **Scheduling** - Schedule posts for later
- ✅ **Posting Queue** - Add posts to your configured queue
- ✅ **First Comments** - Auto-post first comment after publishing
- ✅ **Analytics** - Get engagement metrics
- ✅ **Full TypeScript Support**

## API Reference

### Upload Video

```javascript
const response = await client.upload('./video.mp4', {
  title: 'My awesome video',
  user: 'my-profile',
  platforms: ['tiktok', 'instagram', 'youtube'],
  
  // Optional: Schedule for later
  scheduledDate: '2024-12-25T10:00:00Z',
  timezone: 'Europe/Madrid',
  
  // Optional: Add first comment
  firstComment: 'Thanks for watching! 🙏',
  
  // Optional: Platform-specific settings
  tiktokPrivacyLevel: 'PUBLIC_TO_EVERYONE',
  instagramMediaType: 'REELS',
  youtubePrivacyStatus: 'public',
  youtubeTags: ['tutorial', 'coding'],
});
```

### Upload Photos

```javascript
// Upload single or multiple photos
const response = await client.uploadPhotos(
  ['./photo1.jpg', './photo2.jpg', 'https://example.com/photo3.jpg'],
  {
    title: 'Check out these photos! 📸',
    user: 'my-profile',
    platforms: ['instagram', 'facebook', 'x'],
    
    // Optional: Add to queue instead of posting immediately
    addToQueue: true,
    
    // Platform-specific
    instagramMediaType: 'IMAGE', // or 'STORIES'
    facebookPageId: 'your-page-id',
  }
);
```

### Upload Text Posts

```javascript
const response = await client.uploadText({
  title: 'Just shipped a new feature! 🚀 Check it out at example.com',
  user: 'my-profile',
  platforms: ['x', 'linkedin', 'threads'],
  
  // Optional: Create a poll on X
  xPollOptions: ['Option A', 'Option B', 'Option C'],
  xPollDuration: 1440, // 24 hours in minutes
  
  // Optional: Post to a LinkedIn company page
  targetLinkedinPageId: 'company-page-id',
});
```

### Upload Documents (LinkedIn)

```javascript
const response = await client.uploadDocument('./presentation.pdf', {
  title: 'Q4 2024 Report',
  user: 'my-profile',
  description: 'Check out our latest quarterly results!',
  linkedinVisibility: 'PUBLIC',
  targetLinkedinPageId: 'company-page-id', // Optional: post to company page
});
```

### Check Upload Status

For async uploads, check the status using the request_id:

```javascript
const status = await client.getStatus('request_id_from_upload');
console.log(status);
```

### Get Upload History

```javascript
const history = await client.getHistory({ page: 1, limit: 20 });
console.log(history.uploads);
```

### Scheduled Posts

```javascript
// List all scheduled posts
const scheduled = await client.listScheduled();

// Edit a scheduled post
await client.editScheduled('job-id', {
  scheduledDate: '2024-12-26T15:00:00Z',
  timezone: 'America/New_York',
});

// Cancel a scheduled post
await client.cancelScheduled('job-id');
```

### User Management

```javascript
// List all profiles
const users = await client.listUsers();

// Create a new profile
await client.createUser('new-profile');

// Delete a profile
await client.deleteUser('old-profile');

// Generate JWT for platform integration (white-label)
const jwt = await client.generateJwt('my-profile', {
  redirectUrl: 'https://yourapp.com/callback',
  platforms: ['tiktok', 'instagram'],
});
```

### Get Analytics

```javascript
const analytics = await client.getAnalytics('my-profile', {
  platforms: ['instagram', 'tiktok'],
});
console.log(analytics);
```

### Helper Methods

```javascript
// Get Facebook pages for a profile
const fbPages = await client.getFacebookPages('my-profile');

// Get LinkedIn pages for a profile
const liPages = await client.getLinkedinPages('my-profile');

// Get Pinterest boards for a profile
const boards = await client.getPinterestBoards('my-profile');
```

## Platform-Specific Options

### TikTok (Video)
- `tiktokPrivacyLevel` - PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, SELF_ONLY
- `tiktokDisableDuet` - Disable duet
- `tiktokDisableComment` - Disable comments
- `tiktokDisableStitch` - Disable stitch
- `tiktokCoverTimestamp` - Timestamp in ms for cover
- `tiktokIsAigc` - AI-generated content flag
- `tiktokPostMode` - DIRECT_POST or MEDIA_UPLOAD
- `brandContentToggle` - Branded content toggle
- `brandOrganicToggle` - Brand organic toggle

### TikTok (Photos)
- `tiktokAutoAddMusic` - Auto add music
- `tiktokPhotoCoverIndex` - Index of photo for cover (0-based)
- `tiktokDisableComment` - Disable comments

### Instagram
- `instagramMediaType` - REELS, STORIES, IMAGE
- `instagramShareToFeed` - Share to feed (for Reels/Stories)
- `instagramCollaborators` - Comma-separated collaborator usernames
- `instagramCoverUrl` - Custom cover URL
- `instagramAudioName` - Audio track name
- `instagramUserTags` - Comma-separated user tags
- `instagramLocationId` - Location ID
- `instagramThumbOffset` - Thumbnail offset

### YouTube
- `youtubeTags` - Array or comma-separated tags
- `youtubeCategoryId` - Category ID (default: "22" People & Blogs)
- `youtubePrivacyStatus` - public, unlisted, private
- `youtubeEmbeddable` - Allow embedding
- `youtubeLicense` - youtube, creativeCommon
- `youtubePublicStatsViewable` - Show public stats
- `youtubeThumbnailUrl` - Custom thumbnail URL
- `youtubeSelfDeclaredMadeForKids` - Made for kids (COPPA)
- `youtubeContainsSyntheticMedia` - AI/synthetic content flag
- `youtubeDefaultLanguage` - Title/description language (BCP-47)
- `youtubeDefaultAudioLanguage` - Audio language (BCP-47)
- `youtubeAllowedCountries` / `youtubeBlockedCountries` - Country restrictions
- `youtubeHasPaidProductPlacement` - Paid placement flag
- `youtubeRecordingDate` - Recording date (ISO 8601)

### LinkedIn
- `linkedinVisibility` - PUBLIC, CONNECTIONS, LOGGED_IN, CONTAINER
- `targetLinkedinPageId` - Page ID for organization posts

### Facebook
- `facebookPageId` - Facebook Page ID (required)
- `facebookVideoState` - PUBLISHED, DRAFT
- `facebookMediaType` - REELS, STORIES, VIDEO (VIDEO for normal page videos with no 9:16 restriction)
- `thumbnailUrl` - URL for custom video thumbnail (only when facebookMediaType is VIDEO)
- `facebookLinkUrl` - URL for text posts

### Pinterest
- `pinterestBoardId` - Board ID
- `pinterestLink` - Destination link
- `pinterestAltText` - Alt text for photos
- `pinterestCoverImageUrl` - Cover image URL (video)
- `pinterestCoverImageKeyFrameTime` - Key frame time in ms

### X (Twitter)
- `xReplySettings` - everyone, following, mentionedUsers, subscribers, verified
- `xNullcast` - Promoted-only post
- `xTaggedUserIds` - User IDs to tag
- `xPlaceId` / `xGeoPlaceId` - Location place ID
- `xQuoteTweetId` - Tweet ID to quote
- `xPollOptions` - Poll options (2-4)
- `xPollDuration` - Poll duration in minutes (5-10080)
- `xForSuperFollowersOnly` - Exclusive for super followers
- `xCommunityId` - Community ID
- `xShareWithFollowers` - Share community post with followers
- `xCardUri` - Card URI for Twitter Cards
- `xLongTextAsPost` - Post long text as single post
- `xThreadImageLayout` - Comma-separated image layout for thread (e.g. "4,4" or "2,3,1")

### Threads
- `threadsLongTextAsPost` - Post long text as single post (vs thread)
- `threadsThreadMediaLayout` - Comma-separated list of how many media items to include in each Threads post. Each value must be 1-10, and the total must equal the number of files. Example: '5,5' splits 10 items into 2 posts with 5 each. If omitted and more than 10 items are provided, auto-chunks into groups of 10.

### Reddit
- `redditSubreddit` - Subreddit name (without r/)
- `redditFlairId` - Flair template ID

## Common Options

These options work across all upload methods:

| Option | Description |
|--------|-------------|
| `title` | Post title/caption (required) |
| `user` | Profile name (required) |
| `platforms` | Target platforms array (required) |
| `firstComment` | First comment to post |
| `altText` | Alt text for accessibility |
| `scheduledDate` | ISO date for scheduling |
| `timezone` | Timezone for scheduled date |
| `addToQueue` | Add to posting queue |
| `asyncUpload` | Process asynchronously (default: true) |

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { UploadPost, UploadVideoOptions, UploadResponse } from 'upload-post';

const client = new UploadPost('YOUR_API_KEY');

const options: UploadVideoOptions = {
  title: 'My video',
  user: 'my-profile',
  platforms: ['tiktok', 'instagram'],
  tiktokPrivacyLevel: 'PUBLIC_TO_EVERYONE',
};

const response: UploadResponse = await client.upload('./video.mp4', options);
```

## Error Handling

```javascript
try {
  const response = await client.upload('./video.mp4', options);
  console.log('Upload successful:', response);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

## Links

- [Upload-Post Website](https://www.upload-post.com)
- [API Documentation](https://docs.upload-post.com)
- [Dashboard](https://app.upload-post.com)

## License

MIT
