export interface Task<T> {
    run(ent: T): TaskResult;
}

export class TaskResult {
    success: boolean;
    reason: Reason;

    constructor(success = true, reason = Reason.NONE) {
        this.success = success;
        this.reason = reason;
    }
}

export enum Reason {
    NOT_IN_RANGE, COMPLETED, STUCK, NO_ENERGY, NONE, NO_VALID_TARGET, INVALID_TARGET, IN_PROGRESS
}