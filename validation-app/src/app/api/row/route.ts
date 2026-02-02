import { NextRequest, NextResponse } from 'next/server';
import {
    getNextRowForGeneral,
    getNextRowForLawyers,
    countRemainingRows,
    saveValidatedResult,
} from '@/lib/data';
import { ValidatorType, ValidationResult, RowFetchResponse } from '@/lib/definitions';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ValidatorType | null;

    if (!type || !['general', 'lawyers'].includes(type)) {
        return NextResponse.json(
            { error: 'Invalid validator type. Use ?type=general or ?type=lawyers' },
            { status: 400 }
        );
    }

    try {
        const { row, folder } =
            type === 'general' ? getNextRowForGeneral() : getNextRowForLawyers();

        const remaining = countRemainingRows(type);

        const response: RowFetchResponse = {
            row,
            folder,
            remaining,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching row:', error);
        return NextResponse.json(
            { error: 'Failed to fetch row', row: null, folder: null, remaining: 0 },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { result, folder } = body as {
            result: ValidationResult;
            folder: string;
        };

        if (!result || !folder) {
            return NextResponse.json(
                { error: 'Missing result or folder' },
                { status: 400 }
            );
        }

        saveValidatedResult(result, folder as any);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving validation:', error);
        return NextResponse.json(
            { error: 'Failed to save validation' },
            { status: 500 }
        );
    }
}
