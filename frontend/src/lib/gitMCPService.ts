// GitMCP Service for converting GitHub URLs to GitMCP format
// Provides functions to convert GitHub repository URLs to GitMCP analysis URLs

export interface GitMCPResponse {
  gitmcpUrl: string
}

class GitMCPService {
  private readonly GITMCP_BASE_URL = 'https://gitmcp.io'

  /**
   * Convert GitHub URL to GitMCP format
   * Input: https://github.com/owner/repo or https://github.com/owner/repo.git
   * Output: https://gitmcp.io/owner/repo.git
   */
  private convertGitHubToGitMCP(githubUrl: string): string {
    try {
      // Remove trailing slash if present, but keep .git if it exists
      let cleanUrl = githubUrl.endsWith('/') ? githubUrl.slice(0, -1) : githubUrl
      
      // Match GitHub URL pattern (with or without .git)
      const githubPattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+(?:\.git)?)$/
      const match = cleanUrl.match(githubPattern)
      
      if (!match) {
        throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo or https://github.com/owner/repo.git')
      }
      
      const [, owner, repo] = match
      return `${this.GITMCP_BASE_URL}/${owner}/${repo}/chat`
    } catch (error) {
      console.error('Error converting GitHub URL to GitMCP:', error)
      throw error
    }
  }

  /**
   * Validate if URL is a valid GitHub repository URL
   */
  isValidGitHubUrl(url: string): boolean {
    try {
      const githubPattern = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+(?:\.git)?\/?$/
      return githubPattern.test(url)
    } catch {
      return false
    }
  }

  /**
   * Get GitMCP URL without making API call
   * This is the main function to use for converting GitHub URLs to GitMCP URLs
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
