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

                    // =====================================================
// DASHBOARD ANALYTICS
// =====================================================

const total = payments.length;

const pending =
    payments.filter(function (payment) {
        return payment.status === "PENDING_APPROVAL";
    }).length;

const approved =
    payments.filter(function (payment) {
        return payment.status === "APPROVED";
    }).length;

const rejected =
    payments.filter(function (payment) {
        return payment.status === "REJECTED";
    }).length;

// =====================================================
// APPROVAL / REJECTION RATES
// =====================================================

const approvalRate =
    total > 0
        ? ((approved / total) * 100).toFixed(1)
        : "0.0";

const rejectionRate =
    total > 0
        ? ((rejected / total) * 100).toFixed(1)
        : "0.0";


// =====================================================
// AMOUNT ANALYTICS
// =====================================================

const amounts =
    payments
        .map(function (payment) {
            return Number(payment.amount);
        })
        .filter(function (amount) {
            return !isNaN(amount);
        });

const totalAmount =
    amounts.reduce(function (sum, amount) {
        return sum + amount;
    }, 0);

const averageAmount =
    amounts.length > 0
        ? totalAmount / amounts.length
        : 0;

const highestAmount =
    amounts.length > 0
        ? Math.max(...amounts)
        : 0;

const lowestAmount =
    amounts.length > 0
        ? Math.min(...amounts)
        : 0;


// =====================================================
// CURRENCY DISTRIBUTION
// =====================================================

const currencyCounts = {};

payments.forEach(function (payment) {

    const currency =
        payment.currency || "UNKNOWN";

    if (!currencyCounts[currency]) {
        currencyCounts[currency] = 0;
    }

    currencyCounts[currency]++;
});


// =====================================================
// STATUS DISTRIBUTION
// =====================================================

const statusCounts = {

    PENDING_APPROVAL:
        pending,

    APPROVED:
        approved,

    REJECTED:
        rejected
};


console.log(
    "Dashboard Analytics:",
    {
        total,
        pending,
        approved,
        rejected,
        approvalRate,
        rejectionRate,
        averageAmount,
        highestAmount,
        lowestAmount,
        currencyCounts,
        statusCounts
    }
);



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
    this.byId("totalPayments");

const pendingTile =
    this.byId("pendingPayments");

const approvedTile =
    this.byId("approvedPayments");

const rejectedTile =
    this.byId("rejectedPayments");

if (totalTile) {
    totalTile.setValue(total);
}

if (pendingTile) {
    pendingTile.setValue(pending);
}

if (approvedTile) {
    approvedTile.setValue(approved);
}

if (rejectedTile) {
    rejectedTile.setValue(rejected);
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

    // =========================
    // KPI VALUES
    // =========================

    total: total,

    pending: pending,

    approved: approved,

    rejected: rejected,


    // =========================
    // ANALYTICS
    // =========================

    approvalRate:
        approvalRate,

    rejectionRate:
        rejectionRate,

    averageAmount:
        averageAmount.toFixed(2),

    highestAmount:
        highestAmount.toFixed(2),

    lowestAmount:
        lowestAmount.toFixed(2),

    totalAmount:
        totalAmount.toFixed(2),


    // =========================
    // DISTRIBUTION
    // =========================

    currencyCounts:
        currencyCounts,

    statusCounts:
        statusCounts,


    // =========================
    // RECENT PAYMENTS
    // =========================

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

    console.log("========== LOGOUT ==========");

    // Clear all login information
    sessionStorage.clear();

    // Clear any browser cache state used by the application
    localStorage.removeItem("username");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userRole");

    console.log(
        "Session after logout:",
        sessionStorage.getItem("userRole")
    );

    // Completely reload application
    window.location.replace(
        window.location.pathname
    );
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

onAfterRendering: function () {

    this._makeKpiClickable(
        "totalKpiCard",
        this.onTotalPayments
    );

    this._makeKpiClickable(
        "pendingKpiCard",
        this.onPendingPayments
    );

    this._makeKpiClickable(
        "approvedKpiCard",
        this.onApprovedPayments
    );

    this._makeKpiClickable(
        "rejectedKpiCard",
        this.onRejectedPayments
    );
},

_makeKpiClickable: function (sId, fnHandler) {

    const oCard = this.byId(sId);

    if (!oCard) {
        console.error(
            "KPI card not found:",
            sId
        );
        return;
    }

    // Prevent duplicate event registration
    oCard.detachBrowserEvent(
        "click",
        fnHandler,
        this
    );

    // Make the whole card clickable
    oCard.attachBrowserEvent(
        "click",
        fnHandler,
        this
    );

    // Accessibility / visual indication
    oCard.addStyleClass("kpiClickable");
},

onDashboard: function () {

    this.getOwnerComponent()
        .getRouter()
        .navTo("Dashboard");

},




        }
    );
});