import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log('=== DEBUG REJECT ENDPOINT CALLED ===');
    console.log('Params:', params);
    
    return NextResponse.json({ 
        message: 'Debug endpoint working',
        sessionId: params.id,
        timestamp: new Date().toISOString()
    });
} 