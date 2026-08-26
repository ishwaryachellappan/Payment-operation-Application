sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/Button"
], function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    Dialog,
    Input,
    Label,
    VBox,
    Button
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

    console.log("========== REJECT CLICKED ==========");

    const context =
        oEvent
            .getSource()
            .getBindingContext("approval");

    if (!context) {

        console.error(
            "No approval binding context found"
        );

        MessageBox.error(
            "Unable to identify the selected payment."
        );

        return;
    }

    const payment =
        context.getObject();

    console.log(
        "Payment selected for rejection:",
        payment
    );


    // =========================================
    // INPUT FOR REJECTION REASON
    // =========================================

    const reasonInput =
        new Input({
            width: "100%",
            placeholder: "Enter rejection reason"
        });


    const form =
        new VBox({
            class: "sapUiMediumMargin",

            items: [

                new Label({
                    text:
                        "Payment: " +
                        payment.paymentReference
                }),

                reasonInput

            ]
        });


    // =========================================
    // REJECT DIALOG
    // =========================================

    const dialog =
        new Dialog({

            title: "Reject Payment",

            contentWidth: "450px",

            content: form,


            beginButton:
                new Button({

                    text: "Reject",

                    type: "Reject",

                    press:
                        async function () {

                            const reason =
                                reasonInput
                                    .getValue()
                                    .trim();


                            if (!reason) {

                                MessageBox.error(
                                    "Rejection reason is required."
                                );

                                return;
                            }


                            console.log(
                                "Reject reason:",
                                reason
                            );


                            dialog.close();


                            await this._rejectPayment(
                                payment.ID,
                                reason
                            );

                        }.bind(this)
                }),


            endButton:
                new Button({

                    text: "Cancel",

                    press:
                        function () {

                            dialog.close();

                        }
                }),


            afterClose:
                function () {

                    dialog.destroy();

                }

        });


    dialog.open();
},


            _rejectPayment: async function (
    paymentId,
    reason
) {

    console.log(
        "========== REJECT PAYMENT =========="
    );

    console.log(
        "Payment ID:",
        paymentId
    );

    console.log(
        "Reason:",
        reason
    );


    try {

        const response =
            await fetch(
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

                        paymentId:
                            paymentId,

                        reason:
                            reason

                    })
                }
            );


        console.log(
            "Reject response status:",
            response.status
        );


        const text =
            await response.text();


        console.log(
            "Reject response:",
            text
        );


        let result = {};

        try {

            result =
                text
                    ? JSON.parse(text)
                    : {};

        } catch (e) {

            console.error(
                "Response is not JSON:",
                e
            );

        }


        if (!response.ok) {

            MessageBox.error(
                result?.error?.message ||
                result?.message ||
                "Unable to reject payment."
            );

            return;
        }


        if (result.success === false) {

            MessageBox.error(
                result.message ||
                "Unable to reject payment."
            );

            return;
        }


        // =========================================
        // SUCCESS
        // =========================================

        MessageToast.show(
            "Payment rejected successfully"
        );


        // Reload inbox immediately
        await this._loadPendingPayments();


        console.log(
            "Approval Inbox refreshed."
        );

    } catch (error) {

        console.error(
            "Reject payment error:",
            error
        );

        MessageBox.error(
            "Unable to connect to payment service."
        );
    }
},

        }
    );
});