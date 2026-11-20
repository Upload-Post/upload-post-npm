# Changelog

## 2.25.0

WhatsApp DMs, fully covered. WhatsApp is open to every account; it is a
messaging channel only (it never publishes posts). Only additions.

### Added

- `uploadDmMedia({ user, file, platform?, type?, pageId?, filename?, contentType? })`:
  multipart upload to `POST /dms/media`; send the answer's `{ type, media_id }` in
  `sendDm` attachments.
- Templates: `listDmTemplates`, `createDmTemplate`, `deleteDmTemplate`
  (`/dms/templates`).
- WhatsApp Business profile: `getWhatsappBusinessProfile`,
  `updateWhatsappBusinessProfile` (optional photo `file`, sent as multipart).
- WhatsApp QR codes / short links: `listWhatsappQrCodes`, `createWhatsappQrCode`,
  `deleteWhatsappQrCode`.

### Changed

- `sendDm` JSDoc and types document every WhatsApp field (attachments with
  `media_id`, `template`, `replyTo`, `location`, `contacts`, reply `buttons`,
  `list`, `ctaUrl`, `header`, `footer`, `reaction`, `senderAction`
  `mark_read`/`typing_on`, `typing`) and the 24-hour window rule. Messenger is
  documented as a limited rollout (`403 messenger_not_enabled`).

## 2.22.0

The SDK now covers every operation of the Upload-Post OpenAPI spec (467). Only
additions: no existing method changes its name, arguments or result.

### Added

- 178 methods generated from the OpenAPI spec (`codegen/openapi.json`) by
  `codegen/generate.py`, with TypeScript types for their options and answers:
  - Webhook subscriptions: `createWebhookSubscription`, `listWebhookSubscriptions`,
    `getWebhookSubscription`, `deleteWebhookSubscription`, `testWebhookSubscription`.
  - Post approvals: `listPostApprovals`, `getPostApproval`, `editPostApproval`,
    `withdrawPostApproval`, `approvePostApproval`, `rejectPostApproval`, and for the
    end client (profile JWT as `token`) `listClientPostApprovals`,
    `approveClientPostApproval`, `rejectClientPostApproval`.
  - Teams: `getTeamRoles`, `listTeamAudit`.
  - ChatGPT Ads (32 methods), FFmpeg jobs (`createFfmpegJob`, `getFfmpegJobStatus`,
    `downloadFfmpegResult`, `getFfmpegConsumption`), Bluesky lists, starter packs,
    feeds and group chats, DM media download, Telegram gifts, payments, business
    account and stories, Google Business admins, invitations, locations,
    notifications and verification, YouTube Analytics, Reporting and push
    notifications, Pinterest boards and sections, Reddit subreddits, flairs and
    post types, Facebook page info, connection of credential-based platforms
    (`connect*Credentials`), Facebook / LinkedIn page pinning,
    `disconnectSocialAccount`, `startOauthConnection`, `getCurrentUser`,
    `getUserProfile`, `renameUserProfile`, scheduled post detail, thumbnail and
    preview, resumable media uploads, `analyzeShorts`, `rewriteCaptions`,
    `sendFeedback`, Instagram / Threads publishing limits.
  - Methods whose operation the spec marks `x-availability: not_generally_available`
    say so in their JSDoc and in the README (generated methods and, in their own
    table, the hand-written ones): they answer an error (usually HTTP 503) until
    the feature is switched on for the account.
  - The six deprecated aliases of the spec (POST/PATCH copies of Google Business
    routes the SDK already calls with the right verb) are left out on purpose.
- `UploadPost.OPENAPI_OPERATIONS`: HTTP method, path and fields of every generated method.
- Upload fields the API accepts and the SDK dropped: `redditTitle`,
  `xExcludeReplyUserIds`, `telegramAllowPaidBroadcast`, `telegramSendTitle`,
  `youtubeThumbnail` (a local file, sent as `thumbnail`), and on `uploadDocument`
  `platforms: ['telegram']` (default still LinkedIn only) with the Telegram options.
- `error.errorType` (the `error_type` of the answer, where the API sends one).
- `firstCommentMedia` is now in the TypeScript types.
- `generateJwt(username, { clientApproval })`: lets the end client approve posts
  from the connect page (post approvals, not generally available yet). It was
  dropped before.
- Types and docs for the new answers: `UploadResponse` gains `pending_approval`,
  `approval_id`, `approval_status` (HTTP 202 for Editors and Contributors),
  team members and shared accounts gain `role` / `profiles`, `getQueueSettings`
  gains `configured`, `validateJwt` gains `profile.client_approval`. README:
  roles and post approvals, and reading Telegram DMs (`getDmConversations`).

### Fixed

- `firstCommentMedia` URLs: the API reads `first_comment_media[]` from uploaded
  files only, so a URL was ignored and the post went out without the images.
  `upload`, `uploadPhotos` and `uploadText` now download each URL (a plain
  request, without the API key) and send it as a file, so code that passed URLs
  gets the images it asked for. A URL that cannot be downloaded fails the
  upload with an error naming it, before anything is sent. Local paths and
  Buffers work as before.

### Tests

- `test/openapi-coverage.test.js`: every operation of the spec has a method and
  each method sends the HTTP method and path of its operation.
- `test/upload-fields.test.js`: the uploads send every form field the spec gives them.
- `test/resource-endpoints.test.js`: `generateJwt` sends every body field of the spec.
- `.github/workflows/test.yml` runs the tests, the generator check and the type
  check on every push and pull request.
