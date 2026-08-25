sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (
    Controller,
    JSONModel,
    MessageBox
) {
    "use strict";

    return Controller.extend(
        "paymentsapp.controller.Dashboard",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                console.log("========== DASHBOARD INIT ==========");

                const role =
                    sessionStorage.getItem("userRole");

                console.log(
                    "Dashboard role:",
                    role
                );

                // -------------------------------------------------
                // Create Dashboard JSON Model
                // -------------------------------------------------

                const dashboardModel =
                    new JSONModel({
                        total: 0,
                        pending: 0,
                        approved: 0,
                        rejected: 0,
                        recentPayments: []
                    });

                this.getView().setModel(
                    dashboardModel,
                    "dashboard"
                );

                // -------------------------------------------------
                // Only ADMIN can access Dashboard
                // -------------------------------------------------

                if (role !== "ADMIN") {

                    console.log(
                        "Dashboard blocked for role:",
                        role
                    );

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Payments",
                            {},
                            true
                        );

                    return;
                }

                // -------------------------------------------------
                // Load Dashboard initially
                // -------------------------------------------------

                this._loadDashboardData();

                // -------------------------------------------------
                // Reload every time Dashboard is opened
                // -------------------------------------------------

                this.getOwnerComponent()
                    .getRouter()
                    .getRoute("Dashboard")
                    .attachPatternMatched(
                        this._onDashboardRouteMatched,
                        this
                    );
            },


            // =====================================================
            // DASHBOARD ROUTE MATCHED
            // =====================================================

            _onDashboardRouteMatched: function () {

                console.log(
                    "========== DASHBOARD OPENED =========="
                );

                const role =
                    sessionStorage.getItem("userRole");

                if (role !== "ADMIN") {
                    return;
                }

                // Always reload latest database values
                this._loadDashboardData();
            },


            // =====================================================
            // LOAD DASHBOARD DATA
            // =====================================================

            _loadDashboardData: async function () {

                try {

                    console.log(
                        "========== LOADING DASHBOARD DATA =========="
                    );

                    // -------------------------------------------------
                    // Get ALL payments
                    // Used for KPI calculation
                    // -------------------------------------------------

                    const response =
                        await fetch(
                            "/payment-service/Payments",
                            {
                                method: "GET",

                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );

                    console.log(
                        "Payment response:",
                        response.status
                    );

                    if (!response.ok) {

                        throw new Error(
                            "HTTP " +
                            response.status
                        );
                    }

                    const result =
                        await response.json();

                    console.log(
                        "Payment API result:",
                        result
                    );

                    const payments =
                        Array.isArray(result.value)
                            ? result.value
                            : [];

                    console.log(
                        "ALL PAYMENTS:",
                        payments
                    );


                    // =================================================
                    // KPI COUNTS
                    // =================================================

                    const total =
                        payments.length;

                    const pending =
                        payments.filter(
                            function (payment) {

                                return (
                                    payment.status ===
                                    "PENDING_APPROVAL"
                                );

                            }
                        ).length;

                    const approved =
                        payments.filter(
                            function (payment) {

                                return (
                                    payment.status ===
                                    "APPROVED"
                                );

                            }
                        ).length;

                    const rejected =
                        payments.filter(
                            function (payment) {

                                return (
                                    payment.status ===
                                    "REJECTED"
                                );

                            }
                        ).length;


                    console.log(
                        "========== KPI VALUES =========="
                    );

                    console.log(
                        "Total:",
                        total
                    );

                    console.log(
                        "Pending:",
                        pending
                    );

                    console.log(
                        "Approved:",
                        approved
                    );

                    console.log(
                        "Rejected:",
                        rejected
                    );


                    // =================================================
                    // UPDATE KPI TILES DIRECTLY
                    // =================================================

                    const totalTile =
                        this.byId(
                            "totalPayments"
                        );

                    const pendingTile =
                        this.byId(
                            "pendingPayments"
                        );

                    const approvedTile =
                        this.byId(
                            "approvedPayments"
                        );

                    const rejectedTile =
                        this.byId(
                            "rejectedPayments"
                        );


                    if (totalTile) {

                        totalTile.setValue(
                            total
                        );
                    }

                    if (pendingTile) {

                        pendingTile.setValue(
                            pending
                        );
                    }

                    if (approvedTile) {

                        approvedTile.setValue(
                            approved
                        );
                    }

                    if (rejectedTile) {

                        rejectedTile.setValue(
                            rejected
                        );
                    }


                    // =================================================
                    // APPROVAL INBOX COUNT
                    // IMPORTANT:
                    // This comes from ALL PAYMENTS
                    // NOT recent payments
                    // =================================================

                    const approvalButton =
                        this.byId(
                            "approvalInboxButton"
                        );

                    if (approvalButton) {

                        approvalButton.setText(
                            "Approval Inbox (" +
                            pending +
                            ")"
                        );
                    }


                    // =================================================
                    // RECENT PAYMENTS
                    // Latest 5 by createdAt
                    // =================================================

                    const sortedPayments =
                        payments
                            .slice()
                            .sort(
                                function (a, b) {

                                    const dateA =
                                        a.createdAt
                                            ? new Date(
                                                a.createdAt
                                            ).getTime()
                                            : 0;

                                    const dateB =
                                        b.createdAt
                                            ? new Date(
                                                b.createdAt
                                            ).getTime()
                                            : 0;

                                    return (
                                        dateB -
                                        dateA
                                    );
                                }
                            );


                    const recentPayments =
                        sortedPayments.slice(
                            0,
                            5
                        );


                    console.log(
                        "LATEST 5 PAYMENTS:",
                        recentPayments
                    );


                    // =================================================
                    // UPDATE DASHBOARD MODEL
                    // =================================================

                    const dashboardModel =
                        this.getView()
                            .getModel(
                                "dashboard"
                            );


                    if (!dashboardModel) {

                        console.error(
                            "Dashboard JSONModel does not exist."
                        );

                        return;
                    }


                    dashboardModel.setData({

                        total:
                            total,

                        pending:
                            pending,

                        approved:
                            approved,

                        rejected:
                            rejected,

                        recentPayments:
                            recentPayments

                    });


                    dashboardModel.refresh(
                        true
                    );


                    console.log(
                        "========== DASHBOARD UPDATED =========="
                    );

                } catch (error) {

                    console.error(
                        "========== DASHBOARD ERROR =========="
                    );

                    console.error(
                        error
                    );

                    MessageBox.error(
                        "Unable to load payment dashboard data."
                    );
                }
            },


            // =====================================================
            // VIEW PAYMENTS
            // =====================================================

            onViewPayments: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Payments"
                    );
            },


            // =====================================================
            // APPROVAL INBOX
            // =====================================================

            onApprovalInbox: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "ApprovalInbox"
                    );
            },


            // =====================================================
            // TOTAL KPI
            // =====================================================

            onTotalPayments: function () {

                console.log(
                    "TOTAL KPI CLICKED"
                );

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Payments"
                    );
            },


            // =====================================================
            // PENDING KPI
            // =====================================================

            onPendingPayments: function () {

                console.log(
                    "PENDING KPI CLICKED"
                );

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Payments",
                        {
                            "?query": {
                                status:
                                    "PENDING_APPROVAL"
                            }
                        }
                    );
            },


            // =====================================================
            // APPROVED KPI
            // =====================================================

            onApprovedPayments: function () {

                console.log(
                    "APPROVED KPI CLICKED"
                );

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Payments",
                        {
                            "?query": {
                                status:
                                    "APPROVED"
                            }
                        }
                    );
            },


            // =====================================================
            // REJECTED KPI
            // =====================================================

            onRejectedPayments: function () {

                console.log(
                    "REJECTED KPI CLICKED"
                );

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Payments",
                        {
                            "?query": {
                                status:
                                    "REJECTED"
                            }
                        }
                    );
            },


            // =====================================================
            // USER MANAGEMENT
            // =====================================================

           onUserManagement: function () {

    console.log("========== USER MANAGEMENT CLICKED ==========");

    const role = sessionStorage.getItem("userRole");

    console.log("Current role:", role);

    if (role !== "ADMIN") {

        console.log(
            "User Management blocked. Role:",
            role
        );

        this.getOwnerComponent()
            .getRouter()
            .navTo(
                "Payments",
                {},
                true
            );

        return;
    }

    console.log(
        "Navigating to UserManagement..."
    );

    this.getOwnerComponent()
        .getRouter()
        .navTo(
            "UserManagement"
        );
},


            // =====================================================
            // LOGOUT
            // =====================================================

            onLogout: function () {

                console.log(
                    "========== LOGOUT =========="
                );

                sessionStorage.clear();

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