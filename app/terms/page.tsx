export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p>
            By accessing and using FetchPilot, you accept and agree to be bound by the terms 
            and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Use License</h2>
          <p>
            Permission is granted to temporarily use FetchPilot for personal and commercial web scraping purposes. 
            This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Use the service for illegal activities</li>
            <li>Attempt to scrape websites that explicitly prohibit scraping</li>
            <li>Overload target websites with excessive requests</li>
            <li>Share your account credentials with others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Responsible Scraping</h2>
          <p>
            You agree to use this service responsibly and ethically. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Respecting robots.txt files and website terms of service</li>
            <li>Not scraping personal or sensitive data without consent</li>
            <li>Using reasonable delays between requests</li>
            <li>Complying with all applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Service Availability</h2>
          <p>
            We strive to provide reliable service but make no guarantees about uptime or availability. 
            The service may be temporarily unavailable for maintenance or other reasons.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p>
            FetchPilot and its operators shall not be liable for any damages resulting from the use or 
            inability to use this service, including but not limited to data loss, service interruptions, 
            or legal issues arising from scraping activities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Termination</h2>
          <p>
            We may terminate or suspend your account and access to the service immediately, without prior 
            notice or liability, for any reason, including breach of these terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
          <p>
            Questions about the Terms of Service should be sent to: ekosolarize@gmail.com
          </p>
        </section>

        <section className="text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  )
}
