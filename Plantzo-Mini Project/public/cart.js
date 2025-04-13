const CART_KEY = 'plantzo_cart';

// Load Cart Items
async function loadCart() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalContainer = document.getElementById("cart-total");

    if (!cartItemsContainer || !cartTotalContainer) {
        console.error("Cart containers not found.");
        return;
    }

    // Handle empty cart
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty. <a href='landing.html'>Browse products</a> to add items!</p>";
        cartTotalContainer.innerHTML = "Total: ₹0.00";
        return;
    }

    cartItemsContainer.innerHTML = ""; // Clear previous content
    let totalPrice = 0;

    for (const [index, item] of cart.entries()) {
        try {
            const response = await fetch(`/api/products/${item.id}`);
            const data = await response.json();

            if (response.ok && data.success) {
                const product = data.data;
                const availableStock = product.stock;

                const cartItem = document.createElement("div");
                cartItem.classList.add("cart-item");
                cartItem.setAttribute("data-id", item.id);

                const quantityDisabled = item.quantity >= availableStock ? 'disabled' : '';

                cartItem.innerHTML = `
                    <!-- Added Checkbox for Selection -->
                    <input type="checkbox" class="cart-checkbox" value="${item.id}" />
                    
                    <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null;this.src='/images/placeholder.jpg';">
                    <div>
                        <h3>${item.name}</h3>
                        <p>₹${item.price} x <span class="item-quantity">${item.quantity}</span></p>
                        <div class="quantity-controls">
                            <button onclick="updateQuantity(${index}, 'decrease')" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <button onclick="updateQuantity(${index}, 'increase')" ${quantityDisabled}>+</button>
                        </div>
                        <button class="delete-btn" onclick="removeFromCart(${index})">❌ Remove</button>
                        <p>Available stock: ${availableStock}</p>
                    </div>
                `;

                cartItemsContainer.appendChild(cartItem);
                totalPrice += item.price * item.quantity;
            } else {
                console.error("Product not found:", item.id);
                cartItemsContainer.innerHTML += `<p>Product "${item.name}" is unavailable. Please remove it.</p>`;
            }
        } catch (error) {
            console.error(`Error fetching product details for ${item.id}:`, error);
            cartItemsContainer.innerHTML += `<p>An error occurred while loading product "${item.name}".</p>`;
        }
    }

    cartTotalContainer.innerHTML = `Total: ₹${totalPrice.toFixed(2)}`;
}

// Updated Checkout Function to Include Selected Items
function checkout() {
    const selectedItems = Array.from(document.querySelectorAll(".cart-checkbox:checked"))
        .map(checkbox => checkbox.value);

    if (selectedItems.length === 0) {
        alert("Please select at least one item to checkout.");
        return;
    }

    alert(`Proceeding to checkout with items: ${selectedItems.join(", ")}`);
    // Here you can pass selectedItems to your backend for further processing
    window.location.href = 'checkout.html';
}

// Add to Cart Function
async function addToCart(id, name, image, price) {
    try {
        console.log("Adding product to cart with ID:", id);
        const response = await fetch(`http://localhost:5000/api/products/${id}`);

        if (!response.ok) {
            console.error(`Fetch failed with status: ${response.status}`);
            alert(`Unable to add product. Server returned status ${response.status}.`);
            return;
        }

        const data = await response.json();

        if (!data.success) {
            console.error("Error from server:", data.message);
            alert(`Unable to add product. ${data.message}`);
            return;
        }

        const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, image, price, quantity: 1 });
        }

        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        alert("Item added to cart successfully!");
        window.location.href = 'cart.html';

        loadCart(); // Refresh the cart display
    } catch (error) {
        console.error("Error adding product to cart:", error.message);
        alert("An unexpected error occurred. Please try again later.");
    }
}

async function updateQuantity(index, action) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const item = cart[index];

    try {
        console.log("Updating quantity for item ID:", item.id);
        const response = await fetch(`http://localhost:5000/api/products/${item.id}`);
        const data = await response.json();

        if (!data.success) {
            alert("Product not found in the database.");
            return;
        }

        const product = data.data;
        const stockAvailable = product.stock;

        if (action === 'increase' && item.quantity < stockAvailable) {
            item.quantity += 1;
        } else if (action === 'decrease' && item.quantity > 1) {
            item.quantity -= 1;
        } else {
            alert(`Only ${stockAvailable} items available.`);
            return;
        }

        cart[index] = item;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        loadCart(); // Refresh the cart display
    } catch (error) {
        console.error("Error updating quantity:", error);
        alert("Unable to update item quantity.");
    }
}

// Remove Item from Cart
function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    cart.splice(index, 1);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    loadCart();
}

// Clear Cart
function clearCart() {
    localStorage.removeItem(CART_KEY);
    loadCart();
}
// Checkout Functionality
function checkout() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  // Check if the cart is empty
  if (cart.length === 0) {
      alert("Your cart is empty! Please add items to proceed to checkout.");
      return; // Stop further execution
  }

  // Get selected items from checkboxes
  const selectedItems = Array.from(document.querySelectorAll(".cart-checkbox:checked"))
      .map(checkbox => checkbox.value); // Get selected item IDs as strings

  // Check if any item is selected
  if (selectedItems.length === 0) {
      alert("Please select at least one item to checkout.");
      return; // Stop if no items are selected
  }

  // Save selected items to localStorage
  localStorage.setItem('selected_cart_items', JSON.stringify(selectedItems));

  // Proceed with selected items
  alert(`Proceeding to checkout with items: ${selectedItems.join(", ")}`);
  window.location.href = 'checkout.html'; // Redirect to checkout page
}
document.addEventListener("DOMContentLoaded", loadCart);