sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/TextArea",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/ui/core/Icon"
], function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    Dialog,
    TextArea,
    Label,
    VBox,
    HBox,
    Icon
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
        "Are you sure you want to approve this payment?\n\n" +
        "Payment Reference: " +
        payment.paymentReference +
        "\nAmount: " +
        payment.amount +
        " " +
        payment.currency,

        {
            title: "Approve Payment",

            icon: MessageBox.Icon.SUCCESS,

            actions: [
                "Approve Payment",
                MessageBox.Action.CANCEL
            ],

            emphasizedAction: "Approve Payment",

            onClose: function (action) {

                if (action === "Approve Payment") {

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


    // =====================================================
    // ICON
    // =====================================================

    const rejectIcon = new Icon({
        src: "sap-icon://decline",
        size: "1.5rem"
    }).addStyleClass("rejectDialogIcon");


    // =====================================================
    // PAYMENT INFORMATION
    // =====================================================

    const paymentReference = new sap.m.Text({
        text: payment.paymentReference
    }).addStyleClass("rejectPaymentReference");


    const paymentAmount = new sap.m.Text({
        text:
            "Amount: " +
            payment.amount +
            " " +
            payment.currency
    }).addStyleClass("rejectPaymentAmount");


    const paymentInfo = new VBox({
        items: [
            paymentReference,
            paymentAmount
        ]
    }).addStyleClass("rejectPaymentInfo");


    const header = new HBox({
        alignItems: "Center",
        items: [
            rejectIcon,
            paymentInfo
        ]
    }).addStyleClass("rejectDialogHeader");


    // =====================================================
    // REASON LABEL
    // =====================================================

    const reasonLabel = new Label({
        text: "Rejection Reason",
        required: true
    }).addStyleClass("rejectReasonLabel");


    // =====================================================
    // REASON INPUT
    // =====================================================

    const reasonInput = new TextArea({
        width: "100%",
        rows: 5,
        maxLength: 500,
        placeholder: "Enter the reason for rejecting this payment..."
    }).addStyleClass("rejectReasonInput");


    // =====================================================
    // HELPER TEXT
    // =====================================================

    const helperText = new sap.m.Text({
        text: "Please provide a clear reason for audit purposes."
    }).addStyleClass("rejectHelperText");


    // =====================================================
    // FORM
    // =====================================================

    const form = new VBox({
        items: [
            header,

            reasonLabel,

            reasonInput,

            helperText
        ]
    }).addStyleClass("rejectDialogContent");


    // =====================================================
    // DIALOG
    // =====================================================

    const dialog = new Dialog({

        title: "Reject Payment",

        contentWidth: "480px",

        content: [
            form
        ],

        beginButton: new sap.m.Button({

            text: "Reject Payment",

            icon: "sap-icon://decline",

            type: "Reject",

            press: async function () {

                const reason =
                    reasonInput
                        .getValue()
                        .trim();


                // =============================================
                // VALIDATION
                // =============================================

                if (!reason) {

                    reasonInput.setValueState(
                        "Error"
                    );

                    reasonInput.setValueStateText(
                        "Rejection reason is required"
                    );

                    reasonInput.focus();

                    return;
                }


                // =============================================
                // CLEAR ERROR
                // =============================================

                reasonInput.setValueState(
                    "None"
                );


                // =============================================
                // CLOSE
                // =============================================

                dialog.close();


                // =============================================
                // REJECT PAYMENT
                // =============================================

                await this._rejectPayment(
                    payment.ID,
                    reason
                );

            }.bind(this)
        }),


        endButton: new sap.m.Button({

            text: "Cancel",

            type: "Transparent",

            press: function () {

                dialog.close();

            }

        }),


        afterClose: function () {

            dialog.destroy();

        }

    }).addStyleClass("rejectPaymentDialog");


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