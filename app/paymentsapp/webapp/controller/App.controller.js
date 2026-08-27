sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend(
        "paymentsapp.controller.App",
        {

            onInit: function () {

                // -------------------------------------------------
                // Shell-level model: survives every navigation
                // because App.view.xml (ToolPage) is the root view
                // and is never destroyed while routing swaps the
                // page content inside the "app" control.
                //
                // NOTE: isAdmin/currentRoute are just seeded here.
                // The shell (and this onInit) loads once at app
                // startup, which can be BEFORE the user has logged
                // in and sessionStorage("userRole") has been set.
                // The real values get (re)computed in
                // _onRouteMatched, which fires again after login
                // navigates to the first real route.
                // -------------------------------------------------

                const appViewModel = new JSONModel({
                    sideExpanded: true,
                    currentRoute: "",
                    isAdmin: this._getNormalizedRole() === "ADMIN"
                });

                this.getView().setModel(appViewModel, "appView");

                // Keep the selected sidebar item + admin-only items in sync
                this.getOwnerComponent()
                    .getRouter()
                    .attachRouteMatched(this._onRouteMatched, this);
            },


            // Same normalization Component.js uses for its route
            // guards, so the sidebar always matches what a role
            // is actually allowed to open.
            _getNormalizedRole: function () {

                const sRawRole = sessionStorage.getItem("userRole");

                return sRawRole
                    ? String(sRawRole).trim().toUpperCase().replace(/[\s-]+/g, "_")
                    : "";
            },


            _onRouteMatched: function (oEvent) {

                const sRouteName = oEvent.getParameter("name");

                const oModel = this.getView().getModel("appView");

                oModel.setProperty("/currentRoute", sRouteName);

                // Recompute on every navigation - by the time any
                // real route (Dashboard/Payments/...) matches, login
                // has already written the role to sessionStorage.
                oModel.setProperty(
                    "/isAdmin",
                    this._getNormalizedRole() === "ADMIN"
                );
            },


            // =====================================================
            // SIDEBAR TOGGLE
            // =====================================================

            onToggleSideNav: function () {

                const oModel = this.getView().getModel("appView");

                oModel.setProperty(
                    "/sideExpanded",
                    !oModel.getProperty("/sideExpanded")
                );
            },


            // =====================================================
            // NAVIGATION (shared by every page via the shell side nav)
            // =====================================================

            onDashboard: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("Dashboard");
            },

            onViewPayments: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("Payments");
            },

            onApprovalInbox: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("ApprovalInbox");
            },

            onUserManagement: function () {

                if (this._getNormalizedRole() !== "ADMIN") {
                    return;
                }

                this.getOwnerComponent()
                    .getRouter()
                    .navTo("UserManagement");
            },

            onUserLogs: function () {

    if (this._getNormalizedRole() !== "ADMIN") {
        return;
    }

    this.getOwnerComponent()
        .getRouter()
        .navTo("UserLogs");
},


            // =====================================================
            // LOGOUT
            // =====================================================

            onLogout: function () {

                console.log("LOGOUT CLICKED");

                sessionStorage.clear();
                localStorage.removeItem("username");
                localStorage.removeItem("fullName");
                localStorage.removeItem("userRole");

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