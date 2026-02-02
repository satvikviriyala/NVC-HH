import * as fs from 'fs';
import * as path from 'path';
import {
    DataRow,
    ValidationResult,
    ValidatorType,
    GENERAL_FOLDERS,
    LAWYER_FOLDERS,
    DataFolder,
} from './definitions';

// Paths relative to project root
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const DATA_REFINED_DIR = path.join(PROJECT_ROOT, 'Data_refined');
const DATA_VALIDATED_DIR = path.join(PROJECT_ROOT, 'data_refined_validated');
const PROCESSED_IDS_DIR = path.join(DATA_VALIDATED_DIR, 'processed_ids');

// Round-robin state (in-memory, resets on server restart)
let generalFolderIndex = 0;

/**
 * Load processed IDs for a validator type
 */
export function loadProcessedIds(type: ValidatorType): Set<string> {
    const filePath = path.join(PROCESSED_IDS_DIR, `${type}.json`);
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(data);
        return new Set(json[type] || []);
    } catch {
        return new Set();
    }
}

/**
 * Save a processed ID
 */
export function saveProcessedId(type: ValidatorType, id: string): void {
    const filePath = path.join(PROCESSED_IDS_DIR, `${type}.json`);

    // Read, update, write (with basic file locking via rename)
    const tempPath = `${filePath}.tmp.${Date.now()}`;

    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(data);
        const ids = json[type] || [];

        if (!ids.includes(id)) {
            ids.push(id);
            json[type] = ids;
            fs.writeFileSync(tempPath, JSON.stringify(json, null, 2));
            fs.renameSync(tempPath, filePath);
        }
    } catch (error) {
        // If temp file exists, clean up
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        throw error;
    }
}

/**
 * Read a JSONL file line by line and find the first unprocessed row
 */
export function findUnprocessedRow(
    folder: DataFolder,
    processedIds: Set<string>
): DataRow | null {
    const jsonlPath = path.join(DATA_REFINED_DIR, folder, 'train.jsonl');

    if (!fs.existsSync(jsonlPath)) {
        console.error(`File not found: ${jsonlPath}`);
        return null;
    }

    const content = fs.readFileSync(jsonlPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
        try {
            const row: DataRow = JSON.parse(line);
            if (!processedIds.has(row.id)) {
                return row;
            }
        } catch (e) {
            console.error(`Failed to parse line in ${folder}: ${e}`);
        }
    }

    return null;
}

/**
 * Get the next row for general validators (round-robin across 4 folders)
 */
export function getNextRowForGeneral(): { row: DataRow | null; folder: DataFolder | null } {
    const processedIds = loadProcessedIds('general');
    const foldersToCheck = [...GENERAL_FOLDERS];

    // Start from current index and try all folders
    for (let i = 0; i < foldersToCheck.length; i++) {
        const folderIdx = (generalFolderIndex + i) % foldersToCheck.length;
        const folder = foldersToCheck[folderIdx];

        const row = findUnprocessedRow(folder, processedIds);
        if (row) {
            // Update index to next folder for round-robin
            generalFolderIndex = (folderIdx + 1) % foldersToCheck.length;
            return { row, folder };
        }
    }

    return { row: null, folder: null };
}

/**
 * Get the next row for lawyer validators
 */
export function getNextRowForLawyers(): { row: DataRow | null; folder: DataFolder | null } {
    const processedIds = loadProcessedIds('lawyers');
    const folder = LAWYER_FOLDERS[0];

    const row = findUnprocessedRow(folder, processedIds);
    return { row, folder: row ? folder : null };
}

/**
 * Count remaining unprocessed rows
 */
export function countRemainingRows(type: ValidatorType): number {
    const processedIds = loadProcessedIds(type);
    const folders = type === 'general' ? GENERAL_FOLDERS : LAWYER_FOLDERS;

    let count = 0;
    for (const folder of folders) {
        const jsonlPath = path.join(DATA_REFINED_DIR, folder, 'train.jsonl');
        if (!fs.existsSync(jsonlPath)) continue;

        const content = fs.readFileSync(jsonlPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const row = JSON.parse(line);
                if (!processedIds.has(row.id)) {
                    count++;
                }
            } catch { }
        }
    }

    return count;
}

/**
 * Save a validated result to the output folder
 */
export function saveValidatedResult(
    result: ValidationResult,
    folder: DataFolder
): void {
    const outputPath = path.join(DATA_VALIDATED_DIR, folder, 'train.jsonl');

    // Read existing content to check for duplicates
    let existingLines: string[] = [];
    if (fs.existsSync(outputPath)) {
        const content = fs.readFileSync(outputPath, 'utf-8');
        existingLines = content.split('\n').filter(line => line.trim());
    }

    // Filter out any existing entry with the same ID (overwrite behavior)
    const filteredLines = existingLines.filter(line => {
        try {
            const row = JSON.parse(line);
            return row.id !== result.id;
        } catch {
            return true;
        }
    });

    // Add the new result
    filteredLines.push(JSON.stringify(result));

    // Write back
    const tempPath = `${outputPath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, filteredLines.join('\n') + '\n');
    fs.renameSync(tempPath, outputPath);

    // Mark as processed
    saveProcessedId(result.validator_type, result.id);
}
