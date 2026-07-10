import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Target, Zap, LayoutDashboard, BrainCircuit, BarChart3 } from "lucide-react";

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Abstract Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-24 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="none" className="size-5">
              <path d="M128 48L148 108L208 128L148 148L128 208L108 148L48 128L108 108L128 48Z" fill="currentColor" />
            </svg>
          </div>
          StratGen AI
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="size-4" />
            Gemini-Powered Intelligence
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            Marketing strategy,<br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">
              without the consultant.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Generate comprehensive, data-driven marketing plans tailored to your exact industry, audience, and goals in under 30 seconds.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up">
              <Button size="lg" className="rounded-full h-14 px-8 text-lg font-semibold w-full sm:w-auto shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                Start Generating for Free
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 px-6 bg-black/40 border-y border-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">A control center for growth</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to plan, execute, and analyze your market positioning in one beautifully dense interface.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: BrainCircuit,
                  title: "Marketing Expert AI",
                  description: "Meet Alex — your dedicated AI Marketing Manager. Chat naturally about strategy, clients, campaigns, and growth. Like having a 20-year veteran on call."
                },
                {
                  icon: Zap,
                  title: "Instant Strategy Generation",
                  description: "Skip weeks of planning. Generate comprehensive, data-driven marketing strategies tailored to your industry and goals in under 30 seconds."
                },
                {
                  icon: LayoutDashboard,
                  title: "Daily Missions & Analytics",
                  description: "Stay on track with AI-generated daily tasks, XP rewards, and performance charts that show exactly where you're growing."
                },
                {
                  icon: BarChart3,
                  title: "Client Discovery",
                  description: "Tell Alex about your business and get a comprehensive report: ideal customer profiles, where to find them, and ready-to-send outreach messages."
                },
                {
                  icon: Target,
                  title: "Communication Assistant",
                  description: "Generate cold emails, sales pitches, social DMs, follow-ups, and proposals — written in your voice and ready to send."
                },
                {
                  icon: Zap,
                  title: "Startup Idea Generator",
                  description: "Input your interests and skills. Alex analyzes global market trends and delivers 3 validated startup ideas with launch plans and viability scores."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="size-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mb-6">
                    <feature.icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-32 px-6 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">Ready to define your market?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join founders and growth leads who plan faster and execute better.</p>
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full h-14 px-10 text-lg font-semibold shadow-xl shadow-primary/20">
              Create Your Account
            </Button>
          </Link>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground border-t border-white/5">
        <p>© {new Date().getFullYear()} StratGen AI. All rights reserved.</p>
      </footer>
    </div>
  );
}