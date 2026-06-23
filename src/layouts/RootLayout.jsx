import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function RootLayout() {
  return (
    <div id="app-layout" className="min-h-screen bg-[var(--color-void)]">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Radial gradient from top-left */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--color-neon-faint)_0%,_transparent_70%)] opacity-40" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-steel) 1px, transparent 1px), linear-gradient(90deg, var(--color-steel) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main
        className="relative z-10 pt-[var(--header-height)]"
        style={{ marginLeft: 'var(--sidebar-width)' }}
      >
        <div className="p-6 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
