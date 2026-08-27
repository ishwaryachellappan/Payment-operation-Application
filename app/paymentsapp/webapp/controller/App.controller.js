sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Popover",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Title",
    "sap/ui/core/Icon",
    "sap/ui/core/HTML"
], function (
    Controller,
    JSONModel,
    Popover,
    VBox,
    HBox,
    Text,
    Button,
    Title,
    Icon,
    HTML
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
                            this._getNormalizedRole()
                            === "ADMIN",

                        pendingCount: 0

                    });


                this.getView()
                    .setModel(
                        appViewModel,
                        "appView"
                    );


                this.getOwnerComponent()
                    .getRouter()
                    .attachRouteMatched(
                        this._onRouteMatched,
                        this
                    );


                // Initial notification count
                this._loadPendingCount();


                // Refresh count every 30 seconds
                this._notificationInterval =
                    setInterval(
                        function () {

                            this._loadPendingCount();

                        }.bind(this),
                        30000
                    );
            },


            // =====================================================
            // EXIT
            // =====================================================

            onExit: function () {

                if (
                    this._notificationInterval
                ) {

                    clearInterval(
                        this._notificationInterval
                    );

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


            // =====================================================
            // ROUTE MATCHED
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


                oModel.setProperty(
                    "/isAdmin",
                    this._getNormalizedRole()
                    === "ADMIN"
                );


                // Refresh notifications whenever
                // navigation occurs

                this._loadPendingCount();
            },


            // =====================================================
            // LOAD PENDING PAYMENT COUNT
            // =====================================================

            _loadPendingCount: async function () {

                try {

                    const role =
                        this._getNormalizedRole();


                    // Only admins need approval notifications

                    if (role !== "ADMIN") {

                        this._setPendingCount(0);

                        return;
                    }


                    const oModel =
                        this.getOwnerComponent()
                            .getModel();


                    if (!oModel) {
                        return;
                    }


                    const oBinding =
                        oModel.bindList(
                            "/Payments",
                            undefined,
                            undefined,
                            [
                                new sap.ui.model.Filter(
                                    "status",
                                    sap.ui.model.FilterOperator.EQ,
                                    "PENDING_APPROVAL"
                                )
                            ]
                        );


                    const aContexts =
                        await oBinding.requestContexts(
                            0,
                            1000
                        );


                    const iCount =
                        aContexts.length;


                    console.log(
                        "PENDING ACTIONS:",
                        iCount
                    );


                    this._setPendingCount(
                        iCount
                    );


                } catch (error) {

                    console.error(
                        "Unable to load pending actions:",
                        error
                    );

                }
            },


            // =====================================================
            // SET BADGE
            // =====================================================

            _setPendingCount: function (
                iCount
            ) {

                const oModel =
                    this.getView()
                        .getModel(
                            "appView"
                        );


                oModel.setProperty(
                    "/pendingCount",
                    iCount
                );


                const oBadge =
                    this.byId(
                        "notificationCount"
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
            // NOTIFICATION CLICK
            // =====================================================

            onNotificationsPress: async function () {

                await this._loadPendingCount();


                const iCount =
                    this.getView()
                        .getModel(
                            "appView"
                        )
                        .getProperty(
                            "/pendingCount"
                        );


                if (
                    this._notificationPopover &&
                    this._notificationPopover.isOpen()
                ) {

                    this._notificationPopover.close();

                    return;
                }


                // -------------------------------------------------
                // Title
                // -------------------------------------------------

                const oTitle =
                    new Title({

                        text:
                            "Notifications",

                        level:
                            "H4"

                    });


                // -------------------------------------------------
                // Main message
                // -------------------------------------------------

                const oMessage =
                    new Text({

                        text:
                            iCount === 0

                                ? "No pending actions"

                                : iCount === 1

                                    ? "1 payment is waiting for approval"

                                    : `${iCount} payments are waiting for approval`,

                        wrapping:
                            true

                    });


                oMessage.addStyleClass(
                    "notificationMessage"
                );


                // -------------------------------------------------
                // Icon
                // -------------------------------------------------

                const oIcon =
                    new Icon({

                        src:
                            iCount > 0

                                ? "sap-icon://alert"

                                : "sap-icon://accept",

                        size:
                            "1.5rem"

                    });


                oIcon.addStyleClass(
                    "notificationIcon"
                );


                // -------------------------------------------------
                // Message row
                // -------------------------------------------------

                const oMessageRow =
                    new HBox({

                        alignItems:
                            "Center",

                        items: [

                            oIcon,

                            oMessage

                        ]

                    });


                oMessageRow.addStyleClass(
                    "notificationMessageRow"
                );


                // -------------------------------------------------
                // View approvals button
                // -------------------------------------------------

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

                                this._notificationPopover.close();

                                this.getOwnerComponent()
                                    .getRouter()
                                    .navTo(
                                        "ApprovalInbox"
                                    );

                            }.bind(this)

                    });


                // -------------------------------------------------
                // Content
                // -------------------------------------------------

                const oContent =
                    new VBox({

                        items: [

                            oTitle,

                            oMessageRow,

                            oViewButton

                        ]

                    });


                oContent.addStyleClass(
                    "notificationPopoverContent"
                );


                // -------------------------------------------------
                // Popover
                // -------------------------------------------------

                this._notificationPopover =
                    new Popover({

                        placement:
                            "Bottom",

                        showHeader:
                            false,

                        contentWidth:
                            "320px",

                        content:
                            [

                                oContent

                            ]

                    });


                this._notificationPopover.openBy(
                    this.byId(
                        "notificationButton"
                    )
                );
            },


            // =====================================================
            // SIDEBAR TOGGLE
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