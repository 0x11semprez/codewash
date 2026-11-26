// Limits and checks for files attached to a bug report.

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = 'image/*,.txt,.log,.json';

const TEXT_EXTENSIONS = ['.txt', '.log', '.json'];

const isAccepted = (file) =>
    file.type.startsWith('image/') || TEXT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

export const formatBytes = (bytes) =>
    bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Default messages for rejected files. The modal passes translated ones.
export const DEFAULT_FILE_MESSAGES = {
    badType: (name) => `${name}: only images, .txt, .log and .json files are allowed.`,
    tooLarge: (name, limit) => `${name}: larger than ${limit}.`,
    tooMany: (name, max) => `${name}: you can attach up to ${max} files.`,
};

// Adds new files to the current list. Returns the files to keep and one message per rejected file.
export const addFiles = (current, incoming, messages = DEFAULT_FILE_MESSAGES) => {
    const files = [...current];
    const errors = [];
    for (const file of incoming) {
        if (!isAccepted(file)) {
            errors.push(messages.badType(file.name));
        } else if (file.size > MAX_FILE_BYTES) {
            errors.push(messages.tooLarge(file.name, formatBytes(MAX_FILE_BYTES)));
        } else if (files.length >= MAX_FILES) {
            errors.push(messages.tooMany(file.name, MAX_FILES));
        } else {
            files.push(file);
        }
    }
    return { files, errors };
};
