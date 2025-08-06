import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('=== DEBUG REJECT ENDPOINT CALLED ===');
    
    return NextResponse.json({ 
        message: 'Debug reject endpoint working',
        timestamp: new Date().toISOString()
    });
} 