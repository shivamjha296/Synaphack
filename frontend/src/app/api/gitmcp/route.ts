// Next.js API Route for GitMCP proxy to avoid CORS issues
// This server-side route makes requests to GitMCP on behalf of the client

import { NextRequest, NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🚀 GitMCP API route called')
  
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

    // Validate GitHub URL format
    const githubPattern = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/
    if (!githubPattern.test(githubUrl)) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo' },
        { status: 400 }
      )
    }

    // Convert GitHub URL to GitMCP format
    const cleanUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl
    const match = cleanUrl.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)$/)
    
    if (!match) {
      return NextResponse.json(
        { error: 'Failed to parse GitHub URL' },
        { status: 400 }
      )
    }

    const [, owner, repo] = match
    const gitmcpUrl = `https://gitmcp.io/${owner}/${repo}`

    console.log('🔍 Server-side GitMCP request:', gitmcpUrl)

    // Create AbortController for timeout (more compatible)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds

    try {
      // Make request to GitMCP from server (no CORS issues)
      const response = await fetch(gitmcpUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SynapHack-Platform/1.0',
          // Add these headers to help with some potential issues
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('GitMCP API error:', response.status, errorText)
        
        let errorMessage = 'GitMCP service error'
        switch (response.status) {
          case 404:
            errorMessage = 'Repository not found or is private'
            break
          case 403:
            errorMessage = 'Access denied - repository may be private'
            break
          case 429:
            errorMessage = 'Rate limit exceeded - please try again later'
            break
          case 500:
            errorMessage = 'GitMCP service temporarily unavailable'
            break
          default:
            errorMessage = `GitMCP API error: ${response.status}`
        }
        
        return NextResponse.json(
          { error: errorMessage, statusCode: response.status },
          { status: response.status }
        )
      }

      // First, let's check what we're actually getting from GitMCP
      const responseText = await response.text()
      console.log('🔍 GitMCP raw response type:', response.headers.get('content-type'))
      console.log('🔍 GitMCP raw response (first 500 chars):', responseText.substring(0, 500))

      // Try to parse as JSON, but handle the case where it's HTML
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ GitMCP returned non-JSON response:', parseError)
        
        // If it's HTML, GitMCP might not be a direct API
        if (responseText.includes('<!DOCTYPE')) {
          console.log('🔄 GitMCP returned HTML, falling back to GitHub API')
          
          // Fallback to GitHub API for repository analysis
          try {
            const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}`
            console.log('🔗 Fallback to GitHub API:', githubApiUrl)
            
            const githubResponse = await fetch(githubApiUrl, {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SynapHack-Platform/1.0'
              }
            })
            
            if (!githubResponse.ok) {
              throw new Error(`GitHub API error: ${githubResponse.status}`)
            }
            
            const githubData = await githubResponse.json()
            
            // Also fetch languages
            const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'SynapHack-Platform/1.0'
              }
            })
            
            let languages = {}
            if (languagesResponse.ok) {
              languages = await languagesResponse.json()
            }
            
            // Also fetch README
            let readmeContent = ''
            try {
              const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'SynapHack-Platform/1.0'
                }
              })
              
              if (readmeResponse.ok) {
                const readmeData = await readmeResponse.json()
                // Decode base64 content
                readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8')
              }
            } catch (readmeError) {
              console.log('Could not fetch README:', readmeError)
            }
            
            // Combine GitHub data for processing
            const combinedData = {
              ...githubData,
              languages,
              readme: readmeContent
            }
            
            const techStack = extractTechStack(combinedData)
            const summary = generateSummary(combinedData)
            
            const fallbackResponse = {
              repoName: githubData.name || repo,
              description: githubData.description || 'No description available',
              techStack,
              summary,
              gitmcpUrl: `${gitmcpUrl} (GitMCP unavailable - using GitHub API)`,
              source: 'github-api-fallback'
            }
            
            console.log('✅ Fallback analysis completed using GitHub API')
            return NextResponse.json(fallbackResponse)
            
          } catch (githubError) {
            console.error('❌ GitHub API fallback failed:', githubError)
            return NextResponse.json({
              error: 'Both GitMCP and GitHub API are unavailable. GitMCP returned HTML instead of JSON, and GitHub API failed.',
              gitmcpUrl,
              details: githubError instanceof Error ? githubError.message : 'Unknown error'
            }, { status: 503 })
          }
        }
        
        throw parseError
      }

      // Process and structure the response
      const repoName = repo
      const techStack = extractTechStack(data)
      const summary = generateSummary(data)

      const processedResponse = {
        repoName: data.name || repoName,
        description: data.description || 'No description available',
        techStack,
        summary,
        gitmcpUrl,
        rawData: data // Include raw data for debugging if needed
      }

      return NextResponse.json(processedResponse)

    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }

  } catch (error) {
    console.error('❌ Server-side GitMCP error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    let errorMessage = 'Internal server error'
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Network error - unable to connect to GitMCP service'
    } else if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error details:', error.name, error.message)
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper function to extract technology stack
function extractTechStack(data: any): string[] {
  const techStack: string[] = []
  
  try {
    // Extract from languages
    if (data.languages && typeof data.languages === 'object') {
      techStack.push(...Object.keys(data.languages))
    }
    
    // Extract from topics/tags
    if (data.topics && Array.isArray(data.topics)) {
      techStack.push(...data.topics)
    }
    
    // Extract from package.json dependencies (if available)
    if (data.dependencies && typeof data.dependencies === 'object') {
      techStack.push(...Object.keys(data.dependencies))
    }
    
    // Extract from README technologies mentioned
    if (data.readme && typeof data.readme === 'string') {
      const commonTech = [
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
        'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go',
        'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'MongoDB', 'PostgreSQL',
        'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP'
      ]
      
      commonTech.forEach(tech => {
        if (data.readme.toLowerCase().includes(tech.toLowerCase())) {
          techStack.push(tech)
        }
      })
    }
    
    // Remove duplicates and limit to 10 items
    return Array.from(new Set(techStack)).slice(0, 10)
  } catch (error) {
    console.error('Error extracting tech stack:', error)
    return []
  }
}

// Helper function to generate summary
function generateSummary(data: any): string {
  try {
    let summary = ''
    
    // Add description
    if (data.description) {
      summary += `${data.description}\n\n`
    }
    
    // Add statistics
    const stats = []
    if (data.stargazers_count) stats.push(`⭐ ${data.stargazers_count} stars`)
    if (data.forks_count) stats.push(`🍴 ${data.forks_count} forks`)
    if (data.open_issues_count) stats.push(`🐛 ${data.open_issues_count} issues`)
    if (data.size) stats.push(`📦 ${Math.round(data.size / 1024)} MB`)
    
    if (stats.length > 0) {
      summary += `**Stats:** ${stats.join(' • ')}\n\n`
    }
    
    // Add language breakdown
    if (data.languages && Object.keys(data.languages).length > 0) {
      const languages = Object.entries(data.languages)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([lang]) => lang)
      summary += `**Languages:** ${languages.join(', ')}\n\n`
    }
    
    // Add recent activity
    if (data.updated_at) {
      const lastUpdate = new Date(data.updated_at).toLocaleDateString()
      summary += `**Last Updated:** ${lastUpdate}\n\n`
    }
    
    // Add README excerpt
    if (data.readme && data.readme.length > 100) {
      const excerpt = data.readme.substring(0, 300).trim()
      summary += `**Overview:** ${excerpt}...`
    }
    
    return summary || 'Repository analysis available'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Unable to generate summary'
  }
}
