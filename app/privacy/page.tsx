export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>
            When you sign in with Google OAuth, we collect your email address and basic profile information 
            (name, profile picture) as provided by Google. This information is used solely for authentication 
            and account management purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To authenticate and identify you when using our web scraping service</li>
            <li>To associate your scraping jobs and data with your account</li>
            <li>To provide personalized dashboard and settings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Storage</h2>
          <p>
            Your account information and scraping data are stored securely in our database. 
            We do not share your personal information with third parties except as required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p>
            You can request deletion of your account and associated data at any time by contacting us. 
            You can also revoke access to your Google account through your Google account settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us at: ekosolarize@gmail.com
          </p>
        </section>

        <section className="text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </section>
      </div>
    </div>
  )
}
