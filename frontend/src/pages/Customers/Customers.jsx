import { useState, useEffect } from 'react'
import { fetchCustomers, createCustomer, deleteCustomer } from '../../services/customerService.js'
import { fetchOrders } from '../../services/orderService.js'

export default function Customers({ onTabChange, onLogout, user }) {
  const email = user?.email || 'admin@logitrack.com'
  const username = email.split('@')[0]
  const parts = username.split(/[\._-]/)
  const displayName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const displayInitials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()

  // Pagination state (6 items per page)
  const [activePage, setActivePage] = useState(1)

  // Dropdown, Hover, and Toast states
  const [profileOpen, setProfileOpen] = useState(false)
  const [hoveredSlice, setHoveredSlice] = useState(null)
  const [hoveredSlicePos, setHoveredSlicePos] = useState({ x: 0, y: 0 })
  const [toast, setToast] = useState(null)

  // API Integration states
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add Customer Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  })
  const [formErrors, setFormErrors] = useState({})

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const custData = await fetchCustomers()
      const ordData = await fetchOrders()
      setCustomers(custData)
      setOrders(ordData)
    } catch (err) {
      console.error("Error loading customer data:", err)
      setError("Failed to load customer list.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer ${name}?`)) {
      return
    }
    try {
      await deleteCustomer(Number(id))
      showToast(`Successfully deleted ${name}.`)
      loadData()
    } catch (err) {
      console.error("Error deleting customer:", err)
      showToast("Failed to delete customer.")
    }
  }

  const handleAddCustomerSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/

    if (!newCustomer.full_name.trim()) {
      errors.full_name = 'Full name is required.'
    } else if (newCustomer.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters.'
    }

    if (!newCustomer.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(newCustomer.email.trim())) {
      errors.email = 'Invalid email address format.'
    }

    const phoneDigits = newCustomer.phone_number.replace(/\D/g, '')
    const allowedChars = /^[0-9\s\-()]+$/
    if (!newCustomer.phone_number.trim()) {
      errors.phone_number = 'Phone number is required.'
    } else if (!allowedChars.test(newCustomer.phone_number) || phoneDigits.length !== 10) {
      errors.phone_number = 'Phone number must be exactly 10 digits.'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await createCustomer({
        full_name: newCustomer.full_name,
        email: newCustomer.email,
        phone_number: newCustomer.phone_number
      })

      if (response.error) {
        setFormErrors({ email: response.error })
        return
      }

      showToast("Customer added successfully!")
      setNewCustomer({ full_name: '', email: '', phone_number: '' })
      setFormErrors({})
      setIsAddModalOpen(false)
      loadData()
    } catch (err) {
      console.error("Error creating customer:", err)
      showToast("Failed to add customer. Please check connection.")
    }
  }

  function getInitials(name) {
    if (!name) return ''
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#ef4444', '#14b8a6', '#db2777']
  function getColor(id) {
    return COLORS[id % COLORS.length]
  }

  // Transform backend customers to match original component attributes
  const transformedCustomers = customers.map(c => {
    const initials = getInitials(c.full_name)
    return {
      id: String(c.id),
      name: c.full_name,
      email: c.email,
      contact: c.phone_number,
      initials: initials,
      color: getColor(c.id)
    }
  })

  // Calculate dynamic top customers pie chart data
  const topCustomers = transformedCustomers.map(c => {
    const count = orders.filter(o => o.customer_id === Number(c.id)).length
    return {
      name: c.name,
      ordersCount: count,
      color: c.color
    }
  }).filter(tc => tc.ordersCount > 0)
    .sort((a, b) => b.ordersCount - a.ordersCount)
    .slice(0, 4)

  const totalTopOrders = topCustomers.reduce((sum, tc) => sum + tc.ordersCount, 0)
  const pieData = topCustomers.map((tc, idx) => ({
    name: tc.name,
    percentage: totalTopOrders > 0 ? Math.round((tc.ordersCount / totalTopOrders) * 100) : 0,
    color: tc.color,
    class: `cust-${idx}`
  }))

  const pieTotalVal = 100 // Sums exactly to 100

  // Helper geometry angles
  const getCoordinatesForPercent = (percent) => {
    const angle = (percent * 2 * Math.PI) - (Math.PI / 2)
    const x = Math.cos(angle)
    const y = Math.sin(angle)
    return [x, y]
  }

  const getPieSlicePath = (startPercent, endPercent) => {
    const [startX, startY] = getCoordinatesForPercent(startPercent)
    const [endX, endY] = getCoordinatesForPercent(endPercent)
    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0
    
    const r = 76
    const cx = 90
    const cy = 90
    
    const x1 = cx + startX * r
    const y1 = cy + startY * r
    const x2 = cx + endX * r
    const y2 = cy + endY * r
    
    return `
      M ${cx} ${cy}
      L ${x1} ${y1}
      A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `
  }

  // Handle Pie Slice Hover
  const handleSliceHover = (e, slice) => {
    const rect = e.currentTarget.parentElement.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top - 10
    setHoveredSlice(slice)
    setHoveredSlicePos({ x, y })
  }

  // Filter Customers
  const filteredCustomers = transformedCustomers

  // Paginated customers (6 items per page)
  const itemsPerPage = 6
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const paginatedCustomers = filteredCustomers.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  )

  // Calculate cumulative slice starts and endpoints
  let cumulativePercent = 0

  return (
    <div className="page page-customers">
      {/* Toast alert overlay */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}

      {/* Header bar: Title & Edit button */}
      <div className="inventory-header">
        <div className="header-left-group">
          <div className="header-title">
            <h1 className="page-title">Customers</h1>
          </div>

          <div className="header-actions">
            <button className="edit-customers-btn" onClick={() => setIsAddModalOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        <div className="header-profile">
          <div className="card profile-card">
            <div className="profile-info">
              <div className="profile-avatar-placeholder">{displayInitials}</div>
              <div className="profile-details">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">Admin</span>
              </div>
            </div>

            <div className="dropdown-container">
              <button className="profile-menu-btn" onClick={() => setProfileOpen(!profileOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {profileOpen && (
                <ul className="dropdown-menu">
                  <li className="dropdown-item" onClick={() => { setProfileOpen(false); showToast("Opened Settings"); }}>Settings</li>
                  <li className="dropdown-item" onClick={() => { setProfileOpen(false); if (onLogout) onLogout(); }}>Logout</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout grid */}
      <div className="dashboard-grid">
        
        {/* Left Column: Customers list table */}
        <div className="dashboard-left-column">
          <div className="card" style={{ padding: '24px 20px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Customers List</h2>
            
            <div className="product-table-wrapper">
              <table className="product-table" style={{ borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Contact No.</th>
                    <th style={{ textAlign: 'right', width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="2" x2="12" y2="6" />
                            <line x1="12" y1="18" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="6" y2="12" />
                            <line x1="18" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                          </svg>
                          <span>Loading customers...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--danger-color)', fontWeight: 600 }}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && paginatedCustomers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="supplier-logo-cell">
                          <div 
                            className="activity-avatar" 
                            style={{ 
                              background: `linear-gradient(135deg, ${c.color}, ${c.color}bb)`,
                              width: '32px',
                              height: '32px',
                              fontSize: '11px',
                              border: 'none',
                              boxShadow: 'none'
                            }}
                          >
                            {c.initials}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</span>
                        </div>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.contact}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            className="view-orders-link" 
                            onClick={() => showToast(`Viewing orders for ${c.name}...`)}
                          >
                            View Orders
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px',
                              borderRadius: '4px',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && !error && paginatedCustomers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button 
                  className="pagination-btn" 
                  disabled={activePage === 1}
                  onClick={() => setActivePage(activePage - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button 
                    key={idx} 
                    className={`pagination-btn ${activePage === idx + 1 ? 'active' : ''}`}
                    onClick={() => setActivePage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button 
                  className="pagination-btn" 
                  disabled={activePage === totalPages}
                  onClick={() => setActivePage(idx + 1)}
                >
                  &gt;
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: User profile, Quick Actions, Top Customers pie chart */}
        <div className="dashboard-right-column">
          {/* Quick Actions Card */}
          <div className="card actions-card">
            <h3 className="section-heading">Quick Actions</h3>
            <ul className="actions-list">
              <li>
                <button className="action-item-btn" onClick={() => onTabChange && onTabChange('orders')}>
                  <div className="action-item-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span>Create Order</span>
                  </div>
                  <span className="action-shortcut">ctrl + n</span>
                </button>
              </li>
              <li>
                <button className="action-item-btn" onClick={() => onTabChange && onTabChange('inventory')}>
                  <div className="action-item-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Product</span>
                  </div>
                  <span className="action-shortcut">ctrl + p</span>
                </button>
              </li>
              <li>
                <button className="action-item-btn" onClick={() => onTabChange && onTabChange('suppliers')}>
                  <div className="action-item-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <line x1="19" y1="8" x2="19" y2="14" />
                      <line x1="16" y1="11" x2="22" y2="11" />
                    </svg>
                    <span>Add Supplier</span>
                  </div>
                  <span className="action-shortcut">ctrl + k</span>
                </button>
              </li>
              <li>
                <button className="action-item-btn" onClick={() => showToast("Exporting customers as CSV...")}>
                  <div className="action-item-left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Export</span>
                  </div>
                  <span className="action-shortcut">ctrl + s</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Top Customers Pie Chart Card */}
          <div className="card activity-card" style={{ gap: '8px' }}>
            <h3 className="section-heading">Top Customers</h3>
            
            <div className="pie-chart-container">
              {pieData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                  No customer order data available.
                </div>
              ) : (
                <>
                  {/* SVG Pie Chart */}
                  <svg className="pie-chart-svg" viewBox="0 0 180 180">
                    <g style={{ transformOrigin: '90px 90px', transition: 'transform 0.3s' }}>
                      {pieData.map((slice, index) => {
                        const startPercent = cumulativePercent
                        const slicePercent = slice.percentage / pieTotalVal
                        cumulativePercent += slicePercent
                        const endPercent = cumulativePercent

                        return (
                          <path
                            key={slice.name}
                            className="pie-slice"
                            d={getPieSlicePath(startPercent, endPercent)}
                            fill={slice.color}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                            onMouseMove={(e) => handleSliceHover(e, slice)}
                            onMouseLeave={() => setHoveredSlice(null)}
                            style={{ transformOrigin: '90px 90px' }}
                          />
                        )
                      })}
                    </g>
                  </svg>

                  {/* Pie slice tooltip */}
                  {hoveredSlice && (
                    <div 
                      className="chart-tooltip"
                      style={{
                        display: 'block',
                        left: hoveredSlicePos.x,
                        top: hoveredSlicePos.y
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{hoveredSlice.name}</div>
                      <div style={{ color: '#38bdf8', fontWeight: 800 }}>{hoveredSlice.percentage}% Share</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pie chart legends with values aligned right */}
            <ul className="pie-legends-list">
              {pieData.map((slice) => (
                <li key={slice.name} className="pie-legend-item">
                  <div className="pie-legend-left">
                    <span 
                      className={`pie-legend-dot ${slice.class}`}
                    ></span>
                    <span>{slice.name}</span>
                  </div>
                  <span className="pie-legend-val">{slice.percentage}%</span>
                </li>
              ))}
            </ul>

          </div>

        </div>
      </div>

      {/* Add Customer Modal Overlay */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Add New Customer</h2>
              <button className="modal-close-btn" onClick={() => { setIsAddModalOpen(false); setFormErrors({}); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleAddCustomerSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Grace Moreta"
                  value={newCustomer.full_name}
                  onChange={e => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                />
                {formErrors.full_name && <span className="form-error">{formErrors.full_name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. grace@gmail.com"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Contact / Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +63 912 345 6789"
                  value={newCustomer.phone_number}
                  onChange={e => setNewCustomer({ ...newCustomer, phone_number: e.target.value })}
                />
                {formErrors.phone_number && <span className="form-error">{formErrors.phone_number}</span>}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setIsAddModalOpen(false); setFormErrors({}); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
