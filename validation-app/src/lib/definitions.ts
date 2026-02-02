// Type definitions for NVC-HH validation

export interface SomaticMarker {
    marker: string;
    intensity: 'low' | 'medium' | 'high';
    evidence_span: string;
}

export interface OFNR {
    observation: string;
    feeling: string[];
    need: string[];
    explicit_need: string[];
    implicit_need: string[];
    explicit_request: string[];
    implicit_request: string[];
    implicit_intent: string;
    pseudo_feelings_detected: string[];
}

export interface Metadata {
    emotion_arousal_hint: 'low' | 'medium' | 'high' | null;
    emotion_valence_hint: 'positive' | 'negative' | 'mixed' | null;
    somatic_markers: SomaticMarker[];
}

export interface Safety {
    label: 'allowed' | 'disallowed' | 'ambiguous';
    reason: string;
}

export interface Quality {
    observation_is_nonjudgmental: number;
    needs_list_match: number;
    overall_confidence: number;
}

export interface Flags {
    error_flags: string[];
    warnings: string[];
}

export interface DataRow {
    id: string;
    prompt: string;
    context: string;
    human_chosen_response: string;
    human_rejected_response: string;
    ofnr: OFNR;
    metadata: Metadata;
    safety: Safety;
    quality: Quality;
    flags: Flags;
}

export interface ValidationResult {
    id: string;
    folder: string;
    validated_at: string;
    validator_type: 'general' | 'lawyers';

    // Original fields preserved
    prompt: string;
    context: string;
    human_chosen_response: string;
    human_rejected_response: string;

    // Validated OFNR with user decisions
    ofnr: {
        observation: string;
        observation_is_judgmental: boolean;
        feeling: string[];
        need: string[];
        explicit_need: string[];
        implicit_need: string[];
        explicit_request: string[];
        implicit_request: string[];
        implicit_intent: string;
    };

    // Validated safety
    safety: Safety;

    // Quality scores (can be adjusted by validator)
    quality: Quality;
}

export type ValidatorType = 'general' | 'lawyers';

export const GENERAL_FOLDERS = [
    'harmless-base',
    'helpful-base',
    'helpful-online',
    'helpful-rejections-sampled'
] as const;

export const LAWYER_FOLDERS = ['red-team-attempts'] as const;

export type GeneralFolder = typeof GENERAL_FOLDERS[number];
export type LawyerFolder = typeof LAWYER_FOLDERS[number];
export type DataFolder = GeneralFolder | LawyerFolder;

export interface RowFetchResponse {
    row: DataRow | null;
    folder: DataFolder | null;
    remaining: number;
    error?: string;
}
