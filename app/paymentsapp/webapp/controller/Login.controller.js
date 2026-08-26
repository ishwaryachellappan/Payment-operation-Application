sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (
    Controller,
    MessageBox,
    MessageToast
) {
    "use strict";

    return Controller.extend(
        "paymentsapp.controller.Login",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                console.log("LOGIN CONTROLLER INITIALIZED");

                // Make sure login page starts empty
                this.byId("userNameInput").setValue("");
                this.byId("passwordInput").setValue("");
            },


            // =====================================================
            // LOGIN
            // =====================================================

            onLogin: async function () {

                console.log("========== LOGIN CLICKED ==========");


                // -------------------------------------------------
                // Get inputs
                // -------------------------------------------------

                const userName =
                    this.byId("userNameInput")
                        .getValue()
                        .trim();

                const password =
                    this.byId("passwordInput")
                        .getValue();


                console.log(
                    "Username:",
                    userName
                );


                // -------------------------------------------------
                // Validation
                // -------------------------------------------------

                if (!userName) {

                    MessageBox.error(
                        "Please enter User ID."
                    );

                    return;
                }


                if (!password) {

                    MessageBox.error(
                        "Please enter Password."
                    );

                    return;
                }


                // -------------------------------------------------
                // Disable button
                // -------------------------------------------------

                const loginButton =
                    this.byId("loginButton");

                loginButton.setEnabled(false);


                try {

                    console.log(
                        "Calling login service..."
                    );


                    // =================================================
                    // CALL CAP LOGIN ACTION
                    // =================================================

                    const response =
                        await fetch(
                            "/payment-service/login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        userName:
                                            userName,

                                        password:
                                            password

                                    })
                            }
                        );


                    console.log(
                        "Login HTTP status:",
                        response.status
                    );


                    const result =
                        await response.json();


                    console.log(
                        "Login response:",
                        result
                    );


                    // =================================================
                    // LOGIN FAILED
                    // =================================================

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        MessageBox.error(
                            result.message ||
                            "Invalid username or password."
                        );

                        loginButton.setEnabled(true);

                        return;
                    }


                    // =================================================
                    // LOGIN SUCCESS
                    // =================================================

                    console.log(
                        "LOGIN SUCCESS"
                    );

                    console.log(
                        "Username:",
                        result.username
                    );

                    console.log(
                        "Full Name:",
                        result.fullName
                    );

                    console.log(
                        "Role:",
                        result.role
                    );


                    // =================================================
                    // STORE SESSION
                    // =================================================

                    sessionStorage.setItem(
                        "username",
                        result.username
                    );

                    sessionStorage.setItem(
                        "fullName",
                        result.fullName
                    );

                    sessionStorage.setItem(
                        "userRole",
                        result.role
                    );


                    console.log(
                        "Session role:",
                        sessionStorage.getItem(
                            "userRole"
                        )
                    );


                    MessageToast.show(
                        "Login successful"
                    );


                    // =================================================
                    // NAVIGATION BASED ON ROLE
                    // =================================================

                    const router =
                        this.getOwnerComponent()
                            .getRouter();


                    if (
                        result.role === "ADMIN"
                    ) {

                        console.log(
                            "Navigating to Dashboard"
                        );

                        router.navTo(
                            "Dashboard",
                            {},
                            true
                        );

                    } else if (
                        result.role === "PAYMENT_USER"
                    ) {

                        console.log(
                            "Navigating to Payments"
                        );

                        router.navTo(
                            "Payments",
                            {},
                            true
                        );

                    } else {

                        console.error(
                            "Unknown role:",
                            result.role
                        );

                        sessionStorage.clear();

                        MessageBox.error(
                            "Invalid user role."
                        );

                        loginButton.setEnabled(true);

                    }

                } catch (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );

                    MessageBox.error(
                        "Unable to connect to payment service."
                    );

                    loginButton.setEnabled(true);
                }
            },


            // =====================================================
            // AFTER LOGIN PAGE EXIT
            // =====================================================

            onExit: function () {

                console.log(
                    "Login controller destroyed"
                );

            }

        }
    );
});