document.addEventListener('DOMContentLoaded', fetchOrders);

function fetchOrders() {
  console.log("Fetching orders...");

  fetch('/api/admin/orders')
    .then(response => {
      console.log("Response received:", response);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Fetched data:", data);
      if (data.success && data.data) {
        renderOrders(data.data);

        // ✅ Update total orders count
        const totalOrdersElem = document.getElementById('totalOrders');
        if (totalOrdersElem) {
          totalOrdersElem.innerText = data.data.length;
        }
      } else {
        console.error("Error fetching orders:", data);
        displayError("Failed to load orders");
        updateTotalOrders(0);
      }
    })
    .catch(error => {
      console.error("Error fetching orders:", error);
      displayError("Error: " + error.message);
      updateTotalOrders(0);
    });
}

function renderOrders(orders) {
  console.log("Rendering orders:", orders);
  const ordersList = document.getElementById('orders-list');

  if (!ordersList) {
    console.error("Orders list element not found");
    return;
  }

  ordersList.innerHTML = '';

  if (orders && orders.length > 0) {
    orders.forEach(order => {
      console.log(`Order ${order.orderId} Total Amount:`, order.totalAmount);

      const row = document.createElement('tr');
      const orderDate = new Date(order.date).toLocaleDateString();

      row.innerHTML = `
        <td>${order.orderId || ''}</td>
        <td>${order.customerName || ''}</td>
        <td>${orderDate || ''}</td>
        <td>₹${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</td>
        <td>${order.status || 'Pending'}</td>
        <td>
          <button class="view-btn" onclick="viewOrderDetails('${order._id}')">View</button>
          <button class="update-btn" onclick="updateOrderStatus('${order._id}')">Update</button>
        </td>
      `;

      ordersList.appendChild(row);
    });
  } else {
    ordersList.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
  }
}

function openModal(modalId) {
  const modalElem = document.getElementById(modalId);
  if (modalElem) {
    modalElem.style.display = "block";
  } else {
    console.error(`Modal element with id '${modalId}' not found`);
  }
}

function closeModal(modalId) {
  const modalElem = document.getElementById(modalId);
  if (modalElem) {
    modalElem.style.display = "none";
  } else {
    console.error(`Modal element with id '${modalId}' not found`);
  }
}

// Fetch and display order details in a modal
function viewOrderDetails(orderId) {
  console.log("Fetching order details for:", orderId);
  fetch(`/api/admin/orders/${orderId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data) {
        const order = data.data;
        const contentElem = document.getElementById("viewOrderDetailsContent");
        if (contentElem) {
          contentElem.innerHTML = `
            <p><strong>Order ID:</strong> ${order.orderId}</p>
            <p><strong>Customer Name:</strong> ${order.customerName}</p>
            <p><strong>Total Amount:</strong> ₹${order.totalAmount.toFixed(2)}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          `;
          openModal("viewOrderModal");
        } else {
          console.error("Element with id 'viewOrderDetailsContent' not found");
        }
      } else {
        alert("Failed to load order details");
      }
    })
    .catch(error => {
      console.error("Error fetching order details:", error);
      alert("Error fetching order details");
    });
}

// Fetch order details and open edit modal
function updateOrderStatus(orderId) {
  console.log("Fetching order for update:", orderId);

  fetch(`/api/admin/orders/${orderId}`)
    .then(response => {
      console.log("Response received:", response);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Order data fetched for update:", data);
      if (data.success && data.data) { // ✅ Fixed condition
        const order = data.data; // Extract the actual order object

        // Safely populate edit modal fields
        const idElem = document.getElementById("editOrderId");
        if (idElem) idElem.value = order._id; // Populate the orderId in the modal
        const customerNameElem = document.getElementById("editCustomerName");
        const totalAmountElem = document.getElementById("editTotalAmount");
        const statusElem = document.getElementById("editStatus");

        if (idElem) idElem.value = order._id;
        if (customerNameElem) customerNameElem.value = order.customerName || "";
        if (totalAmountElem) totalAmountElem.value = order.totalAmount || 0;
        if (statusElem) statusElem.value = order.status || "Pending";

        openModal("editOrderModal");
      } else {
        console.error("Failed to load order data:", data);
        alert("Failed to load order for editing");
      }
    })
    .catch(error => {
      console.error("Error fetching order:", error);
      alert("Error fetching order");
    });
}

// Save edited order details
function saveOrderChanges() {
  const orderId = document.getElementById("editOrderId")?.value; // Retrieve orderId
  const updatedOrder = {
    customerName: document.getElementById("editCustomerName")?.value,
    totalAmount: parseFloat(document.getElementById("editTotalAmount")?.value || "0"),
    status: document.getElementById("editStatus")?.value
  };

  console.log("Updating order:", orderId, updatedOrder); // Debugging log

  fetch(`/api/admin/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedOrder),
  })
    .then(response => {
      console.log("Response received:", response); // Debugging log
      return response.json();
    })
    .then(data => {
      console.log("Order update response:", data); // Debugging log
      if (data.success) {
        alert("Order updated successfully");
        closeModal("editOrderModal");
        fetchOrders(); // Refresh orders list
      } else {
        alert("Failed to update order");
      }
    })
    .catch(error => {
      console.error("Error updating order:", error);
      alert("Error updating order");
    });
}