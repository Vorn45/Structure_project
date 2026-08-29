# Create and Assign Task Activity Diagram

## Description

The create-and-assign task process creates a new task inside a project or under an existing activity. The system validates the project/activity, checks user access, resolves default task lookup values, validates assignees, saves the task and its attachments inside a transaction, creates task assignment records, ensures a task chat room exists, sends realtime updates, and returns the complete task detail.

## Activity Diagram

```mermaid
flowchart TD
    A([Start]) --> B[User submits create task form]
    B --> C[Controller receives title, project_id or activity_id, optional lookup ids, due_date, files, and assignee_ids]
    C --> D{activity_id provided?}
    D -->|Yes| E[Find activity]
    E --> F{Activity exists?}
    F -->|No| G[Return 400 Activity not found]
    F -->|Yes| H[Use activity.project_id as project_id]
    D -->|No| I[Use dto.project_id]
    H --> J[Find project with project organizations]
    I --> J
    J --> K{Project exists and is active?}
    K -->|No| L[Return 404 Project not found]
    K -->|Yes| M[Check project access]
    M --> N{User has access?}
    N -->|No| O[Return 403 Forbidden]
    N -->|Yes| P[Resolve organization_id from project organization]
    P --> Q[Resolve type, status, and priority]
    Q --> R{Lookup ids provided?}
    R -->|No| S[Use defaults: Main Task, New, Normal]
    R -->|Yes| T[Use provided lookup ids]
    S --> U[Normalize unique assignee_ids]
    T --> U
    U --> V{Assignees provided?}
    V -->|Yes| W[Validate all assignee users exist]
    W --> X{All assignees valid?}
    X -->|No| Y[Return 400 One or more assignees were not found]
    X -->|Yes| Z[Start database transaction]
    V -->|No| Z
    Z --> AA[Generate task_code from project short name]
    AA --> AB[Create Task with reporter_id as current user]
    AB --> AC[Attach uploaded files]
    AC --> AD{At least one attachment saved?}
    AD -->|Yes| AE[Set first attachment as task.file_id]
    AD -->|No| AF[Keep task.file_id null]
    AE --> AG{Assignees provided?}
    AF --> AG
    AG -->|Yes| AH[Create TaskAssignee rows with assigned_by current user]
    AG -->|No| AI[Skip assignment rows]
    AH --> AJ[Ensure task chat room]
    AI --> AJ
    AJ --> AK[Create ChatRoom if missing]
    AK --> AL[Create ChatMember for creator as OWNER]
    AL --> AM[Create ChatMember for assignees as MEMBER]
    AM --> AN[Commit transaction]
    AN --> AO[Reload task with project, activity, file, lookups, reporter, and assignees]
    AO --> AP[Emit realtime task:updated event to reporter and assignees]
    AP --> AQ([Return 201 Task created successfully])
```

## Explanation

The direct create task flow starts from `POST /api/user/task/create-task`. The request supports a project task or an activity task. If `activity_id` is provided, the system first loads the activity and uses the activity's `project_id`; otherwise it uses the `project_id` from the request.

After the project is found, the service checks whether the current user can access the project. The allowed users are super administrators, the project creator, project members, and organization administrators for the project. If the user is not allowed, task creation stops before any data is written.

Next, the system resolves the task lookup values. If the request does not include `type_id`, `status_id`, or `priority_id`, the service uses the organization's default lookup rows: `Main Task`, `New`, and `Normal`. Assignee IDs are normalized to unique numeric IDs. If assignees are provided, every assignee must exist in the user table.

The database write runs inside one transaction. The service generates a task code, creates the `task.task` row, saves uploaded attachments, optionally sets the first attachment as the task's main `file_id`, and creates one `task.task_assignee` row for each assignee. Each assignment stores the assignee user and the user who assigned them.

Before the transaction finishes, the service ensures that the task has a chat room. It creates a `chat.chat_room` with `type = task` if one does not already exist, then adds the creator as the room owner and each assignee as a room member. This means the task is ready for discussion immediately after creation.

After the transaction commits, the service reloads the full task detail, emits a realtime `task:updated` event to the reporter and assignees, and returns a success response with the created task data.

## Main Database Tables

- `task.task`: Stores the task record, including project, activity, task code, title, lookup values, reporter, due date, archive flag, and main file.
- `task.task_assignee`: Stores task assignments. It has one row per assigned user and records who assigned them.
- `task.task_attachment`: Stores task attachment links.
- `file.file`: Stores uploaded file metadata.
- `project.project`: Provides project ownership, short name, and project context for task code generation.
- `activity.activity`: Optional parent activity for the task.
- `chat.chat_room`: Stores the automatically created task chat room.
- `chat.chat_member`: Stores the creator and assignees as chat participants.

## Alternative Flows

- If `activity_id` is provided but no activity exists, the system returns `Activity not found`.
- If the project is missing or deleted, the system returns `Project not found`.
- If the current user does not have project access, the system returns a forbidden response.
- If a provided assignee ID does not match an existing user, the system rejects the request.
- If no lookup IDs are provided, the system falls back to default lookup rows for task type, status, and priority.
- If no assignees are provided, the task is still created, and the creator is still added to the task chat room as owner.

