sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("paymentsapp.controller.Login", {

        onLogin: async function () {

            const userName = this.byId("userName").getValue().trim();
            const password = this.byId("password").getValue();

            // Validate fields
            if (!userName || !password) {
                MessageBox.error("Username and password are required");
                return;
            }

            const button = this.getView().byId(
                this.getView().getId() + "--" + "loginButton"
            );

            if (button) {
                button.setBusy(true);
            }

            try {

                const response = await fetch("/payment-service/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        userName: userName,
                        password: password
                    })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    MessageBox.error(
                        result.message || "Invalid username or password"
                    );
                    return;
                }

                // Save logged-in user information
               sessionStorage.setItem(
    "paymentUser",
    JSON.stringify({
        username: result.username,
        fullName: result.fullName,
        role: result.role
    })
);

sessionStorage.setItem(
    "userRole",
    result.role
);

sessionStorage.setItem(
    "username",
    result.username
);

sessionStorage.setItem(
    "fullName",
    result.fullName
);

                MessageToast.show("Login successful");

                // Role-based routing
              if (result.role === "ADMIN") {

    this.getOwnerComponent()
        .getRouter()
        .navTo("Dashboard", {}, true);

} else if (result.role === "PAYMENT_USER") {

    this.getOwnerComponent()
        .getRouter()
        .navTo("Payments", {}, true);

} else {

                    MessageBox.error("Unknown user role");

                }

            } catch (error) {

                console.error("Login error:", error);

                MessageBox.error(
                    "Unable to connect to payment service"
                );

            } finally {

                if (button) {
                    button.setBusy(false);
                }

            }
        },

        onBeforeRendering: function () {

    var userIdInput = this.byId("userId");
    var passwordInput = this.byId("password");

    if (userIdInput) {
        userIdInput.setValue("");
    }

    if (passwordInput) {
        passwordInput.setValue("");
    }
},

    });
});