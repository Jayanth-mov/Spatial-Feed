const TWEET_URL_PATTERN =
  /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/i

export function extractTweetId(text: string): string | null {
  const match = text.match(TWEET_URL_PATTERN)
  return match ? match[1] : null
}

export function isTweetUrl(text: string): boolean {
  return TWEET_URL_PATTERN.test(text.trim())
}
