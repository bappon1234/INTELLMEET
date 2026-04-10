import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Users, Brain, Zap, Shield, Globe, ArrowRight, Play, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: 'HD Video Meetings',
      description: 'Crystal-clear video conferencing with up to 100 participants',
    },
    {
      icon: Brain,
      title: 'AI-Powered Intelligence',
      description: 'Automatic summaries, transcriptions, and action items extraction',
    },
    {
      icon: Zap,
      title: 'Real-Time Collaboration',
      description: 'Instant messaging, screen sharing, and collaborative whiteboard',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'End-to-end encryption and advanced access controls',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Organize teams, schedule meetings, and track analytics',
    },
    {
      icon: Globe,
      title: 'Global Accessibility',
      description: 'Available worldwide with low-latency infrastructure',
    },
  ];

  const stats = [
    { value: '10M+', label: 'Active Users' },
    { value: '500M+', label: 'Meetings Hosted' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '150+', label: 'Countries Served' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              IntellMeet
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate('/pricing')} className="text-sm font-medium hover:text-primary transition-colors bg-transparent border-none cursor-pointer">Pricing</button>
            <button onClick={() => navigate('/about')} className="text-sm font-medium hover:text-primary transition-colors bg-transparent border-none cursor-pointer">About</button>
            <button onClick={() => navigate('/contact')} className="text-sm font-medium hover:text-primary transition-colors bg-transparent border-none cursor-pointer">Contact</button>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Meeting Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Transform Your Meetings with{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            The enterprise-grade platform that combines HD video conferencing with powerful AI 
            to make every meeting more productive and actionable.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate('/signup')} className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full opacity-30 animate-pulse" />
            <div className="relative bg-card border rounded-lg shadow-2xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <Video className="h-20 w-20 text-primary mx-auto mb-4" />
                  <p className="text-lg font-semibold">Interactive Meeting Demo</p>
                  <p className="text-muted-foreground">Experience the future of meetings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features for Modern Teams</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run effective meetings, powered by cutting-edge AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Meetings?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Join thousands of teams already using IntellMeet for smarter, more productive meetings.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/signup')} className="text-lg px-8">
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold">IntellMeet</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered enterprise meeting platform for modern teams.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">Security</a></li>
                <li><a href="#" className="hover:text-primary">Enterprise</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Privacy</a></li>
                <li><a href="#" className="hover:text-primary">Terms</a></li>
                <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2026 IntellMeet by Zidio Development. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
