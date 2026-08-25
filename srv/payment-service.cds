using { payment.operations as db } from '../db/schema';

@path: '/payment-service'
service PaymentService {

    @odata.draft.enabled
    entity Users as projection on db.Users;

    @odata.draft.enabled
    entity Payments as projection on db.Payments;

    action login(
        userName : String,
        password : String
    ) returns LoginResponse;

    action createUser(
        userName : String,
        fullName : String,
        email    : String,
        password : String,
        role     : db.Role,
        isActive : Boolean
    ) returns ActionResponse;

    action approvePayment(
        paymentId : UUID
    ) returns ActionResponse;

    action rejectPayment(
        paymentId : UUID,
        reason    : String
    ) returns ActionResponse;

action createPayment(
    paymentReference : String,
    companyCode      : String,
    debtorAccount    : String,
    creditorAccount  : String,
    amount           : Decimal(15,2),
    currency         : String,
    paymentMethod    : String,
    paymentDate      : Date
) returns PaymentResponse;

action updateUser(
    userId   : UUID,
    userName : String,
    fullName : String,
    email    : String,
    password : String,
    role     : db.Role,
    isActive : Boolean
) returns ActionResponse;

action deleteUser(
    userId : UUID
) returns ActionResponse;

}

type LoginResponse {
    success  : Boolean;
    username : String;
    fullName : String;
    role     : String;
    message  : String;
}

type ActionResponse {
    success : Boolean;
    message : String;
}

type PaymentResponse {
    success       : Boolean;
    paymentId     : UUID;
    message       : String;
}