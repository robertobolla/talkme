import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: sessionId } = await params;
    
    console.log('=== DEBUG REJECT ENDPOINT CALLED ===');
    console.log('Params:', params);
    
    return NextResponse.json({ 
        message: 'Debug endpoint working',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
    });
} 