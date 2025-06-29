import { Link } from 'react-router-dom';
import { Logo, Button, Card } from '../components/ui';
import Footer from '../components/Footer';

const features = [
  {
    title: 'Track Your Progress',
    description: 'Monitor your journey to $1,000,000 with real-time progress tracking and visual insights.',
    icon: '📈'
  },
  {
    title: 'Smart Analytics',
    description: 'Get detailed analytics on your spending patterns and investment growth.',
    icon: '🧠'
  },
  {
    title: 'Goal Setting',
    description: 'Set milestone goals and celebrate achievements along your wealth-building journey.',
    icon: '🎯'
  },
  {
    title: 'Secure & Private',
    description: 'Your financial data is encrypted and protected with enterprise-grade security.',
    icon: '🔒'
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Software Engineer',
    content: 'RT1M helped me visualize my path to financial freedom. I\'ve saved $50k in just 8 months!',
    avatar: '👩‍💻'
  },
  {
    name: 'Marcus Johnson',
    role: 'Entrepreneur',
    content: 'The progress tracking keeps me motivated. I\'m 30% closer to my million-dollar goal.',
    avatar: '👨‍💼'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Designer',
    content: 'Beautiful interface and powerful insights. This app changed how I think about money.',
    avatar: '👩‍🎨'
  }
];

const stats = [
  { label: 'Active Users', value: '10,000+' },
  { label: 'Total Saved', value: '$50M+' },
  { label: 'Success Rate', value: '89%' },
  { label: 'Average Growth', value: '24%' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] bg-gradient-to-br from-primary-100/30 to-secondary-100/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6 sm:mb-8">
              <Logo size="xl" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-surface-900 mb-4 sm:mb-6 leading-tight">
              Road to{' '}
              <span className="text-gradient bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600">
                $1,000,000
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-surface-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
              Transform your financial future with intelligent tracking, personalized insights, 
              and a clear path to building lasting wealth.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0 mb-8 sm:mb-12">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto group min-h-[48px] bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white">
                  Start Your Journey
                  <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto min-h-[48px] border-2 border-primary-500 text-primary-600 hover:bg-primary-50">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-surface-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-surface-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 mb-3 sm:mb-4">
              Everything you need to build wealth
            </h2>
            <p className="text-lg sm:text-xl text-surface-600 max-w-2xl mx-auto">
              Powerful tools and insights to accelerate your journey to financial independence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 sm:p-8 text-center hover:shadow-card-hover transition-all duration-300 group">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-surface-900 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-surface-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-surface-900 mb-3 sm:mb-4">
              Your path to $1M in 3 simple steps
            </h2>
            <p className="text-lg sm:text-xl text-surface-600 max-w-2xl mx-auto">
              Get started in minutes and begin tracking your wealth-building journey today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: '01',
                title: 'Set Your Goal',
                description: 'Define your target amount and timeline. RT1M will create a personalized roadmap to get you there.',
                color: 'primary'
              },
              {
                step: '02',
                title: 'Track Progress',
                description: 'Monitor your income, expenses, and investments with our intuitive dashboard and real-time analytics.',
                color: 'secondary'
              },
              {
                step: '03',
                title: 'Reach Milestones',
                description: 'Celebrate achievements, adjust strategies, and stay motivated as you build lasting wealth.',
                color: 'accent'
              }
            ].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-${step.color}-100 flex items-center justify-center`}>
                  <span className={`text-2xl sm:text-3xl font-bold text-${step.color}-600`}>
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-surface-900 mb-3 sm:mb-4">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-surface-600 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Connection line for desktop */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 sm:top-10 left-full w-full h-0.5 bg-surface-200 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-surface-900 mb-4">
              Trusted by thousands of wealth builders
            </h2>
            <p className="text-xl text-surface-600 max-w-2xl mx-auto">
              Join a community of ambitious individuals on their journey to financial freedom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 hover:shadow-card-hover transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-surface-900">{testimonial.name}</div>
                    <div className="text-sm text-surface-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-surface-700 leading-relaxed mb-4">
                  "{testimonial.content}"
                </p>
                <div className="flex text-accent-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
            Ready to build your wealth?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already on their journey to financial independence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto border-2 border-transparent min-h-[48px]">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary-600 focus:ring-white min-h-[48px]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
} 