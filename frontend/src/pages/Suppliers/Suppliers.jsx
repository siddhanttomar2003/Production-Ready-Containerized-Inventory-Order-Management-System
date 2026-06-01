import { useState, useEffect } from 'react'
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../services/supplierService.js'

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const COLOR_OPTIONS = [
  '#1a1a1a', '#0f3c99', '#0ea5e9', '#10b981', '#0053a6', '#475569', '#7c3aed', '#ea580c', '#f25022', '#007dbb'
]

export default function Suppliers({ onTabChange, onLogout, user }) {
  const email = user?.email || 'admin@logitrack.com'
  const username = email.split('@')[0]
  const parts = username.split(/[\._-]/)
  const displayName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const displayInitials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()

  // Pagination state (8 items per page)
  const [activePage, setActivePage] = useState(1)

  // Dropdown, Hover, and Toast states
  const [profileOpen, setProfileOpen] = useState(false)
  const [hoveredSlice, setHoveredSlice] = useState(null)
  const [hoveredSlicePos, setHoveredSlicePos] = useState({ x: 0, y: 0 })
  const [toast, setToast] = useState(null)

  // API Integration states
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add Supplier Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone_number: '',
    logo: '',
    color: '#1a1a1a'
  })
  const [formErrors, setFormErrors] = useState({})

  // Edit Supplier Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSupplierId, setEditSupplierId] = useState(null)
  const [editSupplier, setEditSupplier] = useState({
    name: '',
    email: '',
    phone_number: '',
    logo: '',
    color: '#1a1a1a'
  })
  const [editErrors, setEditErrors] = useState({})

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  const loadSuppliers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSuppliers()
      setSuppliers(data)
    } catch (err) {
      console.error("Error loading suppliers:", err)
      setError("Failed to load suppliers list.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/

    if (!newSupplier.name.trim()) {
      errors.name = 'Supplier name is required.'
    } else if (newSupplier.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters.'
    }

    if (!newSupplier.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(newSupplier.email.trim())) {
      errors.email = 'Invalid email address format.'
    }

    if (!newSupplier.phone_number.trim()) {
      errors.phone_number = 'Contact number is required.'
    } else if (!phoneRegex.test(newSupplier.phone_number.trim())) {
      errors.phone_number = 'Invalid phone number format (e.g. +63 123 4243).'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await createSupplier({
        name: newSupplier.name,
        email: newSupplier.email,
        phone_number: newSupplier.phone_number,
        logo: newSupplier.logo.trim() || getInitials(newSupplier.name),
        color: newSupplier.color
      })

      if (response.error) {
        setFormErrors({ email: response.error })
        return
      }

      showToast("Supplier added successfully!")
      setNewSupplier({ name: '', email: '', phone_number: '', logo: '', color: '#1a1a1a' })
      setFormErrors({})
      setIsAddModalOpen(false)
      loadSuppliers()
    } catch (err) {
      console.error("Error creating supplier:", err)
      showToast("Failed to add supplier. Please check connection.")
    }
  }

  const handleOpenEdit = (s) => {
    setEditSupplierId(s.id)
    setEditSupplier({
      name: s.name || '',
      email: s.email || '',
      phone_number: s.phone_number || '',
      logo: s.logo || '',
      color: s.color || '#1a1a1a'
    })
    setEditErrors({})
    setIsEditModalOpen(true)
  }

  const handleEditSupplierSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/

    if (!editSupplier.name.trim()) {
      errors.name = 'Supplier name is required.'
    } else if (editSupplier.name.trim().length < 2) {
      errors.name = 'Supplier name must be at least 2 characters.'
    }

    if (!editSupplier.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(editSupplier.email.trim())) {
      errors.email = 'Invalid email address format.'
    }

    if (!editSupplier.phone_number.trim()) {
      errors.phone_number = 'Contact number is required.'
    } else if (!phoneRegex.test(editSupplier.phone_number.trim())) {
      errors.phone_number = 'Invalid phone number format (e.g. +63 123 4243).'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    try {
      const response = await updateSupplier(editSupplierId, {
        name: editSupplier.name,
        email: editSupplier.email,
        phone_number: editSupplier.phone_number,
        logo: editSupplier.logo.trim() || getInitials(editSupplier.name),
        color: editSupplier.color
      })

      if (response.error) {
        setEditErrors({ email: response.error })
        return
      }

      showToast("Supplier updated successfully!")
      setIsEditModalOpen(false)
      setEditErrors({})
      loadSuppliers()
    } catch (err) {
      console.error("Error updating supplier:", err)
      showToast("Failed to update supplier. Please try again.")
    }
  }

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier ${name}?`)) {
      return
    }
    try {
      await deleteSupplier(Number(id))
      showToast(`Successfully deleted ${name}.`)
      loadSuppliers()
    } catch (err) {
      console.error("Error deleting supplier:", err)
      showToast("Failed to delete supplier.")
    }
  }

  // Calculate dynamic top suppliers pie chart data based on first 4 suppliers
  const topSuppliers = suppliers.slice(0, 4)
  const totalWeight = topSuppliers.reduce((sum, _, idx) => sum + (4 - idx), 0)
  const pieData = topSuppliers.map((s, idx) => {
    const weight = 4 - idx
    const percentage = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0
    return {
      name: s.name,
      percentage: percentage,
      color: s.color || '#38bdf8',
      class: `sup-${idx}`
    }
  })

  // Normalize/Calculate cumulative slices for rendering the SVG
  const pieTotalVal = 100

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

  const filteredSuppliers = suppliers

  // Paginated suppliers (8 items per page)
  const itemsPerPage = 8
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage)
  const paginatedSuppliers = filteredSuppliers.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  )

  let cumulativePercent = 0

  return (
    <div className="page page-suppliers">
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

      {/* Header bar: Title & Add button */}
      <div className="inventory-header">
        <div className="header-left-group">
          <div className="header-title">
            <h1 className="page-title">Suppliers</h1>
          </div>

          <div className="header-actions">
            <button className="edit-suppliers-btn" onClick={() => setIsAddModalOpen(true)}> 
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span>Add Supplier</span>
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
        
        {/* Left Column: Suppliers list table */}
        <div className="dashboard-left-column">
          <div className="card" style={{ padding: '24px 20px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Suppliers</h2>
            
            <div className="product-table-wrapper">
              <table className="product-table" style={{ borderSpacing: '0 10px' }}>
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Email</th>
                    <th>Contact No.</th>
                    <th style={{ textAlign: 'right', width: '220px' }}></th>
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
                          <span>Loading suppliers...</span>
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
                  {!loading && !error && paginatedSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="supplier-logo-cell">
                          <div 
                            className="supplier-logo-container" 
                            style={{ 
                              backgroundColor: `${s.color || '#38bdf8'}15`, 
                              color: s.color || '#38bdf8',
                              borderColor: `${s.color || '#38bdf8'}30`
                            }}
                          >
                            {s.logo || getInitials(s.name)}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.name}</span>
                        </div>
                      </td>
                      <td>{s.email}</td>
                      <td>{s.phone_number}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            className="order-history-link" 
                            onClick={() => showToast(`Opening order history for ${s.name}...`)}
                          >
                            Order History
                          </button>
                          <button 
                            className="view-orders-link" 
                            onClick={() => handleOpenEdit(s)}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteSupplier(s.id, s.name)}
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
                  {!loading && !error && paginatedSuppliers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No suppliers found.
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
                  onClick={() => setActivePage(activePage + 1)}
                >
                  &gt;
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: User profile, Quick Actions, Top Suppliers pie chart */}
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
                <button className="action-item-btn" onClick={() => setIsAddModalOpen(true)}>
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
                <button className="action-item-btn" onClick={() => showToast("Exporting suppliers as CSV...")}>
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

          {/* Top Suppliers Pie Chart Card */}
          <div className="card activity-card" style={{ gap: '8px' }}>
            <h3 className="section-heading">Top Suppliers</h3>
            
            <div className="pie-chart-container">
              {pieData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                  No supplier data available.
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
                      className="pie-legend-dot" 
                      style={{ backgroundColor: slice.color }}
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

      {/* Add Supplier Modal Overlay */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Add New Supplier</h2>
              <button className="modal-close-btn" onClick={() => { setIsAddModalOpen(false); setFormErrors({}); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleAddSupplierSubmit}>
              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Logitech"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. logitech@gmail.com"
                  value={newSupplier.email}
                  onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
                {formErrors.email && <span className="form-error">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Contact / Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +63 123 4567"
                  value={newSupplier.phone_number}
                  onChange={e => setNewSupplier({ ...newSupplier, phone_number: e.target.value })}
                />
                {formErrors.phone_number && <span className="form-error">{formErrors.phone_number}</span>}
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Logo / Initials</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. L"
                    maxLength="5"
                    value={newSupplier.logo}
                    onChange={e => setNewSupplier({ ...newSupplier, logo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Theme Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewSupplier({ ...newSupplier, color: c })}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: newSupplier.color === c ? '2px solid var(--text-main)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          boxShadow: newSupplier.color === c ? '0 0 4px rgba(0,0,0,0.2)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
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
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal Overlay */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Edit Supplier</h2>
              <button className="modal-close-btn" onClick={() => { setIsEditModalOpen(false); setEditErrors({}); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditSupplierSubmit}>
              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Logitech"
                  value={editSupplier.name}
                  onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })}
                />
                {editErrors.name && <span className="form-error">{editErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. logitech@gmail.com"
                  value={editSupplier.email}
                  onChange={e => setEditSupplier({ ...editSupplier, email: e.target.value })}
                />
                {editErrors.email && <span className="form-error">{editErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Contact / Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +63 123 4567"
                  value={editSupplier.phone_number}
                  onChange={e => setEditSupplier({ ...editSupplier, phone_number: e.target.value })}
                />
                {editErrors.phone_number && <span className="form-error">{editErrors.phone_number}</span>}
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Logo / Initials</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. L"
                    maxLength="5"
                    value={editSupplier.logo}
                    onChange={e => setEditSupplier({ ...editSupplier, logo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Theme Color</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditSupplier({ ...editSupplier, color: c })}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: editSupplier.color === c ? '2px solid var(--text-main)' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          boxShadow: editSupplier.color === c ? '0 0 4px rgba(0,0,0,0.2)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setIsEditModalOpen(false); setEditErrors({}); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
