sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Popover",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Title",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/MessageToast",
    "sap/ui/core/Icon"
], function (
    Controller,
    JSONModel,
    Popover,
    VBox,
    HBox,
    Text,
    Button,
    Title,
    List,
    StandardListItem,
    MessageToast,
    Icon
) {

    "use strict";


    return Controller.extend(
        "paymentsapp.controller.App",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                const appViewModel =
                    new JSONModel({

                        sideExpanded: true,

                        currentRoute: "",

                        isAdmin:
                            this._getNormalizedRole() === "ADMIN",

                        pendingApprovalCount: 0,

                        unreadMessageCount: 0,

                        mailCount: 0

                    });


                this.getView().setModel(
                    appViewModel,
                    "appView"
                );


                this.getOwnerComponent()
                    .getRouter()
                    .attachRouteMatched(
                        this._onRouteMatched,
                        this
                    );


                // Initial notification loading

                this._loadNotifications();


                // Refresh every 30 seconds

                this._notificationInterval =
                    setInterval(
                        function () {

                            this._loadNotifications();

                        }.bind(this),
                        30000
                    );
            },


            // =====================================================
            // CLEANUP
            // =====================================================

            onExit: function () {

                if (
                    this._notificationInterval
                ) {

                    clearInterval(
                        this._notificationInterval
                    );

                }


                if (
                    this._approvalPopover
                ) {

                    this._approvalPopover.destroy();

                }


                if (this._messagePopover) {

                    this._messagePopover.destroy();

                }

                if (this._messageDialog) {

                    this._messageDialog.destroy();

                }

                if (this._mailDialog) {

                    this._mailDialog.destroy();

                }
            },


            // =====================================================
            // ROLE
            // =====================================================

            _getNormalizedRole: function () {

                const sRawRole =
                    sessionStorage.getItem(
                        "userRole"
                    );


                return sRawRole

                    ? String(sRawRole)
                        .trim()
                        .toUpperCase()
                        .replace(
                            /[\s-]+/g,
                            "_"
                        )

                    : "";
            },


            _getCurrentUser: function () {

                return (
                    sessionStorage.getItem(
                        "username"
                    ) || ""
                );

            },


            // =====================================================
            // ROUTE
            // =====================================================

            _onRouteMatched: function (
                oEvent
            ) {

                const sRouteName =
                    oEvent.getParameter(
                        "name"
                    );


                const oModel =
                    this.getView()
                        .getModel(
                            "appView"
                        );


                oModel.setProperty(
                    "/currentRoute",
                    sRouteName
                );


                const bAdmin =
                    this._getNormalizedRole()
                    === "ADMIN";


                oModel.setProperty(
                    "/isAdmin",
                    bAdmin
                );


                this._loadNotifications();
            },


            // =====================================================
            // LOAD BOTH NOTIFICATIONS
            // =====================================================

            _loadNotifications: async function () {

                const sRole =
                    this._getNormalizedRole();

                console.log(
                    "Loading notifications for:",
                    sRole
                );

                // -------------------------------------------------
                // APPROVALS - ADMIN ONLY
                // -------------------------------------------------

                if (sRole === "ADMIN") {

                    await this._loadPendingApprovals();
                    this._loadUnreadMessages();

                    this._loadMailCount();

                } else {

                    this._setApprovalCount(0);
                }

                // -------------------------------------------------
                // DO NOT LOAD MESSAGES/MAIL HERE FOR NOW
                // -------------------------------------------------

            },


            // =====================================================
            // PENDING APPROVAL COUNT
            // =====================================================

            _loadPendingApprovals: async function () {

                try {

                    const response = await fetch(
                        "/payment-service/Payments?" +
                        "$filter=status%20eq%20'PENDING_APPROVAL'",
                        {
                            method: "GET",
                            headers: {
                                "Accept": "application/json"
                            }
                        }
                    );

                    if (!response.ok) {

                        console.error(
                            "Pending approvals HTTP error:",
                            response.status
                        );

                        this._setApprovalCount(0);

                        return;
                    }

                    const data =
                        await response.json();

                    const payments =
                        data.value || [];

                    const count =
                        payments.length;

                    console.log(
                        "PENDING APPROVAL COUNT:",
                        count
                    );

                    this._setApprovalCount(count);

                } catch (error) {

                    console.error(
                        "Unable to load pending approvals:",
                        error
                    );

                    this._setApprovalCount(0);
                }
            },

            // =====================================================
            // UNREAD MESSAGE COUNT
            // =====================================================

            _loadUnreadMessages: async function () {

    try {

        const aMessages =
            await this._getUnreadMessages();

        console.log(
            "UNREAD MESSAGE COUNT:",
            aMessages.length
        );

        this._setMessageCount(
            aMessages.length
        );

    } catch (error) {

        console.error(
            "Unread message count error:",
            error
        );

        this._setMessageCount(0);

    }

},

            // =====================================================
            // MESSAGE BADGE
            // =====================================================

            _setMessageCount: function (
                iCount
            ) {

                const oModel =
                    this.getView()
                        .getModel(
                            "appView"
                        );


                oModel.setProperty(
                    "/unreadMessageCount",
                    iCount
                );


                const oBadge =
                    this.byId(
                        "messageNotificationCount"
                    );


                if (!oBadge) {
                    return;
                }


                if (iCount > 0) {

                    oBadge.setText(
                        iCount > 99
                            ? "99+"
                            : String(iCount)
                    );


                    oBadge.setVisible(
                        true
                    );

                } else {

                    oBadge.setVisible(
                        false
                    );

                }
            },


            // =====================================================
            // APPROVAL BELL
            // =====================================================

            onApprovalNotificationsPress: async function () {

    try {

        // -------------------------------------------------
        // Get all pending payments
        // -------------------------------------------------

        const response = await fetch(
            "/payment-service/Payments?" +
            "$filter=status%20eq%20'PENDING_APPROVAL'" +
            "&$orderby=createdAt%20desc",
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

        const data =
            await response.json();

        const aPayments =
            data.value || [];

        console.log(
            "APPROVAL BELL PAYMENTS:",
            aPayments
        );


        // -------------------------------------------------
        // Close existing popover
        // -------------------------------------------------

        if (
            this._approvalPopover &&
            this._approvalPopover.isOpen()
        ) {

            this._approvalPopover.close();

            return;
        }


        // -------------------------------------------------
        // Title
        // -------------------------------------------------

        const oTitle =
            new Title({
                text:
                    "Pending Approvals (" +
                    aPayments.length +
                    ")",
                level: "H4"
            });

        oTitle.addStyleClass(
            "notificationPopoverTitle"
        );


        // -------------------------------------------------
        // Empty state
        // -------------------------------------------------

        if (aPayments.length === 0) {

            const oEmpty =
                new VBox({

                    alignItems: "Center",

                    justifyContent: "Center",

                    items: [

                        new Icon({
                            src:
                                "sap-icon://accept",
                            size:
                                "2rem"
                        }),

                        new Text({
                            text:
                                "No payments are waiting for approval.",
                            textAlign:
                                "Center"
                        })

                    ]
                });

            oEmpty.addStyleClass(
                "emptyMessageDialog"
            );


            const oContent =
                new VBox({

                    items: [
                        oTitle,
                        oEmpty
                    ]

                });

            oContent.addStyleClass(
                "notificationPopoverContent"
            );


            if (this._approvalPopover) {
                this._approvalPopover.destroy();
            }


            this._approvalPopover =
                new Popover({

                    showHeader: false,

                    placement: "Bottom",

                    contentWidth: "380px",

                    content: [
                        oContent
                    ]

                });


            this._approvalPopover.openBy(
                this.byId(
                    "approvalNotificationButton"
                )
            );

            return;
        }


        // -------------------------------------------------
        // Payment list
        // -------------------------------------------------

        const oList =
            new List({
                showSeparators: "Inner"
            });


        aPayments.forEach(
            function (oPayment) {

                const sAmount =
                    oPayment.amount !== undefined &&
                    oPayment.amount !== null
                        ? Number(
                            oPayment.amount
                        ).toLocaleString(
                            "en-IN",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        )
                        : "-";


                const oReference =
                    new Title({

                        text:
                            oPayment.paymentReference ||
                            "Payment",

                        level: "H5"

                    });


                const oDetails =
                    new Text({

                        text:
                            "Company: " +
                            (oPayment.companyCode || "-") +
                            "\nAmount: " +
                            sAmount +
                            " " +
                            (oPayment.currency || "") +
                            "\nCreated by: " +
                            (oPayment.createdByUserName || "-"),

                        wrapping: true

                    });


                const oViewButton =
                    new Button({

                        text:
                            "View Approval",

                        icon:
                            "sap-icon://task",

                        type:
                            "Emphasized",

                        press:
                            function () {

                                if (
                                    this._approvalPopover
                                ) {

                                    this._approvalPopover.close();

                                }


                                this.getOwnerComponent()
                                    .getRouter()
                                    .navTo(
                                        "ApprovalInbox"
                                    );

                            }.bind(this)

                    });


                const oBox =
                    new VBox({

                        items: [

                            oReference,

                            oDetails,

                            oViewButton

                        ]

                    });


                oBox.addStyleClass(
                    "approvalNotificationItem"
                );


                oList.addItem(

                    new sap.m.CustomListItem({

                        content: [
                            oBox
                        ]

                    })

                );

            }.bind(this)
        );


        // -------------------------------------------------
        // Content
        // -------------------------------------------------

        const oContent =
            new VBox({

                items: [

                    oTitle,

                    oList

                ]

            });


        oContent.addStyleClass(
            "notificationPopoverContent"
        );


        // -------------------------------------------------
        // Create popover
        // -------------------------------------------------

        if (this._approvalPopover) {

            this._approvalPopover.destroy();

        }


        this._approvalPopover =
            new Popover({

                showHeader: false,

                placement: "Bottom",

                contentWidth: "400px",

                contentHeight: "500px",

                verticalScrolling: true,

                content: [
                    oContent
                ]

            });


        // -------------------------------------------------
        // Open
        // -------------------------------------------------

        this._approvalPopover.openBy(
            this.byId(
                "approvalNotificationButton"
            )
        );

    } catch (error) {

        console.error(
            "Unable to load pending approvals:",
            error
        );

        MessageToast.show(
            "Unable to load pending approvals."
        );

    }

},

            // =====================================================
            // MESSAGES
            // Short system notifications
            // Opening the popup automatically marks them as read
            // =====================================================

            onMessageNotificationsPress: async function () {

    try {

        const aMessages =
            await this._getUnreadMessages();

        console.log(
            "OPENING MESSAGES:",
            aMessages
        );


        // ============================================
        // CREATE POPUP
        // ============================================

        if (
            this._messagePopover &&
            this._messagePopover.isOpen()
        ) {

            this._messagePopover.close();

            return;
        }


        const oList =
            new List({
                showSeparators: "Inner"
            });


        // ============================================
        // NO MESSAGES
        // ============================================

        if (aMessages.length === 0) {

            oList.addItem(

                new sap.m.CustomListItem({

                    content: [

                        new Text({
                            text:
                                "No new messages."
                        })

                    ]

                })

            );

        } else {


            // ==========================================
            // ONE LINE PER MESSAGE
            // ==========================================

            aMessages.forEach(
                function (oMessage) {

                    const sMessage =
                        oMessage.subject ||
                        oMessage.message ||
                        "New message";


                    const oText =
                        new Text({

                            text:
                                sMessage,

                            wrapping:
                                false,

                            maxLines:
                                1

                        });


                    oText.addStyleClass(
                        "simpleMessageText"
                    );


                    oList.addItem(

                        new sap.m.CustomListItem({

                            content: [

                                new HBox({

                                    alignItems:
                                        "Center",

                                    items: [

                                        new Icon({

                                            src:
                                                "sap-icon://message-information",

                                            size:
                                                "1rem"

                                        }),

                                        oText

                                    ]

                                })

                            ]

                        })

                    );

                }.bind(this)
            );
        }


        // ============================================
        // POPUP CONTENT
        // ============================================

        const oContent =
            new VBox({

                items: [

                    new Title({

                        text:
                            "Messages",

                        level:
                            "H4"

                    }),

                    oList

                ]

            });


        oContent.addStyleClass(
            "messagePopoverContent"
        );


        // ============================================
        // CREATE POPOVER
        // ============================================

        if (this._messagePopover) {

            this._messagePopover.destroy();

        }


        this._messagePopover =
            new Popover({

                showHeader:
                    false,

                placement:
                    "Bottom",

                contentWidth:
                    "400px",

                contentHeight:
                    "350px",

                verticalScrolling:
                    true,

                content: [

                    oContent

                ]

            });


        // ============================================
        // OPEN
        // ============================================

        this._messagePopover.openBy(

            this.byId(
                "messageNotificationButton"
            )

        );


        // ============================================
        // AUTOMATICALLY MARK AS READ
        // ============================================

        for (
            const oMessage of aMessages
        ) {

            if (
                oMessage.ID &&
                oMessage.isRead === false
            ) {

                try {

                    await fetch(

                        "/payment-service/Messages(" +
                        oMessage.ID +
                        ")",

                        {

                            method:
                                "PATCH",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    isRead:
                                        true

                                })

                        }

                    );

                } catch (error) {

                    console.error(
                        "Unable to mark message read:",
                        error
                    );

                }

            }

        }


        // ============================================
        // CLEAR BADGE
        // ============================================

        this._setMessageCount(0);

    } catch (error) {

        console.error(
            "Unable to open messages:",
            error
        );

        MessageToast.show(
            "Unable to load messages."
        );

    }

},
            // =====================================================
            // GET UNREAD MESSAGES
            // =====================================================

           _getUnreadMessages: async function () {

    const sUserName =
        this._getCurrentUser();

    console.log(
        "MESSAGE USER:",
        sUserName
    );

    if (!sUserName) {
        return [];
    }

    try {

        const sFilter =
            "receiverUserName eq '" +
            String(sUserName).replace(
                /'/g,
                "''"
            ) +
            "' and isRead eq false";

        const sUrl =
            "/payment-service/Messages?" +
            "$filter=" +
            encodeURIComponent(sFilter);

        console.log(
            "MESSAGE URL:",
            sUrl
        );

        const response =
            await fetch(
                sUrl,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        console.log(
            "MESSAGE HTTP STATUS:",
            response.status
        );

        if (!response.ok) {

            const sError =
                await response.text();

            console.error(
                "MESSAGE API ERROR:",
                sError
            );

            return [];
        }

        const oData =
            await response.json();

        console.log(
            "MESSAGES:",
            oData
        );

        return oData.value || [];

    } catch (error) {

        console.error(
            "MESSAGE LOAD ERROR:",
            error
        );

        return [];
    }
},
            // =====================================================
            // MARK MESSAGE AS READ
            // =====================================================

            _markMessageAsRead: async function (
                sMessageId
            ) {

                try {

                    const response =
                        await fetch(
                            "/payment-service/Messages(" +
                            sMessageId +
                            ")",
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        isRead: true
                                    })
                            }
                        );

                    if (!response.ok) {

                        const errorText =
                            await response.text();

                        console.error(
                            "Mark read error:",
                            response.status,
                            errorText
                        );

                        throw new Error(
                            "HTTP " +
                            response.status
                        );
                    }

                    sap.m.MessageToast.show(
                        "Message marked as read"
                    );

                    await this._loadUnreadMessages();

                    const aMessages =
                        await this._getUnreadMessages();

                    this._setMessageCount(
                        aMessages.length
                    );

                    if (this._messageDialog) {
                        this._messageDialog.close();
                    }

                    if (aMessages.length > 0) {
                        await this.onMessageNotificationsPress();
                    }

                } catch (error) {

                    console.error(
                        "Unable to mark message as read:",
                        error
                    );

                    sap.m.MessageToast.show(
                        "Unable to mark message as read."
                    );
                }
            },

            // =====================================================
            // SIDEBAR
            // =====================================================

            onToggleSideNav: function () {

                const oModel =
                    this.getView()
                        .getModel(
                            "appView"
                        );


                oModel.setProperty(
                    "/sideExpanded",

                    !oModel.getProperty(
                        "/sideExpanded"
                    )

                );
            },


            // =====================================================
            // NAVIGATION
            // =====================================================

            onDashboard: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Dashboard"
                    );
            },


            onViewPayments: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Payments"
                    );
            },


            onApprovalInbox: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "ApprovalInbox"
                    );
            },


            onUserManagement: function () {

                if (
                    this._getNormalizedRole()
                    !== "ADMIN"
                ) {

                    return;
                }


                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "UserManagement"
                    );
            },


            onUserLogs: function () {

                if (
                    this._getNormalizedRole()
                    !== "ADMIN"
                ) {

                    return;
                }


                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "UserLogs"
                    );
            },


            // =====================================================
            // LOGOUT
            // =====================================================

            onLogout: function () {

                console.log(
                    "LOGOUT CLICKED"
                );


                if (
                    this._notificationInterval
                ) {

                    clearInterval(
                        this._notificationInterval
                    );

                }


                sessionStorage.clear();

                localStorage.removeItem(
                    "username"
                );

                localStorage.removeItem(
                    "fullName"
                );

                localStorage.removeItem(
                    "userRole"
                );


                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Login",
                        {},
                        true
                    );
            },

            _formatMessageDate: function (sDate) {

                if (!sDate) {
                    return "";
                }

                const oDate = new Date(sDate);

                if (isNaN(oDate.getTime())) {
                    return "";
                }

                return oDate.toLocaleString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );
            },

            // =====================================================
            // MAIL COUNT
            // =====================================================

           _loadMailCount: async function () {

    const sUserName =
        this._getCurrentUser();

    console.log(
        "MAIL COUNT USER:",
        sUserName
    );

    if (!sUserName) {

        this._setMailCount(0);

        return;
    }

    try {

        // Escape single quotes for OData
        const sSafeUserName =
            String(sUserName).replace(
                /'/g,
                "''"
            );


        const sFilter =
            "receiverUserName eq '" +
            sSafeUserName +
            "' and isRead eq false";


        const sUrl =
            "/payment-service/Messages" +
            "?$filter=" +
            encodeURIComponent(
                sFilter
            );


        console.log(
            "MAIL COUNT REQUEST:",
            sUrl
        );


        const response =
            await fetch(
                sUrl,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        console.log(
            "MAIL COUNT STATUS:",
            response.status
        );


        if (!response.ok) {

            const sError =
                await response.text();

            console.error(
                "MAIL COUNT API ERROR:",
                sError
            );

            this._setMailCount(0);

            return;
        }


        const oData =
            await response.json();


        const aMessages =
            oData.value || [];


        console.log(
            "UNREAD MAIL COUNT:",
            aMessages.length
        );


        this._setMailCount(
            aMessages.length
        );

    } catch (error) {

        console.error(
            "Failed to load mail count:",
            error
        );

        this._setMailCount(0);
    }
},
            // =====================================================
            // MAIL BADGE
            // =====================================================

            _setMailCount: function (iCount) {

                const oModel =
                    this.getView()
                        .getModel("appView");


                oModel.setProperty(
                    "/mailCount",
                    iCount
                );


                const oBadge =
                    this.byId(
                        "mailNotificationCount"
                    );


                if (!oBadge) {
                    return;
                }


                if (iCount > 0) {

                    oBadge.setText(
                        iCount > 99
                            ? "99+"
                            : String(iCount)
                    );


                    oBadge.setVisible(true);

                } else {

                    oBadge.setVisible(false);

                }

            },

            onMailPress: function () {

    this.getOwnerComponent()
        .getRouter()
        .navTo("Mail");

},

            // =====================================================
            // MARK MAIL AS READ
            // =====================================================

            _markMailAsRead: async function (
                sMessageId
            ) {

                try {

                    const response =
                        await fetch(

                            "/payment-service/Messages(" +
                            sMessageId +
                            ")",

                            {

                                method:
                                    "PATCH",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        isRead:
                                            true

                                    })

                            }

                        );


                    if (!response.ok) {

                        throw new Error(
                            "HTTP " +
                            response.status
                        );

                    }


                    MessageToast.show(
                        "Mail marked as read."
                    );


                    await this._loadNotifications();


                    if (this._mailDialog) {

                        this._mailDialog.close();

                    }


                    // Reopen with updated mailbox

                    this.onMailPress();


                } catch (error) {

                    console.error(
                        "Unable to mark mail as read:",
                        error
                    );


                    MessageToast.show(
                        "Unable to update mail."
                    );

                }

            },

            // =====================================================
            // OPEN PAYMENT FROM MAIL
            // =====================================================

            _openPaymentFromMail: async function (
                sPaymentId,
                oMail
            ) {

                try {

                    if (!sPaymentId) {

                        sap.m.MessageToast.show(
                            "No payment is linked to this message."
                        );

                        return;
                    }


                    // =============================================
                    // GET EXACT PAYMENT
                    // =============================================

                    const response =
                        await fetch(
                            "/payment-service/Payments(" +
                            sPaymentId +
                            ")",

                            {
                                method: "GET",

                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "HTTP " +
                            response.status
                        );

                    }


                    const oPayment =
                        await response.json();


                    // =============================================
                    // CREATE PAYMENT DIALOG
                    // =============================================

                    if (!this._paymentMailDialog) {

                        this._paymentMailDialog =
                            new sap.m.Dialog({

                                title:
                                    "Payment Details",

                                contentWidth:
                                    "650px",

                                contentHeight:
                                    "600px",

                                stretchOnPhone:
                                    true,

                                verticalScrolling:
                                    true

                            });


                        this.getView()
                            .addDependent(
                                this._paymentMailDialog
                            );

                    }


                    this._paymentMailDialog
                        .removeAllContent();


                    // =============================================
                    // PAYMENT DETAILS
                    // =============================================

                    const oForm =
                        new sap.ui.layout.form.SimpleForm({

                            editable: false,

                            layout:
                                "ResponsiveGridLayout",

                            content: [

                                new sap.m.Label({
                                    text:
                                        "Payment Reference"
                                }),

                                new sap.m.Text({
                                    text:
                                        oPayment.paymentReference
                                }),


                                new sap.m.Label({
                                    text:
                                        "Company Code"
                                }),

                                new sap.m.Text({
                                    text:
                                        oPayment.companyCode
                                }),


                                new sap.m.Label({
                                    text:
                                        "Debtor Account"
                                }),

                                new sap.m.Text({
                                    text:
                                        oPayment.debtorAccount || "-"
                                }),


                                new sap.m.Label({
                                    text:
                                        "Creditor Account"
                                }),

                                new sap.m.Text({
                                    text:
                                        oPayment.creditorAccount || "-"
                                }),


                                new sap.m.Label({
                                    text:
                                        "Amount"
                                }),

                                new sap.m.Text({
                                    text:
                                        (
                                            oPayment.amount ??
                                            "0"
                                        ) +
                                        " " +
                                        (
                                            oPayment.currency ||
                                            ""
                                        )
                                }),


                                new sap.m.Label({
                                    text:
                                        "Payment Method"
                                }),

                                new sap.m.Text({
                                    text:
                                        oPayment.paymentMethod || "-"
                                }),


                                new sap.m.Label({
                                    text:
                                        "Payment Date"
                                }),

                                new sap.m.Text({
                                    text:
                                        oPayment.paymentDate || "-"
                                }),


                                new sap.m.Label({
                                    text:
                                        "Status"
                                }),

                                new sap.m.ObjectStatus({

                                    text:
                                        oPayment.status,

                                    state:
                                        oPayment.status ===
                                            "PENDING_APPROVAL"
                                            ? "Warning"
                                            : oPayment.status ===
                                                "APPROVED"
                                                ? "Success"
                                                : "Error"

                                })

                            ]

                        });


                    this._paymentMailDialog
                        .addContent(
                            oForm
                        );


                    // =============================================
                    // BUTTONS
                    // =============================================

                    this._paymentMailDialog
                        .removeAllButtons();


                    const oCloseButton =
                        new sap.m.Button({

                            text:
                                "Close",

                            type:
                                "Transparent",

                            press:
                                function () {

                                    this._paymentMailDialog
                                        .close();

                                }.bind(this)

                        });


                    this._paymentMailDialog
                        .addButton(
                            oCloseButton
                        );


                    // =============================================
                    // ADMIN APPROVAL BUTTONS
                    // =============================================

                    if (
                        this._getNormalizedRole() === "ADMIN" &&
                        oPayment.status === "PENDING_APPROVAL"
                    ) {


                        const oRejectButton =
                            new sap.m.Button({

                                text:
                                    "Reject",

                                type:
                                    "Reject",

                                press:
                                    function () {

                                        this._rejectPaymentFromMail(
                                            oPayment
                                        );

                                    }.bind(this)

                            });


                        const oApproveButton =
                            new sap.m.Button({

                                text:
                                    "Approve",

                                type:
                                    "Accept",

                                press:
                                    function () {

                                        this._approvePaymentFromMail(
                                            oPayment
                                        );

                                    }.bind(this)

                            });


                        this._paymentMailDialog
                            .addButton(
                                oRejectButton
                            );


                        this._paymentMailDialog
                            .addButton(
                                oApproveButton
                            );

                    }


                    // =============================================
                    // OPEN
                    // =============================================

                    this._paymentMailDialog.open();


                    // =============================================
                    // MARK ORIGINAL MESSAGE AS READ
                    // =============================================

                    if (
                        oMail &&
                        oMail.ID &&
                        oMail.isRead === false
                    ) {

                        await fetch(

                            "/payment-service/Messages(" +
                            oMail.ID +
                            ")",

                            {

                                method:
                                    "PATCH",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({

                                        isRead:
                                            true

                                    })

                            }

                        );


                        await this._loadNotifications();

                    }


                } catch (error) {

                    console.error(
                        "Unable to open payment from mail:",
                        error
                    );


                    sap.m.MessageBox.error(
                        "Unable to load payment details."
                    );

                }

            },

            // =====================================================
            // APPROVE PAYMENT FROM MAIL
            // =====================================================

            _approvePaymentFromMail: async function (
                oPayment
            ) {

                try {

                    const sPerformedBy =
                        this._getCurrentUser();


                    const response =
                        await fetch(
                            "/payment-service/approvePayment",
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

                                        paymentId:
                                            oPayment.ID,

                                        performedBy:
                                            sPerformedBy

                                    })

                            }
                        );


                    const oResult =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            oResult.message ||
                            "Approval failed"
                        );

                    }


                    if (!oResult.success) {

                        sap.m.MessageBox.error(
                            oResult.message ||
                            "Unable to approve payment."
                        );

                        return;
                    }


                    sap.m.MessageToast.show(
                        "Payment approved."
                    );


                    this._paymentMailDialog.close();


                    await this._loadNotifications();


                } catch (error) {

                    console.error(
                        "Approval from mail failed:",
                        error
                    );


                    sap.m.MessageBox.error(
                        "Unable to approve payment."
                    );

                }

            },

            // =====================================================
            // REJECT PAYMENT FROM MAIL
            // =====================================================

            _rejectPaymentFromMail: function (
                oPayment
            ) {

                const oInput =
                    new sap.m.TextArea({

                        width:
                            "100%",

                        rows:
                            4,

                        placeholder:
                            "Enter rejection reason..."

                    });


                const oDialog =
                    new sap.m.Dialog({

                        title:
                            "Reject Payment",

                        contentWidth:
                            "450px",

                        content: [

                            new sap.m.Label({

                                text:
                                    "Rejection Reason",

                                required:
                                    true

                            }),

                            oInput

                        ],

                        buttons: [

                            new sap.m.Button({

                                text:
                                    "Cancel",

                                type:
                                    "Transparent",

                                press:
                                    function () {

                                        oDialog.close();

                                    }

                            }),

                            new sap.m.Button({

                                text:
                                    "Reject",

                                type:
                                    "Reject",

                                press:
                                    async function () {

                                        const sReason =
                                            oInput
                                                .getValue()
                                                .trim();


                                        if (!sReason) {

                                            sap.m.MessageToast.show(
                                                "Please enter a rejection reason."
                                            );

                                            return;
                                        }


                                        try {

                                            const response =
                                                await fetch(
                                                    "/payment-service/rejectPayment",
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

                                                                paymentId:
                                                                    oPayment.ID,

                                                                reason:
                                                                    sReason,

                                                                performedBy:
                                                                    this._getCurrentUser()

                                                            })

                                                    }
                                                );


                                            const oResult =
                                                await response.json();


                                            if (!response.ok) {

                                                throw new Error(
                                                    oResult.message ||
                                                    "Rejection failed"
                                                );

                                            }


                                            if (!oResult.success) {

                                                sap.m.MessageBox.error(
                                                    oResult.message ||
                                                    "Unable to reject payment."
                                                );

                                                return;
                                            }


                                            oDialog.close();


                                            this._paymentMailDialog
                                                .close();


                                            sap.m.MessageToast.show(
                                                "Payment rejected."
                                            );


                                            await this._loadNotifications();


                                        } catch (error) {

                                            console.error(
                                                "Rejection from mail failed:",
                                                error
                                            );


                                            sap.m.MessageBox.error(
                                                "Unable to reject payment."
                                            );

                                        }

                                    }.bind(this)

                            })

                        ]

                    });


                this.getView()
                    .addDependent(
                        oDialog
                    );


                oDialog.open();

            },

            _setApprovalCount: function (iCount) {

                const oCount =
                    this.byId("approvalNotificationCount");

                if (!oCount) {
                    return;
                }

                oCount.setText(
                    String(iCount)
                );

                oCount.setVisible(
                    iCount > 0
                );
            },

        }
    );
});