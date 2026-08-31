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

    // =====================================================
    // USERS MODEL
    // =====================================================

    this.getView().setModel(
        new JSONModel({
            items: [],
            allItems: []
        }),
        "users"
    );


    // =====================================================
    // GROUPS MODEL
    // =====================================================

    this.getView().setModel(
        new JSONModel({
            items: []
        }),
        "groups"
    );


    // =====================================================
    // CHAT MODEL
    // =====================================================

    this.getView().setModel(
        new JSONModel({

            currentUser:
                this._getCurrentUser(),

            isAdmin:
                this._isAdmin(),

            chatType:
                "DIRECT",

            selectedUserName:
                "",

            selectedFullName:
                "",

            selectedGroupId:
                "",

            selectedGroupName:
                "",

            messages:
                []

        }),
        "chat"
    );


    // =====================================================
    // LOAD DATA
    // =====================================================

    this._loadUsers();

    this._loadGroups();

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
            // IS ADMIN
            // =====================================================

            _isAdmin: function () {

                return (
                    (
                        sessionStorage.getItem("userRole") ||
                        ""
                    )
                        .trim()
                        .toUpperCase() === "ADMIN"
                );

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
                            "$select=ID,userName,fullName,email,role,isActive" +
                            "&$filter=isActive eq true" +
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
                        (
                            Array.isArray(usersData.value)
                                ? usersData.value
                                : []
                        )
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

let chatMessages = [];

try {

    const escapedUser =
        this._escapeODataValue(currentUser);

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

    const messagesUrl =
        "/payment-service/Messages?" +
        "$filter=" +
        encodeURIComponent(chatFilter) +
        "&$orderby=createdAt desc";

    console.log(
        "CHAT MESSAGES URL:",
        messagesUrl
    );

    const messagesResponse =
        await fetch(
            messagesUrl,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

    console.log(
        "CHAT MESSAGES HTTP STATUS:",
        messagesResponse.status
    );

    if (messagesResponse.ok) {

        const messagesData =
            await messagesResponse.json();

        chatMessages =
            Array.isArray(messagesData.value)
                ? messagesData.value
                : [];

        console.log(
            "CHAT MESSAGES:",
            chatMessages
        );

    } else {

        const errorText =
            await messagesResponse.text();

        console.error(
            "CHAT MESSAGES API ERROR:",
            errorText
        );

        // IMPORTANT:
        // Do not prevent users from loading
        // just because there are no messages.
        chatMessages = [];

    }

} catch (messageError) {

    console.error(
        "CHAT MESSAGE LOAD ERROR:",
        messageError
    );

    chatMessages = [];

}

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

            _loadConversation: async function (sender, receiver) {

    try {

        const escapedSender =
            this._escapeODataValue(sender);

        const escapedReceiver =
            this._escapeODataValue(receiver);

        const filter =
            "(" +
            "senderUserName eq '" +
            escapedSender +
            "' and receiverUserName eq '" +
            escapedReceiver +
            "' and messageType eq 'CHAT'" +
            ")" +
            " or " +
            "(" +
            "senderUserName eq '" +
            escapedReceiver +
            "' and receiverUserName eq '" +
            escapedSender +
            "' and messageType eq 'CHAT'" +
            ")";

        const url =
            "/payment-service/Messages?" +
            "$select=ID,senderUserName,receiverUserName,message,paymentId,groupId,subject,messageType,isRead,createdAt" +
            "&$filter=" +
            encodeURIComponent(filter) +
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
                    credentials: "same-origin",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const responseText =
            await response.text();

        console.log(
            "CHAT HTTP STATUS:",
            response.status
        );

        console.log(
            "CHAT RESPONSE:",
            responseText
        );

        if (!response.ok) {

            let errorMessage =
                "HTTP " + response.status;

            try {

                const errorData =
                    JSON.parse(responseText);

                errorMessage =
                    errorData?.error?.message?.value ||
                    errorData?.error?.message ||
                    errorMessage;

            } catch (e) {
                // response was not JSON
            }

            throw new Error(
                errorMessage
            );
        }

        let data = {};

        if (responseText) {

            data =
                JSON.parse(responseText);

        }

        const currentUser =
            this._getCurrentUser();

        const messages =
            (data.value || []).map(
                function (message) {

                    const copy =
                        Object.assign(
                            {},
                            message
                        );

                    copy.isMine =
                        String(
                            copy.senderUserName || ""
                        ).toLowerCase() ===
                        String(
                            currentUser || ""
                        ).toLowerCase();

                    if (copy.createdAt) {

                        copy.displayTime =
                            new Date(
                                copy.createdAt
                            ).toLocaleTimeString(
                                "en-IN",
                                {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                }
                            );

                    } else {

                        copy.displayTime = "";

                    }

                    return copy;

                }
            );

        console.log(
            "CHAT MESSAGES:",
            messages
        );

        this.getView()
            .getModel("chat")
            .setProperty(
                "/messages",
                messages
            );

        this._scrollToBottom();

    } catch (error) {

        console.error(
            "FAILED TO LOAD CONVERSATION:",
            error
        );

        sap.m.MessageBox.error(
            error.message ||
            "Unable to load conversation."
        );

    }

},

            // =====================================================
            // INPUT
            // =====================================================
            onChat: function () {

                const bLoggedIn =
                    !!this._getCurrentUser();


                // ---------------------------------------------
                // USER MUST BE LOGGED IN
                // ---------------------------------------------

                if (!bLoggedIn) {

                    this.getOwnerComponent()
                        .getRouter()
                        .navTo(
                            "Login",
                            {},
                            true
                        );

                    return;
                }


                console.log(
                    "CHAT MENU CLICKED"
                );


                this.getOwnerComponent()
                    .getRouter()
                    .navTo(
                        "Chat"
                    );

            },


            // =====================================================
            // SEND MESSAGE
            // =====================================================

            // =====================================================
            // SEND MESSAGE (dispatcher)
            //
            // Routes to a direct 1:1 message or a group message
            // depending on what is currently selected in the chat
            // model, mirroring how a WhatsApp-style chat works.
            // =====================================================

            onSendMessage: async function () {

                const chatModel =
                    this.getView()
                        .getModel("chat");

                if (!chatModel) {
                    return;
                }

                const chatType =
                    chatModel.getProperty(
                        "/chatType"
                    );

                const selectedGroupId =
                    chatModel.getProperty(
                        "/selectedGroupId"
                    );

                if (
                    chatType === "GROUP" &&
                    selectedGroupId
                ) {

                    return this._sendGroupMessage();

                }

                return this._sendDirectMessage();

            },


            // =====================================================
            // SEND DIRECT (1:1) MESSAGE
            // =====================================================

            _sendDirectMessage: async function () {

    const input =
        this.byId("chatInput");

    const button =
        this.byId("sendChatButton");

    const chatModel =
        this.getView()
            .getModel("chat");

    if (!input || !button || !chatModel) {
        return;
    }


    // =====================================================
    // READ VALUES
    // =====================================================

    const message =
        (
            input.getValue() ||
            ""
        ).trim();

    const sender =
        this._getCurrentUser();

    const receiver =
        chatModel.getProperty(
            "/selectedUserName"
        );


    console.log(
        "========== SEND DIRECT MESSAGE =========="
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


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!sender) {

        MessageBox.error(
            "Unable to identify the logged-in user."
        );

        return;
    }


    if (!receiver) {

        MessageToast.show(
            "Please select a user first."
        );

        return;
    }


    if (!message) {

        return;
    }


    // =====================================================
    // DISABLE BUTTON
    // =====================================================

    button.setEnabled(false);


    try {

        // =================================================
        // GET CSRF TOKEN
        // =================================================

        const tokenResponse =
            await fetch(
                "/payment-service/",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: {
                        "X-CSRF-Token": "Fetch",
                        "Accept":
                            "application/json"
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
                ? "RECEIVED"
                : "NOT RECEIVED"
        );


        // =================================================
        // SEND MESSAGE
        // =================================================

        const headers = {

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        };


        if (csrfToken) {

            headers["X-CSRF-Token"] =
                csrfToken;

        }


        const response =
            await fetch(
                "/payment-service/sendChatMessage",
                {
                    method: "POST",

                    credentials:
                        "same-origin",

                    headers:

                        headers,

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

            } catch (e) {

                console.error(
                    "Invalid JSON response:",
                    responseText
                );

            }

        }


        // =================================================
        // ERROR
        // =================================================

        if (!response.ok) {

            const errorMessage =
                result?.error?.message?.value ||
                result?.error?.message ||
                result?.message ||
                responseText ||
                (
                    "Unable to send message. HTTP " +
                    response.status
                );


            throw new Error(
                errorMessage
            );

        }


        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Unable to send message."
            );

        }


        // =================================================
        // CLEAR INPUT
        // =================================================

        input.setValue("");

        button.setEnabled(false);


        // =================================================
        // ADD MESSAGE IMMEDIATELY TO UI
        // =================================================

        const messages =
            chatModel.getProperty(
                "/messages"
            ) || [];


        messages.push({

            ID:
                "local-" +
                Date.now(),

            senderUserName:
                sender,

            receiverUserName:
                receiver,

            message:
                message,

            messageType:
                "CHAT",

            isRead:
                true,

            isMine:
                true,

            createdAt:
                new Date().toISOString(),

            displayTime:
                new Date().toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

        });


        chatModel.setProperty(
            "/messages",
            messages
        );


        this._scrollToBottom();


        // =================================================
        // REFRESH FROM DATABASE
        // =================================================

        await this._loadConversation(
            sender,
            receiver
        );


        // =================================================
        // REFRESH USER LIST
        // =================================================

        await this._loadUsers();


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
            // SEND GROUP MESSAGE
            // =====================================================

            _sendGroupMessage: async function () {

                const input =
                    this.byId("chatInput");

                const button =
                    this.byId("sendChatButton");

                const chatModel =
                    this.getView()
                        .getModel("chat");

                if (!input || !button || !chatModel) {
                    return;
                }


                // =============================================
                // READ VALUES
                // =============================================

                const message =
                    (
                        input.getValue() ||
                        ""
                    ).trim();

                const sender =
                    this._getCurrentUser();

                const groupId =
                    chatModel.getProperty(
                        "/selectedGroupId"
                    );


                console.log(
                    "========== SEND GROUP MESSAGE =========="
                );

                console.log(
                    "Sender:",
                    sender
                );

                console.log(
                    "Group:",
                    groupId
                );

                console.log(
                    "Message:",
                    message
                );


                // =============================================
                // VALIDATION
                // =============================================

                if (!sender) {

                    MessageBox.error(
                        "Unable to identify the logged-in user."
                    );

                    return;
                }


                if (!groupId) {

                    MessageToast.show(
                        "Please select a group first."
                    );

                    return;
                }


                if (!message) {

                    return;
                }


                button.setEnabled(false);


                try {

                    const csrfToken =
                        await this._getCsrfToken();

                    const headers = {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    };

                    if (csrfToken) {

                        headers["X-CSRF-Token"] =
                            csrfToken;

                    }

                    const response =
                        await fetch(
                            "/payment-service/sendGroupChatMessage",
                            {
                                method: "POST",

                                credentials:
                                    "same-origin",

                                headers:
                                    headers,

                                body:
                                    JSON.stringify({

                                        groupId:
                                            groupId,

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
                        "SEND GROUP MESSAGE STATUS:",
                        response.status
                    );

                    console.log(
                        "SEND GROUP MESSAGE RESPONSE:",
                        responseText
                    );

                    let result = {};

                    if (responseText) {

                        try {

                            result =
                                JSON.parse(
                                    responseText
                                );

                        } catch (e) {

                            console.error(
                                "Invalid JSON response:",
                                responseText
                            );

                        }

                    }

                    if (!response.ok) {

                        throw new Error(
                            result?.error?.message?.value ||
                            result?.error?.message ||
                            result?.message ||
                            responseText ||
                            (
                                "Unable to send message. HTTP " +
                                response.status
                            )
                        );

                    }

                    if (
                        result &&
                        result.success === false
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to send message."
                        );

                    }


                    // =========================================
                    // CLEAR INPUT
                    // =========================================

                    input.setValue("");

                    button.setEnabled(false);


                    // =========================================
                    // REFRESH GROUP CONVERSATION
                    // AND GROUP LIST FROM THE DATABASE
                    // =========================================

                    await this._loadGroupConversation(
                        groupId
                    );

                    await this._loadGroups();

                    MessageToast.show(
                        "Message sent"
                    );

                } catch (error) {

                    console.error(
                        "SEND GROUP CHAT ERROR:",
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

            },

            _loadGroups: async function () {

                try {

                    const currentUser =
                        this._getCurrentUser();

                    const escapedUser =
                        this._escapeODataValue(
                            currentUser
                        );


                    // -------------------------------------------------
                    // Get groups where current user is a member
                    // -------------------------------------------------

                    const memberFilter =
                        "userName eq '" +
                        escapedUser +
                        "' and isActive eq true";


                    const memberResponse =
                        await fetch(
                            "/payment-service/ChatGroupMembers?" +
                            "$filter=" +
                            encodeURIComponent(
                                memberFilter
                            ),
                            {
                                method: "GET",
                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    if (!memberResponse.ok) {

                        throw new Error(
                            "Unable to load group memberships."
                        );

                    }


                    const memberData =
                        await memberResponse.json();


                    const memberships =
                        memberData.value || [];


                    // -------------------------------------------------
                    // Load groups
                    // -------------------------------------------------

                    const groupResponse =
                        await fetch(
                            "/payment-service/ChatGroups?" +
                            "$filter=isActive eq true" +
                            "&$orderby=groupName asc",
                            {
                                method: "GET",
                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    if (!groupResponse.ok) {

                        throw new Error(
                            "Unable to load groups."
                        );

                    }


                    const groupData =
                        await groupResponse.json();


                    const allGroups =
                        groupData.value || [];


                    // -------------------------------------------------
                    // Only groups current user belongs to
                    // -------------------------------------------------

                    const memberGroupIds =
                        memberships.map(
                            function (member) {

                                return member.group_ID;

                            }
                        );


                    const groups =
                        allGroups.filter(
                            function (group) {

                                return memberGroupIds.includes(
                                    group.ID
                                );

                            }
                        );


                    groups.forEach(
                        function (group) {

                            group.unreadCount = 0;

                        }
                    );


                    // -------------------------------------------------
                    // Set model
                    // -------------------------------------------------

                    this.getView()
                        .getModel("groups")
                        .setProperty(
                            "/items",
                            groups
                        );


                    console.log(
                        "CHAT GROUPS:",
                        groups
                    );


                } catch (error) {

                    console.error(
                        "Failed to load groups:",
                        error
                    );

                }

            },

            // =====================================================
// GET CSRF TOKEN
// =====================================================
//
// NOTE: this must always hit the server for a *fresh* token
// (cache: "no-store"), otherwise the browser can replay an
// earlier cached response for the same URL that has no
// X-CSRF-Token header, which used to surface as:
// "CSRF token was not returned by Payment Service."
//
// Also, mirroring the direct-message / create-group flows,
// this no longer hard-fails when a token can't be obtained -
// it just logs a warning and lets the caller proceed without
// the header, exactly like those two flows already do.
// =====================================================

_getCsrfToken: async function () {

    try {

        const response = await fetch(
            "/payment-service/",
            {
                method: "GET",
                headers: {
                    "X-CSRF-Token": "Fetch",
                    "Accept": "application/json"
                },
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (!response.ok) {

            console.warn(
                "Unable to obtain CSRF token. HTTP " +
                response.status
            );

            return null;

        }

        const token =
            response.headers.get("X-CSRF-Token");

        if (!token) {

            console.warn(
                "CSRF token was not returned by Payment Service."
            );

            return null;

        }

        console.log("CSRF TOKEN RECEIVED");

        return token;

    } catch (error) {

        console.warn(
            "CSRF token request failed:",
            error
        );

        return null;

    }

},


          // =====================================================
// LOAD USERS FOR GROUP
// =====================================================

_loadUsersForGroup: async function () {

    try {

        console.log(
            "LOADING USERS FOR GROUP"
        );


        const currentUser =
            this._getCurrentUser();


        const response =
            await fetch(
                "/payment-service/Users?" +
                "$select=userName,fullName,isActive" +
                "&$filter=isActive eq true" +
                "&$orderby=fullName asc",
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const responseText =
            await response.text();


        console.log(
            "GROUP USERS STATUS:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                responseText ||
                "Unable to load users."
            );

        }


        const data =
            responseText
                ? JSON.parse(
                    responseText
                )
                : {};


        const users =
            (data.value || [])
                .filter(
                    function (user) {

                        return (
                            String(
                                user.userName ||
                                ""
                            ).toLowerCase() !==
                            String(
                                currentUser ||
                                ""
                            ).toLowerCase()
                        );

                    }
                );


        const combo =
            this._groupUsersSelect;


        if (!combo) {

            console.error(
                "GROUP USER SELECTOR NOT FOUND"
            );

            return;

        }


        combo.removeAllItems();


        users.forEach(
            function (user) {

                combo.addItem(

                    new sap.ui.core.Item({

                        key:
                            user.userName,

                        text:
                            user.fullName +
                            "  @" +
                            user.userName

                    })

                );

            }
        );


        console.log(
            "GROUP USERS LOADED:",
            users
        );


    } catch (error) {

        console.error(
            "LOAD GROUP USERS ERROR:",
            error
        );


        MessageBox.error(
            error.message ||
            "Unable to load users."
        );

    }

},

          _createGroup: async function () {

    const groupName =
        this._groupNameInput
            ?.getValue()
            ?.trim() || "";


    const description =
        this._groupDescriptionInput
            ?.getValue()
            ?.trim() || "";


    const selectedUsers =
        this._groupUsersSelect
            ?.getSelectedKeys() || [];


    const performedBy =
        this._getCurrentUser();


    console.log(
        "========== CREATE GROUP =========="
    );

    console.log(
        "Group:",
        groupName
    );

    console.log(
        "Description:",
        description
    );

    console.log(
        "Members:",
        selectedUsers
    );

    console.log(
        "Created By:",
        performedBy
    );


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!groupName) {

        MessageBox.error(
            "Please enter a group name."
        );

        return;

    }


    if (!performedBy) {

        MessageBox.error(
            "Unable to identify logged-in user."
        );

        return;

    }


    try {

        // =================================================
        // CSRF
        // =================================================

        const tokenResponse =
            await fetch(
                "/payment-service/",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
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


        const headers = {

            "Content-Type":
                "application/json",

            "Accept":
                "application/json"

        };


        if (csrfToken) {

            headers["X-CSRF-Token"] =
                csrfToken;

        }


        // =================================================
        // CREATE GROUP
        // =================================================

        const response =
            await fetch(
                "/payment-service/createChatGroup",
                {

                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers:
                        headers,

                    body:
                        JSON.stringify({

                            groupName:
                                groupName,

                            description:
                                description,

                            performedBy:
                                performedBy

                        })

                }
            );


        const responseText =
            await response.text();


        console.log(
            "CREATE GROUP STATUS:",
            response.status
        );

        console.log(
            "CREATE GROUP RESPONSE:",
            responseText
        );


        let result = {};


        if (responseText) {

            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch (e) {

                throw new Error(
                    "Invalid server response."
                );

            }

        }


        if (!response.ok) {

            throw new Error(

                result?.error?.message?.value ||
                result?.error?.message ||
                result?.message ||
                responseText ||
                "Unable to create group."

            );

        }


        if (
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Unable to create group."
            );

        }


        const groupId =
            result.groupId;


        if (!groupId) {

            throw new Error(
                "Group was created but no group ID was returned."
            );

        }


        // =================================================
        // ADD MEMBERS
        // =================================================

        let failedMembers = [];


        for (
            const username
            of selectedUsers
        ) {

            try {

                const memberResponse =
                    await fetch(
                        "/payment-service/addChatGroupMember",
                        {

                            method:
                                "POST",

                            credentials:
                                "same-origin",

                            headers:
                                headers,

                            body:
                                JSON.stringify({

                                    groupId:
                                        groupId,

                                    userName:
                                        username,

                                    performedBy:
                                        performedBy

                                })

                        }
                    );


                const memberText =
                    await memberResponse.text();


                let memberResult =
                    {};

                if (memberText) {

                    try {

                        memberResult =
                            JSON.parse(
                                memberText
                            );

                    } catch (e) {

                        memberResult =
                            {};

                    }

                }


                if (
                    !memberResponse.ok ||
                    memberResult.success === false
                ) {

                    failedMembers.push(
                        username
                    );

                }

            } catch (error) {

                failedMembers.push(
                    username
                );

            }

        }


        // =================================================
        // REFRESH GROUPS
        // =================================================

        await this._loadGroups();


        // =================================================
        // CLOSE
        // =================================================

        this._groupDialog.close();


        this._groupNameInput.setValue("");
        this._groupDescriptionInput.setValue("");
        this._groupUsersSelect.removeAllSelectedItems();


        if (failedMembers.length > 0) {

            MessageBox.warning(

                "Group created, but these users could not be added:\n\n" +
                failedMembers.join(", ")

            );

        } else {

            MessageToast.show(
                "Group created successfully."
            );

        }


    } catch (error) {

        console.error(
            "CREATE GROUP ERROR:",
            error
        );


        MessageBox.error(
            error.message ||
            "Unable to create group."
        );

    }

},

            onGroupSelect: async function (oEvent) {

                const context =
                    oEvent.getSource()
                        .getBindingContext("groups");


                if (!context) {
                    return;
                }


                const group =
                    context.getObject();


                const chatModel =
                    this.getView()
                        .getModel("chat");


                // -------------------------------------------------
                // Switch to GROUP mode
                // -------------------------------------------------

                chatModel.setProperty(
                    "/chatType",
                    "GROUP"
                );


                chatModel.setProperty(
                    "/selectedGroupId",
                    group.ID
                );


                chatModel.setProperty(
                    "/selectedGroupName",
                    group.groupName
                );


                // Clear direct-user selection

                chatModel.setProperty(
                    "/selectedUserName",
                    ""
                );


                chatModel.setProperty(
                    "/selectedFullName",
                    ""
                );


                // -------------------------------------------------
                // Load group conversation
                // -------------------------------------------------

                await this._loadGroupConversation(
                    group.ID
                );

            },


           // =====================================================
// DELETE GROUP
// ONLY GROUP CREATOR CAN DELETE
// =====================================================

onDeleteGroupPress: function (oEvent) {

    const context =
        oEvent.getSource()
            .getBindingContext("groups");


    if (!context) {
        return;
    }


    const group =
        context.getObject();


    const currentUser =
        this._getCurrentUser();


    // -------------------------------------------------
    // CREATOR CHECK
    // -------------------------------------------------

    if (
        String(group.createdBy || "")
            .toLowerCase() !==
        String(currentUser || "")
            .toLowerCase()
    ) {

        MessageBox.error(
            "Only the group creator can delete this group."
        );

        return;

    }


    MessageBox.confirm(

        'Delete the group "' +
        group.groupName +
        '"? This cannot be undone.',

        {

            title:
                "Delete Group",

            onClose:
                function (sAction) {

                    if (
                        sAction ===
                        MessageBox.Action.OK
                    ) {

                        this._deleteGroup(
                            group
                        );

                    }

                }.bind(this)

        }

    );

},


            _deleteGroup: async function (group) {

                const performedBy =
                    this._getCurrentUser();

                try {

                    const csrfToken =
                        await this._getCsrfToken();

                    const headers = {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    };

                    if (csrfToken) {

                        headers["X-CSRF-Token"] =
                            csrfToken;

                    }

                    const response =
                        await fetch(
                            "/payment-service/deleteChatGroup",
                            {
                                method: "POST",

                                credentials:
                                    "same-origin",

                                headers:
                                    headers,

                                body:
                                    JSON.stringify({

                                        groupId:
                                            group.ID,

                                        performedBy:
                                            performedBy

                                    })

                            }
                        );

                    const responseText =
                        await response.text();

                    let result = {};

                    if (responseText) {

                        try {

                            result =
                                JSON.parse(
                                    responseText
                                );

                        } catch (e) {

                            console.error(
                                "Invalid delete-group response:",
                                responseText
                            );

                        }

                    }

                    if (!response.ok) {

                        throw new Error(
                            result?.error?.message?.value ||
                            result?.error?.message ||
                            result?.message ||
                            responseText ||
                            (
                                "Unable to delete group. HTTP " +
                                response.status
                            )
                        );

                    }

                    if (
                        result &&
                        result.success === false
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to delete group."
                        );

                    }


                    // =========================================
                    // IF THE DELETED GROUP WAS OPEN,
                    // CLEAR THE CONVERSATION PANEL
                    // =========================================

                    const chatModel =
                        this.getView()
                            .getModel("chat");

                    if (
                        chatModel.getProperty(
                            "/selectedGroupId"
                        ) === group.ID
                    ) {

                        chatModel.setProperty(
                            "/chatType",
                            "DIRECT"
                        );

                        chatModel.setProperty(
                            "/selectedGroupId",
                            ""
                        );

                        chatModel.setProperty(
                            "/selectedGroupName",
                            ""
                        );

                        chatModel.setProperty(
                            "/messages",
                            []
                        );

                    }


                    await this._loadGroups();


                    MessageToast.show(
                        "Group deleted."
                    );


                } catch (error) {

                    console.error(
                        "DELETE GROUP ERROR:",
                        error
                    );

                    MessageBox.error(
                        error.message ||
                        "Unable to delete group."
                    );

                }

            },


            _loadGroupConversation: async function (
                groupId
            ) {

                try {

                    const response =
                        await fetch(
                            "/payment-service/getGroupMessages",
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

                                        groupId:
                                            groupId,

                                        performedBy:
                                            this._getCurrentUser()

                                    })

                            }
                        );


                    const result =
                        await response.json();


                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "Unable to load group messages."
                        );

                    }


                    const messages =
                        JSON.parse(
                            result.messages || "[]"
                        );


                    const currentUser =
                        this._getCurrentUser();


                    messages.forEach(
                        function (message) {

                            message.isMine =
                                String(
                                    message.senderUserName
                                ).toLowerCase() ===
                                String(
                                    currentUser
                                ).toLowerCase();


                            message.displayTime =
                                message.createdAt
                                    ? new Date(
                                        message.createdAt
                                    ).toLocaleTimeString(
                                        "en-IN",
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        }
                                    )
                                    : "";

                        }
                    );


                    this.getView()
                        .getModel("chat")
                        .setProperty(
                            "/messages",
                            messages
                        );


                    setTimeout(
                        function () {

                            this._scrollToBottom();

                        }.bind(this),
                        100
                    );


                } catch (error) {

                    console.error(
                        "GROUP CHAT ERROR:",
                        error
                    );


                    sap.m.MessageBox.error(
                        error.message ||
                        "Unable to load group messages."
                    );

                }

            },

            onChatInputChange: function (oEvent) {

    const input =
        this.byId("chatInput");

    const button =
        this.byId("sendChatButton");

    if (!input || !button) {
        return;
    }

    const value =
        oEvent.getParameter("value") ||
        input.getValue() ||
        "";

    const chatModel =
        this.getView()
            .getModel("chat");

    const selectedUser =
        chatModel.getProperty(
            "/selectedUserName"
        );

    const selectedGroup =
        chatModel.getProperty(
            "/selectedGroupId"
        );

    button.setEnabled(
        value.trim().length > 0 &&
        (
            !!selectedUser ||
            !!selectedGroup
        )
    );

},

onCreateGroup: function () {

    console.log(
        "CREATE GROUP BUTTON CLICKED"
    );


    if (this._groupDialog) {

        this._loadUsersForGroup();

        this._groupDialog.open();

        return;

    }


    const oGroupNameInput =
        new sap.m.Input({

            placeholder:
                "Enter group name",

            width:
                "100%"

        });


    const oDescriptionInput =
        new sap.m.TextArea({

            placeholder:
                "Optional description",

            rows: 3,

            growing: true,

            width:
                "100%"

        });


    const oUsersSelect =
        new sap.m.MultiComboBox({

            width:
                "100%",

            placeholder:
                "Select users"

        });


    this._groupNameInput =
        oGroupNameInput;

    this._groupDescriptionInput =
        oDescriptionInput;

    this._groupUsersSelect =
        oUsersSelect;


    const oContent =
        new sap.m.VBox({

            width:
                "100%",

            items: [

                new sap.m.Label({
                    text:
                        "Group name"
                }),

                oGroupNameInput,


                new sap.m.Label({
                    text:
                        "Description",
                    class:
                        "sapUiSmallMarginTop"
                }),

                oDescriptionInput,


                new sap.m.Label({
                    text:
                        "Members",
                    class:
                        "sapUiSmallMarginTop"
                }),

                oUsersSelect

            ]

        });


    this._groupDialog =
        new sap.m.Dialog({

            title:
                "Create New Group",

            contentWidth:
                "460px",

            stretchOnPhone:
                true,

            content: [

                oContent

            ],

            beginButton:

                new sap.m.Button({

                    text:
                        "Create",

                    icon:
                        "sap-icon://add",

                    type:
                        "Emphasized",

                    press:
                        this._createGroup.bind(
                            this
                        )

                }),

            endButton:

                new sap.m.Button({

                    text:
                        "Cancel",

                    press:
                        function () {

                            this._groupDialog.close();

                        }.bind(this)

                })

        });


    this.getView()
        .addDependent(
            this._groupDialog
        );


    this._loadUsersForGroup();


    this._groupDialog.open();

},

        }

    );

});