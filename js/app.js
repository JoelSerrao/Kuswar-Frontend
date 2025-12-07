// Configuration
const CONFIG = {
    API_BASE_URL: "https://kuswar-backend.onrender.com", //Render backend URL For test "http://localhost:5500"
    CART_STORAGE_KEY: "kuswar_cart"
};

// Global cart object
let cart = {};

// Initialize cart from localStorage
function initCart() {
    const savedCart = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
}

// Update cart count in navigation
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Add item to cart
function addToCart(productId, productName, price, category) {
    if (!cart[productId]) {
        cart[productId] = {
            id: productId,
            name: productName,
            price: price,
            category: category,
            quantity: 1
        };
    } else {
        cart[productId].quantity += 1;
    }
    saveCart();
    showNotification(`${productName} added to cart`, 'success');
}

// Remove item from cart
function removeFromCart(productId) {
    if (cart[productId]) {
        if (cart[productId].quantity > 1) {
            cart[productId].quantity -= 1;
        } else {
            delete cart[productId];
        }
        saveCart();
    }
}

// Update item quantity in cart
function updateCartQuantity(productId, quantity) {
    if (cart[productId]) {
        if (quantity > 0) {
            cart[productId].quantity = quantity;
        } else {
            delete cart[productId];
        }
        saveCart();
    }
}

// Get cart total
function getCartTotal() {
    return Object.values(cart).reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Clear cart
function clearCart() {
    cart = {};
    saveCart();
}

// Notification function
function showNotification(message, type = 'info') {
    // Create toast notification
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        console.log('Toast container not found');
        return;
    }
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', function () {
        toast.remove();
    });
}

// Check API health
async function checkAPIHealth() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/health`);
        const data = await response.json();
        return data.status === 'healthy';
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}

// Load cities for dropdowns
async function loadCities(selectElementId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/cities`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById(selectElementId);
            if (!select) return;
            
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Add city options
            data.data.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Load areas for selected city
async function loadAreasForCity(city, areaInputId, areaDatalistId) {
    const areaInput = document.getElementById(areaInputId);
    const areaDatalist = document.getElementById(areaDatalistId);
    
    if (!city || !areaInput || !areaDatalist) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/areas/${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (data.success) {
            // Clear previous suggestions
            areaDatalist.innerHTML = '';
            
            // Add areas to datalist
            data.data.forEach(area => {
                const option = document.createElement('option');
                option.value = area;
                areaDatalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading areas:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initCart();
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});