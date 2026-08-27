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
        "paymentsapp.controller.UserLogs",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                const role =
                    sessionStorage.getItem("userRole");

                if (
                    !role ||
                    String(role).trim().toUpperCase() !== "ADMIN"
                ) {

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo("Payments", {}, true);

                    return;
                }

                this._loadLogs();
            },


            // =====================================================
            // LOAD REAL USER LOGS
            // =====================================================

            _loadLogs: async function () {

                try {

                    console.log(
                        "========== LOADING USER LOGS =========="
                    );

                    const oModel =
                        this.getOwnerComponent().getModel();

                    if (!oModel) {

                        throw new Error(
                            "OData model is not available"
                        );
                    }


                    // Read real UserLogs entity from CAP

                    const oBinding =
                        oModel.bindList(
                            "/UserLogs"
                        );


                    const aContexts =
                        await oBinding.requestContexts(
                            0,
                            100
                        );


                    console.log(
                        "USER LOG CONTEXTS:",
                        aContexts
                    );


                    const aLogs =
                        aContexts.map(
                            function (oContext) {

                                const oLog =
                                    oContext.getObject();

                                console.log(
                                    "USER LOG:",
                                    oLog
                                );


                                return {

                                    ID:
                                        oLog.ID,

                                    dateTime:
                                        this._formatDate(
                                            oLog.createdAt
                                        ),

                                    user:
                                        oLog.userName ||
                                        "-",

                                    fullName:
                                        oLog.fullName ||
                                        "-",

                                    role:
                                        oLog.role ||
                                        "-",

                                    action:
                                        oLog.action ||
                                        "-",

                                    module:
                                        oLog.module ||
                                        "-",

                                    status:
                                        oLog.status ||
                                        "-",

                                    statusState:
                                        String(
                                            oLog.status || ""
                                        ).toLowerCase() ===
                                        "success"
                                            ? "Success"
                                            : "Error",

                                    details:
                                        oLog.details ||
                                        "-"

                                };

                            }.bind(this)
                        );


                    console.log(
                        "FORMATTED USER LOGS:",
                        aLogs
                    );


                    // Put real data into JSON model

                    const oJSONModel =
                        new JSONModel({
                            Logs: aLogs
                        });


                    this.getView().setModel(
                        oJSONModel,
                        "logs"
                    );


                    // Update summary cards

                    this._updateSummary(
                        aLogs
                    );


                    console.log(
                        "========== USER LOGS UPDATED =========="
                    );


                } catch (error) {

                    console.error(
                        "User Logs loading failed:",
                        error
                    );

                    MessageBox.error(
                        "Unable to load User Logs."
                    );
                }
            },


            // =====================================================
            // DATE FORMATTER
            // =====================================================

            _formatDate: function (value) {

                if (!value) {
                    return "-";
                }


                const date =
                    new Date(value);


                if (isNaN(date.getTime())) {
                    return String(value);
                }


                return date.toLocaleString(
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
            // SUMMARY CARDS
            // =====================================================

            _updateSummary: function (aLogs) {

                const total =
                    aLogs.length;


                const successful =
                    aLogs.filter(
                        function (log) {

                            return (
                                String(
                                    log.status
                                ).toLowerCase() ===
                                "success"
                            );

                        }
                    ).length;


                const failed =
                    aLogs.filter(
                        function (log) {

                            return (
                                String(
                                    log.status
                                ).toLowerCase() ===
                                "failed"
                            );

                        }
                    ).length;


                // Today's logs

                const today =
                    new Date();


                const todayString =
                    today.toISOString()
                        .substring(0, 10);


                const todayCount =
                    aLogs.filter(
                        function (log) {

                            if (!log.ID) {
                                return false;
                            }

                            return true;

                        }
                    ).length;


                this.byId("totalLogs")
                    .setText(String(total));


                this.byId("successfulLogs")
                    .setText(String(successful));


                this.byId("failedLogs")
                    .setText(String(failed));


                this.byId("todayLogs")
                    .setText(String(todayCount));
            },


            // =====================================================
            // REFRESH
            // =====================================================

            onRefresh: function () {

                this._loadLogs();
            },


            // =====================================================
            // SEARCH
            // =====================================================

            onSearch: function (oEvent) {

                const value =
                    oEvent.getParameter("newValue") || "";


                const oTable =
                    this.byId("userLogsTable");


                const oBinding =
                    oTable.getBinding("items");


                if (!value.trim()) {

                    oBinding.filter([]);

                    return;
                }


                const sSearch =
                    value.toLowerCase();


                const aFilters = [

                    new sap.ui.model.Filter({
                        filters: [

                            new sap.ui.model.Filter(
                                "user",
                                sap.ui.model.FilterOperator.Contains,
                                sSearch
                            ),

                            new sap.ui.model.Filter(
                                "fullName",
                                sap.ui.model.FilterOperator.Contains,
                                sSearch
                            ),

                            new sap.ui.model.Filter(
                                "action",
                                sap.ui.model.FilterOperator.Contains,
                                sSearch
                            ),

                            new sap.ui.model.Filter(
                                "module",
                                sap.ui.model.FilterOperator.Contains,
                                sSearch
                            ),

                            new sap.ui.model.Filter(
                                "details",
                                sap.ui.model.FilterOperator.Contains,
                                sSearch
                            )

                        ],
                        and: false
                    })

                ];


                oBinding.filter(aFilters);
            },


            // =====================================================
            // FILTER CHANGE
            // =====================================================

            onFilterChange: function () {

                const oTable =
                    this.byId("userLogsTable");


                const oBinding =
                    oTable.getBinding("items");


                const aFilters = [];


                const action =
                    this.byId("actionFilter")
                        .getSelectedKey();


                const status =
                    this.byId("statusFilter")
                        .getSelectedKey();


                if (action && action !== "ALL") {

                    aFilters.push(
                        new sap.ui.model.Filter(
                            "action",
                            sap.ui.model.FilterOperator.EQ,
                            action
                        )
                    );
                }


                if (status && status !== "ALL") {

                    const statusValue =
                        status === "SUCCESS"
                            ? "Success"
                            : "Failed";


                    aFilters.push(
                        new sap.ui.model.Filter(
                            "status",
                            sap.ui.model.FilterOperator.EQ,
                            statusValue
                        )
                    );
                }


                oBinding.filter(
                    aFilters
                );
            }

        }
    );
});