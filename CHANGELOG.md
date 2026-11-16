# Changelog

## 2.22.0

The SDK now covers every operation of the Upload-Post OpenAPI spec (467). Only
additions: no existing method changes its name, arguments or result.

### Added

- 180 methods generated from the OpenAPI spec (`codegen/openapi.json`) by
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
  - Methods marked *not generally available* in their docs answer HTTP 503 until
    the feature is switched on for the account.
- `UploadPost.OPENAPI_OPERATIONS`: HTTP method, path and fields of every generated method.
- Upload fields the API accepts and the SDK dropped: `redditTitle`,
  `xExcludeReplyUserIds`, `telegramAllowPaidBroadcast`, `telegramSendTitle`,
  `youtubeThumbnail` (a local file, sent as `thumbnail`), and on `uploadDocument`
  `platforms: ['telegram']` (default still LinkedIn only) with the Telegram options.
- `error.errorType` (the `error_type` of the answer, where the API sends one).

### Tests

- `test/openapi-coverage.test.js`: every operation of the spec has a method and
  each method sends the HTTP method and path of its operation.
- `test/upload-fields.test.js`: the uploads send every form field the spec gives them.
- `.github/workflows/test.yml` runs the tests, the generator check and the type
  check on every push and pull request.
