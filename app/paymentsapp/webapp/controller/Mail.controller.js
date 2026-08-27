sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/CustomListItem",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Label",
    "sap/m/Select",
    "sap/ui/core/Item"
], function (
    Controller,
    CustomListItem,
    VBox,
    HBox,
    Text,
    Title,
    Button,
    MessageToast,
    Dialog,
    Input,
    TextArea,
    Label,
    Select,
    Item
) {

    "use strict";

    return Controller.extend(
        "paymentsapp.controller.Mail",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                this.getOwnerComponent()
                    .getRouter()
                    .getRoute("Mail")
                    .attachPatternMatched(
                        this._onMailRouteMatched,
                        this
                    );

            },


            // =====================================================
            // ROUTE
            // =====================================================

            _onMailRouteMatched: function () {

                this._loadMail();

            },


            // =====================================================
            // CURRENT USER
            // =====================================================

            _getCurrentUser: function () {

                return (
                    sessionStorage.getItem(
                        "username"
                    ) || ""
                );

            },


            // =====================================================
            // LOAD MAIL
            // =====================================================

           _loadMail: async function () {

    const sUser = this._getCurrentUser();

    console.log("MAIL CURRENT USER:", sUser);

    if (!sUser) {
        MessageToast.show("User session not found.");
        return;
    }

    try {

        const sFilter =
            "receiverUserName eq '" +
            String(sUser).replace(/'/g, "''") +
            "'";

        const sUrl =
            "/payment-service/Messages?" +
            "$filter=" +
            encodeURIComponent(sFilter);

        console.log("MAIL REQUEST:", sUrl);

        const response = await fetch(
            sUrl,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        console.log(
            "MAIL RESPONSE STATUS:",
            response.status
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "MAIL BACKEND ERROR:",
                errorText
            );

            MessageToast.show(
                "Unable to load mailbox."
            );

            return;
        }

        const data =
            await response.json();

        console.log(
            "MAIL DATA:",
            data
        );

        this._renderMail(
            data.value || []
        );

    } catch (error) {

        console.error(
            "MAIL LOAD ERROR:",
            error
        );

        MessageToast.show(
            "Unable to load mailbox."
        );
    }
},

            // =====================================================
            // RENDER MAIL
            // =====================================================

            _renderMail: function (
                aMessages
            ) {

                const oList =
                    this.byId("mailList");

                oList.removeAllItems();


                aMessages.forEach(
                    function (oMail) {

                        const oSender =
                            new Text({

                                text:
                                    "From: " +
                                    (
                                        oMail.senderUserName ||
                                        "SYSTEM"
                                    )

                            });


                        const oSubject =
                            new Title({

                                text:
                                    oMail.subject ||
                                    "No subject",

                                level:
                                    "H5"

                            });


                        const oMessage =
                            new Text({

                                text:
                                    oMail.message ||
                                    "",

                                wrapping:
                                    true

                            });


                        const oOpen =
                            new Button({

                                text:
                                    "Open",

                                icon:
                                    "sap-icon://display",

                                type:
                                    "Transparent",

                                press:
                                    function () {

                                        this._openMail(
                                            oMail
                                        );

                                    }.bind(this)

                            });


                        const oBox =
                            new VBox({

                                items: [

                                    oSender,

                                    oSubject,

                                    oMessage,

                                    oOpen

                                ]

                            });


                        oBox.addStyleClass(
                            "mailItem"
                        );


                        oList.addItem(

                            new CustomListItem({

                                content: [
                                    oBox
                                ]

                            })

                        );

                    }.bind(this)
                );

            },


            // =====================================================
            // OPEN MAIL
            // =====================================================

            _openMail: function (
                oMail
            ) {

                const oDialog =
                    new Dialog({

                        title:
                            oMail.subject ||
                            "Mail",

                        contentWidth:
                            "600px",

                        content: [

                            new VBox({

                                items: [

                                    new Text({

                                        text:
                                            "From: " +
                                            (
                                                oMail.senderUserName ||
                                                "SYSTEM"
                                            )

                                    }),

                                    new Text({

                                        text:
                                            "To: " +
                                            this._getCurrentUser()

                                    }),

                                    new Text({

                                        text:
                                            oMail.message ||
                                            "",

                                        wrapping:
                                            true

                                    })

                                ]

                            })

                        ],

                        endButton:
                            new Button({

                                text:
                                    "Close",

                                press:
                                    function () {

                                        oDialog.close();

                                    }

                            })

                    });


                oDialog.open();

            },


            // =====================================================
            // COMPOSE
            // =====================================================

            onCompose: function () {

                const oUserInput =
                    new Input({
                        placeholder:
                            "Enter username"
                    });


                const oSubjectInput =
                    new Input({
                        placeholder:
                            "Subject"
                    });


                const oMessageInput =
                    new TextArea({

                        placeholder:
                            "Write your message...",

                        rows:
                            6

                    });


                const oDialog =
                    new Dialog({

                        title:
                            "Compose Mail",

                        contentWidth:
                            "600px",

                        content: [

                            new VBox({

                                items: [

                                    new Label({
                                        text:
                                            "Send to"
                                    }),

                                    oUserInput,

                                    new Label({
                                        text:
                                            "Subject"
                                    }),

                                    oSubjectInput,

                                    new Label({
                                        text:
                                            "Message"
                                    }),

                                    oMessageInput

                                ]

                            })

                        ],

                        beginButton:
                            new Button({

                                text:
                                    "Send",

                                type:
                                    "Emphasized",

                                press:
                                    async function () {

                                        await this._sendMail(
                                            oUserInput.getValue(),
                                            oSubjectInput.getValue(),
                                            oMessageInput.getValue(),
                                            oDialog
                                        );

                                    }.bind(this)

                            }),

                        endButton:
                            new Button({

                                text:
                                    "Cancel",

                                press:
                                    function () {

                                        oDialog.close();

                                    }

                            })

                    });


                oDialog.open();

            },


            // =====================================================
            // SEND MAIL
            // =====================================================

            _sendMail: async function (
                sReceiver,
                sSubject,
                sMessage,
                oDialog
            ) {

                const sSender =
                    this._getCurrentUser();


                if (!sReceiver) {

                    MessageToast.show(
                        "Enter a recipient username."
                    );

                    return;

                }


                if (!sSubject) {

                    MessageToast.show(
                        "Enter a subject."
                    );

                    return;

                }


                if (!sMessage) {

                    MessageToast.show(
                        "Enter a message."
                    );

                    return;

                }


                try {

                    const response =
                        await fetch(
                            "/payment-service/Messages",
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

                                        ID:
                                            crypto.randomUUID(),

                                        senderUserName:
                                            sSender,

                                        receiverUserName:
                                            sReceiver,

                                        subject:
                                            sSubject,

                                        message:
                                            sMessage,

                                        messageType:
                                            "MAIL",

                                        isRead:
                                            false

                                    })

                            }
                        );


                    if (!response.ok) {

                        const errorText =
                            await response.text();

                        console.error(
                            "SEND MAIL ERROR:",
                            errorText
                        );

                        MessageToast.show(
                            "Unable to send mail."
                        );

                        return;

                    }


                    MessageToast.show(
                        "Mail sent successfully."
                    );


                    oDialog.close();

                } catch (error) {

                    console.error(
                        "SEND MAIL ERROR:",
                        error
                    );

                    MessageToast.show(
                        "Unable to send mail."
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

            }

        }

    );

});