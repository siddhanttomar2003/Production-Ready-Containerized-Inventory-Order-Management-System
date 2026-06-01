import { useState, useEffect } from 'react'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../services/inventoryService.js'
import { fetchOrders } from '../../services/orderService.js'

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

export default function Inventory({ onTabChange, onLogout, user }) {
  const email = user?.email || 'admin@logitrack.com'
  const username = email.split('@')[0]
  const parts = username.split(/[\._-]/)
  const displayName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  const displayInitials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : username.slice(0, 2).toUpperCase()

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Profile and Toast states
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // API Integration states
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add Product Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  })
  const [formErrors, setFormErrors] = useState({})

  // Edit Product Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState(null)
  const [editProduct, setEditProduct] = useState({
    name: '',
    sku: '',
    price: '',
    quantity_in_stock: ''
  })
  const [editErrors, setEditErrors] = useState({})

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => {
      setToast(null)
    }, 2500)
  }

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (err) {
      console.error("Error fetching products:", err)
      setError("Failed to load inventory from backend.")
    } finally {
      setLoading(false)
    }
  }

  const [activities, setActivities] = useState([])

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const loadActivities = async () => {
    try {
      const ordersData = await fetchOrders()
      if (ordersData && !ordersData.error) {
        const orderActivities = []
        ordersData.forEach(o => {
          if (o.items) {
            o.items.forEach(item => {
              const meta = getProductMeta(item.product_name)
              orderActivities.push({
                id: `sold-${o.id}-${item.product_id}`,
                action: 'Sold',
                amount: `${item.quantity} Product${item.quantity !== 1 ? 's' : ''}`,
                productName: item.product_name || 'Product',
                time: formatRelativeTime(o.created_at),
                icon: meta.icon,
                color: meta.color,
                isRestock: false,
                timestamp: new Date(o.created_at)
              })
            })
          }
        })
        orderActivities.sort((a, b) => b.timestamp - a.timestamp)
        setActivities(orderActivities.slice(0, 5))
      }
    } catch (err) {
      console.error("Error loading activities:", err)
    }
  }

  useEffect(() => {
    loadProducts()
    loadActivities()
  }, [])

  const handleAddProductSubmit = async (e) => {
    e.preventDefault()
    
    // Simple validation
    const errors = {}
    const skuRegex = /^[A-Z0-9]+(-[A-Z0-9]+)+$/
    
    if (!newProduct.name.trim()) {
      errors.name = 'Product name is required.'
    }
    
    if (!newProduct.sku.trim()) {
      errors.sku = 'SKU/Code is required.'
    } else if (!skuRegex.test(newProduct.sku)) {
      errors.sku = 'SKU/Code must be in uppercase alphanumeric format with hyphens (e.g., LAP-1001, MBP-212-122).'
    }
    
    if (newProduct.price === '' || parseFloat(newProduct.price) < 0) {
      errors.price = 'Price must be non-negative.'
    }
    if (newProduct.quantity_in_stock === '' || parseInt(newProduct.quantity_in_stock) < 0) {
      errors.quantity_in_stock = 'Quantity cannot be negative.'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const response = await createProduct({
        name: newProduct.name,
        sku: newProduct.sku,
        price: parseFloat(newProduct.price),
        quantity_in_stock: parseInt(newProduct.quantity_in_stock)
      })

      if (response.error) {
        setFormErrors({ sku: response.error })
        return
      }

      showToast("Product added successfully!")
      
      const meta = getProductMeta(newProduct.name)
      const newAct = {
        id: `added-${Date.now()}`,
        action: 'Added',
        amount: `${newProduct.quantity_in_stock} Products`,
        productName: newProduct.name,
        time: 'Just now',
        icon: meta.icon,
        color: meta.color,
        isRestock: true,
        timestamp: new Date()
      }
      setActivities(prev => [newAct, ...prev].slice(0, 5))

      setNewProduct({ name: '', sku: '', price: '', quantity_in_stock: '' })
      setFormErrors({})
      setIsAddModalOpen(false)
      loadProducts()
    } catch (err) {
      console.error("Error creating product:", err)
      showToast("Failed to add product. Please check connection.")
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} selected product(s)?`)) {
      return
    }

    try {
      setLoading(true)
      const deletePromises = Array.from(selectedIds).map(id => deleteProduct(Number(id)))
      await Promise.all(deletePromises)
      showToast(`Successfully deleted ${selectedIds.size} product(s).`)
      setSelectedIds(new Set())
      await loadProducts()
    } catch (err) {
      console.error("Error deleting products:", err)
      showToast("Failed to delete some products. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEdit = () => {
    if (selectedIds.size !== 1) {
      showToast('Select a single product to edit.')
      return
    }

    const [selectedId] = Array.from(selectedIds)
    const product = products.find(p => String(p.id) === String(selectedId))
    if (!product) {
      showToast('Selected product not found.')
      return
    }

    setEditProductId(product.id)
    setEditProduct({
      name: product.name || '',
      sku: product.sku || '',
      price: product.price ?? '',
      quantity_in_stock: product.quantity_in_stock ?? ''
    })
    setEditErrors({})
    setIsEditModalOpen(true)
  }

  const handleEditProductSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    const skuRegex = /^[A-Z0-9]+(-[A-Z0-9]+)+$/
    
    if (!editProduct.name.trim()) {
      errors.name = 'Product name is required.'
    }
    
    if (!editProduct.sku.trim()) {
      errors.sku = 'SKU/Code is required.'
    } else if (!skuRegex.test(editProduct.sku)) {
      errors.sku = 'SKU/Code must be in uppercase alphanumeric format with hyphens (e.g., LAP-1001, MBP-212-122).'
    }
    
    if (editProduct.price === '' || parseFloat(editProduct.price) < 0) {
      errors.price = 'Price must be non-negative.'
    }
    if (editProduct.quantity_in_stock === '' || parseInt(editProduct.quantity_in_stock) < 0) {
      errors.quantity_in_stock = 'Quantity cannot be negative.'
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    try {
      const response = await updateProduct(editProductId, {
        name: editProduct.name,
        sku: editProduct.sku,
        price: parseFloat(editProduct.price),
        quantity_in_stock: parseInt(editProduct.quantity_in_stock)
      })

      if (response.error) {
        setEditErrors({ sku: response.error })
        return
      }

      showToast('Product updated successfully!')
      setIsEditModalOpen(false)
      setEditErrors({})
      setSelectedIds(new Set())
      
      const origProd = products.find(p => p.id === editProductId)
      const newQty = parseInt(editProduct.quantity_in_stock)
      const origQty = origProd ? origProd.quantity_in_stock : 0
      if (newQty > origQty) {
        const meta = getProductMeta(editProduct.name)
        const newAct = {
          id: `restocked-${Date.now()}`,
          action: 'Restocked',
          amount: `${newQty - origQty} Products`,
          productName: editProduct.name,
          time: 'Just now',
          icon: meta.icon,
          color: meta.color,
          isRestock: true,
          timestamp: new Date()
        }
        setActivities(prev => [newAct, ...prev].slice(0, 5))
      }

      await loadProducts()
    } catch (err) {
      console.error('Error updating product:', err)
      showToast('Failed to update product. Please try again.')
    }
  }

  // Transform backend products to match original component attributes
  const transformedProducts = products.map(p => {
    const meta = getProductMeta(p.name)
    return {
      id: String(p.id),
      name: p.name,
      code: p.sku || '',
      type: meta.type,
      price: `$ ${Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`,
      quantity: p.quantity_in_stock,
      icon: meta.icon,
      color: meta.color
    }
  })

  const filteredProducts = transformedProducts

  // Toggle selection for single product
  const handleSelectRow = (id) => {
    const nextSelected = new Set(selectedIds)
    if (nextSelected.has(id)) {
      nextSelected.delete(id)
    } else {
      nextSelected.add(id)
    }
    setSelectedIds(nextSelected)
  }

  // Toggle select all visible products
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allVisibleIds = filteredProducts.map(p => p.id)
      setSelectedIds(new Set(allVisibleIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id))

  return (
    <div className="page page-inventory">
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
            <h1 className="page-title">Inventory</h1>
          </div>

          <div className="header-actions">
            {selectedIds.size > 0 ? (
              <>
                <button
                  className="edit-product-btn"
                  onClick={handleOpenEdit}
                  disabled={selectedIds.size !== 1}
                  title={selectedIds.size !== 1 ? 'Select exactly one product to edit.' : 'Edit selected product'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span>Edit Selected</span>
                </button>
                <button className="delete-selected-btn" onClick={handleDeleteSelected}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              </>
            ) : (
              <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>Add</span>
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

      {/* Split Grid Layout */}
      <div className="dashboard-grid">
        
        {/* Left Column: Product List */}
        <div className="dashboard-left-column">
          <div className="card" style={{ padding: '24px 20px' }}>
            <h2 className="section-heading" style={{ marginBottom: '20px' }}>Product List</h2>
            
            <div className="product-table-wrapper">
              <table className="product-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="product-checkbox" 
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>Image</th>
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
                          <span>Loading products...</span>
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
                  {!loading && !error && filteredProducts.map((p) => {
                    const isSelected = selectedIds.has(p.id)
                    return (
                      <tr key={p.id} className={isSelected ? 'selected' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            className="product-checkbox" 
                            checked={isSelected}
                            onChange={() => handleSelectRow(p.id)}
                          />
                        </td>
                        <td className="product-name-cell">{p.name}</td>
                        <td className="product-code-cell">{p.code}</td>
                        <td>
                          <span className="product-type-badge">{p.type}</span>
                        </td>
                        <td className="product-price-cell">{p.price}</td>
                        <td className={`product-qty-cell ${p.quantity <= 5 ? 'product-qty-low' : ''}`}>
                          {p.quantity}
                        </td>
                        <td>
                          <div className="product-thumbnail-container" style={{ margin: '0 auto' }}>
                            {p.icon}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && !error && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Profile, Quick Actions, Recent Activity */}
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
                <button className="action-item-btn" onClick={() => showToast("Exporting inventory as CSV...")}>
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

          {/* Recent Activity Card */}
          <div className="card activity-card">
            <h3 className="section-heading">Recent Activity</h3>
            <ul className="activity-list">
              {activities.map((act) => (
                <li key={act.id} className="activity-item">
                  <div className="activity-icon-container" style={{ backgroundColor: act.color }}>
                    {act.icon}
                  </div>
                  <div className="activity-content">
                    <span className="activity-action">
                      {act.action}{' '}
                      <span className={act.isRestock ? 'restocked-highlight' : 'sold-highlight'}>
                        {act.amount}
                      </span>
                    </span>
                    <div className="activity-meta">
                      <span className="activity-product-name">{act.productName}</span>
                      <span className="activity-time">{act.time}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Add Product Modal Overlay */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Add New Product</h2>
              <button className="modal-close-btn" onClick={() => { setIsAddModalOpen(false); setFormErrors({}); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleAddProductSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Macbook Pro"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                />
                {formErrors.name && <span className="form-error">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Product Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. MBP-14-2026"
                  value={newProduct.sku}
                  onChange={e => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                />
                {formErrors.sku && <span className="form-error">{formErrors.sku}</span>}
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="form-input" 
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                  {formErrors.price && <span className="form-error">{formErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    placeholder="0"
                    value={newProduct.quantity_in_stock}
                    onChange={e => setNewProduct({ ...newProduct, quantity_in_stock: e.target.value })}
                  />
                  {formErrors.quantity_in_stock && <span className="form-error">{formErrors.quantity_in_stock}</span>}
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
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal Overlay */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Edit Product</h2>
              <button className="modal-close-btn" onClick={() => { setIsEditModalOpen(false); setEditErrors({}); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditProductSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Macbook Pro"
                  value={editProduct.name}
                  onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                />
                {editErrors.name && <span className="form-error">{editErrors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Product Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MBP-14-2026"
                  value={editProduct.sku}
                  onChange={e => setEditProduct({ ...editProduct, sku: e.target.value.toUpperCase() })}
                />
                {editErrors.sku && <span className="form-error">{editErrors.sku}</span>}
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={editProduct.price}
                    onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                  />
                  {editErrors.price && <span className="form-error">{editErrors.price}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={editProduct.quantity_in_stock}
                    onChange={e => setEditProduct({ ...editProduct, quantity_in_stock: e.target.value })}
                  />
                  {editErrors.quantity_in_stock && <span className="form-error">{editErrors.quantity_in_stock}</span>}
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
