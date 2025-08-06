import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('light');

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className={`layout ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle Sidebar">
          {sidebarOpen ? '⏴ Close' : '⏵ Open'}
        </button>
        {sidebarOpen && (
          <>
            <h3>Admin Panel</h3>
            <nav>
              <ul>
                <li><a href="#">Dashboard</a></li>
                <li><a href="#">Users</a></li>
                <li><a href="#">Reports</a></li>
                <li><a href="#">Settings</a></li>
                <li><a href="#">Logout</a></li>
              </ul>
            </nav>
          </>
        )}
      </aside>

      {/* Main Content */}
      <main className="main">
        <header className="header">
          <h1>Dashboard</h1>
          <div className="tools">
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            </button>
          </div>
        </header>

        {/* Cards */}
        <section className="dashboard-grid">
          {[
            { title: "Total Users", value: "1,245" },
            { title: "Revenue", value: "$58,230" },
            { title: "Active Sessions", value: "342" },
            { title: "Messages", value: "72" },
          ].map((item, index) => (
            <div key={index} className="card">
              <h4>{item.title}</h4>
              <p>{item.value}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
