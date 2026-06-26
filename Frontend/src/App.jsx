import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, Send, User, Paperclip, Trash2, X, FileText, Image, Layers, Users, LayoutDashboard, Sun, Moon, LogOut, ShieldCheck, Bot, Key, MessageSquare, Zap, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthPage from './AuthPage';
import MetricsView from './MetricsView';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import SettingsPage from './SettingsPage';
import AdminPage from './AdminPage';
import AgentRunsPage from './AgentRunsPage';
import ApiKeyPage from './ApiKeyPage';
import alumnxLogo from './assets/alumnxlogo_new.png';
import './index.css';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const MODEL_PRICING = {
  gemma: { input: 0.10 / 1_000_000, output: 0.40  / 1_000_000, label: 'Gemma' },
  gpt4:  { input: 0.15 / 1_000_000, output: 0.60  / 1_000_000, label: 'GPT-4o Mini' },
};

const INR_RATE = 84.5;

const TOOLTIP_STYLE = {
  backgroundColor: '#1a1a1e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#f0f0f2',
  fontSize: '0.8rem',
  padding: '8px 12px',
};

const LABEL_STYLE = { color: '#9ca3af', marginBottom: 4 };

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function DashboardMetricCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <div className="metric-card" style={{ '--card-color': color, flex: 1, minWidth: '200px' }}>
      <div className="metric-card-icon" style={{ background: gradient }}>
        <Icon size={18} />
      </div>
      <div className="metric-card-body">
        <p className="metric-card-label">{label}</p>
        <p className="metric-card-value">{value}</p>
        {sub && <p className="metric-card-sub">{sub}</p>}
      </div>
    </div>
  );
}

function DashboardMetrics({ metrics }) {
  const stats = React.useMemo(() => {
    if (!metrics || !metrics.length) return null;
    const totalPrompt = metrics.reduce((s, m) => s + (m.prompt_tokens || 0), 0);
    const totalCompletion = metrics.reduce((s, m) => s + (m.completion_tokens || 0), 0);
    const latencies = metrics.map(m => m.latency_ms || 0);
    const avgLatency = latencies.reduce((s, v) => s + v, 0) / latencies.length;
    const totalCostUsd = metrics.reduce((s, m) => s + (m.cost_usd || 0), 0);
    return {
      totalPrompt,
      totalCompletion,
      totalTokens: totalPrompt + totalCompletion,
      avgLatency,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      totalCostUsd,
      totalCostInr: totalCostUsd * INR_RATE,
      avgCostUsd: totalCostUsd / metrics.length,
    };
  }, [metrics]);

  const chartData = React.useMemo(() => {
    if (!metrics) return [];
    return metrics.slice(-15).map((m, i) => ({
      name: `#${metrics.length - Math.min(15, metrics.length) + i + 1}`,
      prompt: m.prompt_tokens || 0,
      completion: m.completion_tokens || 0,
      latency: Math.round(m.latency_ms || 0),
      cost: parseFloat(((m.cost_usd || 0) * 1_000_000).toFixed(3)),
    }));
  }, [metrics]);

  if (!metrics || !metrics.length) {
    return (
      <div className="metrics-empty" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <LayoutDashboard size={36} strokeWidth={1} style={{ marginBottom: '0.5rem' }} />
        <p>No analytics data yet. Send a message to start tracking metrics in real-time.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Cards Row */}
      <div className="metric-cards-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <DashboardMetricCard
          icon={Zap}
          label="Total Tokens"
          value={fmt(stats.totalTokens)}
          sub={`${fmt(stats.totalPrompt)} in · ${fmt(stats.totalCompletion)} out`}
          color="#7c6df0"
          gradient="linear-gradient(135deg, #7c6df0, #c084fc)"
        />
        <DashboardMetricCard
          icon={Clock}
          label="Avg Latency"
          value={`${Math.round(stats.avgLatency)} ms`}
          sub={`Min ${Math.round(stats.minLatency)} · Max ${Math.round(stats.maxLatency)} ms`}
          color="#34d399"
          gradient="linear-gradient(135deg, #10b981, #34d399)"
        />
        <DashboardMetricCard
          icon={DollarSign}
          label="Total Cost (USD)"
          value={`$${stats.totalCostUsd < 0.0001
            ? stats.totalCostUsd.toExponential(2)
            : stats.totalCostUsd.toFixed(6)}`}
          sub={`${metrics.length} request${metrics.length !== 1 ? 's' : ''} · avg $${stats.avgCostUsd.toExponential(2)}`}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #d97706, #f59e0b)"
        />
        <DashboardMetricCard
          icon={TrendingUp}
          label="Total Cost (INR)"
          value={`₹${stats.totalCostInr.toFixed(4)}`}
          sub={`Rate ₹${INR_RATE}/USD`}
          color="#fb923c"
          gradient="linear-gradient(135deg, #ea580c, #fb923c)"
        />
      </div>

      {/* Charts Row */}
      <div className="metrics-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div className="metrics-chart-card">
          <h3 className="chart-title">Token Usage per Request</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
              <Legend wrapperStyle={{ fontSize: '0.74rem', paddingTop: '4px' }} />
              <Line type="monotone" dataKey="prompt" name="Input" stroke="#7c6df0" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
              <Line type="monotone" dataKey="completion" name="Output" stroke="#c084fc" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="metrics-chart-card">
          <h3 className="chart-title">Response Latency (ms)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} formatter={(v) => [`${v} ms`, 'Latency']} />
              <Bar dataKey="latency" name="Latency" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={25} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AppContent({ theme, setTheme }) {
  const { token, user, logout } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading
  const [isAdmin, setIsAdmin]         = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const checkOllama = () => {
      fetch(`${API_BASE_URL}/health`)
        .then(res => {
          if (res.ok) setOllamaConnected(true);
          else setOllamaConnected(false);
        })
        .catch(() => setOllamaConnected(false));
    };
    checkOllama();
    const interval = setInterval(checkOllama, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const signupOrg  = localStorage.getItem('signup_organization') || null;
          const signupRole = localStorage.getItem('signup_role') || null;
          localStorage.removeItem('signup_organization');
          localStorage.removeItem('signup_role');
          await fetch(`${API_BASE_URL}/admin/register`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ organization: signupOrg, role: signupRole }),
          });
          const res = await fetch(`${API_BASE_URL}/admin/check`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setIsAdmin(data.is_admin === true);
          }
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  const getToken = async () => {
    if (!currentUser) return null;
    return currentUser.getIdToken();
  };

  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('gemma_conversations');
    if (saved) return JSON.parse(saved);
    const oldHistory = localStorage.getItem('gemma_chat_history');
    const oldSessionId = localStorage.getItem('gemma_session_id');
    if (oldHistory && oldSessionId) {
      try {
        const messagesArray = JSON.parse(oldHistory);
        if (messagesArray.length > 0) {
          const firstUser = messagesArray.find(m => m.role === 'user')?.content || '';
          const initialTitle = firstUser ? (firstUser.length > 25 ? firstUser.slice(0, 25) + '...' : firstUser) : 'Previous Chat';
          const migrated = [{
            id: oldSessionId,
            title: initialTitle,
            messages: messagesArray,
            timestamp: Date.now()
          }];
          localStorage.setItem('gemma_conversations', JSON.stringify(migrated));
          return migrated;
        }
      } catch (err) {
        console.error('Migration failed:', err);
      }
    }
    return [];
  });

  // ✅ FIX: session ID starts as a temporary value; will be replaced once user logs in
  const [sesssionId, setSessionId] = useState('sess-' + Date.now());

  // ✅ FIX: once Firebase resolves the user, set a session ID scoped to that user's UID
  useEffect(() => {
    if (!currentUser) return;
    const key = `gemma_session_id_${currentUser.uid}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setSessionId(saved);
    } else {
      const newId = `sess-${currentUser.uid}-${Date.now()}`;
      localStorage.setItem(key, newId);
      setSessionId(newId);
    }
  }, [currentUser]);

  const [messages, setMessages] = useState(() => {
    const savedSessionId = localStorage.getItem('gemma_session_id');
    if (savedSessionId) {
      const savedConversations = localStorage.getItem('gemma_conversations');
      if (savedConversations) {
        try {
          const list = JSON.parse(savedConversations);
          const active = list.find(c => c.id === savedSessionId);
          if (active) return active.messages;
        } catch (err) {
          console.error('Failed to load active conversation:', err);
        }
      }
    }
    return [];
  });

  const userId = user?.id ? String(user.id) : (currentUser?.uid || null);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemma');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [view, setView] = useState('chat');
  const [metricsData, setMetricsData] = useState(() => {
    const saved = localStorage.getItem('gemma_metrics');
    return saved ? JSON.parse(saved) : [];
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('gemma_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem(`gemma_session_id_${currentUser.uid}`, sesssionId);
  }, [sesssionId, currentUser]);

  useEffect(() => {
    if (messages.length === 0) return;
    setConversations(prev => {
      const existingIdx = prev.findIndex(c => c.id === sesssionId);
      let updated;
      if (existingIdx !== -1) {
        updated = prev.map((c, i) => i === existingIdx ? { ...c, messages, timestamp: Date.now() } : c);
      } else {
        const firstUserMessage = messages.find(m => m.role === 'user')?.content || '';
        const title = firstUserMessage ? (firstUserMessage.length > 25 ? firstUserMessage.slice(0, 25) + '...' : firstUserMessage) : 'New Chat';
        updated = [
          { id: sesssionId, title, messages, timestamp: Date.now() },
          ...prev
        ];
      }
      localStorage.setItem('gemma_conversations', JSON.stringify(updated));
      return updated;
    });
  }, [messages, sesssionId]);

  useEffect(() => {
    localStorage.setItem('gemma_metrics', JSON.stringify(metricsData));
  }, [metricsData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    if (!fileError) return;
    const t = setTimeout(() => setFileError(''), 3000);
    return () => clearTimeout(t);
  }, [fileError]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = ALLOWED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Only PDF files are allowed.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File must be smaller than 3 MB.');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setFileError('');
    e.target.value = '';
  };

  const removeFile = () => setSelectedFile(null);

  const estimateTokens = (text) => Math.ceil((text || '').length / 4);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    if (selectedFile && !trimmed) {
      setFileError('Please type a message along with your file.');
      return;
    }

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const newMessage = { role: 'user', content: trimmed };
    if (selectedFile) {
      if (isImageFile(selectedFile)) {
        try {
          const dataURL = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(selectedFile);
          });
          newMessage.image = dataURL;
          newMessage.fileName = selectedFile.name;
        } catch (error) {
          console.error('Error reading image:', error);
          newMessage.content = `📎 ${selectedFile.name} (preview failed)\n\n${trimmed}`;
          newMessage.fileName = selectedFile.name;
        }
      } else {
        newMessage.content = `📎 ${selectedFile.name}\n\n${trimmed}`;
        newMessage.fileName = selectedFile.name;
      }
    }

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    const startTime = Date.now();

    try {
      let data;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('message', trimmed);
        formData.append('session_id', sesssionId);
        formData.append('user_id', userId);
        formData.append('model', selectedModel);

        setUploadProgress(0);
        const fileToken = await getToken();
        data = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE_URL}/chat-file`);
          const finalToken = token || fileToken;
          if (finalToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${finalToken}`);
          }
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText)); }
              catch { reject(new Error('Invalid response from server')); }
            } else {
              let errMsg = 'Failed to process file';
              try {
                const errJson = JSON.parse(xhr.responseText);
                if (errJson.detail) errMsg = errJson.detail;
              } catch {}
              reject(new Error(errMsg));
            }
          };
          xhr.onerror = () => reject(new Error('Failed to process file'));
          xhr.send(formData);
        });
      } else {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: trimmed, session_id: sesssionId, user_id: userId, model: selectedModel }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.detail || `HTTP error! Status: ${response.status}`;
          throw new Error(errMsg);
        }
        data = await response.json();
      }

      const latencyMs = Date.now() - startTime;
      const currentTextTokens = estimateTokens(trimmed);
      const currentAttachmentTokens = selectedFile
        ? (selectedFile.name.toLowerCase().endsWith('.pdf')
            ? Math.min(1500, Math.ceil(selectedFile.size / 8))
            : 250)
        : 0;
      const pTok = currentTextTokens + currentAttachmentTokens;
      const cTok = data.usage?.completion_tokens ?? data.completion_tokens ?? data.output_tokens ?? estimateTokens(data.response);
      const pricing = MODEL_PRICING[selectedModel] ?? MODEL_PRICING.gemma;
      const INR_RATE = 84.5;
      const textTokens = currentTextTokens;
      const attachmentTokens = currentAttachmentTokens;
      const inputCostUsd = pTok * pricing.input;
      const inputCostInr = inputCostUsd * INR_RATE;
      const outputCostUsd = cTok * pricing.output;
      const outputCostInr = outputCostUsd * INR_RATE;
      const totalCostUsd = inputCostUsd + outputCostUsd;
      const totalCostInr = totalCostUsd * INR_RATE;

      setMetricsData(prev => [...prev, {
        id: `m-${Date.now()}`,
        timestamp: Date.now(),
        prompt_tokens: pTok,
        completion_tokens: cTok,
        total_tokens: pTok + cTok,
        latency_ms: latencyMs,
        model: selectedModel,
        cost_usd: totalCostUsd,
      }]);

      setMessages(prev => [...prev, {
        role: 'bot',
        content: data.response,
        metrics: {
          inputTextTokens: textTokens,
          inputAttachmentTokens: attachmentTokens,
          outputTokens: cTok,
          latencyMs: latencyMs,
          inputCostUsd,
          inputCostInr,
          outputCostUsd,
          outputCostInr,
          totalCostUsd,
          totalCostInr,
          modelLabel: pricing.label
        }
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: 'Oops! ' + error.message }]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      setUploadProgress(null);
    }
  };

  const switchConversation = (id) => {
    const active = conversations.find(c => c.id === id);
    if (active) {
      setSessionId(id);
      setMessages(active.messages);
      setView('chat');
    }
  };

  const deleteConversation = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      localStorage.setItem('gemma_conversations', JSON.stringify(updated));

      if (sesssionId === id) {
        if (updated.length > 0) {
          setSessionId(updated[0].id);
          setMessages(updated[0].messages);
        } else {
          // ✅ FIX: new session ID scoped to current user
          const newId = `sess-${currentUser.uid}-${Date.now()}`;
          if (currentUser) localStorage.setItem(`gemma_session_id_${currentUser.uid}`, newId);
          setSessionId(newId);
          setMessages([]);
        }
      }
    }
  };

  const clearAllConversations = () => {
    if (window.confirm('Are you sure you want to clear ALL conversations?')) {
      setConversations([]);
      localStorage.removeItem('gemma_conversations');
      setMessages([]);
      // ✅ FIX: new session ID scoped to current user
      const newId = `sess-${currentUser?.uid ?? 'anon'}-${Date.now()}`;
      if (currentUser) localStorage.setItem(`gemma_session_id_${currentUser.uid}`, newId);
      setSessionId(newId);
    }
  };

  const isImageFile = (file) => file?.type?.startsWith('image/');

  if (currentUser === undefined) {
    return <div className="auth-page"><div className="auth-card"><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div></div>;
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="app-container">
      {/* ========== Sidebar ========== */}
      <aside className="sidebar">
        <div className="sidebar-logo-container">
          <div className="logo" style={{ marginBottom: 0, padding: 0 }}>
            <div className="logo-icon">TL</div>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>TokenLens</span>
          </div>
        </div>

        {/* Navigation Tabs List */}
        <div className="sidebar-menu-tabs">
          <button
            className="new-chat-btn"
            onClick={() => {
              // ✅ FIX: new session ID scoped to current user
              const newId = `sess-${currentUser.uid}-${Date.now()}`;
              localStorage.setItem(`gemma_session_id_${currentUser.uid}`, newId);
              setMessages([]);
              setSelectedFile(null);
              setSessionId(newId);
              setView('chat');
            }}
          >
            <MessageSquare size={16} />
            <span>Chat</span>
          </button>
          
          <button
            className={`sidebar-tab-btn ${view === 'metrics' ? 'active' : ''}`}
            onClick={() => setView('metrics')}
          >
            <Layers size={16} />
            <span>TokenLens</span>
            {metricsData.length > 0 && (
              <span className="dashboard-nav-badge">{metricsData.length}</span>
            )}
          </button>
          
          <button
            className={`sidebar-tab-btn ${view === 'agents' ? 'active' : ''}`}
            onClick={() => setView('agents')}
          >
            <Bot size={16} />
            <span>Agent Runs</span>
          </button>
          
          <button
            className={`sidebar-tab-btn ${view === 'apikey' ? 'active' : ''}`}
            onClick={() => setView('apikey')}
          >
            <Key size={16} />
            <span>API Keys</span>
          </button>
          
          <button
            className={`sidebar-tab-btn ${view === 'settings' ? 'active' : ''}`}
            onClick={() => setView('settings')}
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>

          {isAdmin && (
            <button
              className={`sidebar-tab-btn ${view === 'admin' ? 'active' : ''}`}
              onClick={() => setView('admin')}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* Chat History Section */}
        <div className="sidebar-section-title">Recent Chats</div>
        
        <button
          className="new-chat-btn"
          style={{ marginBottom: '0.75rem' }}
          onClick={() => {
            setMessages([]);
            setSelectedFile(null);
            setSessionId('sess-' + Date.now());
            setView('chat');
          }}
        >
          <Plus size={18} /> New Chat
        </button>

        <div className="chat-history">
          {!conversations.some(c => c.id === sesssionId) && (
            <div className="history-item-container active">
              <span className="history-item-title">💬 New Chat...</span>
            </div>
          )}
          {conversations.map(c => (
            <div
              key={c.id}
              className={`history-item-container ${c.id === sesssionId && view === 'chat' ? 'active' : ''}`}
              onClick={() => switchConversation(c.id)}
            >
              <span className="history-item-title">💬 {c.title}</span>
              <button
                className="history-delete-btn"
                onClick={(e) => deleteConversation(c.id, e)}
                title="Delete Chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Model Selection Panel */}
        <div className="sidebar-model-panel">
          <div className="sidebar-model-header">
            <span className="sidebar-model-label">Active Model</span>
            <span className={`status-dot ${ollamaConnected ? 'green' : 'red'}`}></span>
          </div>
          <select
            className="sidebar-model-dropdown"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="gemma">Gemma</option>
            <option value="gpt4">GPT-4o Mini</option>
          </select>
          <div className="sidebar-model-pills">
            <button
              className={`sidebar-model-pill ${selectedModel === 'gemma' ? 'active' : ''}`}
              onClick={() => setSelectedModel('gemma')}
            >
              Gemma (Local)
            </button>
          )}
          {(conversations.length > 0 || messages.length > 0) && (
            <button className="dashboard-nav-btn nav-danger" onClick={clearAllConversations}>
              <Trash2 size={15} />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Ollama Connection status box */}
        <div className="sidebar-status-box">
          <div className="sidebar-status-header">
            <span className={`status-dot ${ollamaConnected ? 'green' : 'red'}`}></span>
            <span>Ollama {ollamaConnected ? 'Connected' : 'Offline'}</span>
          </div>
          <span className="sidebar-status-subtext">
            {ollamaConnected ? 'http://localhost:11434' : 'Connection failed'}
          </span>
        </div>

        <div className="sidebar-divider" />
        
        {/* Footer with user info & theme toggle & logout */}
        <div className="sidebar-footer" style={{ padding: '0.25rem 0', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="user-profile" style={{ flex: 1 }}>
            <div className="avatar">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (() => {
                const displayName = user?.name || currentUser?.displayName || currentUser?.email;
                if (!displayName) return "U";
                return displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              })()}
            </div>
            <div className="user-info">
              <span className="user-name" title={user?.name || currentUser?.displayName || currentUser?.email || 'User'} style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 600 }}>
                {user?.name || currentUser?.displayName || currentUser?.email || "User"}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="theme-toggle-btn"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
                transition: "all 0.2s ease"
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            
            <button
              onClick={logout}
              title="Log Out"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========== Main Content ========== */}
      {view === 'settings' ? (
        <SettingsPage theme={theme} setTheme={setTheme} />
      ) : view === 'admin' ? (
        <AdminPage getToken={getToken} />
      ) : view === 'agents' ? (
        <AgentRunsPage getToken={getToken} />
      ) : view === 'apikey' ? (
        <ApiKeyPage getToken={getToken} />
      ) : view === 'metrics' ? (
        <MetricsView
          metrics={metricsData}
          onClearMetrics={() => setMetricsData([])}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <main className="dashboard-main">
          {/* Header */}
          <header className="dashboard-header">
            <div className="dashboard-header-title">
              <h1>DASHBOARD</h1>
              <p>Monitor your AI connections, sessions, and token metrics in real-time.</p>
            </div>
            <div className="dashboard-header-actions">
              <div className="status-badge-container">
                <div className="status-badge">
                  <span className="status-dot green"></span>
                  <span>System Status: Healthy</span>
                </div>
                <div className="status-badge">
                  <span className={`status-dot ${ollamaConnected ? 'green' : 'red'}`}></span>
                  <span>Ollama: {ollamaConnected ? 'Running' : 'Offline'}</span>
                </div>
                <div className="status-badge">
                  <span>{currentTime}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="dashboard-body">
            {/* Top row: Chat Card */}
            <div className="dashboard-card chat-card-container">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">
                  <MessageSquare size={16} />
                  <span>Chat</span>
                </div>
                {(conversations.length > 0 || messages.length > 0) && (
                  <button className="metrics-clear-btn" onClick={clearAllConversations}>
                    <Trash2 size={13} />
                    <span>Clear Chat</span>
                  </button>
                )}
              </div>
              
              {/* Messages container */}
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="message system-message">
                    <div className="message-content">
                      <div className="bot-avatar">
                        <GoogleIcon />
                      </div>
                      <div className="text">
                        <h2>Hello! I'm Gemma E4B.</h2>
                        <p>Ask me anything or attach a PDF / image to get started.</p>
                        <div className="suggestions">
                          {['Compare these two ideas...', 'Write a story about a robot', 'Help me debug this React code'].map(s => (
                            <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}-message`}>
                      <div className="message-content">
                        <div className={m.role === 'user' ? 'user-avatar' : 'bot-avatar'}>
                          {m.role === 'user' ? (
                            currentUser?.photoURL ? (
                              <img src={currentUser.photoURL} alt="User avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <User size={18} />
                            )
                          ) : (
                            <GoogleIcon />
                          )}
                        </div>
                        <div className="text">
                          {m.image && (
                            <img
                              src={m.image}
                              alt={m.fileName || 'uploaded image'}
                              style={{
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                                margin: '1rem 0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                display: 'block',
                              }}
                            />
                          )}
                          <ReactMarkdown components={{
                            img: ({ src, alt }) => (
                              <img
                                src={src}
                                alt={alt}
                                style={{
                                  maxWidth: '240px',
                                  maxHeight: '160px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  margin: '0.5rem 0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                  display: 'block',
                                }}
                              />
                            ),
                          }}>{m.content}</ReactMarkdown>
                          {m.role === 'bot' && m.metrics && (
                            <div className="message-metrics">
                              <div className="metrics-header-row">
                                <div className="metrics-title-group">
                                  <span className="metrics-bolt-icon">⚡</span>
                                  <span className="metrics-title">METRICS ({(m.metrics?.modelLabel || 'Gemma').toUpperCase()})</span>
                                </div>
                                <div className="metrics-latency-pill">
                                  <span className="metrics-clock-icon">⏱️</span>
                                  <span className="metrics-latency-text">
                                    {(m.metrics?.latencyMs ?? 0) >= 1000 
                                      ? `${((m.metrics?.latencyMs ?? 0) / 1000).toFixed(2)}s` 
                                      : `${m.metrics?.latencyMs ?? 0}ms`}
                                  </span>
                                </div>
                              </div>
                              <div className="metrics-row-grid">
                                <div className="metric-subcard">
                                  <span className="metric-subcard-label">INPUT TEXT</span>
                                  <span className="metric-subcard-val">{m.metrics?.inputTextTokens ?? 0} Tokens</span>
                                </div>
                                <div className="metric-subcard">
                                  <span className="metric-subcard-label">INPUT ATTACHMENTS</span>
                                  <span className="metric-subcard-val">{m.metrics?.inputAttachmentTokens ?? 0} Tokens</span>
                                </div>
                                <div className="metric-subcard">
                                  <span className="metric-subcard-label">OUTPUT TOKENS</span>
                                  <span className="metric-subcard-val">{m.metrics?.outputTokens ?? 0} Tokens</span>
                                </div>
                                <div className="metric-subcard">
                                  <span className="metric-subcard-label">INPUT COST</span>
                                  <span className="metric-subcard-val">${(m.metrics?.inputCostUsd ?? 0).toFixed(6)}</span>
                                </div>
                                <div className="metric-subcard">
                                  <span className="metric-subcard-label">OUTPUT COST</span>
                                  <span className="metric-subcard-val">${(m.metrics?.outputCostUsd ?? 0).toFixed(6)}</span>
                                </div>
                                <div className="metric-subcard total-cost-card">
                                  <span className="metric-subcard-label">TOTAL COST</span>
                                  <span className="metric-subcard-val">${(m.metrics?.totalCostUsd ?? 0).toFixed(6)}</span>
                                  <span className="metric-subcard-subval">₹{(m.metrics?.totalCostInr ?? 0).toFixed(4)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="message bot-message">
                    <div className="message-content">
                      <div className="bot-avatar">
                        <GoogleIcon />
                      </div>
                      <div className="typing">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area inside Chat Card */}
              <footer className="input-area">
                <form onSubmit={handleSend} className="chat-input-container">
                  {fileError && (
                    <div className="file-error">
                      <span>{fileError}</span>
                      <button type="button" onClick={() => setFileError('')}><X size={14} /></button>
                    </div>
                  )}

                  {selectedFile && (
                    <div className="file-preview">
                      {isImageFile(selectedFile) ? <Image size={16} /> : <FileText size={16} />}
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      {uploadProgress !== null ? (
                        <div className="upload-progress">
                          <div className="upload-progress-track">
                            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <span className="upload-progress-label">{uploadProgress}%</span>
                        </div>
                      ) : (
                        <button type="button" className="file-remove" onClick={removeFile}><X size={14} /></button>
                      )}
                    </div>
                  )}

                  <div className="input-wrapper">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInput}
                      placeholder={`Message TokenLens...`}
                      rows="1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                    <div className="input-actions">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className={`tool-btn ${selectedFile ? 'tool-btn-active' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title="Attach a PDF (max 10 MB)"
                      >
                        <Paperclip size={18} />
                      </button>
                      <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="disclaimer">{selectedModel === 'gpt4' ? 'GPT-4o Mini' : 'Gemma E4B'} can make mistakes. Check important info.</p>
                </form>
              </footer>
            </div>

            {/* Bottom Row: TokenLens Metrics Dashboard Card */}
            <div className="dashboard-card analytics-card-container">
              <div className="dashboard-card-header">
                <div className="dashboard-card-title">
                  <Layers size={16} />
                  <span>TokenLens Analytics</span>
                </div>
              )}

              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInput}
                  placeholder={`Message ${selectedModel === 'gpt4' ? 'GPT-4o Mini' : 'TokenLens'}...`}
                  rows="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <div className="input-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="model-select"
                  >
                    <option value="gemma">Gemma</option>
                    <option value="gpt4">GPT-4o Mini</option>
                  </select>
                  <button
                    type="button"
                    className={`tool-btn ${selectedFile ? 'tool-btn-active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Attach a PDF (max 3 MB)"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '1.25rem' }}>
                <DashboardMetrics metrics={metricsData} />
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('gemma_theme');
    return saved ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('gemma_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <ProtectedRoute theme={theme} setTheme={setTheme}>
        <AppContent theme={theme} setTheme={setTheme} />
      </ProtectedRoute>
    </AuthProvider>
  );
}
