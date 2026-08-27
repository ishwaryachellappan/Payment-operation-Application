sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/m/Switch",
    "sap/m/VBox",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (
    Controller,
    Dialog,
    Button,
    Input,
    Label,
    Select,
    Item,
    Switch,
    VBox,
    MessageBox,
    MessageToast
) {

    "use strict";

    return Controller.extend(
        "paymentsapp.controller.UserManagement",
        {

            // =====================================================
            // INIT
            // =====================================================

           onInit: function () {

    const role =
        sessionStorage.getItem("userRole");

    if (role !== "ADMIN") {

        this.getOwnerComponent()
            .getRouter()
            .navTo(
                "Payments",
                {},
                true
            );

        return;
    }

    this._loadUsers();
},


            // =====================================================
            // LOAD USERS
            // =====================================================

        _loadUsers: async function () {

    try {

        const response =
            await fetch(
                "/payment-service/Users"
            );

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }

        const result =
            await response.json();

        const users =
            Array.isArray(result.value)
                ? result.value
                : [];


        // =====================================================
        // TABLE MODEL
        // =====================================================

        const model =
            new sap.ui.model.json.JSONModel({
                Users: users
            });

        this.getView()
            .setModel(model);


        // =====================================================
        // SUMMARY
        // =====================================================

        const total =
            users.length;

        const active =
            users.filter(function (user) {
                return user.isActive === true;
            }).length;

        const inactive =
            total - active;


        this.byId("totalUsers")
            .setText(total);

        this.byId("activeUsers")
            .setText(active);

        this.byId("inactiveUsers")
            .setText(inactive);


        console.log(
            "Users loaded:",
            users
        );


    } catch (error) {

        console.error(
            "Unable to load users:",
            error
        );

        sap.m.MessageBox.error(
            "Unable to load users."
        );
    }
},


            // =====================================================
            // BACK
            // =====================================================

            onBack: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Dashboard"
                    );
            },


            // =====================================================
            // CREATE USER
            // =====================================================

           onCreateUser: function () {

    const userNameInput = new sap.m.Input({
        width: "100%",
        placeholder: "e.g. john.smith"
    });

    const fullNameInput = new sap.m.Input({
        width: "100%",
        placeholder: "Enter full name"
    });

    const emailInput = new sap.m.Input({
        width: "100%",
        type: "Email",
        placeholder: "user@company.com"
    });

    const passwordInput = new sap.m.Input({
        width: "100%",
        placeholder: "Enter initial password",
        type: "Password"
    });

    const roleSelect = new sap.m.Select({
        width: "100%",
        selectedKey: "PAYMENT_USER",

        items: [
            new sap.ui.core.Item({
                key: "ADMIN",
                text: "Administrator"
            }),

            new sap.ui.core.Item({
                key: "PAYMENT_USER",
                text: "Payment User"
            })
        ]
    });

    const activeSwitch = new sap.m.Switch({
        state: true
    });


    // =====================================================
    // SECTION 1
    // =====================================================

    const userInformationTitle =
        new sap.m.Title({
            text: "User Information",
            level: "H3"
        }).addStyleClass("createUserSectionTitle");


    const userInformation =
        new sap.m.VBox({

            items: [

                new sap.m.Label({
                    text: "User ID",
                    required: true
                }).addStyleClass("createUserLabel"),

                userNameInput
                    .addStyleClass("createUserInput"),

                new sap.m.Label({
                    text: "Full Name",
                    required: true
                }).addStyleClass("createUserLabel"),

                fullNameInput
                    .addStyleClass("createUserInput"),

                new sap.m.Label({
                    text: "Email Address",
                    required: true
                }).addStyleClass("createUserLabel"),

                emailInput
                    .addStyleClass("createUserInput")
            ]

        }).addStyleClass("createUserSection");


    // =====================================================
    // SECTION 2
    // =====================================================

    const accessTitle =
        new sap.m.Title({
            text: "Access & Security",
            level: "H3"
        }).addStyleClass("createUserSectionTitle");


    const accessSection =
        new sap.m.VBox({

            items: [

                new sap.m.Label({
                    text: "Initial Password",
                    required: true
                }).addStyleClass("createUserLabel"),

                passwordInput
                    .addStyleClass("createUserInput"),

                new sap.m.Label({
                    text: "Role",
                    required: true
                }).addStyleClass("createUserLabel"),

                roleSelect
                    .addStyleClass("createUserInput"),

                new sap.m.Label({
                    text: "Account Status"
                }).addStyleClass("createUserLabel"),

                new sap.m.HBox({

                    alignItems: "Center",

                    items: [

                        activeSwitch,

                        new sap.m.Text({
                            text: "Active"
                        }).addStyleClass("createUserActiveText")

                    ]

                }).addStyleClass("createUserStatusRow")

            ]

        }).addStyleClass("createUserSection");


    // =====================================================
    // MAIN FORM
    // =====================================================

    const form =
        new sap.m.VBox({

            items: [

                userInformationTitle,

                userInformation,

                accessTitle,

                accessSection

            ]

        }).addStyleClass("createUserForm");


    // =====================================================
    // DIALOG
    // =====================================================

    const dialog =
        new sap.m.Dialog({

            title: "Create New User",

            contentWidth: "520px",

            contentHeight: "auto",

            verticalScrolling: true,

            content: [
                form
            ],

            beginButton:

                new sap.m.Button({

                    text: "Create User",

                    icon: "sap-icon://add",

                    type: "Emphasized",

                    press: async function () {

                        const userName =
                            userNameInput
                                .getValue()
                                .trim();

                        const fullName =
                            fullNameInput
                                .getValue()
                                .trim();

                        const email =
                            emailInput
                                .getValue()
                                .trim();

                        const password =
                            passwordInput
                                .getValue();

                        const role =
                            roleSelect
                                .getSelectedKey();

                        const isActive =
                            activeSwitch
                                .getState();


                        // =====================================
                        // VALIDATION
                        // =====================================

                        if (
                            !userName ||
                            !fullName ||
                            !email ||
                            !password ||
                            !role
                        ) {

                            sap.m.MessageBox.error(
                                "Please complete all mandatory fields."
                            );

                            return;
                        }


                        try {

                            const response =
                                await fetch(
                                    "/payment-service/createUser",
                                    {
                                        method: "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json",

                                            "Accept":
                                                "application/json"
                                        },

                                        body:
                                            JSON.stringify({

                                                userName,
                                                fullName,
                                                email,
                                                password,
                                                role,
                                                isActive

                                            })
                                    }
                                );


                            const result =
                                await response.json();


                            if (
                                !response.ok ||
                                !result.success
                            ) {

                                sap.m.MessageBox.error(
                                    result.message ||
                                    "Unable to create user."
                                );

                                return;
                            }


                            sap.m.MessageToast.show(
                                "User created successfully."
                            );


                            dialog.close();


                            // Refresh user list

                            this._loadUsers();

                        } catch (error) {

                            console.error(
                                "Create user error:",
                                error
                            );

                            sap.m.MessageBox.error(
                                "Unable to connect to payment service."
                            );

                        }

                    }.bind(this)

                }),


            endButton:

                new sap.m.Button({

                    text: "Cancel",

                    type: "Transparent",

                    press: function () {

                        dialog.close();

                    }

                }),


            afterClose: function () {

                dialog.destroy();

            }

        }).addStyleClass("createUserDialog");


    dialog.open();
},

            // =====================================================
            // EDIT USER
            // =====================================================

            onEditUser: function (oEvent) {

                const context =
                    oEvent
                        .getSource()
                        .getBindingContext();


                if (!context) {

                    MessageBox.error(
                        "Unable to identify selected user."
                    );

                    return;
                }


                const user =
                    context.getObject();


                console.log(
                    "Editing user:",
                    user
                );


                // -------------------------------------------------
                // Inputs
                // -------------------------------------------------

                const userNameInput =
                    new Input({
                        value:
                            user.userName
                    });

                const fullNameInput =
                    new Input({
                        value:
                            user.fullName
                    });

                const emailInput =
                    new Input({
                        value:
                            user.email
                    });

                const passwordInput =
                    new Input({
                        placeholder:
                            "Leave empty to keep existing password",
                        type:
                            "Password"
                    });


                const roleSelect =
                    new Select({

                        width:
                            "100%",

                        selectedKey:
                            user.role,

                        items: [

                            new Item({
                                key:
                                    "ADMIN",
                                text:
                                    "Admin"
                            }),

                            new Item({
                                key:
                                    "PAYMENT_USER",
                                text:
                                    "Payment User"
                            })

                        ]
                    });


                const activeSwitch =
                    new Switch({

                        state:
                            user.isActive
                    });


                const form =
                    new VBox({

                        class:
                            "sapUiMediumMargin",

                        items: [

                            new Label({
                                text:
                                    "User ID"
                            }),

                            userNameInput,

                            new Label({
                                text:
                                    "Full Name"
                            }),

                            fullNameInput,

                            new Label({
                                text:
                                    "Email"
                            }),

                            emailInput,

                            new Label({
                                text:
                                    "New Password"
                            }),

                            passwordInput,

                            new Label({
                                text:
                                    "Role"
                            }),

                            roleSelect,

                            new Label({
                                text:
                                    "Active"
                            }),

                            activeSwitch

                        ]
                    });


                const dialog =
                    new Dialog({

                        title:
                            "Edit User",

                        contentWidth:
                            "450px",

                        content:
                            form,


                        beginButton:
                            new Button({

                                text:
                                    "Save Changes",

                                type:
                                    "Emphasized",

                                press:
                                    async function () {

                                        const userName =
                                            userNameInput
                                                .getValue()
                                                .trim();

                                        const fullName =
                                            fullNameInput
                                                .getValue()
                                                .trim();

                                        const email =
                                            emailInput
                                                .getValue()
                                                .trim();

                                        const password =
                                            passwordInput
                                                .getValue();

                                        const role =
                                            roleSelect
                                                .getSelectedKey();

                                        const isActive =
                                            activeSwitch
                                                .getState();


                                        if (
                                            !userName ||
                                            !fullName ||
                                            !email ||
                                            !role
                                        ) {

                                            MessageBox.error(
                                                "All mandatory fields are required"
                                            );

                                            return;
                                        }


                                        try {

                                            const response =
                                                await fetch(
                                                    "/payment-service/updateUser",
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

                                                                userId:
                                                                    user.ID,

                                                                userName,

                                                                fullName,

                                                                email,

                                                                password,

                                                                role,

                                                                isActive

                                                            })
                                                    }
                                                );


                                            const result =
                                                await response.json();


                                            if (
                                                !response.ok ||
                                                !result.success
                                            ) {

                                                MessageBox.error(
                                                    result.message ||
                                                    "Unable to update user"
                                                );

                                                return;
                                            }


                                            MessageToast.show(
                                                "User updated successfully"
                                            );


                                            dialog.close();


                                            this._loadUsers();

                                        }
                                        catch (error) {

                                            console.error(
                                                "Update user error:",
                                                error
                                            );

                                            MessageBox.error(
                                                "Unable to connect to payment service"
                                            );
                                        }

                                    }.bind(this)

                            }),


                        endButton:
                            new Button({

                                text:
                                    "Cancel",

                                press:
                                    function () {

                                        dialog.close();

                                    }

                            }),


                        afterClose:
                            function () {

                                dialog.destroy();

                            }

                    });


                dialog.open();
            },


            // =====================================================
            // DELETE USER
            // =====================================================

            onDeleteUser: function (oEvent) {

                const context =
                    oEvent
                        .getSource()
                        .getBindingContext();


                if (!context) {

                    MessageBox.error(
                        "Unable to identify selected user."
                    );

                    return;
                }


                const user =
                    context.getObject();


                MessageBox.confirm(

                    "Are you sure you want to delete user '" +
                    user.userName +
                    "'?",

                    {

                        title:
                            "Delete User",

                        actions: [
                            MessageBox.Action.OK,
                            MessageBox.Action.CANCEL
                        ],

                        emphasizedAction:
                            MessageBox.Action.OK,

                        onClose:
                            function (action) {

                                if (
                                    action ===
                                    MessageBox.Action.OK
                                ) {

                                    this._deleteUser(
                                        user.ID
                                    );
                                }

                            }.bind(this)

                    }
                );
            },


            // =====================================================
            // DELETE USER BACKEND CALL
            // =====================================================

            _deleteUser: async function (
                userId
            ) {

                try {

                    const response =
                        await fetch(
                            "/payment-service/deleteUser",
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

                                        userId:
                                            userId

                                    })
                            }
                        );


                    const result =
                        await response.json();


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        MessageBox.error(
                            result.message ||
                            "Unable to delete user"
                        );

                        return;
                    }


                    MessageToast.show(
                        "User deleted successfully"
                    );


                    this._loadUsers();

                }
                catch (error) {

                    console.error(
                        "Delete user error:",
                        error
                    );

                    MessageBox.error(
                        "Unable to connect to payment service"
                    );
                }
            },

            onRefreshUsers: function () {

    this._loadUsers();

},

onSearchUsers: function (oEvent) {

    const query =
        oEvent
            .getParameter("query") ||
        oEvent
            .getParameter("newValue") ||
        "";

    const binding =
        this.byId("usersTable")
            .getBinding("items");

    if (!binding) {
        return;
    }

    const filters = [];

    if (query.trim()) {

        const search =
            query.trim();

        filters.push(

            new sap.ui.model.Filter({

                filters: [

                    new sap.ui.model.Filter(
                        "userName",
                        sap.ui.model.FilterOperator.Contains,
                        search
                    ),

                    new sap.ui.model.Filter(
                        "fullName",
                        sap.ui.model.FilterOperator.Contains,
                        search
                    ),

                    new sap.ui.model.Filter(
                        "email",
                        sap.ui.model.FilterOperator.Contains,
                        search
                    )

                ],

                and: false

            })

        );
    }

    binding.filter(filters);

},

// =========================================================
// EXPORT USERS
// =========================================================

onExportUsers: function () {

    const oTable =
        this.byId("usersTable");

    if (!oTable) {

        sap.m.MessageBox.error(
            "Users table could not be found."
        );

        return;
    }


    const oBinding =
        oTable.getBinding("items");


    if (!oBinding) {

        sap.m.MessageBox.error(
            "User data is not available."
        );

        return;
    }


    const aContexts =
        oBinding.getContexts();


    if (!aContexts || aContexts.length === 0) {

        sap.m.MessageToast.show(
            "There are no users to export."
        );

        return;
    }


    const aUsers =
        aContexts.map(function (oContext) {

            return oContext.getObject();

        });


    // ---------------------------------------------------------
    // CSV HEADER
    // ---------------------------------------------------------

    const aRows = [];

    aRows.push([

        "User ID",
        "Full Name",
        "Email Address",
        "Role",
        "Status"

    ]);


    // ---------------------------------------------------------
    // USER DATA
    // ---------------------------------------------------------

    aUsers.forEach(function (user) {

        aRows.push([

            user.userName || "",

            user.fullName || "",

            user.email || "",

            user.role || "",

            user.isActive
                ? "Active"
                : "Inactive"

        ]);

    });


    // ---------------------------------------------------------
    // CONVERT TO CSV
    // ---------------------------------------------------------

    const sCsv =
        aRows.map(function (row) {

            return row.map(function (value) {

                const sValue =
                    String(value);

                return '"' +
                    sValue.replace(
                        /"/g,
                        '""'
                    ) +
                    '"';

            }).join(",");

        }).join("\r\n");


    // ---------------------------------------------------------
    // CREATE FILE
    // ---------------------------------------------------------

    const oBlob =
        new Blob(
            [sCsv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const sUrl =
        URL.createObjectURL(oBlob);


    const oLink =
        document.createElement("a");


    const oNow =
        new Date();


    const sDate =
        oNow
            .toISOString()
            .slice(0, 10);


    oLink.href =
        sUrl;


    oLink.download =
        "users_" +
        sDate +
        ".csv";


    document.body.appendChild(
        oLink
    );


    oLink.click();


    document.body.removeChild(
        oLink
    );


    URL.revokeObjectURL(
        sUrl
    );


    sap.m.MessageToast.show(
        aUsers.length +
        " user(s) exported successfully."
    );
},

        }
    );
});