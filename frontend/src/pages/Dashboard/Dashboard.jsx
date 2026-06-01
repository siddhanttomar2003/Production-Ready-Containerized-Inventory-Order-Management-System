import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../services/api.js'

export default function Dashboard({ onTabChange, onLogout, user }) {
  const email = user?.email || 'admin@logitrack.com'
  const username = email.split('@')[0]
  const parts = username.split(/[\._-]/)
  const displayName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const displayInitials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()

  const [summary, setSummary] = useState({
    total_products: 343,
    total_customers: 82,
    total_orders: 1043,
    low_stock_products: 8
  })

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard`)
        const data = await response.json()
        if (data && !data.error) {
          setSummary({
            total_products: data.total_products,
            total_customers: data.total_customers,
            total_orders: data.total_orders,
            low_stock_products: data.low_stock_products ? data.low_stock_products.length : 0
          })
        }
      } catch (err) {
        console.error("Error fetching dashboard summary:", err)
      }
    }
    fetchSummary()
  }, [])

  // Chart Hover State
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 })

  // Dropdown States
  const [profileOpen, setProfileOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('Last 7 Days')

  // Toast Notification State
  const [toast, setToast] = useState(null)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  // Stock Report Data
  const chartData = [
    { name: 'Jan', stockIn: 8000, stockOut: 7500 },
    { name: 'Feb', stockIn: 6500, stockOut: 7000 },
    { name: 'Mar', stockIn: 8500, stockOut: 7000 },
    { name: 'Apr', stockIn: 11000, stockOut: 7000 },
    { name: 'May', stockIn: 5000, stockOut: 4500 },
    { name: 'Jun', stockIn: 6000, stockOut: 6000 },
    { name: 'Jul', stockIn: 7500, stockOut: 7200 },
    { name: 'Aug', stockIn: 12500, stockOut: 6700 },
    { name: 'Sep', stockIn: 10000, stockOut: 6600 },
    { name: 'Oct', stockIn: 6500, stockOut: 5700 },
    { name: 'Nov', stockIn: 8000, stockOut: 7000 },
    { name: 'Dec', stockIn: 5500, stockOut: 5300 },
  ]

  // Chart configuration
  const chartWidth = 670
  const chartHeight = 190
  const chartPaddingLeft = 50
  const chartPaddingTop = 20
  const colWidth = chartWidth / 12
  const barWidth = 24
  const yZero = chartPaddingTop + chartHeight // 210px

  // Helper to map values to SVG coordinates
  const valToPxHeight = (v) => (v / 25000) * chartHeight

  // Fast Moving Items data
  const fastMovingItems = [
    { name: 'Macbook Pro', icon: '💻', color: '#e2e8f0' },
    { name: 'Iphone 14 pro', icon: '📱', color: '#f3e8ff' },
    { name: 'Zoom75', icon: '⌨️', color: '#fed7aa' },
    { name: 'Airpods Pro', icon: '🎧', color: '#dcfce7' },
    { name: 'Samsung Galaxy Fold', icon: '📖', color: '#ffedd5' },
    { name: 'Samsung Odyssey', icon: '🖥️', color: '#e0f2fe' },
    { name: 'Logitech Superlight', icon: '🖱️', color: '#f1f5f9' },
  ]

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Position relative to chart container
    const chartContainerRect = e.currentTarget.parentElement.getBoundingClientRect()
    const x = rect.left - chartContainerRect.left + rect.width / 2
    const y = rect.top - chartContainerRect.top - 10
    setHoveredIndex(index)
    setHoveredPos({ x, y })
  }

  return (
    <div className="page page-dashboard">
      {/* Toast Alert overlay */}
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
          animation: 'slideIn 0.3s ease forwards',
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

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-left-column">
          {/* Sales Summary */}
          <div className="sales-summary-section">
            <h2 className="section-heading">Sales Summary</h2>
            <div className="sales-cards-grid">
              
              {/* Card 1: Total Products */}
              <div className="summary-card pink-theme">
                <div className="summary-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.total_products}</span>
                  <span className="summary-label">Total Products</span>
                </div>
              </div>

              {/* Card 2: Total Customers */}
              <div className="summary-card purple-theme">
                <div className="summary-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.total_customers}</span>
                  <span className="summary-label">Total Customers</span>
                </div>
              </div>

              {/* Card 3: Total Orders */}
              <div className="summary-card blue-theme">
                <div className="summary-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.total_orders}</span>
                  <span className="summary-label">Total Orders</span>
                </div>
              </div>

              {/* Card 4: Low Stock Products */}
              <div className="summary-card orange-theme">
                <div className="summary-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="summary-info">
                  <span className="summary-value">{summary.low_stock_products}</span>
                  <span className="summary-label">Low Stock Products</span>
                </div>
              </div>

            </div>
          </div>

          {/* Stock Report Graph */}
          <div className="card stock-report-card">
            <div className="chart-card-header">
              <h2 className="section-heading">Stock Report</h2>
              <div className="chart-legends">
                <div className="legend-item">
                  <span className="legend-dot stock-in"></span>
                  <span>Stock In</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot stock-out"></span>
                  <span>Stock Out</span>
                </div>
              </div>
            </div>
            <div className="chart-container">
              {/* Custom SVG Interactive Chart */}
              <svg className="chart-svg" viewBox="0 0 740 240">
                {/* Horizontal Grid Lines */}
                {[0, 5000, 10000, 15000, 20000, 25000].map((val) => {
                  const y = yZero - valToPxHeight(val)
                  return (
                    <g key={val}>
                      <line className="chart-grid-line" x1={chartPaddingLeft} y1={y} x2={chartPaddingLeft + chartWidth} y2={y} />
                      <text className="chart-axis-text" x={chartPaddingLeft - 10} y={y + 4} textAnchor="end">{val}</text>
                    </g>
                  )
                })}

                {/* Vertical Axis Line */}
                <line className="chart-axis-line" x1={chartPaddingLeft} y1={chartPaddingTop} x2={chartPaddingLeft} y2={yZero} />
                
                {/* Horizontal Axis Line */}
                <line className="chart-axis-line" x1={chartPaddingLeft} y1={yZero} x2={chartPaddingLeft + chartWidth} y2={yZero} />

                {/* Stacked Bars */}
                {chartData.map((d, index) => {
                  const colX = chartPaddingLeft + index * colWidth + (colWidth - barWidth) / 2
                  
                  // Calculate heights in pixels
                  const inH = valToPxHeight(d.stockIn)
                  const outH = valToPxHeight(d.stockOut)

                  // Subdivide Stock In into 3 segments for visual texture matching design
                  const inSeg1 = inH * 0.4
                  const inSeg2 = inH * 0.35
                  const inSeg3 = inH * 0.25

                  // Subdivide Stock Out into 2 segments
                  const outSeg1 = outH * 0.6
                  const outSeg2 = outH * 0.4

                  // Segment Y positions (drawing from bottom upwards)
                  const y1 = yZero - inSeg1
                  const y2 = y1 - inSeg2
                  const y3 = y2 - inSeg3
                  const y4 = y3 - outSeg1
                  const y5 = y4 - outSeg2

                  return (
                    <g 
                      key={d.name} 
                      className="chart-bar-group"
                      onMouseMove={(e) => handleMouseMove(e, index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Segment 1: Base Stock In (Deep Blue) */}
                      <rect className="chart-bar-rect" x={colX} y={y1} width={barWidth} height={inSeg1} fill="#0284c7" rx={inSeg2 === 0 && inSeg3 === 0 && outH === 0 ? "4" : "0"} />
                      
                      {/* Segment 2: Mid Stock In (Medium Cyan-Blue) */}
                      <rect className="chart-bar-rect" x={colX} y={y2} width={barWidth} height={inSeg2} fill="#38bdf8" />
                      
                      {/* Segment 3: Top Stock In (Light Ice-Blue) */}
                      <rect className="chart-bar-rect" x={colX} y={y3} width={barWidth} height={inSeg3} fill="#a5f3fc" />
                      
                      {/* Segment 4: Base Stock Out (Deep Violet) */}
                      <rect className="chart-bar-rect" x={colX} y={y4} width={barWidth} height={outSeg1} fill="#a855f7" />
                      
                      {/* Segment 5: Top Stock Out (Light Purple) */}
                      <rect className="chart-bar-rect" x={colX} y={y5} width={barWidth} height={outSeg2} fill="#d8b4fe" rx="4" />

                      {/* Transparent overlay for easier hover tracking */}
                      <rect 
                        x={colX} 
                        y={chartPaddingTop} 
                        width={barWidth} 
                        height={chartHeight} 
                        fill="transparent" 
                      />

                      {/* X Axis Label */}
                      <text className="chart-axis-text" x={colX + barWidth / 2} y={yZero + 18} textAnchor="middle">{d.name}</text>
                    </g>
                  )
                })}
              </svg>

              {/* Tooltip Popup */}
              <div 
                className="chart-tooltip" 
                style={{ 
                  display: hoveredIndex !== null ? 'block' : 'none',
                  left: hoveredPos.x,
                  top: hoveredPos.y
                }}
              >
                {hoveredIndex !== null && (
                  <div>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
                      {chartData[hoveredIndex].name}
                    </div>
                    <div style={{ color: '#38bdf8' }}>Stock In: {chartData[hoveredIndex].stockIn.toLocaleString()}</div>
                    <div style={{ color: '#a855f7' }}>Stock Out: {chartData[hoveredIndex].stockOut.toLocaleString()}</div>
                    <div style={{ marginTop: '4px', fontWeight: '800', color: '#cbd5e1' }}>
                      Total: {(chartData[hoveredIndex].stockIn + chartData[hoveredIndex].stockOut).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sales Order Table */}
          <div className="card sales-order-card">
            <div className="table-card-header">
              <h2 className="section-heading">Sales Order</h2>
              
              {/* Filter Dropdown */}
              <div className="dropdown-container">
                <button className="table-filter-btn" onClick={() => setFilterOpen(!filterOpen)}>
                  <span>{selectedFilter}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

            <div className="table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Draft</th>
                    <th>Confirmed</th>
                    <th>Packed</th>
                    <th>Shipped</th>
                    <th>Invoiced</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="channel-name">Direct Sales</td>
                    <td>2</td>
                    <td>32</td>
                    <td>42</td>
                    <td>23</td>
                    <td>7</td>
                  </tr>
                  <tr>
                    <td className="channel-name">Wholesale</td>
                    <td>0</td>
                    <td>41</td>
                    <td>33</td>
                    <td>11</td>
                    <td>14</td>
                  </tr>
                  <tr>
                    <td className="channel-name">Retail</td>
                    <td>2</td>
                    <td>12</td>
                    <td>25</td>
                    <td>16</td>
                    <td>21</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right-column">
          
          {/* User Profile Card */}
          <div className="card profile-card">
            <div className="profile-info">
              <div className="profile-avatar-placeholder">{displayInitials}</div>
              <div className="profile-details">
                <span className="profile-name">{displayName}</span>
                <span className="profile-role">Admin</span>
              </div>
            </div>
            
            {/* Profile Dropdown Menu */}
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
                <button className="action-item-btn" onClick={() => showToast("Exporting data as CSV...")}>
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

          {/* Fast Moving Items Card */}
          <div className="card items-card">
            <h3 className="section-heading">Fast Moving Items</h3>
            <ul className="items-list">
              {fastMovingItems.map((item, idx) => (
                <li key={idx} className="fast-item">
                  <div className="item-icon-wrapper" style={{ backgroundColor: item.color }}>
                    {item.icon}
                  </div>
                  <span className="item-name">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  )
}
