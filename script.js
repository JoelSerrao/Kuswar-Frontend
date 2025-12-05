// Configuration
const CONFIG = {
    API_BASE_URL: "https://your-render-app.onrender.com", // Render backend URL
    // For local development: "http://localhost:5500"
};

// Global variables
let products = [];
let locations = [];

// Initialize the dashboard
async function initDashboard() {
    try {
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
        
    } catch (error) {
        console.error("Dashboard initialization error:", error);
        showNotification("Failed to load dashboard. Please refresh.", "danger");
    }
}

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`);
        const data = await response.json();
        
        if (data.success) {
            products = data.data;
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
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/locations`);
        const data = await response.json();
        
        if (data.success) {
            locations = data.data;
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
            ? order.PaymentStatus.toLowerCase().replace(/ /g, "-")
            : "";
        
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
                    <small class="text-muted">${order.CustomerPhone || ""}</small>
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
    const dropdowns = document.querySelectorAll(".product-select");
    
    dropdowns.forEach(dropdown => {
        // Clear existing options except the first one
        const firstOption = dropdown.options[0];
        dropdown.innerHTML = "";
        dropdown.appendChild(firstOption);
        
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
    
    locations.forEach(location => {
        const option = document.createElement("option");
        option.value = `${location.City}|${location.Area}`;
        option.textContent = `${location.City} - ${location.Area}`;
        dropdown.appendChild(option);
    });
}

// Add new item row to order form
function addItem() {
    const container = document.getElementById("itemsContainer");
    const newRow = document.createElement("div");
    newRow.className = "item-row row g-2 mb-2";
    newRow.innerHTML = `
        <div class="col-md-5">
            <select class="form-control product-select" required 
                    onchange="updateItemPrice(this)">
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
                   value="1" min="1" step="0.01" placeholder="Qty" required
                   onchange="calculateTotal()">
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control price" 
                   placeholder="Price" readonly>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-danger btn-sm remove-item"
                    onclick="removeItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    updateRemoveButtons();
    calculateTotal();
}

// Remove item row
function removeItem(button) {
    const row = button.closest(".item-row");
    if (row && document.querySelectorAll(".item-row").length > 1) {
        row.remove();
        calculateTotal();
        updateRemoveButtons();
    }
}

// Update remove buttons state
function updateRemoveButtons() {
    const rows = document.querySelectorAll(".item-row");
    const removeButtons = document.querySelectorAll(".remove-item");
    
    if (rows.length === 1) {
        removeButtons[0].disabled = true;
        removeButtons[0].classList.add("disabled");
    } else {
        removeButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove("disabled");
        });
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
    
    document.getElementById("orderTotal").value = total.toFixed(2);
}

// Submit order form
document.getElementById("orderForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Get form data
    const phone = document.getElementById("customerPhone").value.trim();
    const name = document.getElementById("customerName").value.trim();
    const location = document.getElementById("locationSelect").value;
    const paymentStatus = document.getElementById("paymentStatus").value;
    const notes = document.getElementById("orderNotes").value.trim();
    
    // Validate phone
    if (!phone) {
        showNotification("Please enter customer phone number", "warning");
        return;
    }
    
    // Parse location
    const [city, area] = location ? location.split("|") : ["", ""];
    
    // Collect items
    const items = [];
    let validItems = true;
    
    document.querySelectorAll(".item-row").forEach(row => {
        const select = row.querySelector(".product-select");
        const quantity = row.querySelector(".quantity").value;
        const price = row.querySelector(".price").value;
        
        if (select.value && quantity && price) {
            items.push({
                ProductID: select.value,
                ProductName: select.options[select.selectedIndex].text.split(" - ")[0],
                Quantity: parseFloat(quantity),
                UnitPrice: parseFloat(price)
            });
        } else {
            validItems = false;
        }
    });
    
    if (!validItems || items.length === 0) {
        showNotification("Please add valid items to the order", "warning");
        return;
    }
    
    // Prepare order data
    const orderData = {
        customer: {
            Phone: phone,
            Name: name || "Unknown",
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
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (result.success) {
            // Show success message
            showNotification(
                `Order created successfully! Order ID: ${result.order_id}`, 
                "success"
            );
            
            // Reset form
            e.target.reset();
            document.getElementById("itemsContainer").innerHTML = `
                <div class="item-row row g-2 mb-2">
                    <div class="col-md-5">
                        <select class="form-control product-select" required 
                                onchange="updateItemPrice(this)">
                            <option value="">Select Product</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <input type="number" class="form-control quantity" 
                               value="1" min="1" step="0.01" placeholder="Qty" required
                               onchange="calculateTotal()">
                    </div>
                    <div class="col-md-3">
                        <input type="number" class="form-control price" 
                               placeholder="Price" readonly>
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-danger btn-sm remove-item" disabled>
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            populateProductDropdowns();
            calculateTotal();
            
            // Refresh data
            loadStats();
            loadOrders();
            
        } else {
            showNotification(`Error: ${result.error}`, "danger");
        }
        
    } catch (error) {
        console.error("Error submitting order:", error);
        showNotification("Network error. Please try again.", "danger");
    }
});

// View order details (placeholder)
function viewOrder(orderId) {
    showNotification(`Viewing order ${orderId} - Feature coming soon!`, "info");
}

// Show notification toast
function showNotification(message, type = "info") {
    const toastEl = document.getElementById("notificationToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMessage = document.getElementById("toastMessage");
    
    // Set title and message based on type
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
    const toast = new bootstrap.Toast(toastEl);
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
    updateRemoveButtons();
    
    // Add event listeners for real-time calculation
    document.addEventListener("change", (e) => {
        if (e.target.classList.contains("quantity") || 
            e.target.classList.contains("product-select")) {
            calculateTotal();
        }
    });
});