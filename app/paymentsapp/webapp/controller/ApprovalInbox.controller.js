sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast
) {
    "use strict";

    return Controller.extend(
        "paymentsapp.controller.ApprovalInbox",
        {
onInit: function () {

    // Create approval inbox model
    var oModel = new JSONModel({
        payments: []
    });

    this.getView().setModel(
        oModel,
        "approval"
    );


    // Check role
    var role =
        sessionStorage.getItem("userRole");

    console.log(
        "APPROVAL INBOX ROLE:",
        role
    );


    // Only Admin
    if (role !== "ADMIN") {

        this.getOwnerComponent()
            .getRouter()
            .navTo(
                "Payments",
                {},
                true
            );

        return;
    }


    this._loadPendingPayments();
},


            _loadPendingPayments: async function () {

    try {

        var response =
            await fetch(
                "/payment-service/Payments?$filter=status%20eq%20%27PENDING_APPROVAL%27"
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );
        }


        var result =
            await response.json();


        var payments =
            Array.isArray(result.value)
                ? result.value
                : [];


        console.log(
            "Pending payments:",
            payments
        );


        // Update model
        this.getView()
            .getModel("approval")
            .setProperty(
                "/payments",
                payments
            );


        // Update count
        this.byId(
            "approvalInboxTitle"
        ).setText(
            "Pending Payments (" +
            payments.length +
            ")"
        );


    } catch (error) {

        console.error(
            "Unable to load approval inbox:",
            error
        );


        MessageBox.error(
            "Unable to load pending payments."
        );
    }
},

            onRefresh: function () {

                this._loadPendingPayments();

            },


            onBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("Dashboard");

            },


            onApprove: function (oEvent) {

                const payment =
                    oEvent
                        .getSource()
                        .getBindingContext("approval")
                        .getObject();

                MessageBox.confirm(
                    "Approve payment " +
                    payment.paymentReference +
                    "?",
                    {
                        title: "Approve Payment",

                        onClose: function (action) {

                            if (
                                action ===
                                MessageBox.Action.OK
                            ) {

                                this._approvePayment(
                                    payment.ID
                                );
                            }

                        }.bind(this)
                    }
                );
            },


            _approvePayment: async function (paymentId) {

                try {

                    const response = await fetch(
                        "/payment-service/approvePayment",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                paymentId: paymentId
                            })
                        }
                    );

                    const result =
                        await response.json();

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        MessageBox.error(
                            result.message ||
                            "Unable to approve payment"
                        );

                        return;
                    }

                    MessageToast.show(
    "Payment approved successfully"
);

await this._loadPendingPayments();

                } catch (error) {

                    console.error(
                        "Approve payment error:",
                        error
                    );

                    MessageBox.error(
                        "Unable to connect to payment service"
                    );
                }
            },


            onReject: function (oEvent) {

                const payment =
                    oEvent
                        .getSource()
                        .getBindingContext("approval")
                        .getObject();

                MessageBox.prompt(
                    "Enter rejection reason:",
                    {
                        title: "Reject Payment",

                        onClose: function (
                            action,
                            value
                        ) {

                            if (
                                action ===
                                MessageBox.Action.OK
                            ) {

                                if (
                                    !value ||
                                    !value.trim()
                                ) {

                                    MessageBox.error(
                                        "Rejection reason is required"
                                    );

                                    return;
                                }

                                this._rejectPayment(
                                    payment.ID,
                                    value.trim()
                                );
                            }

                        }.bind(this)
                    }
                );
            },


            _rejectPayment: async function (
                paymentId,
                reason
            ) {

                try {

                    const response = await fetch(
                        "/payment-service/rejectPayment",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                paymentId: paymentId,
                                reason: reason
                            })
                        }
                    );

                    const result =
                        await response.json();

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        MessageBox.error(
                            result.message ||
                            "Unable to reject payment"
                        );

                        return;
                    }

                    MessageToast.show(
                        "Payment rejected successfully"
                    );

                    this._loadPendingPayments();

                } catch (error) {

                    console.error(
                        "Reject payment error:",
                        error
                    );

                    MessageBox.error(
                        "Unable to connect to payment service"
                    );
                }
            }

        }
    );
});