import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: 'v1',
    endpoints: {
      scrape: {
        path: '/api/v1/scrape',
        method: 'POST',
        description: 'Start a new scraping job',
        parameters: {
          url: 'string (required) - Target URL to scrape',
          goal: 'string (optional) - Description of what to extract',
          config: {
            maxTotalPages: 'number (optional, 1-50, default: 12) - Maximum pages to scrape',
            browserEnabled: 'boolean (optional, default: false) - Use browser mode',
          },
        },
      },
      export: {
        path: '/api/export/{jobId}',
        method: 'GET',
        description: 'Export job results',
        parameters: {
          format: 'string (query param) - "json" or "csv"',
        },
      },
    },
    documentation: 'https://github.com/mrmoe28/fetchpilot',
    timestamp: new Date().toISOString(),
  })
}
