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

                        unreadMessageCount: 0

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


                if (
                    this._messagePopover
                ) {

                    this._messagePopover.destroy();

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

                    this._loadUnreadMessages()

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
            // MESSAGE ICON
            // =====================================================

            onMessageNotificationsPress:
                async function () {

                    const aMessages =
                        await this._getUnreadMessages();


                    this._setMessageCount(
                        aMessages.length
                    );


                    if (
                        this._messagePopover
                        &&
                        this._messagePopover.isOpen()
                    ) {

                        this._messagePopover.close();

                        return;
                    }


                    const oTitle =
                        new Title({

                            text:
                                "Messages",

                            level:
                                "H4"

                        });


                    oTitle.addStyleClass(
                        "notificationPopoverTitle"
                    );


                    const aItems = [];


                    if (
                        aMessages.length === 0
                    ) {

                        const oEmpty =
                            new Text({

                                text:
                                    "You have no unread messages.",

                                wrapping:
                                    true

                            });


                        oEmpty.addStyleClass(
                            "notificationEmpty"
                        );


                        aItems.push(
                            oEmpty
                        );

                    } else {

                        const oList =
                            new List({

                                showSeparators:
                                    "Inner"

                            });


                        aMessages
                            .slice(0, 5)
                            .forEach(
                                function (
                                    oMessage
                                ) {

                                    const oItem =
                                        new StandardListItem({

                                            title:
                                                oMessage.subject
                                                || "Message",

                                            description:
                                                oMessage.message
                                                || "",

                                            info:
                                                oMessage.senderUserName
                                                || "",

                                            type:
                                                "Active",

                                            press:
                                                function () {

                                                    this._markMessageAsRead(
                                                        oMessage.ID
                                                    );

                                                }.bind(this)

                                        });


                                    oList.addItem(
                                        oItem
                                    );

                                }.bind(this)
                            );


                        aItems.push(
                            oList
                        );


                        const oHint =
                            new Text({

                                text:
                                    aMessages.length > 5

                                        ? "Showing the 5 most recent unread messages."

                                        : "Click a message to mark it as read.",

                                wrapping:
                                    true

                            });


                        oHint.addStyleClass(
                            "notificationHint"
                        );


                        aItems.push(
                            oHint
                        );
                    }


                    const oContent =
                        new VBox({

                            items: [

                                oTitle,

                                ...aItems

                            ]

                        });


                    oContent.addStyleClass(
                        "messagePopoverContent"
                    );


                    if (
                        this._messagePopover
                    ) {

                        this._messagePopover.destroy();

                    }


                    this._messagePopover =
                        new Popover({

                            showHeader:
                                false,

                            placement:
                                "Bottom",

                            contentWidth:
                                "380px",

                            content: [
                                oContent
                            ]

                        });


                    this._messagePopover.openBy(
                        this.byId(
                            "messageNotificationButton"
                        )
                    );
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


                    return oData.value || [];


                } catch (error) {

                    console.error(
                        "Unable to load messages:",
                        error
                    );


                    return [];
                }
            },


            // =====================================================
            // MARK MESSAGE READ
            // =====================================================

            _markMessageAsRead:
                async function (
                    sMessageId
                ) {

                    try {

                        const response =
                            await fetch(
                                "/payment-service/Messages("
                                + sMessageId
                                + ")",
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
                                "HTTP "
                                + response.status
                            );

                        }


                        MessageToast.show(
                            "Message marked as read."
                        );


                        await this._loadUnreadMessages();


                        if (
                            this._messagePopover
                        ) {

                            this._messagePopover.close();

                        }


                    } catch (error) {

                        console.error(
                            "Unable to mark message as read:",
                            error
                        );


                        MessageToast.show(
                            "Unable to update message."
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
            }

        }
    );
});