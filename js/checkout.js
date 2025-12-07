// Checkout page functionality
let cart = {};
let paymentRecipients = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initCheckoutPage();
});

async function initCheckoutPage() {
    try {
        console.log('Initializing checkout page...');
        
        // Load cart from localStorage
        const savedCart = localStorage.getItem('checkout_cart') || localStorage.getItem('kuswar_cart');
        if (savedCart) {
            try {
                cart = JSON.parse(savedCart);
            } catch (e) {
                cart = {};
            }
        }
        
        // If cart is empty, redirect to homepage
        if (Object.keys(cart).length === 0) {
            showNotification('Your cart is empty. Adding sample items for demo.', 'info');
            addSampleItems();
        }
        
        // Load initial data
        loadOrderSummary();
        calculateOrderTotal();
        setDeliveryDateMin();
        
        // Setup event listeners
        setupCheckoutEventListeners();
        
        // Load cities and payment recipients
        await loadCities();
        await loadPaymentRecipients();
        
        // Initialize payment status
        updatePaymentStatusUI();
        
    } catch (error) {
        console.error('Error initializing checkout:', error);
        showNotification('Failed to load checkout page', 'danger');
    }
}

// Add sample items for demo
function addSampleItems() {
    cart = {
        'sample1': {
            id: 'sample1',
            name: 'Family Pack',
            price: 1999,
            category: 'Hamper',
            quantity: 1
        },
        'sample2': {
            id: 'sample2',
            name: 'Chocolate Box',
            price: 599,
            category: 'Box',
            quantity: 2
        }
    };
    localStorage.setItem('checkout_cart', JSON.stringify(cart));
}

// Load payment recipients
async function loadPaymentRecipients() {
    try {
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
    const paidToContainer = document.getElementById('paidToContainer');
    
    if (!paidToInput || !paidToContainer) return;
    
    // Create datalist if it doesn't exist
    let datalist = document.getElementById('paidToSuggestions');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'paidToSuggestions';
        paidToContainer.appendChild(datalist);
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

// Load cities
async function loadCities() {
    try {
        const citySelect = document.getElementById('citySelect');
        if (!citySelect) return;
        
        // Clear existing options except the first one
        while (citySelect.options.length > 1) {
            citySelect.remove(1);
        }
        
        // Try to load from API
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/cities`);
            const data = await response.json();
            
            if (data.success && data.data) {
                // Add city options from API
                data.data.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
                console.log(`Loaded ${data.data.length} cities from API`);
            } else {
                throw new Error('No city data from API');
            }
        } catch (apiError) {
            console.log('API failed, using sample cities:', apiError.message);
            // Use sample cities
            const sampleCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
            sampleCities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error loading cities:', error);
    }
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
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = `₹${subtotal.toFixed(2)}`;
    }
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
    
    // Reload UI
    loadOrderSummary();
    calculateOrderTotal();
    
    // If cart is empty, show message
    if (Object.keys(cart).length === 0) {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
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
            }, 2000);
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
    
    const orderTotalElement = document.getElementById('orderTotal');
    if (orderTotalElement) {
        orderTotalElement.textContent = `₹${total.toFixed(2)}`;
    }
    
    return total;
}

// Setup event listeners
function setupCheckoutEventListeners() {
    // City change event
    const citySelect = document.getElementById('citySelect');
    const areaInput = document.getElementById('areaInput');
    
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            const city = this.value;
            if (city) {
                if (areaInput) {
                    areaInput.disabled = false;
                    areaInput.placeholder = 'Enter area name';
                }
                // You can load areas for the city here if needed
            } else {
                if (areaInput) {
                    areaInput.value = '';
                    areaInput.disabled = true;
                    areaInput.placeholder = 'Select a city first';
                }
            }
        });
    }
    
    // Payment status change event
    const paymentStatus = document.getElementById('paymentStatus');
    if (paymentStatus) {
        paymentStatus.addEventListener('change', updatePaymentStatusUI);
    }
    
    // Form submission
    const orderForm = document.getElementById('customerForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            placeOrder();
        });
    }
    
    // Manual checkout button click
    const checkoutButton = document.querySelector('button[onclick="placeOrder()"]');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', placeOrder);
    }
}

// Update payment status UI
function updatePaymentStatusUI() {
    const paymentStatus = document.getElementById('paymentStatus');
    const paidToContainer = document.getElementById('paidToContainer');
    
    if (!paymentStatus || !paidToContainer) return;
    
    if (paymentStatus.value === 'Paid') {
        paidToContainer.style.display = 'block';
        const paidToInput = document.getElementById('paidTo');
        if (paidToInput) {
            paidToInput.required = true;
        }
    } else {
        paidToContainer.style.display = 'none';
        const paidToInput = document.getElementById('paidTo');
        if (paidToInput) {
            paidToInput.required = false;
            paidToInput.value = '';
        }
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
        const customerName = document.getElementById('customerName');
        const customerPhone = document.getElementById('customerPhone');
        const citySelect = document.getElementById('citySelect');
        const areaInput = document.getElementById('areaInput');
        
        if (!customerName || !customerName.value.trim()) {
            showNotification('Please enter customer name', 'warning');
            customerName.focus();
            return;
        }
        
        if (!customerPhone || !customerPhone.value.trim() || customerPhone.value.trim().length < 10) {
            showNotification('Please enter a valid phone number (10 digits)', 'warning');
            customerPhone.focus();
            return;
        }
        
        if (!citySelect || !citySelect.value) {
            showNotification('Please select a city', 'warning');
            citySelect.focus();
            return;
        }
        
        if (!areaInput || !areaInput.value.trim()) {
            showNotification('Please enter area', 'warning');
            areaInput.focus();
            return;
        }
        
        // Validate cart
        if (Object.keys(cart).length === 0) {
            showNotification('Please add items to cart', 'warning');
            window.location.href = 'index.html';
            return;
        }
        
        // Collect order data
        const orderData = {
            customer: {
                Name: customerName.value.trim(),
                Phone: customerPhone.value.trim(),
                City: citySelect.value,
                Area: areaInput.value.trim()
            },
            items: Object.values(cart).map(item => ({
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
        
        // Simulate API call (replace with real API call)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate order ID
        const orderId = 'ORD' + Math.random().toString(36).substr(2, 8).toUpperCase();
        
        // Show success message
        showNotification(`Order placed successfully! Order ID: ${orderId}`, 'success');
        
        // Clear cart
        localStorage.removeItem('kuswar_cart');
        localStorage.removeItem('checkout_cart');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Redirect to orders page
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification(`Error: ${error.message}`, 'danger');
        
        // Reset button
        const submitBtn = document.querySelector('button[onclick="placeOrder()"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
            submitBtn.disabled = false;
        }
    }
}

// Make functions available globally
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeCartItem = removeCartItem;
window.placeOrder = placeOrder;