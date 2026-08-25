sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend(
        "paymentsapp.controller.App",
        {

            onLogout: function () {

                console.log("LOGOUT CLICKED");

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