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

                await Promise.all([

                    this._loadPendingApprovals(),

                    this._loadUnreadMessages(),

                    this._loadMailCount()

                ]);

            },


            // =====================================================
            // PENDING APPROVAL COUNT
            // =====================================================

            _loadPendingApprovals: async function () {

                const bAdmin =
                    this._getNormalizedRole()
                    === "ADMIN";


                if (!bAdmin) {

                    this._setApprovalCount(0);

                    return;
                }


                try {

                    const sUrl =
                        "/payment-service/Payments"
                        + "?$filter="
                        + encodeURIComponent(
                            "status eq 'PENDING_APPROVAL'"
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


                    if (!response.ok) {

                        throw new Error(
                            "HTTP "
                            + response.status
                        );

                    }


                    const oData =
                        await response.json();


                    const aPayments =
                        oData.value || [];


                    console.log(
                        "Pending approvals:",
                        aPayments.length
                    );


                    this._setApprovalCount(
                        aPayments.length
                    );


                } catch (error) {

                    console.error(
                        "Failed to load pending approvals:",
                        error
                    );

                    this._setApprovalCount(0);
                }
            },


            // =====================================================
            // UNREAD MESSAGE COUNT
            // =====================================================

            _loadUnreadMessages: async function () {

                const sUserName =
                    this._getCurrentUser();


                if (!sUserName) {

                    this._setMessageCount(0);

                    return;
                }


                try {

                    const sFilter =
                        "receiverUserName eq '"
                        + this._escapeODataValue(
                            sUserName
                        )
                        + "' and isRead eq false";


                    const sUrl =
                        "/payment-service/Messages"
                        + "?$filter="
                        + encodeURIComponent(
                            sFilter
                        )
                        + "&$orderby="
                        + encodeURIComponent(
                            "createdAt desc"
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


                    if (!response.ok) {

                        throw new Error(
                            "HTTP "
                            + response.status
                        );

                    }


                    const oData =
                        await response.json();


                    const aMessages =
                        oData.value || [];


                    console.log(
                        "Unread messages:",
                        aMessages.length
                    );


                    this._setMessageCount(
                        aMessages.length
                    );


                } catch (error) {

                    console.error(
                        "Failed to load unread messages:",
                        error
                    );

                    this._setMessageCount(0);
                }
            },


            // =====================================================
            // ODATA ESCAPE
            // =====================================================

            _escapeODataValue: function (
                sValue
            ) {

                return String(
                    sValue
                ).replace(
                    /'/g,
                    "''"
                );
            },


            // =====================================================
            // APPROVAL BADGE
            // =====================================================

            _setApprovalCount: function (
                iCount
            ) {

                const oModel =
                    this.getView()
                        .getModel(
                            "appView"
                        );


                oModel.setProperty(
                    "/pendingApprovalCount",
                    iCount
                );


                const oBadge =
                    this.byId(
                        "approvalNotificationCount"
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

            onApprovalNotificationsPress:
                async function () {

                    await this._loadPendingApprovals();


                    const oModel =
                        this.getView()
                            .getModel(
                                "appView"
                            );


                    const iCount =
                        oModel.getProperty(
                            "/pendingApprovalCount"
                        );


                    if (
                        this._approvalPopover
                        &&
                        this._approvalPopover.isOpen()
                    ) {

                        this._approvalPopover.close();

                        return;
                    }


                    const oTitle =
                        new Title({

                            text:
                                "Pending Approvals",

                            level:
                                "H4"

                        });


                    oTitle.addStyleClass(
                        "notificationPopoverTitle"
                    );


                    const oMessage =
                        new Text({

                            text:
                                iCount === 0

                                    ? "No payments are waiting for approval."

                                    : iCount === 1

                                        ? "1 payment is waiting for approval."

                                        : iCount
                                        + " payments are waiting for approval.",

                            wrapping:
                                true

                        });


                    oMessage.addStyleClass(
                        "notificationMessage"
                    );


                    const oIcon =
                        new Icon({

                            src:
                                iCount > 0

                                    ? "sap-icon://pending"

                                    : "sap-icon://accept",

                            size:
                                "1.5rem"

                        });


                    oIcon.addStyleClass(
                        "notificationIcon"
                    );


                    const oRow =
                        new HBox({

                            alignItems:
                                "Center",

                            items: [

                                oIcon,

                                oMessage

                            ]

                        });


                    oRow.addStyleClass(
                        "notificationMessageRow"
                    );


                    const oViewButton =
                        new Button({

                            text:
                                "View Approvals",

                            icon:
                                "sap-icon://task",

                            type:
                                "Emphasized",

                            visible:
                                iCount > 0,

                            press:
                                function () {

                                    this._approvalPopover.close();


                                    this.getOwnerComponent()
                                        .getRouter()
                                        .navTo(
                                            "ApprovalInbox"
                                        );

                                }.bind(this)

                        });


                    const oContent =
                        new VBox({

                            items: [

                                oTitle,

                                oRow,

                                oViewButton

                            ]

                        });


                    oContent.addStyleClass(
                        "notificationPopoverContent"
                    );


                    if (
                        this._approvalPopover
                    ) {

                        this._approvalPopover.destroy();

                    }


                    this._approvalPopover =
                        new Popover({

                            showHeader:
                                false,

                            placement:
                                "Bottom",

                            contentWidth:
                                "320px",

                            content: [
                                oContent
                            ]

                        });


                    this._approvalPopover.openBy(
                        this.byId(
                            "approvalNotificationButton"
                        )
                    );
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


        // =================================================
        // NO UNREAD MESSAGES
        // =================================================

        if (aMessages.length === 0) {

            if (!this._messageDialog) {

                this._messageDialog =
                    new sap.m.Dialog({

                        title: "Messages",

                        contentWidth: "500px",

                        stretchOnPhone: true,

                        buttons: [

                            new sap.m.Button({

                                text: "Close",

                                type: "Transparent",

                                press: function () {

                                    this._messageDialog.close();

                                }.bind(this)

                            })

                        ]

                    });

                this.getView()
                    .addDependent(
                        this._messageDialog
                    );

            }


            this._messageDialog.removeAllContent();


            const oEmpty =
                new sap.m.VBox({

                    alignItems: "Center",

                    justifyContent: "Center",

                    items: [

                        new sap.ui.core.Icon({

                            src:
                                "sap-icon://message-information",

                            size: "2.5rem"

                        }),

                        new sap.m.Text({

                            text:
                                "You have no unread messages.",

                            textAlign:
                                "Center"

                        })

                    ]

                });


            oEmpty.addStyleClass(
                "emptyMessageDialog"
            );


            this._messageDialog.addContent(
                oEmpty
            );


            this._messageDialog.open();

            return;
        }


        // =================================================
        // CREATE DIALOG
        // =================================================

        if (!this._messageDialog) {

            this._messageDialog =
                new sap.m.Dialog({

                    title: "Messages",

                    contentWidth: "550px",

                    contentHeight: "450px",

                    stretchOnPhone: true,

                    verticalScrolling: true,

                    buttons: [

                        new sap.m.Button({

                            text: "Close",

                            type: "Transparent",

                            press: function () {

                                this._messageDialog.close();

                            }.bind(this)

                        })

                    ]

                });


            this.getView()
                .addDependent(
                    this._messageDialog
                );

        }


        this._messageDialog.removeAllContent();


        // =================================================
        // MESSAGE LIST
        // =================================================

        const oList =
            new sap.m.List({

                showSeparators: "Inner"

            });


        aMessages.forEach(
            function (oMessage) {

                const oText =
                    new sap.m.Text({

                        text:
                            oMessage.subject ||
                            oMessage.message ||
                            "New message",

                        wrapping: true

                    });


                const oDate =
                    new sap.m.Text({

                        text:
                            this._formatMessageDate(
                                oMessage.createdAt
                            )

                    });


                const oBox =
                    new sap.m.VBox({

                        items: [

                            oText,

                            oDate

                        ]

                    });


                oBox.addStyleClass(
                    "simpleMessageItem"
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


        this._messageDialog.addContent(
            oList
        );


        // =================================================
        // OPEN POPUP
        // =================================================

        this._messageDialog.open();


        // =================================================
        // AUTOMATICALLY MARK ALL AS READ
        // =================================================

        for (
            const oMessage of aMessages
        ) {

            try {

                await fetch(

                    "/payment-service/Messages(" +
                    oMessage.ID +
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

            } catch (error) {

                console.error(
                    "Unable to mark message as read:",
                    oMessage.ID,
                    error
                );

            }

        }


        // =================================================
        // RESET MESSAGE BADGE
        // =================================================

        this._setMessageCount(0);


    } catch (error) {

        console.error(
            "Unable to load messages:",
            error
        );

        sap.m.MessageToast.show(
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

                if (!sUserName) {
                    return [];
                }


                const sFilter =
                    "receiverUserName eq '" +
                    this._escapeODataValue(sUserName) +
                    "' and isRead eq false";


                const sUrl =
                    "/payment-service/Messages" +
                    "?$filter=" +
                    encodeURIComponent(sFilter) +
                    "&$orderby=" +
                    encodeURIComponent("createdAt desc");


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


                if (!response.ok) {

                    throw new Error(
                        "HTTP " + response.status
                    );

                }


                const oData =
                    await response.json();


                return oData.value || [];

            },

            // =====================================================
            // MARK MESSAGE AS READ
            // =====================================================

            _markMessageAsRead: async function (sMessageId) {

                try {

                    const response = await fetch(
                        "/payment-service/Messages(" +
                        sMessageId +
                        ")",
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            },

                            body: JSON.stringify({
                                isRead: true
                            })
                        }
                    );


                    if (!response.ok) {

                        throw new Error(
                            "HTTP " + response.status
                        );

                    }


                    sap.m.MessageToast.show(
                        "Message marked as read"
                    );


                    // Refresh unread message count
                    await this._loadUnreadMessages();


                    // Close current dialog
                    if (this._messageDialog) {

                        this._messageDialog.close();

                    }


                    // Reload the remaining unread messages
                    const aMessages =
                        await this._getUnreadMessages();


                    this._setMessageCount(
                        aMessages.length
                    );


                    // Reopen popup if messages remain
                    if (aMessages.length > 0) {

                        this.onMessageNotificationsPress();

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

                if (!sUserName) {

                    this._setMailCount(0);

                    return;
                }


                try {

                    const sFilter =
                        "receiverUserName eq '" +
                        this._escapeODataValue(
                            sUserName
                        ) +
                        "' and isRead eq false";


                    const sUrl =
                        "/payment-service/Messages" +
                        "?$filter=" +
                        encodeURIComponent(
                            sFilter
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


                    if (!response.ok) {

                        throw new Error(
                            "HTTP " +
                            response.status
                        );

                    }


                    const oData =
                        await response.json();


                    const aMessages =
                        oData.value || [];


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

            // =====================================================
            // MAIL
            // =====================================================

            onMailPress: async function () {

                try {

                    const sUserName =
                        this._getCurrentUser();


                    if (!sUserName) {

                        MessageToast.show(
                            "Please login first."
                        );

                        return;
                    }


                    // =============================================
                    // LOAD ALL MAIL
                    // =============================================

                    const sFilter =
                        "receiverUserName eq '" +
                        this._escapeODataValue(
                            sUserName
                        ) +
                        "'";


                    const sUrl =
                        "/payment-service/Messages" +
                        "?$filter=" +
                        encodeURIComponent(
                            sFilter
                        ) +
                        "&$orderby=" +
                        encodeURIComponent(
                            "createdAt desc"
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


                    if (!response.ok) {

                        throw new Error(
                            "HTTP " +
                            response.status
                        );

                    }


                    const oData =
                        await response.json();


                    const aMessages =
                        oData.value || [];


                    // =============================================
                    // CREATE MAIL DIALOG
                    // =============================================

                    if (!this._mailDialog) {

                        this._mailDialog =
                            new sap.m.Dialog({

                                title: "Mail",

                                contentWidth:
                                    "700px",

                                contentHeight:
                                    "600px",

                                stretchOnPhone:
                                    true,

                                draggable:
                                    true,

                                resizable:
                                    true,

                                verticalScrolling:
                                    true,

                                buttons: [

                                    new Button({

                                        text:
                                            "Close",

                                        type:
                                            "Transparent",

                                        press:
                                            function () {

                                                this._mailDialog.close();

                                            }.bind(this)

                                    })

                                ]

                            });


                        this.getView()
                            .addDependent(
                                this._mailDialog
                            );

                    }


                    this._mailDialog
                        .removeAllContent();


                    // =============================================
                    // EMPTY MAILBOX
                    // =============================================

                    if (aMessages.length === 0) {

                        const oEmpty =
                            new VBox({

                                alignItems:
                                    "Center",

                                justifyContent:
                                    "Center",

                                items: [

                                    new Icon({

                                        src:
                                            "sap-icon://email-read",

                                        size:
                                            "3rem"

                                    }),

                                    new Text({

                                        text:
                                            "Your mailbox is empty.",

                                        textAlign:
                                            "Center"

                                    })

                                ]

                            });


                        oEmpty.addStyleClass(
                            "emptyMessageDialog"
                        );


                        this._mailDialog
                            .addContent(oEmpty);


                        this._mailDialog.open();

                        return;
                    }


                    // =============================================
                    // MAIL LIST
                    // =============================================

                    const oList =
                        new List({

                            showSeparators:
                                "Inner"

                        });


                    aMessages.forEach(
                        function (oMail) {

                            const bUnread =
                                oMail.isRead !== true;


                            const oSubject =
                                new Title({

                                    text:
                                        oMail.subject ||
                                        "No Subject",

                                    level:
                                        "H5"

                                });


                            const oFrom =
                                new Text({

                                    text:
                                        "From: " +
                                        (
                                            oMail.senderUserName ||
                                            "System"
                                        )

                                });


                            const oDate =
                                new Text({

                                    text:
                                        this._formatMessageDate(
                                            oMail.createdAt
                                        )

                                });


                            const oBody =
                                new Text({

                                    text:
                                        oMail.message ||
                                        "",

                                    wrapping:
                                        true

                                });


                            const oMarkRead =
                                new Button({

                                    text:
                                        bUnread
                                            ? "Mark as Read"
                                            : "Read",

                                    icon:
                                        bUnread
                                            ? "sap-icon://email-read"
                                            : "sap-icon://accept",

                                    type:
                                        bUnread
                                            ? "Emphasized"
                                            : "Transparent",

                                    enabled:
                                        bUnread,

                                    press:
                                        function () {

                                            this._markMailAsRead(
                                                oMail.ID
                                            );

                                        }.bind(this)

                                });


                            const oBox =
                                new VBox({

                                    items: [

                                        oSubject,

                                        oFrom,

                                        oDate,

                                        oBody,

                                        oMarkRead

                                    ]

                                });


                            oBox.addStyleClass(
                                "mailDialogItem"
                            );


                            if (bUnread) {

                                oBox.addStyleClass(
                                    "unreadMailItem"
                                );

                            }


                            oList.addItem(

                                new sap.m.CustomListItem({

                                    content: [

                                        oBox

                                    ]

                                })

                            );

                        }.bind(this)
                    );


                    this._mailDialog
                        .addContent(oList);


                    this._mailDialog.open();


                } catch (error) {

                    console.error(
                        "Unable to load mailbox:",
                        error
                    );


                    MessageToast.show(
                        "Unable to load mailbox."
                    );

                }

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

        }
    );
});