const cds = require('@sap/cds');

const {
    SELECT,
    INSERT,
    UPDATE,
    DELETE
} = cds.ql;

module.exports = cds.service.impl(async function () {

  const {
    Users,
    Payments,
    UserLogs,
    Messages,
    ChatGroups,
    ChatGroupMembers
} = this.entities;


    // =========================================================
    // HELPER - GET ACTOR DETAILS
    // =========================================================

    async function getActorDetails(userName) {

        if (!userName) {

            return {
                userName: 'SYSTEM',
                fullName: 'System',
                role: 'SYSTEM'
            };

        }

        const user =
            await SELECT.one
                .from(Users)
                .where({
                    userName: userName
                });

        if (!user) {

            return {
                userName: userName,
                fullName: userName,
                role: 'UNKNOWN'
            };

        }

        return {
            userName: user.userName,
            fullName: user.fullName,
            role: user.role
        };
    }


    // =========================================================
    // HELPER - CREATE USER LOG
    // =========================================================

    async function writeUserLog({
        userName,
        fullName,
        role,
        action,
        module,
        status,
        details
    }) {

        await INSERT
            .into(UserLogs)
            .entries({

                ID:
                    cds.utils.uuid(),

                userName:
                    userName || 'SYSTEM',

                fullName:
                    fullName || userName || 'System',

                role:
                    role || 'SYSTEM',

                action:
                    action,

                module:
                    module,

                status:
                    status,

                details:
                    details,

                createdAt:
                    new Date()

            });
    }


    // =========================================================
// HELPER - CREATE INTERNAL MESSAGE
// =========================================================

async function createInternalMessage({
    senderUserName,
    receiverUserName,
    paymentId,
    subject,
    message,
    messageType
}) {

    if (!receiverUserName) {

        console.warn(
            "MESSAGE NOT CREATED: receiverUserName missing"
        );

        return;
    }

    try {

        const oEntry = {

            ID:
                cds.utils.uuid(),

            senderUserName:
                senderUserName || "SYSTEM",

            receiverUserName:
                receiverUserName,

            subject:
                subject || "Message",

            message:
                message || "",

            messageType:
                messageType || "SYSTEM",

            isRead:
                false

        };

        // Link message to payment only when available
        if (paymentId) {

            oEntry.paymentId =
                paymentId;

        }

        await INSERT
            .into(Messages)
            .entries(oEntry);

        console.log(
            "MESSAGE CREATED:",
            oEntry.senderUserName,
            "->",
            oEntry.receiverUserName,
            "| paymentId:",
            oEntry.paymentId || "none"
        );

    } catch (error) {

        console.error(
            "MESSAGE CREATION ERROR:",
            error
        );

        // Don't break payment creation
        // if message creation fails.
    }
}
    // =========================================================
    // LOGIN
    // =========================================================

    this.on('login', async (req) => {

        const {
            userName,
            password
        } = req.data;


        const user =
            await SELECT.one
                .from(Users)
                .where({
                    userName: userName
                });


        if (!user) {

            await writeUserLog({

                userName:
                    userName,

                fullName:
                    '-',

                role:
                    '-',

                action:
                    'Login',

                module:
                    'Authentication',

                status:
                    'Failed',

                details:
                    'Invalid username or password'

            });


            return {

                success:
                    false,

                username:
                    userName,

                fullName:
                    '',

                role:
                    '',

                message:
                    'Invalid username or password'

            };
        }


        if (!user.isActive) {

            await writeUserLog({

                userName:
                    user.userName,

                fullName:
                    user.fullName,

                role:
                    user.role,

                action:
                    'Login',

                module:
                    'Authentication',

                status:
                    'Failed',

                details:
                    'User account is inactive'

            });


            return {

                success:
                    false,

                username:
                    user.userName,

                fullName:
                    user.fullName,

                role:
                    user.role,

                message:
                    'User account is inactive'

            };
        }


        if (
            user.password !== password
        ) {

            await writeUserLog({

                userName:
                    user.userName,

                fullName:
                    user.fullName,

                role:
                    user.role,

                action:
                    'Login',

                module:
                    'Authentication',

                status:
                    'Failed',

                details:
                    'Invalid username or password'

            });


            return {

                success:
                    false,

                username:
                    user.userName,

                fullName:
                    user.fullName,

                role:
                    user.role,

                message:
                    'Invalid username or password'

            };
        }


        await writeUserLog({

            userName:
                user.userName,

            fullName:
                user.fullName,

            role:
                user.role,

            action:
                'Login',

            module:
                'Authentication',

            status:
                'Success',

            details:
                'Successful login'

        });


        return {

            success:
                true,

            username:
                user.userName,

            fullName:
                user.fullName,

            role:
                user.role,

            message:
                'Login successful'

        };
    });


    // =========================================================
    // CREATE USER
    // =========================================================

    this.on('createUser', async (req) => {

        const {
            userName,
            fullName,
            email,
            password,
            role,
            isActive,
            performedBy
        } = req.data;


        const existingUser =
            await SELECT.one
                .from(Users)
                .where({
                    userName:
                        userName
                });


        if (existingUser) {

            return {

                success:
                    false,

                message:
                    'User already exists'

            };
        }


        const actor =
            await getActorDetails(
                performedBy
            );


        const userId =
            cds.utils.uuid();


        await INSERT
            .into(Users)
            .entries({

                ID:
                    userId,

                userName:
                    userName,

                fullName:
                    fullName,

                email:
                    email,

                password:
                    password,

                role:
                    role,

                isActive:
                    isActive

            });


        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Create',

            module:
                'Users',

            status:
                'Success',

            details:
                `New user ${userName} created`

        });


        return {

            success:
                true,

            message:
                'User created successfully'

        };
    });


    // =========================================================
    // APPROVE PAYMENT
    // =========================================================

    this.on('approvePayment', async (req) => {

        const {
            paymentId,
            performedBy
        } = req.data;


        // -----------------------------------------------------
        // Find payment
        // -----------------------------------------------------

        const payment =
            await SELECT.one
                .from(Payments)
                .where({
                    ID:
                        paymentId
                });


        if (!payment) {

            return req.reject(
                404,
                'Payment not found'
            );
        }


        // -----------------------------------------------------
        // Check payment status
        // -----------------------------------------------------

        if (
            payment.status !==
            'PENDING_APPROVAL'
        ) {

            return req.reject(
                400,
                'Payment is not pending approval'
            );
        }


        // -----------------------------------------------------
        // Get admin/user performing action
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Update payment
        // -----------------------------------------------------

        await UPDATE(Payments)
            .set({

                status:
                    'APPROVED'

            })
            .where({

                ID:
                    paymentId

            });


        // -----------------------------------------------------
        // Create User Log
        // -----------------------------------------------------

        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Approve',

            module:
                'Approvals',

            status:
                'Success',

            details:
                `Payment ${payment.paymentReference} approved`

        });


        // -----------------------------------------------------
        // Create internal message
        // -----------------------------------------------------

        // -----------------------------------------------------
// Create internal message
// -----------------------------------------------------

// -----------------------------------------------------
// CREATE MESSAGE FOR PAYMENT CREATOR
// -----------------------------------------------------

const paymentCreator =
    payment.createdByUserName;


console.log(
    "========== APPROVAL MESSAGE =========="
);

console.log(
    "Payment:",
    payment.paymentReference
);

console.log(
    "Payment Creator:",
    paymentCreator
);

console.log(
    "Approved By:",
    actor.userName
);


if (!paymentCreator) {

    console.warn(
        `No createdByUserName found for payment ${payment.paymentReference}`
    );

} else {

    await createInternalMessage({

    senderUserName:
        actor.userName,

    receiverUserName:
        payment.createdByUserName,

    paymentId:
        payment.ID,

    subject:
        `Payment ${payment.paymentReference} approved`,

    message:
        `Your payment ${payment.paymentReference} has been approved successfully.`,

    messageType:
        "PAYMENT_APPROVED"
});

    console.log(
        `Approval message sent to ${paymentCreator}`
    );

}


        return {

            success:
                true,

            message:
                'Payment approved successfully'

        };
    });


    // =========================================================
    // REJECT PAYMENT
    // =========================================================

    this.on('rejectPayment', async (req) => {

        const {
            paymentId,
            reason,
            performedBy
        } = req.data;


        // -----------------------------------------------------
        // Find payment
        // -----------------------------------------------------

        const payment =
            await SELECT.one
                .from(Payments)
                .where({
                    ID:
                        paymentId
                });


        if (!payment) {

            return req.reject(
                404,
                'Payment not found'
            );
        }


        // -----------------------------------------------------
        // Check payment status
        // -----------------------------------------------------

        if (
            payment.status !==
            'PENDING_APPROVAL'
        ) {

            return req.reject(
                400,
                'Payment is not pending approval'
            );
        }


        // -----------------------------------------------------
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Update payment
        // -----------------------------------------------------

        await UPDATE(Payments)
            .set({

                status:
                    'REJECTED',

                rejectionReason:
                    reason || null

            })
            .where({

                ID:
                    paymentId

            });


        // -----------------------------------------------------
        // Create User Log
        // -----------------------------------------------------

        let logDetails =
            `Payment ${payment.paymentReference} rejected`;


        if (reason) {

            logDetails +=
                ` - Reason: ${reason}`;

        }


        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Reject',

            module:
                'Approvals',

            status:
                'Success',

            details:
                logDetails

        });


        // -----------------------------------------------------
        // Create internal message
        // -----------------------------------------------------

        if (
            payment.createdByUserName
        ) {

        await createInternalMessage({

    senderUserName:
        actor.userName,

    receiverUserName:
        payment.createdByUserName,

    paymentId:
        payment.ID,

    subject:
        `Payment ${payment.paymentReference} rejected`,

    message:
        `Your payment ${payment.paymentReference} has been rejected.`
        + (
            reason
                ? ` Reason: ${reason}`
                : ""
        ),

    messageType:
        "PAYMENT_REJECTED"
});

        }


        return {

            success:
                true,

            message:
                'Payment rejected successfully'

        };
    });

    // =========================================================
// BULK APPROVE PAYMENTS
// =========================================================

this.on('bulkApprovePayments', async (req) => {

    const {
        paymentIds,
        performedBy
    } = req.data;


    // ---------------------------------------------------------
    // Validate input
    // ---------------------------------------------------------

    if (!paymentIds) {

        return {
            success: false,
            totalSelected: 0,
            successful: 0,
            failed: 0,
            message: 'No payments selected'
        };

    }


    // ---------------------------------------------------------
    // Convert paymentIds into array
    //
    // UI will normally send:
    //
    // ["id1","id2","id3"]
    //
    // We also support comma-separated IDs just in case.
    // ---------------------------------------------------------

    let ids = [];

    try {

        if (typeof paymentIds === 'string') {

            const trimmed = paymentIds.trim();

            if (trimmed.startsWith('[')) {

                ids = JSON.parse(trimmed);

            } else {

                ids = trimmed
                    .split(',')
                    .map(id => id.trim())
                    .filter(Boolean);

            }

        } else if (Array.isArray(paymentIds)) {

            ids = paymentIds;

        }

    } catch (error) {

        return {
            success: false,
            totalSelected: 0,
            successful: 0,
            failed: 0,
            message: 'Invalid payment IDs'
        };

    }


    // ---------------------------------------------------------
    // Remove duplicate IDs
    // ---------------------------------------------------------

    ids = [
        ...new Set(
            ids
                .map(id => String(id).trim())
                .filter(Boolean)
        )
    ];


    if (ids.length === 0) {

        return {
            success: false,
            totalSelected: 0,
            successful: 0,
            failed: 0,
            message: 'No valid payments selected'
        };

    }


    // ---------------------------------------------------------
    // Get administrator performing the action
    // ---------------------------------------------------------

    const actor =
        await getActorDetails(performedBy);


    let successful = 0;
    let failed = 0;

    const errors = [];


    // ---------------------------------------------------------
    // Process each payment
    // ---------------------------------------------------------

    for (const paymentId of ids) {

        try {

            // -------------------------------------------------
            // Find payment
            // -------------------------------------------------

            const payment =
                await SELECT.one
                    .from(Payments)
                    .where({
                        ID: paymentId
                    });


            if (!payment) {

                failed++;

                errors.push(
                    `${paymentId}: Payment not found`
                );

                continue;

            }


            // -------------------------------------------------
            // Only PENDING_APPROVAL can be approved
            // -------------------------------------------------

            if (
                payment.status !==
                'PENDING_APPROVAL'
            ) {

                failed++;

                errors.push(
                    `${payment.paymentReference}: Payment is not pending approval`
                );

                continue;

            }


            // -------------------------------------------------
            // Update payment
            // -------------------------------------------------

            await UPDATE(Payments)
                .set({
                    status: 'APPROVED'
                })
                .where({
                    ID: paymentId
                });


            // -------------------------------------------------
            // Create User Log
            // -------------------------------------------------

            await writeUserLog({

                userName:
                    actor.userName,

                fullName:
                    actor.fullName,

                role:
                    actor.role,

                action:
                    'Approve',

                module:
                    'Approvals',

                status:
                    'Success',

                details:
                    `Payment ${payment.paymentReference} approved through bulk approval`

            });


            // -------------------------------------------------
            // Send internal message to payment creator
            // -------------------------------------------------

            if (payment.createdByUserName) {

                await createInternalMessage({

                    senderUserName:
                        actor.userName,

                    receiverUserName:
                        payment.createdByUserName,

                    paymentId:
                        payment.ID,

                    subject:
                        `Payment ${payment.paymentReference} approved`,

                    message:
                        `Your payment ${payment.paymentReference} has been approved successfully.`,

                    messageType:
                        'PAYMENT_APPROVED'

                });

            }


            // -------------------------------------------------
            // Count success
            // -------------------------------------------------

            successful++;


            console.log(
                `BULK APPROVED: ${payment.paymentReference}`
            );


        } catch (error) {

            failed++;

            errors.push(
                `${paymentId}: ${error.message}`
            );


            console.error(
                `BULK APPROVAL ERROR for ${paymentId}:`,
                error
            );

        }

    }


    // ---------------------------------------------------------
    // Final response
    // ---------------------------------------------------------

    let message =
        `${successful} payment(s) approved successfully`;


    if (failed > 0) {

        message +=
            `. ${failed} payment(s) failed.`;

    }


    return {

        success:
            failed === 0,

        totalSelected:
            ids.length,

        successful:
            successful,

        failed:
            failed,

        message:
            message

    };

});

    // =========================================================
    // CREATE PAYMENT
    // =========================================================

    this.on('createPayment', async (req) => {

        const {
            paymentReference,
            companyCode,
            debtorAccount,
            creditorAccount,
            amount,
            currency,
            paymentMethod,
            paymentDate,
            performedBy
        } = req.data;


        const actor =
            await getActorDetails(
                performedBy
            );


        const paymentId =
            cds.utils.uuid();


        await INSERT
            .into(Payments)
            .entries({

                ID:
                    paymentId,

                paymentReference:
                    paymentReference,

                companyCode:
                    companyCode,

                debtorAccount:
                    debtorAccount,

                creditorAccount:
                    creditorAccount,

                amount:
                    amount,

                currency:
                    currency,

                paymentMethod:
                    paymentMethod,

                paymentDate:
                    paymentDate,

                status:
                    'PENDING_APPROVAL',

                // IMPORTANT
                // This connects the payment to the
                // internal application User ID.

                createdByUserName:
                    performedBy

            });


            // =====================================================
// NOTIFY ADMIN ABOUT NEW PAYMENT
// =====================================================

await createInternalMessage({

    senderUserName:
        actor.userName,

    receiverUserName:
        "admin",

    paymentId:
        paymentId,

    subject:
        `New payment ${paymentReference} requires approval`,

    message:
        `Payment ${paymentReference} requires approval.`,

    messageType:
        "PAYMENT_PENDING_APPROVAL"
});


        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Create',

            module:
                'Payments',

            status:
                'Success',

            details:
                `Payment ${paymentReference} created`

        });


        return {

            success:
                true,

            paymentId:
                paymentId,

            message:
                'Payment created successfully'

        };
    });


    // =========================================================
    // UPDATE USER
    // =========================================================

    this.on('updateUser', async (req) => {

        const {
            userId,
            userName,
            fullName,
            email,
            password,
            role,
            isActive,
            performedBy
        } = req.data;


        const actor =
            await getActorDetails(
                performedBy
            );


        const user =
            await SELECT.one
                .from(Users)
                .where({
                    ID:
                        userId
                });


        if (!user) {

            return {

                success:
                    false,

                message:
                    'User not found'

            };
        }


        const updateData = {

            userName:
                userName,

            fullName:
                fullName,

            email:
                email,

            role:
                role,

            isActive:
                isActive

        };


        if (
            password !== undefined &&
            password !== null &&
            password !== ''
        ) {

            updateData.password =
                password;

        }


        await UPDATE(Users)
            .set(updateData)
            .where({

                ID:
                    userId

            });


        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Update',

            module:
                'Users',

            status:
                'Success',

            details:
                `User ${userName} updated`

        });


        return {

            success:
                true,

            message:
                'User updated successfully'

        };
    });


    // =========================================================
    // DELETE USER
    // =========================================================

    this.on('deleteUser', async (req) => {

        const {
            userId,
            performedBy
        } = req.data;


        const actor =
            await getActorDetails(
                performedBy
            );


        const user =
            await SELECT.one
                .from(Users)
                .where({

                    ID:
                        userId

                });


        if (!user) {

            return {

                success:
                    false,

                message:
                    'User not found'

            };
        }


        await DELETE
            .from(Users)
            .where({

                ID:
                    userId

            });


        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Delete',

            module:
                'Users',

            status:
                'Success',

            details:
                `User ${user.userName} deleted`

        });


        return {

            success:
                true,

            message:
                'User deleted successfully'

        };
    });


  // =========================================================
// SEND CHAT MESSAGE
// =========================================================

this.on('sendChatMessage', async (req) => {

    const {
        receiverUserName,
        message,
        performedBy
    } = req.data;


    console.log(
        "========== SEND CHAT MESSAGE =========="
    );

    console.log(
        "Sender:",
        performedBy
    );

    console.log(
        "Receiver:",
        receiverUserName
    );

    console.log(
        "Message:",
        message
    );


    // ---------------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------------

    if (!performedBy) {

        return {
            success: false,
            message: "Sender is required."
        };

    }


    if (!receiverUserName) {

        return {
            success: false,
            message: "Receiver is required."
        };

    }


    if (!message || !String(message).trim()) {

        return {
            success: false,
            message: "Message cannot be empty."
        };

    }


    if (
        String(performedBy).toLowerCase() ===
        String(receiverUserName).toLowerCase()
    ) {

        return {
            success: false,
            message: "You cannot send a message to yourself."
        };

    }


    // ---------------------------------------------------------
    // CHECK RECEIVER
    // ---------------------------------------------------------

    const receiver = await SELECT.one
        .from(Users)
        .where({
            userName: receiverUserName
        });


    if (!receiver) {

        return {
            success: false,
            message:
                `User '${receiverUserName}' does not exist.`
        };

    }


    if (!receiver.isActive) {

        return {
            success: false,
            message:
                `User '${receiverUserName}' is inactive.`
        };

    }


    // ---------------------------------------------------------
    // CREATE MESSAGE
    // ---------------------------------------------------------

    const messageId =
        cds.utils.uuid();


    await INSERT.into(Messages).entries({

        ID: messageId,

        senderUserName:
            performedBy,

        receiverUserName:
            receiverUserName,

        subject:
            "Chat",

        message:
            String(message).trim(),

        messageType:
            "CHAT",

        isRead:
            false,

        createdAt:
            new Date()

    });


    console.log(
        "CHAT MESSAGE CREATED:",
        messageId
    );


    console.log(
        `${performedBy} -> ${receiverUserName}`
    );


    // ---------------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------------

    return {

        success: true,

        message:
            "Message sent successfully."

    };

});
// =========================================================
// MARK CHAT MESSAGES AS READ
// =========================================================

this.on(
    'markChatMessagesRead',
    async (req) => {

        const {
            senderUserName,
            receiverUserName
        } = req.data;


        console.log(
            "========== MARK CHAT READ =========="
        );

        console.log(
            "Sender:",
            senderUserName
        );

        console.log(
            "Receiver:",
            receiverUserName
        );


        if (
            !senderUserName ||
            !receiverUserName
        ) {

            return {
                success: false,
                message:
                    "Sender and receiver are required."
            };

        }


        await UPDATE(Messages)
            .set({
                isRead: true
            })
            .where({
                senderUserName:
                    senderUserName,

                receiverUserName:
                    receiverUserName,

                messageType:
                    "CHAT",

                isRead:
                    false
            });


        console.log(
            "CHAT MESSAGES MARKED AS READ"
        );


        return {

            success: true,

            message:
                "Messages marked as read."

        };

    }
);

    // =========================================================
    // BULK UPLOAD PAYMENTS
    // =========================================================

    this.on('bulkUploadPayments', async (req) => {

        const {
            csvData,
            performedBy
        } = req.data;


        if (!csvData) {

            return {

                success:
                    false,

                totalRows:
                    0,

                successfulRows:
                    0,

                failedRows:
                    0,

                message:
                    'CSV data is empty',

                errors:
                    ''

            };
        }


        const actor =
            await getActorDetails(
                performedBy
            );


        const lines =
            csvData
                .trim()
                .split(/\r?\n/);


        if (lines.length < 2) {

            return {

                success:
                    false,

                totalRows:
                    0,

                successfulRows:
                    0,

                failedRows:
                    0,

                message:
                    'CSV contains no data rows',

                errors:
                    ''

            };
        }


       let headerLine = lines[0].trim();

// Remove BOM if present
headerLine = headerLine.replace(/^\uFEFF/, "");

// Remove surrounding quotes from the complete header line
if (
    headerLine.startsWith('"') &&
    headerLine.endsWith('"')
) {
    headerLine =
        headerLine.substring(
            1,
            headerLine.length - 1
        );
}

const headers =
    headerLine
        .split(',')
        .map(
            h =>
                h.trim()
                 .replace(/^"|"$/g, '')
        );


        const expectedHeaders = [

            'paymentReference',
            'companyCode',
            'debtorAccount',
            'creditorAccount',
            'amount',
            'currency',
            'paymentMethod',
            'paymentDate'

        ];


       const headersValid =
    headers.length === expectedHeaders.length &&
    expectedHeaders.every(
        (header, index) =>
            headers[index] === header
    );


if (!headersValid) {

    return {

        success: false,

        totalRows:
            lines.length - 1,

        successfulRows: 0,

        failedRows:
            lines.length - 1,

        message:
            'Invalid CSV headers',

        errors:
            `Expected: ${expectedHeaders.join(', ')}`
            + ` | Received: ${headers.join(', ')}`

    };
}
             


        let successfulRows = 0;

        let failedRows = 0;

        const errors = [];


        for (
            let i = 1;
            i < lines.length;
            i++
        ) {

            try {

                const values =
                    lines[i]
                        .split(',')
                        .map(
                            value =>
                                value.trim()
                        );


                const row = {};


                headers.forEach(
                    (
                        header,
                        index
                    ) => {

                        row[header] =
                            values[index];

                    }
                );


                if (
                    !row.paymentReference
                    ||
                    !row.companyCode
                    ||
                    !row.amount
                    ||
                    !row.currency
                ) {

                    throw new Error(
                        'Required fields missing'
                    );
                }


                const paymentId =
                    cds.utils.uuid();


                await INSERT
                    .into(Payments)
                    .entries({

                        ID:
                            paymentId,

                        paymentReference:
                            row.paymentReference,

                        companyCode:
                            row.companyCode,

                        debtorAccount:
                            row.debtorAccount,

                        creditorAccount:
                            row.creditorAccount,

                        amount:
                            Number(
                                row.amount
                            ),

                        currency:
                            row.currency,

                        paymentMethod:
                            row.paymentMethod,

                        paymentDate:
                            row.paymentDate,

                        status:
                            'PENDING_APPROVAL',

                        createdByUserName:
                            performedBy

                    });


                await writeUserLog({

                    userName:
                        actor.userName,

                    fullName:
                        actor.fullName,

                    role:
                        actor.role,

                    action:
                        'Create',

                    module:
                        'Payments',

                    status:
                        'Success',

                    details:
                        `Payment ${row.paymentReference} created through bulk upload`

                });


                successfulRows++;


            } catch (error) {

                failedRows++;


                errors.push(
                    `Row ${i + 1}: ${error.message}`
                );

            }
        }


        return {

            success:
                failedRows === 0,

            totalRows:
                lines.length - 1,

            successfulRows:
                successfulRows,

            failedRows:
                failedRows,

            message:
                `${successfulRows} payment(s) created successfully`,

            errors:
                errors.join('\n')

        };
    });


    

// =========================================================
// CREATE CHAT GROUP
// =========================================================

this.on("createChatGroup", async (req) => {

    const {
        groupName,
        description,
        performedBy
    } = req.data;

    console.log("========== CREATE CHAT GROUP ==========");
    console.log("Group:", groupName);
    console.log("Created By:", performedBy);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!groupName || !String(groupName).trim()) {

        return {
            success: false,
            groupId: null,
            message: "Group name is required."
        };

    }

    if (!performedBy) {

        return {
            success: false,
            groupId: null,
            message: "User information is missing."
        };

    }

    // -----------------------------------------------------
    // CHECK CREATOR
    // -----------------------------------------------------

    const creator =
        await SELECT.one
            .from(Users)
            .where({
                userName: performedBy,
                isActive: true
            });

    if (!creator) {

        return {
            success: false,
            groupId: null,
            message:
                "The logged-in user is inactive or does not exist."
        };

    }

    // -----------------------------------------------------
    // CREATE GROUP
    // -----------------------------------------------------

    const groupId =
        cds.utils.uuid();

    await INSERT
        .into(ChatGroups)
        .entries({

            ID: groupId,

            groupName:
                String(groupName).trim(),

            description:
                String(description || "").trim(),

            createdBy:
                performedBy,

            createdAt:
                new Date(),

            isActive:
                true

        });

    // -----------------------------------------------------
    // ADD CREATOR AS MEMBER
    // -----------------------------------------------------

    await INSERT
        .into(ChatGroupMembers)
        .entries({

            ID:
                cds.utils.uuid(),

            group_ID:
                groupId,

            userName:
                performedBy,

            joinedAt:
                new Date(),

            isActive:
                true

        });

    console.log(
        "CHAT GROUP CREATED:",
        groupId
    );

    // -----------------------------------------------------
    // RETURN RESULT
    // -----------------------------------------------------

    return {

        success: true,

        groupId: groupId,

        message:
            "Group created successfully."

    };

});

// =========================================================
// DELETE CHAT GROUP (ADMIN ONLY)
// =========================================================

this.on("deleteChatGroup", async (req) => {

    const {
        groupId,
        performedBy
    } = req.data;

    console.log("========== DELETE CHAT GROUP ==========");
    console.log("Group:", groupId);
    console.log("Performed By:", performedBy);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!groupId) {

        return {
            success: false,
            message: "Group ID is required."
        };

    }

    if (!performedBy) {

        return {
            success: false,
            message: "Logged-in user is required."
        };

    }

    // -----------------------------------------------------
    // ONLY ADMIN CAN DELETE A GROUP
    // -----------------------------------------------------

    const actor =
        await getActorDetails(performedBy);

    if (
        String(actor.role || "").toUpperCase() !==
        "ADMIN"
    ) {

        return {
            success: false,
            message:
                "Only an administrator can delete a chat group."
        };

    }

    // -----------------------------------------------------
    // CHECK GROUP
    // -----------------------------------------------------

    const group =
        await SELECT.one
            .from(ChatGroups)
            .where({
                ID: groupId
            });

    if (!group) {

        return {
            success: false,
            message: "Chat group not found."
        };

    }

    if (!group.isActive) {

        return {
            success: true,
            message: "Group is already deleted."
        };

    }

    // -----------------------------------------------------
    // SOFT-DELETE THE GROUP AND ITS MEMBERSHIPS
    //
    // Existing group messages are left untouched so anyone
    // who still has the conversation open keeps their
    // history; the group itself simply stops showing up
    // for members and can no longer be posted to (see
    // sendGroupChatMessage / addChatGroupMember, which both
    // require isActive: true).
    // -----------------------------------------------------

    await UPDATE(ChatGroups)
        .set({
            isActive: false
        })
        .where({
            ID: groupId
        });

    await UPDATE(ChatGroupMembers)
        .set({
            isActive: false
        })
        .where({
            group_ID: groupId
        });

    // -----------------------------------------------------
    // CREATE USER LOG
    // -----------------------------------------------------

    await writeUserLog({

        userName:
            actor.userName,

        fullName:
            actor.fullName,

        role:
            actor.role,

        action:
            'Delete',

        module:
            'Chat',

        status:
            'Success',

        details:
            `Chat group ${group.groupName} deleted`

    });

    console.log(
        "CHAT GROUP DELETED:",
        groupId
    );

    return {

        success: true,

        message:
            "Group deleted successfully."

    };

});

// =========================================================
// ADD USER TO CHAT GROUP
// =========================================================

this.on("addChatGroupMember", async (req) => {

    const {
        groupId,
        userName,
        performedBy
    } = req.data;

    console.log("========== ADD GROUP MEMBER ==========");
    console.log("Group:", groupId);
    console.log("User:", userName);
    console.log("Performed By:", performedBy);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!groupId) {

        return {
            success: false,
            message: "Group ID is required."
        };

    }

    if (!userName) {

        return {
            success: false,
            message: "User name is required."
        };

    }

    if (!performedBy) {

        return {
            success: false,
            message: "Logged-in user is required."
        };

    }

    // -----------------------------------------------------
    // CHECK GROUP
    // -----------------------------------------------------

    const group =
        await SELECT.one
            .from(ChatGroups)
            .where({
                ID: groupId,
                isActive: true
            });

    if (!group) {

        return {
            success: false,
            message: "Chat group not found."
        };

    }

    // -----------------------------------------------------
    // CHECK USER
    // -----------------------------------------------------

    const user =
        await SELECT.one
            .from(Users)
            .where({
                userName: userName,
                isActive: true
            });

    if (!user) {

        return {
            success: false,
            message:
                `User '${userName}' does not exist or is inactive.`
        };

    }

    // -----------------------------------------------------
    // CHECK EXISTING MEMBER
    // -----------------------------------------------------

    const existingMember =
        await SELECT.one
            .from(ChatGroupMembers)
            .where({
                group_ID: groupId,
                userName: userName
            });

    if (existingMember) {

        if (!existingMember.isActive) {

            await UPDATE(ChatGroupMembers)
                .set({
                    isActive: true,
                    joinedAt: new Date()
                })
                .where({
                    ID: existingMember.ID
                });

        }

        return {
            success: true,
            message: "User is already a group member."
        };

    }

    // -----------------------------------------------------
    // ADD MEMBER
    // -----------------------------------------------------

    await INSERT
        .into(ChatGroupMembers)
        .entries({

            ID:
                cds.utils.uuid(),

            group_ID:
                groupId,

            userName:
                userName,

            joinedAt:
                new Date(),

            isActive:
                true

        });

    console.log(
        `GROUP MEMBER ADDED: ${userName} -> ${groupId}`
    );

    return {

        success: true,

        message:
            `${userName} added to the group.`

    };

});

// =========================================================
// SEND GROUP CHAT MESSAGE
// =========================================================

this.on("sendGroupChatMessage", async (req) => {

    const {
        groupId,
        message,
        performedBy
    } = req.data;

    console.log("========== SEND GROUP MESSAGE ==========");
    console.log("Group:", groupId);
    console.log("Sender:", performedBy);

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!groupId) {

        return {
            success: false,
            message: "Group ID is required."
        };

    }

    if (!performedBy) {

        return {
            success: false,
            message: "Sender is required."
        };

    }

    if (!message || !String(message).trim()) {

        return {
            success: false,
            message: "Message cannot be empty."
        };

    }

    // -----------------------------------------------------
    // CHECK MEMBERSHIP
    // -----------------------------------------------------

    const membership =
        await SELECT.one
            .from(ChatGroupMembers)
            .where({
                group_ID: groupId,
                userName: performedBy,
                isActive: true
            });

    if (!membership) {

        return {
            success: false,
            message:
                "You are not a member of this group."
        };

    }

    // -----------------------------------------------------
    // CHECK GROUP
    // -----------------------------------------------------

    const group =
        await SELECT.one
            .from(ChatGroups)
            .where({
                ID: groupId,
                isActive: true
            });

    if (!group) {

        return {
            success: false,
            message: "Group not found."
        };

    }

    // -----------------------------------------------------
    // CREATE THE GROUP MESSAGE
    //
    // IMPORTANT: a group message is stored as a SINGLE row,
    // shared by every member of the group (like WhatsApp).
    // The previous implementation inserted one row per
    // recipient (and skipped the sender entirely), which
    // caused the same message to be duplicated once per
    // member and never appear for the person who sent it.
    //
    // receiverUserName is not meaningful for a group message
    // (there are many recipients), so it is set to the
    // sender just to satisfy the field; getGroupMessages()
    // below always looks the conversation up by groupId.
    // -----------------------------------------------------

    await INSERT
        .into(Messages)
        .entries({

            ID:
                cds.utils.uuid(),

            senderUserName:
                performedBy,

            receiverUserName:
                performedBy,

            groupId:
                groupId,

            subject:
                group.groupName,

            message:
                String(message).trim(),

            messageType:
                "GROUP_CHAT",

            isRead:
                false,

            createdAt:
                new Date()

        });

    console.log(
        "GROUP MESSAGE CREATED:",
        groupId
    );

    return {

        success: true,

        message:
            "Group message sent successfully."

    };

});

// =========================================================
// GET GROUP MESSAGES
// =========================================================

this.on("getGroupMessages", async (req) => {

    const {
        groupId,
        performedBy
    } = req.data;

    console.log("========== GET GROUP MESSAGES ==========");
    console.log("Group:", groupId);
    console.log("User:", performedBy);

    if (!groupId) {

        return {
            success: false,
            messages: "[]",
            message: "Group ID is required."
        };

    }

    if (!performedBy) {

        return {
            success: false,
            messages: "[]",
            message: "User is required."
        };

    }

    // -----------------------------------------------------
    // CHECK MEMBERSHIP
    // -----------------------------------------------------

    const membership =
        await SELECT.one
            .from(ChatGroupMembers)
            .where({
                group_ID: groupId,
                userName: performedBy,
                isActive: true
            });

    if (!membership) {

        return {
            success: false,
            messages: "[]",
            message:
                "You are not a member of this group."
        };

    }

    // -----------------------------------------------------
    // LOAD MESSAGES
    // -----------------------------------------------------

    const messages =
        await SELECT
            .from(Messages)
            .where({
                groupId: groupId,
                messageType: "GROUP_CHAT"
            })
            .orderBy({
                createdAt: "asc"
            });

    return {

        success: true,

        messages:
            JSON.stringify(messages),

        message:
            "Group messages loaded."

    };

});

});