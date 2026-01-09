/**
 * Parses a year string into a numeric year.
 * Handles various formats like "Late 19th", "1923", etc.
 */
export function parseYear(yearStr) {
    if (!yearStr) return 2025;
    yearStr = yearStr.toString().toLowerCase();
    const match = yearStr.match(/(\d{4})/);
    if (match) return parseInt(match[0]);
    if (yearStr.includes('late 19th')) return 1890;
    if (yearStr.includes('mid 19th')) return 1850;
    if (yearStr.includes('early 19th')) return 1810;
    if (yearStr.includes('19th century')) return 1850;
    if (yearStr.includes('early 20th')) return 1910;
    if (yearStr.includes('mid 20th')) return 1950;
    if (yearStr.includes('late 20th')) return 1990;
    if (yearStr.includes('20th century')) return 1950;
    return 2025;
}

/**
 * Normalizes categories for a record (supports both 'category' and 'categories' fields).
 */
export function getCategories(item) {
    if (item.categories && Array.isArray(item.categories)) {
        return item.categories;
    }
    return item.category ? [item.category] : [];
}

/**
 * Converts Wikimedia full-res URLs to 800px thumbnails for better performance.
 */
export function optimizeWikiImage(url) {
    if (!url) return url;
    if (url.indexOf('upload.wikimedia.org') === -1) return url;
    if (url.indexOf('/thumb/') !== -1) return url;

    try {
        const parts = url.split('/');
        const commonsIndex = parts.indexOf('commons');
        if (commonsIndex !== -1) {
            const filename = parts[parts.length - 1];
            // Insert 'thumb' after 'commons'
            parts.splice(commonsIndex + 1, 0, 'thumb');
            // Append the thumbnail specification
            parts.push('800px-' + filename);
            return parts.join('/');
        }
    } catch (e) {
        console.warn('Failed to optimize wiki image:', url);
    }
    return url;
}
