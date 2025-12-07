// Stats page functionality
let statsData = {};

async function initStatsPage() {
    try {
        // Load stats
        await loadStats();
        
        // Load recent orders for chart
        await loadRecentOrdersForChart();
        
        // Setup date filters
        setupDateFilters();
        
        // Setup event listeners
        setupStatsEventListeners();
        
        // Initialize charts
        initCharts();
        
    } catch (error) {
        console.error('Error initializing stats page:', error);
        showNotification('Failed to load statistics', 'danger');
        
        // Load sample data for demo
        loadSampleStats();
    }
}

// Load stats from backend
async function loadStats() {
    try {
        showNotification('Loading statistics...', 'info');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/stats`);
        const data = await response.json();
        
        if (data.success) {
            statsData = data.data;
            renderStatsCards();
            updateCharts();
            
            showNotification('Statistics loaded', 'success');
        } else {
            throw new Error(data.error || 'Failed to load stats');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        throw error;
    }
}

// Load sample stats for demo
function loadSampleStats() {
    statsData = {
        today_orders: 15,
        monthly_revenue: 125000,
        unpaid_orders: 8,
        total_customers: 125,
        total_orders: 345,
        total_products: 45,
        average_order_value: 3623.18
    };
    
    renderStatsCards();
    updateCharts();
}

// Render stats cards
function renderStatsCards() {
    const statsCards = document.getElementById('statsCards');
    if (!statsCards) return;
    
    const cards = [
        {
            icon: 'fas fa-shopping-cart',
            title: "Today's Orders",
            value: statsData.today_orders || 0,
            color: 'primary',
            trend: '+12%',
            trendUp: true
        },
        {
            icon: 'fas fa-rupee-sign',
            title: "Monthly Revenue",
            value: `₹${(statsData.monthly_revenue || 0).toLocaleString()}`,
            color: 'success',
            trend: '+8%',
            trendUp: true
        },
        {
            icon: 'fas fa-clock',
            title: "Pending Orders",
            value: statsData.unpaid_orders || 0,
            color: 'warning',
            trend: '-3%',
            trendUp: false
        },
        {
            icon: 'fas fa-users',
            title: "Total Customers",
            value: statsData.total_customers || 0,
            color: 'info',
            trend: '+5%',
            trendUp: true
        },
        {
            icon: 'fas fa-chart-line',
            title: "Total Orders",
            value: statsData.total_orders || 0,
            color: 'secondary',
            trend: '+15%',
            trendUp: true
        },
        {
            icon: 'fas fa-box',
            title: "Total Products",
            value: statsData.total_products || 0,
            color: 'dark',
            trend: '+2%',
            trendUp: true
        }
    ];
    
    let cardsHTML = '';
    
    cards.forEach(card => {
        cardsHTML += `
            <div class="col-xl-4 col-md-6 mb-4">
                <div class="card stat-card h-100 border-left-${card.color} border-left-3 shadow-sm">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-${card.color} text-uppercase mb-1">
                                    ${card.title}
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">
                                    ${card.value}
                                </div>
                                <div class="mt-2 mb-0 text-muted text-xs">
                                    <span class="${card.trendUp ? 'text-success' : 'text-danger'}">
                                        <i class="fas fa-${card.trendUp ? 'arrow-up' : 'arrow-down'}"></i>
                                        ${card.trend}
                                    </span>
                                    Since last month
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="${card.icon} fa-2x text-${card.color}"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    statsCards.innerHTML = cardsHTML;
}

// Load recent orders for chart
async function loadRecentOrdersForChart() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders?limit=50`);
        const data = await response.json();
        
        if (data.success) {
            window.recentOrders = data.data || [];
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        window.recentOrders = [];
    }
}

// Setup date filters
function setupDateFilters() {
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
        // Set default to last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        dateRange.value = `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`;
    }
}

// Setup event listeners
function setupStatsEventListeners() {
    // Date range filter
    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
        dateRange.addEventListener('change', function() {
            applyDateFilter();
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshStats');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await loadStats();
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportStats');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportStatsReport);
    }
}

// Apply date filter
function applyDateFilter() {
    // This would filter the data based on selected date range
    // In a real implementation, you would fetch filtered data from backend
    showNotification('Date filter applied', 'info');
}

// Initialize charts
function initCharts() {
    // Revenue chart
    initRevenueChart();
    
    // Orders chart
    initOrdersChart();
    
    // Payment status chart
    initPaymentStatusChart();
}

// Initialize revenue chart
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Sample data - in real app, fetch from backend
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [65000, 59000, 80000, 81000, 125000, 140000];
    
    window.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Revenue',
                data: data,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₹${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Initialize orders chart
function initOrdersChart() {
    const ctx = document.getElementById('ordersChart');
    if (!ctx) return;
    
    // Sample data - in real app, fetch from backend
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [12, 19, 15, 25, 22, 30, 28];
    
    window.ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Orders',
                data: data,
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: '#4361ee',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// Initialize payment status chart
function initPaymentStatusChart() {
    const ctx = document.getElementById('paymentStatusChart');
    if (!ctx) return;
    
    // Sample data - in real app, fetch from backend
    const data = {
        labels: ['Paid', 'Unpaid', 'Cash on Delivery'],
        datasets: [{
            data: [65, 25, 10],
            backgroundColor: [
                '#10b981', // Success green
                '#f59e0b', // Warning orange
                '#3b82f6'  // Info blue
            ],
            borderWidth: 1
        }]
    };
    
    window.paymentStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} orders (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update charts with new data
function updateCharts() {
    // Update revenue chart
    if (window.revenueChart) {
        // Update with new data
        // window.revenueChart.data.datasets[0].data = newData;
        window.revenueChart.update();
    }
    
    // Update other charts similarly
}

// Export stats report
function exportStatsReport() {
    try {
        // Create report content
        const reportDate = new Date().toLocaleDateString('en-IN');
        const reportContent = `
            KUSWAR GIFTS - STATISTICS REPORT
            Generated on: ${reportDate}
            
            ==================================
            
            OVERVIEW:
            ---------
            Today's Orders: ${statsData.today_orders || 0}
            Monthly Revenue: ₹${(statsData.monthly_revenue || 0).toLocaleString()}
            Pending Orders: ${statsData.unpaid_orders || 0}
            Total Customers: ${statsData.total_customers || 0}
            Total Orders: ${statsData.total_orders || 0}
            Total Products: ${statsData.total_products || 0}
            Average Order Value: ₹${(statsData.average_order_value || 0).toFixed(2)}
            
            ==================================
            
            PERFORMANCE SUMMARY:
            --------------------
            • Revenue growth: +8% this month
            • Order growth: +15% this month
            • Customer growth: +5% this month
            
            RECOMMENDATIONS:
            ----------------
            1. Focus on converting pending orders to paid
            2. Consider adding more products in popular categories
            3. Run promotions to boost weekend sales
            
            ==================================
            
            END OF REPORT
        `;
        
        // Create blob and download
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kuswar_stats_report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Report exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting report:', error);
        showNotification('Failed to export report', 'danger');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load Chart.js library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
        initStatsPage();
    };
    document.head.appendChild(script);
});