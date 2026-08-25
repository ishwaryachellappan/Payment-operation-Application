using PaymentService as service from '../../srv/payment-service';
annotate service.Payments with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'paymentReference',
                Value : paymentReference,
            },
            {
                $Type : 'UI.DataField',
                Label : 'companyCode',
                Value : companyCode,
            },
            {
                $Type : 'UI.DataField',
                Label : 'debtorAccount',
                Value : debtorAccount,
            },
            {
                $Type : 'UI.DataField',
                Label : 'creditorAccount',
                Value : creditorAccount,
            },
            {
                $Type : 'UI.DataField',
                Label : 'amount',
                Value : amount,
            },
            {
                $Type : 'UI.DataField',
                Label : 'currency',
                Value : currency,
            },
            {
                $Type : 'UI.DataField',
                Label : 'paymentMethod',
                Value : paymentMethod,
            },
            {
                $Type : 'UI.DataField',
                Label : 'paymentDate',
                Value : paymentDate,
            },
            {
                $Type : 'UI.DataField',
                Label : 'status',
                Value : status,
            },
            {
                $Type : 'UI.DataField',
                Label : 'rejectionReason',
                Value : rejectionReason,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'paymentReference',
            Value : paymentReference,
        },
        {
            $Type : 'UI.DataField',
            Label : 'companyCode',
            Value : companyCode,
        },
        {
            $Type : 'UI.DataField',
            Label : 'debtorAccount',
            Value : debtorAccount,
        },
        {
            $Type : 'UI.DataField',
            Label : 'creditorAccount',
            Value : creditorAccount,
        },
        {
            $Type : 'UI.DataField',
            Label : 'amount',
            Value : amount,
        },
    ],
);

