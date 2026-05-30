import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileVideo, Loader2, CheckCircle2, Copy, Download,
         Clock, Globe, ChevronDown, ChevronUp, History, Zap, Languages, AlertCircle } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const LANGUAGES = {
  en: "English",   hi: "Hindi",      es: "Spanish",  fr: "French",
  de: "German",    ja: "Japanese",   ko: "Korean",   zh: "Chinese",
  ar: "Arabic",    pt: "Portuguese", ru: "Russian",  it: "Italian",
  bn: "Bengali",   ur: "Urdu",       ta: "Tamil",    te: "Telugu",
  mr: "Marathi",   gu: "Gujarati",   pa: "Punjabi",  ml: "Malayalam",
};

function formatDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s/60)}m ${s%60}s`;
}
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="icon-btn" title="Copy">
      {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
    </button>
  );
}

function TranslatePanel({ result }) {
  const [targetLang, setTargetLang]     = useState("en");
  const [translating, setTranslating]   = useState(false);
  const [translated, setTranslated]     = useState(null);
  const [translateErr, setTranslateErr] = useState("");
  const [transTab, setTransTab]         = useState("transcript");
  const baseName = result.filename.replace(/\.[^.]+$/, "");

  const handleTranslate = async () => {
    setTranslating(true); setTranslateErr(""); setTranslated(null);
    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ srt: result.srt_captions, transcript: result.transcript, target_language: targetLang }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Translation failed"); }
      const data = await res.json();
      setTranslated(data); setTransTab("transcript");
    } catch (e) { setTranslateErr(e.message); }
    finally { setTranslating(false); }
  };

  return (
    <div className="translate-panel">
      <div className="translate-header"><Languages size={15} /><span>Translate Captions</span></div>
      <div className="translate-controls">
        <div className="lang-selector-wrap">
          <Globe size={13} className="lang-icon" />
          <select className="lang-select" value={targetLang}
            onChange={e => { setTargetLang(e.target.value); setTranslated(null); }}>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code} disabled={code === result.language?.toLowerCase()}>
                {name}{code === result.language?.toLowerCase() ? " (source)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button className={`translate-btn ${translating ? "loading" : ""}`}
          onClick={handleTranslate} disabled={translating || targetLang === result.language?.toLowerCase()}>
          {translating ? <><Loader2 size={14} className="spin" />Translating…</> : <><Languages size={14} />Translate</>}
        </button>
      </div>
      {translateErr && <p className="translate-err">{translateErr}</p>}
      {translated && (
        <div className="translated-result">
          <div className="translated-badge">Translated to {translated.target_language_name}</div>
          <div className="tab-row">
            {["transcript","captions"].map(t => (
              <button key={t} className={`tab ${transTab===t?"active":""}`} onClick={() => setTransTab(t)}>
                {t === "transcript" ? "Transcript" : "SRT Captions"}
              </button>
            ))}
          </div>
          {transTab === "transcript" && (
            <div className="content-box">
              <div className="content-actions">
                <CopyButton text={translated.translated_transcript} />
                <button className="icon-btn" onClick={() => downloadFile(translated.translated_transcript, `${baseName}_${targetLang}.txt`, "text/plain")} title="Download"><Download size={15} /></button>
              </div>
              <p className="transcript-text">{translated.translated_transcript}</p>
            </div>
          )}
          {transTab === "captions" && (
            <div className="content-box">
              <div className="content-actions">
                <CopyButton text={translated.translated_srt} />
                <button className="icon-btn" onClick={() => downloadFile(translated.translated_srt, `${baseName}_${targetLang}.srt`, "text/plain")} title="Download"><Download size={15} /></button>
              </div>
              <pre className="srt-text">{translated.translated_srt}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, elapsed }) {
  const [tab, setTab] = useState("transcript");
  const baseName = result.filename.replace(/\.[^.]+$/, "");
  return (
    <>
      <div className="result-card">
        <div className="result-header">
          <div className="result-meta">
            <span className="meta-chip"><Globe size={13} />{result.language?.toUpperCase()}</span>
            <span className="meta-chip"><Clock size={13} />{formatDuration(result.duration_seconds)}</span>
            {elapsed && <span className="meta-chip">⚡ {formatElapsed(elapsed)}</span>}
            <span className="filename-chip">{result.filename}</span>
          </div>
          <span className="status-badge">✓ Done</span>
        </div>
        <div className="tab-row">
          {["transcript","captions"].map(t => (
            <button key={t} className={`tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t === "transcript" ? "Transcript" : "SRT Captions"}
            </button>
          ))}
        </div>
        {tab === "transcript" && (
          <div className="content-box">
            <div className="content-actions">
              <CopyButton text={result.transcript} />
              <button className="icon-btn" onClick={() => downloadFile(result.transcript, `${baseName}.txt`, "text/plain")} title="Download"><Download size={15} /></button>
            </div>
            <p className="transcript-text">{result.transcript}</p>
          </div>
        )}
        {tab === "captions" && (
          <div className="content-box">
            <div className="content-actions">
              <CopyButton text={result.srt_captions} />
              <button className="icon-btn" onClick={() => downloadFile(result.srt_captions, `${baseName}.srt`, "text/plain")} title="Download"><Download size={15} /></button>
            </div>
            <pre className="srt-text">{result.srt_captions}</pre>
          </div>
        )}
      </div>
      <TranslatePanel result={result} />
    </>
  );
}

function HistoryPanel({ jobs, onSelect }) {
  const [open, setOpen] = useState(false);
  if (!jobs.length) return null;
  return (
    <div className="history-panel">
      <button className="history-toggle" onClick={() => setOpen(!open)}>
        <History size={15} /><span>Recent ({jobs.length})</span>
        {open ? <ChevronDown size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="history-list">
          {jobs.map(j => (
            <button key={j.job_id} className="history-item" onClick={() => onSelect(j)}>
              <span className="hi-name">{j.filename}</span>
              <span className="hi-meta">{j.language?.toUpperCase()} · {formatDuration(j.duration_seconds)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Animated dots for processing label
function ProcessingLabel({ elapsed }) {
  const msgs = [
    "Uploading file…",
    "Extracting audio…",
    "Detecting language…",
    "Transcribing speech…",
    "Generating captions…",
    "Almost done…",
  ];
  const idx = Math.min(Math.floor(elapsed / 15000), msgs.length - 1);
  return <p className="proc-title">{msgs[idx]}</p>;
}

export default function App() {
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [status, setStatus]       = useState("idle");
  const [elapsed, setElapsed]     = useState(0);
  const [result, setResult]       = useState(null);
  const [resultElapsed, setResultElapsed] = useState(null);
  const [error, setError]         = useState("");
  const [history, setHistory]     = useState([]);
  const [apiOk, setApiOk]         = useState(null);
  const inputRef  = useRef();
  const startRef  = useRef(null);
  const timerRef  = useRef(null);

  useEffect(() => {
    if (!API_BASE) { setApiOk(false); return; }
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(10000) })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  const startTimer = () => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 500);
  };
  const stopTimer = () => {
    clearInterval(timerRef.current);
    return Date.now() - (startRef.current || Date.now());
  };

  const processFile = useCallback(async (f) => {
    setFile(f); setStatus("uploading"); setElapsed(0); setError(""); setResult(null);
    startTimer();
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch(`${API_BASE}/transcribe`, { method: "POST", body: form });
      const took = stopTimer();
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || "Server error");
      }
      const data = await res.json();
      setResultElapsed(took);
      setResult(data);
      setStatus("done");
      setHistory(h => [data, ...h.filter(j => j.job_id !== data.job_id)].slice(0, 10));
    } catch (e) {
      stopTimer();
      setError(e.message || "Upload failed.");
      setStatus("error");
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) processFile(f);
  }, [processFile]);

  const reset = () => {
    setStatus("idle"); setFile(null); setResult(null);
    setError(""); setElapsed(0); setResultElapsed(null);
  };

  // Real-time elapsed as MM:SS
  const elapsedSec = Math.floor(elapsed / 1000);
  const elapsedStr = elapsedSec < 60 ? `${elapsedSec}s` : `${Math.floor(elapsedSec/60)}m ${elapsedSec%60}s`;

  return (
    <div className="app">
      <header className="header">
        <div className="logo"><Zap size={20} /><span>CaptionAI</span></div>
        <p className="tagline">Whisper transcription · any language · Gemini translation</p>
        {apiOk === false && (
          <div className="api-warning"><AlertCircle size={14} /><span>Backend unreachable — check VITE_API_URL in Vercel</span></div>
        )}
        {apiOk === true && (
          <div className="api-ok"><span className="api-dot" /><span>Backend connected</span></div>
        )}
      </header>

      <main className="main">
        {status === "idle" && (
          <div className={`dropzone ${dragging?"dragging":""}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current.click()}>
            <input ref={inputRef} type="file" hidden
              accept="video/*,audio/*,.mp4,.mov,.mkv,.avi,.webm,.mp3,.wav,.m4a,.ogg"
              onChange={e => { const f = e.target.files[0]; if (f) processFile(f); }} />
            <div className="dz-icon"><Upload size={32} /></div>
            <p className="dz-title">Drop your video or audio file</p>
            <p className="dz-sub">MP4 · MOV · MKV · WebM · MP3 · WAV — Any language</p>
            <button className="dz-btn">Choose file</button>
          </div>
        )}

        {status === "uploading" && (
          <div className="processing-card">
            <div className="proc-spinner"><Loader2 size={36} className="spin" /></div>
            <ProcessingLabel elapsed={elapsed} />
            <p className="proc-file"><FileVideo size={13} />{file?.name} · {file ? formatFileSize(file.size) : ""}</p>
            <div className="proc-elapsed">{elapsedStr}</div>
            <div className="proc-wave">
              <span /><span /><span /><span /><span />
            </div>
            <p className="proc-hint">Processing on CPU — typically 30–120s per minute of audio</p>
          </div>
        )}

        {status === "error" && (
          <div className="error-card">
            <p className="err-title">Something went wrong</p>
            <p className="err-msg">{error}</p>
            <button className="retry-btn" onClick={reset}>Try again</button>
          </div>
        )}

        {status === "done" && result && (
          <>
            <ResultPanel result={result} elapsed={resultElapsed} />
            <button className="new-btn" onClick={reset}><Upload size={14} />Transcribe another file</button>
          </>
        )}

        <HistoryPanel jobs={history} onSelect={j => { setResult(j); setResultElapsed(null); setStatus("done"); }} />
      </main>

      <footer className="footer">Powered by faster-whisper · Gemini · Supabase</footer>
    </div>
  );
}
