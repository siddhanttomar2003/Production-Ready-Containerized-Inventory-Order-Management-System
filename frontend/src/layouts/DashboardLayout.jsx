import Navbar from '../components/Navbar/Navbar.jsx'
import Sidebar from '../components/Sidebar/Sidebar.jsx'

export default function DashboardLayout({ children, activeTab, onTabChange }) {
  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="layout-body">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
