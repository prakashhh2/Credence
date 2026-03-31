import { useState, useCallback, useEffect } from 'react';
import Certificate from '../components/Certificate';
import { fetchCertificateByHash } from '../services/anchorService';
import './VerifyCertificate.css';

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function getCachedCertificate(hash) {
  if (!hash) return null;
  const certs = JSON.parse(localStorage.getItem('credence_certs') || '{}');
  return certs[hash.trim()] || null;
}

/* ─────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────── */

const VerifyCertificate = ({ hash: propHash }) => {
  const [hashInput, setHashInput]     = useState(propHash || '');
  const [certificate, setCertificate] = useState(null);
  const [status, setStatus]           = useState('idle'); // idle | verified | invalid
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  /* Auto-verify if hash comes via URL */
  useEffect(() => {
    if (propHash) {
      verifyHash(propHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propHash]);

  const verifyHash = useCallback(async (hash) => {
    const trimmed = (hash || '').trim();
    if (!trimmed) {
      setError('Please enter a certificate hash.');
      setStatus('idle');
      setCertificate(null);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const onChain = await fetchCertificateByHash(trimmed);
      const cached = getCachedCertificate(trimmed);
      const cert = onChain || cached;

      if (cert) {
        const normalized = {
          ...cert,
          hash: cert.certificateHash || cert.hash || trimmed,
          certificateDocCid: cert.ipfsCid || cert.certificateDocCid || null,
          issuedAt: cert.issuedAt || Date.now(),
          txSignature: cert.txSignature || cert.anchorTxSignature || 'On-chain record',
          blockchainStatus: cert.revoked ? 'revoked' : 'confirmed',
        };
        setCertificate(normalized);
        setStatus(normalized.revoked ? 'invalid' : 'verified');
      } else {
        setCertificate(null);
        setStatus('invalid');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setCertificate(null);
      setStatus('invalid');
      setError(err.message || 'Failed to verify certificate.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    verifyHash(hashInput);
  }, [hashInput, verifyHash]);

  /* ─────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────── */
  return (
    <div className="vp-page">

      {/* Header */}
      <div className="vp-header">
        <div className="vp-header-inner">
          <div className="vp-header-icon"></div>
          <div>
            <h1>Verify Certificate</h1>
            <p>Instantly verify the authenticity of any academic credential</p>
          </div>
        </div>
      </div>

      <div className="vp-content">

        {/* Search Card */}
        <div className="vp-card search-card">
          <h2 className="vp-card-title">
            <span className="vp-section-accent" />
            Enter Certificate Hash
          </h2>
          <p className="vp-card-desc">
            Paste the SHA-256 certificate hash to verify its authenticity on the
            Solana Devnet blockchain. No login required.
          </p>

          <form onSubmit={handleSubmit} className="vp-form">
            <div className="vp-input-row">
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter certificate hash (SHA-256)…"
                className="vp-hash-input"
                autoComplete="off"
                spellCheck="false"
              />
              <button type="submit" className="btn-verify">
                {loading ? 'Verifying…' : '✓ Verify'}
              </button>
            </div>
          </form>

          {error && <div className="vp-error">{error}</div>}
        </div>

        {/* Result — Verified */}
        {status === 'verified' && certificate && (
          <div className="vp-verified-outer">

            {/* Trust strip */}
            <div className="vp-trust-strip">
              <div className="vp-trust-checkmark">✓</div>
              <div className="vp-trust-copy">
                <strong>Blockchain Verified</strong>
                <span>This certificate is authentic and has not been tampered with</span>
              </div>
              <div className="vp-trust-chips">
                <span className="vp-chip vp-chip-solana">◎ Solana Devnet</span>
                <span className="vp-chip vp-chip-anchor">⚓ Anchor</span>
                <span className="vp-chip vp-chip-secure">🔒 Tamper-Proof</span>
                <span className="vp-chip vp-chip-time">
                  Verified {new Date().toLocaleString()}
                </span>
              </div>
            </div>

            <Certificate cert={certificate} onEmailClick={() => {}} verifyMode={true} />

            {/* Footer proof bar */}
            <div className="vp-proof-bar">
              <span className="vp-proof-label">Certificate Hash</span>
              <code className="vp-proof-hash">{certificate.hash}</code>
              <a
                className="vp-proof-explorer-link"
                href={`https://explorer.solana.com/?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Solana Explorer ↗
              </a>
            </div>

          </div>
        )}

        {/* Result — Invalid */}
        {status === 'invalid' && (
          <div className="vp-card result-card-invalid">
            <div className="vp-result-banner invalid-banner">
              <div className="result-status-icon">❌</div>
              <div>
                <h2>Certificate Not Found</h2>
                <p>No matching certificate was found for this hash.</p>
              </div>
            </div>
            <ul className="vp-invalid-hints">
              <li>Check that you copied the full hash without extra spaces.</li>
              <li>The certificate may not have been issued through this platform.</li>
              <li>Contact the issuing university to confirm the hash.</li>
            </ul>
          </div>
        )}

        {/* How it works — idle state */}
        {status === 'idle' && (
          <div className="vp-how-grid">
            {[
              { step: '1', title: 'Obtain the Hash',  desc: 'Get the SHA-256 certificate hash from your university or from the student.' },
              { step: '2', title: 'Enter & Verify',   desc: 'Paste the hash above and click "Verify" for an instant authenticity check.' },
              { step: '3', title: 'View Results',     desc: 'See full certificate details, blockchain record, and the unique QR code.' },
            ].map((item) => (
              <div className="vp-how-card" key={item.step}>
                <div className="vp-step-circle">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyCertificate;
