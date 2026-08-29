export interface ISuccess {
    response_code: 200;
    response_msg: string;
    invoice_no?: string;
    invoice_amt?: string;
    reference_number?: string;
}
export interface ITicketLookupSuccess {
    response_code: number;
    response_msg: string;
    reference_number: string;
    reference_inspection?: string;
    customer_name: string;
    amount: number | string;
    currency: string;
    session_id: string;
    acknowledgement_id: string;
    reversal_transaction_id: string;
    reversal_acknowledgement_id: string;
}
export interface ITicketLookupFailed {
    response_code: number;
    response_msg: string;
    reference_number: string;
    reference_inspection?: string;
    transaction_id: string;
    acknowledgement_id: string;
    reversal_transaction_id: string;
    reversal_acknowledgement_id: string;
}

//
export interface CommitPaymentSuccess {
    response_code: number;
    response_msg: string;
    reference_number: string;
    reference_inspection?: string;
    customer_name: string;
    amount: number | string;
    currency: string;
    session_id: string;
    acknowledgement_id: string;
    reversal_transaction_id: string;
    reversal_acknowledgement_id: string;
}
export interface CommitPaymentFailed {
    response_code: number;
    response_msg: string;
    reference_number: string;
    reference_inspection?: string;
    transaction_id: string;
    acknowledgement_id: string;
    reversal_transaction_id: string;
    reversal_acknowledgement_id: string;
}
export interface ConfirmPaymentSuccess {
    response_code: number;
    response_msg: string;
    reference_number: string;
    reference_inspection?: string;
    customer_name: string;
    amount: number | string;
    currency: string;
    session_id: string;
    acknowledgement_id: string;
    reversal_transaction_id: string;
    reversal_acknowledgement_id: string;
}
export interface ConfirmPaymentFailed {
    response_code: number;
    response_msg: string;
    reference_number: string;
    reference_inspection?: string;
    transaction_id: string;
    acknowledgement_id: string;
    reversal_transaction_id: string;
    reversal_acknowledgement_id: string;
}
