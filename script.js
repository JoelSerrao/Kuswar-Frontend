// Configuration
const CONFIG = {
    API_BASE_URL: "https://kuswar-backend.onrender.com", // Render backend URL
    // For test "http://localhost:5500"
};

// Global variables
let products = [];
let locations = [];
let itemsCounter = 0;
let categories = [];
let productsByCategory = {}; 

// Initialize the dashboard
async function initDashboard() {
    try {
        console.log("Initializing dashboard...");
        showNotification("Loading dashboard...", "info");
        
        // Load all required data
        await Promise.all([
            loadCategories(),
            loadCities(),  
            loadStats(),
            loadOrders()
        ]);

        // After categories are loaded, load all products
        await loadAllProductsByCategory();
        
        updateConnectionStatus();
        updateLastUpdated();
        
        showNotification("Dashboard loaded successfully!", "success");
        
        // Initialize first item row
        addItemRow();

        // Setup area input event listeners
        setupAreaInputListeners();

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

// Setup area input listeners
function setupAreaInputListeners() {
    const areaInput = document.getElementById("areaInput");
    const citySelect = document.getElementById("citySelect");
    
    // Enable/disable area input based on city selection
    citySelect.addEventListener("change", function() {
        areaInput.disabled = !this.value;
        if (!this.value) {
            areaInput.value = "";
            areaInput.placeholder = "Select a city first";
        }
    });
    
    // Real-time validation
    areaInput.addEventListener("input", function() {
        const city = citySelect.value;
        const area = this.value.trim();
        
        if (city && area.length >= 2) {
            // You could add real-time validation here
            // For example, check if area already exists
        }
    });
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

// Load categories
async function loadCategories() {
    try {
        console.log("Loading categories...");
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/categories`);
        const data = await response.json();
        
        if (data.success) {
            categories = data.data;
            console.log(`Loaded ${categories.length} categories:`, categories);
        } else {
            throw new Error(data.error || "Failed to load categories");
        }
    } catch (error) {
        console.error("Error loading categories:", error);
        showNotification("Failed to load categories", "warning");
    }
}

// Load all products grouped by category
async function loadAllProductsByCategory() {
    try {
        console.log("Loading products by category...");
        
        // Load products for each category
        for (const category of categories) {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/products/by-category/${encodeURIComponent(category)}`);
            const data = await response.json();
            
            if (data.success) {
                productsByCategory[category] = data.data;
                console.log(`Loaded ${data.count} products for category: ${category}`);
            }
        }
        
        // Also load a "all" category (all products)
        const allResponse = await fetch(`${CONFIG.API_BASE_URL}/api/products`);
        const allData = await allResponse.json();
        
        if (allData.success) {
            productsByCategory["all"] = allData.data;
            console.log(`Loaded ${allData.data.length} total products`);
        }
        
    } catch (error) {
        console.error("Error loading products by category:", error);
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

// Load cities for dropdown
async function loadCities() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cities`);
        const data = await response.json();
        
        if (data.success) {
            const citySelect = document.getElementById("citySelect");
            
            // Clear existing options
            while (citySelect.options.length > 0) {
                citySelect.remove(0);
            }
            
            // Add default option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select City";
            citySelect.appendChild(defaultOption);
            
            // Add city options
            data.data.forEach(city => {
                const option = document.createElement("option");
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
            
            console.log(`Loaded ${data.data.length} cities`);
        } else {
            throw new Error(data.error || "Failed to load cities");
        }
    } catch (error) {
        console.error("Error loading cities:", error);
        showNotification("Failed to load cities", "warning");
    }
}

// Load areas for selected city (autocomplete)
async function loadAreasForCity() {
    const citySelect = document.getElementById("citySelect");
    const city = citySelect.value;
    const areaInput = document.getElementById("areaInput");
    const areaDatalist = document.getElementById("areaSuggestions");
    
    // Clear previous suggestions
    areaDatalist.innerHTML = "";
    areaInput.value = "";
    areaInput.placeholder = city ? "Start typing area name..." : "Select a city first";
    areaInput.disabled = !city;
    
    if (!city) return;
    
    try {
        showNotification(`Loading areas for ${city}...`, "info");
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas/${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (data.success) {
            // Add areas to datalist for autocomplete
            data.data.forEach(area => {
                const option = document.createElement("option");
                option.value = area;
                areaDatalist.appendChild(option);
            });
            
            console.log(`Loaded ${data.data.length} areas for ${city}`);
            showNotification(`Found ${data.data.length} areas for ${city}`, "success");
            
            // Enable typeahead functionality
            setupAreaTypeahead(city);
        } else {
            throw new Error(data.error || "Failed to load areas");
        }
    } catch (error) {
        console.error("Error loading areas:", error);
        showNotification(`No areas found for ${city}. You can add new ones.`, "info");
        areaInput.placeholder = "Type new area name for this city";
    }
}

// Setup typeahead/autocomplete for area input
function setupAreaTypeahead(city) {
    const areaInput = document.getElementById("areaInput");
    const areaDatalist = document.getElementById("areaSuggestions");
    
    // Debounce search for better performance
    let debounceTimer;
    areaInput.addEventListener("input", function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const value = this.value.trim();
            if (value.length < 2) return;
            
            // Check if this area already exists in suggestions
            const options = Array.from(areaDatalist.options);
            const exists = options.some(option => option.value.toLowerCase() === value.toLowerCase());
            
            if (!exists && city) {
                // This is a new area - we'll save it when order is submitted
                console.log(`New area detected: ${value} for ${city}`);
                
                // Optional: Auto-save new areas as user types
                // await saveNewLocation(city, value);
            }
        }, 500);
    });
    
    // When user selects from dropdown
    areaInput.addEventListener("change", function() {
        const value = this.value;
        const options = Array.from(areaDatalist.options);
        const exists = options.some(option => option.value === value);
        
        if (exists) {
            console.log(`Selected existing area: ${value}`);
        }
    });
}

// Save new location to database
async function saveNewLocation(city, area) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/locations?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`, {
            method: "POST"
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (!data.exists) {
                console.log(`Saved new location: ${area}, ${city}`);
                
                // Add to datalist if not already there
                const areaDatalist = document.getElementById("areaSuggestions");
                const options = Array.from(areaDatalist.options);
                const alreadyExists = options.some(option => option.value === area);
                
                if (!alreadyExists) {
                    const option = document.createElement("option");
                    option.value = area;
                    areaDatalist.appendChild(option);
                }
            }
            return true;
        } else {
            console.error("Failed to save location:", data.error);
            return false;
        }
    } catch (error) {
        console.error("Error saving location:", error);
        return false;
    }
}

// Update order submission to save new locations
async function saveOrderWithLocationCheck(orderData) {
    try {
        // First, save the location if it's new
        const city = orderData.customer.City;
        const area = orderData.customer.Area;
        
        if (city && area) {
            await saveNewLocation(city, area);
        }
        
        // Then save the order
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(orderData)
        });
        
        return await response.json();
    } catch (error) {
        console.error("Error in saveOrderWithLocationCheck:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Add new item row with category and product dropdowns
function addItemRow() {
    itemsCounter++;
    const container = document.getElementById("itemsContainer");
    const newRow = document.createElement("div");
    newRow.className = "item-row row g-2 mb-2";
    newRow.id = `item-row-${itemsCounter}`;
    
    newRow.innerHTML = `
        <!-- Category Column -->
        <div class="col-md-2">
            <select class="form-control category-select" required>
                <option value="">Select Product</option>              
                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
        
        <!-- Product Column -->
        <div class="col-md-3">
            <select class="form-control product-select" required disabled>
                <option value="">Select Product</option>
            </select>
        </div>
        
        <!-- Quantity Column -->
        <div class="col-md-2">
            <input type="number" class="form-control quantity" 
                   value="1" min="1" step="0.01" placeholder="Qty" required>
        </div>
        
        <!-- Price Column -->
        <div class="col-md-2">
            <input type="number" class="form-control price" 
                   placeholder="Price" readonly>
        </div>
        
        <!-- Delete Column -->
        <div class="col-md-2">
            <button type="button" class="btn btn-danger btn-sm remove-item"
                    onclick="removeItemRow('item-row-${itemsCounter}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <!-- Unit Column (optional - can show stock or unit type) -->
        <div class="col-md-1">
            <span class="unit-info small text-muted" style="display: inline-block; padding-top: 8px;"></span>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Add event listeners to the new row
    const categorySelect = newRow.querySelector(".category-select");
    const productSelect = newRow.querySelector(".product-select");
    const quantityInput = newRow.querySelector(".quantity");
    const unitInfo = newRow.querySelector(".unit-info");
    
    // Category change event
    categorySelect.addEventListener("change", function() {
        const category = this.value;
        
        if (category) {
            // Enable and populate product dropdown
            productSelect.disabled = false;
            populateProductDropdown(category, productSelect);
            
            // Clear previous selection
            productSelect.selectedIndex = 0;
            newRow.querySelector(".price").value = "";
            unitInfo.textContent = "";
        } else {
            // Disable product dropdown
            productSelect.disabled = true;
            productSelect.innerHTML = '<option value="">Select Product</option>';
            newRow.querySelector(".price").value = "";
            unitInfo.textContent = "";
        }
        
        calculateTotal();
    });
    
    // Product change event
    productSelect.addEventListener("change", function() {
        updateItemPriceAndInfo(this);
        calculateTotal();
    });
    
    // Quantity change event
    quantityInput.addEventListener("input", function() {
        calculateTotal();
    });
    
    updateRemoveButtons();
    calculateTotal();
}

// Populate product dropdown based on category
function populateProductDropdown(category, productSelect) {
    // Clear existing options
    productSelect.innerHTML = '<option value="">Select Product</option>';
    
    // Get products for this category
    const products = productsByCategory[category] || [];
    
    // Add product options
    products.forEach(product => {
        const option = document.createElement("option");
        option.value = product.ProductID;
        option.textContent = `${product.ProductName}`;
        option.dataset.price = product.UniPrice || 0;
        option.dataset.productName = product.ProductName;
        option.dataset.stock = product.Stock || 0;
        productSelect.appendChild(option);
    });
    
    // If no products found, show message
    if (products.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No products in this category";
        option.disabled = true;
        productSelect.appendChild(option);
    }
}

// Update price and unit info when product is selected
function updateItemPriceAndInfo(productSelect) {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const price = selectedOption.dataset.price || 0;
    const productName = selectedOption.dataset.productName || "";
    const stock = selectedOption.dataset.stock || 0;
    
    // Update price field
    const priceInput = productSelect.closest(".row").querySelector(".price");
    priceInput.value = price;
    
    // Update unit info (show stock)
    const unitInfo = productSelect.closest(".row").querySelector(".unit-info");
    if (stock > 0) {
        unitInfo.textContent = `Stock: ${stock}`;
        unitInfo.className = "unit-info small text-success";
    } else {
        unitInfo.textContent = "Out of stock";
        unitInfo.className = "unit-info small text-danger";
    }
    
    // Show notification if stock is low
    if (stock > 0 && stock < 10) {
        showNotification(`Low stock: ${productName} has only ${stock} units left`, "warning");
    }
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
// Make functions globally available
window.addItemRow = addItemRow;
window.removeItemRow = removeItemRow;
window.updateItemPriceAndInfo = updateItemPriceAndInfo;

// Form submission handler
document.addEventListener("DOMContentLoaded", function() {
    const orderForm = document.getElementById("orderForm");
    
        // Update form submission to use new location system
    if (orderForm) {
        orderForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("Submitting order...");
            
            // Validate required fields
            const customerPhone = document.getElementById("customerPhone").value.trim();
            const citySelect = document.getElementById("citySelect");
            const areaInput = document.getElementById("areaInput");
            
            if (!customerPhone) {
                showNotification("Please enter customer phone number", "warning");
                return;
            }
            
            if (!citySelect.value) {
                showNotification("Please select a city", "warning");
                return;
            }
            
            if (!areaInput.value.trim()) {
                showNotification("Please enter an area", "warning");
                return;
            }
            
            // Collect items
            const items = [];
            let hasValidItems = false;
            
            document.querySelectorAll(".item-row").forEach(row => {
                const categorySelect = row.querySelector(".category-select");
                const productSelect = row.querySelector(".product-select");
                const quantity = row.querySelector(".quantity").value;
                const price = row.querySelector(".price").value;
                
                if (categorySelect.value && productSelect.value && quantity && price) {
                    const selectedOption = productSelect.options[productSelect.selectedIndex];
                    const productName = selectedOption.dataset.productName || 
                                       selectedOption.textContent.split(" - ")[0];
                    
                    items.push({
                        ProductID: productSelect.value,
                        ProductName: productName,
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
            const city = citySelect.value;
            const area = areaInput.value.trim();
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
                
                // Use the new function that also saves locations
                const result = await saveOrderWithLocationCheck(orderData);
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
                    
                    // Reset location fields
                    citySelect.selectedIndex = 0;
                    areaInput.value = "";
                    areaInput.disabled = true;
                    areaInput.placeholder = "Select a city first";
                    
                    // Clear area suggestions
                    document.getElementById("areaSuggestions").innerHTML = "";
                    
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