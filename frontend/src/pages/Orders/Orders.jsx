import { useState, useEffect } from 'react'
import { fetchOrders, createOrder, deleteOrder } from '../../services/orderService.js'
import { fetchCustomers } from '../../services/customerService.js'
import { fetchProducts } from '../../services/inventoryService.js'

function getProductMeta(name = '') {
  const lower = name.toLowerCase()
  if (lower.includes('macbook') || lower.includes('laptop')) {
    return { type: 'Laptop', icon: '💻', color: '#e2e8f0' }
  }
  if (lower.includes('iphone') || lower.includes('phone') || lower.includes('galaxy') || lower.includes('fold')) {
    return { type: 'Phone', icon: '📱', color: '#f3e8ff' }
  }
  if (lower.includes('zoom') || lower.includes('keyboard')) {
    return { type: 'Keyboard', icon: '⌨️', color: '#fed7aa' }
  }
  if (lower.includes('airpods') || lower.includes('earphones') || lower.includes('headphone')) {
    return { type: 'Earphones', icon: '🎧', color: '#dcfce7' }
  }
  if (lower.includes('odyssey') || lower.includes('display') || lower.includes('monitor') || lower.includes('screen')) {
    return { type: 'Displays', icon: '🖥️', color: '#e0f2fe' }
  }
  if (lower.includes('mouse') || lower.includes('superlight') || lower.includes('logitech')) {
    return { type: 'Mouse', icon: '🖱️', color: '#f1f5f9' }
  }
  return { type: 'General', icon: '📦', color: '#e2e8f0' }
}

export default function Orders({ onTabChange, onLogout, user }) {
  const email = user?.email || 'admin@logitrack.com'
  const username = email.split('@')[0]
  const parts = username.split(/[\._-]/)
  const displayName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const displayInitials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Pagination state
  const [activePage, setActivePage] = useState(1)

  // Dropdown & Toast states
  const [profileOpen, setProfileOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('Last 7 Days')
  const [toast, setToast] = useState(null)

  // Line Chart Hover state
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // API Integration states
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Place Order Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }])
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
      const ordData = await fetchOrders()
      const custData = await fetchCustomers()
      const prodData = await fetchProducts()
      setOrders(ordData)
      setCustomers(custData)
      setProducts(prodData)
    } catch (err) {
      console.error("Error loading orders page data:", err)
      setError("Failed to load orders list.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected order(s)?`)) {
      return
    }

    try {
      setLoading(true)
      const deletePromises = Array.from(selectedIds).map(id => deleteOrder(Number(id)))
      await Promise.all(deletePromises)
      showToast(`Successfully deleted ${selectedIds.size} order(s).`)
      setSelectedIds(new Set())
      await loadData()
    } catch (err) {
      console.error("Error deleting orders:", err)
      showToast("Failed to delete some orders. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceOrderSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!selectedCustomerId) errors.customer = 'Please select a customer.'
    
    const validItems = orderItems.filter(item => item.product_id && item.quantity > 0)
    if (validItems.length === 0) {
      errors.items = 'Please add at least one valid product item.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        items: validItems.map(item => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity)
        }))
      }
      
      const response = await createOrder(payload)
      if (response.error) {
        setFormErrors({ items: response.error })
        return
      }

      showToast("Order placed successfully!")
      setIsOrderModalOpen(false)
      setSelectedCustomerId('')
      setOrderItems([{ product_id: '', quantity: 1 }])
      setFormErrors({})
      loadData()
    } catch (err) {
      console.error("Error placing order:", err)
      showToast("Failed to place order. Please check stock levels.")
    }
  }

  // Generate dynamic recent activity from backend orders
  const getInitials = (name) => {
    if (!name) return ''
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const activities = orders.slice(0, 5).map((o) => {
    const cust = customers.find(c => c.id === o.customer_id)
    const custName = cust ? cust.full_name : 'Customer'
    const totalQty = o.items ? o.items.reduce((sum, item) => sum + item.quantity, 0) : 0
    const orderDate = new Date(o.created_at)
    const timeStr = orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    
    return {
      id: `act-${o.id}`,
      name: custName,
      initials: getInitials(custName),
      avatarClass: `avatar-gm`,
      count: `${totalQty} Product${totalQty !== 1 ? 's' : ''}`,
      time: timeStr
    }
  })

  // Group orders by month using created_at date
  const monthlySales = Array(12).fill(0)
  orders.forEach(o => {
    if (o.created_at) {
      const date = new Date(o.created_at)
      const month = date.getMonth()
      monthlySales[month] += Number(o.total_amount)
    }
  })

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartData = MONTH_NAMES.map((name, index) => {
    const total = monthlySales[index]
    return {
      name,
      direct: total * 0.5,
      retail: total * 0.3,
      wholesale: total * 0.2
    }
  })

  // Chart Dimension Configuration
  const chartWidth = 670
  const chartHeight = 190
  const chartPaddingLeft = 50
  const chartPaddingTop = 20
  const yZero = chartPaddingTop + chartHeight
  const xStep = chartWidth / 11

  // Dynamic scaling for chart Y-axis ticks
  const maxVal = Math.max(...chartData.map(d => Math.max(d.direct, d.retail, d.wholesale, 1000)))

  // Helper to map values to Y-pixels
  const valToPxHeight = (v) => (v / maxVal) * chartHeight

  // Create SVG path string for a line
  const getLinePathD = (key) => {
    return chartData.map((d, index) => {
      const x = chartPaddingLeft + index * xStep
      const y = yZero - valToPxHeight(d[key])
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  // Handle Chart Node Hover
  const handleNodeHover = (e, lineName, month, value, color) => {
    const chartContainerRect = e.currentTarget.parentElement.getBoundingClientRect()
    const x = e.clientX - chartContainerRect.left
    const y = e.clientY - chartContainerRect.top - 10
    setHoveredPoint({
      lineName,
      month,
      value,
      color,
      x,
      y
    })
  }

  // Transform orders data for UI rendering
  const transformedOrders = orders.map(o => {
    let name = 'Empty Order'
    let category = 'General'
    let quantity = 0
    
    if (o.items && o.items.length > 0) {
      const firstItem = o.items[0]
      name = firstItem.product_name || 'Product'
      if (o.items.length > 1) {
        name += ` (+${o.items.length - 1} more)`
      }
      category = getProductMeta(firstItem.product_name).type
      quantity = o.items.reduce((sum, item) => sum + item.quantity, 0)
    }

    return {
      id: String(o.id),
      name,
      code: `#${String(o.id).padStart(4, '0')}`,
      category,
      quantity,
      price: `$ ${Number(o.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  })

  const filteredOrders = transformedOrders

  // Pagination setup (5 items per page)
  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  )

  // Toggle selection for a single row
  const handleSelectRow = (id) => {
    const nextSelected = new Set(selectedIds)
    if (nextSelected.has(id)) {
      nextSelected.delete(id)
    } else {
      nextSelected.add(id)
    }
    setSelectedIds(nextSelected)
  }

  // Toggle selection for all visible items on current page
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageIds = paginatedOrders.map(o => o.id)
      setSelectedIds(new Set([...selectedIds, ...currentPageIds]))
    } else {
      const currentPageIds = paginatedOrders.map(o => o.id)
      const nextSelected = new Set(selectedIds)
      currentPageIds.forEach(id => nextSelected.delete(id))
      setSelectedIds(nextSelected)
    }
  }

  const isCurrentPageAllSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedIds.has(o.id))

  return (
    <div className="page page-orders">
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

      {/* Header bar: Title and Place Order */}
      <div className="inventory-header">
        <div className="header-left-group">
          <div className="header-title">
            <h1 className="page-title">Sales Orders</h1>
          </div>

          <div className="header-actions">
            {selectedIds.size > 0 ? (
              <button className="delete-selected-btn" onClick={handleDeleteSelected}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            ) : (
              <button className="place-order-btn" onClick={() => setIsOrderModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Place Order</span>
              </button>
            )}
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
        
        {/* Left Column: Orders list table & Sales Report Line Chart */}
        <div className="dashboard-left-column">
          
          {/* Sales Orders list card */}
          <div className="card" style={{ padding: '24px 20px' }}>
            <div className="table-card-header">
              <span className="section-heading">Sales Orders</span>
              
              {/* Dropdown Filter */}
              <div className="dropdown-container">
                <button className="table-filter-btn" onClick={() => setFilterOpen(!filterOpen)}>
                  <span>{selectedFilter}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {filterOpen && (
                  <ul className="dropdown-menu">
                    {['Last 7 Days', 'Last 30 Days', 'This Month', 'This Year'].map((filter) => (
                      <li 
                        key={filter} 
                        className="dropdown-item"
                        onClick={() => {
                          setSelectedFilter(filter)
                          setFilterOpen(false)
                          showToast(`Filtered by ${filter}`)
                        }}
                      >
                        {filter}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="product-table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="product-checkbox" 
                        checked={isCurrentPageAllSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Product Name</th>
                    <th>Order Code</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Total Price</th>
                    <th style={{ textAlign: 'right', width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
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
                          <span>Loading orders...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--danger-color)', fontWeight: 600 }}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && paginatedOrders.map((o) => {
                    const isSelected = selectedIds.has(o.id)
                    return (
                      <tr key={o.id} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            className="product-checkbox" 
                            checked={isSelected}
                            onChange={() => handleSelectRow(o.id)}
                          />
                        </td>
                        <td className="product-name-cell">{o.name}</td>
                        <td className="product-code-cell">{o.code}</td>
                        <td>
                          <span className="product-type-badge">{o.category}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{o.quantity}</td>
                        <td className="product-price-cell">{o.price}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="invoice-link" 
                            onClick={() => showToast(`Opening invoice ${o.code} for ${o.name}...`)}
                          >
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && !error && paginatedOrders.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No orders found.
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

          {/* Sales Report Multi-line chart card */}
          <div className="card" style={{ padding: '24px 20px' }}>
            <div className="chart-card-header">
              <h2 className="section-heading">Sales Report</h2>
              <div className="chart-legends">
                <div className="legend-item">
                  <span className="legend-dot direct-sales"></span>
                  <span>Direct Sales</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot retail"></span>
                  <span>Retail</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot wholesale"></span>
                  <span>Wholesale</span>
                </div>
              </div>
            </div>

            <div className="chart-container">
              {/* Custom SVG Line Chart */}
              <svg className="chart-svg" viewBox="0 0 740 240">
                {/* Horizontal grid lines */}
                {[0, Math.round(maxVal*0.2), Math.round(maxVal*0.4), Math.round(maxVal*0.6), Math.round(maxVal*0.8), Math.round(maxVal)].map((val) => {
                  const y = yZero - valToPxHeight(val)
                  return (
                    <g key={val}>
                      <line className="chart-grid-line" x1={chartPaddingLeft} y1={y} x2={chartPaddingLeft + chartWidth} y2={y} />
                      <text className="chart-axis-text" x={chartPaddingLeft - 10} y={y + 4} textAnchor="end">{val.toLocaleString()}</text>
                    </g>
                  )
                })}

                {/* Vertical Axis line */}
                <line className="chart-axis-line" x1={chartPaddingLeft} y1={chartPaddingTop} x2={chartPaddingLeft} y2={yZero} />
                
                {/* Horizontal Axis line */}
                <line className="chart-axis-line" x1={chartPaddingLeft} y1={yZero} x2={chartPaddingLeft + chartWidth} y2={yZero} />

                {/* Render three trend paths */}
                <path className="chart-line-path" d={getLinePathD('direct')} stroke="#38bdf8" strokeWidth="2.5" />
                <path className="chart-line-path" d={getLinePathD('retail')} stroke="#a855f7" strokeWidth="2.5" />
                <path className="chart-line-path" d={getLinePathD('wholesale')} stroke="#ec4899" strokeWidth="2.5" />

                {/* Render nodes for hover tooltips */}
                {/* Direct Sales nodes */}
                {chartData.map((d, idx) => {
                  const x = chartPaddingLeft + idx * xStep
                  const y = yZero - valToPxHeight(d.direct)
                  return (
                    <circle 
                      key={`d-${idx}`}
                      className="chart-node-circle"
                      cx={x} cy={y} r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5"
                      onMouseMove={(e) => handleNodeHover(e, 'Direct Sales', d.name, d.direct, '#38bdf8')}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  )
                })}

                {/* Retail nodes */}
                {chartData.map((d, idx) => {
                  const x = chartPaddingLeft + idx * xStep
                  const y = yZero - valToPxHeight(d.retail)
                  return (
                    <circle 
                      key={`r-${idx}`}
                      className="chart-node-circle"
                      cx={x} cy={y} r="4.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5"
                      onMouseMove={(e) => handleNodeHover(e, 'Retail', d.name, d.retail, '#a855f7')}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  )
                })}

                {/* Wholesale nodes */}
                {chartData.map((d, idx) => {
                  const x = chartPaddingLeft + idx * xStep
                  const y = yZero - valToPxHeight(d.wholesale)
                  return (
                    <circle 
                      key={`w-${idx}`}
                      className="chart-node-circle"
                      cx={x} cy={y} r="4.5" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5"
                      onMouseMove={(e) => handleNodeHover(e, 'Wholesale', d.name, d.wholesale, '#ec4899')}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  )
                })}

                {/* Render X Axis labels */}
                {chartData.map((d, idx) => {
                  const x = chartPaddingLeft + idx * xStep
                  return (
                    <text key={`l-${idx}`} className="chart-axis-text" x={x} y={yZero + 18} textAnchor="middle">{d.name}</text>
                  )
                })}
              </svg>

              {/* Chart hover tooltip */}
              {hoveredPoint && (
                <div 
                  className="chart-tooltip"
                  style={{
                    display: 'block',
                    left: hoveredPoint.x,
                    top: hoveredPoint.y
                  }}
                >
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
                    {hoveredPoint.month}
                  </div>
                  <div style={{ color: hoveredPoint.color, fontWeight: 700 }}>
                    {hoveredPoint.lineName}: {hoveredPoint.value.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: User Profile, Quick Actions, Recent activity (orders) */}
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
                <button className="action-item-btn" onClick={() => showToast("Exporting sales orders as CSV...")}>
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

          {/* Recent Orders Timeline Activity Feed */}
          <div className="card activity-card">
            <h3 className="section-heading">Recent Activity</h3>
            <ul className="activity-list">
              {activities.map((act) => (
                <li key={act.id} className="activity-item">
                  <div className={`activity-avatar ${act.avatarClass}`}>
                    {act.initials}
                  </div>
                  <div className="activity-content">
                    <span className="activity-action">
                      Ordered <span className="ordered-highlight">{act.count}</span>
                    </span>
                    <div className="activity-meta">
                      <span className="activity-product-name">{act.name}</span>
                      <span className="activity-time">{act.time}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Place Order Modal Overlay */}
      {isOrderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Place New Order</h2>
              <button className="modal-close-btn" onClick={() => { setIsOrderModalOpen(false); setFormErrors({}); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handlePlaceOrderSubmit}>
              {/* Select Customer */}
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select 
                  className="form-input"
                  style={{ appearance: 'auto', padding: '10px' }}
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
                {formErrors.customer && <span className="form-error">{formErrors.customer}</span>}
              </div>

              {/* Order Items Section */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label">Order Items</label>
                  <button 
                    type="button" 
                    className="view-orders-link" 
                    style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setOrderItems([...orderItems, { product_id: '', quantity: 1 }])}
                  >
                    + Add Product
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {orderItems.map((item, idx) => {
                    const selectedProd = products.find(p => p.id === Number(item.product_id))
                    const itemPrice = selectedProd ? Number(selectedProd.price) : 0
                    
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                          className="form-input"
                          style={{ flex: 2, appearance: 'auto', padding: '10px' }}
                          value={item.product_id}
                          onChange={e => {
                            const updated = [...orderItems]
                            updated[idx].product_id = e.target.value
                            setOrderItems(updated)
                          }}
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.quantity_in_stock <= 0}>
                              {p.name} {p.quantity_in_stock <= 0 ? '(Out of Stock)' : `($${p.price} | Stock: ${p.quantity_in_stock})`}
                            </option>
                          ))}
                        </select>

                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: '80px' }}
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => {
                            const updated = [...orderItems]
                            updated[idx].quantity = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value))
                            setOrderItems(updated)
                          }}
                        />

                        <div style={{ width: '80px', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          ${(itemPrice * (Number(item.quantity) || 0)).toLocaleString()}
                        </div>

                        {orderItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = orderItems.filter((_, i) => i !== idx)
                              setOrderItems(updated)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger-color)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                {formErrors.items && <span className="form-error" style={{ marginTop: '8px' }}>{formErrors.items}</span>}
              </div>

              {/* Total Summary */}
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid var(--border-color)', 
                borderRadius: '10px', 
                padding: '12px 16px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Order Total:</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-color)' }}>
                  ${orderItems.reduce((sum, item) => {
                    const p = products.find(prod => prod.id === Number(item.product_id))
                    return sum + (p ? Number(p.price) : 0) * (Number(item.quantity) || 0)
                  }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => { setIsOrderModalOpen(false); setFormErrors({}); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
