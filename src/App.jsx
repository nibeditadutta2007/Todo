import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCheck, ChevronDown,
  CircleHelp, Clock3, Compass, Flame, Plus, Sparkles,
  Target, Trash2, X
} from "lucide-react";

const STATUS = {
  pending: { label: "Pending", className: "pending" },
  ongoing: { label: "Ongoing", className: "ongoing" },
  done: { label: "Done", className: "done" }
};

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function App() {
  const user = useMemo(() => ({
    id: 0,
    name: "Guest",
    email: "guest@daylight.local"
  }), []);

  return <Dashboard user={user} />;
}

function Dashboard({ user }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const dateKey = toDateString(selectedDate);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { todos: items } = await api(`/api/todos?date=${dateKey}`);
      setTodos(items);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  const counts = useMemo(() => ({
    total: todos.length,
    done: todos.filter((todo) => todo.status === "done").length,
    ongoing: todos.filter((todo) => todo.status === "ongoing").length,
    pending: todos.filter((todo) => todo.status === "pending").length
  }), [todos]);

  async function addTodo(event) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { todo } = await api("/api/todos", {
        method: "POST",
        body: JSON.stringify({ title: newTitle, description: newDescription, dueDate: dateKey })
      });
      setTodos((current) => [todo, ...current]);
      setNewTitle("");
      setNewDescription("");
      setShowComposer(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(todo, status) {
    setError("");
    try {
      const { todo: updated } = await api(`/api/todos/${todo.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setTodos((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function deleteTodo(todo) {
    setError("");
    try {
      await api(`/api/todos/${todo.id}`, { method: "DELETE" });
      setTodos((current) => current.filter((item) => item.id !== todo.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const dateLabel = selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const shortDate = selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const progress = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <div className="dashboard-shell">
      <div className="cosmic-figure" aria-hidden="true">
        <div className="cosmic-fog" />
        <svg className="hooded-silhouette" viewBox="0 0 240 440" fill="none">
          <defs>
            <linearGradient id="cloak-shade" x1="120" y1="98" x2="120" y2="426" gradientUnits="userSpaceOnUse">
              <stop stopColor="#171322" />
              <stop offset=".55" stopColor="#090910" />
              <stop offset="1" stopColor="#030408" />
            </linearGradient>
            <linearGradient id="hood-edge" x1="64" y1="31" x2="177" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8A63B8" stopOpacity=".5" />
              <stop offset="1" stopColor="#352849" stopOpacity=".08" />
            </linearGradient>
          </defs>
          <path d="M120 22C84 22 58 49 54 91l-7 43c-2 13-9 23-18 31 16 5 30 3 41-4 12 14 30 22 50 22s38-8 50-22c11 7 25 9 41 4-9-8-16-18-18-31l-7-43c-4-42-30-69-66-69Z" fill="#09080F" stroke="url(#hood-edge)" strokeWidth="3" />
          <path d="M120 35c-27 0-47 23-50 55l-4 44c11 19 30 31 54 31s43-12 54-31l-4-44c-3-32-23-55-50-55Z" fill="#05060B" />
          <path d="M120 168c-34 0-63 18-78 48l-24 163c-2 16 8 29 24 33 21 5 49 8 78 8s57-3 78-8c16-4 26-17 24-33l-24-163c-15-30-44-48-78-48Z" fill="url(#cloak-shade)" stroke="#4A3863" strokeOpacity=".24" strokeWidth="2" />
          <path d="M120 180c-8 37-9 86-7 131l7 105m0-236c8 37 9 86 7 131l-7 105" stroke="#77608E" strokeOpacity=".17" strokeWidth="2" />
          <path d="M42 226c22 11 48 16 78 16s56-5 78-16" stroke="#8C6AA7" strokeOpacity=".11" strokeWidth="2" />
        </svg>
      </div>
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#"><span className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></span><span>daylight<span className="brand-dot">.</span></span></a>
        <div className="sidebar-label">WORKSPACE</div>
        <div className="side-link active"><span className="side-icon"><Target size={17} /></span><span>My day</span><span className="side-count">{counts.total}</span></div>
        <div className="side-link muted"><span className="side-icon"><Compass size={17} /></span><span>Daily focus</span></div>
        <div className="sidebar-bottom"><div className="profile-row"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><span>Making today count</span></div></div><div className="sidebar-version"><span><span className="online-dot" /> ALL YOURS, ALL SAVED</span><span>V 1.0</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>MY WORKSPACE</span><span className="crumb-divider">/</span><strong>MY DAY</strong></div><div className="topbar-right"><span className="today-pill"><span className="online-dot" /> YOUR PERSONAL SPACE</span><button className="help-button" title="Your tasks are private and saved to your account" aria-label="About your tasks"><CircleHelp size={17} /></button></div></header>
        <div className="page-content">
          <div className="greeting-row"><div><div className="eyebrow"><span className="live-dot" /> {greeting().toUpperCase()}, {user.name.split(" ")[0].toUpperCase()}</div><h1>Make today <span>count.</span></h1><p className="page-subtitle">A clear mind starts with a clear plan.</p></div><div className="date-control"><button className="date-arrow" aria-label="Previous day" onClick={() => setSelectedDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))}><ArrowLeft size={16} /></button><div className="date-display"><span>{selectedDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span><strong>{selectedDate.getDate()}</strong><span>{selectedDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</span></div><button className="date-arrow" aria-label="Next day" onClick={() => setSelectedDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))}><ArrowRight size={16} /></button></div></div>

          <section className="focus-card"><div className="focus-card-content"><div className="focus-heading"><span className="focus-icon"><Sparkles size={17} /></span><span>YOUR DAILY FOCUS</span><span className="focus-date">{shortDate}</span></div><h2>{counts.total ? (counts.done === counts.total ? "Look at you, all done." : "One thing at a time.") : "Start where you are."}</h2><p>{counts.total ? (counts.done === counts.total ? "You showed up for yourself today. That's worth celebrating." : "You don't need to do it all. Just the next thing.") : "Write down what matters today. You can figure out the rest as you go."}</p><div className="focus-progress"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><span>{progress}%</span></div></div><div className="focus-art" aria-hidden="true"><div className="study-book book-back"><span /></div><div className="study-book book-middle"><span /></div><div className="study-book book-front"><span /></div><div className="study-laptop"><div className="laptop-screen"><span /><span /><span /></div><div className="laptop-base" /></div><div className="study-pencil"><span className="pencil-tip" /><span className="pencil-body" /><span className="pencil-eraser" /></div></div></section>

          <section className="stats-row"><StatCard icon={<Target size={16} />} label="ON YOUR LIST" value={counts.total} tone="stat-dark" /><StatCard icon={<Clock3 size={16} />} label="IN PROGRESS" value={counts.ongoing} tone="stat-yellow" /><StatCard icon={<CheckCheck size={16} />} label="COMPLETED" value={counts.done} tone="stat-green" /><StatCard icon={<Flame size={16} />} label="STILL TO DO" value={counts.pending} tone="stat-red" /></section>

          <section className="tasks-section"><div className="tasks-heading"><div><span className="eyebrow section-eyebrow">THE GAME PLAN</span><h2>Your tasks <span className="task-total">{counts.total}</span></h2><p>{dateLabel}{toDateString(new Date()) === dateKey ? " · This is your day." : ""}</p></div><button className="primary-button add-button" onClick={() => setShowComposer((current) => !current)}>{showComposer ? <X size={17} /> : <Plus size={17} />}{showComposer ? "Close" : "Add a task"}</button></div>
            {showComposer && <form className="composer" onSubmit={addTodo}><div className="composer-fields"><input autoFocus placeholder="What would you like to get done?" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={120} required /><input placeholder="Add a note (optional)" value={newDescription} onChange={(event) => setNewDescription(event.target.value)} maxLength={500} /></div><button className="primary-button composer-submit" disabled={saving || !newTitle.trim()}>{saving ? "Saving..." : "Add to my day"} <ArrowRight size={15} /></button></form>}
            {error && <div className="dashboard-error" role="alert">{error}</div>}
            {loading ? <div className="empty-state"><div className="empty-icon"><Sparkles size={22} /></div><strong>Setting the scene...</strong><span>Just getting your day ready.</span></div> : todos.length ? <div className="task-list">{todos.map((todo, index) => <TaskCard key={todo.id} todo={todo} index={index} onStatus={updateStatus} onDelete={deleteTodo} />)}</div> : <div className="empty-state"><div className="empty-icon"><Sparkles size={22} /></div><strong>Nothing on the list. Yet.</strong><span>A fresh page is full of possibility. Add your first task when you're ready.</span><button className="empty-add" onClick={() => setShowComposer(true)}><Plus size={15} /> Add your first task</button></div>}
            <div className="tasks-footnote"><span><span className="online-dot" /> AUTO-SAVED AS YOU GO</span><span>YOU'RE DOING GREAT, BY THE WAY <Sparkles size={13} /></span></div>
          </section>
        </div>
        <footer className="page-footer"><span>DAYLIGHT © 2026</span><span>A LITTLE MORE ROOM TO BREATHE <Sparkles size={12} /></span></footer>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, tone }) {
  return <div className={`stat-card ${tone}`}><div className="stat-top"><span>{icon}</span><span>{label}</span></div><strong>{value}</strong></div>;
}

function TaskCard({ todo, index, onStatus, onDelete }) {
  const status = STATUS[todo.status];
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className={`task-card task-${status.className}`} style={{ animationDelay: `${index * 55}ms` }}>
      <div className="task-status-indicator" />
      <div className="task-main"><button className={`task-check ${todo.status === "done" ? "checked" : ""}`} aria-label={todo.status === "done" ? "Mark as pending" : "Mark as done"} onClick={() => onStatus(todo, todo.status === "done" ? "pending" : "done")}>{todo.status === "done" && <Check size={13} />}</button><div className="task-copy"><strong className={todo.status === "done" ? "task-done-title" : ""}>{todo.title}</strong>{todo.description && <span>{todo.description}</span>}</div></div>
      <div className="task-actions"><div className="status-picker"><button className={`status-badge ${status.className}`} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={`Status: ${status.label}. Change status.`}><span className="status-dot" />{status.label}<ChevronDown size={13} /></button>{menuOpen && <div className="status-menu">{Object.entries(STATUS).map(([key, item]) => <button key={key} onClick={() => { onStatus(todo, key); setMenuOpen(false); }}><span className={`status-dot ${item.className}`} />{item.label}{todo.status === key && <Check size={13} />}</button>)}</div>}</div><button className="icon-button delete-button" title="Delete task" aria-label={`Delete ${todo.title}`} onClick={() => onDelete(todo)}><Trash2 size={15} /></button></div>
    </article>
  );
}

export default App;
