document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    setupTabNavigation();
    
    // Load orders by default (assuming orders tab is active first)
    fetchOrders();
    
    // Set up event listeners for other functions
    setupEventListeners();
  });
  document.getElementById("logoutBtn").addEventListener("click", function () {
    // Clear authentication data (if stored in localStorage or sessionStorage)
    localStorage.removeItem("authToken"); 
    sessionStorage.removeItem("authToken");

    // Redirect to the login page
    window.location.href = "login.html"; 
});

  // Function to set up tab navigation
  function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Determine which content to show based on button id
        const tabId = this.id;
        if (tabId === 'orders-tab') {
          document.getElementById('orders-section').classList.add('active');
          fetchOrders();
        } else if (tabId === 'products-tab') {
          document.getElementById('products-section').classList.add('active');
          fetchProducts();
        } else if (tabId === 'partners-tab') {
          document.getElementById('partners-section').classList.add('active');
          fetchPartners();
        }
      });
    });
  }
  
  // Set up other event listeners
  function setupEventListeners() {
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => openProductModal());
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
      closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        modal.style.display = 'none';
      });
    });
    
    // Product form submission
    const productForm = document.getElementById('product-form');
    if (productForm) {
      productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Category change for conditional fields
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
      categorySelect.addEventListener('change', toggleConditionalFields);
    }
    
    // Image URL input for preview
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
      imageInput.addEventListener('input', updateImagePreview);
    }
  }
  
 
  
  // =========== PRODUCTS FUNCTIONS ===========

function fetchPartnersForDropdown() {
  console.log("Fetching partners...");
  
  // Fetch the list of partners from the backend
  fetch('/api/admin/partners') // Ensure you have an endpoint `/api/partners` in the backend
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        populatePartnerDropdown(data.data);
      } else {
        console.error("Error fetching partners:", data);
        alert("Failed to load partners");
      }
    })
    .catch(error => {
      console.error("Error fetching partners:", error);
      alert("Error loading partners: " + error.message);
    });
}

function populatePartnerDropdown(partners) {
  const partnerSelect = document.getElementById('product-partner');
  
  // Clear the dropdown first
  partnerSelect.innerHTML = '';
  
  // Add a default option
  const defaultOption = document.createElement('option');
  defaultOption.textContent = 'Select Partner';
  defaultOption.value = '';
  partnerSelect.appendChild(defaultOption);
  
  // Populate dropdown with partners
  partners.forEach(partner => {
    const option = document.createElement('option');
    option.value = partner._id; // Assuming partner._id is used to reference the partner
    option.textContent = partner.name; // Assuming partner.name is the partner's name
    partnerSelect.appendChild(option);
  });
}

function fetchProducts() {
  console.log("Fetching products...");
  // Clear previous error messages if any
  const productsList = document.getElementById('products-list');
  if (productsList) {
    productsList.innerHTML = '<tr><td colspan="7">Loading products...</td></tr>';
  }

  fetch('/api/admin/products')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        renderProducts(data.data);
      } else {
        console.error("Error fetching products:", data);
        document.getElementById('products-list').innerHTML =
          '<tr><td colspan="7">Failed to load products</td></tr>';
      }
    })
    .catch(error => {
      console.error("Error fetching products:", error);
      document.getElementById('products-list').innerHTML =
        '<tr><td colspan="7">Error: ' + error.message + '</td></tr>';
    });
}

function renderProducts(products) {
  console.log("Rendering products:", products);
  const productsList = document.getElementById('products-list');

  if (!productsList) {
    console.error("Products list element not found");
    return;
  }

  productsList.innerHTML = '';

  if (products && products.length > 0) {
    products.forEach(product => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td><img src="${product.image || ''}" alt="${product.name}" class="product-thumbnail" style="max-width: 60px; max-height: 60px;"></td>
        <td>${product.name || ''}</td>
        <td>${formatCategory(product.category) || ''}</td>
        <td>₹${product.price ? product.price.toFixed(2) : '0.00'}</td>
        <td>${product.stock || '0'}</td>
        <td>${product.partnerName || 'Plantzo'}</td>
        <td>
          <button class="edit-btn" onclick="editProduct('${product._id}')">Edit</button>
          <button class="delete-btn" onclick="removeProduct('${product._id}')">Delete</button>
        </td>
      `;

      productsList.appendChild(row);
    });
  } else {
    productsList.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
  }
}

function formatCategory(category) {
  if (!category) return '';

  const categories = {
    'indoor': 'Indoor Plants',
    'outdoor': 'Outdoor Plants',
    'flowerseeds': 'Flower Seeds',
    'fertilizer': 'Fertilizers'
  };

  return categories[category] || category;
}

function openProductModal(productId = null) {
  console.log("Opening product modal", productId ? "for editing" : "for adding new product");

  const modal = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  const modalTitle = document.getElementById('modal-title');

  // Reset form
  form.reset();
  document.getElementById('product-image-preview').style.display = 'none';

  if (productId) {
    // Edit existing product
    modalTitle.textContent = 'Edit Product';
    document.getElementById('product-id').value = productId;

    // Fetch product details
    fetch(`/api/admin/product/${productId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data) {
          const product = data.data;

          // Fill form with product data
          document.getElementById('product-name').value = product.name || '';
          document.getElementById('product-description').value = product.description || '';
          document.getElementById('product-category').value = product.category || '';
          document.getElementById('product-price').value = product.price || '';
          document.getElementById('product-image').value = product.image || '';
          document.getElementById('product-stock').value = product.stock || '';

          // Check if there's a partner
          if (product.partnerName) {
            // Find and select the right option in the partner dropdown
            const partnerSelect = document.getElementById('product-partner');
            if (partnerSelect) {
              for (let i = 0; i < partnerSelect.options.length; i++) {
                if (partnerSelect.options[i].text === product.partnerName) {
                  partnerSelect.selectedIndex = i;
                  break;
                }
              }
            }
          }

          // Set conditional fields
          if (product.guidelines) {
            document.getElementById('product-guidelines').value =
              typeof product.guidelines === 'object' ? JSON.stringify(product.guidelines) : product.guidelines;
          }

          if (product.howToUse) {
            document.getElementById('product-howto').value =
              typeof product.howToUse === 'object' ? JSON.stringify(product.howToUse) : product.howToUse;
          }

          // Show image preview
          if (product.image) {
            const preview = document.getElementById('product-image-preview');
            preview.src = product.image;
            preview.style.display = 'block';
            preview.style.maxWidth = '200px';
            preview.style.maxHeight = '200px';
          }

          // Toggle conditional fields based on category
          toggleConditionalFields();
        } else {
          console.error("Error fetching product:", data);
          alert("Failed to load product details");
        }
      })
      .catch(error => {
        console.error("Error fetching product:", error);
        alert("Error loading product details: " + error.message);
      });
  } else {
    // Add new product
    modalTitle.textContent = 'Add New Product';
    document.getElementById('product-id').value = '';
  }

  modal.style.display = 'block';
}

function toggleConditionalFields() {
  const category = document.getElementById('product-category').value;
  const guidelinesContainer = document.getElementById('plant-guidelines-container');
  const howToContainer = document.getElementById('seed-fertilizer-howto-container');

  if (category === 'indoor' || category === 'outdoor') {
    guidelinesContainer.style.display = 'block';
    howToContainer.style.display = 'none';
  } else if (category === 'flowerseeds' || category === 'fertilizer') {
    guidelinesContainer.style.display = 'none';
    howToContainer.style.display = 'block';
  } else {
    guidelinesContainer.style.display = 'none';
    howToContainer.style.display = 'none';
  }
}

function handleProductSubmit(event) {
  event.preventDefault();
  console.log("Handling product form submission");

  const productId = document.getElementById('product-id').value;
  const isEditing = productId ? true : false;

  // Gather form data
  const formData = {
    name: document.getElementById('product-name').value,
    description: document.getElementById('product-description').value,
    category: document.getElementById('product-category').value,
    price: parseFloat(document.getElementById('product-price').value),
    image: document.getElementById('product-image').value,
    stock: parseInt(document.getElementById('product-stock').value),
    partnerName: document.getElementById('product-partner').options[
      document.getElementById('product-partner').selectedIndex
    ].text
  };

  // Add conditional fields based on category
  if (formData.category === 'indoor' || formData.category === 'outdoor') {
    formData.guidelines = document.getElementById('product-guidelines').value;
  } else if (formData.category === 'flowerseeds' || formData.category === 'fertilizer') {
    formData.howToUse = document.getElementById('product-howto').value;
  }

  console.log("Product data:", formData);

  // Determine if adding new or updating existing product
  const url = isEditing ? `/api/admin/product/${productId}` : '/api/admin/products';
  const method = isEditing ? 'PUT' : 'POST';

  // Send request to server
  fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log("Product saved successfully:", data);
        alert(isEditing ? "Product updated successfully!" : "Product added successfully!");

        // Close modal and refresh products list
        document.getElementById('product-modal').style.display = 'none';
        fetchProducts();
      } else {
        console.error("Error saving product:", data);
        alert("Error: " + (data.message || "Failed to save product"));
      }
    })
    .catch(error => {
      console.error("Error saving product:", error);
      alert("Error: " + error.message);
    });
}

// Fetch partners for the dropdown when the page loads
fetchPartnersForDropdown();

  
  function editProduct(productId) {
    openProductModal(productId);
  }
  
  function removeProduct(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
      console.log("Deleting product:", productId);
      
      fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            console.log("Product deleted successfully");
            alert("Product deleted successfully!");
            fetchProducts();
          } else {
            console.error("Error deleting product:", data);
            alert("Error: " + (data.message || "Failed to delete product"));
          }
        })
        .catch(error => {
          console.error("Error deleting product:", error);
          alert("Error: " + error.message);
        });
    }
  }
  
  function updateImagePreview() {
    const imageUrl = document.getElementById('product-image').value;
    const preview = document.getElementById('product-image-preview');
    
    if (imageUrl) {
      preview.src = imageUrl;
      preview.style.display = 'block';
      preview.style.maxWidth = '200px';
      preview.style.maxHeight = '200px';
    } else {
      preview.style.display = 'none';
    }
  }
  
  // =========== PARTNERS FUNCTIONS ===========
  function fetchPartners() {
    console.log("Fetching partners...");
    fetch('/api/admin/partners')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Partners data received:", data);
        if (data.success && data.data) {
          renderPartners(data.data);
        } else {
          console.error("Error fetching partners:", data);
          document.getElementById('partners-list').innerHTML = 
            '<tr><td colspan="5">Failed to load partners</td></tr>';
        }
      })
      .catch(error => {
        console.error("Error fetching partners:", error);
        document.getElementById('partners-list').innerHTML = 
          '<tr><td colspan="5">Error: ' + error.message + '</td></tr>';
      });
  }
  
  function renderPartners(partners) {
    console.log("Rendering partners:", partners);
    const partnersList = document.getElementById('partners-list');
    
    if (!partnersList) {
      console.error("Partners list element not found");
      return;
    }
    
    partnersList.innerHTML = '';
    
    if (partners && partners.length > 0) {
      partners.forEach(partner => {
        const row = document.createElement('tr');
        const joinedDate = new Date(partner.joinedDate).toLocaleDateString();
        
        row.innerHTML = `
          <td>${partner.name || ''}</td>
          <td>${joinedDate || ''}</td>
          <td>${partner.products || 0}</td>
          <td>₹${partner.totalSales ? partner.totalSales.toFixed(2) : '0.00'}</td>
          <td>
            <button class="view-btn" onclick="viewPartnerDetails('${partner._id}')">View</button>
            <button class="edit-btn" onclick="editPartner('${partner._id}')">Edit</button>
            <button class="delete-btn" onclick="deletePartner('${partner._id}')">Delete</button>
          </td>
        `;
        
        partnersList.appendChild(row);
      });
    } else {
      partnersList.innerHTML = '<tr><td colspan="5">No nursery partners found</td></tr>';
    }
  }
  function viewPartnerDetails(partnerId) {
    console.log("View partner details:", partnerId);

    fetch(`/api/admin/partners/${partnerId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data) {
          const partner = data.data;

          // Update modal content
          document.getElementById('partner-detail-title').textContent = partner.name;
          document.getElementById('partner-total-sales').textContent = 
            partner.totalSales ? '₹' + partner.totalSales.toFixed(2) : '₹0.00';
          document.getElementById('partner-product-count').textContent = partner.products || 0;
          
          // ✅ Fix: Use `averageRating` instead of `rating`
          document.getElementById('partner-rating').textContent = 
            partner.averageRating ? partner.averageRating.toFixed(1) : "N/A"; 

          // Open the modal
          document.getElementById('partner-details-modal').style.display = 'block';
        } else {
          console.error("Error fetching partner details:", data);
          alert("Failed to load partner details.");
        }
      })
      .catch(error => {
        console.error("Error fetching partner details:", error);
        alert("Error: " + error.message);
      });
}

// Add missing editPartner function
function editPartner(partnerId) {
    fetch(`/api/admin/partners/${partnerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                openEditForm(data.data);
            } else {
                console.error("Error fetching partner details for editing:", data);
                alert("Failed to load partner details for editing.");
            }
        })
        .catch(error => {
            console.error("Error fetching partner details for editing:", error);
            alert("Error: " + error.message);
        });
}

function openEditForm(partner) {
    document.getElementById('name').value = partner.name;
    document.getElementById('email').value = partner.email;
    document.getElementById('phone').value = partner.phone;
    document.getElementById('location').value = partner.location;
    document.getElementById('joinedDate').value = new Date(partner.joinedDate).toISOString().slice(0, 16);
    document.getElementById('products').value = partner.products;
    document.getElementById('totalSales').value = partner.totalSales;
    document.getElementById('averageRating').value = partner.averageRating;
    
    document.getElementById('saveChangesBtn').dataset.id = partner._id;

    // Show the modal
    document.getElementById('editPartnerModal').style.display = 'block';
}

function closeEditForm() {
    document.getElementById('editPartnerModal').style.display = 'none';
}

document.getElementById('editPartnerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('saveChangesBtn').dataset.id;
    const updatedPartner = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        location: document.getElementById('location').value,
        joinedDate: document.getElementById('joinedDate').value,
        products: parseInt(document.getElementById('products').value),
        totalSales: parseFloat(document.getElementById('totalSales').value),
        averageRating: parseFloat(document.getElementById('averageRating').value),
    };

    try {
        const response = await fetch(`/api/admin/partners/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPartner),
        });

        if (response.ok) {
            alert('Partner updated successfully');
            location.reload();
        } else {
            const errorData = await response.json();
            alert('Error updating partner: ' + errorData.message);
        }
    } catch (error) {
        alert('Error updating partner: ' + error.message);
    }
});

function deletePartner(partnerId) {
    if (confirm("Are you sure you want to delete this partner?")) {
        console.log("Deleting partner:", partnerId);
        
        fetch(`/api/admin/partners/${partnerId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Partner deleted successfully");
                location.reload();
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error deleting partner:", error);
            alert("Error: " + error.message);
        });
    }
}
// Open Modal Functionality
document.getElementById("addPartnerButton").addEventListener("click", () => {
  document.getElementById("partner-modal").style.display = "block"; // Show modal
});

// Close Modal Functionality
document.querySelector("#partner-modal .close").addEventListener("click", () => {
  document.getElementById("partner-modal").style.display = "none"; // Hide modal
});

// Submit Add Partner Form
document.getElementById("partner-form").addEventListener("submit", async function (e) {
  e.preventDefault(); // Prevent default form submission

  const newPartner = {
      name: document.getElementById("partner-name").value,
      email: document.getElementById("partner-email").value,
      phone: document.getElementById("partner-phone").value,
      location: document.getElementById("partner-location").value,
  };

  try {
      const response = await fetch("/api/admin/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPartner),
      });

      if (response.ok) {
          alert("Partner added successfully!");
          document.getElementById("partner-modal").style.display = "none"; // Close modal
          location.reload(); // Refresh page to update partner list
      } else {
          const errorData = await response.json();
          alert("Error adding partner: " + errorData.message);
      }
  } catch (error) {
      alert("Error adding partner: " + error.message);
  }
});
// Add these to window to make them globally accessible
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.editProduct = editProduct;
window.removeProduct = removeProduct;
window.viewPartnerDetails = viewPartnerDetails;
window.editPartner = editPartner;
window.deletePartner = deletePartner;
window.updateImagePreview = updateImagePreview;