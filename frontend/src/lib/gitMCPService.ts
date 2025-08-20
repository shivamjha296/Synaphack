// GitMCP Service for analyzing GitHub repositories
// Converts GitHub URLs to GitMCP format and fetches repository analysis

export interface GitMCPResponse {
  repoName: string
  description: string
  techStack: string[]
  summary: string
  gitmcpUrl: string
}

export interface GitMCPError {
  error: string
  message: string
  statusCode?: number
}

class GitMCPService {
  private readonly GITMCP_BASE_URL = 'https://gitmcp.io'

  /**
   * Convert GitHub URL to GitMCP format
   * Input: https://github.com/owner/repo
   * Output: https://gitmcp.io/owner/repo
   */
  private convertGitHubToGitMCP(githubUrl: string): string {
    try {
      // Remove trailing slash if present
      const cleanUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl
      
      // Match GitHub URL pattern
      const githubPattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)$/
      const match = cleanUrl.match(githubPattern)
      
      if (!match) {
        throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo')
      }
      
      const [, owner, repo] = match
      return `${this.GITMCP_BASE_URL}/${owner}/${repo}`
    } catch (error) {
      console.error('Error converting GitHub URL to GitMCP:', error)
      throw error
    }
  }

  /**
   * Fetch repository analysis from GitMCP via our server-side proxy
   */
  async analyzeRepository(githubUrl: string): Promise<GitMCPResponse> {
    try {
      console.log('🔍 Analyzing GitHub repository:', githubUrl)
      
      // Use our server-side API route to avoid CORS issues
      const apiUrl = `/api/gitmcp?url=${encodeURIComponent(githubUrl)}`
      console.log('🔗 Using server proxy:', apiUrl)
      
      // Create AbortController for timeout (more compatible)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds

      let response
      try {
        // Make request to our Next.js API route
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('GitMCP proxy API error:', response.status, errorData)
        
        switch (response.status) {
          case 404:
            throw new Error(errorData.error || 'Repository not found or is private')
          case 403:
            throw new Error(errorData.error || 'Access denied - repository may be private')
          case 429:
            throw new Error(errorData.error || 'Rate limit exceeded - please try again later')
          case 500:
            throw new Error(errorData.error || 'GitMCP service temporarily unavailable')
          default:
            throw new Error(errorData.error || `GitMCP API error: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log('✅ GitMCP response received via proxy:', data)

      // The API route already processes the data, so we can use it directly
      const gitMCPResponse: GitMCPResponse = {
        repoName: data.repoName,
        description: data.description,
        techStack: data.techStack,
        summary: data.summary,
        gitmcpUrl: data.gitmcpUrl
      }

      return gitMCPResponse
    } catch (error) {
      console.error('Error analyzing repository with GitMCP:', error)
      
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error - unable to connect to GitMCP service')
      }
      
      throw error
    }
  }

  /**
   * Extract technology stack from GitMCP response
   */
  private extractTechStack(data: any): string[] {
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

  /**
   * Generate a comprehensive summary from GitMCP data
   */
  private generateSummary(data: any): string {
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

  /**
   * Validate if URL is a valid GitHub repository URL
   */
  isValidGitHubUrl(url: string): boolean {
    try {
      const githubPattern = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/
      return githubPattern.test(url)
    } catch {
      return false
    }
  }

  /**
   * Get GitMCP URL without making API call
   */
  getGitMCPUrl(githubUrl: string): string {
    try {
      return this.convertGitHubToGitMCP(githubUrl)
    } catch (error) {
      console.error('Error generating GitMCP URL:', error)
      return ''
    }
  }
}

// Export singleton instance
export const gitMCPService = new GitMCPService()
