import { useCallback, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './Certificate.css';


export default function Certificate({ cert, onIPFSDownload, onEmailClick, verifyMode = false }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const copyHash = useCallback(() => {
    if (!cert?.hash) return;
    navigator.clipboard.writeText(cert.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cert]);

  useEffect(() => {
    if (!cert?.hash) return;
    const verifyUrl = `${window.location.origin}${window.location.pathname}#verify/${cert.hash}`;
    QRCode.toDataURL(verifyUrl, {
      width: 240,
      margin: 2,
      color: { dark: '#0b1c3d', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [cert?.hash]);

  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `verify-qr-${cert?.hash?.slice(0, 12)}.png`;
    a.click();
  }, [qrDataUrl, cert?.hash]);

  if (!cert) return null;

  return (
    <div className="cert-container">

      {/* Banner */}
      <div className={`cert-banner${verifyMode ? ' cert-banner-verify' : ''}`}>
        <span className="cert-check-icon"></span>
        <div className="cert-banner-text">
          {verifyMode ? (
            <>
              <h2>Certificate Verified ✓</h2>
              <p>Authentic record confirmed on Solana Devnet · Blockchain verified</p>
            </>
          ) : (
            <>
              <h2>Certificate Issued ✓</h2>
              <p>Recorded on Solana Devnet via Anchor · Transaction confirmed</p>
            </>
          )}
        </div>
        {verifyMode && (
          <div className="cert-verified-badge">◎ Solana Devnet</div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="cert-grid">

        {/* Left: Certificate Details */}
        <div className="cert-details-section">
          <h3 className="cert-section-title">Certificate Information</h3>

          <div className="cert-info-list">
            {[
              { label: 'Student Name', value: cert.studentName },
              { label: 'Student Email', value: cert.studentEmail },
              { label: 'Student ID', value: cert.studentId },
              { label: 'Date of Birth', value: cert.dateOfBirth },
              { label: 'University', value: cert.universityName },
              { label: 'Degree', value: cert.degreeTitle },
              { label: 'Degree Level', value: cert.degreeLevel },
              { label: 'Field of Study', value: cert.fieldOfStudy },
              { label: 'Enrollment Date', value: cert.enrollmentDate },
              { label: 'Graduation Date', value: cert.graduationDate },
              { label: 'Passout Year', value: cert.passoutYear },
              { label: 'Issue Date', value: cert.issueDate },
              { label: 'GPA', value: cert.gpa || '—' },
              { label: 'Honors', value: cert.honors || '—' },
              { label: 'Certificate #', value: cert.certificateNumber },
              { label: 'Issued At', value: new Date(cert.issuedAt).toLocaleString() },
              cert.blockchainStatus && { label: 'Blockchain Status', value: cert.blockchainStatus },
            ].filter(Boolean).map(({ label, value }) => (
              <div className="cert-info-row" key={label}>
                <span className="cert-info-label">{label}</span>
                <span className="cert-info-value">{value}</span>
              </div>
            ))}

            {/* IPFS CID */}
            {cert.certificateDocCid && (
              <div className="cert-info-row">
                <span className="cert-info-label">IPFS CID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="cert-info-value mono">{cert.certificateDocCid}</span>
                  {onIPFSDownload && (
                    <button className="cert-copy-btn" onClick={onIPFSDownload} title="Download certificate file from IPFS">
                      ⬇ Download File
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Certificate Hash */}
            <div className="cert-info-row hash-row">
              <span className="cert-info-label">Certificate Hash</span>
              <div className="cert-hash-container">
                <span className="cert-hash-text">{cert.hash}</span>
                <button className="cert-copy-btn" onClick={copyHash} title="Copy hash to clipboard">
                  {copied ? '✓ Copied' : '⎘ Copy'}
                </button>
              </div>
            </div>

            {/* Tx Signature */}
            <div className="cert-info-row">
              <span className="cert-info-label">Tx Signature</span>
              <span className="cert-info-value mono">
                {cert.txSignature && cert.txSignature !== 'On-chain record' ? (
                  <a
                    href={`https://explorer.solana.com/tx/${cert.txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cert.txSignature.slice(0, 20)}… ↗
                  </a>
                ) : cert.txSignature}
              </span>
            </div>

            {/* Certificate PDA */}
            {cert.certificatePda && (
              <div className="cert-info-row">
                <span className="cert-info-label">On-chain Account</span>
                <span className="cert-info-value mono">
                  <a
                    href={`https://explorer.solana.com/address/${cert.certificatePda}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cert.certificatePda.slice(0, 20)}… ↗
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: QR Code */}
        <div className="cert-qr-section">
          <h3 className="cert-section-title">Verification QR Code</h3>
          {qrDataUrl ? (
            <>
              <div className="cert-qr-wrapper">
                <img src={qrDataUrl} alt="Verification QR Code" className="cert-qr-image" />
              </div>
              <p className="cert-qr-caption">Scan to instantly verify this certificate</p>
              <button className="cert-download-qr-btn" onClick={downloadQR}>
                ⬇ Download QR Code
              </button>
            </>
          ) : (
            <div className="cert-qr-placeholder">Generating QR…</div>
          )}
        </div>

      </div>

      {/* Email Student */}
      {onEmailClick && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle, #e5e7eb)' }}>
          <button className="cert-copy-btn" onClick={onEmailClick}>
             Send Certificate to Student
          </button>
        </div>
      )}

    </div>
  );
}
