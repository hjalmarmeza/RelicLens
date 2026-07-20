"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import RelicVault from "@/components/RelicVault";

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);
  const [activeTab, setActiveTab] = useState<"scanner" | "vault">("scanner");

  if (!hasEntered) {
    return (
      <main className="splash-screen animate-fade-in">
        <div className="splash-content">
          <div className="logo-container pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/RelicLens.jpg" alt="RelicLens Logo" className="logo-image" />
          </div>
          <h1 className="splash-title">RelicLens</h1>
          <p className="splash-subtitle">Revela el valor oculto a simple vista</p>
          
          <button className="btn-primary mt-8" onClick={() => setHasEntered(true)}>
            Entrar a la Bóveda
          </button>
        </div>
        <style jsx>{`
          .splash-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
          }
          .splash-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 400px;
          }
          .logo-container {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid var(--accent-main);
            box-shadow: 0 0 30px rgba(234, 179, 8, 0.4);
            margin-bottom: 2rem;
          }
          .logo-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .splash-title {
            font-size: 3rem;
            margin-bottom: 0.5rem;
          }
          .splash-subtitle {
            font-size: 1.1rem;
            color: var(--accent-light);
          }
          .mt-8 {
            margin-top: 3rem;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="app-main">
      <header style={{ marginBottom: "2rem", textAlign: "center" }}>
        <h1 className="animate-fade-in" style={{ marginBottom: "0" }}>RelicLens</h1>
        
        <div className="tab-nav animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <button 
            className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            📸 Escanear
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            🏛️ La Bóveda
          </button>
        </div>
      </header>

      <section style={{ display: "flex", justifyContent: "center", width: "100%", animationDelay: "0.2s" }}>
        {activeTab === 'scanner' ? <ImageUploader /> : <RelicVault />}
      </section>
      <style jsx>{`
        .app-main {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .tab-nav {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.5rem;
          border-radius: 30px;
          border: 1px solid var(--glass-border);
          display: inline-flex;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.8rem 1.5rem;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .tab-btn:hover {
          color: var(--text-primary);
        }
        .tab-btn.active {
          background: var(--accent-main);
          color: #000;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </main>
  );
}
