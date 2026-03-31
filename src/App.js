
import "./App.css";
import { useState, useEffect } from "react";
import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import VerifyCertificate from "./pages/VerifyCertificate.jsx";
import AdminPortal from "./pages/AdminPortal.jsx";
import logo from "./assets/transparent-logo.png";

function BetaBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("credence-beta-dismissed") === "true"
  );
  if (dismissed) return null;
  return (
    <div className="beta-banner">
      <span className="beta-tag">BETA</span>
      <p className="beta-text">
        <strong>Development Phase</strong> — Running on Solana Devnet. This is an experimental platform; data is not permanent and may be reset.
      </p>
      <button
        className="beta-dismiss"
        onClick={() => {
          sessionStorage.setItem("credence-beta-dismissed", "true");
          setDismissed(true);
        }}
        aria-label="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}



function Section({ title, intro, children, className = "" }) {
  return (
    <section className={`section ${className}`}>
      <div className="container">
        {title && <h2 className="section-title">{title}</h2>}
        {intro && <p className="section-intro">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

function CardGrid({ children, columns = 4 }) {
  return (
    <div className={`card-grid card-grid-${columns}`}>
      {children}
    </div>
  );
}

function InfoCard({ number, title, children, variant = "default" }) {
  return (
    <div className={`info-card info-card-${variant}`}>
      {number && <span className="card-number">{number}</span>}
      <h3>{title}</h3>
      {children && <div className="card-content">{children}</div>}
    </div>
  );
}

function CTA({ href, children, variant = "primary" }) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={() => window.location.hash = href}
    >
      {children}
    </button>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "home";
      setCurrentPage(hash.split("/")[0]);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Set initial page

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "student": {
        const studentHash = window.location.hash.split("/")[1];
        return <StudentPortal hash={studentHash} />;
      }
      case "admin":
        return <AdminPortal />;
      case "verify": {
        const hash = window.location.hash.split("/")[1];
        return <VerifyCertificate hash={hash} />;
      }
      default:
        return <HomePage />;
    }
  };

  if (currentPage !== "home") {
    return (
      <div className="app">
        <BetaBanner />
        <Navbar onHome={() => setCurrentPage("home")} />
        {renderPage()}
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <BetaBanner />
      {/* Global Navigation */}
      <Navbar onHome={() => setCurrentPage("home")} />

      {/* Hero Section */}
      <header className="hero hero-grid">
        {/* CENTER — Brand & Value */}
        <div className="hero-main">
          <img
            src={logo}
            className="hero-logo"
            alt="Credence shield logo"
          />

          <div className="hero-desc">
            <span className="hero-bag">Powered by Solana Blockchain</span>
            
          </div>

          <h1 className="hero-title">
            Trust Academic Credentials.
          </h1>

          <p className="hero-subtitle">
            Credence leverages blockchain technology to deliver
            secure, tamper-proof academic certificate verification
            for students, universities, and employers worldwide.
          </p>

          <div className="hero-actions">
            <CTA href="#student" variant="primary">
              Student Portal
            </CTA>
            <CTA href="#admin" variant="secondary">
              University Admin
            </CTA>
            <CTA href="#verify" variant="outline">
              Verify Certificate
            </CTA>
          </div>
        </div>
      </header>

      {/* How It Works Section */}
      <Section 
        title="How Credence Works"
        intro="Credence simplifies academic credential verification through blockchain technology."
        className="how-it-works"
      >
        <CardGrid columns={4}>
          <InfoCard number="1" title="Universities Issue">
            Universities connect their admin wallet and issue digital academic certificates 
            directly on the blockchain. Each certificate is cryptographically signed and tamper-proof.
          </InfoCard>

          <InfoCard number="2" title="Students Receive">
            Students receive their certificates with a unique blockchain hash. 
            They can view, download, or share their credentials anytime.
          </InfoCard>

          <InfoCard number="3" title="Anyone Can Verify">
            Employers, educational institutions, or anyone can instantly verify the authenticity 
            of any certificate using the blockchain hash.
          </InfoCard>

          <InfoCard number="4" title="Immutable Records">
            Once issued, certificates cannot be forged or modified. The blockchain provides 
            a permanent, transparent record of all achievements.
          </InfoCard>
        </CardGrid>
      </Section>

      {/* About Project Section */}
      <Section 
        title="About Credence"
        className="about-project"
      >
        <div className="about-grid">
          <div className="about-column">
            <h3>The Problem</h3>
            <p>
              Traditional academic certificates are paper-based and easily forged. 
              Employers and institutions spend significant time and resources verifying credentials, 
              while students struggle with physical document management.
            </p>

            <h3>Our Solution</h3>
            <p>
              Credence uses the Solana blockchain to create immutable,
              instantly verifiable academic credentials. Our platform eliminates fraud,
              reduces verification time, and gives students complete ownership of their achievements.
            </p>

            <h3>Key Features</h3>
            <ul className="features-list">
              <li>Blockchain-Based: All certificates are recorded on the Solana blockchain</li>
              <li>Tamper-Proof: Cryptographically signed and impossible to forge</li>
              <li>Instant Verification: Verify any certificate in seconds</li>
              <li>Student-Owned: Students maintain complete control of their credentials</li>
              <li>Decentralized: No central authority needed for verification</li>
              <li>Transparent: All stakeholders can verify certificate authenticity</li>
            </ul>
          </div>

          <div className="about-column">
            <h3>For Different Users</h3>

            <div className="user-roles">
              <InfoCard title=" Students" variant="minimal">
                Access your digital certificates anytime, anywhere. Share your achievements securely 
                with employers or educational institutions without worrying about forgery.
              </InfoCard>

              <InfoCard title="Universities" variant="minimal">
                Issue verified academic credentials with minimal effort. Reduce credential verification requests 
                and strengthen your institution's reputation through blockchain.
              </InfoCard>

              <InfoCard title=" Employers" variant="minimal">
                Instantly verify employee credentials on the blockchain. Eliminate the need for traditional 
                background checks and reduce hiring time.
              </InfoCard>
            </div>

            <h3>Technology Stack</h3>
            <ul className="tech-list">
              <li>Smart Contracts: Anchor Framework (Rust)</li>
              <li>Blockchain: Solana Devnet</li>
              <li>Frontend: React.js with Anchor/Web3.js integration</li>
              <li>Wallet: Phantom for secure transactions</li>
              <li>Storage: Solana on-chain + IPFS (Pinata)</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Getting Started Section */}
      <Section 
        title="Get Started Today"
        intro="Choose your role and begin your journey with Credence"
        className="getting-started"
      >
        <CardGrid columns={3}>
          <InfoCard title="I'm a Student" variant="cta">
            View, download, and verify your academic credentials on the blockchain.
            <div className="card-action">
              <CTA href="#student" variant="primary">
                Access Student Portal
              </CTA>
            </div>
          </InfoCard>

          <InfoCard title="I'm from a University" variant="cta">
            Issue verified academic certificates directly to your students.
            <div className="card-action">
              <CTA href="#admin" variant="primary">
                Access Admin Portal
              </CTA>
            </div>
          </InfoCard>

          <InfoCard title="I Want to Verify" variant="cta">
            Verify the authenticity of any academic certificate instantly.
            <div className="card-action">
              <CTA href="#verify" variant="primary">
                Verify Certificate
              </CTA>
            </div>
          </InfoCard>
        </CardGrid>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function HomePage() {
  return (
    <>
      {/* LEFT — Wallet Identity */}
      <div className="hero-wallet">
        <p className="wallet-hint">
          Secure academic credentials verification platform.
        </p>
      </div>
    </>
  );
}

export default App;
