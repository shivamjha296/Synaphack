'use client'

interface Sponsor {
  name: string
  logo?: string
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  website?: string
  description?: string
  contactEmail?: string
}

interface SponsorShowcaseProps {
  sponsors: Sponsor[]
  title?: string
  compact?: boolean
  maxVisible?: number
}

const SponsorShowcase = ({ sponsors, title = "Event Sponsors", compact = false, maxVisible }: SponsorShowcaseProps) => {
  if (!sponsors || sponsors.length === 0) {
    return null
  }

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-gradient-to-r from-gray-100 to-gray-300 text-gray-900 border-gray-400'
      case 'gold':
        return 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 border-yellow-600'
      case 'silver':
        return 'bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800 border-gray-500'
      case 'bronze':
        return 'bg-gradient-to-r from-orange-300 to-orange-500 text-orange-900 border-orange-600'
      default:
        return 'bg-slate-600 text-white border-slate-500'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '💎'
      case 'gold':
        return '🥇'
      case 'silver':
        return '🥈'
      case 'bronze':
        return '🥉'
      default:
        return '🏢'
    }
  }

  // Sort sponsors by tier priority
  const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 }
  const sortedSponsors = [...sponsors].sort((a, b) => 
    tierOrder[a.tier] - tierOrder[b.tier]
  )

  const displaySponsors = maxVisible ? sortedSponsors.slice(0, maxVisible) : sortedSponsors
  const remainingCount = maxVisible && sponsors.length > maxVisible ? sponsors.length - maxVisible : 0

  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-green-300">{title}:</h4>
        <div className="flex flex-wrap gap-2">
          {displaySponsors.map((sponsor, index) => (
            <div
              key={index}
              className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 border ${getTierStyle(sponsor.tier)}`}
              title={`${sponsor.name} - ${sponsor.tier.toUpperCase()} Sponsor${sponsor.description ? ': ' + sponsor.description : ''}`}
            >
              {sponsor.logo ? (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-4 h-4 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span>{getTierIcon(sponsor.tier)}</span>
              )}
              <span>{sponsor.name}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded-full text-xs border border-slate-600">
              +{remainingCount} more
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
        <span>🤝</span>
        <span>{title}</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displaySponsors.map((sponsor, index) => (
          <div
            key={index}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
          >
            <div className="flex items-start space-x-3">
              {sponsor.logo && (
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-white">{sponsor.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getTierStyle(sponsor.tier)}`}>
                    {getTierIcon(sponsor.tier)} {sponsor.tier.toUpperCase()}
                  </span>
                </div>
                
                {sponsor.description && (
                  <p className="text-sm text-slate-300 mb-2">{sponsor.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Visit Website
                    </a>
                  )}
                  {sponsor.contactEmail && (
                    <a
                      href={`mailto:${sponsor.contactEmail}`}
                      className="text-green-400 hover:text-green-300 underline"
                    >
                      Contact
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sponsor appreciation message */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-4 mt-6">
        <p className="text-center text-sm text-green-200">
          ✨ <strong>Thank you to our amazing sponsors</strong> for making this event possible! ✨
        </p>
        <p className="text-center text-xs text-slate-400 mt-1">
          Their support enables us to create incredible experiences for all participants.
        </p>
      </div>
    </div>
  )
}

export default SponsorShowcase
