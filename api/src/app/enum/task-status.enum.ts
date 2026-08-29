export enum TaskStatus {
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
    EXPIRED = 'expired',
    CONFIRM = 'comfirm',
    UNCONFIRM = 'uncomfirm',
    NEW = 'new',
    REQUEST_REVIEW = 'request_review',
    RE_OPEN = 're open',
    SUSPENDED = 'suspended',
}

export enum TaskStatusEnum {
    NEW = 1,
    CONFIRM = 2,
    UNCONFIRM = 3,
    IN_PROGRESS = 4,
    REQUEST_REVIEW = 5,
    RE_OPEN = 6,
    COMPLETED = 7,
    EXPIRED = 8,
    SUSPENDED = 9,
}
