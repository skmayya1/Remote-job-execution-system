export const blacklistedPatterns = [
    /rm\s+-rf\s+/,
    /:(){:|:&};:/, // fork bomb
    /\bshutdown\b/,
    /\breboot\b/,
    /\bwget\b.*http/,
    /\bcurl\b.*http/,
    /\bdd\b/,
    /\bmkfs\b/,
    /\buseradd\b/,
    /\bsudo\b/,
];