import React from 'react';
import { BarChart3, Layers, Database, Key, Check, BookOpen, ArrowRight } from 'lucide-react';

export default function LandingPage({ onLogin, onGetStarted }) {
  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <div className="landing-logo-icon">tl</div>
          <span className="landing-logo-text">TokenLens</span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn-nav-login" onClick={onLogin}>Login</button>
          <button className="btn-nav-primary" onClick={onGetStarted}>Get Started</button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="landing-hero">
        {/* Left Column (Content) */}
        <div className="landing-hero-left">
          <h1 className="landing-hero-title">
            <span>Chat with LLMs.</span>
            <span className="landing-gradient-text-1">See every token.</span>
            <span className="landing-gradient-text-2">Know every cost.</span>
          </h1>

          <p className="landing-hero-desc">
            LLM transparency tools that dissect your inputs and outputs to capture real-time execution costs and metrics.
          </p>

          <div className="landing-hero-list">
            <div className="landing-hero-item">
              <div className="landing-hero-bullet"></div>
              <span>Gemma via Ollama & GPT-4o-mini via OpenAI</span>
            </div>
            <div className="landing-hero-item">
              <div className="landing-hero-bullet"></div>
              <span>Multimodal input (PDFs, Images)</span>
            </div>
            <div className="landing-hero-item">
              <div className="landing-hero-bullet"></div>
              <span>Persistent memory across sessions</span>
            </div>
            <div className="landing-hero-item">
              <div className="landing-hero-bullet"></div>
              <span>Developer API with tl- keys for agents</span>
            </div>
          </div>

          <div className="landing-hero-btns">
            <button className="btn-hero-primary" onClick={onGetStarted}>
              Get Started for Free
            </button>
            <button className="btn-hero-outline" onClick={() => alert('Documentation page coming soon!')}>
              View Docs
            </button>
          </div>
        </div>

        {/* Right Column (Features Card Grid) */}
        <div className="landing-hero-right">
          <div className="landing-features-box">
            <div className="landing-features-grid">
              
              {/* Card 1: Full Token Transparency */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <BarChart3 size={20} />
                </div>
                <h3>Full Token Transparency</h3>
                <p>
                  Track input/output tokens, latency, and cost in USD and INR per request
                </p>
              </div>

              {/* Card 2: Multimodal Input */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Layers size={20} />
                </div>
                <h3>Multimodal Input</h3>
                <p>
                  Upload PDFs and images — bring your documents into the conversation
                </p>
              </div>

              {/* Card 3: Persistent Memory */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Database size={20} />
                </div>
                <h3>Persistent Memory</h3>
                <p>
                  Chats and context persist across sessions — pick up right where you left off
                </p>
              </div>

              {/* Card 4: Developer API */}
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrapper">
                  <Key size={20} />
                </div>
                <h3>Developer API</h3>
                <p>
                  Generate tl- API keys and proxy LLM calls through TokenLens with full logging
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
