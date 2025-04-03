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
const result = await uploader.upload('/path/to/video.mp4', {
  title: 'My Awesome Video',
  user: 'test-user',
  platforms: ['tiktok'] // Currently supported platforms
});

console.log('Upload successful:', result);
```

## API Documentation

### Constructor
`new UploadPost(apiKey: string)`

### upload()
`upload(videoPath: string, options: UploadOptions): Promise<object>`

#### Options
- `videoPath`: Path to video file (MP4, MOV, AVI, etc.)
- `options.title`: Video title
- `options.user`: User identifier
- `options.platforms`: Array of target platforms (currently supports 'tiktok')

## Error Handling
The library throws errors for:
- Missing required parameters
- File not found
- API request failures
- Invalid platform specifications

## License
MIT
