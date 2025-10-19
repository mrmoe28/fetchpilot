import { useState, useCallback } from 'react'

interface ScrapeStreamEvent {
  type: 'job-created' | 'logs' | 'progress' | 'complete' | 'error'
  data: any
}

export function useScrapeStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startScrape = useCallback(async (url: string, goal?: string) => {
    setIsStreaming(true)
    setLogs([])
    setProducts([])
    setJobId(null)
    setError(null)

    try {
      const response = await fetch('/api/scrape/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, goal }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          setIsStreaming(false)
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.trim()) continue

          const eventMatch = line.match(/^event: (.+)$/)
          const dataMatch = line.match(/^data: (.+)$/m)

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1]
            const eventData = JSON.parse(dataMatch[1])

            switch (eventType) {
              case 'job-created':
                setJobId(eventData.jobId)
                setLogs(prev => [...prev, `✓ Job created: ${eventData.jobId}`])
                break

              case 'logs':
                setLogs(prev => [...prev, ...eventData.logs])
                break

              case 'progress':
                setLogs(prev => [...prev, `Progress: ${eventData.products} products found`])
                break

              case 'complete':
                setProducts(eventData.products)
                setLogs(prev => [...prev, ...eventData.logs, '✓ Scraping complete!'])
                setIsStreaming(false)
                break

              case 'error':
                setError(eventData.message)
                setLogs(prev => [...prev, `✖ Error: ${eventData.message}`])
                setIsStreaming(false)
                break
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
      setLogs(prev => [...prev, `✖ Exception: ${err.message}`])
      setIsStreaming(false)
    }
  }, [])

  return {
    startScrape,
    isStreaming,
    logs,
    products,
    jobId,
    error,
  }
}
