import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import './App.css';
import DebugHealthPage from './pages/DebugHealthPage';

function HomePage() {
  return (
    <section>
      <h1>ExposureRadar</h1>
      <p>
        This is the initial shell of the ExposureRadar frontend. The goal of
        this app is to provide security teams with a clear view of their
        external exposure and findings.
      </p>
      <p>
        During Phase 0 we will focus on:
      </p>
      <ul>
        <li>Verifying the backend health and metrics endpoints.</li>
        <li>Building basic navigation and debug screens.</li>
        <li>Preparing the layout for future asset and findings views.</li>
      </ul>
      <p>
        You can use the navigation bar to open the{' '}
        <Link to="/debug/health">Debug health</Link> page.
      </p>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-brand">
            <span className="app-title">ExposureRadar</span>
          </div>
          <nav className="app-nav">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/debug/health"
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              Debug health
            </NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/debug/health" element={<DebugHealthPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
