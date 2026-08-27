const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {

    const {
        Users,
        Payments,
        UserLogs
    } = this.entities;


    // =========================================================
    // HELPER: WRITE USER LOG
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

        try {

            await INSERT.into(UserLogs).entries({

                ID: cds.utils.uuid(),

                userName: userName || '-',

                fullName: fullName || '-',

                role: role || '-',

                action: action,

                module: module,

                status: status,

                details: details || '-',

                createdAt: new Date()

            });

        } catch (error) {

            // Do not allow audit logging failure
            // to break the main business operation.

            console.error(
                'USER LOG ERROR:',
                error
            );
        }
    }


    // =========================================================
    // HELPER: GET ACTOR DETAILS
    // =========================================================

    async function getActorDetails(performedBy) {

        if (!performedBy) {

            return {
                userName: 'Unknown',
                fullName: 'Unknown',
                role: 'Unknown'
            };
        }


        const actor =
            await SELECT.one
                .from(Users)
                .where({
                    userName: performedBy
                });


        if (!actor) {

            return {
                userName: performedBy,
                fullName: performedBy,
                role: 'Unknown'
            };
        }


        return {

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role

        };
    }


    // =========================================================
    // LOGIN
    // =========================================================

    this.on('login', async (req) => {

        const {
            userName,
            password
        } = req.data;


        // -----------------------------------------------------
        // Missing username/password
        // -----------------------------------------------------

        if (!userName || !password) {

            await writeUserLog({

                userName:
                    userName || '-',

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
                    'Username and password are required'

            });


            return {

                success: false,

                message:
                    'Username and password are required'

            };
        }


        // -----------------------------------------------------
        // Find active user
        // -----------------------------------------------------

        const user =
            await SELECT.one
                .from(Users)
                .where({

                    userName:
                        userName,

                    isActive:
                        true

                });


        // -----------------------------------------------------
        // Invalid username/password
        // -----------------------------------------------------

        if (!user || user.password !== password) {

            await writeUserLog({

                userName:
                    userName,

                fullName:
                    user
                        ? user.fullName
                        : '-',

                role:
                    user
                        ? user.role
                        : '-',

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

                success: false,

                message:
                    'Invalid username or password'

            };
        }


        // -----------------------------------------------------
        // Successful login
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // Validate
        // -----------------------------------------------------

        if (
            !userName ||
            !fullName ||
            !email ||
            !password ||
            !role
        ) {

            return req.reject(
                400,
                'All mandatory fields are required'
            );
        }


        // -----------------------------------------------------
        // Check duplicate
        // -----------------------------------------------------

        const existingUser =
            await SELECT.one
                .from(Users)
                .where({
                    userName
                });


        if (existingUser) {

            return req.reject(
                400,
                'User ID already exists'
            );
        }


        // -----------------------------------------------------
        // Create user
        // -----------------------------------------------------

        await INSERT
            .into(Users)
            .entries({

                userName,

                fullName,

                email,

                password,

                role,

                isActive:
                    isActive !== false

            });


        // -----------------------------------------------------
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Write audit log
        // -----------------------------------------------------

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
                `User ${userName} created`

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
                    ID: paymentId
                });


        if (!payment) {

            return req.reject(
                404,
                'Payment not found'
            );
        }


        // -----------------------------------------------------
        // Check status
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
        // Approve
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
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Write audit log
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
        // Check status
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
        // Reject payment
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
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Build log details
        // -----------------------------------------------------

        let logDetails =
            `Payment ${payment.paymentReference} rejected`;


        if (reason) {

            logDetails +=
                ` - Reason: ${reason}`;

        }


        // -----------------------------------------------------
        // Write audit log
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // Mandatory validation
        // -----------------------------------------------------

        if (
            !paymentReference ||
            !companyCode ||
            !debtorAccount ||
            !creditorAccount ||
            amount === null ||
            amount === undefined ||
            !currency ||
            !paymentMethod ||
            !paymentDate
        ) {

            return req.reject(
                400,
                'All payment fields are required'
            );
        }


        // -----------------------------------------------------
        // Duplicate payment reference
        // -----------------------------------------------------

        const existingPayment =
            await SELECT.one
                .from(Payments)
                .where({

                    paymentReference

                });


        if (existingPayment) {

            return req.reject(
                400,
                'Payment reference already exists'
            );
        }


        // -----------------------------------------------------
        // Create payment
        // -----------------------------------------------------

        const paymentId =
            cds.utils.uuid();


        await INSERT
            .into(Payments)
            .entries({

                ID:
                    paymentId,

                paymentReference,

                companyCode,

                debtorAccount,

                creditorAccount,

                amount,

                currency,

                paymentMethod,

                paymentDate,

                status:
                    'PENDING_APPROVAL'

            });


        // -----------------------------------------------------
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Write audit log
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        if (
            !userId ||
            !userName ||
            !fullName ||
            !email ||
            !role
        ) {

            return req.reject(
                400,
                'All mandatory fields are required'
            );
        }


        // -----------------------------------------------------
        // Find user
        // -----------------------------------------------------

        const existingUser =
            await SELECT.one
                .from(Users)
                .where({

                    ID:
                        userId

                });


        if (!existingUser) {

            return req.reject(
                404,
                'User not found'
            );
        }


        // -----------------------------------------------------
        // Check duplicate username
        // -----------------------------------------------------

        const duplicateUser =
            await SELECT.one
                .from(Users)
                .where({

                    userName:
                        userName

                });


        if (
            duplicateUser &&
            duplicateUser.ID !== userId
        ) {

            return req.reject(
                400,
                'User ID already exists'
            );
        }


        // -----------------------------------------------------
        // Build update
        // -----------------------------------------------------

        const updateData = {

            userName,

            fullName,

            email,

            role,

            isActive:
                isActive !== false

        };


        // -----------------------------------------------------
        // Update password only when supplied
        // -----------------------------------------------------

        if (
            password &&
            password.trim()
        ) {

            updateData.password =
                password.trim();

        }


        // -----------------------------------------------------
        // Update database
        // -----------------------------------------------------

        await UPDATE(Users)
            .set(updateData)
            .where({

                ID:
                    userId

            });


        // -----------------------------------------------------
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Write audit log
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        if (!userId) {

            return req.reject(
                400,
                'User ID is required'
            );
        }


        // -----------------------------------------------------
        // Find user
        // -----------------------------------------------------

        const existingUser =
            await SELECT.one
                .from(Users)
                .where({

                    ID:
                        userId

                });


        if (!existingUser) {

            return req.reject(
                404,
                'User not found'
            );
        }


        // -----------------------------------------------------
        // Delete
        // -----------------------------------------------------

        await DELETE
            .from(Users)
            .where({

                ID:
                    userId

            });


        // -----------------------------------------------------
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Write audit log
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
                'Users',

            status:
                'Success',

            details:
                `User ${existingUser.userName} deleted`

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


        // -----------------------------------------------------
        // Validate CSV
        // -----------------------------------------------------

        if (
            !csvData ||
            !csvData.trim()
        ) {

            return req.reject(
                400,
                'CSV data is required'
            );
        }


        const lines =
            csvData
                .trim()
                .split(/\r?\n/)
                .filter(
                    line =>
                        line.trim()
                );


        if (lines.length < 2) {

            return req.reject(
                400,
                'CSV must contain a header and at least one payment'
            );
        }


        // -----------------------------------------------------
        // Expected headers
        // -----------------------------------------------------

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


        const headers =
            lines[0]

                .replace(
                    /^\uFEFF/,
                    ''
                )

                .split(',')

                .map(
                    header =>
                        header
                            .trim()
                            .replace(
                                /^"|"$/g,
                                ''
                            )
                );


        const headersValid =
            headers.length ===
                expectedHeaders.length &&

            headers.every(
                function (
                    header,
                    index
                ) {

                    return (

                        header.toLowerCase() ===
                        expectedHeaders[index]
                            .toLowerCase()

                    );

                }
            );


        if (!headersValid) {

            return req.reject(

                400,

                'Invalid CSV headers. Expected: ' +
                expectedHeaders.join(',')

            );

        }


        // -----------------------------------------------------
        // Counters
        // -----------------------------------------------------

        let successfulRows =
            0;

        let failedRows =
            0;


        const errors = [];


        const uploadedReferences =
            new Set();


        // -----------------------------------------------------
        // Process rows
        // -----------------------------------------------------

        for (
            let i = 1;
            i < lines.length;
            i++
        ) {

            const rowNumber =
                i + 1;


            try {

                const values =
                    lines[i]

                        .split(',')

                        .map(
                            value =>
                                value
                                    .trim()
                                    .replace(
                                        /^"|"$/g,
                                        ''
                                    )
                        );


                if (
                    values.length !==
                    expectedHeaders.length
                ) {

                    throw new Error(
                        'Incorrect number of columns'
                    );

                }


                const [

                    paymentReference,

                    companyCode,

                    debtorAccount,

                    creditorAccount,

                    amount,

                    currency,

                    paymentMethod,

                    paymentDate

                ] = values;


                // ---------------------------------------------
                // Mandatory fields
                // ---------------------------------------------

                if (
                    !paymentReference ||
                    !companyCode ||
                    !debtorAccount ||
                    !creditorAccount ||
                    !amount ||
                    !currency ||
                    !paymentMethod ||
                    !paymentDate
                ) {

                    throw new Error(
                        'All payment fields are required'
                    );

                }


                // ---------------------------------------------
                // Duplicate inside CSV
                // ---------------------------------------------

                if (
                    uploadedReferences.has(
                        paymentReference
                    )
                ) {

                    throw new Error(
                        'Duplicate payment reference in CSV'
                    );

                }


                uploadedReferences.add(
                    paymentReference
                );


                // ---------------------------------------------
                // Duplicate in database
                // ---------------------------------------------

                const existingPayment =
                    await SELECT.one
                        .from(Payments)
                        .where({

                            paymentReference

                        });


                if (existingPayment) {

                    throw new Error(
                        'Payment reference already exists'
                    );

                }


                // ---------------------------------------------
                // Amount validation
                // ---------------------------------------------

                const numericAmount =
                    Number(amount);


                if (
                    Number.isNaN(
                        numericAmount
                    ) ||
                    numericAmount <= 0
                ) {

                    throw new Error(
                        'Amount must be greater than zero'
                    );

                }


                // ---------------------------------------------
                // Currency validation
                // ---------------------------------------------

                if (
                    !/^[A-Za-z]{3}$/.test(
                        currency
                    )
                ) {

                    throw new Error(
                        'Currency must be a 3-letter code'
                    );

                }


                // ---------------------------------------------
                // Date validation
                // ---------------------------------------------

                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        paymentDate
                    )
                ) {

                    throw new Error(
                        'Payment date must be YYYY-MM-DD'
                    );

                }


                // ---------------------------------------------
                // Insert payment
                // ---------------------------------------------

                await INSERT
                    .into(Payments)
                    .entries({

                        ID:
                            cds.utils.uuid(),

                        paymentReference,

                        companyCode,

                        debtorAccount,

                        creditorAccount,

                        amount:
                            numericAmount,

                        currency:
                            currency.toUpperCase(),

                        paymentMethod,

                        paymentDate,

                        status:
                            'PENDING_APPROVAL'

                    });


                successfulRows++;


            } catch (error) {

                failedRows++;


                errors.push(

                    `Row ${rowNumber}: ${error.message}`

                );

            }

        }


        // -----------------------------------------------------
        // Get actor
        // -----------------------------------------------------

        const actor =
            await getActorDetails(
                performedBy
            );


        // -----------------------------------------------------
        // Write ONE audit log for the bulk operation
        // -----------------------------------------------------

        await writeUserLog({

            userName:
                actor.userName,

            fullName:
                actor.fullName,

            role:
                actor.role,

            action:
                'Bulk Upload',

            module:
                'Payments',

            status:
                successfulRows > 0
                    ? 'Success'
                    : 'Failed',

            details:
                `${successfulRows} payment(s) uploaded successfully. ` +
                `${failedRows} payment(s) failed.`

        });


        // -----------------------------------------------------
        // Return response
        // -----------------------------------------------------

        return {

            success:
                successfulRows > 0,

            totalRows:
                lines.length - 1,

            successfulRows,

            failedRows,

            message:
                `${successfulRows} payment(s) uploaded successfully. ` +
                `${failedRows} payment(s) failed.`,

            errors:
                errors.join('\n')

        };

    });

});