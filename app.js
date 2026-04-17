const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let selectedOption = 'single';
let proModeActive = false;

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
},{threshold:0.1});
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

function validateEmail(input, errId) {
  const v = input.value.trim();
  const err = document.getElementById(errId);
  if (v && !emailRx.test(v)) {
    input.classList.add('error');
    err.textContent = 'Enter a valid email address';
    err.classList.add('show');
    return false;
  }
  input.classList.remove('error');
  err.classList.remove('show');
  return true;
}

function getData() {
  return {
    yourName: document.getElementById('your-name').value.trim(),
    yourEmail: document.getElementById('your-email').value.trim(),
    yourBusiness: document.getElementById('your-business').value.trim(),
    clientName: document.getElementById('client-name').value.trim(),
    clientEmail: document.getElementById('client-email').value.trim(),
    deliverables: document.getElementById('deliverables').value.trim(),
    deadline: document.getElementById('deadline').value,
    revisions: document.getElementById('revisions').value,
    extraRevision: document.getElementById('extra-revision').value.trim(),
    price: document.getElementById('price').value,
    currency: document.getElementById('currency').value,
    paymentTerms: document.getElementById('payment-terms').value,
  };
}

function formatDeadline(dd) {
  if (!dd) return '—';
  const d = new Date(dd + 'T00:00:00');
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
}

function liveUpdate() {
  const d = getData();
  const dn = d.yourBusiness ? `${d.yourName} (${d.yourBusiness})` : d.yourName;
  document.getElementById('p-your-name').textContent = dn || '—';
  document.getElementById('p-your-email').textContent = d.yourEmail || '—';
  document.getElementById('p-client-name').textContent = d.clientName || '—';
  document.getElementById('p-client-email').textContent = d.clientEmail || '—';
  document.getElementById('p-deliverables').textContent = d.deliverables || '—';
  document.getElementById('p-revisions').textContent = d.revisions || '—';
  document.getElementById('p-extra').textContent = d.extraRevision || 'N/A';
  document.getElementById('p-terms').textContent = d.paymentTerms || '—';
  document.getElementById('p-deadline').textContent = formatDeadline(d.deadline);
  document.getElementById('p-total').textContent = d.price ? d.currency + parseFloat(d.price).toLocaleString() : '—';
  document.getElementById('p-ref').textContent = 'REF: QS-' + Math.floor(100000 + Math.random()*900000);
  if (d.yourName) document.getElementById('p-sig1').textContent = d.yourName + ' signature';
  if (d.clientName) document.getElementById('p-sig2').textContent = d.clientName + ' signature';
  const delivCount = document.getElementById('deliverables-count');
  if (delivCount) {
    const len = d.deliverables.length;
    delivCount.textContent = `${len} / 500`;
    delivCount.className = 'char-count' + (len > 500 ? ' over' : len > 400 ? ' warning' : '');
  }
  // Auto-save draft (skip if we just restored from payment)
  if (!sessionStorage.getItem('qs_skip_autosave')) {
    const draft = getData();
    if (draft.yourName || draft.clientName || draft.deliverables) {
      localStorage.setItem('qs_draft', JSON.stringify(draft));
    }
  }
}

function showErr(id, msg) {
  const e = document.getElementById('err-'+id);
  const i = document.getElementById(id);
  if(e){e.textContent=msg;e.classList.add('show');}
  if(i) i.classList.add('error');
}
function clearErr(id) {
  const e = document.getElementById('err-'+id);
  const i = document.getElementById(id);
  if(e) e.classList.remove('show');
  if(i) i.classList.remove('error');
}

function validateFields() {
  let ok = true;
  ['your-name','client-name','deliverables','deadline','revisions','price','payment-terms'].forEach(id => {
    const el = document.getElementById(id);
    if (!el||!el.value.trim()){showErr(id,'Required');ok=false;}
    else clearErr(id);
  });
  const ye = document.getElementById('your-email');
  const ce = document.getElementById('client-email');
  if (!ye.value.trim()){showErr('your-email','Required');ok=false;}
  else if (!emailRx.test(ye.value.trim())){showErr('your-email','Enter a valid email');ye.classList.add('error');ok=false;}
  else clearErr('your-email');
  if (!ce.value.trim()){showErr('client-email','Required');ok=false;}
  else if (!emailRx.test(ce.value.trim())){showErr('client-email','Enter a valid email');ce.classList.add('error');ok=false;}
  else clearErr('client-email');
  return ok;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function copyRef() {
  const ref = document.getElementById('p-ref').textContent;
  navigator.clipboard.writeText(ref).then(() => {
    const btn = document.getElementById('copy-ref-btn');
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = '⎘'; }, 1500);
  });
}

function restoreDraft() {
  const saved = localStorage.getItem('qs_draft');
  if (!saved) return;
  const d = JSON.parse(saved);
  document.getElementById('your-name').value = d.yourName || '';
  document.getElementById('your-email').value = d.yourEmail || '';
  document.getElementById('your-business').value = d.yourBusiness || '';
  document.getElementById('client-name').value = d.clientName || '';
  document.getElementById('client-email').value = d.clientEmail || '';
  document.getElementById('deliverables').value = d.deliverables || '';
  document.getElementById('deadline').value = d.deadline || '';
  document.getElementById('revisions').value = d.revisions || '';
  document.getElementById('extra-revision').value = d.extraRevision || '';
  document.getElementById('price').value = d.price || '';
  document.getElementById('currency').value = d.currency || '$';
  document.getElementById('payment-terms').value = d.paymentTerms || '';
  liveUpdate();
  document.getElementById('restore-banner').style.display = 'none';
  localStorage.removeItem('qs_draft');
}

function dismissDraft() {
  localStorage.removeItem('qs_draft');
  document.getElementById('restore-banner').style.display = 'none';
}

function getShareURL() {
  const d = getData();
  const encoded = btoa(JSON.stringify(d));
  return window.location.origin + window.location.pathname + '?preview=' + encoded;
}

function sharePreview() {
  if (!validateFields()) return;
  const url = getShareURL();
  navigator.clipboard.writeText(url).then(() => {
    showToast('Preview link copied to clipboard ✓');
  }).catch(() => {
    prompt('Copy this link:', url);
  });
}

function validateAndDownloadFree() {
  if (!validateFields()) {
    document.querySelector('.form-stack').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  downloadPDF(true);
}

function validateAndPay() {
  if (!validateFields()) {
    document.querySelector('.form-stack').scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  localStorage.setItem('qs_pending_download', JSON.stringify(getData()));
  window.open('https://www.paypal.com/ncp/payment/9ACCD7USDTAGW', '_blank');
}

function validateAndShowModal() {
  validateAndPay();
}

function showProModal() {
  document.getElementById('overlay-pro').classList.add('open');
}

function closeModals() {
  document.getElementById('overlay-single').classList.remove('open');
  document.getElementById('overlay-pro').classList.remove('open');
}

function selectOption(opt) {
  selectedOption = opt;
  document.getElementById('opt-free').classList.toggle('selected', opt === 'free');
  document.getElementById('opt-single').classList.toggle('selected', opt === 'single');
  document.getElementById('opt-pro-upsell').classList.toggle('selected', opt === 'pro');
  const labels = { free: 'Download free (watermarked) →', single: 'Pay $4 & download →', pro: 'Start Pro — $9/month →' };
  document.getElementById('pay-btn-label').textContent = labels[opt];
}

function handlePayment() {
  if (selectedOption === 'pro') { closeModals(); showProModal(); return; }
  if (selectedOption === 'free') { closeModals(); downloadPDF(true); return; }
  closeModals();
  downloadPDF(false);
}

function handleProPayment() {
  closeModals();
  // Save form data before leaving
  localStorage.setItem('qs_pending_download', JSON.stringify(getData()));
  window.open('https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-7EC30041BD813483SNHEYCNQ', '_blank');
}

function enableProFeatures() {
  proModeActive = true;
  // Remove watermark from preview
  const wm = document.querySelector('.watermark');
  if (wm) wm.style.display = 'none';
  // Update download buttons to show Pro is active
  const proBtn = document.querySelector('.dl-btn-pro');
  if (proBtn) {
    proBtn.innerHTML = '★ Pro active — unlimited clean PDFs';
    proBtn.style.background = 'var(--green-soft)';
    proBtn.style.color = 'var(--green)';
    proBtn.style.borderColor = '#bbf7d0';
    proBtn.onclick = () => { if(validateFields()) downloadPDF(false); };
  }
  // Show a welcome message
  const note = document.querySelector('.dl-free-note');
  if (note) note.textContent = '✓ Pro active — unlimited watermark-free downloads enabled';
  // Store pro status in localStorage so it persists during session
  localStorage.setItem('qs_pro', 'true');
}



function enableProFeatures() {
  if (proModeActive) return;
  proModeActive = true;
  window.qsProAccess = true;
  localStorage.setItem('qs_pro_access', 'true');
  document.body?.classList.add('qs-pro-active');
  const note = document.querySelector('.dl-free-note');
  if (note) note.textContent = 'Pro unlocked · unlimited clean PDFs';
  const payLabel = document.getElementById('pay-btn-label');
  if (payLabel) payLabel.textContent = 'Pro unlocked — unlimited downloads';
  const optPro = document.getElementById('opt-pro-upsell');
  if (optPro) optPro.classList.add('selected');
  selectedOption = 'pro';
  // Hide watermark in preview
  const watermark = document.querySelector('.watermark');
  if (watermark) watermark.style.display = 'none';

  // Update the $4 download button to be free for Pro users
  const singleBtn = document.querySelector('.dl-btn-single');
  if (singleBtn) {
    singleBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Download clean PDF — Pro';
    singleBtn.onclick = () => { if (validateFields()) downloadPDF(false); };
  }

  // Update the Pro button to show active state
  const proBtn = document.querySelector('.dl-btn-pro');
  if (proBtn) {
    proBtn.innerHTML = '✓ Pro active — unlimited clean downloads';
    proBtn.style.background = 'var(--green-soft)';
    proBtn.style.color = 'var(--green)';
    proBtn.style.borderColor = '#bbf7d0';
    proBtn.onclick = () => { if (validateFields()) downloadPDF(false); };
  }
}

// PDF GENERATION
function downloadPDF(watermarked = false) {
  const d = getData();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210; const H = 297;
  const ML = 20; const MR = 20; const CW = W - ML - MR;
  const today = new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const ref = 'QS-' + Math.floor(100000 + Math.random()*900000);
  const providerName = d.yourBusiness ? `${d.yourName} (${d.yourBusiness})` : d.yourName;
  const totalStr = d.currency + parseFloat(d.price).toLocaleString();
  let y = 0;

  doc.setFillColor(20,20,19);
  doc.rect(0, 0, W, 18, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.setTextColor(255,255,255);
  doc.text('QUICKSCOPE', ML, 11);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180,175,170);
  doc.text('Scope of Work Generator', ML + 38, 11);
  doc.text(`REF: ${ref}`, W - MR, 11, {align:'right'});
  y = 30;

  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  doc.setTextColor(20,20,19);
  doc.text('SCOPE OF WORK', ML, y);
  y += 6;
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(140,135,130);
  doc.text('PROJECT AGREEMENT & DELIVERABLES', ML, y);
  y += 4;
  doc.setDrawColor(200,195,188);
  doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(140,135,130);
  doc.text(`DATE: ${today}`, ML, y);
  doc.text(`DOCUMENT REF: ${ref}`, W - MR, y, {align:'right'});
  y += 10;

  doc.setFillColor(240,236,227);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80,75,70);
  doc.text('PARTIES TO THIS AGREEMENT', ML + 3, y + 4.5);
  y += 11;

  const halfW = (CW - 6) / 2;
  doc.setDrawColor(210,205,198);
  doc.setLineWidth(0.3);
  doc.rect(ML, y, halfW, 28, 'S');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7);
  doc.setTextColor(180,80,42);
  doc.text('SERVICE PROVIDER', ML + 3, y + 5);
  doc.setFont('helvetica','bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20,20,19);
  doc.text(doc.splitTextToSize(providerName, halfW - 6), ML + 3, y + 11);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100,95,90);
  doc.text(d.yourEmail, ML + 3, y + 21);
  doc.rect(ML + halfW + 6, y, halfW, 28, 'S');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7);
  doc.setTextColor(180,80,42);
  doc.text('CLIENT', ML + halfW + 9, y + 5);
  doc.setFont('helvetica','bold');
  doc.setFontSize(9.5);
  doc.setTextColor(20,20,19);
  doc.text(doc.splitTextToSize(d.clientName, halfW - 6), ML + halfW + 9, y + 11);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100,95,90);
  doc.text(d.clientEmail, ML + halfW + 9, y + 21);
  y += 34;

  doc.setFillColor(240,236,227);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80,75,70);
  doc.text('1. SCOPE OF DELIVERABLES', ML + 3, y + 4.5);
  y += 11;
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.setTextColor(30,30,28);
  const delivLines = doc.splitTextToSize(d.deliverables, CW);
  doc.text(delivLines, ML, y);
  y += delivLines.length * 5 + 8;

  doc.setFillColor(240,236,227);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80,75,70);
  doc.text('2. PROJECT TERMS', ML + 3, y + 4.5);
  y += 11;
  const thirdW = (CW - 8) / 3;
  [{ label:'PROJECT DEADLINE', value: formatDeadline(d.deadline) },{ label:'REVISIONS INCLUDED', value: d.revisions },{ label:'ADDITIONAL REVISIONS', value: d.extraRevision || 'N/A' }].forEach((t, i) => {
    const bx = ML + i * (thirdW + 4);
    doc.setDrawColor(210,205,198);
    doc.setLineWidth(0.3);
    doc.rect(bx, y, thirdW, 20, 'S');
    doc.setFont('helvetica','bold');
    doc.setFontSize(6.5);
    doc.setTextColor(140,135,130);
    doc.text(t.label, bx + 3, y + 5);
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.setTextColor(20,20,19);
    doc.text(doc.splitTextToSize(t.value, thirdW - 6), bx + 3, y + 12);
  });
  y += 26;

  doc.setFillColor(240,236,227);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80,75,70);
  doc.text('3. PAYMENT', ML + 3, y + 4.5);
  y += 11;
  doc.setFont('helvetica','normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30,30,28);
  doc.text('Payment Terms:', ML, y);
  doc.setFont('helvetica','bold');
  doc.text(d.paymentTerms, ML + 35, y);
  y += 10;
  doc.setFillColor(20,20,19);
  doc.rect(ML, y, CW, 14, 'F');
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160,155,148);
  doc.text('TOTAL PROJECT VALUE', ML + 4, y + 5.5);
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.setTextColor(255,255,255);
  doc.text(totalStr, ML + 4, y + 11.5);
  y += 22;

  doc.setFillColor(240,236,227);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80,75,70);
  doc.text('4. TERMS & CONDITIONS', ML + 3, y + 4.5);
  y += 11;
  const tcs = [
    '4.1  The Service Provider agrees to deliver the scope outlined in Section 1 by the deadline stated in Section 2.',
    '4.2  The Client agrees to provide all necessary materials, feedback, and approvals in a timely manner.',
    '4.3  Revision rounds are as stated. Additional revisions beyond the agreed number will incur additional charges.',
    '4.4  Payment is due as per the terms in Section 3. Work will not commence until the upfront payment is received.',
    '4.5  Any changes to the scope after signing require a new written agreement.',
    '4.6  Intellectual property transfers to the Client upon receipt of final payment in full.',
  ];
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.8);
  doc.setTextColor(70,68,65);
  tcs.forEach(tc => {
    const lines = doc.splitTextToSize(tc, CW);
    doc.text(lines, ML, y);
    y += lines.length * 4.5 + 2;
  });
  y += 4;

  if (y > H - 55) { doc.addPage(); y = 20; }
  doc.setFillColor(240,236,227);
  doc.rect(ML, y, CW, 7, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80,75,70);
  doc.text('5. SIGNATURES', ML + 3, y + 4.5);
  y += 11;
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(80,75,70);
  doc.text('By signing below, both parties agree to the terms and conditions of this Scope of Work.', ML, y);
  y += 12;
  const sigW = (CW - 10) / 2;
  doc.setDrawColor(80,75,70);
  doc.setLineWidth(0.5);
  doc.line(ML, y + 14, ML + sigW, y + 14);
  doc.line(ML + sigW + 10, y + 14, ML + sigW + 10 + sigW, y + 14);
  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20,20,19);
  doc.text(providerName, ML, y + 19);
  doc.text(d.clientName, ML + sigW + 10, y + 19);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140,135,130);
  doc.text('Service Provider', ML, y + 24);
  doc.text('Client', ML + sigW + 10, y + 24);
  doc.text('Date: ____________________', ML, y + 30);
  doc.text('Date: ____________________', ML + sigW + 10, y + 30);

  doc.setFillColor(20,20,19);
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setFont('helvetica','normal');
  doc.setFontSize(6.5);
  doc.setTextColor(120,115,108);
  doc.text('Generated by QuickScope · quickscopestudio.vercel.app · This document is legally binding upon signature by both parties.', W/2, H - 5, {align:'center'});

  // Watermark stamp for free tier — every page
  if (watermarked) {
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.saveGraphicsState();
      doc.setFont('helvetica','bold');
      doc.setFontSize(48);
      doc.setTextColor(200,80,42);
      doc.setGState(new doc.GState({opacity: 0.07}));
      for (let wy = 50; wy < H; wy += 65) {
        doc.text('QUICKSCOPE FREE', W/2, wy, {align:'center', angle:35});
      }
      doc.restoreGraphicsState();
    }
  }

  doc.save(`QuickScope_${d.yourName.replace(/\s+/g,'_')}_${d.clientName.replace(/\s+/g,'_')}${watermarked?'_free':''}.pdf`);
  showToast(watermarked ? 'Free PDF downloaded ✓' : 'Clean PDF downloaded ✓');
}

document.getElementById('deadline').min = new Date().toISOString().split('T')[0];

// Auto-trigger PDF download if returning from successful payment
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('paid') === 'true') {
    const saved = localStorage.getItem('qs_pending_download');
    if (saved) {
      const d = JSON.parse(saved);
      document.getElementById('your-name').value = d.yourName || '';
      document.getElementById('your-email').value = d.yourEmail || '';
      document.getElementById('your-business').value = d.yourBusiness || '';
      document.getElementById('client-name').value = d.clientName || '';
      document.getElementById('client-email').value = d.clientEmail || '';
      document.getElementById('deliverables').value = d.deliverables || '';
      document.getElementById('deadline').value = d.deadline || '';
      document.getElementById('revisions').value = d.revisions || '';
      document.getElementById('extra-revision').value = d.extraRevision || '';
      document.getElementById('price').value = d.price || '';
      document.getElementById('currency').value = d.currency || '$';
      document.getElementById('payment-terms').value = d.paymentTerms || '';
      liveUpdate();
      localStorage.removeItem('qs_pending_download');
      setTimeout(() => downloadPDF(false), 800);
      history.replaceState({}, '', window.location.pathname);
    }
  }
})();

// AUTH
// Backend is currently disabled. Auth and dashboard features require
// a Node/Express backend deployed separately (e.g. on Railway).
// When backend is re-enabled, set this to the live backend URL.
const API = null;
let authMode = 'login';
let currentUser = null;
let currentToken = null;

(function() {
  const token = localStorage.getItem('qs_token');
  const user = localStorage.getItem('qs_user');
  if (token && user) {
    currentToken = token;
    currentUser = JSON.parse(user);
    updateNavForUser();
  }
})();

function updateNavForUser() {
  // Backend not yet active — nav button always shows Go Pro
  const btn = document.getElementById('nav-auth-btn');
  btn.textContent = 'Go Pro ★';
  btn.classList.remove('logged-in');
  btn.onclick = showProModal;
}

function showAuthModal() {
  authMode = 'login';
  document.getElementById('auth-modal-title').textContent = 'Welcome back';
  document.getElementById('auth-modal-desc').textContent = 'Log in to access your document history and Pro features.';
  document.getElementById('auth-submit-btn').textContent = 'Log in';
  document.getElementById('auth-toggle-text').textContent = "Don't have an account?";
  document.getElementById('auth-toggle-btn').textContent = 'Sign up';
  document.getElementById('auth-error').style.display = 'none';
  document.getElementById('overlay-auth').classList.add('open');
}

function closeAuthModal() {
  document.getElementById('overlay-auth').classList.remove('open');
}

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'signup' : 'login';
  if (authMode === 'signup') {
    document.getElementById('auth-modal-title').textContent = 'Create account';
    document.getElementById('auth-modal-desc').textContent = 'Free to sign up. Upgrade to Pro any time.';
    document.getElementById('auth-submit-btn').textContent = 'Create account';
    document.getElementById('auth-toggle-text').textContent = 'Already have an account?';
    document.getElementById('auth-toggle-btn').textContent = 'Log in';
  } else {
    document.getElementById('auth-modal-title').textContent = 'Welcome back';
    document.getElementById('auth-modal-desc').textContent = 'Log in to access your document history and Pro features.';
    document.getElementById('auth-submit-btn').textContent = 'Log in';
    document.getElementById('auth-toggle-text').textContent = "Don't have an account?";
    document.getElementById('auth-toggle-btn').textContent = 'Sign up';
  }
  document.getElementById('auth-error').style.display = 'none';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const errEl = document.getElementById('auth-error');
  const btn = document.getElementById('auth-submit-btn');
  if (!email || !password) {
    errEl.textContent = 'Email and password required';
    errEl.style.display = 'block';
    return;
  }
  btn.textContent = 'Please wait...';
  btn.disabled = true;
  if (!API) { console.warn('Backend not connected'); errEl.textContent = 'Backend not available'; errEl.style.display = 'block'; btn.textContent = authMode === 'login' ? 'Log in' : 'Create account'; btn.disabled = false; return; }
  const endpoint = authMode === 'login' ? '/auth/login' : '/auth/signup';
  try {
    const res = await fetch(API + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error) {
      errEl.textContent = data.error;
      errEl.style.color = 'var(--accent)';
      errEl.style.display = 'block';
      btn.textContent = authMode === 'login' ? 'Log in' : 'Create account';
      btn.disabled = false;
      return;
    }
    if (authMode === 'signup') {
      errEl.style.color = 'var(--green)';
      errEl.textContent = 'Account created! Check your email to confirm, then log in.';
      errEl.style.display = 'block';
      btn.textContent = 'Create account';
      btn.disabled = false;
      return;
    }
    currentToken = data.token;
    currentUser = data.user;
    localStorage.setItem('qs_token', currentToken);
    localStorage.setItem('qs_user', JSON.stringify(currentUser));
    closeAuthModal();
    updateNavForUser();
  } catch(e) {
    errEl.textContent = 'Server error. Make sure the server is running.';
    errEl.style.display = 'block';
    btn.textContent = authMode === 'login' ? 'Log in' : 'Create account';
    btn.disabled = false;
  }
}

function handleLogout() {
  currentToken = null;
  currentUser = null;
  localStorage.removeItem('qs_token');
  localStorage.removeItem('qs_user');
  closeDashboard();
  updateNavForUser();
}

async function showDashboard() {
  document.getElementById('dashboard-user-email').textContent = currentUser.email;
  document.getElementById('overlay-dashboard').classList.add('open');
  loadDocuments();
}

function closeDashboard() {
  document.getElementById('overlay-dashboard').classList.remove('open');
}

async function loadDocuments() {
  const container = document.getElementById('dashboard-content');
  if (!API) { console.warn('Backend not connected'); container.innerHTML = '<p style="font-size:0.85rem;color:var(--accent);text-align:center;padding:2rem 0">Backend not available.</p>'; return; }
  try {
    const res = await fetch(API + '/documents', {
      headers: { 'Authorization': 'Bearer ' + currentToken }
    });
    const data = await res.json();
    if (!data.documents || data.documents.length === 0) {
      container.innerHTML = '<p style="font-size:0.85rem;color:var(--ink3);text-align:center;padding:2rem 0">No documents yet. Generate your first scope below.</p>';
      return;
    }
    container.innerHTML = data.documents.map(d => `
      <div style="border:1px solid var(--border);border-radius:8px;padding:0.85rem 1rem;margin-bottom:0.65rem;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:0.88rem;font-weight:500;color:var(--ink)">${d.client_name}</div>
          <div style="font-family:var(--mono);font-size:0.6rem;color:var(--ink3);margin-top:2px">${(d.deliverables||'').substring(0,40)}... · ${d.currency}${parseFloat(d.price).toLocaleString()}</div>
        </div>
        <button onclick="deleteDocument('${d.id}')" style="background:none;border:none;color:var(--ink3);cursor:pointer;font-size:0.75rem;font-family:var(--mono)">Delete</button>
      </div>
    `).join('');
  } catch(e) {
    container.innerHTML = '<p style="font-size:0.85rem;color:var(--accent);text-align:center;padding:2rem 0">Could not load documents.</p>';
  }
}

// --- PRO MODE ---
function enableProFeatures() {
  localStorage.setItem("quickscope_pro", "true");

  // Example: remove watermark
  const watermark = document.querySelector('.watermark');
  if (watermark) watermark.style.display = 'none';

  // Example: change button text
  const proBtn = document.querySelector('.dl-btn-pro');
  if (proBtn) {
    proBtn.innerText = "Pro Active ✓ Unlimited Downloads";
    proBtn.disabled = true;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);

  // Restore pro session if user had it active before
  if (localStorage.getItem('qs_pro_access') === 'true') {
    enableProFeatures();
  }

  // Handle return from $4 PayPal payment
  if (urlParams.get('paid') === 'true') {
    const saved = localStorage.getItem('qs_pending_download');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        document.getElementById('your-name').value = d.yourName || '';
        document.getElementById('your-email').value = d.yourEmail || '';
        document.getElementById('your-business').value = d.yourBusiness || '';
        document.getElementById('client-name').value = d.clientName || '';
        document.getElementById('client-email').value = d.clientEmail || '';
        document.getElementById('deliverables').value = d.deliverables || '';
        document.getElementById('deadline').value = d.deadline || '';
        document.getElementById('revisions').value = d.revisions || '';
        document.getElementById('extra-revision').value = d.extraRevision || '';
        document.getElementById('price').value = d.price || '';
        document.getElementById('currency').value = d.currency || '$';
        document.getElementById('payment-terms').value = d.paymentTerms || '';
        liveUpdate();
        localStorage.removeItem('qs_pending_download');
        setTimeout(() => downloadPDF(false), 800);
      } catch (e) {
        console.error('Could not restore form data after payment', e);
        setTimeout(() => downloadPDF(false), 800);
      }
    } else {
      setTimeout(() => downloadPDF(false), 800);
    }
    history.replaceState({}, '', window.location.pathname);
    sessionStorage.setItem('qs_skip_autosave', 'true');
  }

  // Handle return from $9 Pro PayPal subscription
  if (urlParams.get('paid_pro') === 'true') {
    enableProFeatures();
    history.replaceState({}, '', window.location.pathname);
  }
  // Check for existing draft
  const draft = localStorage.getItem('qs_draft');
  if (draft) {
    try {
      const d = JSON.parse(draft);
      if (d.yourName || d.clientName) {
        document.getElementById('restore-banner').style.display = 'flex';
      }
    } catch(e) { localStorage.removeItem('qs_draft'); }
  }
  const previewParam = urlParams.get('preview');
  if (previewParam) {
    try {
      const d = JSON.parse(atob(previewParam));
      document.getElementById('your-name').value = d.yourName || '';
      document.getElementById('your-email').value = d.yourEmail || '';
      document.getElementById('your-business').value = d.yourBusiness || '';
      document.getElementById('client-name').value = d.clientName || '';
      document.getElementById('client-email').value = d.clientEmail || '';
      document.getElementById('deliverables').value = d.deliverables || '';
      document.getElementById('deadline').value = d.deadline || '';
      document.getElementById('revisions').value = d.revisions || '';
      document.getElementById('extra-revision').value = d.extraRevision || '';
      document.getElementById('price').value = d.price || '';
      document.getElementById('currency').value = d.currency || '$';
      document.getElementById('payment-terms').value = d.paymentTerms || '';
      liveUpdate();
      // Scroll to the tool section
      setTimeout(() => document.getElementById('tool').scrollIntoView({behavior:'smooth'}), 400);
    } catch(e) { console.error('Invalid preview link'); }
  }
});
async function deleteDocument(id) {
  if (!API) { console.warn('Backend not connected'); return; }
  await fetch(API + '/documents/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + currentToken }
  });
  loadDocuments();
}

function exportCSV() {
  if (!currentToken) return;
  if (!API) { console.warn('Backend not connected'); return; }
  window.open(API + '/documents/export/csv', '_blank');
}


