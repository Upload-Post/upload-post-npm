import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { createReadStream } from 'fs';

/**
 * @typedef {Object} UploadOptions
 * @property {string} title - Video title
 * @property {string} user - User identifier
 * @property {string[]} platforms - Array of platforms (e.g. ['tiktok'])
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
}
