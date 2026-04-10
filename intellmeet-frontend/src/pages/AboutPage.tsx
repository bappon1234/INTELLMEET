import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Users, Brain, Globe, Target, Award } from 'lucide-react';

export default function AboutPage() {
  const navigate = useNavigate();

  const stats = [
    { value: '10M+', label: 'Active Users' },
    { value: '500M+', label: 'Meetings Hosted' },
    { value: '150+', label: 'Countries' },
    { value: '99.9%', label: 'Uptime' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To revolutionize how teams collaborate by making every meeting more productive, actionable, and intelligent.'
    },
    {
      icon: Brain,
      title: 'AI-First Approach',
      description: 'Leveraging cutting-edge AI to provide automatic summaries, transcriptions, and actionable insights.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Serving teams across 150+ countries with low-latency infrastructure and 24/7 support.'
    },
    {
      icon: Award,
      title: 'Quality First',
      description: 'Enterprise-grade security, reliability, and performance you can trust.'
    }
  ];

  const team = [
    { name: 'Alex Chen', role: 'CEO & Co-Founder', image: '👨‍💼' },
    { name: 'Sarah Johnson', role: 'CTO & Co-Founder', image: '👩‍💻' },
    { name: 'Michael Rodriguez', role: 'VP of Engineering', image: '👨‍🔧' },
    { name: 'Emily Watson', role: 'Head of Product', image: '👩‍🎨' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              IntellMeet
            </span>
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
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About IntellMeet
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to transform how the world collaborates through intelligent, 
            AI-powered meeting experiences.
          </p>
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

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Our Story</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                IntellMeet was founded in 2024 by a team of engineers and product designers who experienced 
                firsthand the frustration of unproductive meetings. They saw teams wasting hours in meetings 
                without clear outcomes, losing valuable insights, and struggling to follow up on action items.
              </p>
              <p>
                We believed meetings could be better. By combining HD video conferencing with powerful AI, 
                we created a platform that doesn't just connect people—it makes every conversation count.
              </p>
              <p>
                Today, IntellMeet serves millions of users worldwide, from startups to Fortune 500 companies, 
                helping them run smarter, more efficient meetings that drive real results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-16 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-8">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <value.icon className="h-8 w-8 text-primary mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4 text-center">Leadership Team</h2>
          <p className="text-xl text-muted-foreground mb-16 text-center max-w-2xl mx-auto">
            Meet the visionaries driving innovation in enterprise collaboration
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transform the way your team meets and collaborates
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 IntellMeet by Zidio Development. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
