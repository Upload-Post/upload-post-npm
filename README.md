# Upload-Post SDK for Node.js

Official Node.js client for the [Upload-Post API](https://www.upload-post.com) - Cross-platform social media upload.

Upload videos, photos, text posts, and documents to **TikTok, Instagram, YouTube, LinkedIn, Facebook, Pinterest, Threads, Reddit, Bluesky, X (Twitter), Discord, and Telegram** with a single API.

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

- ✅ **Video Upload** - TikTok, Instagram, YouTube, LinkedIn, Facebook, Pinterest, Threads, Bluesky, X, Discord, Telegram
- ✅ **Photo Upload** - TikTok, Instagram, LinkedIn, Facebook, Pinterest, Threads, Reddit, Bluesky, X, Discord, Telegram
- ✅ **Text Posts** - X, LinkedIn, Facebook, Threads, Reddit, Bluesky, Discord, Telegram
- ✅ **Document Upload** - LinkedIn (PDF, PPT, PPTX, DOC, DOCX)
- ✅ **Scheduling** - Schedule posts for later
- ✅ **Posting Queue** - Add posts to your configured queue
- ✅ **First Comments** - Auto-post first comment after publishing
- ✅ **Analytics** - Get engagement metrics
- ✅ **Full TypeScript Support**

## Using this from an AI agent? Use the MCP server instead

If you are wiring Upload-Post into ChatGPT, Claude, Cursor, Claude Code or any
other MCP-compatible agent, you do not need to write a client on top of this
SDK. The official **[Model Context Protocol server](https://github.com/Upload-Post/upload-post-mcp)**
already wraps the whole API as 50 tools the agent can call directly.

```jsonc
// Hosted (OAuth or API key) — nothing to install
{
  "mcpServers": {
    "upload-post": { "url": "https://mcp.upload-post.com/mcp" }
  }
}
```

```jsonc
// Local stdio, built on this SDK
{
  "mcpServers": {
    "upload-post": {
      "command": "npx",
      "args": ["-y", "@upload-post/mcp"],
      "env": { "UPLOAD_POST_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

See the [MCP integration guide](https://docs.upload-post.com/guides/mcp-server-integration).
Keep using this SDK when you are writing your own application code.

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

For scheduled or queued posts, check the status using the job_id:

```javascript
const status = await client.getJobStatus('job_id_from_scheduled_post');
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
  // Optional: force the connection page language for this profile.
  // Supported: 'en' | 'es' | 'de' | 'fr' | 'pt' | 'pl' | 'tr'. When omitted, the
  // page auto-detects the visitor's browser language and falls back to English.
  language: 'es',
  // Optional: override individual connection-page strings. Flat object of i18n
  // dot-path keys to strings. Max 100 entries, keys ^[a-zA-Z0-9_.]+$, values
  // up to 300 chars. Echoed back in the `profile` object of validateJwt.
  uiLabels: {
    'connect.title': 'Link your accounts',
    'connect.subtitle': 'Publish everywhere from one place',
  },
});
```

### Get Analytics

```javascript
const analytics = await client.getAnalytics('my-profile', {
  platforms: ['instagram', 'tiktok'],
});
console.log(analytics);

// Instagram returns two audience breakdowns with the same shape
// ({ age, gender, country, city }):
console.log(analytics.analytics.instagram.follower_demographics);
console.log(analytics.analytics.instagram.engaged_audience_demographics);
```

### Cached Post Analytics

Replays per-post metrics already fetched, instead of calling the platforms again. Only contains posts previously fetched through a live per-post endpoint; there is no background refresh, so captured_at is the last time that post was read live. Not subject to the live
calls, so it is not subject to the live post-analytics rate limit
(100 requests / 5 minutes). Use it to page through a profile's post history.

```javascript
let cursor;
do {
  const page = await client.getCachedPostAnalytics('my-profile', {
    platform: 'youtube',   // optional: instagram, tiktok, youtube, facebook, linkedin, threads, pinterest, reddit
    limit: 50,             // default 50, max 200
    since: '2026-06-01',   // defaults to 30 days ago
    until: '2026-07-01',   // defaults to today
    cursor,
  });
  for (const post of page.posts) {
    console.log(post.platform, post.post_id, post.metrics);
  }
  cursor = page.next_cursor;
} while (cursor);
```

### Get Media

Retrieve recent posts from a connected social account. Supported platforms:
`instagram`, `tiktok`, `youtube`, `linkedin`, `facebook`, `x`, `threads`,
`pinterest`, `bluesky`, `reddit`.

```javascript
const { media } = await client.getMedia('linkedin', 'my-profile');

// Force the personal LinkedIn profile of an account connected as an org admin:
await client.getMedia('linkedin', 'my-profile', { pageUrn: 'me' });

// Target a specific LinkedIn organization page:
await client.getMedia('linkedin', 'my-profile', { pageUrn: '12345' });
```

The response carries a `pagination` object — `{ limit, next_cursor, has_more }`,
with `next_cursor: null` and `has_more: false` on the last page:

```javascript
let cursor;
do {
  const page = await client.getMedia('instagram', 'my-profile', { limit: 50, cursor });
  console.log(page.media.length);
  cursor = page.pagination.next_cursor;
} while (cursor);
```

`limit` defaults to 25 and is clamped to 1-100, with per-platform caps of 20 for
TikTok and 50 for YouTube. **LinkedIn, Discord and Telegram do not support
cursors** — they accept `limit` only, and passing a `cursor` returns HTTP 400.

### Helper Methods

```javascript
// Get Facebook pages for a profile
const fbPages = await client.getFacebookPages('my-profile');

// Get LinkedIn pages for a profile
const liPages = await client.getLinkedinPages('my-profile');

// Get Pinterest boards for a profile
const boards = await client.getPinterestBoards('my-profile');

// TikTok: trending Commercial Music Library tracks
const music = await client.getTiktokTrendingMusic('my-profile', {
  genre: 'POP',
  countryCode: 'ES',
  dateRange: '7DAY', // 1DAY, 7DAY, 30DAY, 90DAY
});

// TikTok: find a track by song or artist
const found = await client.searchTiktokMusic('my-profile', {
  q: 'bad bunny',
  countryCode: 'ES',
});

// TikTok: search locations to tag
const locations = await client.getTiktokLocations('my-profile', 'Madrid');
```

### Comments

The same three methods cover every platform that has comments — Instagram,
Facebook, YouTube, LinkedIn and TikTok:

```javascript
// Read the comments on a post
const { comments } = await client.getPostComments({
  user: 'my-profile',
  platform: 'tiktok',
  postId: '7412345678901234567', // TikTok has no post-URL lookup, pass the video id
  limit: 20,
});

// Comment on the post, or reply to a comment
await client.createComment({
  user: 'my-profile',
  platform: 'tiktok',
  postId: '7412345678901234567',
  message: 'Thanks for watching!',
});

await client.createComment({
  user: 'my-profile',
  platform: 'tiktok',
  commentId: comments[0].id,
  message: 'Glad you liked it',
});

// Delete one
await client.deleteComment({
  user: 'my-profile',
  platform: 'tiktok',
  commentId: comments[0].id,
});
```

You can also have the first comment posted for you right after publishing, with
`firstComment` for every platform or `tiktokFirstComment` for TikTok alone.

On TikTok all of this needs the `comments` capability, which the account grants
when it connects — see
[What a TikTok connection can do](#what-a-tiktok-connection-can-do-capabilities).

#### TikTok replies, hide, like and pin

Replies live in their own call because no other platform models them as a
separate resource:

```javascript
const replies = await client.getTiktokCommentReplies(
  'my-profile', '7412345678901234567', '7412345678909999999', { limit: 20 }
);
console.log(replies.comments, replies.pagination.next_cursor);
```

Hiding, liking and pinning share one method. `postId` is required for `hide` and
`pin`; `like` takes the comment alone:

```javascript
await client.tiktokCommentAction('my-profile', {
  type: 'hide', action: 'HIDE',
  commentId: '7412345678909999999',
  postId: '7412345678901234567',
});

await client.tiktokCommentAction('my-profile', {
  type: 'like', action: 'LIKE',
  commentId: '7412345678909999999',
});

await client.tiktokCommentAction('my-profile', {
  type: 'pin', action: 'UNPIN',
  commentId: '7412345678909999999',
  postId: '7412345678901234567',
});
```

| `type` | `action` | `postId` |
| --- | --- | --- |
| `hide` | `HIDE` / `UNHIDE` | required |
| `like` | `LIKE` / `UNLIKE` | not sent |
| `pin` | `PIN` / `UNPIN` | required |

### TikTok audience insights and discovery

Where the analytics methods answer *how did my posts do*, these answer *who is
my audience* and *what is worth posting about*. All four work on any recent
TikTok connection — the ones that list the `profile_analytics` capability.

```javascript
// Who follows the account, when they are online, what they tap on the profile
const insights = await client.getTiktokInsights('my-profile', {
  startDate: '2026-07-01',
  endDate: '2026-07-30',
});
console.log(insights.audience.countries, insights.audience.ages);
console.log(insights.activity_by_hour, insights.followers_daily);
console.log(insights.profile_actions); // bio link, address, email, phone, leads

// Per-video breakdown: retention curve, impression sources, audience types,
// followers gained and watch times
const videos = await client.getTiktokVideoInsights('my-profile', { limit: 20 });
console.log(videos.videos[0].video_view_retention);
console.log(videos.videos[0].impression_sources);

// Hashtags to pair with a keyword
const { hashtags } = await client.getTiktokHashtags('my-profile', 'pilates', {
  countryCode: 'ES',
  language: 'es',
});
console.log(hashtags); // [{ name, view_count }, ...]

// The account against the average of its category
const { categories } = await client.getTiktokBenchmark('my-profile');
const { benchmark } = await client.getTiktokBenchmark('my-profile', 'SOFTWARE_AND_APPS');
```

The window for `getTiktokInsights()` is at most 60 days and has to end before
today; it defaults to the 30 days ending yesterday. A wider window is trimmed to
what TikTok accepts instead of failing.

Searching what people look for on TikTok is a separate capability,
`trend_search`, which also needs the account to have been reconnected:

```javascript
const { data } = await client.searchTiktokKeywords('my-profile', 'pilates');
console.log(data.search_keywords);
```

## What a TikTok connection can do (`capabilities`)

Not every TikTok connection can do the same things. `listUsers()`
(`GET /api/uploadposts/users`) returns a `capabilities` array on each profile's
TikTok account; check it before offering a feature.

| Capability | What it unlocks |
| --- | --- |
| `music` | `tiktokMusicId` and the volume/trim fields, plus `getTiktokTrendingMusic()` and `searchTiktokMusic()` |
| `location` | `tiktokLocationId` / `tiktokLocationName`, plus `getTiktokLocations()` |
| `cover_image` | `tiktokCoverImageUrl` |
| `cover_timestamp` | `tiktokCoverTimestamp` |
| `draft` | `tiktokUploadToDraft` |
| `video_privacy` | `tiktokPrivacyLevel` on video |
| `photo_privacy` | `tiktokPrivacyLevel` on photo posts |
| `profile_analytics` | `getTiktokInsights()`, `getTiktokVideoInsights()`, `getTiktokHashtags()`, `getTiktokBenchmark()` |
| `comments` | Comments on TikTok: `getPostComments()`, `createComment()`, `deleteComment()`, `getTiktokCommentReplies()`, `tiktokCommentAction()` and `tiktokFirstComment` |
| `trend_search` | `searchTiktokKeywords()` |

> **`comments` and `trend_search` need the account to be reconnected.** TikTok
> grants them at connect time, so an account linked before they existed keeps
> working for everything else but will not list them — reconnect it from Manage
> Users to enable them.

If a connection lacks a capability the upload field is simply ignored: the post
still publishes and the response carries a per-field `warnings` entry. The
methods above answer with an error asking for a reconnection.

## TikTok music, location, cover and drafts

> Needs the `music`, `location`, `cover_image` or `draft` capability — see
> [What a TikTok connection can do](#what-a-tiktok-connection-can-do-capabilities).

```javascript
// 1. Pick a track and a place
const { tracks } = await client.getTiktokTrendingMusic('my-profile', { countryCode: 'ES' });
// ...or find one by name. TikTok has no music search endpoint, so this searches
// the trending charts Upload-Post caches, not TikTok's whole catalogue.
// const { tracks } = await client.searchTiktokMusic('my-profile', { q: 'bossa', countryCode: 'ES' });
const { locations } = await client.getTiktokLocations('my-profile', 'Madrid');

// 2. Publish with them
await client.upload('./video.mp4', {
  title: 'Shot in Madrid',
  user: 'my-profile',
  platforms: ['tiktok'],

  tiktokMusicId: tracks[0].id,
  tiktokMusicVolume: 70,            // 0-100, defaults to 50 when music is set
  tiktokMusicStart: 0,              // ms
  tiktokMusicEnd: 15000,            // ms
  tiktokOriginalSoundVolume: 30,    // 0-100, defaults to 50 so the original audio is not muted

  tiktokLocationId: locations[0].location_id,
  tiktokLocationName: locations[0].location_name, // required together with the id

  tiktokCoverImageUrl: 'https://example.com/cover.jpg',
  tiktokIsAiGenerated: false,
  tiktokUploadToDraft: false,       // true sends it to drafts and ignores the rest
});
```

### Options

| Option | Type | Notes |
| --- | --- | --- |
| `tiktokMusicId` | string | The track `id` from `getTiktokTrendingMusic()` or `searchTiktokMusic()` (not `commercial_music_id`) |
| `tiktokMusicVolume` | number | 0-100. Defaults to 50 when music is set |
| `tiktokMusicStart` | number | Music start offset in ms |
| `tiktokMusicEnd` | number | Music end offset in ms |
| `tiktokOriginalSoundVolume` | number | 0-100. Defaults to 50 when music is set, so the original audio is not muted |
| `tiktokLocationId` | string | `location_id` from `getTiktokLocations()` |
| `tiktokLocationName` | string | Required whenever `tiktokLocationId` is set |
| `tiktokCoverImageUrl` | string | Custom cover image URL |
| `tiktokIsAiGenerated` | boolean | AI-generated content disclosure |
| `tiktokUploadToDraft` | boolean | Publish to drafts; TikTok ignores the rest of the post settings |
| `tiktokPhotoCoverIndex` | number | Cover photo index for photo posts (0-based) |

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

> **Which privacy levels are available is decided by TikTok per account.** A
> private account, for example, is offered `FOLLOWER_OF_CREATOR`,
> `MUTUAL_FOLLOW_FRIENDS` and `SELF_ONLY` and has no `PUBLIC_TO_EVERYONE`.
> Asking for one the account does not have fails with
> `error_code: "tiktok_privacy_unavailable"` and an error listing the ones it
> does have. Omit `tiktokPrivacyLevel` on video and TikTok keeps the account's
> own default; on **photo** posts it defaults to `PUBLIC_TO_EVERYONE`.

See [TikTok music, location, cover and drafts](#tiktok-music-location-cover-and-drafts)
for those options.

### TikTok (Photos)
- `tiktokAutoAddMusic` - Auto add music
- `tiktokPhotoCoverIndex` - Index of photo for cover (0-based)
- `tiktokDisableComment` - Disable comments
- `tiktokPrivacyLevel` - PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, SELF_ONLY (same field and same per-account limits as video)
- `tiktokMusicId` - Commercial Music Library track id (see `getTiktokTrendingMusic`)
- `tiktokLocationId` / `tiktokLocationName` - Location tag, both required together
- `tiktokIsAiGenerated` - AI-generated content disclosure

> TikTok's photo contract takes the music track id alone: `tiktokMusicVolume`,
> `tiktokMusicStart`, `tiktokMusicEnd`, `tiktokOriginalSoundVolume`,
> `tiktokCoverImageUrl` and `tiktokUploadToDraft` are video-only.

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
- `threadsTopicTag` - Topic tag for the Threads post (1-50 characters, no periods or ampersands). One tag per post. Helps increase reach.

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
| `tiktokFirstComment` | First comment for TikTok only (needs the `comments` capability) |
| `altText` | Alt text for accessibility |
| `scheduledDate` | ISO date for scheduling |
| `timezone` | Timezone for scheduled date |
| `addToQueue` | Add to posting queue |
| `maxPostsPerSlot` | Max posts per queue slot (overrides profile setting) |
| `asyncUpload` | Process asynchronously (default: true) |
| `idempotencyKey` | Collapses duplicate uploads within 24h. Reuse the same value when retrying. Alias: `requestId` |

## Google Business Profile

Pass the target location on the upload itself. There is no separate "select a location" call — the API resolves the location per post.

```javascript
const { locations } = await client.getGoogleBusinessLocations('myprofile');

await client.upload('video.mp4', {
  user: 'myprofile',
  platforms: ['google_business'],
  title: 'Now open on Sundays',
  gbpLocationId: locations[0].name,   // "accounts/123/locations/456"
});
```

`gbpLocationId` is **required when the account has more than one location** — the API only auto-selects when exactly one exists. Beyond a standard post you can publish an event or an offer:

```javascript
await client.uploadText({
  user: 'myprofile',
  platforms: ['google_business'],
  title: 'Summer sale',
  gbpLocationId: locations[0].name,
  gbpTopicType: 'OFFER',
  gbpOfferCoupon: 'SUMMER25',
  gbpOfferRedeemUrl: 'https://example.com/redeem',
  gbpOfferTerms: 'One per customer',
});
```

Also available: `gbpTopicType: 'EVENT'` with `gbpEventTitle` / `gbpEventStartDate` / `gbpEventStartTime` / `gbpEventEndDate` / `gbpEventEndTime`, a call-to-action via `gbpCtaType` + `gbpCtaUrl`, and `gbpMediaUrl` / `gbpMediaFormat`.

### Gallery photos

Set `gbpPostType` to publish straight into the location's photo gallery instead of creating a Local Post:

```javascript
await client.uploadPhotos(['storefront.jpg'], {
  user: 'myprofile',
  platforms: ['google_business'],
  gbpLocationId: locations[0].name,
  gbpPostType: 'GALLERY',        // MEDIA | PHOTO | GALLERY
  gbpMediaCategory: 'EXTERIOR',  // defaults to ADDITIONAL
});
```

Omitting `gbpPostType` (or sending any other value) keeps the existing Local Post behaviour. `gbpMediaCategory` accepts `COVER`, `PROFILE`, `LOGO`, `EXTERIOR`, `INTERIOR`, `PRODUCT`, `AT_WORK`, `FOOD_AND_DRINK`, `MENU`, `COMMON_AREA`, `ROOMS`, `TEAMS` and `ADDITIONAL`.

## Retrying an upload safely

An upload that times out may still have been accepted by the API. Retrying it without an idempotency key publishes the post a second time.

Pass the same `idempotencyKey` on every attempt and the API returns the original job instead of creating a new one:

```javascript
import { randomUUID } from 'crypto';

const idempotencyKey = randomUUID();   // generate ONCE, outside the retry loop

for (let attempt = 0; attempt < 3; attempt++) {
  try {
    return await client.upload('video.mp4', { user, platforms: ['tiktok'], title, idempotencyKey });
  } catch (err) {
    if (attempt === 2) throw err;
  }
}
```

Generating the key inside the loop defeats the mechanism: each attempt would look like a new upload.

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
- [MCP Server](https://www.upload-post.com/mcp) — connect ChatGPT, Claude, Cursor and any AI agent ([source](https://github.com/Upload-Post/upload-post-mcp), [npm](https://www.npmjs.com/package/@upload-post/mcp))

## License

MIT

<!-- deployed 2026-03-16 17:49 UTC -->
