"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { 
  ChevronDown, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Crown,
  BrainCircuit,
  ChevronRight,
  Zap,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  Database,
  LineChart,
  Globe,
  Mail,
  Globe as GlobeIcon,
  MessageCircle,
  Share2,
  ChevronUp,
  FileImage,
  FileText,
  Code,
  Layers,
  Search
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What file formats does DataBrix support?",
      a: "DataBrix features robust support for CSV, Excel, and JSON datasets. It also includes an advanced visual OCR engine that can extract and analyze tabular data directly from PDF documents and high-resolution images.",
    },
    {
      q: "How is my data kept secure?",
      a: "Data integrity is our priority. All analysis is executed in a secure local Python sandbox. Your datasets are never used for global model training, and all sensitive metadata is protected by industry-standard encryption protocols.",
    },
    {
      q: "Do I need coding or data analysis skills?",
      a: "Absolutely not. DataBrix abstracts away the complexity of Python and SQL. You can perform deep statistical analysis and generate complex visualizations using simple, natural language prompts.",
    },
    {
      q: "What AI model powers DataBrix?",
      a: "The core engine leverages the Google Gemini 1.5 Pro and 2.0 Flash models. We've implemented a custom fallback architecture that ensures non-stop reliability and high-speed reasoning even under heavy API load.",
    },
    {
      q: "Can I export my charts and reports?",
      a: "Yes. You can export raw cleaned datasets as CSV or Excel, generate SQL schemas, and download professional-grade visualizations in high-resolution formats suitable for presentations and executive reports.",
    },
    {
      q: "Is it really free?",
      a: "Yes. DataBrix is curated as a high-end technical demonstration of what's possible at the intersection of AI and data science. It is completely free to explore for recruiters and the open-source community.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0f1117] font-sans selection:bg-indigo-500/30 overflow-y-auto">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white text-lg font-black">B</span>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <span className="text-white font-black text-xl tracking-tight">DataBrix</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How It Works</Link>
            <Link href="#faq" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white font-medium">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-violet-500/5 rounded-full blur-[150px]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 mr-1.5" /> AI-Powered Data Intelligence
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Ask. Analyze. 
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Amaze.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The best way from data to decisions. Upload any file, ask in natural language, get instant charts and insights — no formulas needed.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-105">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/app">
                <Button size="lg" variant="outline" className="h-14 px-8 bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-lg rounded-xl backdrop-blur-sm">
                  Open Dashboard
                </Button>
              </Link>
            </div>


          </div>
        </div>
      </section>



      {/* Why Choose Us — Value Propositions */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-slate-400 border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">Why Choose DataBrix</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Everything you need, 10x faster</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Powerful AI tools to analyze, visualize, and understand your data</p>
          </div>

          {/* Big 4 Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { 
                icon: Zap, 
                title: "10x Faster Analysis",
                desc: "From data upload to visualization and insight generation — simply ask in natural language and get results instantly. No complex tools or training required.",
                gradient: "from-amber-500/20 to-orange-500/20",
                iconColor: "text-amber-400",
              },
              { 
                icon: Sparkles, 
                title: "One-Click Shortcuts", 
                desc: "Generate charts, merge Excel files, convert PDFs to Excel — all in one click. Press Ctrl+K to access any tool instantly from anywhere in the app.",
                gradient: "from-violet-500/20 to-purple-500/20",
                iconColor: "text-violet-400",
              },
              { 
                icon: ShieldCheck, 
                title: "Reliable & Secure", 
                desc: "Every cleaning, merging, and calculation step is precise and consistent. Your data is encrypted and never used for AI training.",
                gradient: "from-emerald-500/20 to-green-500/20",
                iconColor: "text-emerald-400",
              },
              { 
                icon: Globe, 
                title: "More Than Spreadsheets", 
                desc: "Upload CSV, XLSX, JSON, PDF, or images. Perform seamless cross-file analysis, OCR extraction, and AI-powered data cleaning in one workspace.",
                gradient: "from-blue-500/20 to-cyan-500/20",
                iconColor: "text-blue-400",
              },
            ].map((card, idx) => (
              <div key={idx} className={`group p-8 rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/5 hover:border-white/10 transition-all`}>
                <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BrainCircuit, title: "AI Analysis", desc: "Advanced AI algorithms analyze your data and extract meaningful insights automatically" },
              { icon: BarChart3, title: "Smart Visualizations", desc: "Generate beautiful, interactive charts and graphs with a single click" },
              { icon: FileSpreadsheet, title: "Multi-Format Support", desc: "Import data from CSV, Excel, PDF, JSON, and even images with OCR technology" },
              { icon: Database, title: "Data Integration", desc: "Connect multiple data sources and merge them seamlessly" },
              { icon: ShieldCheck, title: "Data Cleaning Suite", desc: "Smart deduplication, format standardization, and missing value handling" },
              { icon: LineChart, title: "Explain My Data", desc: "Get AI-generated executive summaries with key stats, trends, and anomalies" },
            ].map((feature, idx) => (
              <div key={idx} className="group p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] hover:border-indigo-500/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-slate-400 border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">How It Works</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Three simple steps</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">From raw data to actionable insights in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Drop Your Files", desc: "Drop CSV, Excel, PDF, JSON, or image files. Up to 10 at once, in any format.", icon: "📁" },
              { step: "02", title: "Ask Anything", desc: "Ask questions naturally or use one-click shortcuts. No formulas, no complexity.", icon: "💬" },
              { step: "03", title: "Share the Insights", desc: "Receive instant professional visualizations and polished reports, ready to share.", icon: "📊" },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="text-6xl mb-4">{item.icon}</div>
                <div className="text-5xl font-black text-white/5 mb-2">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 transform translate-x-1/2">
                    <ChevronRight className="h-8 w-8 text-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/5 text-slate-400 border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">FAQ</Badge>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Frequently asked questions</h2>
            <p className="text-slate-400 text-lg">Everything you need to know about DataBrix</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenFaq(openFaq === idx ? null : idx);
                  }}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-bold text-white pr-4 pointer-events-none">{faq.q}</span>
                  <div className="pointer-events-none flex-shrink-0 flex items-center justify-center w-6 h-6">
                    {openFaq === idx ? (
                      <ChevronUp className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 animate-in slide-in-from-top-1 duration-200">
                    <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600/30 via-violet-600/20 to-purple-600/30 border border-indigo-500/20 p-12 md:p-16 text-center overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-indigo-500/20 blur-[100px] rounded-full" />
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Experience modern data analysis</h3>
              <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto font-medium">DataBrix is a technical showcase of automated insights, combining deep-dive AI logic with professional visual storytelling.</p>
              <Link href="/auth/register">
                <Button size="lg" className="h-14 px-10 bg-white text-[#0f1117] hover:bg-slate-100 font-bold text-lg rounded-xl shadow-xl shadow-white/10 transition-all hover:scale-105 group">
                  Get Started <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 bg-[#0a0b10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-6 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                  <span className="text-white text-base font-black">B</span>
                </div>
                <span className="text-xl font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-400 transition-all">DataBrix</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                Designing the future of <span className="text-white">automated data intelligence</span>. Experience the intersection of advanced AI orchestration and visual storytelling.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Navigation</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="#features" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                      <Zap className="w-4 h-4" />
                    </div>
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-colors">
                      <Search className="w-4 h-4" />
                    </div>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Built-in Tools</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/app" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                      <FileImage className="w-4 h-4" />
                    </div>
                    Image → Excel
                  </Link>
                </li>
                <li>
                  <Link href="/app" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    PDF → CSV
                  </Link>
                </li>
                <li>
                  <Link href="/app" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 group-hover:text-violet-400 transition-colors">
                      <Code className="w-4 h-4" />
                    </div>
                    JSON → Excel
                  </Link>
                </li>
                <li>
                  <Link href="/app" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>
                    Merge Files
                  </Link>
                </li>
                <li>
                  <Link href="/app" className="group flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 group-hover:text-amber-400 transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    Smart Cleaning
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/5 flex justify-center">
            <a href="mailto:saxenaprakhar921@gmail.com" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" /> saxenaprakhar921@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
