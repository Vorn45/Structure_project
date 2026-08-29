export enum TrackingActivityEnum {
    REGISTER = 1,     // ចុះឈ្មោះ
    WAIT_FOR_REVIEW = 2, // រង់ចាំការពិនិត្យ
    REQUEST_REVIEW = 3, //ស្នើសុំត្រួតពិនិត្យ
    REVIEW = 4, // ពិនិត្យ
    CONFIRM = 5, // បញ្ជាក់
    REVISED = 6, // បានកែប្រែ
    REJECT = 7,     // បដិសេដ
}
