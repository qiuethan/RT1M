import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import Footer from '../components/Footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="text-primary-600 hover:text-primary-700 flex items-center mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-surface-900">Privacy Policy</h1>
          <p className="text-surface-600 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="p-8 mb-8">
          <div className="prose max-w-none">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-yellow-800 font-medium">Testing Environment Notice</h3>
                  <p className="text-yellow-700 text-sm mt-1">
                    This privacy policy applies to RT1M during its development and testing phase. Please use only 
                    test data and avoid entering real personal or financial information.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">1. Information We Collect</h2>
            <p className="text-surface-700 mb-4">During the testing phase, we may collect:</p>
            <ul className="list-disc list-inside text-surface-700 mb-6 space-y-2">
              <li><strong>Account Information:</strong> Email address and authentication data via Firebase</li>
              <li><strong>Test Data:</strong> Financial information, goals, and other data you enter for testing purposes</li>
              <li><strong>Usage Data:</strong> How you interact with the application to improve functionality</li>
              <li><strong>Technical Data:</strong> Browser type, device information, and error logs</li>
            </ul>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-surface-700 mb-4">We use collected information to:</p>
            <ul className="list-disc list-inside text-surface-700 mb-6 space-y-2">
              <li>Provide and maintain the testing application</li>
              <li>Improve features and fix bugs during development</li>
              <li>Communicate with testers about application updates</li>
              <li>Analyze usage patterns to enhance user experience</li>
            </ul>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">3. Data Storage and Security</h2>
            <p className="text-surface-700 mb-6">
              Your test data is stored securely using Firebase services with industry-standard encryption. 
              However, as this is a development environment, we recommend using only test data. We implement 
              reasonable security measures, but cannot guarantee complete security during the testing phase.
            </p>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">4. Data Sharing</h2>
            <p className="text-surface-700 mb-6">
              We do not sell, trade, or share your personal information with third parties during testing. 
              Data may be shared with:
            </p>
            <ul className="list-disc list-inside text-surface-700 mb-6 space-y-2">
              <li>Firebase/Google Cloud services for application functionality</li>
              <li>Development team members for debugging and improvement purposes</li>
              <li>No other third parties during the testing phase</li>
            </ul>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">5. Testing Data Management</h2>
            <p className="text-surface-700 mb-6">
              During the testing phase:
            </p>
            <ul className="list-disc list-inside text-surface-700 mb-6 space-y-2">
              <li>Test data may be deleted, modified, or reset without notice</li>
              <li>We may need to access your test data to debug issues</li>
              <li>Data backups are not guaranteed during development</li>
              <li>You can request data deletion at any time</li>
            </ul>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">6. Your Rights</h2>
            <p className="text-surface-700 mb-4">During testing, you have the right to:</p>
            <ul className="list-disc list-inside text-surface-700 mb-6 space-y-2">
              <li>Access your test data</li>
              <li>Request deletion of your test data</li>
              <li>Correct inaccurate test data</li>
              <li>Withdraw from testing at any time</li>
            </ul>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">7. Cookies and Tracking</h2>
            <p className="text-surface-700 mb-6">
              We use essential cookies for authentication and session management. During testing, we may 
              also use analytics cookies to understand how the application is used and identify areas 
              for improvement.
            </p>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">8. Third-Party Services</h2>
            <p className="text-surface-700 mb-6">
              RT1M uses Firebase (Google) for authentication and data storage. Please review Google's 
              privacy policy for information about how they handle data. We may integrate other services 
              during development, and will update this policy accordingly.
            </p>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">9. Data Retention</h2>
            <p className="text-surface-700 mb-6">
              During the testing phase, we retain test data for as long as necessary for development 
              purposes. Test data may be deleted without notice as part of development resets or 
              database migrations.
            </p>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">10. Children's Privacy</h2>
            <p className="text-surface-700 mb-6">
              RT1M is not intended for use by children under 13 years of age. We do not knowingly 
              collect personal information from children under 13.
            </p>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-surface-700 mb-6">
              We may update this privacy policy during development. We will notify testers of any 
              significant changes through the application or via email.
            </p>

            <h2 className="text-xl font-semibold text-surface-900 mb-4">12. Contact Us</h2>
            <p className="text-surface-700 mb-6">
              If you have questions about this privacy policy or how we handle your test data, please 
              contact us at <a href="mailto:privacy@rt1m.app" className="text-primary-600 hover:text-primary-700">privacy@rt1m.app</a>.
            </p>

            <div className="border-t border-surface-200 pt-6 mt-8">
              <p className="text-sm text-surface-500">
                This privacy policy is specific to the testing and development phase of RT1M. A comprehensive 
                privacy policy will be implemented before any public release.
              </p>
            </div>
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 