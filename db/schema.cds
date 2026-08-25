namespace payment.operations;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity Users : cuid, managed {
    userName  : String(100) not null;
    password  : String(255) not null;
    fullName  : String(150) not null;
    email     : String(150) not null;
    role      : Role not null default 'PAYMENT_USER';
    isActive  : Boolean not null default true;
}

type Role : String enum {
    ADMIN;
    PAYMENT_USER;
}

entity Payments : cuid, managed {
    paymentReference : String(100) not null;
    companyCode      : String(10) not null;

    debtorAccount    : String(50);
    creditorAccount  : String(50);

    amount           : Decimal(15,2) not null;
    currency         : String(3) not null;

    paymentMethod    : String(30);
    paymentDate      : Date;

    status           : PaymentStatus not null default 'PENDING_APPROVAL';

    rejectionReason  : String(500);
}

type PaymentStatus : String enum {
    PENDING_APPROVAL;
    APPROVED;
    REJECTED;
}