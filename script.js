// Configuration
const CONFIG = {
    API_BASE_URL: "https://kuswar-backend.onrender.com", // Render backend URL
    // For test "http://localhost:5500"
};

// Global variables
let products = [];
let locations = [];
let itemsCounter = 0;

// Initialize the dashboard
async function initDashboard() {
    try {
        console.log("Initializing dashboard...");
        showNotification("Loading dashboard...", "info");
        
        // Load all required data
        await Promise.all([
            loadProducts(),
            loadLocations(),
            loadStats(),
            loadOrders()
        ]);
        
        updateConnectionStatus();
        updateLastUpdated();
        
        showNotification("Dashboard loaded successfully!", "success");
        
        // Auto-refresh every 60 seconds
        setInterval(() => {
            loadStats();
            updateLastUpdated();
        }, 60000);
        
        // Initialize first item row
        addItemRow();
        
    } catch (error) {
        console.error("Dashboard initialization error:", error);
        showNotification("Failed to load dashboard. Please refresh.", "danger");
    }
}

// Load products from API
async function loadProducts() {
    try {
        console.log("Loading products...");
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`);
        const data = await response.json();
        
        if (data.success) {
            products = data.data;
            console.log(`Loaded ${products.length} products`);
            populateProductDropdowns();
        } else {
            throw new Error(data.error || "Failed to load products");
        }
    } catch (error) {
        console.error("Error loading products:", error);
        showNotification("Failed to load products", "warning");
    }
}

// Load locations from API
async function loadLocations() {
    try {
        console.log("Loading locations...");
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/locations`);
        const data = await response.json();
        
        if (data.success) {
            locations = data.data;
            console.log(`Loaded ${locations.length} locations`);
            populateLocationDropdown();
        } else {
            throw new Error(data.error || "Failed to load locations");
        }
    } catch (error) {
        console.error("Error loading locations:", error);
        showNotification("Failed to load locations", "warning");
    }
}

// Load dashboard statistics
async function loadStats() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/stats`);
        const data = await response.json();
        
        if (data.success) {
            updateStatsCards(data.data);
        } else {
            throw new Error(data.error || "Failed to load stats");
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// Load orders with optional filters
async function loadOrders() {
    try {
        console.log("Loading orders...");
        // Build query parameters
        const params = new URLSearchParams();
        const phone = document.getElementById("searchPhone").value;
        const status = document.getElementById("filterStatus").value;
        const date = document.getElementById("filterDate").value;
        
        if (phone) params.append("phone", phone);
        if (status) params.append("payment_status", status);
        if (date) params.append("from_date", date);
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders?${params}`);
        const data = await response.json();
        
        if (data.success) {
            console.log(`Loaded ${data.count} orders`);
            renderOrdersTable(data.data);
        } else {
            throw new Error(data.error || "Failed to load orders");
        }
    } catch (error) {
        console.error("Error loading orders:", error);
        showNotification("Failed to load orders", "warning");
    }
}

// Update stats cards
function updateStatsCards(stats) {
    const statsContainer = document.getElementById("statsCards");
    
    const statsCards = [
        {
            icon: "fas fa-shopping-cart",
            label: "Today's Orders",
            value: stats.today_orders,
            color: "text-primary"
        },
        {
            icon: "fas fa-rupee-sign",
            label: "Monthly Revenue",
            value: `₹${stats.monthly_revenue.toLocaleString()}`,
            color: "text-success"
        },
        {
            icon: "fas fa-clock",
            label: "Pending Orders",
            value: stats.unpaid_orders,
            color: "text-warning"
        },
        {
            icon: "fas fa-users",
            label: "Total Customers",
            value: stats.total_customers,
            color: "text-info"
        }
    ];
    
    statsContainer.innerHTML = statsCards.map(card => `
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="stat-card fade-in">
                <div class="${card.color}">
                    <i class="${card.icon}"></i>
                </div>
                <div class="stat-value">${card.value}</div>
                <div class="stat-label">${card.label}</div>
            </div>
        </div>
    `).join("");
}

// Render orders table
function renderOrdersTable(orders) {
    const tbody = document.getElementById("ordersTable");
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-inbox fa-2x text-muted"></i>
                    <p class="mt-2">No orders found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const items = order.items 
            ? order.items.map(item => 
                `<div class="small">${item.ProductName} x ${item.Quantity}</div>`
              ).join("")
            : "";
        
        const statusClass = order.PaymentStatus 
            ? order.PaymentStatus.toLowerCase().replace(/\s+/g, '-')
            : "unknown";
        
        return `
            <tr class="fade-in">
                <td>
                    <strong>${order.OrderID || "N/A"}</strong>
                </td>
                <td>
                    <div>${order.OrderDate || ""}</div>
                    <small class="text-muted">${order.Ordertime || ""}</small>
                </td>
                <td>
                    <div><strong>${order.CustomerName || "N/A"}</strong></div>
                    <small class="text-muted">${order.Phone || ""}</small>
                    <div class="small">${order.CustomerCity || ""} ${order.CustomerArea || ""}</div>
                </td>
                <td>${items}</td>
                <td>
                    <strong class="text-success">₹${order.TotalAmount || 0}</strong>
                </td>
                <td>
                    <span class="status-badge status-${statusClass}">
                        ${order.PaymentStatus || "Unknown"}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="viewOrder('${order.OrderID}')"
                            title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");
}

// Populate product dropdowns
function populateProductDropdowns() {
    console.log("Populating product dropdowns...");
    const dropdowns = document.querySelectorAll(".product-select");
    
    dropdowns.forEach(dropdown => {
        // Clear existing options except the first one
        while (dropdown.options.length > 0) {
            dropdown.remove(0);
        }
        
        // Add default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Product";
        dropdown.appendChild(defaultOption);
        
        // Add product options
        products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.ProductID;
            option.textContent = `${product.ProductName} - ₹${product.UniPrice}`;
            option.dataset.price = product.UniPrice;
            dropdown.appendChild(option);
        });
    });
}

// Populate location dropdown
function populateLocationDropdown() {
    const dropdown = document.getElementById("locationSelect");
    
    // Clear existing options except the first one
    while (dropdown.options.length > 0) {
        dropdown.remove(0);
    }
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Location";
    dropdown.appendChild(defaultOption);
    
    locations.forEach(location => {
        const option = document.createElement("option");
        option.value = `${location.City}|${location.Area}`;
        option.textContent = `${location.City} - ${location.Area}`;
        dropdown.appendChild(option);
    });
}

// Add new item row
function addItemRow() {
    itemsCounter++;
    const container = document.getElementById("itemsContainer");
    const newRow = document.createElement("div");
    newRow.className = "item-row row g-2 mb-2";
    newRow.id = `item-row-${itemsCounter}`;
    newRow.innerHTML = `
        <div class="col-md-5">
            <select class="form-control product-select" required>
                <option value="">Select Product</option>
                ${products.map(p => 
                    `<option value="${p.ProductID}" data-price="${p.UniPrice}">
                        ${p.ProductName} - ₹${p.UniPrice}
                    </option>`
                ).join("")}
            </select>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control quantity" 
                   value="1" min="1" step="1" placeholder="Qty" required>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control price" 
                   placeholder="Price" readonly>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-danger btn-sm remove-item"
                    onclick="removeItemRow('item-row-${itemsCounter}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Add event listeners to the new row
    const select = newRow.querySelector(".product-select");
    const quantity = newRow.querySelector(".quantity");
    
    select.addEventListener("change", function() {
        updateItemPrice(this);
    });
    
    quantity.addEventListener("input", function() {
        calculateTotal();
    });
    
    updateRemoveButtons();
    calculateTotal();
}

// Remove item row
function removeItemRow(rowId) {
    const row = document.getElementById(rowId);
    if (row && document.querySelectorAll(".item-row").length > 1) {
        row.remove();
        calculateTotal();
        updateRemoveButtons();
    }
}

// Update price when product is selected
function updateItemPrice(select) {
    const price = select.options[select.selectedIndex].dataset.price || 0;
    const priceInput = select.closest(".row").querySelector(".price");
    priceInput.value = price;
    calculateTotal();
}

// Calculate total order amount
function calculateTotal() {
    let total = 0;
    
    document.querySelectorAll(".item-row").forEach(row => {
        const qty = parseFloat(row.querySelector(".quantity").value) || 0;
        const price = parseFloat(row.querySelector(".price").value) || 0;
        total += qty * price;
    });
    
    const orderTotalInput = document.getElementById("orderTotal");
    if (orderTotalInput) {
        orderTotalInput.value = total.toFixed(2);
    }
}

// Update remove buttons state
function updateRemoveButtons() {
    const rows = document.querySelectorAll(".item-row");
    const removeButtons = document.querySelectorAll(".remove-item");
    
    if (rows.length === 1) {
        removeButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add("disabled");
        });
    } else {
        removeButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove("disabled");
        });
    }
}

// Form submission handler
document.addEventListener("DOMContentLoaded", function() {
    const orderForm = document.getElementById("orderForm");
    
    if (orderForm) {
        orderForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("Submitting order...");
            
            // Validate required fields
            const customerPhone = document.getElementById("customerPhone").value.trim();
            if (!customerPhone) {
                showNotification("Please enter customer phone number", "warning");
                return;
            }
            
            // Collect items
            const items = [];
            let hasValidItems = false;
            
            document.querySelectorAll(".item-row").forEach(row => {
                const select = row.querySelector(".product-select");
                const quantity = row.querySelector(".quantity").value;
                const price = row.querySelector(".price").value;
                
                if (select && select.value && quantity && price) {
                    hasValidItems = true;
                    items.push({
                        ProductID: select.value,
                        ProductName: select.options[select.selectedIndex].text.split(" - ")[0],
                        Quantity: parseFloat(quantity),
                        UnitPrice: parseFloat(price)
                    });
                }
            });
            
            if (!hasValidItems || items.length === 0) {
                showNotification("Please add at least one valid item to the order", "warning");
                return;
            }
            
            // Get form data
            const customerName = document.getElementById("customerName").value.trim() || "Unknown";
            const location = document.getElementById("locationSelect").value;
            const [city, area] = location ? location.split("|") : ["", ""];
            const paymentStatus = document.getElementById("paymentStatus").value;
            const notes = document.getElementById("orderNotes").value.trim();
            
            // Prepare order data
            const orderData = {
                customer: {
                    Phone: customerPhone,
                    Name: customerName,
                    City: city,
                    Area: area,
                    Address: "",
                    Notes: notes
                },
                items: items,
                order_source: "Web Dashboard",
                payment_status: paymentStatus,
                notes: notes
            };
            
            console.log("Order data:", orderData);
            
            try {
                // Show loading state
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                submitBtn.disabled = true;
                
                // Send to API
                const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();
                console.log("API Response:", result);
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                if (result.success) {
                    showNotification(
                        `Order created successfully! Order ID: ${result.order_id}`, 
                        "success"
                    );
                    
                    // Reset form
                    orderForm.reset();
                    
                    // Reset items container
                    const itemsContainer = document.getElementById("itemsContainer");
                    itemsContainer.innerHTML = "";
                    itemsCounter = 0;
                    addItemRow();
                    
                    // Clear location dropdown selection
                    document.getElementById("locationSelect").selectedIndex = 0;
                    
                    // Refresh data
                    setTimeout(() => {
                        loadStats();
                        loadOrders();
                    }, 1000);
                    
                } else {
                    showNotification(`Error: ${result.error}`, "danger");
                }
                
            } catch (error) {
                console.error("Error submitting order:", error);
                showNotification(`Network error: ${error.message}`, "danger");
                
                // Reset button
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Order';
                submitBtn.disabled = false;
            }
        });
    }
});

// Add item button handler
window.addItem = function() {
    addItemRow();
};

// Remove item button handler
window.removeItem = function(button) {
    const row = button.closest(".item-row");
    if (row && document.querySelectorAll(".item-row").length > 1) {
        row.remove();
        calculateTotal();
        updateRemoveButtons();
    }
};

// View order details
window.viewOrder = function(orderId) {
    showNotification(`Viewing order ${orderId} - Feature coming soon!`, "info");
};

// Show notification toast
function showNotification(message, type = "info") {
    const toastEl = document.getElementById("notificationToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");
    
    // Set title based on type
    const titles = {
        "success": "Success!",
        "error": "Error!",
        "warning": "Warning!",
        "info": "Info",
        "danger": "Error!"
    };
    
    toastTitle.textContent = titles[type] || "Notification";
    toastMessage.textContent = message;
    
    // Set toast color
    toastEl.className = `toast bg-${type} text-white`;
    
    // Show toast
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();
}

// Update connection status
function updateConnectionStatus() {
    const statusEl = document.getElementById("connectionStatus");
    
    fetch(`${CONFIG.API_BASE_URL}/api/health`)
        .then(response => response.json())
        .then(data => {
            if (data.status === "healthy") {
                statusEl.innerHTML = '<i class="fas fa-circle"></i> Connected';
                statusEl.className = "badge bg-success";
            } else {
                statusEl.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
                statusEl.className = "badge bg-danger";
            }
        })
        .catch(() => {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Offline';
            statusEl.className = "badge bg-danger";
        });
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById("lastUpdated").textContent = `Updated: ${timeString}`;
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
    initDashboard();
    
    // Add event listeners for form inputs
    document.addEventListener("change", (e) => {
        if (e.target.classList.contains("quantity") || 
            e.target.classList.contains("product-select")) {
            calculateTotal();
        }
    });
});