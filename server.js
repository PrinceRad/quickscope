require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ─── SIGN UP ───────────────────────────────────────────────
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Account created. Check your email to confirm.', user: data.user });
});

// ─── LOG IN ────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ token: data.session.access_token, user: data.user });
});

// ─── GET USER (verify token) ───────────────────────────────
app.get('/auth/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid token' });
  res.json({ user: data.user });
});

// ─── SAVE DOCUMENT (Pro users) ────────────────────────────
app.post('/documents', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError) return res.status(401).json({ error: 'Invalid token' });

  const { yourName, yourEmail, yourBusiness, clientName, clientEmail,
          deliverables, deadline, revisions, extraRevision,
          price, currency, paymentTerms } = req.body;

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      user_id: userData.user.id,
      your_name: yourName,
      your_email: yourEmail,
      your_business: yourBusiness,
      client_name: clientName,
      client_email: clientEmail,
      deliverables,
      deadline,
      revisions,
      extra_revision: extraRevision,
      price,
      currency,
      payment_terms: paymentTerms,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ document: data[0] });
});

// ─── GET DOCUMENTS (Pro users) ────────────────────────────
app.get('/documents', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError) return res.status(401).json({ error: 'Invalid token' });

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ documents: data });
});

// ─── DELETE DOCUMENT ──────────────────────────────────────
app.delete('/documents/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError) return res.status(401).json({ error: 'Invalid token' });

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', userData.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Document deleted' });
});

// ─── CSV EXPORT (Pro users) ───────────────────────────────
app.get('/documents/export/csv', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError) return res.status(401).json({ error: 'Invalid token' });

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const headers = ['Client Name','Client Email','Deliverables','Deadline','Revisions','Extra Revision','Price','Currency','Payment Terms','Created At'];
  const rows = data.map(d => [
    d.client_name, d.client_email, `"${d.deliverables}"`,
    d.deadline, d.revisions, d.extra_revision || '',
    d.price, d.currency, d.payment_terms,
    new Date(d.created_at).toLocaleDateString('en-GB')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=QuickScope_Projects.csv');
  res.send(csv);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`QuickScope server running on http://localhost:${PORT}`));
