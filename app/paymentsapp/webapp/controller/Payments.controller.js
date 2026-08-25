sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Input"
], function (
    Controller,
    JSONModel,
    MessageBox,
    MessageToast,
    Dialog,
    List,
    StandardListItem,
    Button,
    VBox,
    Label,
    Input
) {
    "use strict";

    return Controller.extend("paymentsapp.controller.Payments", {

        // =====================================================
        // INIT
        // =====================================================

        onInit: function () {

            // Separate JSON model for Payments page
            this.getView().setModel(
                new JSONModel({
                    payments: []
                }),
                "payments"
            );

            // Listen for route changes
            this.getOwnerComponent()
                .getRouter()
                .getRoute("Payments")
                .attachPatternMatched(
                    this._onPaymentsRouteMatched,
                    this
                );
        },


        // =====================================================
        // ROUTE HANDLING
        // =====================================================

       _onPaymentsRouteMatched: function (oEvent) {

    const routeArguments =
        oEvent.getParameter("arguments");

    let status = "ALL";

    if (
        routeArguments &&
        routeArguments["?query"] &&
        routeArguments["?query"].status
    ) {
        status =
            routeArguments["?query"].status;
    }

    this._currentStatus = status;

    console.log(
        "Payments route status:",
        status
    );

    const searchField =
        this.byId("paymentSearch");

    if (searchField) {
        searchField.setValue("");
    }

    this._loadPayments(status);
},
        // =====================================================
        // LOAD PAYMENTS
        // =====================================================

        _loadPayments: async function (status) {

            try {

                let url =
                    "/payment-service/Payments";

                /*
                 * If status is not ALL,
                 * filter at CAP/OData level.
                 */

                if (
                    status &&
                    status !== "ALL"
                ) {

                    url +=
                        "?$filter=status%20eq%20%27" +
                        encodeURIComponent(status) +
                        "%27";
                }

                console.log(
                    "Loading payments from:",
                    url
                );

                const response =
                    await fetch(url, {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
                        }
                    });

                if (!response.ok) {

                    throw new Error(
                        "HTTP " +
                        response.status
                    );
                }

                const result =
                    await response.json();

                const payments =
                    result.value || [];

                console.log(
                    "Payments loaded:",
                    payments
                );

                this.getView()
                    .getModel("payments")
                    .setProperty(
                        "/payments",
                        payments
                    );

            } catch (error) {

                console.error(
                    "Unable to load payments:",
                    error
                );

                MessageBox.error(
                    "Unable to load payments."
                );
            }
        },


        // =====================================================
        // BACK TO DASHBOARD
        // =====================================================

        onBack: function () {

            this.getOwnerComponent()
                .getRouter()
                .navTo("Dashboard");

        },


        // =====================================================
        // SEARCH PAYMENTS
        // =====================================================

        onSearch: function (oEvent) {

            const searchValue =
                oEvent.getParameter("newValue");

            const table =
                this.byId("paymentsTable");

            const binding =
                table.getBinding("items");

            if (!binding) {
                return;
            }

            if (!searchValue) {

                binding.filter([]);

                return;
            }

            const filters = [

                new Filter(
                    "paymentReference",
                    FilterOperator.Contains,
                    searchValue
                ),

                new Filter(
                    "companyCode",
                    FilterOperator.Contains,
                    searchValue
                ),

                new Filter(
                    "currency",
                    FilterOperator.Contains,
                    searchValue
                ),

                new Filter(
                    "status",
                    FilterOperator.Contains,
                    searchValue
                ),

                new Filter(
                    "debtorAccount",
                    FilterOperator.Contains,
                    searchValue
                ),

                new Filter(
                    "creditorAccount",
                    FilterOperator.Contains,
                    searchValue
                )

            ];

            binding.filter(
                new Filter({
                    filters: filters,
                    and: false
                })
            );
        },


        // =====================================================
        // CREATE PAYMENT
        // =====================================================

        onCreatePayment: function () {

            const paymentReferenceInput =
                new Input({
                    placeholder: "Payment Reference"
                });

            const companyCodeInput =
                new Input({
                    placeholder: "Company Code"
                });

            const debtorAccountInput =
                new Input({
                    placeholder: "Debtor Account"
                });

            const creditorAccountInput =
                new Input({
                    placeholder: "Creditor Account"
                });

            const amountInput =
                new Input({
                    placeholder: "Amount",
                    type: "Number"
                });

            const currencySelect =
                new Select({
                    width: "100%",
                    selectedKey: "EUR",

                    items: [

                        new Item({
                            key: "EUR",
                            text: "EUR"
                        }),

                        new Item({
                            key: "GBP",
                            text: "GBP"
                        }),

                        new Item({
                            key: "USD",
                            text: "USD"
                        })

                    ]
                });

            const paymentMethodSelect =
                new Select({
                    width: "100%",
                    selectedKey: "SEPA",

                    items: [

                        new Item({
                            key: "SEPA",
                            text: "SEPA"
                        }),

                        new Item({
                            key: "SWIFT",
                            text: "SWIFT"
                        })

                    ]
                });

            const paymentDatePicker =
                new DatePicker({
                    width: "100%",
                    valueFormat: "yyyy-MM-dd",
                    displayFormat: "dd-MM-yyyy"
                });


            // =================================================
            // FORM
            // =================================================

            const form =
                new VBox({
                    class: "sapUiMediumMargin",

                    items: [

                        new Label({
                            text: "Payment Reference"
                        }),

                        paymentReferenceInput,


                        new Label({
                            text: "Company Code"
                        }),

                        companyCodeInput,


                        new Label({
                            text: "Debtor Account"
                        }),

                        debtorAccountInput,


                        new Label({
                            text: "Creditor Account"
                        }),

                        creditorAccountInput,


                        new Label({
                            text: "Amount"
                        }),

                        amountInput,


                        new Label({
                            text: "Currency"
                        }),

                        currencySelect,


                        new Label({
                            text: "Payment Method"
                        }),

                        paymentMethodSelect,


                        new Label({
                            text: "Payment Date"
                        }),

                        paymentDatePicker

                    ]
                });


            // =================================================
            // DIALOG
            // =================================================

            const dialog =
                new Dialog({

                    title: "Create Payment",

                    contentWidth: "500px",

                    content: form,


                    beginButton:
                        new Button({

                            text: "Create",

                            type: "Emphasized",

                            press:
                                async function () {

                                    // ---------------------------------
                                    // Read values
                                    // ---------------------------------

                                    const paymentReference =
                                        paymentReferenceInput
                                            .getValue()
                                            .trim();

                                    const companyCode =
                                        companyCodeInput
                                            .getValue()
                                            .trim();

                                    const debtorAccount =
                                        debtorAccountInput
                                            .getValue()
                                            .trim();

                                    const creditorAccount =
                                        creditorAccountInput
                                            .getValue()
                                            .trim();

                                    const amount =
                                        amountInput
                                            .getValue();

                                    const currency =
                                        currencySelect
                                            .getSelectedKey();

                                    const paymentMethod =
                                        paymentMethodSelect
                                            .getSelectedKey();

                                    const paymentDate =
                                        paymentDatePicker
                                            .getValue();


                                    // ---------------------------------
                                    // Validation
                                    // ---------------------------------

                                    if (
                                        !paymentReference ||
                                        !companyCode ||
                                        !debtorAccount ||
                                        !creditorAccount ||
                                        !amount ||
                                        !currency ||
                                        !paymentMethod ||
                                        !paymentDate
                                    ) {

                                        MessageBox.error(
                                            "All payment fields are required"
                                        );

                                        return;
                                    }


                                    const numericAmount =
                                        Number(amount);


                                    if (
                                        isNaN(numericAmount) ||
                                        numericAmount <= 0
                                    ) {

                                        MessageBox.error(
                                            "Amount must be greater than zero"
                                        );

                                        return;
                                    }


                                    // ---------------------------------
                                    // Call CAP
                                    // ---------------------------------

                                    try {

                                        const response =
                                            await fetch(
                                                "/payment-service/createPayment",
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
                                                            paymentReference:
                                                                paymentReference,

                                                            companyCode:
                                                                companyCode,

                                                            debtorAccount:
                                                                debtorAccount,

                                                            creditorAccount:
                                                                creditorAccount,

                                                            amount:
                                                                numericAmount,

                                                            currency:
                                                                currency,

                                                            paymentMethod:
                                                                paymentMethod,

                                                            paymentDate:
                                                                paymentDate
                                                        })
                                                }
                                            );


                                        const result =
                                            await response.json();


                                        // ---------------------------------
                                        // Error from CAP
                                        // ---------------------------------

                                        if (
                                            !response.ok ||
                                            !result.success
                                        ) {

                                            MessageBox.error(
                                                result.message ||
                                                "Unable to create payment"
                                            );

                                            return;
                                        }


                                        // ---------------------------------
                                        // Success
                                        // ---------------------------------

                                        MessageToast.show(
                                            "Payment created successfully"
                                        );

                                        dialog.close();


                                        /*
                                         * Reload using the currently
                                         * selected KPI/status.
                                         */
                                        this._loadPayments(
                                            this._currentStatus ||
                                            "ALL"
                                        );

                                    } catch (error) {

                                        console.error(
                                            "Create payment error:",
                                            error
                                        );

                                        MessageBox.error(
                                            "Unable to connect to payment service"
                                        );
                                    }

                                }.bind(this)
                        }),


                    // -----------------------------------------
                    // CANCEL
                    // -----------------------------------------

                    endButton:
                        new Button({

                            text: "Cancel",

                            press:
                                function () {

                                    dialog.close();

                                }
                        }),


                    // -----------------------------------------
                    // DESTROY
                    // -----------------------------------------

                    afterClose:
                        function () {

                            dialog.destroy();

                        }
                });


            dialog.open();
        },


        // =====================================================
        // PAYMENT SELECTION
        // =====================================================

        onPaymentPress: function (oEvent) {

            const context =
                oEvent
                    .getSource()
                    .getBindingContext("payments");

            if (!context) {
                return;
            }

            const payment =
                context.getObject();

            console.log(
                "Selected payment:",
                payment
            );

            /*
             * We will use this later to open
             * the Payment Details page.
             */

        },

        onLogout: function () {

    console.log("Logout clicked from Payments");

    sessionStorage.clear();

    this.getOwnerComponent()
        .getRouter()
        .navTo("Login", {}, true);

},

onCopyPayment: async function () {

    try {

        const response = await fetch(
            "/payment-service/Payments?$orderby=createdAt%20desc"
        );

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const result =
            await response.json();

        const payments =
            result.value || [];

        if (payments.length === 0) {

            MessageBox.information(
                "There are no existing payments to copy."
            );

            return;
        }

        // Create model for selection dialog
        const model =
            new JSONModel({
                payments: payments
            });

        // Dialog
        const dialog =
            new Dialog({
                title: "Select Payment to Copy",
                contentWidth: "700px",
                contentHeight: "450px",
                resizable: true,
                draggable: true,

                content: [

                    new List({
                        items: {
                            path: "/payments",
                            template: new StandardListItem({
                                title: "{paymentReference}",
                                description: {
                                    parts: [
                                        {
                                            path: "companyCode"
                                        },
                                        {
                                            path: "amount"
                                        },
                                        {
                                            path: "currency"
                                        },
                                        {
                                            path: "status"
                                        }
                                    ],

                                    formatter:
                                        function (
                                            company,
                                            amount,
                                            currency,
                                            status
                                        ) {

                                            return (
                                                "Company: " +
                                                company +
                                                " | Amount: " +
                                                amount +
                                                " " +
                                                currency +
                                                " | Status: " +
                                                status
                                            );
                                        }
                                },

                                type: "Active",

                                press:
                                    function (oEvent) {

                                        const selectedPayment =
                                            oEvent
                                                .getSource()
                                                .getBindingContext()
                                                .getObject();

                                        dialog.close();

                                        this._openCopyPaymentDialog(
                                            selectedPayment
                                        );

                                    }.bind(this)
                            })
                        }
                    })
                ],

                buttons: [

                    new Button({
                        text: "Cancel",
                        press: function () {
                            dialog.close();
                        }
                    })

                ],

                afterClose: function () {
                    dialog.destroy();
                }
            });

        dialog.setModel(model);

        dialog.open();

    } catch (error) {

        console.error(
            "Copy payment error:",
            error
        );

        MessageBox.error(
            "Unable to load payments."
        );
    }
},

_openCopyPaymentDialog: function (payment) {

    console.log(
        "COPYING PAYMENT:",
        payment
    );

    /*
     * Create a copy of the payment.
     *
     * ID is NOT copied.
     * Status is NOT copied.
     *
     * The new payment starts as PENDING_APPROVAL.
     */

    const copiedPayment = {

        paymentReference:
            payment.paymentReference,

        companyCode:
            payment.companyCode,

        debtorAccount:
            payment.debtorAccount,

        creditorAccount:
            payment.creditorAccount,

        amount:
            payment.amount,

        currency:
            payment.currency,

        paymentMethod:
            payment.paymentMethod,

        paymentDate:
            payment.paymentDate,

        status:
            "PENDING_APPROVAL"
    };


    const model =
        new JSONModel(
            copiedPayment
        );


    const dialog =
        new Dialog({

            title: "Copy Payment",

            contentWidth: "450px",

            content: [

                new VBox({

                    class: "sapUiMediumMargin",

                    items: [

                        new Label({
                            text: "Payment Reference"
                        }),

                        new Input({
                            value: "{/paymentReference}",
                            placeholder:
                                "Enter new payment reference"
                        }),

                        new Label({
                            text: "Company Code"
                        }),

                        new Input({
                            value: "{/companyCode}"
                        }),

                        new Label({
                            text: "Debtor Account"
                        }),

                        new Input({
                            value: "{/debtorAccount}"
                        }),

                        new Label({
                            text: "Creditor Account"
                        }),

                        new Input({
                            value: "{/creditorAccount}"
                        }),

                        new Label({
                            text: "Amount"
                        }),

                        new Input({
                            value: "{/amount}",
                            type: "Number"
                        }),

                        new Label({
                            text: "Currency"
                        }),

                        new Input({
                            value: "{/currency}"
                        }),

                        new Label({
                            text: "Payment Method"
                        }),

                        new Input({
                            value: "{/paymentMethod}"
                        }),

                        new Label({
                            text: "Payment Date"
                        }),

                        new Input({
                            value: "{/paymentDate}"
                        })

                    ]
                })

            ],

            buttons: [

                new Button({

                    text: "Create Copy",

                    type: "Emphasized",

                    press:
                        function () {

                            const data =
                                dialog
                                    .getModel()
                                    .getData();

                            this._createCopiedPayment(
                                data,
                                dialog
                            );

                        }.bind(this)

                }),

                new Button({

                    text: "Cancel",

                    press:
                        function () {

                            dialog.close();

                        }

                })

            ],

            afterClose:
                function () {

                    dialog.destroy();

                }

        });


    dialog.setModel(model);

    dialog.open();
},

_createCopiedPayment: async function (payment, dialog) {

    try {

        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !payment.paymentReference ||
            !payment.paymentReference.trim()
        ) {

            MessageBox.error(
                "Payment Reference is required."
            );

            return;
        }

        if (
            !payment.companyCode ||
            !payment.debtorAccount ||
            !payment.creditorAccount ||
            !payment.amount ||
            !payment.currency ||
            !payment.paymentMethod ||
            !payment.paymentDate
        ) {

            MessageBox.error(
                "All payment fields are required."
            );

            return;
        }


        // ==========================================
        // CREATE A NEW UNIQUE REFERENCE
        // ==========================================

        const newReference =
            payment.paymentReference.trim() +
            "-COPY-" +
            Date.now();


        // ==========================================
        // PAYLOAD FOR CAP ACTION
        // ==========================================

        const payload = {

            paymentReference:
                newReference,

            companyCode:
                payment.companyCode,

            debtorAccount:
                payment.debtorAccount,

            creditorAccount:
                payment.creditorAccount,

            amount:
                Number(payment.amount),

            currency:
                payment.currency,

            paymentMethod:
                payment.paymentMethod,

            paymentDate:
                payment.paymentDate
        };


        console.log(
            "Creating copied payment:",
            payload
        );


        // ==========================================
        // CALL SAME ACTION AS NORMAL CREATE
        // ==========================================

        const response =
            await fetch(
                "/payment-service/createPayment",
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        const result =
            await response.json();


        console.log(
            "Create copied payment response:",
            result
        );


        // ==========================================
        // CHECK CAP RESPONSE
        // ==========================================

        if (
            !response.ok ||
            !result.success
        ) {

            MessageBox.error(
                result.message ||
                "Unable to copy payment."
            );

            return;
        }


        // ==========================================
        // SUCCESS
        // ==========================================

        console.log(
            "Copied payment created:",
            result.paymentId
        );


        dialog.close();


        MessageToast.show(
            "Payment copied successfully"
        );


        // ==========================================
        // RELOAD CURRENT PAYMENT LIST
        // ==========================================

        await this._loadPayments(
            this._currentStatus || "ALL"
        );


    } catch (error) {

        console.error(
            "Create copied payment error:",
            error
        );


        MessageBox.error(
            error.message ||
            "Unable to create copied payment."
        );
    }
},
_reloadPaymentsTable: async function () {

    try {

        console.log(
            "Reloading Payments table..."
        );


        const response =
            await fetch(
                "/payment-service/Payments?$orderby=createdAt%20desc"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to reload payments. HTTP " +
                response.status
            );
        }


        const result =
            await response.json();


        const payments =
            Array.isArray(result.value)
                ? result.value
                : [];


        console.log(
            "Reloaded payments:",
            payments
        );


        console.log(
            "Reloaded payment count:",
            payments.length
        );


        // ==========================================
        // UPDATE THE SAME MODEL USED BY THE TABLE
        // ==========================================

        const model =
            this.getView()
                .getModel("payments");


        if (!model) {

            console.error(
                "Payments JSON model was not found."
            );

            MessageBox.error(
                "Payment table model is not available."
            );

            return;
        }


        model.setProperty(
            "/payments",
            payments
        );


        model.refresh(true);


        console.log(
            "Payments table refreshed."
        );


    } catch (error) {

        console.error(
            "Unable to refresh Payments table:",
            error
        );


        MessageBox.error(
            "Payment was created, but the payment list could not be refreshed."
        );
    }
},

    });

});