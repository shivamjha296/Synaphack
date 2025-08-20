// Simple test API route
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API route is working!',
    timestamp: new Date().toISOString()
  })
}
