document.addEventListener("DOMContentLoaded", () => {
    const addPartnerBtn = document.getElementById("add-partner-btn");
    const partnerModal = document.getElementById("partner-modal");
    const closeModalBtn = document.querySelector(".close");
    const partnerForm = document.getElementById("partner-form");

    // Open the Add Partner Modal
    addPartnerBtn.addEventListener("click", () => {
        partnerModal.style.display = "block";
    });

    // Close the Modal
    closeModalBtn.addEventListener("click", () => {
        partnerModal.style.display = "none";
    });

    // Handle Partner Form Submission
    partnerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

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

            const result = await response.json();
            if (result.success) {
                alert("Partner added successfully!");
                partnerModal.style.display = "none";
                location.reload(); // Refresh the page to show the new partner
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error adding partner:", error);
            alert("Server error");
        }
    });
});