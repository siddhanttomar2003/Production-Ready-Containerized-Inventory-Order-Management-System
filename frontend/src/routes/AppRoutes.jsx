import { useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import Inventory from '../pages/Inventory/Inventory.jsx'
import Orders from '../pages/Orders/Orders.jsx'
import Suppliers from '../pages/Suppliers/Suppliers.jsx'
import Customers from '../pages/Customers/Customers.jsx'
import AuthPage from '../pages/Auth/AuthPage.jsx'

export default function AppRoutes() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setActiveTab('dashboard')
    setUser(null)
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(userData) => {
      setActiveTab('dashboard')
      setUser(userData)
    }} />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} onLogout={handleLogout} user={user} />
      case 'inventory':
        return <Inventory onTabChange={setActiveTab} onLogout={handleLogout} user={user} />
      case 'orders':
        return <Orders onTabChange={setActiveTab} onLogout={handleLogout} user={user} />
      case 'suppliers':
        return <Suppliers onTabChange={setActiveTab} onLogout={handleLogout} user={user} />
      case 'customers':
        return <Customers onTabChange={setActiveTab} onLogout={handleLogout} user={user} />
      default:
        return <Dashboard onTabChange={setActiveTab} onLogout={handleLogout} user={user} />
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}
