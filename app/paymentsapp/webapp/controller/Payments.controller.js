sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",

    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/Select",
    "sap/m/DatePicker",
    "sap/m/TextArea",

    "sap/ui/core/Item"

], function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,

    MessageBox,
    MessageToast,
    Dialog,
    List,
    StandardListItem,
    Button,
    VBox,
    Label,
    Input,
    Select,
    DatePicker,
    TextArea,

    Item

) {
    "use strict";

    return Controller.extend(
        "paymentsapp.controller.Payments",
        {

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

                                        const performedBy =
    sessionStorage.getItem("username");

console.log(
    "Creating payment as:",
    performedBy
);

if (!performedBy) {

    MessageBox.error(
        "Unable to identify the logged-in user."
    );

    return;
}

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
            paymentDate,

        // IMPORTANT:
        // Store the actual logged-in user
        // as the payment creator.
        performedBy:
            sessionStorage.getItem("username")

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
                                        this._loadSummaryCounts();

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
// PAYMENT SELECTION — OPEN DETAIL DIALOG
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

    this._openPaymentDetailDialog(payment);

},


// =====================================================
// PAYMENT DETAIL DIALOG
// =====================================================
_openPaymentDetailDialog: function (payment) {

    const detailRow =
        function (label, value) {

            return new sap.m.HBox({

                width: "100%",

                justifyContent: "SpaceBetween",

                alignItems: "Center",

                class: "sapUiTinyMarginBottom",

                items: [

                    new sap.m.Label({
                        text: label,
                        design: "Bold"
                    }),

                    new sap.m.Text({
                        text: value || "-",
                        textAlign: "End"
                    })

                ]

            });

        };


    // -------------------------------------------------
    // TOP SUMMARY (reference + amount)
    // -------------------------------------------------

    const topBox =
        new sap.m.VBox({

            width: "100%",

            class: "sapUiSmallMarginBottom sapUiResponsivePadding--content",

            items: [

                new sap.m.Title({
                    text: payment.paymentReference,
                    level: "H3"
                }),

                new sap.m.ObjectNumber({
                    number: payment.amount,
                    unit: payment.currency,
                    emphasized: true,
                    state: "Information"
                })

            ]

        });


    const bodyItems = [

        topBox,

        new sap.ui.core.HTML({
            content: "<hr style='border:none;border-top:1px solid #e5e9ec;margin:0 0 12px 0;'/>"
        }),

        detailRow("Company Code", payment.companyCode),
        detailRow("Debtor Account", payment.debtorAccount),
        detailRow("Creditor Account", payment.creditorAccount),
        detailRow("Payment Method", payment.paymentMethod),
        detailRow("Payment Date", payment.paymentDate),
        detailRow("Created By", payment.createdByUserName),
        detailRow("Status", this.formatStatusLabel(payment.status))

    ];


    // -------------------------------------------------
    // REJECTION REASON (only if rejected)
    // -------------------------------------------------

    if (
        payment.status === "REJECTED" &&
        payment.rejectionReason
    ) {

        bodyItems.push(

            new sap.m.MessageStrip({

                text: payment.rejectionReason,

                type: "Error",

                showIcon: true,

                class: "sapUiSmallMarginTop"

            })

        );

    }


    // -------------------------------------------------
    // DIALOG
    // -------------------------------------------------

    const dialog =
        new sap.m.Dialog({

            title: "Payment Details",

            contentWidth: "420px",

            content: [

                new sap.m.VBox({

                    class: "sapUiMediumMargin",

                    items: bodyItems

                })

            ],

            endButton:

                new sap.m.Button({

                    text: "Close",

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
    paymentReference: newReference,

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
        payment.paymentDate,

    performedBy:
        sessionStorage.getItem("username")
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

        this._loadSummaryCounts();


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

formatPaymentStatusState: function (status) {

    switch (status) {

        case "APPROVED":
            return "Success";

        case "PENDING_APPROVAL":
            return "Warning";

        case "REJECTED":
            return "Error";

        default:
            return "None";
    }
},

onBulkUpload: function () {

    const fileInput =
        document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = ".csv";

    fileInput.style.display = "none";

    document.body.appendChild(fileInput);

    fileInput.addEventListener(
        "change",
        async function (event) {

            const file =
                event.target.files[0];

            if (!file) {
                document.body.removeChild(fileInput);
                return;
            }

            if (
                !file.name
                    .toLowerCase()
                    .endsWith(".csv")
            ) {

                MessageBox.error(
                    "Please select a CSV file."
                );

                document.body.removeChild(fileInput);
                return;
            }

            try {

                const csvData =
                    await file.text();

                this._showBulkUploadPreview(
                    csvData,
                    file.name
                );

            } catch (error) {

                console.error(
                    "CSV read error:",
                    error
                );

                MessageBox.error(
                    "Unable to read the CSV file."
                );

            } finally {

                document.body.removeChild(
                    fileInput
                );
            }

        }.bind(this)
    );

    fileInput.click();
},

_showBulkUploadPreview: function (
    csvData,
    fileName
) {

    const lines =
        csvData
            .trim()
            .split(/\r?\n/)
            .filter(line => line.trim());

    if (lines.length < 2) {

        MessageBox.error(
            "The CSV file does not contain any payments."
        );

        return;
    }

    const previewText =
        lines
            .slice(0, 6)
            .join("\n");

    const moreRows =
        lines.length > 6
            ? "\n..."
            : "";

    const textArea =
        new TextArea({

            value:
                previewText +
                moreRows,

            editable: false,

            width: "100%",

            height: "250px"

        });


    const dialog =
        new Dialog({

            title:
                "Bulk Payment Upload",

            contentWidth:
                "700px",

            content: [

                new VBox({

                    class:
                        "sapUiMediumMargin",

                    items: [

                        new Label({
                            text:
                                "Selected File"
                        }),

                        new TextArea({

                            value:
                                fileName,

                            editable:
                                false,

                            width:
                                "100%",

                            height:
                                "50px"

                        }),

                        new Label({

                            text:
                                "Payment Preview"

                        }),

                        textArea,

                        new Label({

                            text:
                                (lines.length - 1) +
                                " payment(s) detected."

                        })

                    ]

                })

            ],

            beginButton:

                new Button({

                    text:
                        "Upload Payments",

                    type:
                        "Emphasized",

                    press:
                        function () {

                            this._uploadBulkPayments(
                                csvData,
                                dialog
                            );

                        }.bind(this)

                }),

            endButton:

                new Button({

                    text:
                        "Cancel",

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

_uploadBulkPayments: async function (
    csvData,
    dialog
) {

    try {

        console.log(
            "Uploading bulk payments..."
        );


        const response =
            await fetch(
                "/payment-service/bulkUploadPayments",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            csvData:
                                csvData

                        })

                }
            );


        const result =
            await response.json();


        console.log(
            "Bulk upload response:",
            result
        );


        if (!response.ok) {

            MessageBox.error(

                result?.error?.message ||
                result?.message ||
                "Bulk upload failed."

            );

            return;
        }


        dialog.close();


        // =========================================
        // SUCCESS
        // =========================================

        if (result.success) {

            let message =
                result.message;


            if (result.errors) {

                message +=
                    "\n\nErrors:\n" +
                    result.errors;

            }


            MessageBox.success(
                message,
                {
                    title:
                        "Bulk Upload Completed"
                }
            );


            // Refresh Payments table

            await this._loadPayments(
                this._currentStatus ||
                "ALL"
            );

            this._loadSummaryCounts();

        } else {

            MessageBox.warning(

                result.message ||
                "No payments were uploaded."

            );

        }

    } catch (error) {

        console.error(
            "Bulk upload error:",
            error
        );

        MessageBox.error(
            "Unable to connect to payment service."
        );
    }
},

// =========================================================
// EXPORT PAYMENTS
// =========================================================

onExportPayments: function () {

    const oTable =
        this.byId("paymentsTable");

    if (!oTable) {

        sap.m.MessageBox.error(
            "Payments table could not be found."
        );

        return;
    }


    const oBinding =
        oTable.getBinding("items");


    if (!oBinding) {

        sap.m.MessageBox.error(
            "Payment data is not available."
        );

        return;
    }


    const aContexts =
        oBinding.getContexts();


    if (!aContexts || aContexts.length === 0) {

        sap.m.MessageToast.show(
            "There are no payments to export."
        );

        return;
    }


    const aPayments =
        aContexts.map(function (oContext) {

            return oContext.getObject();

        });


    // ---------------------------------------------------------
    // CSV HEADER
    // ---------------------------------------------------------

    const aRows = [];

    aRows.push([

        "Payment Reference",
        "Company Code",
        "Debtor Account",
        "Creditor Account",
        "Amount",
        "Currency",
        "Payment Method",
        "Payment Date",
        "Status"

    ]);


    // ---------------------------------------------------------
    // PAYMENT DATA
    // ---------------------------------------------------------

    aPayments.forEach(function (payment) {

        aRows.push([

            payment.paymentReference || "",

            payment.companyCode || "",

            payment.debtorAccount || "",

            payment.creditorAccount || "",

            payment.amount !== undefined &&
            payment.amount !== null
                ? payment.amount
                : "",

            payment.currency || "",

            payment.paymentMethod || "",

            payment.paymentDate || "",

            payment.status || ""

        ]);

    });


    // ---------------------------------------------------------
    // CONVERT TO CSV
    // ---------------------------------------------------------

    const sCsv =
        aRows.map(function (row) {

            return row.map(function (value) {

                const sValue =
                    String(value);

                return '"' +
                    sValue
                        .replace(/"/g, '""') +
                    '"';

            }).join(",");

        }).join("\r\n");


    // ---------------------------------------------------------
    // CREATE DOWNLOAD
    // ---------------------------------------------------------

    const oBlob =
        new Blob(
            [sCsv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const sUrl =
        URL.createObjectURL(oBlob);


    const oLink =
        document.createElement("a");


    const oNow =
        new Date();


    const sDate =
        oNow
            .toISOString()
            .slice(0, 10);


    oLink.href =
        sUrl;


    oLink.download =
        "payments_" +
        sDate +
        ".csv";


    document.body.appendChild(
        oLink
    );


    oLink.click();


    document.body.removeChild(
        oLink
    );


    URL.revokeObjectURL(
        sUrl
    );


    sap.m.MessageToast.show(
        aPayments.length +
        " payment(s) exported successfully."
    );
},

// =====================================================
// STATUS LABEL FORMATTER
// Converts PENDING_APPROVAL -> "Pending Approval"
// =====================================================

formatStatusLabel: function (status) {

    if (!status) {
        return "";
    }

    return String(status)
        .toLowerCase()
        .split("_")
        .map(function (word) {

            return (
                word.charAt(0).toUpperCase() +
                word.slice(1)
            );

        })
        .join(" ");

},

// =====================================================
// LOAD SUMMARY COUNTS
// Always loads the FULL unfiltered payment list so the
// summary cards stay accurate even when the table itself
// is filtered by status (e.g. via Dashboard KPI links).
// =====================================================

_loadSummaryCounts: async function () {

    try {

        const response =
            await fetch(
                "/payment-service/Payments",
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
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

        const total =
            payments.length;

        const pending =
            payments.filter(
                function (p) {
                    return p.status === "PENDING_APPROVAL";
                }
            ).length;

        const approved =
            payments.filter(
                function (p) {
                    return p.status === "APPROVED";
                }
            ).length;

        const rejected =
            payments.filter(
                function (p) {
                    return p.status === "REJECTED";
                }
            ).length;

        this.byId("summaryTotal")
            .setText(String(total));

        this.byId("summaryPending")
            .setText(String(pending));

        this.byId("summaryApproved")
            .setText(String(approved));

        this.byId("summaryRejected")
            .setText(String(rejected));

    } catch (error) {

        console.error(
            "Unable to load payment summary counts:",
            error
        );

    }

},

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

    // NEW: keep summary cards in sync
    this._loadSummaryCounts();

},

// controller
formatStatusPillClass: function (status) {

    if (status === "APPROVED") {
        return "statusPill statusPillApproved";
    }

    if (status === "REJECTED") {
        return "statusPill statusPillRejected";
    }

    return "statusPill statusPillPending";

},

    });

});