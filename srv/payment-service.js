const cds = require('@sap/cds');

module.exports = cds.service.impl(function () {

    const {
        Users,
        Payments
    } = this.entities;

    // =========================================================
    // LOGIN
    // =========================================================

    this.on('login', async (req) => {

        const { userName, password } = req.data;

        if (!userName || !password) {
            return {
                success: false,
                message: 'Username and password are required'
            };
        }

        const user = await SELECT.one
            .from(Users)
            .where({
                userName: userName,
                isActive: true
            });

        if (!user || user.password !== password) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        return {
            success: true,
            username: user.userName,
            fullName: user.fullName,
            role: user.role,
            message: 'Login successful'
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
            isActive
        } = req.data;

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

        const existingUser = await SELECT.one
            .from(Users)
            .where({ userName });

        if (existingUser) {
            return req.reject(
                400,
                'User ID already exists'
            );
        }

        await INSERT.into(Users).entries({
            userName,
            fullName,
            email,
            password,
            role,
            isActive: isActive !== false
        });

        return {
            success: true,
            message: 'User created successfully'
        };
    });


    // =========================================================
    // APPROVE PAYMENT
    // =========================================================

    this.on('approvePayment', async (req) => {

        const { paymentId } = req.data;

        const payment = await SELECT.one
            .from(Payments)
            .where({ ID: paymentId });

        if (!payment) {
            return req.reject(
                404,
                'Payment not found'
            );
        }

        if (payment.status !== 'PENDING_APPROVAL') {
            return req.reject(
                400,
                'Payment is not pending approval'
            );
        }

        await UPDATE(Payments)
            .set({
                status: 'APPROVED'
            })
            .where({ ID: paymentId });

        return {
            success: true,
            message: 'Payment approved successfully'
        };
    });


    // =========================================================
    // REJECT PAYMENT
    // =========================================================

    this.on('rejectPayment', async (req) => {

        const {
            paymentId,
            reason
        } = req.data;

        const payment = await SELECT.one
            .from(Payments)
            .where({ ID: paymentId });

        if (!payment) {
            return req.reject(
                404,
                'Payment not found'
            );
        }

        if (payment.status !== 'PENDING_APPROVAL') {
            return req.reject(
                400,
                'Payment is not pending approval'
            );
        }

        await UPDATE(Payments)
            .set({
                status: 'REJECTED',
                rejectionReason: reason || null
            })
            .where({ ID: paymentId });

        return {
            success: true,
            message: 'Payment rejected successfully'
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
            paymentDate
        } = req.data;

        // Mandatory field validation
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

        // Check duplicate payment reference
        const existingPayment = await SELECT.one
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

        // Create payment as PENDING_APPROVAL
        const paymentId = cds.utils.uuid();

        await INSERT.into(Payments).entries({
            ID: paymentId,
            paymentReference,
            companyCode,
            debtorAccount,
            creditorAccount,
            amount,
            currency,
            paymentMethod,
            paymentDate,
            status: 'PENDING_APPROVAL'
        });

        return {
            success: true,
            paymentId,
            message: 'Payment created successfully'
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
        isActive
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
    // Check user exists
    // -----------------------------------------------------

    const existingUser = await SELECT.one
        .from(Users)
        .where({
            ID: userId
        });

    if (!existingUser) {

        return req.reject(
            404,
            'User not found'
        );
    }

    // -----------------------------------------------------
    // Check duplicate User ID
    // -----------------------------------------------------

    const duplicateUser = await SELECT.one
        .from(Users)
        .where({
            userName: userName
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
    // Build update object
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
    // Password is optional during edit
    //
    // If empty → keep existing password
    // If entered → update password
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
            ID: userId
        });

    return {

        success: true,

        message:
            'User updated successfully'
    };
});


// =========================================================
// DELETE USER
// =========================================================

this.on('deleteUser', async (req) => {

    const {
        userId
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
    // Check user exists
    // -----------------------------------------------------

    const existingUser = await SELECT.one
        .from(Users)
        .where({
            ID: userId
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

    await DELETE.from(Users)
        .where({
            ID: userId
        });

    return {

        success: true,

        message:
            'User deleted successfully'
    };
});

    // =========================================================
// BULK UPLOAD PAYMENTS
// =========================================================

this.on('bulkUploadPayments', async (req) => {

    const { csvData } = req.data;

    if (!csvData || !csvData.trim()) {
        return req.reject(
            400,
            'CSV data is required'
        );
    }

    const lines = csvData
        .trim()
        .split(/\r?\n/)
        .filter(line => line.trim());

    if (lines.length < 2) {
        return req.reject(
            400,
            'CSV must contain a header and at least one payment'
        );
    }

    const expectedHeaders = [
    "paymentReference",
    "companyCode",
    "debtorAccount",
    "creditorAccount",
    "amount",
    "currency",
    "paymentMethod",
    "paymentDate"
];

const headers = lines[0]
    .replace(/^\uFEFF/, "")
    .split(",")
    .map(header =>
        header
            .trim()
            .replace(/^"|"$/g, "")
    );

const headersValid =
    headers.length === expectedHeaders.length &&
    headers.every(function (header, index) {
        return (
            header.toLowerCase() ===
            expectedHeaders[index].toLowerCase()
        );
    });

if (!headersValid) {

    return req.reject(
        400,
        "Invalid CSV headers. Expected: " +
        expectedHeaders.join(",")
    );
}

    


    let successfulRows = 0;
    let failedRows = 0;

    const errors = [];
    const uploadedReferences = new Set();

    for (let i = 1; i < lines.length; i++) {

        const rowNumber = i + 1;

        try {

            const values = lines[i]
                .split(',')
                .map(value =>
                    value
                        .trim()
                        .replace(/^"|"$/g, '')
                );

            if (values.length !== expectedHeaders.length) {
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
                Number.isNaN(numericAmount) ||
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
                !/^[A-Za-z]{3}$/.test(currency)
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

                    ID: cds.utils.uuid(),

                    paymentReference:
                        paymentReference,

                    companyCode:
                        companyCode,

                    debtorAccount:
                        debtorAccount,

                    creditorAccount:
                        creditorAccount,

                    amount:
                        numericAmount,

                    currency:
                        currency.toUpperCase(),

                    paymentMethod:
                        paymentMethod,

                    paymentDate:
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

    return {

        success:
            successfulRows > 0,

        totalRows:
            lines.length - 1,

        successfulRows:
            successfulRows,

        failedRows:
            failedRows,

        message:
            `${successfulRows} payment(s) uploaded successfully. ` +
            `${failedRows} payment(s) failed.`,

        errors:
            errors.join('\n')
    };
});

});