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

});