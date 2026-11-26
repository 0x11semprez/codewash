// Limits and checks for files attached to a bug report.

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = 'image/*,.txt,.log,.json';

const TEXT_EXTENSIONS = ['.txt', '.log', '.json'];

const isAccepted = (file) =>
    file.type.startsWith('image/') || TEXT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

export const formatBytes = (bytes) =>
    bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Adds new files to the current list. Returns the files to keep and one message per rejected file.
export const addFiles = (current, incoming) => {
    const files = [...current];
    const errors = [];
    for (const file of incoming) {
        if (!isAccepted(file)) {
            errors.push(`${file.name}: only images, .txt, .log and .json files are allowed.`);
        } else if (file.size > MAX_FILE_BYTES) {
            errors.push(`${file.name}: larger than ${formatBytes(MAX_FILE_BYTES)}.`);
        } else if (files.length >= MAX_FILES) {
            errors.push(`${file.name}: you can attach up to ${MAX_FILES} files.`);
        } else {
            files.push(file);
        }
    }
    return { files, errors };
};
