// Print Big beautiful bill
function printBill() {
    const order = window.currentOrder;
    if (!order) {
        showNotification('No order selected', 'warning');
        return;
    }
    
    try {
        // Format dates
        const orderDate = new Date(order.OrderDate);
        const formattedOrderDate = orderDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Safely format order time
        const formattedOrderTime = order.OrderTime ? 
            order.OrderTime.split(':').slice(0, 2).join(':') : 
            order.Ordertime ? 
            order.Ordertime.split(':').slice(0, 2).join(':') : 
            'N/A';
        
        const currentDate = new Date();
        const printedDate = currentDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const printedTime = currentDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const logoPath = 'https://joelserrao.github.io/Kuswar-Frontend/assets/logo.png';
        
        // --- Determine Payment Status Class ---
        let paymentClass = 'payment-unpaid';
        let paymentText = order.PaymentStatus || 'Unpaid';
        if (order.PaymentStatus === 'Paid') {
            paymentClass = 'payment-paid';
        } else if (order.PaymentStatus === 'Cash on Delivery' || order.PaymentStatus === 'COD') {
            paymentClass = 'payment-cod';
        }

        // --- Build items HTML ---
        let itemsHTML = '';
        if (order.items && order.items.length > 0) {
            itemsHTML = order.items.map((item) => {
                const itemTotal = (item.Quantity || 1) * (item.UnitPrice || 0);
                return `
                    <tr>
                        <td class="item-name">${item.ProductName || 'Product'}</td>
                        <td class="item-quantity">${item.Quantity || 1}</td>
                        <td class="item-price">₹${(item.UnitPrice || 0).toFixed(2)}</td>
                        <td class="item-total">₹${itemTotal.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            itemsHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px;">No items in this order</td></tr>';
        }

        // Calculate GST (if needed, currently set to 0 to match your original total logic)
        // Adjust gstRate if you want to activate GST calculation
        const gstRate = 0.00; // Set to 0% to match your original final TotalAmount logic
        const subtotal = (order.TotalAmount || 0);
        const gstAmount = subtotal * gstRate;
        const totalWithGST = subtotal + gstAmount;

        
        // --- Create the complete HTML (Using the new beautiful bill structure) ---
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice #${order.OrderID}</title>
            <style>
                /* Import Google Font for style consistency */
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #fff;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .invoice-container {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 0 30px rgba(0,0,0,0.1);
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                }
                
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 30px;
                }
                
                .logo-section {
                    flex: 1;
                }
                
                .logo {
                    max-width: 200px;
                    height: auto;
                    margin-bottom: 10px;
                }
                
                .business-name {
                    font-size: 28px;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 5px;
                }
                
                .business-tagline {
                    color: #7f8c8d;
                    font-size: 14px;
                    font-weight: 400;
                }
                
                .invoice-details {
                    text-align: right;
                    background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    min-width: 300px;
                }
                
                .invoice-title {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 15px;
                }
                
                .invoice-id {
                    font-size: 20px;
                    font-weight: 500;
                    margin-bottom: 10px;
                    color: #fff;
                }
                
                .invoice-meta {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .info-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 40px;
                }
                
                .info-box {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #4361ee;
                }
                
                .info-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #4361ee;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .info-content {
                    font-size: 14px;
                }
                
                .info-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                
                .info-label {
                    font-weight: 500;
                    min-width: 120px;
                    color: #555;
                }
                
                .info-value {
                    color: #333;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 40px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                
                .items-table thead {
                    background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                    color: white;
                }
                
                .items-table th {
                    padding: 15px;
                    text-align: left;
                    font-weight: 500;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .items-table tbody tr {
                    border-bottom: 1px solid #eee;
                    transition: background-color 0.2s;
                }
                
                .items-table tbody tr:hover {
                    background-color: #f9f9f9;
                }
                
                .items-table td {
                    padding: 15px;
                    font-size: 14px;
                }
                
                .items-table .item-name {
                    font-weight: 500;
                    color: #2c3e50;
                }
                
                .items-table .item-quantity {
                    text-align: center;
                    color: #555;
                }
                
                .items-table .item-price {
                    text-align: right;
                    color: #555;
                }
                
                .items-table .item-total {
                    text-align: right;
                    font-weight: 600;
                    color: #2c3e50;
                }
                
                .totals-section {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 25px;
                    margin-bottom: 40px;
                    max-width: 350px; /* Constrain width for totals */
                    margin-left: auto; /* Align to the right */
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px dashed #ddd;
                }
                
                .total-row:last-child {
                    border-bottom: none;
                }
                
                .total-label {
                    font-size: 14px;
                    color: #555;
                }
                
                .total-value {
                    font-size: 14px;
                    color: #333;
                }
                
                .grand-total {
                    font-size: 20px;
                    font-weight: 600;
                    color: #4361ee;
                }
                
                .grand-total .total-value {
                    font-size: 20px;
                    color: #4361ee;
                }
                
                .payment-status {
                    display: inline-block;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .payment-paid {
                    background-color: #d4edda;
                    color: #155724;
                }
                
                .payment-unpaid {
                    background-color: #fff3cd;
                    color: #856404;
                }
                
                .payment-cod {
                    background-color: #d1ecf1;
                    color: #0c5460;
                }
                
                .notes-section {
                    background: #fff9e6;
                    border-left: 4px solid #ffc107;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 40px;
                }
        
                .notes-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #856404;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .notes-content {
                    font-size: 14px;
                    color: #856404;
                }
                
                .footer {
                    text-align: center;
                    padding: 30px 0;
                    border-top: 2px solid #f0f0f0;
                    color: #7f8c8d;
                    font-size: 13px;
                }
                
                .footer p {
                    margin-bottom: 8px;
                }
                
                .thank-you {
                    font-size: 16px;
                    color: #4361ee;
                    font-weight: 500;
                    margin-top: 10px;
                }
                
                .print-only {
                    display: none; /* Hide by default */
                }
                
                @media print {
                    body {
                        padding: 0;
                    }
                    
                    .invoice-container {
                        box-shadow: none;
                        padding: 0;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .print-only {
                        display: block; /* Show only when printing */
                    }
                }
                
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80px;
                    color: rgba(67, 97, 238, 0.05);
                    font-weight: 700;
                    z-index: 0;
                    white-space: nowrap;
                    pointer-events: none;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="watermark">INVOICE</div>
                
                <div class="invoice-header">
                    <div class="logo-section">
                        <img src="${logoPath}" alt="Traditionalzz Kuswar Logo" class="logo" 
                            onerror="this.onerror=null; this.src='https://via.placeholder.com/200x60/4361ee/ffffff?text=Traditionalzz+Kuswar';">
                        <div class="business-name">Traditionalzz Kuswar</div>
                        <div class="business-tagline">Traditional Christmas Sweets & Gifts</div>
                    </div>
                    
                    <div class="invoice-details">
                        <div class="invoice-title">ORDER INVOICE</div>
                        <div class="invoice-id">#${order.OrderID}</div>
                        <div class="invoice-meta">
                            <div>Date: ${formattedOrderDate}</div>
                            <div>Time: ${formattedOrderTime}</div>
                            <div>Printed: ${printedDate} ${printedTime}</div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-box">
                        <div class="info-title">Bill To</div>
                        <div class="info-content">
                            <div class="info-row">
                                <span class="info-label">Customer:</span>
                                <span class="info-value"><strong>${order.CustomerName || 'N/A'}</strong></span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${order.Phone || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address:</span>
                                <span class="info-value">
                                    ${order.CustomerAddress || 'Not provided'}
                                    ${order.CustomerCity ? ', ' + order.CustomerCity : ''}
                                    ${order.CustomerArea ? ', ' + order.CustomerArea : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <div class="info-title">Order Details</div>
                        <div class="info-content">
                            <div class="info-row">
                                <span class="info-label">Delivery Date:</span>
                                <span class="info-value">${order.DeliveryDate || formattedOrderDate}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Payment Status:</span>
                                <span class="info-value">
                                    <span class="payment-status ${paymentClass}">
                                        ${paymentText}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Description</th>
                            <th style="width: 15%; text-align: center;">Quantity</th>
                            <th style="width: 20%; text-align: right;">Unit Price</th>
                            <th style="width: 15%; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <div class="totals-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal</span>
                        <span class="total-value">₹${subtotal.toFixed(2)}</span>
                    </div>
                    
                    ${gstRate > 0 ? `
                    <div class="total-row">
                        <span class="total-label">GST (${(gstRate * 100).toFixed(0)}%)</span>
                        <span class="total-value">₹${gstAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="total-row grand-total">
                        <span class="total-label">TOTAL AMOUNT:</span>
                        <span class="total-value">₹${totalWithGST.toFixed(2)}</span>
                    </div>
                </div>
                
                ${
                    order.notes ? `
                    <div class="notes-section">
                        <div class="notes-title">Special Instructions</div>
                        <div class="notes-content">${order.notes}</div>
                    </div>
                    ` : ''
                }
                
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>For any queries, please contact us at: +91 9591981354</p>
                    <p>Email: info@traditionalzzkuswar.com</p>
                    <p class="thank-you">❤️ Merry Christmas, Enjoy your Kuswar! ❤️</p>
                    <p class="print-only">Printed on: ${printedDate} at ${printedTime}</p>
                    <p class="print-only" style="margin-top: 10px; font-size: 12px; color: #aaa;">
                        This is a computer-generated invoice. No signature required.
                    </p>
                </div>
            </div>
            
            <script>
                // Auto-print when the page loads
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        
                        // Optional: Close window after printing 
                        // setTimeout(function() {
                        //     window.close();
                        // }, 1000);
                    }, 500);
                };
                
                // Also allow manual print with Ctrl+P
                document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key === 'p') {
                        e.preventDefault();
                        window.print();
                    }
                });
            </script>
        </body>
        </html>
        `;

        // Open in new window
        const printWindow = window.open('', '_blank', 'width=850,height=900,scrollbars=yes');
        
        // Write the content
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Focus the window
        printWindow.focus();
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error('Error in printBill:', error);
        showNotification('Error generating invoice: ' + error.message, 'danger');
        
        // Fallback to simple text bill
        printSimpleBill();
    }
}

// Fallback simple bill function
function printSimpleBill() {
    const order = window.currentOrder;
    if (!order) return;
    
    let billText = 'Traditionalzz Kuswar\n';
    billText += '====================\n\n';
    billText += `Order #${order.OrderID}\n`;
    billText += `Date: ${new Date(order.OrderDate).toLocaleDateString()}\n`;
    billText += `Customer: ${order.CustomerName}\n`;
    billText += `Phone: ${order.Phone}\n\n`;
    billText += 'Items:\n';
    billText += '------\n';
    
    if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
            billText += `${item.ProductName} x${item.Quantity} @ ₹${item.UnitPrice} = ₹${item.Quantity * item.UnitPrice}\n`;
        });
    }
    
    billText += `\nTotal: ₹${order.TotalAmount}\n`;
    billText += `Payment: ${order.PaymentStatus}\n`;

    billText += '\nThank you for your order!';
    
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    printWindow.document.write('<pre>' + billText + '</pre>');
    printWindow.document.close();
    printWindow.print();
}