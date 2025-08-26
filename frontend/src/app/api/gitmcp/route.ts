// Next.js API Route for GitMCP URL conversion
// This server-side route converts GitHub URLs to GitMCP URLs

import { NextRequest, NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🚀 GitMCP URL conversion API route called')
  
  try {
    const searchParams = request.nextUrl.searchParams
    const githubUrl = searchParams.get('url')

    console.log('📥 Received GitHub URL:', githubUrl)

    if (!githubUrl) {
      console.log('❌ Missing GitHub URL parameter')
      return NextResponse.json(
        { error: 'Missing GitHub URL parameter' },
        { status: 400 }
      )
    }

    // Validate GitHub URL format (supports .git extension)
    const githubPattern = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?\/?$/
    if (!githubPattern.test(githubUrl)) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo or https://github.com/owner/repo.git' },
        { status: 400 }
      )
    }

    // Convert GitHub URL to GitMCP format
    const cleanUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl
    const match = cleanUrl.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+(?:\.git)?)$/)
    
    if (!match) {
      return NextResponse.json(
        { error: 'Failed to parse GitHub URL' },
        { status: 400 }
      )
    }

    const [, owner, repo] = match
    const gitmcpUrl = `https://gitmcp.io/${owner}/${repo}/chat`

    console.log('✅ Generated GitMCP URL:', gitmcpUrl)

    // Return the GitMCP URL
    return NextResponse.json({
      githubUrl: githubUrl,
      gitmcpUrl: gitmcpUrl,
      owner: owner,
      repo: repo
    })

  } catch (error) {
    console.error('❌ Error in GitMCP URL conversion:', error)
    return NextResponse.json(
      { error: 'Internal server error during URL conversion' },
      { status: 500 }
    )
  }
}
