// Checkout page functionality
let cart = {};
let paymentRecipients = [];

async function initCheckoutPage() {
    try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem('checkout_cart') || localStorage.getItem('kuswar_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        
        // If cart is empty, redirect to homepage
        if (Object.keys(cart).length === 0) {
            showNotification('Your cart is empty. Redirecting to homepage...', 'warning');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
        
        // Load required data
        await loadCities('citySelect');
        await loadPaymentRecipients();
        
        // Load order summary
        loadOrderSummary();
        
        // Set minimum delivery date to today
        setDeliveryDateMin();
        
        // Setup event listeners
        setupCheckoutEventListeners();
        
        // Calculate total
        calculateOrderTotal();
        
    } catch (error) {
        console.error('Error initializing checkout:', error);
        showNotification('Failed to load checkout page', 'danger');
    }
}

// Load payment recipients
async function loadPaymentRecipients() {
    try {
        // For demo, using static list
        paymentRecipients = [
            'John Doe',
            'Jane Smith', 
            'Robert Johnson',
            'Manager - Branch 1',
            'Manager - Branch 2'
        ];
        
        populatePaidToDropdown();
    } catch (error) {
        console.error('Error loading payment recipients:', error);
    }
}

// Populate "paid to" dropdown
function populatePaidToDropdown() {
    const paidToInput = document.getElementById('paidTo');
    if (!paidToInput) return;
    
    // Create datalist if it doesn't exist
    let datalist = document.getElementById('paidToSuggestions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'paidToSuggestions';
        document.body.appendChild(datalist);
    }
    
    // Clear existing options
    datalist.innerHTML = '';
    
    // Add options
    paymentRecipients.forEach(recipient => {
        const option = document.createElement('option');
        option.value = recipient;
        datalist.appendChild(option);
    });
    
    paidToInput.setAttribute('list', 'paidToSuggestions');
}

// Load order summary
function loadOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    if (!orderSummary) return;
    
    const cartItems = Object.values(cart);
    
    if (cartItems.length === 0) {
        orderSummary.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No items in cart.
                <a href="index.html" class="alert-link">Browse products</a>
            </div>
        `;
        return;
    }
    
    let itemsHTML = '';
    let subtotal = 0;
    
    cartItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        itemsHTML += `
            <div class="order-item mb-3 pb-3 ${index < cartItems.length - 1 ? 'border-bottom' : ''}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.name}</h6>
                        <div class="small text-muted mb-2">
                            <span class="badge bg-light text-dark">${item.category}</span>
                        </div>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-secondary me-2" 
                                    onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="mx-2 fw-bold">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary me-3" 
                                    onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <span class="text-muted">@ ₹${item.price} each</span>
                        </div>
                    </div>
                    <div class="text-end">
                        <h6 class="text-primary mb-1">₹${itemTotal.toFixed(2)}</h6>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="removeCartItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Add summary
    itemsHTML += `
        <div class="mt-4 pt-3 border-top">
            <div class="d-flex justify-content-between">
                <span class="fw-bold">Items (${cartItems.length}):</span>
                <span class="fw-bold">₹${subtotal.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    orderSummary.innerHTML = itemsHTML;
    
    // Update subtotal
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
}

// Update cart item quantity
function updateCartItemQuantity(productId, newQuantity) {
    if (!cart[productId]) return;
    
    if (newQuantity <= 0) {
        delete cart[productId];
    } else {
        cart[productId].quantity = newQuantity;
    }
    
    // Update localStorage
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
    
    // Reload order summary
    loadOrderSummary();
    calculateOrderTotal();
}

// Remove cart item
function removeCartItem(productId) {
    if (cart[productId]) {
        delete cart[productId];
        localStorage.setItem('checkout_cart', JSON.stringify(cart));
        loadOrderSummary();
        calculateOrderTotal();
        
        // If cart is empty, redirect to homepage
        if (Object.keys(cart).length === 0) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}

// Calculate order total
function calculateOrderTotal() {
    const cartItems = Object.values(cart);
    const subtotal = cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    const total = subtotal;
    
    document.getElementById('orderTotal').textContent = `₹${total.toFixed(2)}`;
    
    return total;
}

// Setup event listeners
function setupCheckoutEventListeners() {
    // City change event
    const citySelect = document.getElementById('citySelect');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            const city = this.value;
            if (city) {
                loadAreasForCity(city, 'areaInput', 'areaSuggestions');
                document.getElementById('areaInput').disabled = false;
                document.getElementById('areaInput').placeholder = 'Enter area name';
            } else {
                document.getElementById('areaInput').value = '';
                document.getElementById('areaInput').disabled = true;
                document.getElementById('areaInput').placeholder = 'Select a city first';
                document.getElementById('areaSuggestions').innerHTML = '';
            }
        });
    }
    
    // Payment status change event
    const paymentStatus = document.getElementById('paymentStatus');
    const paidToContainer = document.getElementById('paidToContainer');
    
    if (paymentStatus && paidToContainer) {
        paymentStatus.addEventListener('change', function() {
            if (this.value === 'Paid') {
                paidToContainer.style.display = 'block';
                document.getElementById('paidTo').required = true;
            } else {
                paidToContainer.style.display = 'none';
                document.getElementById('paidTo').required = false;
                document.getElementById('paidTo').value = '';
            }
        });
        
        // Trigger change event on load
        paymentStatus.dispatchEvent(new Event('change'));
    }
    
    // Form submission
    const orderForm = document.getElementById('customerForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            placeOrder();
        });
    }
}

// Set minimum delivery date to today
function setDeliveryDateMin() {
    const deliveryDateInput = document.getElementById('deliveryDate');
    if (deliveryDateInput) {
        const today = new Date().toISOString().split('T')[0];
        deliveryDateInput.min = today;
        
        // Set default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDateInput.value = tomorrow.toISOString().split('T')[0];
    }
}

// Place order
async function placeOrder() {
    try {
        // Validate form
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const city = document.getElementById('citySelect').value;
        const area = document.getElementById('areaInput').value.trim();
        
        if (!customerName) {
            showNotification('Please enter customer name', 'warning');
            document.getElementById('customerName').focus();
            return;
        }
        
        if (!customerPhone || customerPhone.length < 10) {
            showNotification('Please enter a valid phone number (10 digits)', 'warning');
            document.getElementById('customerPhone').focus();
            return;
        }
        
        if (!city) {
            showNotification('Please select a city', 'warning');
            document.getElementById('citySelect').focus();
            return;
        }
        
        if (!area) {
            showNotification('Please enter area', 'warning');
            document.getElementById('areaInput').focus();
            return;
        }
        
        // Validate cart
        const cartItems = Object.values(cart);
        if (cartItems.length === 0) {
            showNotification('Please add items to cart', 'warning');
            window.location.href = 'index.html';
            return;
        }
        
        // Collect order data
        const orderData = {
            customer: {
                Name: customerName,
                Phone: customerPhone,
                City: city,
                Area: area
            },
            items: cartItems.map(item => ({
                ProductID: item.id,
                ProductName: item.name,
                Quantity: item.quantity,
                UnitPrice: item.price
            })),
            order_source: "Website",
            payment_status: document.getElementById('paymentStatus').value,
            notes: document.getElementById('orderNotes').value.trim(),
            delivery_date: document.getElementById('deliveryDate').value
        };
        
        // Add paid to info if payment is made
        if (orderData.payment_status === 'Paid') {
            const paidTo = document.getElementById('paidTo').value.trim();
            if (paidTo) {
                orderData.paid_to = paidTo;
            } else {
                showNotification('Please enter who received the payment', 'warning');
                document.getElementById('paidTo').focus();
                return;
            }
        }
        
        console.log('Order data:', orderData);
        
        // Show loading
        const submitBtn = document.querySelector('button[onclick="placeOrder()"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        
        // Save order to backend
        const result = await saveOrder(orderData);
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        if (result.success) {
            showNotification(`Order placed successfully! Order ID: ${result.order_id}`, 'success');
            
            // Clear cart
            localStorage.removeItem('kuswar_cart');
            localStorage.removeItem('checkout_cart');
            
            // Reset form
            document.getElementById('customerForm').reset();
            
            // Redirect to orders page after 3 seconds
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 3000);
            
        } else {
            showNotification(`Failed to place order: ${result.error}`, 'danger');
        }
        
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification(`Error: ${error.message}`, 'danger');
    }
}

// Save order to backend
async function saveOrder(orderData) {
    try {
        // For demo, simulate API call
        console.log('Saving order:', orderData);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate random order ID
        const orderId = 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        return {
            success: true,
            order_id: orderId,
            message: 'Order saved successfully'
        };
        
        /* 
        // Uncomment this for real API call
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        return await response.json();
        */
        
    } catch (error) {
        console.error('Error saving order:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initCheckoutPage();
});

// Make functions available globally
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeCartItem = removeCartItem;
window.placeOrder = placeOrder;