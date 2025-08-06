import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== TEST ENDPOINT CALLED ===');

  const STRAPI_URL = process.env.STRAPI_URL;
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  console.log('STRAPI_URL:', STRAPI_URL);
  console.log('STRAPI_API_TOKEN exists:', !!STRAPI_API_TOKEN);
  console.log('STRAPI_API_TOKEN length:', STRAPI_API_TOKEN?.length);

  return NextResponse.json({
    message: 'Test endpoint working',
    strapiUrl: STRAPI_URL,
    hasToken: !!STRAPI_API_TOKEN,
    tokenLength: STRAPI_API_TOKEN?.length
  });
}

export async function POST() {
  return NextResponse.json({ message: 'Test POST endpoint working' });
} 