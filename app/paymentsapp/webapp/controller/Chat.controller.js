sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (
    Controller,
    JSONModel,
    MessageToast,
    MessageBox
) {

    "use strict";

    return Controller.extend(
        "paymentsapp.controller.Chat",
        {

            // =====================================================
            // INIT
            // =====================================================

            onInit: function () {

                this.getView().setModel(
                    new JSONModel({
                        items: [],
                        allItems: []
                    }),
                    "users"
                );


                this.getView().setModel(
                    new JSONModel({

                        currentUser:
                            this._getCurrentUser(),

                        selectedUserName: "",

                        selectedFullName: "",

                        messages: []

                    }),
                    "chat"
                );


                this._loadUsers();

            },


            // =====================================================
            // CURRENT USER
            // =====================================================

            _getCurrentUser: function () {

                return (
                    sessionStorage.getItem("username") ||
                    sessionStorage.getItem("userName") ||
                    ""
                ).trim();

            },


            // =====================================================
            // ODATA ESCAPE
            // =====================================================

            _escapeODataValue: function (sValue) {

                return String(
                    sValue || ""
                ).replace(
                    /'/g,
                    "''"
                );

            },


            // =====================================================
            // LOAD USERS
            // =====================================================

            _loadUsers: async function () {

                try {

                    const currentUser =
                        this._getCurrentUser();

                    // -------------------------------------------------
                    // LOAD ACTIVE USERS
                    // -------------------------------------------------

                    const usersResponse =
                        await fetch(
                            "/payment-service/Users?" +
                            "$filter=isActive eq true" +
                            "&$orderby=fullName asc",
                            {
                                method: "GET",
                                headers: {
                                    "Accept": "application/json"
                                }
                            }
                        );

                    if (!usersResponse.ok) {
                        throw new Error(
                            "Unable to load users."
                        );
                    }

                    const usersData =
                        await usersResponse.json();

                    const users =
                        (usersData.value || [])
                            .filter(function (user) {

                                return (
                                    String(
                                        user.userName
                                    ).toLowerCase() !==
                                    String(
                                        currentUser
                                    ).toLowerCase()
                                );

                            });


                    // -------------------------------------------------
                    // LOAD ALL CHAT MESSAGES FOR CURRENT USER
                    // -------------------------------------------------

                    const escapedUser =
                        this._escapeODataValue(
                            currentUser
                        );

                    const chatFilter =
                        "(" +
                        "senderUserName eq '" +
                        escapedUser +
                        "'" +
                        " or " +
                        "receiverUserName eq '" +
                        escapedUser +
                        "'" +
                        ")" +
                        " and messageType eq 'CHAT'";


                    const messagesResponse =
                        await fetch(
                            "/payment-service/Messages?" +
                            "$filter=" +
                            encodeURIComponent(
                                chatFilter
                            ) +
                            "&$orderby=createdAt desc",
                            {
                                method: "GET",
                                headers: {
                                    "Accept": "application/json"
                                }
                            }
                        );


                    if (!messagesResponse.ok) {
                        throw new Error(
                            "Unable to load chat messages."
                        );
                    }


                    const messagesData =
                        await messagesResponse.json();

                    const chatMessages =
                        messagesData.value || [];


                    // -------------------------------------------------
                    // BUILD USER CHAT SUMMARY
                    // -------------------------------------------------

                    users.forEach(function (user) {

                        const username =
                            String(
                                user.userName
                            ).toLowerCase();


                        const conversationMessages =
                            chatMessages.filter(
                                function (message) {

                                    const sender =
                                        String(
                                            message.senderUserName || ""
                                        ).toLowerCase();

                                    const receiver =
                                        String(
                                            message.receiverUserName || ""
                                        ).toLowerCase();

                                    return (
                                        sender === username ||
                                        receiver === username
                                    );

                                }
                            );


                        // ---------------------------------------------
                        // UNREAD COUNT
                        // ---------------------------------------------

                        const unreadCount =
                            conversationMessages.filter(
                                function (message) {

                                    return (
                                        String(
                                            message.receiverUserName || ""
                                        ).toLowerCase() ===
                                        String(
                                            currentUser
                                        ).toLowerCase()
                                        &&
                                        message.isRead === false
                                    );

                                }
                            ).length;


                        // ---------------------------------------------
                        // LAST MESSAGE
                        // ---------------------------------------------

                        const lastMessage =
                            conversationMessages.length > 0
                                ? conversationMessages[0]
                                : null;


                        user.unreadCount =
                            unreadCount;


                        user.hasUnread =
                            unreadCount > 0;


                        user.lastMessage =
                            lastMessage
                                ? String(
                                    lastMessage.message || ""
                                )
                                : "No messages yet";


                        user.lastMessageTime =
                            lastMessage &&
                                lastMessage.createdAt
                                ? new Date(
                                    lastMessage.createdAt
                                ).toLocaleTimeString(
                                    "en-IN",
                                    {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    }
                                )
                                : "";


                        user.lastMessageDate =
                            lastMessage &&
                                lastMessage.createdAt
                                ? new Date(
                                    lastMessage.createdAt
                                ).toLocaleDateString(
                                    "en-IN",
                                    {
                                        day: "2-digit",
                                        month: "short"
                                    }
                                )
                                : "";

                    });


                    // -------------------------------------------------
                    // SORT
                    // USERS WITH UNREAD MESSAGES FIRST
                    // -------------------------------------------------

                    users.sort(
                        function (a, b) {

                            if (
                                a.unreadCount > 0 &&
                                b.unreadCount === 0
                            ) {
                                return -1;
                            }

                            if (
                                a.unreadCount === 0 &&
                                b.unreadCount > 0
                            ) {
                                return 1;
                            }

                            return (
                                String(
                                    a.fullName || ""
                                ).localeCompare(
                                    String(
                                        b.fullName || ""
                                    )
                                )
                            );

                        }
                    );


                    // -------------------------------------------------
                    // SET MODEL
                    // -------------------------------------------------

                    const oUsersModel =
                        this.getView()
                            .getModel("users");


                    oUsersModel.setProperty(
                        "/allItems",
                        users
                    );


                    oUsersModel.setProperty(
                        "/items",
                        users
                    );


                    console.log(
                        "CHAT USERS WITH COUNTS:",
                        users
                    );


                } catch (error) {

                    console.error(
                        "Failed to load chat users:",
                        error
                    );


                    MessageBox.error(
                        error.message ||
                        "Unable to load chat users."
                    );

                }

            },

            // =====================================================
            // LOAD UNREAD CHAT COUNTS
            // =====================================================

            _loadUnreadCounts: async function () {

                try {

                    const currentUser =
                        this._getCurrentUser();

                    if (!currentUser) {
                        return;
                    }

                    const escapedUser =
                        this._escapeODataValue(currentUser);

                    const filter =
                        "receiverUserName eq '" +
                        escapedUser +
                        "' and " +
                        "isRead eq false and " +
                        "messageType eq 'CHAT'";

                    const url =
                        "/payment-service/Messages?$filter=" +
                        encodeURIComponent(filter);

                    console.log(
                        "UNREAD CHAT REQUEST:",
                        url
                    );

                    const response =
                        await fetch(url, {
                            method: "GET",
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        });

                    if (!response.ok) {

                        throw new Error(
                            "HTTP " + response.status
                        );

                    }

                    const data =
                        await response.json();

                    const unreadMessages =
                        data.value || [];

                    console.log(
                        "UNREAD CHAT MESSAGES:",
                        unreadMessages
                    );


                    // ---------------------------------------------
                    // Count messages by sender
                    // ---------------------------------------------

                    const counts = {};

                    unreadMessages.forEach(
                        function (message) {

                            const sender =
                                String(
                                    message.senderUserName || ""
                                ).toLowerCase();

                            if (!sender) {
                                return;
                            }

                            counts[sender] =
                                (counts[sender] || 0) + 1;

                        }
                    );


                    // ---------------------------------------------
                    // Update users
                    // ---------------------------------------------

                    const model =
                        this.getView()
                            .getModel("users");

                    const users =
                        model.getProperty("/allItems") || [];

                    const updatedUsers =
                        users.map(
                            function (user) {

                                const username =
                                    String(
                                        user.userName || ""
                                    ).toLowerCase();

                                const count =
                                    counts[username] || 0;

                                return Object.assign(
                                    {},
                                    user,
                                    {
                                        unreadCount: count,
                                        hasUnread: count > 0
                                    }
                                );

                            }
                        );


                    model.setProperty(
                        "/allItems",
                        updatedUsers
                    );

                    model.setProperty(
                        "/items",
                        updatedUsers
                    );


                } catch (error) {

                    console.error(
                        "Failed to load unread chat counts:",
                        error
                    );

                }

            },

            // =====================================================
            // SEARCH
            // =====================================================

            onUserSearch: function (oEvent) {

                const searchValue =
                    (
                        oEvent.getParameter(
                            "newValue"
                        ) || ""
                    )
                        .trim()
                        .toLowerCase();


                const oUsersModel =
                    this.getView()
                        .getModel("users");

                const allUsers =
                    oUsersModel.getProperty(
                        "/allItems"
                    ) || [];


                const filtered =
                    allUsers.filter(
                        function (user) {

                            const username =
                                String(
                                    user.userName || ""
                                ).toLowerCase();


                            const fullName =
                                String(
                                    user.fullName || ""
                                ).toLowerCase();


                            return (
                                username.includes(
                                    searchValue
                                )
                                ||
                                fullName.includes(
                                    searchValue
                                )
                            );

                        }
                    );

                oUsersModel.setProperty(
                    "/items",
                    filtered
                );

            },


            // =====================================================
            // SELECT USER
            // =====================================================

            onUserSelect: async function (oEvent) {

                const context =
                    oEvent.getSource()
                        .getBindingContext("users");


                if (!context) {
                    return;
                }


                const user =
                    context.getObject();


                const username =
                    user.userName;


                // -------------------------------------------------
                // SET SELECTED USER
                // -------------------------------------------------

                const chatModel =
                    this.getView()
                        .getModel("chat");


                chatModel.setProperty(
                    "/selectedUserName",
                    username
                );


                chatModel.setProperty(
                    "/selectedFullName",
                    user.fullName
                );


                // -------------------------------------------------
                // MARK THIS CONVERSATION AS READ
                // -------------------------------------------------

                await this._markConversationAsRead(
                    username
                );


                // -------------------------------------------------
                // LOAD CONVERSATION
                // -------------------------------------------------

                await this._loadConversation(
                    this._getCurrentUser(),
                    username
                );


                // -------------------------------------------------
                // REFRESH USER LIST
                // -------------------------------------------------

                await this._loadUsers();

            },

            // =====================================================
            // MARK CHAT CONVERSATION AS READ
            // =====================================================

            _markConversationAsRead: async function (
                otherUser
            ) {

                try {

                    const currentUser =
                        this._getCurrentUser();


                    const escapedCurrentUser =
                        this._escapeODataValue(
                            currentUser
                        );


                    const escapedOtherUser =
                        this._escapeODataValue(
                            otherUser
                        );


                    const filter =
                        "senderUserName eq '" +
                        escapedOtherUser +
                        "'" +
                        " and receiverUserName eq '" +
                        escapedCurrentUser +
                        "'" +
                        " and isRead eq false" +
                        " and messageType eq 'CHAT'";


                    const response =
                        await fetch(
                            "/payment-service/Messages?" +
                            "$filter=" +
                            encodeURIComponent(
                                filter
                            ),
                            {
                                method: "GET",
                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    if (!response.ok) {
                        return;
                    }


                    const data =
                        await response.json();


                    const unreadMessages =
                        data.value || [];


                    // -------------------------------------------------
                    // MARK EACH MESSAGE AS READ
                    // -------------------------------------------------

                    for (
                        const message of unreadMessages
                    ) {

                        await fetch(
                            "/payment-service/Messages(" +
                            message.ID +
                            ")",
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        isRead: true
                                    })
                            }
                        );

                    }


                    console.log(
                        "CHAT MESSAGES MARKED READ:",
                        unreadMessages.length
                    );


                } catch (error) {

                    console.error(
                        "Unable to mark chat as read:",
                        error
                    );

                }

            },
            // =====================================================
            // LOAD CONVERSATION
            // =====================================================

            _loadConversation: async function (
                sender,
                receiver
            ) {

                try {

                    const escapedSender =
                        this._escapeODataValue(
                            sender
                        );


                    const escapedReceiver =
                        this._escapeODataValue(
                            receiver
                        );


                    const filter =
                        "(" +
                        "senderUserName eq '" +
                        escapedSender +
                        "' and receiverUserName eq '" +
                        escapedReceiver +
                        "'" +
                        ")" +
                        " or " +
                        "(" +
                        "senderUserName eq '" +
                        escapedReceiver +
                        "' and receiverUserName eq '" +
                        escapedSender +
                        "'" +
                        ")";


                    const url =
                        "/payment-service/Messages?" +
                        "$filter=" +
                        encodeURIComponent(
                            filter
                        ) +
                        "&$orderby=createdAt asc";


                    console.log(
                        "CHAT REQUEST:",
                        url
                    );


                    const response =
                        await fetch(
                            url,
                            {
                                method: "GET",
                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    if (!response.ok) {

                        const errorText =
                            await response.text();

                        console.error(
                            "Conversation request failed:",
                            response.status,
                            errorText
                        );

                        throw new Error(
                            "HTTP " +
                            response.status
                        );

                    }


                    const data =
                        await response.json();


                    const currentUser =
                        this._getCurrentUser();


                    const messages =
                        (data.value || [])
                            .filter(function (message) {

                                return (
                                    message.messageType ===
                                    "CHAT"
                                );

                            })
                            .map(function (message) {

                                const copy =
                                    Object.assign(
                                        {},
                                        message
                                    );


                                if (
                                    copy.createdAt
                                ) {

                                    copy.displayTime =
                                        new Date(
                                            copy.createdAt
                                        ).toLocaleTimeString(
                                            "en-IN",
                                            {
                                                hour:
                                                    "2-digit",
                                                minute:
                                                    "2-digit"
                                            }
                                        );

                                }


                                copy.isMine =
                                    String(
                                        copy.senderUserName
                                    ).toLowerCase() ===
                                    String(
                                        currentUser
                                    ).toLowerCase();


                                return copy;

                            });


                    this.getView()
                        .getModel("chat")
                        .setProperty(
                            "/messages",
                            messages
                        );


                    this._scrollToBottom();


                } catch (error) {

                    console.error(
                        "Failed to load conversation:",
                        error
                    );


                    MessageBox.error(
                        "Unable to load conversation."
                    );

                }

            },


            // =====================================================
            // INPUT
            // =====================================================

            onChatInputChange: function (oEvent) {

                const value =
                    oEvent.getParameter(
                        "value"
                    ) || "";


                const button =
                    this.byId(
                        "sendChatButton"
                    );


                if (button) {

                    button.setEnabled(
                        value.trim().length > 0
                    );

                }

            },


            // =====================================================
            // SEND MESSAGE
            // =====================================================

            onSendMessage: async function () {

                const input =
                    this.byId(
                        "chatInput"
                    );


                const button =
                    this.byId(
                        "sendChatButton"
                    );


                const message =
                    (
                        input.getValue() ||
                        ""
                    ).trim();


                const sender =
                    this._getCurrentUser();


                const receiver =
                    this.getView()
                        .getModel("chat")
                        .getProperty(
                            "/selectedUserName"
                        );


                console.log(
                    "CHAT SEND:"
                );

                console.log(
                    "Sender:",
                    sender
                );

                console.log(
                    "Receiver:",
                    receiver
                );

                console.log(
                    "Message:",
                    message
                );


                if (!sender) {

                    MessageBox.error(
                        "Unable to identify the logged-in user."
                    );

                    return;

                }


                if (!receiver) {

                    MessageToast.show(
                        "Please select a user."
                    );

                    return;

                }


                if (!message) {
                    return;
                }


                button.setEnabled(false);


                try {

                    // ---------------------------------------------
                    // Get CSRF token
                    // ---------------------------------------------

                    const tokenResponse =
                        await fetch(
                            "/payment-service/",
                            {
                                method: "GET",
                                headers: {
                                    "X-CSRF-Token":
                                        "Fetch"
                                }
                            }
                        );


                    const csrfToken =
                        tokenResponse.headers.get(
                            "X-CSRF-Token"
                        );


                    console.log(
                        "CSRF TOKEN:",
                        csrfToken
                            ? "received"
                            : "not returned"
                    );


                    // ---------------------------------------------
                    // Call CAP action
                    // ---------------------------------------------

                    const response =
                        await fetch(
                            "/payment-service/sendChatMessage",
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json",

                                    ...(csrfToken
                                        ? {
                                            "X-CSRF-Token":
                                                csrfToken
                                        }
                                        : {})

                                },

                                body:
                                    JSON.stringify({

                                        receiverUserName:
                                            receiver,

                                        message:
                                            message,

                                        performedBy:
                                            sender

                                    })

                            }
                        );


                    const responseText =
                        await response.text();


                    console.log(
                        "SEND HTTP STATUS:",
                        response.status
                    );


                    console.log(
                        "SEND RESPONSE:",
                        responseText
                    );


                    let result = {};

                    if (responseText) {

                        try {

                            result =
                                JSON.parse(
                                    responseText
                                );

                        } catch (parseError) {

                            console.error(
                                "Response is not JSON:",
                                responseText
                            );

                        }

                    }


                    if (!response.ok) {

                        console.error(
                            "CHAT BACKEND ERROR:",
                            {
                                status: response.status,
                                response: responseText,
                                parsed: result
                            }
                        );

                        const backendError =
                            result?.error?.message?.value ||
                            result?.error?.message ||
                            result?.message ||
                            responseText ||
                            `Unable to send message. HTTP ${response.status}`;

                        throw new Error(
                            backendError
                        );
                    }


                    if (
                        result.success === false
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to send message."
                        );

                    }


                    // ---------------------------------------------
                    // Clear input
                    // ---------------------------------------------

                    input.setValue("");


                    button.setEnabled(false);


                    // ---------------------------------------------
                    // Reload conversation
                    // ---------------------------------------------

                    await this._loadConversation(
                        sender,
                        receiver
                    );


                    MessageToast.show(
                        "Message sent"
                    );


                } catch (error) {

                    console.error(
                        "SEND CHAT ERROR:",
                        error
                    );


                    MessageBox.error(
                        error.message ||
                        "Unable to send message."
                    );


                    button.setEnabled(
                        message.length > 0
                    );

                }

            },


            // =====================================================
            // SCROLL
            // =====================================================

            _scrollToBottom: function () {

                setTimeout(
                    function () {

                        const scroll =
                            this.byId(
                                "chatScroll"
                            );


                        if (scroll) {

                            scroll.scrollTo(
                                0,
                                999999,
                                300
                            );

                        }

                    }.bind(this),
                    100
                );

            }

        }

    );

});