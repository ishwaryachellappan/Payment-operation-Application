sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"paymentsapp/test/integration/pages/PaymentsList.gen",
	"paymentsapp/test/integration/pages/PaymentsObjectPage.gen"
], function (JourneyRunner, PaymentsListGenerated, PaymentsObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('paymentsapp') + '/test/flp.html#app-preview',
        pages: {
			onThePaymentsListGenerated: PaymentsListGenerated,
			onThePaymentsObjectPageGenerated: PaymentsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

