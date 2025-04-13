// Go Back to the Previous Page
function goBack() {
    window.location.href = "landing.html"; // Redirect to landing page
}

// Attach event listeners when DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("back-button").addEventListener("click", goBack);
    document.getElementById("place-order-button").addEventListener("click", placeOrder);
    loadOrderSummary(); // Load the order summary when DOM is ready
});

// Load Order Summary
function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('plantzo_cart')) || []; // Retrieve full cart
    const selectedItems = JSON.parse(localStorage.getItem('selected_cart_items')) || []; // Retrieve selected items
    const orderSummaryContainer = document.getElementById("order-summary");
    const orderTotalContainer = document.getElementById("order-total");

    // Handle case where no selected items are found or cart is empty
    if (!selectedItems.length || !cart.length) {
        orderSummaryContainer.innerHTML = "<p>Your cart is empty or no items were selected. Please go back and add/select items.</p>";
        orderTotalContainer.innerHTML = "";
        return;
    }

    orderSummaryContainer.innerHTML = ""; // Clear existing content
    let totalPrice = 0;

    selectedItems.forEach(itemId => {
        const item = cart.find(cartItem => cartItem.id === itemId); // Compare `itemId` with cart `id`
        if (item) {
            const itemElement = document.createElement("div");
            itemElement.innerHTML = `
                <p>${item.name} - ₹${item.price} x ${item.quantity}</p>
            `;
            orderSummaryContainer.appendChild(itemElement);
            totalPrice += item.price * item.quantity;
        } else {
            console.warn(`Selected item ${itemId} not found in cart!`);
        }
    });

    orderTotalContainer.innerHTML = `<p>Total: ₹${totalPrice.toFixed(2)}</p>`;
}

// Place Order Function
async function placeOrder() {
    console.log("Place Order button clicked!"); // For debugging
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address1 = document.getElementById("address1").value.trim();
    const address2 = document.getElementById("address2").value.trim();
    const pincode = document.getElementById("pincode").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    const selectedItems = JSON.parse(localStorage.getItem('selected_cart_items')) || [];
    const cart = JSON.parse(localStorage.getItem('plantzo_cart')) || [];

    // Validation rules
    if (!name || name.length < 3) {
        alert("Please enter a valid name (min 3 characters).");
        return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        alert("Please enter a valid email.");
        return;
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
        alert("Please enter a valid phone number.");
        return;
    }
    if (!address1 || address1.length < 5) {
        alert("Address Line 1 must be at least 5 characters long.");
        return;
    }
    if (!address2 || address2.length < 5) {
        alert("Address Line 2 must be at least 5 characters long.");
        return;
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
        alert("Please enter a valid pincode.");
        return;
    }
    if (!city || city.length < 3) {
        alert("Please enter a valid city.");
        return;
    }
    if (!state || state.length < 3) {
        alert("Please enter a valid state.");
        return;
    }
    if (!paymentMethod) {
        alert("Please select a payment method.");
        return;
    }

    const fullAddress = `${address1}, ${address2}, ${city}, ${state}, ${pincode}`;
    const generatedOrderId = "ORD" + Date.now(); // Generate a unique orderId

    // Map items (ensuring each item includes a category)
    const items = selectedItems.map(itemId => {
        const item = cart.find(cartItem => cartItem.id === itemId);
        if (item) {
            return { 
                productName: item.name, 
                category: item.category || "miscellaneous", 
                quantity: item.quantity, 
                price: item.price,
                image: item.image || "default-image.jpg"
            };
        }
        return null;
    }).filter(Boolean);

    const orderData = {
        orderId: generatedOrderId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: fullAddress,
        paymentMethod: paymentMethod.value,
        date: new Date(),
        totalAmount: items.reduce((total, item) => total + item.price * item.quantity, 0),
        items: items,
        status: "Pending"
    };

    try {
        const response = await fetch("/api/admin/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Order placed successfully!");
            window.location.href = "myorder.html"; // Redirect to My Orders page
            console.log("Order response:", result);
        } else {
            alert("An error occurred: " + result.message);
            console.error("Error placing order:", result);
        }
    } catch (error) {
        alert("An error occurred: " + error.message);
        console.error("Error placing order:", error);
    }
}

// Load order summary when the page is ready
document.addEventListener("DOMContentLoaded", loadOrderSummary);