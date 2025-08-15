import cheerio from 'cheerio';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';

class SnapchatScraper {
  constructor() {
    // Cache for 5 minutes
    this.cache = new NodeCache({ stdTTL: 300 });
    this.selectors = {
      profile: {
        title: ['meta[property="og:title"]', 'title', 'h1'],
        description: ['meta[property="og:description"]', 'meta[name="description"]'],
        image: ['meta[property="og:image"]', 'img[data-testid="profile-image"]'],
        nextData: ['script#__NEXT_DATA__', 'script[type="application/json"]']
      },
      spotlight: [
        '.SpotlightResultTile_container__NK4Xj',
        '[data-testid="spotlight-tile"]',
        '.spotlight-tile',
        '.tile-container'
      ],
      stories: [
        '.StoryCard',
        '[data-testid="story-card"]', 
        '.story-container'
      ]
    };
  }

  async fetchProfile(username) {
    const cacheKey = `profile:${username}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://www.snapchat.com/@${username}?locale=en-US`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const data = this.parseProfile(html);
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch profile for ${username}:`, error);
      throw new Error(`Profile fetch failed: ${error.message}`);
    }
  }

  parseProfile(html) {
    const $ = cheerio.load(html);
    
    const title = this.findWithFallback($, this.selectors.profile.title, 'content') || 
                  this.findWithFallback($, this.selectors.profile.title, 'text');
    
    const description = this.findWithFallback($, this.selectors.profile.description, 'content');
    
    const image = this.findWithFallback($, this.selectors.profile.image, 'content') ||
                  this.findWithFallback($, this.selectors.profile.image, 'src');

    // Extract subscriber count with multiple fallback strategies
    let subscriberCount = null;
    try {
      const nextDataScript = this.findWithFallback($, this.selectors.profile.nextData, 'text');
      if (nextDataScript) {
        const jsonData = JSON.parse(nextDataScript);
        subscriberCount = this.extractNestedValue(jsonData, [
          'props.pageProps.publicProfile.subscriberCount',
          'props.initialProps.pageProps.profile.subscriberCount',
          'buildId.pageProps.profile.followers'
        ]);
      }
    } catch (e) {
      // Try extracting from text content as fallback
      const bodyText = $('body').text();
      const countMatch = bodyText.match(/(\d+(?:,\d+)*)\s*subscribers?/i);
      if (countMatch) {
        subscriberCount = parseInt(countMatch[1].replace(/,/g, ''));
      }
    }

    return { title, description, image, subscriberCount };
  }

  async fetchTabContent(username, tab) {
    const cacheKey = `tab:${username}:${tab}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`https://www.snapchat.com/@${username}?locale=en-US&tab=${tab}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      const data = this.parseTabContent(html, tab);
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch tab ${tab} for ${username}:`, error);
      return [];
    }
  }

  parseTabContent(html, tab) {
    const $ = cheerio.load(html);
    
    if (tab === 'Spotlight') {
      return this.parseSpotlightTiles($);
    } else if (tab === 'Stories') {
      return this.parseStoryCards($);
    }
    
    return [];
  }

  parseSpotlightTiles($) {
    const tiles = [];
    
    // Try multiple selector strategies
    for (const selector of this.selectors.spotlight) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const tile = this.extractTileData($, el, 'spotlight');
          if (tile.thumbnail || tile.description) {
            tiles.push(tile);
          }
        });
        break; // Stop at first successful selector
      }
    }
    
    return tiles;
  }

  parseStoryCards($) {
    const cards = [];
    
    for (const selector of this.selectors.stories) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const card = this.extractTileData($, el, 'story');
          if (card.thumbnail || card.title) {
            cards.push(card);
          }
        });
        break;
      }
    }
    
    return cards;
  }

  extractTileData($, element, type) {
    const $el = $(element);
    
    // Multiple strategies for finding images
    const thumbnail = $el.find('img').first().attr('src') || 
                     $el.find('[style*="background-image"]').first().css('background-image')?.match(/url\("?([^"]*)"?\)/)?.[1] ||
                     $el.attr('data-thumbnail');

    // Multiple strategies for text content
    const description = $el.find('[class*="description"], [class*="text"], p').first().text().trim() ||
                       $el.text().trim().slice(0, 100);

    const user = $el.find('[class*="profile"], [class*="user"], [class*="author"]').first().text().trim();
    
    const title = type === 'story' ? 
                  $el.find('[class*="title"], [class*="topic"], h1, h2, h3').first().text().trim() :
                  null;

    return { thumbnail, description, user, title };
  }

  findWithFallback($, selectors, attr) {
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        return attr === 'text' ? element.text().trim() : element.attr(attr);
      }
    }
    return null;
  }

  extractNestedValue(obj, paths) {
    for (const path of paths) {
      try {
        const value = path.split('.').reduce((o, key) => o?.[key], obj);
        if (value !== undefined && value !== null) return value;
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await fetch('https://www.snapchat.com/', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default SnapchatScraper;