/**
 * API Helper for safe JSON fetching
 * Prevents application crashes when the server returns non-JSON responses (e.g. HTML error pages)
 */

export async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn(`[API] Expected JSON from ${url} but got ${contentType || 'unknown'}:`, text.substring(0, 200));
      return {
        success: false,
        message: 'Server returned an invalid response format. Please check server logs.',
        status: response.status,
        isHtml: true
      };
    }

    const data = await response.json();
    return {
      ...data,
      status: response.status,
      success: data.success ?? (response.status >= 200 && response.status < 300)
    };
  } catch (error) {
    console.error(`[API] Fetch error for ${url}:`, error);
    return {
      success: false,
      message: 'Network connection error. Please check your internet connection.',
      error
    };
  }
}
