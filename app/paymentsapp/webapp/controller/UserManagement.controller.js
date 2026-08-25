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

    console.log(
        "========== USER MANAGEMENT INIT =========="
    );

    const role =
        sessionStorage.getItem("userRole");

    console.log(
        "USER MANAGEMENT ROLE:",
        role
    );

    if (role !== "ADMIN") {

        console.log(
            "Not authorized for User Management"
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
        "User Management authorized"
    );

    this._loadUsers();
},


            // =====================================================
            // LOAD USERS
            // =====================================================

            _loadUsers: function () {

    console.log(
        "Refreshing Users table..."
    );

    const table =
        this.byId("usersTable");

    if (!table) {

        console.log(
            "Users table not found yet"
        );

        return;
    }

    const binding =
        table.getBinding("items");

    if (binding) {

        binding.refresh();

        console.log(
            "Users table refreshed"
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

                const userNameInput =
                    new Input({
                        placeholder:
                            "User ID"
                    });

                const fullNameInput =
                    new Input({
                        placeholder:
                            "Full Name"
                    });

                const emailInput =
                    new Input({
                        placeholder:
                            "Email"
                    });

                const passwordInput =
                    new Input({
                        placeholder:
                            "Initial Password",
                        type:
                            "Password"
                    });

                const roleSelect =
                    new Select({

                        width: "100%",

                        selectedKey:
                            "PAYMENT_USER",

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
                        state: true
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
                                    "Initial Password"
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
                            "Create New User",

                        contentWidth:
                            "450px",

                        content:
                            form,


                        beginButton:
                            new Button({

                                text:
                                    "Create User",

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
                                            !password ||
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
                                                    "/payment-service/createUser",
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
                                                    "Unable to create user"
                                                );

                                                return;
                                            }


                                            MessageToast.show(
                                                "User created successfully"
                                            );


                                            dialog.close();


                                            this._loadUsers();

                                        }
                                        catch (error) {

                                            console.error(
                                                "Create user error:",
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
            }

        }
    );
});