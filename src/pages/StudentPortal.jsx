import React, { useState, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import Certificate from '../components/Certificate';
import { downloadFromIPFS } from '../services/ipfsService';
import { fetchCertificateByHash } from '../services/anchorService';
import './StudentPortal.css';

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

const StudentPortal = ({ hash: propHash }) => {
  const [hashInput, setHashInput]       = useState(propHash || '');
  const [certificate, setCertificate]   = useState(null);
  const [error, setError]               = useState('');
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [searched, setSearched]         = useState(false);
  const [loading, setLoading]           = useState(false);

  const fetchCertificate = useCallback(async (hash) => {
    const trimmed = hash.trim();
    if (!trimmed) {
      setError('Please enter a certificate hash.');
      return;
    }

    setError('');
    setSearched(true);
    setLoading(true);

    try {
      const onChain = await fetchCertificateByHash(trimmed);
      const cached = getCachedCertificate(trimmed);
      const cert = onChain || cached;

      if (!cert) {
        setCertificate(null);
        setQrDataUrl('');
        setError('No certificate found on-chain for this hash. Please check and try again.');
        return;
      }

      const normalized = {
        ...cert,
        hash: cert.certificateHash || cert.hash || trimmed,
        certificateDocCid: cert.ipfsCid || cert.certificateDocCid || null,
        issuedAt: cert.issuedAt || Date.now(),
        txSignature: cert.txSignature || cert.anchorTxSignature || 'On-chain record',
        blockchainStatus: cert.revoked ? 'revoked' : 'confirmed',
      };

      setCertificate(normalized);

      const verifyUrl = `${window.location.origin}${window.location.pathname}#verify/${normalized.hash}`;
      const qr = normalized.qrCode || await QRCode.toDataURL(verifyUrl, {
        width: 220,
        margin: 2,
        color: { dark: '#0b1c3d', light: '#ffffff' },
      });
      setQrDataUrl(qr);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch certificate.');
      setCertificate(null);
      setQrDataUrl('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propHash) fetchCertificate(propHash);
  }, [propHash, fetchCertificate]);

  const handleView = useCallback(async (e) => {
    e?.preventDefault();
    fetchCertificate(hashInput);
  }, [hashInput, fetchCertificate]);

  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${certificate?.hash?.slice(0, 12)}.png`;
    a.click();
  }, [qrDataUrl, certificate]);

  /* ── Download from IPFS ── */
  const downloadFromIPFSHandler = useCallback(() => {
    if (!certificate?.certificateDocCid) return;
    
    try {
      const filename = `certificate-${certificate.studentName.replace(/\s+/g, '-')}.pdf`;
      downloadFromIPFS(certificate.certificateDocCid, filename);
    } catch (err) {
      console.error('IPFS download error:', err);
      alert('Failed to download certificate. Please try again.');
    }
  }, [certificate]);

  /* ─────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────── */
  return (
    <div className="student-portal-v2">

      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-inner">
          <div className="sp-header-icon"></div>
          <div>
            <h1>Student Portal</h1>
            <p>View and download your blockchain-verified certificate</p>
          </div>
        </div>
      </div>

      <div className="sp-content">

        {/* Search Card */}
        <div className="sp-card">
          <h2 className="sp-card-title">
            <span className="section-accent-sp" />
            Find Your Certificate
          </h2>
          <p className="sp-card-desc">
            Enter the certificate hash you received from your university to view and
            download your verified academic credential.
          </p>

          <form onSubmit={handleView} className="sp-form">
            <div className="sp-input-row">
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Paste your certificate hash here…"
                className="sp-hash-input"
                autoComplete="off"
                spellCheck="false"
              />
              <button type="submit" className="btn-view-cert">
                {loading ? 'Fetching…' : '🔍 View Certificate'}
              </button>
            </div>
          </form>

          {error && <div className="sp-error">{error}</div>}
        </div>

        {/* Certificate Display */}
        {certificate && (
          <div className="sp-card">
            {/* Use Certificate component for display */}
            <Certificate cert={certificate} onEmailClick={() => {}} onIPFSDownload={downloadFromIPFSHandler} />

            {/* Additional Student Portal Downloads */}
            {qrDataUrl && (
              <div className="sp-extra-downloads" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 700 }}>Download Options</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-download-qr-sp" onClick={downloadQR}>
                    ⬇ Download QR Code
                  </button>
                  {certificate?.certificateDocCid && (
                    <button className="btn-download-qr-sp" onClick={downloadFromIPFSHandler}>
                      ⬇ Download Certificate File
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {!certificate && !searched && (
          <div className="sp-info-cards">
            {[
              { icon: '🔑', title: 'Enter Your Hash', desc: 'Use the unique certificate hash provided by your university to look up your credential.' },
              { icon: '📋', title: 'View Details',    desc: 'See all certificate information including degree, institution, and blockchain verification.' },
              { icon: '⬇',  title: 'Download',        desc: 'Download a printable HTML certificate and QR code to share with employers.' },
            ].map((item) => (
              <div className="sp-info-card" key={item.title}>
                <div className="sp-info-icon">{item.icon}</div>
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

export default StudentPortal;
