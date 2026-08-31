using {payment.operations as db} from '../db/schema';

@path: '/payment-service'
service PaymentService {

    // =====================================================
    // ENTITIES
    // =====================================================

    @odata.draft.enabled
    entity Users            as projection on db.Users;

    @odata.draft.enabled
    entity Payments         as projection on db.Payments;

    entity UserLogs         as projection on db.UserLogs;

    entity Messages         as projection on db.Messages;

    entity ChatGroups       as projection on db.ChatGroups;

    entity ChatGroupMembers as projection on db.ChatGroupMembers;


    // =====================================================
    // LOGIN
    // =====================================================

    action login(userName: String,
                 password: String)                        returns LoginResponse;


    // =====================================================
    // USER MANAGEMENT
    // =====================================================

    action createUser(userName: String,
                      fullName: String,
                      email: String,
                      password: String,
                      role: db.Role,
                      isActive: Boolean,
                      performedBy: String)                returns ActionResponse;


    action updateUser(userId: UUID,
                      userName: String,
                      fullName: String,
                      email: String,
                      password: String,
                      role: db.Role,
                      isActive: Boolean,
                      performedBy: String)                returns ActionResponse;


    action deleteUser(userId: UUID,
                      performedBy: String)                returns ActionResponse;


    // =====================================================
    // PAYMENTS
    // =====================================================

    action createPayment(paymentReference: String,
                         companyCode: String,
                         debtorAccount: String,
                         creditorAccount: String,
                         amount: Decimal(15, 2),
                         currency: String,
                         paymentMethod: String,
                         paymentDate: Date,
                         performedBy: String)             returns PaymentResponse;


    // =====================================================
    // PAYMENT APPROVALS
    // =====================================================

    action approvePayment(paymentId: UUID,
                          performedBy: String)            returns ActionResponse;


    action rejectPayment(paymentId: UUID,
                         reason: String,
                         performedBy: String)             returns ActionResponse;


    // =====================================================
    // BULK APPROVAL
    // =====================================================

    action bulkApprovePayments(paymentIds: LargeString,
                               performedBy: String)       returns BulkApprovalResponse;


    // =====================================================
    // BULK UPLOAD
    // =====================================================

    action bulkUploadPayments(csvData: LargeString,
                              performedBy: String)        returns BulkUploadResponse;

    action sendChatMessage(receiverUserName: String,
                           message: LargeString,
                           performedBy: String)           returns ActionResponse;

    action markChatMessagesRead(senderUserName: String,
                                receiverUserName: String) returns ActionResponse;

    // =====================================================
    // GROUP CHAT
    // =====================================================

    action createChatGroup(groupName: String,
                           description: String,
                           performedBy: String)           returns ChatGroupResponse;


    action deleteChatGroup(groupId: UUID,
                           performedBy: String)           returns ActionResponse;


    action addChatGroupMember(groupId: UUID,
                              userName: String,
                              performedBy: String)        returns ActionResponse;


    action sendGroupChatMessage(groupId: UUID,
                                message: LargeString,
                                performedBy: String)      returns ActionResponse;


    action getGroupMessages(groupId: UUID,
                            performedBy: String)          returns GroupMessagesResponse;

}


// =========================================================
// RESPONSE TYPES
// =========================================================

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

    success   : Boolean;

    paymentId : UUID;

    message   : String;

}


type BulkUploadResponse {

    success        : Boolean;

    totalRows      : Integer;

    successfulRows : Integer;

    failedRows     : Integer;

    message        : String;

    errors         : String;

}


type BulkApprovalResponse {

    success       : Boolean;

    totalSelected : Integer;

    successful    : Integer;

    failed        : Integer;

    message       : String;

};

type ChatGroupResponse {

    success : Boolean;

    groupId : UUID;

    message : String;

};


type GroupMessagesResponse {

    success  : Boolean;

    messages : LargeString;

    message  : String;

};

