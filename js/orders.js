// Orders page functionality
let allOrders = [];
let filteredOrders = [];

async function initOrdersPage() {
    try {
        // Load orders
        await loadOrders();
        
        // Setup filters
        setupFilters();
        
        // Setup event listeners
        setupOrdersEventListeners();
        
    } catch (error) {
        console.error('Error initializing orders page:', error);
        showNotification('Failed to load orders', 'danger');
    }
}

// Load orders from backend
async function loadOrders() {
    try {
        showNotification('Loading orders...', 'info');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`);
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.data;
            filteredOrders = [...allOrders];
            
            renderOrdersTable();
            updateOrdersSummary();
            
            showNotification(`Loaded ${allOrders.length} orders`, 'success');
        } else {
            throw new Error(data.error || 'Failed to load orders');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Failed to load orders. Please refresh.', 'danger');
        
        // Load sample data for demo
        loadSampleOrders();
    }
}

// Load sample orders for demo
function loadSampleOrders() {
    allOrders = [
        {
            OrderID: 'ORD001',
            OrderDate: '2024-01-15',
            Ordertime: '14:30:00',
            CustomerName: 'John Doe',
            Phone: '9876543210',
            CustomerCity: 'Mumbai',
            CustomerArea: 'Andheri',
            items: [
                { ProductName: 'Premium Hamper', Quantity: 1 },
                { ProductName: 'Chocolate Box', Quantity: 2 }
            ],
            TotalAmount: 3197,
            PaymentStatus: 'Paid'
        },
        {
            OrderID: 'ORD002',
            OrderDate: '2024-01-14',
            Ordertime: '11:15:00',
            CustomerName: 'Jane Smith',
            Phone: '9876543211',
            CustomerCity: 'Delhi',
            CustomerArea: 'Connaught Place',
            items: [
                { ProductName: 'Festival Box', Quantity: 1 }
            ],
            TotalAmount: 1499,
            PaymentStatus: 'Unpaid'
        },
        {
            OrderID: 'ORD003',
            OrderDate: '2024-01-13',
            Ordertime: '16:45:00',
            CustomerName: 'Robert Johnson',
            Phone: '9876543212',
            CustomerCity: 'Bangalore',
            CustomerArea: 'Koramangala',
            items: [
                { ProductName: 'Corporate Hamper', Quantity: 3 },
                { ProductName: 'Dry Fruit Box', Quantity: 2 }
            ],
            TotalAmount: 8595,
            PaymentStatus: 'Cash on Delivery'
        }
    ];
    
    filteredOrders = [...allOrders];
    renderOrdersTable();
    updateOrdersSummary();
}

// Render orders table
function renderOrdersTable() {
    const ordersTable = document.getElementById('ordersTable');
    if (!ordersTable) return;
    
    if (filteredOrders.length === 0) {
        ordersTable.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No orders found</h5>
                    <p class="text-muted">Try changing your filters</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let tableHTML = '';
    
    filteredOrders.forEach((order, index) => {
        // Format date
        const orderDate = new Date(order.OrderDate);
        const formattedDate = orderDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Format time
        const formattedTime = order.Ordertime ? order.Ordertime.substring(0, 5) : '';
        
        // Format items
        const itemsList = order.items ? order.items.map(item => 
            `<div class="small">${item.ProductName} × ${item.Quantity}</div>`
        ).join('') : '';
        
        // Status badge
        const statusClass = getStatusClass(order.PaymentStatus);
        
        tableHTML += `
            <tr class="order-row fade-in" onclick="viewOrderDetails('${order.OrderID}')" style="cursor: pointer;">
                <td>
                    <span class="badge bg-primary">#${order.OrderID}</span>
                </td>
                <td>
                    <div>${formattedDate}</div>
                    <small class="text-muted">${formattedTime}</small>
                </td>
                <td>
                    <strong>${order.CustomerName || 'N/A'}</strong>
                    <div class="small text-muted">${order.Phone || ''}</div>
                    <div class="small">${order.CustomerCity || ''} - ${order.CustomerArea || ''}</div>
                </td>
                <td>${itemsList}</td>
                <td class="text-end">
                    <strong class="text-success">₹${order.TotalAmount?.toFixed(2) || '0.00'}</strong>
                </td>
                <td>
                    <span class="badge ${statusClass}">
                        ${order.PaymentStatus || 'Unknown'}
                    </span>
                </td>
                <td>
                    ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                    }) : 'N/A'}
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="viewOrderDetails('${order.OrderID}'); event.stopPropagation();"
                            data-bs-toggle="tooltip" 
                            title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    ordersTable.innerHTML = tableHTML;
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Get CSS class for status badge
function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'paid':
            return 'bg-success';
        case 'unpaid':
            return 'bg-warning text-dark';
        case 'cash on delivery':
            return 'bg-info text-dark';
        default:
            return 'bg-secondary';
    }
}

// Update orders summary
function updateOrdersSummary() {
    const summaryElement = document.getElementById('ordersSummary');
    if (!summaryElement) return;
    
    const totalOrders = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.TotalAmount || 0), 0);
    const paidOrders = filteredOrders.filter(order => order.PaymentStatus === 'Paid').length;
    const pendingOrders = filteredOrders.filter(order => order.PaymentStatus === 'Unpaid').length;
    
    summaryElement.innerHTML = `
        <div class="row g-3">
            <div class="col-md-3">
                <div class="stat-card bg-light">
                    <div class="stat-value text-primary">${totalOrders}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card bg-light">
                    <div class="stat-value text-success">₹${totalAmount.toFixed(2)}</div>
                    <div class="stat-label">Total Value</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card bg-light">
                    <div class="stat-value text-success">${paidOrders}</div>
                    <div class="stat-label">Paid Orders</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card bg-light">
                    <div class="stat-value text-warning">${pendingOrders}</div>
                    <div class="stat-label">Pending Orders</div>
                </div>
            </div>
        </div>
    `;
}

// Setup filters
function setupFilters() {
    // Populate status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        const statuses = ['All', 'Paid', 'Unpaid', 'Cash on Delivery'];
        statuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status === 'All' ? '' : status;
            option.textContent = status;
            statusFilter.appendChild(option);
        });
    }
}

// Setup event listeners
function setupOrdersEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchOrders');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            applyFilters();
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportOrders');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportOrdersToExcel);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshOrders');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrders);
    }
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchOrders')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    
    filteredOrders = allOrders.filter(order => {
        // Search filter
        const matchesSearch = 
            (order.OrderID && order.OrderID.toLowerCase().includes(searchTerm)) ||
            (order.CustomerName && order.CustomerName.toLowerCase().includes(searchTerm)) ||
            (order.Phone && order.Phone.includes(searchTerm)) ||
            (order.CustomerCity && order.CustomerCity.toLowerCase().includes(searchTerm)) ||
            (order.CustomerArea && order.CustomerArea.toLowerCase().includes(searchTerm));
        
        // Status filter
        const matchesStatus = !statusFilter || order.PaymentStatus === statusFilter;
        
        // Date filter
        let matchesDate = true;
        if (dateFilter) {
            matchesDate = order.OrderDate === dateFilter;
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    renderOrdersTable();
    updateOrdersSummary();
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        // Find order
        const order = allOrders.find(o => o.OrderID === orderId);
        if (!order) {
            showNotification('Order not found', 'warning');
            return;
        }
        
        // Show order details modal
        showOrderModal(order);
        
    } catch (error) {
        console.error('Error viewing order details:', error);
        showNotification('Failed to load order details', 'danger');
    }
}

// Show order details modal
function showOrderModal(order) {
    // Format order items
    const itemsList = order.items ? order.items.map(item => `
        <tr>
            <td>${item.ProductName}</td>
            <td class="text-center">${item.Quantity}</td>
            <td class="text-end">₹${item.UnitPrice?.toFixed(2) || '0.00'}</td>
            <td class="text-end">₹${(item.Quantity * (item.UnitPrice || 0)).toFixed(2)}</td>
        </tr>
    `).join('') : '';
    
    // Format dates
    const orderDate = new Date(order.OrderDate);
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const modalHTML = `
        <div class="modal fade" id="orderModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-receipt"></i> Order #${order.OrderID}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <h6>Customer Details</h6>
                                <div class="border rounded p-3">
                                    <p class="mb-1"><strong>${order.CustomerName || 'N/A'}</strong></p>
                                    <p class="mb-1 text-muted small">${order.Phone || ''}</p>
                                    <p class="mb-0 text-muted small">
                                        ${order.CustomerCity || ''} - ${order.CustomerArea || ''}
                                    </p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>Order Info</h6>
                                <div class="border rounded p-3">
                                    <p class="mb-1"><strong>Date:</strong> ${formattedDate}</p>
                                    <p class="mb-1"><strong>Time:</strong> ${order.Ordertime || 'N/A'}</p>
                                    <p class="mb-1">
                                        <strong>Status:</strong> 
                                        <span class="badge ${getStatusClass(order.PaymentStatus)} ms-2">
                                            ${order.PaymentStatus || 'Unknown'}
                                        </span>
                                    </p>
                                    ${order.delivery_date ? `
                                        <p class="mb-0">
                                            <strong>Delivery:</strong> 
                                            ${new Date(order.delivery_date).toLocaleDateString('en-IN')}
                                        </p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <h6>Order Items</h6>
                        <div class="table-responsive mb-4">
                            <table class="table table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>Item</th>
                                        <th class="text-center">Qty</th>
                                        <th class="text-end">Price</th>
                                        <th class="text-end">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsList}
                                    <tr class="table-light">
                                        <td colspan="3" class="text-end"><strong>Total Amount:</strong></td>
                                        <td class="text-end"><strong class="text-success">₹${order.TotalAmount?.toFixed(2) || '0.00'}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        ${order.notes ? `
                            <div class="border rounded p-3 mb-3">
                                <h6>Notes</h6>
                                <p class="mb-0">${order.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="printOrder('${order.OrderID}')">
                            <i class="fas fa-print"></i> Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('orderModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

// Print order
function printOrder(orderId) {
    const order = allOrders.find(o => o.OrderID === orderId);
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
        <html>
        <head>
            <title>Order #${order.OrderID}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .order-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Kuswar Gifts</h1>
                <h2>Order Invoice</h2>
                <h3>#${order.OrderID}</h3>
            </div>
            
            <div class="order-info">
                <div>
                    <h4>Customer Details</h4>
                    <p><strong>Name:</strong> ${order.CustomerName || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.Phone || ''}</p>
                    <p><strong>Address:</strong> ${order.CustomerCity || ''} - ${order.CustomerArea || ''}</p>
                </div>
                <div>
                    <h4>Order Details</h4>
                    <p><strong>Date:</strong> ${order.OrderDate || ''}</p>
                    <p><strong>Time:</strong> ${order.Ordertime || ''}</p>
                    <p><strong>Status:</strong> ${order.PaymentStatus || 'Unknown'}</p>
                </div>
            </div>
            
            <div class="section">
                <h4>Order Items</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items ? order.items.map(item => `
                            <tr>
                                <td>${item.ProductName}</td>
                                <td>${item.Quantity}</td>
                                <td>₹${item.UnitPrice?.toFixed(2) || '0.00'}</td>
                                <td>₹${(item.Quantity * (item.UnitPrice || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('') : ''}
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Total Amount:</td>
                            <td>₹${order.TotalAmount?.toFixed(2) || '0.00'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            ${order.notes ? `
                <div class="section">
                    <h4>Notes</h4>
                    <p>${order.notes}</p>
                </div>
            ` : ''}
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>Kuswar Gifts • www.kuswargifts.com</p>
                <p>Printed on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()">Print</button>
                <button onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Export orders to Excel
function exportOrdersToExcel() {
    try {
        // Create CSV content
        let csvContent = "Order ID,Date,Time,Customer Name,Phone,City,Area,Total Amount,Payment Status,Delivery Date\n";
        
        filteredOrders.forEach(order => {
            csvContent += `"${order.OrderID}","${order.OrderDate}","${order.Ordertime}","${order.CustomerName || ''}","${order.Phone || ''}","${order.CustomerCity || ''}","${order.CustomerArea || ''}",${order.TotalAmount || 0},"${order.PaymentStatus || ''}","${order.delivery_date || ''}"\n`;
        });
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Orders exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting orders:', error);
        showNotification('Failed to export orders', 'danger');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initOrdersPage();
});