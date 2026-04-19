import React, { useState, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import Certificate from '../components/Certificate';
import { uploadToPinata } from '../services/ipfsService';

import { createCertificate } from '../services/anchorService';
import './AdminPortal.css';

// Helper functions

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function storeCertificate(cert) {
  const certs = JSON.parse(localStorage.getItem('credence_certs') || '{}');
  certs[cert.hash] = cert;
  localStorage.setItem('credence_certs', JSON.stringify(certs));
}


const CERT_FIELDS = [
  { id: 'studentName',       label: 'Student Name',               placeholder: 'e.g. Prakash Kusari',                  required: true,  type: 'text'     },
  { id: 'studentEmail',      label: 'Student Email',              placeholder: 'e.g. prakash@university.edu',         required: true,  type: 'email'    },
  { id: 'studentId',         label: 'Student ID',                 placeholder: 'e.g. W0728728927',              required: true,  type: 'text'     },
  { id: 'dateOfBirth',       label: 'Date of Birth',              placeholder: '',                                 required: true,  type: 'date'     },
  { id: 'degreeTitle',       label: 'Degree / Certificate Title', placeholder: 'e.g. Bachelor of Science',        required: true,  type: 'text'     },
  { id: 'degreeLevel',       label: 'Degree Level',               placeholder: '',                                 required: true,  type: 'select',  options: ['Certificate', 'Diploma', 'Associate', 'Bachelor', 'Master', 'Doctorate', 'Postdoctoral'] },
  { id: 'fieldOfStudy',      label: 'Field of Study',             placeholder: 'e.g. Computer Science',            required: true,  type: 'text'     },
  { id: 'enrollmentDate',    label: 'Enrollment Date',            placeholder: '',                                 required: true,  type: 'date'     },
  { id: 'graduationDate',    label: 'Graduation Date',            placeholder: '',                                 required: true,  type: 'date'     },
  { id: 'issueDate',         label: 'Certificate Issue Date',     placeholder: '',                                 required: true,  type: 'date'     },
  { id: 'gpa',               label: 'GPA / CGPA',                 placeholder: 'e.g. 3.85',                        required: false, type: 'text'     },
  { id: 'honors',            label: 'Honors / Distinction',       placeholder: 'e.g. Summa Cum Laude',             required: false, type: 'text'     },
  { id: 'certificateNumber', label: 'Certificate Number',         placeholder: 'e.g. CERT-2024-00123',             required: true,  type: 'text'     },
];

// main component

export default function AdminPortal() {
  const [universityName, setUniversityName] = useState(localStorage.getItem('credence_uni_name') || '');
  const [universityInput, setUniversityInput] = useState(localStorage.getItem('credence_uni_name') || '');
  const [universityError, setUniversityError] = useState('');

  const [form, setForm] = useState({
    studentName: '', studentEmail: '', studentId: '', dateOfBirth: '',
    degreeTitle: '', degreeLevel: 'Bachelor', fieldOfStudy: '',
    enrollmentDate: '', graduationDate: '',
    issueDate: new Date().toISOString().split('T')[0],
    gpa: '', honors: '', certificateNumber: '',
  });

// pantom wallet states
  const [wallet, setWallet]               = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError]     = useState('');

// pinata upload states
  const [certFile, setCertFile]                   = useState(null);
  const [certFileCid, setCertFileCid]             = useState('');
  const [uploadingCertFile, setUploadingCertFile] = useState(false);
  const [uploadError, setUploadError]             = useState('');
  const certFileInputRef = useRef(null);

  const [issuing, setIssuing]     = useState(false);
  const [formError, setFormError] = useState('');
  const [result, setResult]       = useState(null);

  /// Phantom Wallet Connection 
  const connectWallet = useCallback(async () => {
    setWalletError('');
    setWalletLoading(true);
    try {
      if (!window.solana?.isPhantom) {
        throw new Error('Phantom wallet not installed. Please install from https://phantom.app');
      }
      
      const response = await window.solana.connect();
      const walletAddress = response.publicKey.toBase58();
      setWallet(walletAddress);
      console.log(' Connected to Phantom:', walletAddress);
    } catch (err) {
      setWalletError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      if (window.solana?.disconnect) {
        await window.solana.disconnect();
      }
      setWallet(null);
      setResult(null);
      setWalletError('');
      console.log(' Disconnected from Phantom');
    } catch (err) {
      console.error('Wallet disconnect error:', err);
    }
  }, []);

  const uploadFileToPinata = useCallback(async (file) => {
    if (!file) throw new Error('No file selected');
    try {
      const cid = await uploadToPinata(file, file.name);
      return cid;
    } catch (err) {
      throw new Error(`Failed to upload to IPFS: ${err.message}`);
    }
  }, []);

  const handleCertFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCertFile(file);
    setUploadingCertFile(true);
    setUploadError('');
    try {
      const cid = await uploadFileToPinata(file);
      setCertFileCid(cid);
      console.log(' Certificate uploaded to IPFS:', cid);
    } catch (err) {
      const errorMsg = err.message || 'Unknown upload error';
      console.error(' File upload failed:', err);
      setUploadError(errorMsg);
      setCertFile(null);
    } finally {
      setUploadingCertFile(false);
    }
  }, [uploadFileToPinata]);

  const removeCertFile = useCallback(() => {
    setCertFile(null);
    setCertFileCid('');
    setUploadError('');
  }, []);

  /* ── Form Handlers ── */
  const handleChange = (id, value) => setForm((f) => ({ ...f, [id]: value }));

  const saveUniversityName = useCallback((e) => {
    e.preventDefault();
    const trimmed = universityInput.trim();
    if (!trimmed) {
      setUniversityError('Please enter your university or college name.');
      return;
    }
    localStorage.setItem('credence_uni_name', trimmed);
    setUniversityName(trimmed);
    setUniversityError('');
  }, [universityInput]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');

    if (!wallet) {
      setFormError('Please connect your Phantom wallet first.');
      return;
    }

    if (!universityName.trim()) {
      setFormError('Please save your institution name above before issuing a certificate.');
      return;
    }

    for (const f of CERT_FIELDS) {
      if (f.required && !form[f.id]?.trim()) {
        setFormError(`Please fill in "${f.label}".`);
        return;
      }
    }

    if (!certFileCid) {
      setFormError('Please upload a certificate PDF document.');
      return;
    }

    setIssuing(true);
    try {
      const passoutYear = new Date(form.graduationDate).getFullYear();
      if (!Number.isFinite(passoutYear)) {
        setFormError('Graduation Date is invalid.');
        setIssuing(false);
        return;
      }

      // Generate certificate hash
      const payload = JSON.stringify({
        ...form,
        universityName,
        passoutYear,
        issuedAt: new Date().toISOString(),
        certificateDocCid: certFileCid || null,
      });
      const hash = await sha256(payload);

      // Issue certificate on Anchor/Solana
      console.log('⛓ Creating certificate on-chain via Anchor...');
      const chainResult = await createCertificate({
        studentName: form.studentName,
        dateOfBirth: form.dateOfBirth,
        universityName,
        passoutYear,
        fieldOfStudy: form.fieldOfStudy,
        gpa: form.gpa || '',
        degreeTitle: form.degreeTitle,
        studentId: form.studentId,
        issueDate: form.issueDate,
        certificateHash: hash,
        ipfsCid: certFileCid || '',
      });


      // Generate QR code for verification
      const verifyUrl = `${window.location.origin}${window.location.pathname}#student/${hash}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 280, margin: 2,
        color: { dark: '#0b1c3d', light: '#ffffff' },
      });

      const cert = {
        hash,
        qrCode: qrDataUrl,
        issuedAt: Date.now(),
        universityName,
        certificateDocCid: certFileCid || null,
        txSignature: chainResult.txSignature,
        certificatePda: chainResult.certificatePda,
        blockchainStatus: 'confirmed',
        passoutYear,
        ...form,
      };

      storeCertificate(cert);
      setResult(cert);

      setForm({
        studentName: '', studentEmail: '', studentId: '', dateOfBirth: '',
        degreeTitle: '', degreeLevel: 'Bachelor', fieldOfStudy: '',
        enrollmentDate: '', graduationDate: '',
        issueDate: new Date().toISOString().split('T')[0],
        gpa: '', honors: '', certificateNumber: '',
      });
      setCertFile(null);
      setCertFileCid('');
    } catch (err) {
      setFormError('Failed to create certificate: ' + err.message);
    } finally {
      setIssuing(false);
    }
  }, [wallet, form, universityName, certFileCid]);

 
  const buildMailto = (cert) => {
    const subject = encodeURIComponent(`Your Certificate from ${cert.universityName}`);
    const verifyUrl = `${window.location.origin}${window.location.pathname}#student/${cert.hash}`;
    const body = encodeURIComponent(
      `Dear ${cert.studentName},\n\nCongratulations! Your academic certificate has been issued.\n\nCertificate Hash:\n${cert.hash}\n\nVerify Online:\n${verifyUrl}\n\nIssued by: ${cert.universityName}\nDegree: ${cert.degreeTitle} (${cert.degreeLevel}) — ${cert.fieldOfStudy}\nIssue Date: ${cert.issueDate}\n\nBest regards,\n${cert.universityName}`
    );
    return `mailto:${cert.studentEmail}?subject=${subject}&body=${body}`;
  };

 
  const handleEmailClick = useCallback(() => {
    if (!result) return;
    const mailtoLink = buildMailto(result);
    window.open(mailtoLink);
  }, [result]);

  
  return (
    <div className="univ-portal">

      {/* Header */}
      <div className="univ-header">
        <div className="univ-header-inner">
          <div className="univ-header-icon"></div>
          <div>
            <h1>{universityName || 'University Admin Portal'}</h1>
            <p>Issue Solana blockchain certificates via Anchor</p>
          </div>
        </div>
      </div>

      <div className="univ-content">

        {/* University Registration Form (non-blocking) */}
        <div className="univ-card university-card">
          <div className="card-label">
            <span className="label-dot solana-dot" />
            Institution Profile
          </div>
          <form className="university-form-inline" onSubmit={saveUniversityName}>
            <div className="form-group">
              <label htmlFor="universityName">University / College Name</label>
              <input
                id="universityName"
                type="text"
                value={universityInput}
                onChange={(e) => {
                  setUniversityInput(e.target.value);
                  setUniversityError('');
                }}
                placeholder="e.g. Harvard University"
              />
            </div>
            <button type="submit" className="btn-ghost-sm">Save Institution</button>
          </form>
          {universityError && <p className="error-inline">{universityError}</p>}
        </div>

        {/* Wallet Connection Card */}
        <div className="univ-card wallet-card">
          <div className="card-label">
            <span className="label-dot anchor-dot" />
            Anchor Wallet · Phantom
          </div>

          {wallet ? (
            <div className="wallet-connected-row">
              <div className="wallet-address-chip">
                <span className="wallet-dot-green" />
                <span className="wallet-mono">{wallet.slice(0, 8)}…{wallet.slice(-6)}</span>
                <span className="wallet-full" title={wallet}>{wallet}</span>
              </div>
              <button className="btn-ghost-sm" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="wallet-disconnected-row">
              <p className="wallet-hint-text">
                Connect your Phantom wallet to issue certificates on Solana via Anchor.
              </p>
              <button className="btn-phantom" onClick={connectWallet} disabled={walletLoading}>
                {walletLoading
                  ? <><span className="spinner" /> Connecting…</>
                  : <><span className="phantom-icon"></span> Connect Phantom</>}
              </button>
              {walletError && <p className="error-inline">{walletError}</p>}
            </div>
          )}
        </div>

        {/* Issue Form */}
        <div className="univ-card form-card">
          <h2 className="card-section-title">
            <span className="section-accent" />
            Certificate Details
          </h2>

          <form onSubmit={handleSubmit} className="univ-form">
            <div className="form-grid">
              {CERT_FIELDS.map((f) => (
                <div
                  key={f.id}
                  className={`form-group${f.id === 'description' ? ' full-width' : ''}`}
                >
                  <label htmlFor={f.id}>
                    {f.label}
                    {f.required && <span className="required-star"> *</span>}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      id={f.id}
                      value={form[f.id]}
                      onChange={(e) => handleChange(f.id, e.target.value)}
                      required={f.required}
                    >
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      id={f.id}
                      value={form[f.id]}
                      onChange={(e) => handleChange(f.id, e.target.value)}
                      placeholder={f.placeholder}
                      required={f.required}
                      rows={3}
                    />
                  ) : (
                    <input
                      id={f.id}
                      type={f.type}
                      value={form[f.id]}
                      onChange={(e) => handleChange(f.id, e.target.value)}
                      placeholder={f.placeholder}
                      required={f.required}
                      autoComplete="off"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Certificate Document Upload (Pinata IPFS) */}
            <div className="file-upload-section">
              <h3 className="upload-section-title"> Certificate Document (Pinata IPFS)</h3>
              <div className="file-upload-group">
                <label>
                  Certificate PDF <span className="required-star"> *</span>
                </label>
                <div className="file-upload-area">
                  {certFile ? (
                    <div className="file-preview">
                      <span className="file-name">{certFile.name}</span>
                      {uploadingCertFile
                        ? <span className="uploading-badge"><span className="spinner" /> Uploading to IPFS…</span>
                        : certFileCid
                          ? <span className="cid-badge">✓ CID: {certFileCid.slice(0, 16)}…</span>
                          : null}
                      <button type="button" className="btn-remove-file" onClick={removeCertFile}>✕</button>
                    </div>
                  ) : (
                    <div className="file-drop-zone" onClick={() => certFileInputRef.current?.click()}>
                      <span className="upload-icon"></span>
                      <span>Click to upload certificate document</span>
                      <span className="file-hint">PDF (Max 10MB) · Will be stored on IPFS</span>
                    </div>
                  )}
                  <input
                    ref={certFileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleCertFileChange}
                    hidden
                  />
                </div>
                {uploadError && <p className="error-inline"> Upload failed: {uploadError}</p>}
              </div>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <button
              type="submit"
              className={`btn-issue${!wallet ? ' btn-disabled' : ''}`}
              disabled={issuing || !wallet}
            >
              {issuing
                ? <><span className="spinner" /> Issuing on Anchor…</>
                : '⛓ Issue Certificate on Anchor'}
            </button>

            {!wallet && (
              <p className="form-wallet-reminder">Connect your Phantom wallet above to enable issuance.</p>
            )}
          </form>
        </div>

        {/* Result: Certificate Issued */}
        {result && <Certificate cert={result} onEmailClick={handleEmailClick} />}
      </div>
    </div>
  );
}
