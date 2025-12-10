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
        
        // Format time
        const time = order.OrderTime || order.Ordertime || '';
        let formattedOrderTime = 'N/A';
        if (time && time !== 'N/A') {
            const timeParts = time.split(':');
            if (timeParts.length >= 2) {
                formattedOrderTime = timeParts[0] + ':' + timeParts[1];
            }
        }
        
        const currentDate = new Date();
        const printedDate = currentDate.toLocaleDateString('en-IN');
        const printedTime = currentDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Build items HTML
        let itemsHTML = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach((item) => {
                const itemTotal = (item.Quantity || 1) * (item.UnitPrice || 0);
                itemsHTML += `
                    <tr>
                        <td>${item.ProductName || 'Product'}</td>
                        <td style="text-align: center;">${item.Quantity || 1}</td>
                        <td style="text-align: right;">₹${(item.UnitPrice || 0).toFixed(2)}</td>
                        <td style="text-align: right;">₹${itemTotal.toFixed(2)}</td>
                    </tr>`;
            });
        } else {
            itemsHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No items in this order</td></tr>';
        }
        
        // Determine payment status class
        let paymentClass = 'background-color: #fff3cd; color: #856404;';
        let paymentText = order.PaymentStatus || 'Unpaid';
        if (order.PaymentStatus === 'Paid') {
            paymentClass = 'background-color: #d4edda; color: #155724;';
        } else if (order.PaymentStatus === 'Cash on Delivery') {
            paymentClass = 'background-color: #d1ecf1; color: #0c5460;';
        }
        
        // Create the complete HTML
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice #${order.OrderID}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 10px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4361ee;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #4361ee;
            margin: 10px 0 5px 0;
            font-size: 28px;
        }
        .header .subtitle {
            color: #666;
            font-size: 16px;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .invoice-details, .customer-info {
            flex: 1;
            min-width: 300px;
            margin: 10px;
        }
        .section-title {
            color: #4361ee;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: 600;
            width: 140px;
            color: #555;
        }
        .info-value {
            flex: 1;
        }
        .payment-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        .items-table th {
            background: #4361ee;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }
        .items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        .items-table tr:hover {
            background-color: #f9f9f9;
        }
        .total-section {
            text-align: right;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            max-width: 300px;
            margin-left: auto;
        }
        .grand-total {
            font-size: 22px;
            font-weight: 700;
            color: #4361ee;
            margin-top: 15px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 10px;
        }
        .notes {
            background: #fff9e6;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .notes-title {
            font-weight: 600;
            color: #856404;
            margin-bottom: 5px;
        }
        @media print {
            body {
                padding: 10px;
            }
            .invoice-container {
                box-shadow: none;
                padding: 15px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <img src="../assets/logo.png" alt="Traditionalzz Kuswar" class="logo" onerror="this.style.display='none';">
            <h1>Traditionalzz Kuswar</h1>
            <div class="subtitle">Traditional Christmas Sweets & Gifts</div>
            <h2 style="margin-top: 15px; color: #333; font-size: 20px;">ORDER INVOICE</h2>
        
        <div class="invoice-info">
            <div class="invoice-details">
                <div class="section-title">Invoice Details</div>
                <div class="info-row">
                    <div class="info-label">Order #:</div>
                    <div class="info-value"><strong>${order.OrderID}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date:</div>
                    <div class="info-value">${formattedOrderDate}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Time:</div>
                    <div class="info-value">${formattedOrderTime}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Printed:</div>
                    <div class="info-value">${printedDate} ${printedTime}</div>
                </div>
            </div>
            
            <div class="customer-info">
                <div class="section-title">Bill To</div>
                <div class="info-row">
                    <div class="info-label">Customer:</div>
                    <div class="info-value"><strong>${order.CustomerName || 'N/A'}</strong></div>
                </div>
                <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${order.Phone || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Address:</div>
                    <div class="info-value">
                        ${order.CustomerAddress || 'Not specified'} 
                        ${order.CustomerCity ? ', ' + order.CustomerCity : ''}
                        ${order.CustomerArea ? ', ' + order.CustomerArea : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-details">
                <div class="section-title">Order Details</div>
                <div class="info-row">
                    <div class="info-label">Delivery Date:</div>
                    <div class="info-value">${order.DeliveryDate || formattedOrderDate}</div>
                </div>
            </div>
            
            <div class="customer-info">
                <div class="section-title">Payment Information</div>
                <div class="info-row">
                    <div class="info-label">Status:</div>
                    <div class="info-value">
                        <span class="payment-status" style="${paymentClass}">
                            ${paymentText}
                        </span>
                    </div>
                </div>
                ${order.PaidTo ? `
                <div class="info-row">
                    <div class="info-label">Paid To:</div>
                    <div class="info-value">${order.PaidTo}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        ${order.notes ? `
        <div class="notes">
            <div class="notes-title">Special Instructions:</div>
            <div>${order.notes}</div>
        </div>
        ` : ''}
        
        <div class="section-title">Order Items</div>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="total-row">
                <div style="font-weight: 600;">Subtotal:</div>
                <div>₹${(order.TotalAmount || 0).toFixed(2)}</div>
            </div>
            <div class="total-row grand-total">
                <div>TOTAL AMOUNT:</div>
                <div>₹${(order.TotalAmount || 0).toFixed(2)}</div>
            </div>
        </div>
        
        <div class="footer">
            <div style="margin-bottom: 10px;">Thank you for your business!</div>
            <div>For any queries, please contact us at: +91 9591981354</div>
            <div>Email: info@traditionalzzkuswar.com</div>
            <div style="margin-top: 15px; color: #4361ee; font-weight: 600;">
                ❤️ Merry Christmas, Enjoy your Kuswar! ❤️
            </div>
            <div style="margin-top: 10px; font-size: 12px;">
                This is a computer-generated invoice. No signature required.
            </div>
        </div>
    </div>
    
    <script>
        // Auto print after page loads
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
        
        // Also allow manual print
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                window.print();
            }
        });
    </script>
</body>
</html>`;

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
    billText += `Invoice #${order.OrderID}\n`;
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
    if (order.PaidTo) {
        billText += `Paid to: ${order.PaidTo}\n`;
    }
    billText += '\nThank you for your order!';
    
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    printWindow.document.write('<pre>' + billText + '</pre>');
    printWindow.document.close();
    printWindow.print();
}