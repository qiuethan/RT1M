import Footer from '../components/Footer';

export default function Chatbot() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🤖</div>
          <h1 className="text-4xl font-bold text-surface-900 mb-4">
            Chatbot coming soon
          </h1>
          <p className="text-lg text-surface-600 max-w-md mx-auto">
            Your AI financial advisor will be here to help you make smarter money decisions.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
} 