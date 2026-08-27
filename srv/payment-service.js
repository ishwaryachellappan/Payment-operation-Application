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
        Messages
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

});