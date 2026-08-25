sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox"
], function (UIComponent, MessageBox) {
    "use strict";

    return UIComponent.extend("paymentsapp.Component", {

        metadata: {
            manifest: "json"
        },

        init: function () {

            UIComponent.prototype.init.apply(this, arguments);

            var oRouter = this.getRouter();

            oRouter.attachRouteMatched(
                this._onRouteMatched,
                this
            );

            oRouter.initialize();
        },


        _onRouteMatched: function (oEvent) {

            var sRouteName =
                oEvent.getParameter("name");

            var sRole =
                sessionStorage.getItem("userRole");

            console.log(
                "ROUTE CHECK:",
                sRouteName,
                "ROLE:",
                sRole
            );


            // =================================================
            // LOGIN
            // =================================================

            if (sRouteName === "Login") {
                return;
            }


            // =================================================
            // NO SESSION
            // =================================================

            if (!sRole) {

                console.log(
                    "NO USER SESSION"
                );

                return;
            }


            // =================================================
            // NORMALIZE ROLE
            // =================================================

            var role =
                String(sRole)
                    .trim()
                    .toUpperCase()
                    .replace(/[\s-]+/g, "_");

            console.log(
                "NORMALIZED ROLE:",
                role
            );


            // =================================================
            // PAYMENT USER
            // =================================================

            if (
                role === "PAYMENT_USER" ||
                role === "USER"
            ) {

                if (
                    sRouteName === "Dashboard" ||
                    sRouteName === "ApprovalInbox" ||
                    sRouteName === "UserManagement"
                ) {

                    console.log(
                        "BLOCKING PAYMENT USER:",
                        sRouteName
                    );

                    MessageBox.error(
                        "You are not authorized to access this page."
                    );

                    this.getRouter().navTo(
                        "Payments",
                        {},
                        true
                    );

                    return;
                }

                return;
            }


            // =================================================
            // ADMIN
            // =================================================

            if (role === "ADMIN") {

                console.log(
                    "ADMIN ACCESS:",
                    sRouteName
                );

                return;
            }


            // =================================================
            // UNKNOWN ROLE
            // =================================================

            console.log(
                "UNKNOWN ROLE:",
                role
            );

            sessionStorage.clear();

            this.getRouter().navTo(
                "Login",
                {},
                true
            );
        }

    });
});