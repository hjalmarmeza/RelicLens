"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ImageUploader = dynamic(() => import("@/components/ImageUploader"), { ssr: false });
const RelicVault = dynamic(() => import("@/components/RelicVault"), { ssr: false });

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
      
    </main>
  );
}
